import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupSession, registerAuthRoutes, isAuthenticated } from "./auth";
import { fetchRepoTree, fetchFileContent } from "./lib/github";
import { analyzeCode } from "./lib/ai";
import { batchProcess } from "./replit_integrations/batch/utils";
import { generateGitHubPagesReport } from "./lib/github-pages";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  setupSession(app);
  registerAuthRoutes(app);

  // === REPOS ===
  app.post(api.repos.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.repos.create.input.parse(req.body);
      const urlParts = input.url.replace("https://github.com/", "").split("/");
      if (urlParts.length < 2) return res.status(400).json({ message: "Invalid GitHub URL" });
      
      const owner = urlParts[0];
      const name = urlParts[1];
      const userId = (req.session as any).userId;

      const repo = await storage.createRepository({
        userId,
        url: input.url,
        name,
        owner,
        defaultBranch: "main" 
      } as any);

      res.status(201).json(repo);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.get(api.repos.list.path, isAuthenticated, async (req, res) => {
    const userId = (req.session as any).userId;
    const repos = await storage.getRepositories(userId);
    res.json(repos);
  });

  app.get(api.repos.get.path, isAuthenticated, async (req, res) => {
    const repo = await storage.getRepository(Number(req.params.id));
    if (!repo) return res.status(404).json({ message: "Repo not found" });
    res.json(repo);
  });

  app.delete(api.repos.delete.path, isAuthenticated, async (req, res) => {
    const repo = await storage.getRepository(Number(req.params.id));
    if (!repo) return res.status(404).json({ message: "Repo not found" });
    
    if (repo.userId !== (req.session as any).userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    await storage.deleteRepository(repo.id);
    res.status(204).send();
  });

  // === SCANS ===
  app.post(api.scans.create.path, isAuthenticated, async (req, res) => {
    const repoId = Number(req.params.id);
    const repo = await storage.getRepository(repoId);
    if (!repo) return res.status(404).json({ message: "Repo not found" });

    const existingScans = await storage.getScans(repoId);
    const hasProcessing = existingScans.some(s => s.status === "processing");
    if (hasProcessing) {
      return res.status(409).json({ message: "A scan is already in progress for this repository." });
    }

    const scan = await storage.createScan({
      repoId,
      status: "processing",
      overallScore: 0,
      technicalDebtScore: 0,
      securityScore: 0,
      documentationScore: 0,
      summary: "Initializing scan..."
    });

    res.status(201).json(scan);

    (async () => {
      try {
        console.log(`Starting scan for ${repo.owner}/${repo.name}`);
        
        const tree = await fetchRepoTree(repo.owner, repo.name, repo.defaultBranch || "main");
        const filesToAnalyze = tree.slice(0, 5);

        if (filesToAnalyze.length === 0) {
          await storage.updateScanStatus(scan.id, "failed", "No relevant code files found in this repository.");
          return;
        }

        let totalDebt = 0;
        let totalSecurity = 0;
        let totalDoc = 0;
        const fileCount = filesToAnalyze.length;

        await batchProcess(filesToAnalyze, async (file) => {
            const content = await fetchFileContent(file.url);
            const analysis = await analyzeCode(content, file.path);
            
            totalDebt += analysis.technicalDebtScore;
            totalSecurity += analysis.securityScore;
            totalDoc += analysis.documentationScore;

            await storage.createFileAnalysis({
                scanId: scan.id,
                filePath: file.path,
                language: file.path.split('.').pop(),
                technicalDebtScore: analysis.technicalDebtScore,
                securityScore: analysis.securityScore,
                documentationScore: analysis.documentationScore,
                issues: analysis.issues,
                originalCode: content,
                refactoredCode: analysis.refactoredCode
            });
        }, { concurrency: 5 });

        const avgDebt = Math.round(totalDebt / fileCount);
        const avgSec = Math.round(totalSecurity / fileCount);
        const avgDoc = Math.round(totalDoc / fileCount);
        const overall = Math.round((avgDebt + avgSec + avgDoc) / 3);

        await storage.updateScanStatus(scan.id, "completed", `Analyzed ${fileCount} files successfully.`, {
            overall, technical: avgDebt, security: avgSec, doc: avgDoc
        });
        await storage.updateRepositoryLastScanned(repo.id);
        console.log(`Scan ${scan.id} completed for ${repo.owner}/${repo.name}`);
      } catch (error: any) {
        console.error("Scan failed:", error);
        await storage.updateScanStatus(scan.id, "failed", error.message || "Unknown error occurred during analysis.");
      }
    })();
  });

  app.get(api.scans.list.path, isAuthenticated, async (req, res) => {
    const scans = await storage.getScans(Number(req.params.id));
    res.json(scans);
  });

  app.get(api.scans.get.path, isAuthenticated, async (req, res) => {
    const scan = await storage.getScan(Number(req.params.id));
    if (!scan) return res.status(404).json({ message: "Scan not found" });
    
    const files = await storage.getFileAnalyses(scan.id);
    res.json({ scan, files });
  });

  app.get("/api/scans/:id/export", isAuthenticated, async (req, res) => {
    try {
      const scan = await storage.getScan(Number(req.params.id));
      if (!scan) return res.status(404).json({ message: "Scan not found" });

      const repo = await storage.getRepository(scan.repoId);
      if (!repo) return res.status(404).json({ message: "Repository not found" });

      const files = await storage.getFileAnalyses(scan.id);
      const html = generateGitHubPagesReport({ repo, scan, files });

      res.setHeader("Content-Type", "text/html");
      res.setHeader("Content-Disposition", `attachment; filename="vanguard-report-${repo.owner}-${repo.name}-scan-${scan.id}.html"`);
      res.send(html);
    } catch (error: any) {
      console.error("Export failed:", error);
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  // === STATS ===
  app.get("/api/stats", isAuthenticated, async (req, res) => {
    const userId = (req.session as any).userId;
    const repos = await storage.getRepositories(userId);
    
    let totalScans = 0;
    let completedScans = 0;
    let avgOverall = 0;
    let avgSecurity = 0;
    let avgDebt = 0;
    let totalIssues = 0;
    
    for (const repo of repos) {
      const scans = await storage.getScans(repo.id);
      totalScans += scans.length;
      const completed = scans.filter(s => s.status === "completed");
      completedScans += completed.length;
      
      for (const scan of completed) {
        avgOverall += scan.overallScore || 0;
        avgSecurity += scan.securityScore || 0;
        avgDebt += scan.technicalDebtScore || 0;
        
        const files = await storage.getFileAnalyses(scan.id);
        for (const file of files) {
          totalIssues += (file.issues as any[])?.length || 0;
        }
      }
    }
    
    if (completedScans > 0) {
      avgOverall = Math.round(avgOverall / completedScans);
      avgSecurity = Math.round(avgSecurity / completedScans);
      avgDebt = Math.round(avgDebt / completedScans);
    }
    
    res.json({
      totalRepos: repos.length,
      totalScans,
      completedScans,
      avgOverall,
      avgSecurity,
      avgDebt,
      totalIssues,
    });
  });

  return httpServer;
}

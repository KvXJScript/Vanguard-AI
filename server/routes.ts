import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, isAuthenticated, registerAuthRoutes } from "./replit_integrations/auth";
import { fetchRepoTree, fetchFileContent } from "./lib/github";
import { analyzeCode } from "./lib/ai";
import { batchProcess } from "./replit_integrations/batch/utils";
import { generateGitHubPagesReport } from "./lib/github-pages";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth Setup
  await setupAuth(app);
  registerAuthRoutes(app);

  // === REPOS ===
  app.post(api.repos.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.repos.create.input.parse(req.body);
      const urlParts = input.url.replace("https://github.com/", "").split("/");
      if (urlParts.length < 2) return res.status(400).json({ message: "Invalid GitHub URL" });
      
      const owner = urlParts[0];
      const name = urlParts[1];
      const userId = (req.user as any).claims.sub;

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
    const userId = (req.user as any).claims.sub;
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
    
    // Check ownership
    if (repo.userId !== (req.user as any).claims.sub) {
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

    // Create pending scan
    const scan = await storage.createScan({
      repoId,
      status: "processing",
      overallScore: 0,
      technicalDebtScore: 0,
      securityScore: 0,
      documentationScore: 0,
      summary: "Initializing scan..."
    });

    res.status(201).json(scan); // Respond immediately, process in background

    // Background Processing
    (async () => {
      try {
        console.log(`Starting scan for ${repo.owner}/${repo.name}`);
        
        // 1. Fetch Files
        const tree = await fetchRepoTree(repo.owner, repo.name, repo.defaultBranch || "main");
        // Limit to top 5 files for MVP/Demo to save tokens and time
        const filesToAnalyze = tree.slice(0, 5); 

        let totalDebt = 0;
        let totalSecurity = 0;
        let totalDoc = 0;
        const fileCount = filesToAnalyze.length;

        // 2. Analyze Batch
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
        }, { concurrency: 2 }); // Process 2 files at a time

        // 3. Aggregate & Finish
        if (fileCount > 0) {
            const avgDebt = Math.round(totalDebt / fileCount);
            const avgSec = Math.round(totalSecurity / fileCount);
            const avgDoc = Math.round(totalDoc / fileCount);
            const overall = Math.round((avgDebt + avgSec + avgDoc) / 3);

            await storage.updateScanStatus(scan.id, "completed", `Analyzed ${fileCount} files successfully.`, {
                overall, technical: avgDebt, security: avgSec, doc: avgDoc
            });
            await storage.updateRepositoryLastScanned(repo.id);
        } else {
             await storage.updateScanStatus(scan.id, "failed", "No relevant code files found.");
        }
      } catch (error: any) {
        console.error("Scan failed:", error);
        await storage.updateScanStatus(scan.id, "failed", error.message);
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
      res.setHeader("Content-Disposition", `attachment; filename="kvx-report-${repo.owner}-${repo.name}-scan-${scan.id}.html"`);
      res.send(html);
    } catch (error: any) {
      console.error("Export failed:", error);
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  return httpServer;
}

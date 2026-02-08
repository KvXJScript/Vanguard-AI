import { db } from "./db";
import { 
  repositories, scans, fileAnalyses,
  type Repository, type InsertRepository,
  type Scan, type InsertScan,
  type FileAnalysis, type InsertFileAnalysis
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Repos
  createRepository(repo: InsertRepository): Promise<Repository>;
  getRepository(id: number): Promise<Repository | undefined>;
  getRepositories(userId: string): Promise<Repository[]>;
  deleteRepository(id: number): Promise<void>;
  updateRepositoryLastScanned(id: number): Promise<void>;

  // Scans
  createScan(scan: InsertScan): Promise<Scan>;
  getScan(id: number): Promise<Scan | undefined>;
  getScans(repoId: number): Promise<Scan[]>;
  updateScanStatus(id: number, status: string, summary?: string, scores?: {
    overall?: number, technical?: number, security?: number, doc?: number
  }): Promise<Scan>;

  // Analyses
  createFileAnalysis(analysis: InsertFileAnalysis): Promise<FileAnalysis>;
  getFileAnalyses(scanId: number): Promise<FileAnalysis[]>;
}

export class DatabaseStorage implements IStorage {
  // === REPOS ===
  async createRepository(repo: InsertRepository): Promise<Repository> {
    const [newRepo] = await db.insert(repositories).values(repo).returning();
    return newRepo;
  }

  async getRepository(id: number): Promise<Repository | undefined> {
    const [repo] = await db.select().from(repositories).where(eq(repositories.id, id));
    return repo;
  }

  async getRepositories(userId: string): Promise<Repository[]> {
    return db.select()
      .from(repositories)
      .where(eq(repositories.userId, userId))
      .orderBy(desc(repositories.createdAt));
  }

  async deleteRepository(id: number): Promise<void> {
    await db.delete(repositories).where(eq(repositories.id, id));
  }

  async updateRepositoryLastScanned(id: number): Promise<void> {
    await db.update(repositories)
      .set({ lastScannedAt: new Date() })
      .where(eq(repositories.id, id));
  }

  // === SCANS ===
  async createScan(scan: InsertScan): Promise<Scan> {
    const [newScan] = await db.insert(scans).values(scan).returning();
    return newScan;
  }

  async getScan(id: number): Promise<Scan | undefined> {
    const [scan] = await db.select().from(scans).where(eq(scans.id, id));
    return scan;
  }

  async getScans(repoId: number): Promise<Scan[]> {
    return db.select()
      .from(scans)
      .where(eq(scans.repoId, repoId))
      .orderBy(desc(scans.createdAt));
  }

  async updateScanStatus(id: number, status: string, summary?: string, scores?: {
    overall?: number, technical?: number, security?: number, doc?: number
  }): Promise<Scan> {
    const updates: any = { status };
    if (summary) updates.summary = summary;
    if (scores) {
      if (scores.overall !== undefined) updates.overallScore = scores.overall;
      if (scores.technical !== undefined) updates.technicalDebtScore = scores.technical;
      if (scores.security !== undefined) updates.securityScore = scores.security;
      if (scores.doc !== undefined) updates.documentationScore = scores.doc;
    }
    
    const [updatedScan] = await db.update(scans)
      .set(updates)
      .where(eq(scans.id, id))
      .returning();
    return updatedScan;
  }

  // === ANALYSES ===
  async createFileAnalysis(analysis: InsertFileAnalysis): Promise<FileAnalysis> {
    const [newAnalysis] = await db.insert(fileAnalyses).values(analysis).returning();
    return newAnalysis;
  }

  async getFileAnalyses(scanId: number): Promise<FileAnalysis[]> {
    return db.select()
      .from(fileAnalyses)
      .where(eq(fileAnalyses.scanId, scanId))
      .orderBy(desc(fileAnalyses.technicalDebtScore)); // High debt first
  }
}

export const storage = new DatabaseStorage();

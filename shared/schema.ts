import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Import models from integrations
export * from "./models/auth";
export * from "./models/chat";

import { users } from "./models/auth";

// === REPOSITORIES ===
export const repositories = pgTable("repositories", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // Links to users.id from Auth (which is a string)
  url: text("url").notNull(),
  name: text("name").notNull(),
  owner: text("owner").notNull(),
  defaultBranch: text("default_branch").default("main"),
  description: text("description"),
  lastScannedAt: timestamp("last_scanned_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === SCANS ===
export const scans = pgTable("scans", {
  id: serial("id").primaryKey(),
  repoId: integer("repo_id").notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  overallScore: integer("overall_score"),
  technicalDebtScore: integer("technical_debt_score"),
  securityScore: integer("security_score"),
  documentationScore: integer("documentation_score"),
  summary: text("summary"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === FILE ANALYSES ===
export const fileAnalyses = pgTable("file_analyses", {
  id: serial("id").primaryKey(),
  scanId: integer("scan_id").notNull(),
  filePath: text("file_path").notNull(),
  language: text("language"),
  technicalDebtScore: integer("technical_debt_score"),
  securityScore: integer("security_score"),
  documentationScore: integer("documentation_score"),
  issues: jsonb("issues").$type<{
    type: "debt" | "security" | "doc";
    severity: "low" | "medium" | "high";
    line?: number;
    description: string;
    suggestion?: string;
  }[]>(),
  originalCode: text("original_code"),
  refactoredCode: text("refactored_code"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===
export const repositoriesRelations = relations(repositories, ({ one, many }) => ({
  scans: many(scans),
}));

export const scansRelations = relations(scans, ({ one, many }) => ({
  repository: one(repositories, {
    fields: [scans.repoId],
    references: [repositories.id],
  }),
  fileAnalyses: many(fileAnalyses),
}));

export const fileAnalysesRelations = relations(fileAnalyses, ({ one }) => ({
  scan: one(scans, {
    fields: [fileAnalyses.scanId],
    references: [scans.id],
  }),
}));

// === SCHEMAS ===
export const insertRepoSchema = createInsertSchema(repositories).omit({ 
  id: true, 
  userId: true, // Set by backend
  lastScannedAt: true,
  createdAt: true 
});

export const insertScanSchema = createInsertSchema(scans).omit({
  id: true,
  createdAt: true
});

export const insertFileAnalysisSchema = createInsertSchema(fileAnalyses).omit({
  id: true,
  createdAt: true
});

// === TYPES ===
export type Repository = typeof repositories.$inferSelect;
export type InsertRepository = z.infer<typeof insertRepoSchema>;

export type Scan = typeof scans.$inferSelect;
export type InsertScan = z.infer<typeof insertScanSchema>;

export type FileAnalysis = typeof fileAnalyses.$inferSelect;
export type InsertFileAnalysis = z.infer<typeof insertFileAnalysisSchema>;

// API Request Types
export const createRepoRequestSchema = z.object({
  url: z.string().url().regex(/^https:\/\/github\.com\/[\w-]+\/[\w-.]+$/, "Must be a valid GitHub repository URL"),
});

export type CreateRepoRequest = z.infer<typeof createRepoRequestSchema>;

export type CreateRepoInput = z.infer<typeof insertRepoSchema>;

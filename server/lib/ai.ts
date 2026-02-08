import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";

if (!apiKey) {
  console.warn("WARNING: GEMINI_API_KEY is not set. AI code analysis will not work. Get a free key at https://aistudio.google.com/");
}

const genAI = new GoogleGenerativeAI(apiKey);

export interface AnalysisResult {
  technicalDebtScore: number;
  securityScore: number;
  documentationScore: number;
  issues: {
    type: "debt" | "security" | "doc";
    severity: "low" | "medium" | "high";
    line?: number;
    description: string;
    suggestion?: string;
  }[];
  refactoredCode?: string;
}

export async function analyzeCode(code: string, filename: string): Promise<AnalysisResult> {
  const truncatedCode = code.slice(0, 6000);
  const prompt = `Analyze this code file ("${filename}") for technical debt, security vulnerabilities, and documentation quality. Return ONLY a JSON object (no markdown, no code fences):
{"technicalDebtScore":0-100,"securityScore":0-100,"documentationScore":0-100,"issues":[{"type":"debt"|"security"|"doc","severity":"low"|"medium"|"high","line":0,"description":"...","suggestion":"..."}]}
Keep issues to the top 5 most important. No refactoredCode field.

CODE:
${truncatedCode}`;

  try {
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured. Set it in your environment variables.");
    }
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = result.response;
    let jsonStr = response.text().trim();

    if (jsonStr.startsWith("```json")) jsonStr = jsonStr.replace(/^```json\s*/, "").replace(/```\s*$/, "");
    if (jsonStr.startsWith("```")) jsonStr = jsonStr.replace(/^```\s*/, "").replace(/```\s*$/, "");

    return JSON.parse(jsonStr) as AnalysisResult;
  } catch (error) {
    console.error(`AI Analysis failed for ${filename}:`, error);
    return {
      technicalDebtScore: 0,
      securityScore: 0,
      documentationScore: 0,
      issues: [{ type: "debt", severity: "high", description: "AI Analysis failed", suggestion: "Ensure GEMINI_API_KEY is set. Get a free key at aistudio.google.com" }]
    };
  }
}

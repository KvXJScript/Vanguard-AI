import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

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
  const prompt = `Analyze this code file ("${filename}") for technical debt, security vulnerabilities, and documentation quality. Return ONLY a JSON object (no markdown):
{"technicalDebtScore":0-100,"securityScore":0-100,"documentationScore":0-100,"issues":[{"type":"debt"|"security"|"doc","severity":"low"|"medium"|"high","line":0,"description":"...","suggestion":"..."}]}
Keep issues to the top 5 most important. No refactoredCode field.

CODE:
${truncatedCode}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
        throw new Error("Unexpected response type from AI");
    }

    let jsonStr = content.text.trim();
    // Clean up if wrapped in markdown
    if (jsonStr.startsWith("```json")) jsonStr = jsonStr.replace(/^```json/, "").replace(/```$/, "");
    if (jsonStr.startsWith("```")) jsonStr = jsonStr.replace(/^```/, "").replace(/```$/, "");

    return JSON.parse(jsonStr) as AnalysisResult;
  } catch (error) {
    console.error(`AI Analysis failed for ${filename}:`, error);
    // Return a fallback/error result so the scan doesn't crash completely
    return {
      technicalDebtScore: 0,
      securityScore: 0,
      documentationScore: 0,
      issues: [{ type: "debt", severity: "high", description: "AI Analysis failed", suggestion: "Check logs" }]
    };
  }
}

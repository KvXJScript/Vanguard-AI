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
  const prompt = `
You are an expert Senior Software Engineer and Security Auditor.
Analyze the following code file ("${filename}") for:
1. Technical Debt (complexity, code smells, bad practices)
2. Security Vulnerabilities (injection, exposed secrets, unsafe patterns)
3. Documentation Quality (comments, clarity)

Provide a JSON response with the following structure:
{
  "technicalDebtScore": 0-100 (higher is better/cleaner),
  "securityScore": 0-100 (higher is safer),
  "documentationScore": 0-100 (higher is better),
  "issues": [
    { "type": "debt"|"security"|"doc", "severity": "low"|"medium"|"high", "line": <number>, "description": "<text>", "suggestion": "<text>" }
  ],
  "refactoredCode": "<string with the full refactored code>"
}

Only return the JSON object. Do not wrap in markdown code blocks.

CODE TO ANALYZE:
${code.slice(0, 15000)} // Truncate to avoid context limits if huge
`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4096,
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

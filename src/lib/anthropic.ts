/**
 * AI doubt engine backend.
 *
 * When ANTHROPIC_API_KEY is absent, the feature is reported as unavailable so
 * the UI can show a "coming soon" state — we never fabricate an answer.
 */

export interface DoubtInput {
  question: string;
  branch?: string;
  subject?: string;
}

export type DoubtResult =
  | { available: false }
  | { available: true; answer: string; model: string };

const API_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-haiku-5-5";

export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function answerDoubt(input: DoubtInput): Promise<DoubtResult> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { available: false };

  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
  const context = [input.branch && `GATE ${input.branch.toUpperCase()}`, input.subject]
    .filter(Boolean)
    .join(" · ");

  // Tutor instructions live in the system prompt so text in the student's
  // question cannot easily override them.
  const system = [
    "You are a GATE exam tutor. Give a clear, step-by-step explanation grounded in the underlying concepts.",
    "Explain the reasoning so the student learns the method, not just the final answer. Keep it concise and well-structured.",
    "Only help with GATE-relevant academic questions; politely decline anything else.",
  ].join("\n");

  const prompt = [context ? `Context: ${context}.` : "", `Question: ${input.question}`].filter(Boolean).join("\n\n");

  const res = await fetch(API_URL, {
    signal: AbortSignal.timeout(60_000),
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic API error: ${res.status}`);
  }

  const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
  const answer = (data.content ?? [])
    .filter((b) => b.type === "text" && b.text)
    .map((b) => b.text)
    .join("\n")
    .trim();

  if (!answer) throw new Error("Empty response from Anthropic API");

  return { available: true, answer, model };
}

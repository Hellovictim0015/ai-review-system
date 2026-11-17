import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Server-side AI call. Choose the provider with AI_PROVIDER = gemini | openai | anthropic.
 * Every provider gets the same system + user prompt and returns raw text (expected to be JSON).
 */

type Prompt = { system: string; user: string };

const TIMEOUT_MS = 25_000;

export type Provider = "gemini" | "openai" | "anthropic";

export function getProvider(): Provider {
  const p = (process.env.AI_PROVIDER ?? "gemini").trim().toLowerCase();
  if (p === "gemini" || p === "openai" || p === "anthropic") return p;
  throw new Error(`Unknown AI_PROVIDER "${p}". Use gemini, openai or anthropic.`);
}

export async function generateText(prompt: Prompt): Promise<string> {
  switch (getProvider()) {
    case "gemini":
      return callGemini(prompt);
    case "openai":
      return callOpenAI(prompt);
    case "anthropic":
      return callAnthropic(prompt);
  }
}

function requireKey(name: string): string {
  const key = process.env[name];
  if (!key) throw new Error(`${name} is not set`);
  return key;
}

async function callGemini({ system, user }: Prompt): Promise<string> {
  const key = requireKey("GEMINI_API_KEY");
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
        },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    },
  );
  if (!res.ok) throw new Error(`Gemini error ${res.status}: ${await safeText(res)}`);
  const data = await res.json();
  const parts: { text?: string }[] = data?.candidates?.[0]?.content?.parts ?? [];
  return parts.map((p) => p.text ?? "").join("");
}

async function callOpenAI({ system, user }: Prompt): Promise<string> {
  const key = requireKey("OPENAI_API_KEY");
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await safeText(res)}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

let anthropicClient: Anthropic | null = null;

async function callAnthropic({ system, user }: Prompt): Promise<string> {
  anthropicClient ??= new Anthropic({
    apiKey: requireKey("ANTHROPIC_API_KEY"),
    timeout: TIMEOUT_MS,
    maxRetries: 1,
  });
  const response = await anthropicClient.beta.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-opus-5-5",
    max_tokens: 4000,
    // Short creative task: low effort keeps it fast.
    output_config: { effort: "low" },
    // If a safety classifier declines, the API retries on a fallback model automatically.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system,
    messages: [{ role: "user", content: user }],
  });
  if (response.stop_reason === "refusal") throw new Error("Anthropic declined the request");
  return response.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("");
}

async function safeText(res: Response) {
  try {
    return (await res.text()).slice(0, 300);
  } catch {
    return "";
  }
}

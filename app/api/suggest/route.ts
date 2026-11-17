import { NextResponse } from "next/server";
import { clinic } from "@/config/clinic";
import { generateText } from "@/lib/ai";
import { buildPrompt, parseReviews } from "@/lib/prompt";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { LANGUAGES, type Language, type SuggestRequest } from "@/lib/review-types";

const LANGUAGE_IDS = new Set<string>(LANGUAGES.map((l) => l.id));
const ALLOWED_TAGS = new Set(clinic.tags);

function validate(body: unknown): SuggestRequest | string {
  if (!body || typeof body !== "object") return "Invalid request body";
  const { rating, tags, language } = body as Record<string, unknown>;

  if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return "rating must be a whole number from 1 to 5";
  }
  if (typeof language !== "string" || !LANGUAGE_IDS.has(language)) {
    return "language must be one of: en, hi, hinglish";
  }
  const tagList = tags ?? [];
  if (!Array.isArray(tagList) || tagList.length > clinic.tags.length) {
    return "tags must be a list";
  }
  // Only accept tags from the clinic config — never free text into the prompt.
  if (!tagList.every((t) => typeof t === "string" && ALLOWED_TAGS.has(t))) {
    return "Unknown tag";
  }

  return { rating, tags: [...new Set(tagList as string[])], language: language as Language };
}

export async function POST(request: Request) {
  const limit = rateLimit(clientIp(request.headers));
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 4096) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const input = validate(body);
  if (typeof input === "string") {
    return NextResponse.json({ error: input }, { status: 400 });
  }

  const prompt = buildPrompt({ clinic, ...input });

  // One retry if the model returns something we can't parse.
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const raw = await generateText(prompt);
      const reviews = parseReviews(raw);
      return NextResponse.json(
        { reviews },
        { headers: { "Cache-Control": "no-store" } },
      );
    } catch (err) {
      console.error(`[api/suggest] attempt ${attempt} failed:`, (err as Error).message);
    }
  }

  return NextResponse.json(
    { error: "Couldn't create suggestions right now. Please try again." },
    { status: 502 },
  );
}

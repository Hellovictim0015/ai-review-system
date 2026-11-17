import { NextResponse } from "next/server";
import { groupFor, pickReviews } from "@/lib/review-pack";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { LANGUAGES, TAGS, type Language, type SuggestRequest, type TagId } from "@/lib/review-types";
import { getUsedStore, type UsedMap } from "@/lib/used-store";

const LANGUAGE_IDS = new Set<string>(LANGUAGES.map((l) => l.id));
const TAG_IDS = new Set<string>(TAGS.map((t) => t.id));

function validate(body: unknown): SuggestRequest | string {
  if (!body || typeof body !== "object") return "Invalid request body";
  const { rating, tags, language, exclude } = body as Record<string, unknown>;

  if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return "rating must be a whole number from 1 to 5";
  }
  if (typeof language !== "string" || !LANGUAGE_IDS.has(language)) {
    return "language must be one of: en, hi, hinglish";
  }
  const tagList = tags ?? [];
  if (!Array.isArray(tagList) || tagList.length > TAGS.length) return "tags must be a list";
  if (!tagList.every((t) => typeof t === "string" && TAG_IDS.has(t))) return "Unknown tag";

  const excludeList = exclude ?? [];
  if (
    !Array.isArray(excludeList) ||
    excludeList.length > 200 ||
    !excludeList.every((x) => typeof x === "string" && x.length <= 40)
  ) {
    return "exclude must be a list of ids";
  }

  return {
    rating,
    tags: [...new Set(tagList as TagId[])],
    language: language as Language,
    exclude: excludeList as string[],
  };
}

export async function POST(request: Request) {
  const limit = rateLimit(clientIp(request.headers));
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  if (Number(request.headers.get("content-length") ?? 0) > 8192) {
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

  let used: UsedMap = new Map();
  try {
    used = await getUsedStore().getUsed(groupFor(input.language, input.rating));
  } catch (err) {
    // Storage hiccup: still show suggestions rather than failing the patient.
    console.error("[api/suggest] could not read used reviews:", (err as Error).message);
  }

  const reviews = pickReviews({
    language: input.language,
    rating: input.rating,
    tags: input.tags,
    exclude: new Set(input.exclude),
    used,
  });

  if (reviews.length === 0) {
    return NextResponse.json({ error: "No suggestions available" }, { status: 500 });
  }
  return NextResponse.json({ reviews }, { headers: { "Cache-Control": "no-store" } });
}

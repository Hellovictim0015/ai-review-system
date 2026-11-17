import { NextResponse } from "next/server";
import { findReview } from "@/lib/review-pack";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getUsedStore } from "@/lib/used-store";

/**
 * Called when a patient taps "Copy & Post on Google".
 * Locks that review for NO_REPEAT_DAYS so no other patient gets it.
 */
export async function POST(request: Request) {
  const limit = rateLimit(`used:${clientIp(request.headers)}`);
  if (!limit.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  let id: unknown;
  try {
    ({ id } = (await request.json()) as { id?: unknown });
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const review = typeof id === "string" ? findReview(id) : undefined;
  if (!review) return NextResponse.json({ error: "Unknown review" }, { status: 400 });

  try {
    await getUsedStore().markUsed(review.group, review.id);
  } catch (err) {
    console.error("[api/used] could not save:", (err as Error).message);
    return NextResponse.json({ error: "Could not save" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}

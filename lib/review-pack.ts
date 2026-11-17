import "server-only";
import { clinic } from "@/config/clinic";
import { en } from "@/data/reviews/en";
import { hi } from "@/data/reviews/hi";
import { hinglish } from "@/data/reviews/hinglish";
import type { ReviewPack } from "@/data/reviews/types";
import type { Language, Suggestion, TagId } from "./review-types";
import type { UsedMap } from "./used-store";

type Bucket = keyof ReviewPack;
type Entry = { id: string; tag: TagId | ""; text: string; group: string };

const PACKS: Record<Language, ReviewPack> = { en, hi, hinglish };
const BUCKETS: Bucket[] = [5, 4, 3, "low"];

export function bucketFor(rating: number): Bucket {
  return rating >= 5 ? 5 : rating === 4 ? 4 : rating === 3 ? 3 : "low";
}

/** Stable short id from the review text, so editing other reviews never changes it. */
function hashId(s: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

// Build the index once.
const BY_GROUP = new Map<string, Entry[]>();
const BY_ID = new Map<string, Entry>();
for (const lang of Object.keys(PACKS) as Language[]) {
  for (const bucket of BUCKETS) {
    const group = `${lang}:${bucket}`;
    const entries = PACKS[lang][bucket].map(([tag, text]) => {
      const entry: Entry = { id: `${lang}-${bucket}-${hashId(text)}`, tag, text, group };
      BY_ID.set(entry.id, entry);
      return entry;
    });
    BY_GROUP.set(group, entries);
  }
}

export function groupFor(language: Language, rating: number) {
  return `${language}:${bucketFor(rating)}`;
}

export function findReview(id: string) {
  return BY_ID.get(id);
}

/** Total number of ready-made reviews (for logging / README). */
export const REVIEW_COUNT = BY_ID.size;

function shuffle<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Pick `count` reviews for this rating + language:
 * - never one posted by anyone in the last 30 days (unless the whole group is used up,
 *   then the ones posted longest ago are reused first),
 * - not ones this patient has already seen (for "Regenerate"),
 * - preferring reviews that match the chosen tags.
 */
export function pickReviews(opts: {
  language: Language;
  rating: number;
  tags: TagId[];
  exclude: Set<string>;
  used: UsedMap;
  count?: number;
}): Suggestion[] {
  const { language, rating, tags, exclude, used, count = 3 } = opts;
  const all = BY_GROUP.get(groupFor(language, rating)) ?? [];

  let pool = all.filter((e) => !used.has(e.id) && !exclude.has(e.id));
  if (pool.length < count) {
    // Not enough fresh ones: allow ones this patient saw before (still not recently posted)…
    pool = all.filter((e) => !used.has(e.id));
  }
  if (pool.length < count) {
    // …and if the group is fully used, reuse the ones posted longest ago.
    const oldest = all
      .filter((e) => used.has(e.id) && !pool.includes(e))
      .sort((a, b) => used.get(a.id)! - used.get(b.id)!);
    pool = [...pool, ...oldest.slice(0, count - pool.length)];
  }

  const chosen: Entry[] = [];
  // Up to 2 tag-matching reviews, each for a different tag where possible.
  const wanted = shuffle([...tags]);
  for (const tag of wanted) {
    if (chosen.length >= Math.min(2, count - 1)) break;
    const match = shuffle(pool.filter((e) => e.tag === tag && !chosen.includes(e)))[0];
    if (match) chosen.push(match);
  }
  // Fill the rest: general reviews first, then anything left.
  const rest = pool.filter((e) => !chosen.includes(e));
  const general = shuffle(rest.filter((e) => e.tag === "" || tags.includes(e.tag as TagId)));
  const other = shuffle(rest.filter((e) => !general.includes(e)));
  chosen.push(...[...general, ...other].slice(0, count - chosen.length));

  const name = clinic.doctorDisplay[language];
  return shuffle(chosen).map((e) => ({ id: e.id, text: e.text.replaceAll("{doctor}", name) }));
}

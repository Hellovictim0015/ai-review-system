import type { TagId } from "@/lib/review-types";

/**
 * One ready-made review: [tag it talks about, or "" for general, text].
 * Write `{doctor}` where the doctor's name should go — it is filled from config/clinic.ts.
 */
export type ReviewEntry = readonly [TagId | "", string];

/** Reviews grouped by star rating. "low" is used for 1 and 2 stars. */
export type ReviewPack = {
  5: readonly ReviewEntry[];
  4: readonly ReviewEntry[];
  3: readonly ReviewEntry[];
  low: readonly ReviewEntry[];
};

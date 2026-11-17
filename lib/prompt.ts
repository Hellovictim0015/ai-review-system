import "server-only";
import type { Clinic } from "@/config/clinic";
import type { Language } from "./review-types";

const LANGUAGE_RULES: Record<Language, string> = {
  en: "Write in simple, natural English.",
  hi: "Write in natural, everyday Hindi using Devanagari script only (no Roman letters, except the doctor's name may stay as is).",
  hinglish:
    "Write in Hinglish: conversational Hindi mixed with common English words, written ONLY in Roman (English) letters — never Devanagari.",
};

export function buildPrompt(opts: {
  clinic: Clinic;
  rating: number;
  tags: string[];
  language: Language;
}) {
  const { clinic, rating, tags, language } = opts;
  const doctor = `Dr. ${clinic.doctorName}`;

  const tone =
    rating >= 5
      ? "The patient was very happy. Warm and positive, but believable — not over the top."
      : rating === 4
        ? "The patient was happy. Positive and genuine, maybe one small, mild note of room to improve in one of the three."
        : rating === 3
          ? "The patient had an average, mixed experience. Be honest and balanced: mention something that was fine and something that could be better. Do NOT make it glowing."
          : rating === 2
            ? "The patient was mostly unhappy. Be honest, calm and constructive: mention what fell short (e.g. waiting, communication, process), and at most one small positive. Not glowing, not abusive."
            : "The patient was unhappy. Be honest, calm and constructive about what fell short (e.g. waiting, communication, process). Polite, not abusive, not glowing.";

  const system = `You write short Google review suggestions for patients of a doctor's clinic in India. The patient will pick one, may edit it, and post it themselves.

Rules for every review:
- 2 to 3 sentences, sounding like a real patient wrote it: natural, simple, human. No marketing language.
- Mention "${doctor}" naturally (not necessarily at the start).
- The three reviews must differ in tone, structure and opening words.
- Never claim medical outcomes or results (e.g. "cured", "100% fixed", "completely healed", "guaranteed").
- Never mention any disease, symptom, health condition, test, report, treatment or medicine name.
- No emojis, no hashtags, no star counts, no quotation marks around the review.
- Do not invent specific facts like prices, dates or staff names.
- ${LANGUAGE_RULES[language]}

Respond with ONLY valid JSON in exactly this shape, with no extra text or code fences:
{"reviews": ["review 1", "review 2", "review 3"]}`;

  const tagLine = tags.length
    ? `Things the patient highlighted (weave in one or two naturally, don't list them all): ${tags.join(", ")}.`
    : "The patient did not pick specific highlights; keep it general about the visit.";

  const user = `Clinic: ${clinic.clinicName}, ${clinic.city}. Doctor: ${doctor} (${clinic.specialty}).
Star rating given: ${rating} out of 5.
Tone: ${tone}
${tagLine}
Variation seed: ${Math.random().toString(36).slice(2, 8)} (use it to vary wording from earlier attempts).

Write 3 different review suggestions now.`;

  return { system, user };
}

/** Pull {"reviews": [...]} out of a model response, tolerating code fences and stray text. */
export function parseReviews(raw: string): string[] {
  let text = raw.trim();
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end <= start) throw new Error("No JSON object in model response");
    parsed = JSON.parse(text.slice(start, end + 1));
  }

  const list = (parsed as { reviews?: unknown })?.reviews;
  if (!Array.isArray(list)) throw new Error("Model response missing reviews array");

  const reviews = list
    .filter((r): r is string => typeof r === "string")
    .map((r) => stripEmoji(r).replace(/^["“]|["”]$/g, "").replace(/\s+/g, " ").trim())
    .filter((r) => r.length >= 20 && r.length <= 600)
    .slice(0, 3);

  if (reviews.length === 0) throw new Error("Model returned no usable reviews");
  return reviews;
}

function stripEmoji(s: string) {
  return s.replace(/[\p{Extended_Pictographic}️‍]/gu, "");
}

export const LANGUAGES = [
  { id: "en", label: "English" },
  { id: "hi", label: "हिंदी" },
  { id: "hinglish", label: "Hinglish" },
] as const;

export type Language = (typeof LANGUAGES)[number]["id"];

/** "What did you like?" chips. Ids are used to match ready-made reviews in data/reviews. */
export const TAGS = [
  { id: "listen", label: "Doctor listened carefully" },
  { id: "explain", label: "Clear explanation" },
  { id: "staff", label: "Caring staff" },
  { id: "equipment", label: "Modern equipment" },
  { id: "wait", label: "Short waiting time" },
  { id: "clean", label: "Clean clinic" },
  { id: "appointment", label: "Easy appointment" },
] as const;

export type TagId = (typeof TAGS)[number]["id"];

export type Suggestion = { id: string; text: string };

export type SuggestRequest = {
  rating: number;
  tags: TagId[];
  language: Language;
  /** Review ids already shown to this patient (so "Regenerate" gives new ones). */
  exclude: string[];
};

export type SuggestResponse = { reviews: Suggestion[] } | { error: string };

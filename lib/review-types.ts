export const LANGUAGES = [
  { id: "en", label: "English" },
  { id: "hi", label: "हिंदी" },
  { id: "hinglish", label: "Hinglish" },
] as const;

export type Language = (typeof LANGUAGES)[number]["id"];

export type SuggestRequest = {
  rating: number;
  tags: string[];
  language: Language;
};

export type SuggestResponse = { reviews: string[] } | { error: string };

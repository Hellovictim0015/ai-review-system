/**
 * Clinic details shown on the page and used in the AI prompt.
 * Source: https://www.drshashiphysio.com/
 *
 * Safe to import from client components: nothing secret belongs here.
 */
export const clinic = {
  /** Doctor's name without the "Dr." prefix. */
  doctorName: "Shashi Pareta",
  /** Short form used in headings, e.g. "How was your visit with Dr. Shashi?" */
  doctorShortName: "Shashi",
  /** How the doctor is named inside the ready-made reviews, per language. */
  doctorDisplay: {
    en: "Dr. Shashi",
    hi: "डॉ. शशि",
    hinglish: "Dr. Shashi",
  },
  specialty: "Senior Physiotherapist",
  clinicName: "Dr. Shashi's Physiotherapy & Clinical Fitness",
  city: "Nipania, Indore",

  /** Link that opens the "Write a review" box on Google (from Business Profile → Get more reviews). */
  googleReviewUrl: "https://g.page/r/CSi4SaJqrup6EBE/review",

  /** Logo inside /public, shown at the top of the page. Set to null to hide. */
  logo: "/logo.png" as string | null,
  logoWidth: 300,
  logoHeight: 93,

  /** Main brand colour (buttons, highlights). */
  accentColor: "#2563EB",
  /** Darker shade of the accent, used for text on light-blue backgrounds. */
  accentDarkColor: "#1E3A8A",

  // "What did you like?" chips live in lib/review-types.ts (TAGS), and the
  // ready-made reviews in data/reviews/*.ts are written against those tag ids.
};

export type Clinic = typeof clinic;

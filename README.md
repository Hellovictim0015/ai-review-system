# Review Suggestion — clinic Google review helper

Patients rate their visit, pick a ready-made review suggestion, and paste it on Google.
Every rating (1–5) can be posted: there is no review gating.

No AI API is used. Suggestions come from a built-in pack of 360 reviews
(120 each in English, हिंदी and Hinglish), split by star rating and tags.
A review that a patient copies is locked for 30 days, so no two patients post
the same text within that time.

## Customise

- **Clinic details** — `config/clinic.ts` (doctor name, how the name appears in reviews,
  clinic, city, Google review link, logo, colours).
- **Review pack** — `data/reviews/en.ts`, `hi.ts`, `hinglish.ts`. Each entry is
  `["tagId" or "", "text with {doctor}"]`, grouped by rating (5, 4, 3, low = 1–2 stars).
  Add or edit lines freely; `{doctor}` is replaced automatically.
- **Tags** ("What did you like?") — `lib/review-types.ts` (`TAGS`).

## How the 30-day rule works

1. `/api/suggest` picks 3 reviews for the rating + language, skipping any review copied
   by anyone in the last 30 days and any the patient already saw (for "Regenerate").
   Reviews matching the chosen tags are preferred.
2. When a patient taps **Copy & Post on Google**, `/api/used` locks that review for 30 days.
3. If every review in a group is locked, the ones locked longest ago are reused first.

The lock list is stored in **Upstash Redis** when `UPSTASH_REDIS_REST_URL` /
`UPSTASH_REDIS_REST_TOKEN` are set (needed on Vercel). Without them, `npm run dev`
saves it to `.data/used-reviews.json`.

## Run locally

1. `npm install`
2. (Optional) copy `.env.local.example` to `.env.local` and add the Upstash values.
3. `npm run dev`, then open http://localhost:3000

## Deploy on Vercel

1. Import this GitHub repo on vercel.com (**Add New → Project**).
2. In the project, **Storage → Create → Upstash Redis** (free plan) and connect it —
   this adds the Redis env variables automatically. Redeploy.
3. Open `your-site.vercel.app/qr`, download the QR code and print it for the reception.

## Layout

| Path | What it is |
| --- | --- |
| `app/page.tsx` | Page layout (intro, review card, footer) |
| `components/ReviewCard.tsx` | Rating → tags/language → loading → results/error flow |
| `app/api/suggest/route.ts` | Picks 3 suggestions (validation, rate limit, 30-day filter) |
| `app/api/used/route.ts` | Locks a copied review for 30 days |
| `lib/review-pack.ts` | Selection logic over the review pack |
| `lib/used-store.ts` | Redis / file storage for the 30-day list |
| `data/reviews/` | The ready-made reviews |
| `app/qr/page.tsx` | QR code download page |
| `design/` | Reference mockups only — not imported or deployed |

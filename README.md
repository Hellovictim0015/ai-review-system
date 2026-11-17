# AI Review Suggestion — clinic review helper

Patients rate their visit, pick an AI-written review suggestion, and paste it on Google.
Every rating (1–5) can be posted: there is no review gating.

## Customise

- **Clinic details** — `config/clinic.ts` (doctor name, specialty, clinic, city, Google review link, logo, accent colour, tags).
- **Google review link** — `https://search.google.com/local/writereview?placeid=YOUR_PLACE_ID`
  (find the Place ID with Google's [Place ID Finder](https://developers.google.com/maps/documentation/places/web-service/place-id)).
- **Logo** — put the file in `public/` and set `logo: "/logo.png"`.

## Run locally

1. `npm install`
2. Copy `.env.local.example` to `.env.local`, set `AI_PROVIDER` and that provider's API key.
3. `npm run dev`, then open http://localhost:3000

## Deploy on Vercel

1. Push this folder to a GitHub repo (`.env.local` is git-ignored — keys never get committed).
2. On vercel.com: **Add New → Project**, import the repo (framework: Next.js, no other settings needed).
3. Under **Settings → Environment Variables** add `AI_PROVIDER` plus the matching key
   (`GEMINI_API_KEY`, `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`), then deploy.
4. Put the deployed URL in a QR code at the clinic reception.

## Layout

| Path | What it is |
| --- | --- |
| `app/page.tsx` | Page layout (header, intro, review card, footer) |
| `components/ReviewCard.tsx` | Rating → tags/language → loading → results/error flow |
| `app/api/suggest/route.ts` | POST endpoint: validation, rate limit, AI call |
| `lib/ai.ts` | Gemini / OpenAI / Anthropic provider switch |
| `lib/prompt.ts` | Prompt rules and safe JSON parsing |
| `design/` | Reference mockups only — not imported or deployed |

Note: the rate limiter is in-memory (10 requests / 10 min per IP by default). On Vercel each
server instance counts separately; use Upstash Redis if you need a strict global limit.

"use client";

import { useEffect, useRef, useState } from "react";
import { clinic } from "@/config/clinic";
import {
  LANGUAGES,
  TAGS,
  type Language,
  type Suggestion,
  type SuggestResponse,
  type TagId,
} from "@/lib/review-types";
import {
  CheckIcon,
  CopyIcon,
  RefreshIcon,
  SparkleIcon,
  StarIcon,
  WarningIcon,
} from "./icons";

type Screen = "rate" | "loading" | "results" | "error";

const RATING_LABELS = ["Tap a star to rate", "Poor", "Fair", "Good", "Very good", "Excellent!"];

const CARD =
  "rounded-3xl border border-line bg-white shadow-card";

export function ReviewCard() {
  const [screen, setScreen] = useState<Screen>("rate");
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<TagId[]>([]);
  const [language, setLanguage] = useState<Language>("en");
  const [reviews, setReviews] = useState<Suggestion[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedIndex, setCopiedIndex] = useState(-1);
  const [toast, setToast] = useState<{ text: string; fallbackLink: boolean } | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  /** Review ids already shown to this patient, so "Regenerate" gives fresh ones. */
  const seenRef = useRef<string[]>([]);

  useEffect(
    () => () => {
      abortRef.current?.abort();
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  function toggleTag(tag: TagId) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  function scrollCardIntoView() {
    // On phones the card sits below the intro text — keep the new state in view.
    requestAnimationFrame(() => {
      const el = topRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      if (top < 0 || top > window.innerHeight * 0.6) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  async function generate() {
    if (rating < 1) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setScreen("loading");
    setCopiedIndex(-1);
    setToast(null);
    scrollCardIntoView();

    try {
      // Keep the loading state visible briefly so the switch doesn't flash.
      const minDelay = new Promise((r) => setTimeout(r, 700));
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, tags, language, exclude: seenRef.current.slice(-150) }),
        signal: controller.signal,
      });
      const data = (await res.json().catch(() => null)) as SuggestResponse | null;
      await minDelay;
      if (controller.signal.aborted) return;

      if (!res.ok || !data || !("reviews" in data) || data.reviews.length === 0) {
        setErrorMessage(
          res.status === 429
            ? "Too many requests right now. Please wait a minute and try again."
            : "Please check your internet connection and try again.",
        );
        setScreen("error");
        return;
      }
      seenRef.current.push(...data.reviews.map((r) => r.id));
      setReviews(data.reviews);
      setScreen("results");
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setErrorMessage("Please check your internet connection and try again.");
      setScreen("error");
    }
  }

  function backToRate() {
    abortRef.current?.abort();
    setScreen("rate");
    setCopiedIndex(-1);
    setToast(null);
  }

  function showToast(text: string, fallbackLink = false) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ text, fallbackLink });
    toastTimer.current = setTimeout(() => setToast(null), fallbackLink ? 8000 : 3200);
  }

  async function copyAndPost(index: number, review: Suggestion) {
    const copied = await copyText(review.text);
    setCopiedIndex(index);

    // Lock this review for 30 days so no other patient gets the same text.
    fetch("/api/used", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: review.id }),
      keepalive: true,
    }).catch(() => {});

    // No "noopener" feature string here: with it, window.open() always returns
    // null and we couldn't tell when a popup blocker stopped the new tab.
    const win = window.open(clinic.googleReviewUrl, "_blank");
    if (win) win.opener = null;
    // If the tab was blocked, the toast shows a manual "Open Google reviews" link.
    showToast(
      copied ? "Review copied! Just paste it on Google" : "Couldn't copy automatically — select the text and copy it",
      !win,
    );
  }

  const showTags = rating > 0;

  return (
    <div ref={topRef} className="flex scroll-mt-4 flex-col gap-4">
      {screen === "rate" && (
        <div className={`${CARD} flex flex-col gap-[22px] px-[22px] py-[26px] max-[380px]:px-4`}>
          <div className="flex flex-col items-center gap-1.5 text-center">
            <h2 id="rate-heading" className="text-xl font-extrabold">
              How was your visit?
            </h2>
            <div role="group" aria-labelledby="rate-heading" className="mt-2 flex gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => {
                const on = n <= rating;
                return (
                  <button
                    key={n}
                    type="button"
                    aria-label={`${n} star${n > 1 ? "s" : ""} – ${RATING_LABELS[n]}`}
                    aria-pressed={rating === n}
                    onClick={() => setRating(n)}
                    className={`flex size-14 cursor-pointer items-center justify-center rounded-xl transition-transform duration-200 focus-visible:outline-2 focus-visible:outline-accent max-[380px]:size-12 ${
                      on && n === rating ? "scale-112" : "scale-100"
                    }`}
                  >
                    <StarIcon
                      size={42}
                      className="max-[380px]:size-9"
                      fill={on ? "#F5A623" : "none"}
                      stroke={on ? "#F5A623" : "#AFC0D8"}
                    />
                  </button>
                );
              })}
            </div>
            <p aria-live="polite" className="min-h-5 text-sm font-bold text-muted">
              {RATING_LABELS[rating]}
            </p>
          </div>

          {showTags ? (
            <div className="flex flex-col gap-5 border-t border-line-soft pt-5">
              <fieldset className="flex flex-col gap-2.5">
                <legend className="mb-2.5 text-[15px] font-bold">
                  What did you like?{" "}
                  <span className="text-[13px] font-medium text-muted">(optional)</span>
                </legend>
                <div className="flex flex-wrap gap-2">
                  {TAGS.map((tag) => {
                    const on = tags.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleTag(tag.id)}
                        className={`flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] px-3.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                          on
                            ? "border-accent bg-accent-soft font-bold text-accent-dark"
                            : "border-chip-line bg-[#F7FAFF] font-semibold text-slate-ink hover:border-accent/50"
                        }`}
                      >
                        {on && <CheckIcon size={16} />}
                        {tag.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset className="flex flex-col gap-2.5">
                <legend className="mb-2.5 text-[15px] font-bold">Review language</legend>
                <div className="grid grid-cols-3 gap-1 rounded-[14px] bg-[#EAF1FC] p-1">
                  {LANGUAGES.map((lg) => {
                    const on = language === lg.id;
                    return (
                      <button
                        key={lg.id}
                        type="button"
                        aria-pressed={on}
                        lang={lg.id === "hi" ? "hi" : "en"}
                        onClick={() => setLanguage(lg.id)}
                        className={`min-h-11 cursor-pointer rounded-[11px] text-sm transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
                          on
                            ? "bg-white font-extrabold text-accent-dark shadow-[0_1px_3px_rgba(15,27,51,0.12)]"
                            : "bg-transparent font-semibold text-[#44526A] hover:bg-white/60"
                        }`}
                      >
                        {lg.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <button
                type="button"
                onClick={generate}
                className="flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-accent text-base font-extrabold text-white shadow-cta transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:brightness-95"
              >
                <SparkleIcon size={20} />
                Suggest Review
              </button>
            </div>
          ) : (
            <p className="rounded-[14px] bg-[#F5F9FF] px-3.5 py-3 text-center text-[13.5px] leading-normal text-muted">
              Tap a star and we&apos;ll suggest a few reviews you can copy and post on Google.
            </p>
          )}
        </div>
      )}

      {screen === "loading" && (
        <div className="flex flex-col gap-3" aria-busy="true">
          <div
            role="status"
            className={`${CARD} flex flex-col items-center gap-2 px-[22px] py-[26px] text-center`}
          >
            <div className="flex size-[58px] items-center justify-center rounded-[18px] bg-accent-soft text-accent">
              <SparkleIcon size={28} className="animate-[spin_3s_linear_infinite]" />
            </div>
            <p className="text-lg font-extrabold">Picking review ideas for you…</p>
            <p className="text-[13.5px] text-muted">This takes just a few seconds</p>
          </div>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              aria-hidden
              className="flex animate-pulse flex-col gap-2.5 rounded-[20px] border border-line bg-white p-[18px]"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <div className="h-3 w-[92%] rounded-md bg-[#E1EAF7]" />
              <div className="h-3 w-full rounded-md bg-[#E1EAF7]" />
              <div className="h-3 w-[64%] rounded-md bg-[#E1EAF7]" />
              <div className="mt-1 h-[46px] w-full rounded-[14px] bg-[#EAF1FC]" />
            </div>
          ))}
        </div>
      )}

      {screen === "results" && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1 px-1">
            <h2 className="text-[21px] font-extrabold">Pick a review you like</h2>
            <p className="text-[13.5px] leading-normal text-muted">
              Based on your {rating}-star rating. Tap once to copy, then just paste it on
              Google. You can edit it there.
            </p>
          </div>

          {reviews.map((review, i) => {
            const copied = copiedIndex === i;
            return (
              <article
                key={review.id}
                aria-label={`Suggestion ${i + 1}`}
                className="flex flex-col gap-3 rounded-[20px] border border-line bg-white p-[18px] shadow-card-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-extrabold tracking-[0.5px] text-accent-dark">
                    SUGGESTION {i + 1}
                  </p>
                  <p className="flex items-center gap-[5px] rounded-full border border-line px-[9px] py-[3px] text-xs font-bold text-slate-ink">
                    <StarIcon size={12} />
                    Google Review
                  </p>
                </div>
                <p
                  lang={language === "hi" ? "hi" : "en"}
                  className="text-[15px] leading-relaxed text-ink select-text"
                >
                  {review.text}
                </p>
                <button
                  type="button"
                  onClick={() => copyAndPost(i, review)}
                  className={`flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-[14px] text-[15px] font-extrabold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                    copied
                      ? "border-[1.5px] border-[#9AD3B0] bg-[#EAF7EF] text-[#14532D]"
                      : "bg-accent text-white hover:brightness-110 active:brightness-95"
                  }`}
                >
                  {copied ? <CheckIcon size={18} /> : <CopyIcon size={18} />}
                  {copied ? "Copied — opening Google" : "Copy & Post on Google"}
                </button>
              </article>
            );
          })}

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={generate}
              className="flex min-h-12 cursor-pointer items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-accent bg-white text-sm font-extrabold text-accent-dark transition hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <RefreshIcon size={17} />
              Regenerate
            </button>
            <button
              type="button"
              onClick={backToRate}
              className="min-h-12 cursor-pointer rounded-[14px] border-[1.5px] border-chip-line bg-white text-sm font-bold text-slate-ink transition hover:border-slate-ink/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Change rating
            </button>
          </div>
        </div>
      )}

      {screen === "error" && (
        <div
          role="alert"
          className={`${CARD} flex flex-col items-center gap-2 px-[22px] py-[30px] text-center`}
        >
          <div className="flex size-[58px] items-center justify-center rounded-[18px] bg-[#FFF1E6] text-[#B45309]">
            <WarningIcon size={28} />
          </div>
          <h2 className="text-[19px] font-extrabold">Couldn&apos;t create suggestions</h2>
          <p className="max-w-[280px] text-sm leading-normal text-muted">{errorMessage}</p>
          <button
            type="button"
            onClick={generate}
            className="mt-2.5 min-h-[52px] w-full cursor-pointer rounded-2xl bg-accent text-base font-extrabold text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={backToRate}
            className="min-h-12 w-full cursor-pointer rounded-[14px] text-sm font-bold text-slate-ink transition hover:bg-[#F5F9FF] focus-visible:outline-2 focus-visible:outline-accent"
          >
            Go back
          </button>
        </div>
      )}

      {/* Toast — the live region stays mounted so screen readers announce changes. */}
      <div aria-live="polite" role="status">
        {toast && (
          <div className="animate-toast-in fixed bottom-6 left-1/2 z-50 flex w-[calc(100%-32px)] max-w-[420px] items-center gap-2.5 rounded-2xl bg-ink px-4 py-3.5 text-sm font-bold text-white shadow-toast">
            <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-[#22C55E] text-[#0B2A16]">
              <CheckIcon size={15} strokeWidth={3} />
            </span>
            <span className="flex flex-col gap-0.5">
              {toast.text}
              {toast.fallbackLink && (
                <a
                  href={clinic.googleReviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#93C5FD] underline underline-offset-2"
                >
                  Open Google reviews
                </a>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy method
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

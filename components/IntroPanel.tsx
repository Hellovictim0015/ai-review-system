import Image from "next/image";
import { clinic } from "@/config/clinic";
import { HeartIcon, ShieldIcon } from "./icons";

const STEPS = ["Rate your visit", "Pick a suggested review", "Paste & post on Google"];

export function IntroPanel() {
  return (
    <section
      aria-labelledby="page-title"
      className="flex min-w-0 shrink grow basis-[340px] flex-col gap-[18px] pt-1.5"
    >
      {clinic.logo && (
        <div className="self-start rounded-2xl border border-line bg-white px-4 py-3 shadow-card-sm">
          <Image
            src={clinic.logo}
            alt={clinic.clinicName}
            width={clinic.logoWidth}
            height={clinic.logoHeight}
            priority
            className="h-auto w-[200px] max-w-full sm:w-[230px]"
          />
        </div>
      )}

      <p className="flex items-center gap-1.5 self-start rounded-full border border-line bg-white px-3 py-1.5 text-[13px] font-bold text-accent-dark">
        <HeartIcon size={15} />
        Thank you for visiting the clinic
      </p>

      <h1
        id="page-title"
        className="m-0 text-[clamp(28px,4.6vw,42px)] leading-[1.15] font-extrabold tracking-[-0.5px]"
      >
        How was your visit with{" "}
        <span className="text-accent">Dr. {clinic.doctorShortName}?</span>
      </h1>

      <p className="m-0 max-w-[440px] text-base leading-relaxed text-muted">
        Your feedback helps other patients choose the right care. Rate your
        visit, pick a suggested review and post it on Google in under 30
        seconds.
      </p>

      <ol className="mt-1 flex flex-col gap-3">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] border border-line bg-white text-sm font-extrabold text-accent-dark">
              {i + 1}
            </span>
            <span className="text-[15px] font-semibold">{label}</span>
          </li>
        ))}
      </ol>

      <div className="mt-1 flex max-w-[440px] items-start gap-3 rounded-2xl border border-line bg-white px-4 py-3.5">
        <div className="flex size-[34px] shrink-0 items-center justify-center rounded-[10px] bg-accent-soft text-accent-dark">
          <ShieldIcon size={18} />
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-bold">Your privacy matters</p>
          <p className="text-[13px] leading-normal text-muted">
            Google reviews are public. Please avoid sharing personal health
            details, reports or medicine names.
          </p>
        </div>
      </div>
    </section>
  );
}

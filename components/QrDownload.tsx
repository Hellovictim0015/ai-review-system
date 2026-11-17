"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { clinic } from "@/config/clinic";

const QR_OPTIONS = {
  width: 1024, // large, so it prints sharply
  margin: 2,
  errorCorrectionLevel: "M" as const,
  color: { dark: "#0F1B33", light: "#FFFFFF" },
};

export function QrDownload() {
  const [qr, setQr] = useState({ url: "", dataUrl: "" });
  const { url, dataUrl } = qr;

  useEffect(() => {
    // QR points to the home (review) page of whatever domain this is opened on.
    const target = `${window.location.origin}/`;
    QRCode.toDataURL(target, QR_OPTIONS)
      .then((data) => setQr({ url: target, dataUrl: data }))
      .catch(() => setQr({ url: target, dataUrl: "" }));
  }, []);

  const fileName = `review-qr-${clinic.clinicName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;

  return (
    <div className="flex w-full flex-col items-center gap-4 rounded-3xl border border-line bg-white p-6 shadow-card">
      {dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- generated data URL
        <img
          src={dataUrl}
          alt={`QR code for ${url}`}
          width={280}
          height={280}
          className="size-[280px] max-w-full"
        />
      ) : (
        <div className="size-[280px] max-w-full animate-pulse rounded-2xl bg-[#E1EAF7]" aria-hidden />
      )}

      <p className="break-all text-center text-[13px] font-semibold text-muted">{url}</p>

      <a
        href={dataUrl || undefined}
        download={fileName}
        aria-disabled={!dataUrl}
        className={`flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-accent text-base font-extrabold text-white shadow-cta transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
          dataUrl ? "" : "pointer-events-none opacity-60"
        }`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 3v12" />
          <path d="M7 10l5 5 5-5" />
          <path d="M5 21h14" />
        </svg>
        Download QR code
      </a>
    </div>
  );
}

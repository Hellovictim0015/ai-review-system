import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { Plus_Jakarta_Sans, Noto_Sans_Devanagari } from "next/font/google";
import { clinic } from "@/config/clinic";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const devanagari = Noto_Sans_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: `Review Dr. ${clinic.doctorName} · ${clinic.clinicName}`,
  description: `Share your experience with Dr. ${clinic.doctorName} at ${clinic.clinicName}, ${clinic.city}.`,
};

export const viewport: Viewport = {
  themeColor: "#EEF5FF",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const accentVars = {
    "--accent": clinic.accentColor,
    "--accent-dark": clinic.accentDarkColor,
  } as CSSProperties;

  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${devanagari.variable} h-full antialiased`}
      style={accentVars}
    >
      <body className="min-h-full flex flex-col bg-page font-sans text-ink">
        {children}
      </body>
    </html>
  );
}

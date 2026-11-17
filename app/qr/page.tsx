import type { Metadata } from "next";
import { clinic } from "@/config/clinic";
import { QrDownload } from "@/components/QrDownload";

export const metadata: Metadata = {
  title: `QR code · Review Dr. ${clinic.doctorName}`,
  robots: { index: false },
};

export default function QrPage() {
  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-1 flex-col items-center gap-5 px-4 py-10">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-extrabold">Review page QR code</h1>
        <p className="text-sm text-muted">
          Print this and place it at the reception. Patients scan it to open the review page.
        </p>
      </div>
      <QrDownload />
    </main>
  );
}

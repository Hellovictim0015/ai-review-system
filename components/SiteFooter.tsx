import { clinic } from "@/config/clinic";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto flex max-w-[1080px] flex-wrap justify-between gap-2 px-5 py-4 text-[12.5px] text-muted">
        <p>Suggestions are ready-made examples · edit freely before posting</p>
        <p>© {clinic.clinicName}</p>
      </div>
    </footer>
  );
}

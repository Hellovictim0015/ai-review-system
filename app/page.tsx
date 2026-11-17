import { IntroPanel } from "@/components/IntroPanel";
import { ReviewCard } from "@/components/ReviewCard";
import { SiteFooter } from "@/components/SiteFooter";

export default function Home() {
  return (
    <>
      <main className="mx-auto flex w-full max-w-[1080px] flex-1 flex-wrap items-start gap-10 px-4 pt-8 pb-14 sm:px-5 sm:pt-10">
        <IntroPanel />
        <section
          aria-label="Write your review"
          className="flex min-w-0 max-w-[540px] shrink grow basis-[400px] flex-col gap-4"
        >
          <ReviewCard />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

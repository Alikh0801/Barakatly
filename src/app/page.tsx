import { Suspense } from "react";
import { AreYouAFarmerSection } from "@/components/AreYouAFarmerSection";
import { Hero } from "@/components/Hero";
import { CategorySection } from "@/components/CategorySection";
import { FaqSection } from "@/components/FaqSection";
import { Reveal } from "@/components/Reveal";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { WhyChooseSection } from "@/components/WhyChooseSection";
import { CategorySectionSkeleton } from "@/components/skeletons/CategorySectionSkeleton";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <Hero />
      <Suspense fallback={<CategorySectionSkeleton />}>
        <Reveal>
          <CategorySection categorySlug={params.category} />
        </Reveal>
      </Suspense>
      <Reveal>
        <WhyChooseSection />
      </Reveal>
      <Reveal>
        <FaqSection />
      </Reveal>
      <Reveal>
        <AreYouAFarmerSection />
      </Reveal>
      <SiteFooter />
    </div>
  );
}

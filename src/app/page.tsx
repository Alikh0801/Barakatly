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
import { getHeroContent } from "@/lib/content/queries";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const hero = await getHeroContent();

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <Hero
        title={hero.title}
        highlight={hero.items.highlight}
        body={hero.body}
        imageUrl={hero.items.imageUrl}
      />
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

import { AreYouAFarmerSection } from "@/components/AreYouAFarmerSection";
import { Hero } from "@/components/Hero";
import { CategorySection } from "@/components/CategorySection";
import { FaqSection } from "@/components/FaqSection";
import { FreshThisWeekSection } from "@/components/FreshThisWeekSection";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { WhyChooseSection } from "@/components/WhyChooseSection";

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
      <CategorySection categorySlug={params.category} />
      <FreshThisWeekSection />
      <WhyChooseSection />
      <FaqSection />
      <AreYouAFarmerSection />
      <SiteFooter />
    </div>
  );
}

import { AreYouAFarmerSection } from "@/components/AreYouAFarmerSection";
import { Hero } from "@/components/Hero";
import { CategorySection } from "@/components/CategorySection";
import { FaqSection } from "@/components/FaqSection";
import { FreshThisWeekSection } from "@/components/FreshThisWeekSection";
import { MeetOurFarmersSection } from "@/components/MeetOurFarmersSection";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { WhatCustomersSaySection } from "@/components/WhatCustomersSaySection";
import { WhyChooseSection } from "@/components/WhyChooseSection";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <Hero />
      <CategorySection />
      <MeetOurFarmersSection />
      <FreshThisWeekSection />
      <WhyChooseSection />
      <WhatCustomersSaySection />
      <FaqSection />
      <AreYouAFarmerSection />
      <SiteFooter />
    </div>
  );
}

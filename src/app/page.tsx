import { Hero } from "@/components/Hero";
import { CategorySection } from "@/components/CategorySection";
import { SiteHeader } from "@/components/SiteHeader";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <Hero />
      <CategorySection />
    </div>
  );
}

import { getFaqContent } from "@/lib/content/queries";
import { FaqAccordion } from "@/components/FaqAccordion";

export async function FaqSection() {
  const content = await getFaqContent();

  return (
    <section className="bg-[#faf9f5]">
      <div className="mx-auto w-full max-w-3xl px-4 py-14 md:px-6 md:py-16">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
            {content.title}
          </h2>
        </div>
        <div className="mt-10">
          <FaqAccordion items={content.items} />
        </div>
      </div>
    </section>
  );
}

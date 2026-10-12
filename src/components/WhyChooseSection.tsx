import { getWhyBarakatlyContent } from "@/lib/content/queries";
import { Reveal } from "@/components/Reveal";

// Columns follow the number of active cards, so switching one off in the
// admin never leaves a gap: the rest stay centred and evenly spread.
const GRID_BY_COUNT: Record<number, string> = {
  1: "mx-auto max-w-sm",
  2: "mx-auto max-w-3xl md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "sm:grid-cols-2 md:grid-cols-4",
};

export async function WhyChooseSection() {
  const content = await getWhyBarakatlyContent();
  const features = content.items.filter((feature) => feature.enabled);
  if (features.length === 0) return null;

  return (
    <section className="bg-emerald-950">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 md:px-6 md:py-16">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            {content.title}
          </h2>
          <p className="mt-2 text-sm text-emerald-100/80">{content.body}</p>
        </div>

        <div className={`mt-10 grid gap-8 ${GRID_BY_COUNT[features.length] ?? GRID_BY_COUNT[4]}`}>
          {features.map((feature, index) => (
            <Reveal
              key={feature.title}
              delayMs={index * 90}
              className="text-center"
            >
              <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-xl text-white ring-1 ring-white/10">
                <span aria-hidden="true">{feature.icon}</span>
              </div>
              <h3 className="mt-4 text-sm font-semibold text-white">
                {feature.title}
              </h3>
              <p className="mt-2 text-xs leading-5 text-emerald-100/75">
                {feature.description}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

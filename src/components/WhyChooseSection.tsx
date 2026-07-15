import { getWhyBarakatlyContent } from "@/lib/content/queries";

const FEATURES = [
  {
    title: "Həmişə təzə",
    description:
      "Məhsullar 24–48 saat ərzində yığılır və çatdırılır ki, maksimum təravət qorunsun.",
    icon: "🌿",
  },
  {
    title: "Keyfiyyət zəmanəti",
    description:
      "Hər məhsul yoxlanılır və sertifikatlı fermerlərdən seçilir.",
    icon: "🛡️",
  },
  {
    title: "Sürətli çatdırılma",
    description:
      "Fermerdən birbaşa qapınıza — eyni gün və ya növbəti gün çatdırılma seçimləri.",
    icon: "🚚",
  },
  {
    title: "Yerliyə dəstək",
    description:
      "Alışlarınız yerli təsərrüfatları və icmaları birbaşa dəstəkləyir.",
    icon: "🤝",
  },
] as const;

export async function WhyChooseSection() {
  const content = await getWhyBarakatlyContent();

  return (
    <section className="bg-emerald-950">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 md:px-6 md:py-16">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            {content.title}
          </h2>
          <p className="mt-2 text-sm text-emerald-100/80">{content.body}</p>
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="text-center">
              <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-xl text-white ring-1 ring-white/10">
                <span aria-hidden="true">{f.icon}</span>
              </div>
              <h3 className="mt-4 text-sm font-semibold text-white">
                {f.title}
              </h3>
              <p className="mt-2 text-xs leading-5 text-emerald-100/75">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

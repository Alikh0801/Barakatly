import Link from "next/link";

const CATEGORIES = [
  { slug: "vegetables", label: "Tərəvəzlər", icon: "🥦", count: 142 },
  { slug: "fruits", label: "Meyvələr", icon: "🍓", count: 98 },
  { slug: "dairy", label: "Süd məhsulları", icon: "🥛", count: 54 },
  { slug: "eggs", label: "Yumurta", icon: "🥚", count: 21 },
  { slug: "honey", label: "Bal", icon: "🍯", count: 18 },
  { slug: "herbs", label: "Göyərti", icon: "🌿", count: 67 },
  { slug: "grains", label: "Taxıl", icon: "🌾", count: 41 },
  { slug: "oils", label: "Yağlar", icon: "🫒", count: 29 },
] as const;

export function CategorySection() {
  return (
    <section className="bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 md:px-6 md:py-16">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Kateqoriyalar üzrə alış
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Fermer məhsullarından ibarət seçməni gözdən keçirin
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 justify-items-center gap-y-10 sm:grid-cols-4 lg:grid-cols-8">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/shop?category=${c.slug}`}
              className="group flex w-full max-w-[120px] flex-col items-center text-center"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50 text-2xl ring-1 ring-zinc-200 transition group-hover:bg-emerald-50 group-hover:ring-emerald-200">
                <span aria-hidden="true">{c.icon}</span>
              </span>
              <span className="mt-3 text-xs font-medium text-zinc-800 transition group-hover:text-emerald-700">
                {c.label}
              </span>
              <span className="mt-1 text-[11px] text-zinc-500">
                {c.count} məhsul
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}


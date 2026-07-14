import Link from "next/link";
import { getCategories } from "@/lib/shop/queries";

export async function CategorySection() {
  const categories = await getCategories();

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 md:px-6 md:py-16">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Kateqoriyalar üzrə alış
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            Fermer məhsullarından ibarət seçməni gözdən keçirin
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 justify-items-center gap-y-10 sm:grid-cols-4 lg:grid-cols-8">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/shop?category=${category.slug}`}
              className="group flex w-full max-w-[120px] flex-col items-center text-center"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50 text-2xl ring-1 ring-zinc-200 transition group-hover:bg-emerald-50 group-hover:ring-emerald-200">
                <span aria-hidden="true">{category.icon ?? "🌿"}</span>
              </span>
              <span className="mt-3 text-xs font-medium text-zinc-800 transition group-hover:text-emerald-700">
                {category.name_az}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

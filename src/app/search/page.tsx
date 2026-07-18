import Link from "next/link";
import { ProductCard } from "@/components/shop/ProductCard";
import { VerifiedIcon } from "@/components/ui/VerifiedIcon";
import { searchCatalog } from "@/lib/shop/search";

export const metadata = {
  title: "Axtarış — BARAKATLY",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const results = q ? await searchCatalog(q) : null;

  return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-12">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Axtarış
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Məhsul və ya ferma adı ilə axtarın
        </p>

        <form action="/search" className="mt-6 flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Məs: yumurta, TestFarms..."
            className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none ring-emerald-500/30 focus:ring-2"
          />
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            Axtar
          </button>
        </form>

        {!q ? (
          <p className="mt-10 text-sm text-zinc-500">
            Axtarış etmək üçün yuxarıdakı sahəyə yazın.
          </p>
        ) : null}

        {results ? (
          <div className="mt-10 space-y-12">
            <section>
              <h2 className="text-lg font-semibold text-zinc-900">
                Məhsullar
                <span className="ml-2 text-sm font-normal text-zinc-500">
                  ({results.products.length})
                </span>
              </h2>
              {results.products.length === 0 ? (
                <p className="mt-4 text-sm text-zinc-500">Məhsul tapılmadı.</p>
              ) : (
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {results.products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">
                Fermerlər
                <span className="ml-2 text-sm font-normal text-zinc-500">
                  ({results.farmers.length})
                </span>
              </h2>
              {results.farmers.length === 0 ? (
                <p className="mt-4 text-sm text-zinc-500">Fermer tapılmadı.</p>
              ) : (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {results.farmers.map((farmer) => (
                    <Link
                      key={farmer.id}
                      href={`/farmers/${farmer.id}`}
                      className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 transition hover:shadow-md"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-900">
                          {farmer.farm_name}
                        </span>
                        {farmer.verified_at ? (
                          <VerifiedIcon className="h-4 w-4" />
                        ) : null}
                      </div>
                      {farmer.location_text ? (
                        <p className="mt-1 text-sm text-zinc-500">
                          {farmer.location_text}
                        </p>
                      ) : null}
                      <p className="mt-2 text-xs text-zinc-500">
                        {farmer.productCount} məhsul
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : null}
      </div>
  );
}

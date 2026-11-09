import Link from "next/link";
import { AppProductCard } from "@/components/app/AppShop";
import { SearchIcon } from "@/components/app/icons";
import { VerifiedIcon } from "@/components/ui/VerifiedIcon";
import { farmerDisplayName } from "@/lib/farmers/name";
import type { SearchResults } from "@/lib/shop/search";

/**
 * The installed app's search screen (Figma "search" / "search-empty"):
 * a search field, then products as cards and farmers as rows. The search
 * itself is the website's (lib/shop/search). App only.
 */
export function AppSearch({ q, results }: { q: string; results: SearchResults | null }) {
  const nothing = results && results.products.length === 0 && results.farmers.length === 0;

  return (
    <div data-app-screen className="hidden min-h-dvh font-app text-app-ink app:block">
      <div className="px-6 pt-4">
        <h1 className="font-app-display text-[22px] font-bold">Axtarış</h1>
        <form action="/search" className="mt-4 flex h-12 items-center gap-2 rounded-2xl bg-white px-4">
          <SearchIcon className="h-5 w-5 shrink-0 text-app-muted" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            enterKeyHint="search"
            placeholder="Məhsul adı və ya fermer axtarın"
            className="h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-app-muted"
          />
        </form>
      </div>

      {!q ? (
        <p className="px-6 py-10 text-center text-sm text-app-muted">Axtarış etmək üçün yuxarıdakı sahəyə yazın.</p>
      ) : nothing ? (
        <div className="px-6 py-14 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f3eee2] text-app-muted">
            <SearchIcon className="h-7 w-7" />
          </span>
          <p className="mt-4 font-app-display text-lg font-bold">Heç nə tapılmadı</p>
          <p className="mt-1 text-sm text-app-muted">“{q}” üzrə məhsul və ya fermer yoxdur.</p>
          <Link href="/shop" className="mt-5 inline-flex h-11 items-center rounded-full bg-app-green px-6 text-sm font-bold text-white">
            Mağazaya bax
          </Link>
        </div>
      ) : results ? (
        <>
          {results.products.length > 0 ? (
            <section className="px-6 pt-6">
              <h2 className="font-app-display text-lg font-bold">
                Məhsullar <span className="text-sm font-normal text-app-muted">({results.products.length})</span>
              </h2>
              <ul className="mt-4 grid grid-cols-2 gap-4">
                {results.products.map((product) => (
                  <li key={product.id} className="min-w-0">
                    <AppProductCard product={product} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {results.farmers.length > 0 ? (
            <section className="px-6 pt-6 pb-6">
              <h2 className="font-app-display text-lg font-bold">
                Fermerlər <span className="text-sm font-normal text-app-muted">({results.farmers.length})</span>
              </h2>
              <ul className="mt-4 space-y-3">
                {results.farmers.map((farmer) => (
                  <li key={farmer.id}>
                    <Link href={`/farmers/${farmer.id}`} className="flex items-center gap-3 rounded-2xl bg-white p-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e9f1e2] text-sm font-bold text-[#3b7a2c]">
                        {farmerDisplayName(farmer.owner_name).slice(0, 2).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5 font-bold">
                          <span className="truncate">{farmerDisplayName(farmer.owner_name)}</span>
                          {farmer.verified_at ? <VerifiedIcon className="h-4 w-4 shrink-0" /> : null}
                        </span>
                        <span className="block truncate text-xs text-app-muted">
                          {[farmer.location_text, `${farmer.productCount} məhsul`].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                      <span aria-hidden="true" className="text-xl text-app-muted">›</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

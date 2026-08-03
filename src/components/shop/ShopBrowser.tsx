"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ProductCard } from "@/components/shop/ProductCard";
import { getDisplayPrice } from "@/lib/shop/format";
import type { ProductListItem } from "@/types/shop";

type ShopSort = "newest" | "price_asc" | "price_desc" | "popular";

const SORT_OPTIONS: { value: ShopSort; label: string }[] = [
  { value: "newest", label: "Yeni əlavə olunanlar" },
  { value: "popular", label: "Populyarlıq" },
  { value: "price_asc", label: "Qiymət: aşağıdan yuxarı" },
  { value: "price_desc", label: "Qiymət: yuxarıdan aşağı" },
];

function filterAndSortProducts(
  products: ProductListItem[],
  q: string,
  sort: ShopSort,
): ProductListItem[] {
  const query = q.trim().toLowerCase();
  const filtered = query
    ? products.filter(
        (product) =>
          product.title.toLowerCase().includes(query) ||
          product.farmer?.farm_name.toLowerCase().includes(query),
      )
    : products;

  const sorted = [...filtered];
  if (sort === "price_asc") {
    sorted.sort(
      (a, b) =>
        getDisplayPrice(a.final_price, a.farmer_price) -
        getDisplayPrice(b.final_price, b.farmer_price),
    );
  } else if (sort === "price_desc") {
    sorted.sort(
      (a, b) =>
        getDisplayPrice(b.final_price, b.farmer_price) -
        getDisplayPrice(a.final_price, a.farmer_price),
    );
  } else if (sort === "popular") {
    sorted.sort((a, b) => b.sold_count - a.sold_count);
  }

  return sorted;
}

export function ShopBrowser({
  products,
  categoryFilter,
  activeCategoryName,
}: {
  products: ProductListItem[];
  categoryFilter: ReactNode;
  activeCategoryName: string | null;
}) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<ShopSort>("newest");

  const filteredProducts = useMemo(
    () => filterAndSortProducts(products, q, sort),
    [products, q, sort],
  );

  return (
    <>
      <div className="relative mt-8">
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
        >
          <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M17 17L13.5 13.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <input
          type="search"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Məhsul və ya ferma adı ilə axtarın..."
          className="w-full rounded-xl border border-zinc-200 bg-white py-3 pl-11 pr-4 text-sm text-zinc-900 outline-none ring-emerald-500/30 focus:ring-2"
        />
      </div>

      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">{categoryFilter}</div>

        <div className="flex shrink-0 items-center gap-2">
          <label htmlFor="shop-sort" className="shrink-0 text-sm text-zinc-500">
            Sırala:
          </label>
          <div className="relative w-full sm:w-auto">
            <select
              id="shop-sort"
              value={sort}
              onChange={(event) => setSort(event.target.value as ShopSort)}
              className="w-full appearance-none rounded-xl border border-zinc-200 bg-white py-3 pl-4 pr-10 text-sm font-medium text-zinc-900 outline-none ring-emerald-500/30 transition hover:border-zinc-300 focus:ring-2 sm:w-auto"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
            >
              <path
                d="M5 7.5L10 12.5L15 7.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {activeCategoryName && !q ? (
        <p className="mt-6 text-sm text-zinc-600">
          Kateqoriya: <span className="font-medium">{activeCategoryName}</span>
        </p>
      ) : null}

      {filteredProducts.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-zinc-200">
          <p className="text-lg font-medium text-zinc-900">
            {q ? "Axtarışa uyğun məhsul tapılmadı" : "Hazırda məhsul yoxdur"}
          </p>
          <p className="mt-2 text-sm text-zinc-600">
            {q
              ? "Başqa açar söz ilə yenidən cəhd edin."
              : "Fermerlərin əlavə etdiyi məhsullar admin təsdiqindən sonra burada görünəcək."}
          </p>
        </div>
      )}
    </>
  );
}

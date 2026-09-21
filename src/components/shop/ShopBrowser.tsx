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

type FarmerOption = { id: string; name: string; count: number };

function SearchIcon() {
  return (
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
  );
}

function FilterIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4"
    >
      <path
        d="M3 5h14M6 10h8M8.5 15h3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-zinc-100 pb-5 last:border-b-0 last:pb-0">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function filterAndSortProducts(
  products: ProductListItem[],
  {
    q,
    sort,
    farmerIds,
    minPrice,
    maxPrice,
  }: {
    q: string;
    sort: ShopSort;
    farmerIds: Set<string>;
    minPrice: number | null;
    maxPrice: number | null;
  },
): ProductListItem[] {
  const query = q.trim().toLowerCase();
  let filtered = query
    ? products.filter(
        (product) =>
          product.title.toLowerCase().includes(query) ||
          product.farmer?.farm_name.toLowerCase().includes(query),
      )
    : products;

  if (farmerIds.size > 0) {
    filtered = filtered.filter(
      (product) => product.farmer && farmerIds.has(product.farmer.id),
    );
  }

  if (minPrice !== null || maxPrice !== null) {
    filtered = filtered.filter((product) => {
      const price = getDisplayPrice(product.final_price, product.farmer_price);
      if (minPrice !== null && price < minPrice) return false;
      if (maxPrice !== null && price > maxPrice) return false;
      return true;
    });
  }

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
  const [selectedFarmerIds, setSelectedFarmerIds] = useState<Set<string>>(
    new Set(),
  );
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const farmerOptions = useMemo<FarmerOption[]>(() => {
    const map = new Map<string, FarmerOption>();
    for (const product of products) {
      if (!product.farmer) continue;
      const existing = map.get(product.farmer.id);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(product.farmer.id, {
          id: product.farmer.id,
          name: product.farmer.farm_name,
          count: 1,
        });
      }
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "az"));
  }, [products]);

  const priceBounds = useMemo(() => {
    if (products.length === 0) return null;
    let min = Infinity;
    let max = 0;
    for (const product of products) {
      const price = getDisplayPrice(product.final_price, product.farmer_price);
      if (price < min) min = price;
      if (price > max) max = price;
    }
    return { min: Math.floor(min), max: Math.ceil(max) };
  }, [products]);

  const minPriceValue = minPrice.trim() ? Number(minPrice) : null;
  const maxPriceValue = maxPrice.trim() ? Number(maxPrice) : null;

  const filteredProducts = useMemo(
    () =>
      filterAndSortProducts(products, {
        q,
        sort,
        farmerIds: selectedFarmerIds,
        minPrice: Number.isFinite(minPriceValue) ? minPriceValue : null,
        maxPrice: Number.isFinite(maxPriceValue) ? maxPriceValue : null,
      }),
    [products, q, sort, selectedFarmerIds, minPriceValue, maxPriceValue],
  );

  function toggleFarmer(id: string) {
    setSelectedFarmerIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const activeFilterCount =
    selectedFarmerIds.size + (minPrice.trim() ? 1 : 0) + (maxPrice.trim() ? 1 : 0);

  function resetFilters() {
    setSelectedFarmerIds(new Set());
    setMinPrice("");
    setMaxPrice("");
  }

  const filtersContent = (
    <div className="space-y-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900">Filtrlər</h2>
        {activeFilterCount > 0 ? (
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs font-medium text-emerald-700 hover:underline"
          >
            Təmizlə
          </button>
        ) : null}
      </div>

      <FilterSection title="Kateqoriya">{categoryFilter}</FilterSection>

      <FilterSection title="Sırala">
        <div className="space-y-2">
          {SORT_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2.5 text-sm text-zinc-700"
            >
              <input
                type="radio"
                name="shop-sort"
                value={option.value}
                checked={sort === option.value}
                onChange={() => setSort(option.value)}
                className="h-4 w-4 shrink-0 accent-emerald-600"
              />
              {option.label}
            </label>
          ))}
        </div>
      </FilterSection>

      {farmerOptions.length > 0 ? (
        <FilterSection title="Fermerlər">
          <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
            {farmerOptions.map((farmer) => (
              <label
                key={farmer.id}
                className="flex cursor-pointer items-center justify-between gap-2 text-sm text-zinc-700"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={selectedFarmerIds.has(farmer.id)}
                    onChange={() => toggleFarmer(farmer.id)}
                    className="h-4 w-4 shrink-0 rounded accent-emerald-600"
                  />
                  <span className="truncate">{farmer.name}</span>
                </span>
                <span className="shrink-0 text-xs text-zinc-400">
                  {farmer.count}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>
      ) : null}

      {priceBounds ? (
        <FilterSection title="Qiymət aralığı">
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="decimal"
              min={0}
              placeholder={String(priceBounds.min)}
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
              className="w-full min-w-0 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500/30 focus:ring-2"
            />
            <span className="shrink-0 text-zinc-400">—</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              placeholder={String(priceBounds.max)}
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              className="w-full min-w-0 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500/30 focus:ring-2"
            />
          </div>
          <p className="mt-2 text-xs text-zinc-400">
            {priceBounds.min.toFixed(2)} ₼ – {priceBounds.max.toFixed(2)} ₼
          </p>
        </FilterSection>
      ) : null}
    </div>
  );

  return (
    <>
      <div className="relative mt-8">
        <SearchIcon />
        <input
          type="search"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Məhsul və ya ferma adı ilə axtarın..."
          className="w-full rounded-xl border border-zinc-200 bg-white py-3 pl-11 pr-4 text-sm text-zinc-900 outline-none ring-emerald-500/30 focus:ring-2"
        />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileFiltersOpen((open) => !open)}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm ring-1 ring-zinc-200 transition hover:bg-zinc-50"
        >
          <FilterIcon />
          Filtrlər
          {activeFilterCount > 0 ? (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[11px] font-semibold text-white">
              {activeFilterCount}
            </span>
          ) : null}
        </button>
        <span className="text-sm text-zinc-500">
          {filteredProducts.length} məhsul
        </span>
      </div>

      <div className="mt-6 lg:grid lg:grid-cols-[280px_1fr] lg:items-start lg:gap-8">
        <aside
          className={[
            "mb-6 lg:sticky lg:top-24 lg:mb-0",
            mobileFiltersOpen ? "block" : "hidden lg:block",
          ].join(" ")}
        >
          {filtersContent}
        </aside>

        <div className="min-w-0">
          <div className="hidden items-center justify-between lg:flex">
            {activeCategoryName ? (
              <p className="text-sm text-zinc-600">
                Kateqoriya:{" "}
                <span className="font-medium text-zinc-900">
                  {activeCategoryName}
                </span>
              </p>
            ) : (
              <span />
            )}
            <span className="text-sm text-zinc-500">
              {filteredProducts.length} məhsul
            </span>
          </div>

          {activeCategoryName ? (
            <p className="mt-1 text-sm text-zinc-600 lg:hidden">
              Kateqoriya:{" "}
              <span className="font-medium text-zinc-900">
                {activeCategoryName}
              </span>
            </p>
          ) : null}

          {filteredProducts.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:mt-4 lg:grid-cols-2 lg:gap-6 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-zinc-200">
              <p className="text-lg font-medium text-zinc-900">
                {q || activeFilterCount > 0
                  ? "Filtrə uyğun məhsul tapılmadı"
                  : "Hazırda məhsul yoxdur"}
              </p>
              <p className="mt-2 text-sm text-zinc-600">
                {q || activeFilterCount > 0
                  ? "Filtrləri dəyişin və ya təmizləyin."
                  : "Fermerlərin əlavə etdiyi məhsullar admin təsdiqindən sonra burada görünəcək."}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

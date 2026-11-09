"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { ArrowLeftIcon, CheckIcon, PlusIcon, SlidersIcon } from "@/components/app/icons";
import { useAddToCart } from "@/components/shop/AddToCartButton";
import { Spinner } from "@/components/ui/Spinner";
import { farmerDisplayName } from "@/lib/farmers/name";
import { formatPrice, getProductImageUrl, unitLabel } from "@/lib/shop/format";
import { compareAz } from "@/lib/shop/normalize";
import { defaultVariant, productVariants, variantInStock, variantPrice } from "@/lib/shop/variants";
import type { CategoryItem, ProductListItem } from "@/types/shop";

/**
 * The installed app's product list (Figma "category-products", 2:151), for
 * one category or all of them: a back button, the title, a category
 * picker, three sort pills and two-column cards. Only shown in the app.
 */

type Sort = "popular" | "cheapest" | "farmer";

const SORTS: { value: Sort; label: string }[] = [
  { value: "popular", label: "Populyar" },
  { value: "cheapest", label: "Ən ucuz" },
  { value: "farmer", label: "Fermerə görə" },
];

function cardPrice(product: ProductListItem) {
  const variant = defaultVariant(productVariants(product));
  return { variant, price: variantPrice(variant) };
}

function sortProducts(products: ProductListItem[], sort: Sort): ProductListItem[] {
  const list = [...products];
  // Sold-out products stay last, whatever the order, as on the website.
  const stock = (p: ProductListItem) => (productVariants(p).some(variantInStock) ? 0 : 1);
  if (sort === "popular") list.sort((a, b) => stock(a) - stock(b) || b.sold_count - a.sold_count);
  if (sort === "cheapest") list.sort((a, b) => stock(a) - stock(b) || cardPrice(a).price - cardPrice(b).price);
  if (sort === "farmer") {
    list.sort(
      (a, b) =>
        stock(a) - stock(b) ||
        compareAz(farmerDisplayName(a.farmer?.owner_name), farmerDisplayName(b.farmer?.owner_name)) ||
        compareAz(a.title, b.title),
    );
  }
  return list;
}

function AddButton({ product, variantId }: { product: ProductListItem; variantId: string }) {
  const { add, pending, added, error } = useAddToCart();
  return (
    <button
      type="button"
      disabled={pending}
      data-static-hover
      onClick={(event) => {
        // The card is a link to the product; this button only adds.
        event.preventDefault();
        add(product.id, undefined, variantId || undefined);
      }}
      aria-label={error || `${product.title} səbətə əlavə et`}
      title={error || undefined}
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-60 ${
        error ? "bg-rose-500" : "bg-app-green"
      }`}
    >
      {pending ? (
        <Spinner className="h-3.5 w-3.5" />
      ) : added ? (
        <CheckIcon className="h-3.5 w-3.5" />
      ) : (
        <PlusIcon className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

function ProductCard({ product }: { product: ProductListItem }) {
  const { variant, price } = cardPrice(product);
  const inStock = productVariants(product).some(variantInStock);
  const image = getProductImageUrl(product.product_images);
  // The unit alone ("banka"); its size shows on the product page.
  const unit = unitLabel(variant.unit_type);

  return (
    <Link
      href={`/shop/${product.id}`}
      data-static-hover
      className="flex min-w-0 flex-col overflow-hidden rounded-[20px] bg-white"
    >
      <span className="relative block h-[130px] w-full bg-[#f3eee2]">
        {image ? (
          <Image
            src={image}
            alt=""
            fill
            sizes="50vw"
            className={`object-cover ${inStock ? "" : "opacity-60 grayscale"}`}
          />
        ) : null}
      </span>
      <span className="flex flex-col gap-2 p-3">
        <span className="truncate font-app-display text-sm font-bold">{product.title}</span>
        <span className="truncate text-xs text-app-muted">
          Fermer: {farmerDisplayName(product.farmer?.owner_name)}
        </span>
        <span className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate font-app-display text-base font-bold text-[#3b7a2c]">
            {formatPrice(price)}
            {unit ? ` / ${unit}` : ""}
          </span>
          {inStock ? (
            <AddButton product={product} variantId={variant.id} />
          ) : (
            <span className="shrink-0 text-[11px] font-semibold text-app-muted">Bitib</span>
          )}
        </span>
      </span>
    </Link>
  );
}

export function AppShop({
  products,
  categories,
  activeSlug,
}: {
  products: ProductListItem[];
  categories: CategoryItem[];
  activeSlug?: string;
}) {
  const router = useRouter();
  const [sort, setSort] = useState<Sort>("popular");
  const sheetRef = useRef<HTMLDialogElement>(null);
  const sorted = useMemo(() => sortProducts(products, sort), [products, sort]);
  const active = categories.find((category) => category.slug === activeSlug);

  function goBack() {
    // Opened straight from the home screen there is nothing to go back to.
    if (window.history.length > 1) router.back();
    else router.push("/");
  }

  return (
    <div data-app-screen className="hidden min-h-dvh font-app text-app-ink app:block">
      <header className="flex h-14 items-center justify-between gap-3 px-4">
        <button
          type="button"
          onClick={goBack}
          aria-label="Geri"
          data-static-hover
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f3eee2]"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="truncate font-app-display text-xl font-bold">{active?.name_az ?? "Bütün məhsullar"}</h1>
        <button
          type="button"
          onClick={() => sheetRef.current?.showModal()}
          aria-label="Kateqoriyalar"
          data-static-hover
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f3eee2]"
        >
          <SlidersIcon className="h-5 w-5" />
        </button>
      </header>

      <div className="flex gap-2 overflow-x-auto px-6 py-3 [scrollbar-width:none]">
        {SORTS.map((option) => {
          const on = option.value === sort;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setSort(option.value)}
              aria-pressed={on}
              data-static-hover
              className={`shrink-0 rounded-2xl px-3.5 py-2 text-[13px] ${
                on ? "bg-app-green font-bold text-white" : "bg-[#f3eee2] font-medium"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {sorted.length > 0 ? (
        <ul className="grid grid-cols-2 gap-4 p-6">
          {sorted.map((product) => (
            <li key={product.id} className="min-w-0">
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-6 py-16 text-center text-sm text-app-muted">Bu kateqoriyada hələ məhsul yoxdur.</p>
      )}

      <dialog
        ref={sheetRef}
        aria-label="Kateqoriyalar"
        className="mt-auto mb-0 w-full max-w-none rounded-t-3xl bg-white p-0 font-app text-app-ink backdrop:bg-black/40"
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
      >
        <div className="px-6 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-app-line" />
          <h2 className="font-app-display text-lg font-bold">Kateqoriyalar</h2>
          <ul className="mt-3 max-h-[60dvh] overflow-y-auto">
            {[{ slug: "", name_az: "Bütün məhsullar" }, ...categories].map((category) => {
              const on = (category.slug || undefined) === activeSlug;
              return (
                <li key={category.slug || "all"}>
                  <Link
                    href={category.slug ? `/shop?category=${category.slug}` : "/shop"}
                    onClick={() => sheetRef.current?.close()}
                    className={`flex items-center justify-between border-b border-app-line py-3.5 text-[15px] ${
                      on ? "font-bold text-app-green" : ""
                    }`}
                  >
                    {category.name_az}
                    {on ? <CheckIcon className="h-4 w-4" /> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </dialog>
    </div>
  );
}

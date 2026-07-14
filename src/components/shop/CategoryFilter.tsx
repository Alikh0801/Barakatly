import Link from "next/link";
import type { CategoryItem } from "@/types/shop";

export function CategoryFilter({
  categories,
  activeSlug,
}: {
  categories: CategoryItem[];
  activeSlug?: string;
}) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:overflow-visible md:px-0">
      <div className="flex w-max flex-nowrap gap-2 md:w-auto md:flex-wrap">
        <Link
          href="/shop"
          prefetch
          className={[
            "inline-flex shrink-0 items-center rounded-full px-4 py-2 text-sm font-medium ring-1 transition",
            !activeSlug
              ? "bg-emerald-600 text-white ring-emerald-600"
              : "bg-white text-zinc-700 ring-zinc-200 hover:bg-emerald-50",
          ].join(" ")}
        >
          Hamısı
        </Link>
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/shop?category=${category.slug}`}
            prefetch
            className={[
              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium ring-1 transition",
              activeSlug === category.slug
                ? "bg-emerald-600 text-white ring-emerald-600"
                : "bg-white text-zinc-700 ring-zinc-200 hover:bg-emerald-50",
            ].join(" ")}
          >
            {category.icon ? <span aria-hidden="true">{category.icon}</span> : null}
            {category.name_az}
          </Link>
        ))}
      </div>
    </div>
  );
}

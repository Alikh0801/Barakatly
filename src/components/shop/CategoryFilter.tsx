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
    <div className="space-y-1">
      <Link
        href="/shop"
        prefetch
        className={[
          "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium transition",
          !activeSlug
            ? "bg-emerald-50 text-emerald-800"
            : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
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
            "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium transition",
            activeSlug === category.slug
              ? "bg-emerald-50 text-emerald-800"
              : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
          ].join(" ")}
        >
          {category.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={category.image_url}
              alt=""
              className="h-5 w-5 shrink-0 rounded-full object-cover"
            />
          ) : category.icon ? (
            <span aria-hidden="true" className="shrink-0">
              {category.icon}
            </span>
          ) : null}
          <span className="truncate">{category.name_az}</span>
        </Link>
      ))}
    </div>
  );
}

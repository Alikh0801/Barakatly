import Link from "next/link";

const PRODUCTS = [
  {
    name: "Heirloom pomidor",
    farm: "Green Valley Farm",
    price: "$4.50",
    unit: "/kq",
    tags: ["Bestseller", "Orqanik"] as const,
    image:
      "https://images.unsplash.com/photo-1546470427-e26264be0b5a?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Vəhşi kəklikotu balı",
    farm: "Mountain Herbs Garden",
    price: "$18.00",
    unit: "/500qr",
    tags: ["Orqanik"] as const,
    image:
      "https://images.unsplash.com/photo-1471943311424-646960669fbc?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Çiyələk",
    farm: "Sunrise Orchard",
    price: "$6.00",
    unit: "/500qr",
    tags: ["Mövsümi"] as const,
    image:
      "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Livan nanəsi",
    farm: "Mountain Herbs Garden",
    price: "$2.50",
    unit: "/dəstə",
    tags: ["Orqanik"] as const,
    image:
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80",
  },
] as const;

function Tag({ text }: { text: string }) {
  const tone =
    text === "Bestseller"
      ? "bg-amber-100 text-amber-800 ring-amber-200"
      : text === "Mövsümi"
        ? "bg-rose-100 text-rose-800 ring-rose-200"
        : "bg-emerald-100 text-emerald-800 ring-emerald-200";
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1",
        tone,
      ].join(" ")}
    >
      {text}
    </span>
  );
}

function Rating() {
  return (
    <div className="flex items-center gap-1 text-amber-400" aria-label="5 / 5">
      <span aria-hidden="true">★</span>
      <span aria-hidden="true">★</span>
      <span aria-hidden="true">★</span>
      <span aria-hidden="true">★</span>
      <span aria-hidden="true">★</span>
      <span className="ml-1 text-xs text-zinc-500">(89)</span>
    </div>
  );
}

export function FreshThisWeekSection() {
  return (
    <section className="bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 md:px-6 md:py-16">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Bu həftə təzə
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              Fermerlərimizdən mövsümi seçimlər
            </p>
          </div>
          <Link
            href="/shop"
            className="hidden items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-100 sm:inline-flex"
          >
            Hamısına bax
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {PRODUCTS.map((p) => (
            <Link
              key={p.name}
              href="/shop"
              className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 transition hover:shadow-md"
            >
              <div className="relative overflow-hidden">
                <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1">
                  {p.tags.map((t) => (
                    <Tag key={t} text={t} />
                  ))}
                </div>
                <button
                  type="button"
                  className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-zinc-700 ring-1 ring-zinc-200 transition hover:bg-white"
                  aria-label="Sevimlilərə əlavə et"
                >
                  ♡
                </button>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.image}
                  alt=""
                  className="h-44 w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              </div>

              <div className="p-4">
                <div className="text-sm font-semibold text-zinc-900">
                  {p.name}
                </div>
                <div className="mt-1 text-xs text-zinc-500">{p.farm}</div>
                <div className="mt-2">
                  <Rating />
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-zinc-900">
                      {p.price}
                    </span>
                    <span className="text-xs text-zinc-500">{p.unit}</span>
                  </div>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-500"
                    aria-label="Səbətə əlavə et"
                  >
                    +
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 sm:hidden">
          <Link
            href="/shop"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-100"
          >
            Hamısına bax
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}


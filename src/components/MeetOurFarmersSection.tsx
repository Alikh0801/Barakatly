import Link from "next/link";
import { ImageWithSkeleton } from "@/components/ui/ImageWithSkeleton";
import { VerifiedIcon } from "@/components/ui/VerifiedIcon";

const FARMERS = [
  {
    name: "Əhməd Əliyev",
    farm: "Green Valley Farm",
    location: "Şəki, Azərbaycan",
    products: 34,
    verified: true,
    image:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Fatimə Məmmədova",
    farm: "Mountain Herbs Garden",
    location: "Quba, Azərbaycan",
    products: 21,
    verified: true,
    image:
      "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Xəlil Həsənov",
    farm: "Sunrise Orchard",
    location: "Gəncə, Azərbaycan",
    products: 28,
    verified: true,
    image:
      "https://images.unsplash.com/photo-1461354464878-ad92f492a5a0?auto=format&fit=crop&w=1200&q=80",
  },
] as const;

function Rating({ value }: { value: number }) {
  const full = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <div className="flex items-center gap-1" aria-label={`${full} / 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} aria-hidden="true" className="text-amber-400">
          {i < full ? "★" : "☆"}
        </span>
      ))}
      <span className="ml-1 text-xs text-zinc-500">({Math.floor(80 + value * 15)})</span>
    </div>
  );
}

export function MeetOurFarmersSection() {
  return (
    <section className="bg-[#faf9f5]">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 md:px-6 md:py-16">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Fermerlərimizlə tanış olun
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              Real insanlar, real təsərrüfatlar, real qida
            </p>
          </div>
          <Link
            href="/farmers"
            className="hidden items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-50 sm:inline-flex"
          >
            Hamısına bax
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {FARMERS.map((f) => (
            <Link
              key={f.name}
              href="/farmers"
              className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 transition hover:shadow-md"
            >
              <div className="relative h-36 overflow-hidden">
                <ImageWithSkeleton
                  src={f.image}
                  alt=""
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  skeletonClassName="rounded-none"
                />
                {f.verified ? (
                  <div className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-sm ring-1 ring-emerald-100">
                    <VerifiedIcon className="h-5 w-5" />
                  </div>
                ) : null}
              </div>

              <div className="p-4">
                <div className="text-sm font-semibold text-zinc-900">
                  {f.name}
                </div>
                <div className="mt-1 text-xs text-zinc-500">{f.farm}</div>
                <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
                  <span aria-hidden="true">📍</span>
                  <span>{f.location}</span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <Rating value={4.6} />
                  <div className="text-xs text-zinc-500">
                    {f.products} məhsul
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 sm:hidden">
          <Link
            href="/farmers"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-50"
          >
            Hamısına bax
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}


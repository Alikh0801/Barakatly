import Link from "next/link";
import type { Metadata } from "next";
import { Syne } from "next/font/google";
import { VerifiedIcon } from "@/components/ui/VerifiedIcon";
import { getPublicFarmers } from "@/lib/farmers/queries";

const displayFont = Syne({
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "Fermerlər — BARAKATLY",
  description:
    "Barakatly platformasında təsdiqlənmiş yerli fermerlər və təsərrüfatlar.",
};

export default async function FarmersPage() {
  const farmers = await getPublicFarmers();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-14">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1
            className={`${displayFont.className} text-3xl font-bold tracking-tight text-zinc-900`}
          >
            Fermerlər
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Təsərrüfat profilləri · məhsullar və paylaşımlar
          </p>
        </div>
        <Link
          href="/farmers/apply"
          className="inline-flex items-center justify-center rounded-full bg-[#1f5c3d] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#184a31]"
        >
          Fermer ol
        </Link>
      </div>

      {farmers.length === 0 ? (
        <div className="mt-12 max-w-xl">
          <p className="text-sm leading-6 text-zinc-600">
            Hazırda siyahıda göstəriləcək təsdiqlənmiş fermer yoxdur.
          </p>
        </div>
      ) : (
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {farmers.map((farmer) => (
            <li key={farmer.id}>
              <Link
                href={`/farmers/${farmer.id}`}
                prefetch
                className="group block overflow-hidden rounded-[1.5rem] bg-white shadow-sm ring-1 ring-zinc-200 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div
                  className="h-24"
                  style={{
                    background:
                      "linear-gradient(135deg, #0f2f22 0%, #1f5c3d 55%, #3f7a3a 100%)",
                  }}
                />
                <div className="relative px-4 pb-5 pt-0">
                  <div className="-mt-8 mb-3">
                    {farmer.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={farmer.avatar_url}
                        alt=""
                        className="h-16 w-16 rounded-full object-cover ring-4 ring-white"
                      />
                    ) : (
                      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#1a3d2b] text-xl font-semibold text-[#d7f5e3] ring-4 ring-white">
                        {farmer.farm_name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h2
                      className={`${displayFont.className} text-lg font-bold text-zinc-900 group-hover:text-[#1f5c3d]`}
                    >
                      {farmer.farm_name}
                    </h2>
                    {farmer.verified_at ? <VerifiedIcon /> : null}
                  </div>
                  {farmer.location_text ? (
                    <p className="mt-1 text-sm text-zinc-500">
                      {farmer.location_text}
                    </p>
                  ) : null}
                  {farmer.description ? (
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-600">
                      {farmer.description}
                    </p>
                  ) : null}
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[#1f5c3d]">
                    {farmer.productCount} məhsul · Profilə bax
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

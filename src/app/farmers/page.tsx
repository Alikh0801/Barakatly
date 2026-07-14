import Link from "next/link";
import type { Metadata } from "next";
import { VerifiedIcon } from "@/components/ui/VerifiedIcon";
import { getPublicFarmers } from "@/lib/farmers/queries";

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
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Fermerlər
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Təsdiqlənmiş təsərrüfatlar və yerli istehsalçılar
          </p>
        </div>
        <Link
          href="/farmers/apply"
          className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          Fermer ol
        </Link>
      </div>

      {farmers.length === 0 ? (
        <div className="mt-12 max-w-xl">
          <p className="text-sm leading-6 text-zinc-600">
            Hazırda siyahıda göstəriləcək təsdiqlənmiş fermer yoxdur. Tezliklə
            yeni təsərrüfatlar əlavə olunacaq — və ya siz ilklər arasında ola
            bilərsiniz.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-50"
            >
              Mağazaya keç
            </Link>
            <Link
              href="/farmers/apply"
              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              Müraciət et
            </Link>
          </div>
        </div>
      ) : (
        <ul className="mt-10 divide-y divide-zinc-200 border-y border-zinc-200">
          {farmers.map((farmer) => (
            <li key={farmer.id}>
              <Link
                href={`/farmers/${farmer.id}`}
                prefetch
                className="flex flex-col gap-3 py-6 transition hover:bg-zinc-50/80 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-zinc-900">
                      {farmer.farm_name}
                    </h2>
                    {farmer.verified_at ? <VerifiedIcon /> : null}
                  </div>
                  {farmer.location_text ? (
                    <p className="mt-1 text-sm text-zinc-600">
                      {farmer.location_text}
                    </p>
                  ) : null}
                  {farmer.description ? (
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
                      {farmer.description}
                    </p>
                  ) : null}
                </div>
                <div className="shrink-0 text-sm font-medium text-emerald-700">
                  {farmer.productCount} məhsul →
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

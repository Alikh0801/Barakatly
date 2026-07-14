import Link from "next/link";
import { VerifiedIcon } from "@/components/ui/VerifiedIcon";
import { getPublicFarmers } from "@/lib/farmers/queries";

export async function MeetOurFarmersSection() {
  const farmers = (await getPublicFarmers()).slice(0, 3);

  if (farmers.length === 0) {
    return null;
  }

  return (
    <section className="bg-[#faf9f5]">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 md:px-6 md:py-16">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Fermerlərimizlə tanış olun
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              Platformada təsdiqlənmiş təsərrüfatlar
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

        <ul className="mt-10 divide-y divide-zinc-200 border-y border-zinc-200">
          {farmers.map((farmer) => (
            <li
              key={farmer.id}
              className="flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-zinc-900">
                    {farmer.farm_name}
                  </h3>
                  {farmer.verified_at ? <VerifiedIcon className="h-5 w-5" /> : null}
                </div>
                {farmer.location_text ? (
                  <p className="mt-1 text-sm text-zinc-600">{farmer.location_text}</p>
                ) : null}
                {farmer.description ? (
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
                    {farmer.description}
                  </p>
                ) : null}
              </div>
              <p className="shrink-0 text-sm text-zinc-600">
                {farmer.productCount} məhsul
              </p>
            </li>
          ))}
        </ul>

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

import Link from "next/link";
import { displaySerif } from "@/lib/fonts";
import { FarmerCard } from "@/components/farmers/FarmerCard";
import { getFeaturedFarmers } from "@/lib/farmers/queries";

export async function MeetFarmersSection() {
  const farmers = await getFeaturedFarmers(3);
  if (farmers.length === 0) return null;

  return (
    <section className="bg-[#faf9f5]">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 md:px-6 md:py-16">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div className="min-w-0">
            <h2 className={`${displaySerif.className} text-3xl leading-tight text-zinc-900 sm:text-4xl`}>
              Fermerlərimizlə tanış olun
            </h2>
            <p className="mt-2 text-[15px] text-zinc-600">
              Real insanlar, real təsərrüfatlar, real qida
            </p>
          </div>
          <Link
            href="/farmers"
            prefetch
            data-static-hover
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border-[1.5px] border-[#2f7a3c] px-4 text-sm font-semibold text-[#2f7a3c] transition-colors hover:bg-[#2f7a3c] hover:text-white"
          >
            Hamısına bax
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="h-4 w-4">
              <path d="m7.5 5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

        <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {farmers.map((farmer, index) => (
            // Two columns on tablets: a third card would sit alone on its row.
            <li key={farmer.id} className={`min-w-0 ${index === 2 ? "sm:max-lg:hidden" : ""}`}>
              <FarmerCard farmer={farmer} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

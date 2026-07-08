import Link from "next/link";

export function AreYouAFarmerSection() {
  return (
    <section className="bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 md:px-6 md:py-16">
        <div className="rounded-3xl bg-white p-10 text-center ring-1 ring-zinc-200">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
            <span aria-hidden="true">🌿</span>
          </div>
          <h2 className="mt-5 text-2xl font-semibold tracking-tight text-zinc-900">
            Fermer­siniz?
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-zinc-600">
            Barakatly-a qoşulun və təzə, yerli məhsulu dəyərləndirən minlərlə
            müştəriyə birbaşa satış edin.
          </p>

          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/farmers/apply"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500"
            >
              Satışa başla
              <span aria-hidden="true">→</span>
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-50"
            >
              Daha çox
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}


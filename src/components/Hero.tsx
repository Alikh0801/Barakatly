import Link from "next/link";

function Chip({
  children,
  tone = "emerald",
}: {
  children: React.ReactNode;
  tone?: "emerald" | "blue";
}) {
  const styles =
    tone === "emerald"
      ? "bg-emerald-500/15 text-emerald-50 ring-emerald-300/25"
      : "bg-sky-500/15 text-sky-50 ring-sky-300/25";

  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 backdrop-blur-sm",
        styles,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-lg font-semibold text-white">{value}</span>
      <span className="text-xs text-white/70">{label}</span>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            // Remote image keeps repo text-only (no binary assets).
            "url(https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=2400&q=80)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/10" />
      <div className="absolute inset-0 bg-black/15" />

      <div className="relative mx-auto flex min-h-[74vh] w-full max-w-6xl items-end px-4 pb-12 pt-28 md:min-h-[82vh] md:px-6 md:pb-16 md:pt-32">
        <div className="w-full max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone="emerald">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              100% təzə məhsul
            </Chip>
            <Chip tone="blue">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-sky-300" />
              Təsdiqlənmiş fermerlər
            </Chip>
          </div>

          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-white drop-shadow-sm sm:text-5xl">
            Fermerdən,
            <br />
            <span className="text-emerald-300">birbaşa süfrənizə.</span>
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-6 text-white/80 sm:text-base">
            Mövsümi məhsulları birbaşa yerli fermerlərdən kəşf edin. Daha sağlam
            qidalanaraq icmanızı dəstəkləyin.
          </p>

          <div className="mt-6 flex w-full max-w-xl items-center gap-2 rounded-2xl bg-white/10 p-2 ring-1 ring-white/15 backdrop-blur-md">
            <div className="flex flex-1 items-center gap-2 rounded-xl bg-white/95 px-3 py-2">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-4 w-4 text-zinc-500"
              >
                <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
                <path d="M16.5 16.5 21 21" strokeLinecap="round" />
              </svg>
              <input
                aria-label="Məhsul axtar"
                placeholder="Pomidor, bal, göyərti… axtarın"
                className="w-full bg-transparent text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none"
              />
            </div>
            <Link
              href="/search"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-400"
            >
              Axtar
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-4 w-4"
              >
                <path
                  d="M5 12h12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="m13 6 6 6-6 6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-6">
            <Stat value="200+" label="Yerli fermer" />
            <Stat value="1,400+" label="Təzə məhsul" />
            <Stat value="15K+" label="Məmnun müştəri" />
          </div>
        </div>
      </div>
    </section>
  );
}


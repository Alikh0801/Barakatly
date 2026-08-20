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

export function Hero({
  title,
  highlight,
  body,
  chip1,
  chip2,
  primaryCtaLabel,
  secondaryCtaLabel,
  imageUrl,
}: {
  title: string;
  highlight: string;
  body: string;
  chip1: string;
  chip2: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  imageUrl: string;
}) {
  return (
    <section className="relative isolate min-h-dvh overflow-x-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${imageUrl})`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/10" />
      <div className="absolute inset-0 bg-black/15" />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-6xl flex-col items-center justify-center px-4 py-24 md:items-start md:px-6">
        <div className="w-full max-w-2xl text-center motion-safe:opacity-0 motion-safe:animate-[hero-fade-up_0.8s_cubic-bezier(0.16,1,0.3,1)_0.05s_forwards] md:text-left">
          <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
            <Chip tone="emerald">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-3.5 w-3.5 text-emerald-200"
              >
                <path
                  d="M12 3c3 3 4.5 6 4.5 8.5A4.5 4.5 0 0 1 12 16a4.5 4.5 0 0 1-4.5-4.5C7.5 9 9 6 12 3Z"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 16v5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {chip1}
            </Chip>
            <Chip tone="blue">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-3.5 w-3.5 text-sky-200"
              >
                <path
                  d="M12 3 4 7v6c0 5 4.2 8.8 8 8 3.8-.8 8-4.6 8-8V7l-8-4Z"
                  strokeLinejoin="round"
                />
                <path
                  d="m8.5 12 2.2 2.2L15.8 9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {chip2}
            </Chip>
          </div>

          <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-tight text-white drop-shadow-sm sm:text-4xl md:text-5xl">
            {title}
            <br />
            <span className="text-emerald-300">{highlight}</span>
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-6 text-white/80 sm:text-base">
            {body}
          </p>

          <form
            action="/search"
            className="mt-6 flex w-full max-w-xl flex-col gap-2 sm:flex-row"
          >
            <input
              type="search"
              name="q"
              placeholder="Məhsul və ya ferma axtar..."
              className="min-w-0 flex-1 rounded-xl border-0 bg-white px-4 py-3 text-sm text-zinc-900 outline-none ring-1 ring-white/30"
            />
            <button
              type="submit"
              className="shrink-0 cursor-pointer rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400"
            >
              Axtar
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 md:justify-start">
            <Link
              href="/shop"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-400"
            >
              {primaryCtaLabel}
            </Link>
            <Link
              href="/farmers/apply"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-white/10 px-5 text-sm font-semibold text-white ring-1 ring-white/20 backdrop-blur-sm transition hover:bg-white/15"
            >
              {secondaryCtaLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

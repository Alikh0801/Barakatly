import Image from "next/image";
import Link from "next/link";
import type { Viewport } from "next";
import { getAuthImageContent } from "@/lib/content/queries";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

function TrustChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-emerald-50 ring-1 ring-white/20 backdrop-blur-sm">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-3.5 w-3.5 text-emerald-300"
      >
        <path
          d="m5 13 4 4L19 7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {children}
    </span>
  );
}

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authImage = await getAuthImageContent();

  return (
    <div className="grid min-h-dvh bg-white md:grid-cols-2">
      <div className="relative hidden md:block">
        <Image
          src={authImage.items.imageUrl}
          alt="Barakatly — fermerdən süfrəyə"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/95 via-emerald-950/40 to-emerald-950/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/20" />

        <div className="relative flex h-full flex-col justify-between p-10 lg:p-14">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 font-semibold tracking-tight text-white"
          >
            <Image
              src="/logo/logo.png"
              alt="Barakatly"
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-white/20"
            />
            <span className="text-lg">Barakatly</span>
          </Link>

          <div className="max-w-md">
            <div className="flex flex-wrap gap-2">
              <TrustChip>100% təzə məhsul</TrustChip>
              <TrustChip>Təsdiqlənmiş fermerlər</TrustChip>
            </div>
            <h2 className="mt-6 text-3xl font-semibold leading-tight tracking-tight text-white lg:text-[2.5rem]">
              Fermerdən,
              <br />
              <span className="text-emerald-300">birbaşa süfrənizə.</span>
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/75 lg:text-[15px]">
              Yerli fermerlərdən təzə məhsulları kəşf edin, sifariş verin və
              icmanızı dəstəkləyin.
            </p>
          </div>
        </div>
      </div>

      <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[#faf9f5]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[28%] hidden h-[440px] w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-100/70 blur-3xl md:block"
        />

        <header className="relative z-10 shrink-0 border-b border-zinc-200 bg-white/80 backdrop-blur md:border-b-0 md:bg-transparent md:backdrop-blur-none">
          <div className="flex w-full items-center justify-between px-4 py-3 md:justify-end md:px-8 md:py-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-semibold tracking-tight text-emerald-800 md:hidden"
            >
              <Image
                src="/logo/logo.png"
                alt="Barakatly"
                width={32}
                height={32}
                className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-black/5"
              />
              Barakatly
            </Link>
            <Link
              href="/"
              className="text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
            >
              ← Ana səhifə
            </Link>
          </div>
        </header>

        <main className="relative z-10 flex flex-1 items-start justify-center overflow-y-auto px-4 py-8 sm:items-center sm:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}

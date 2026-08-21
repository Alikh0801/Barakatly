import Image from "next/image";
import Link from "next/link";
import type { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="grid min-h-dvh bg-[#faf9f5] md:grid-cols-2">
      <div className="relative hidden md:block">
        <Image
          src="/hero/kend.jpg"
          alt="Barakatly — fermerdən süfrəyə"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
      </div>

      <div className="flex min-h-dvh flex-col">
        <header className="shrink-0 border-b border-zinc-200 bg-white">
          <div className="flex w-full items-center justify-between px-4 py-3 md:px-6 md:py-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-semibold tracking-tight text-emerald-800"
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
              className="text-sm font-medium text-zinc-600 transition hover:text-zinc-900"
            >
              Ana səhifə
            </Link>
          </div>
        </header>

        <main className="flex flex-1 items-start justify-center overflow-y-auto px-4 py-8 sm:items-center sm:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}

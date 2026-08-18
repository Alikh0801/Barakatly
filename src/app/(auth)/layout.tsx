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
    <div className="flex min-h-dvh flex-col bg-[#faf9f5]">
      <header className="shrink-0 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
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
  );
}

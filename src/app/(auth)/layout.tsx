import Link from "next/link";
import type { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-[#faf9f5]">
      <header className="shrink-0 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-semibold tracking-tight text-emerald-800"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white">
              🌿
            </span>
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

      <main className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4">
        {children}
      </main>
    </div>
  );
}

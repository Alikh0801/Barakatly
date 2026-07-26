"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app.global-error]", error);
  }, [error]);

  return (
    <html lang="az">
      <body className="flex min-h-dvh flex-col items-center justify-center bg-white px-4 text-center text-zinc-900">
        <h1 className="text-2xl font-semibold tracking-tight">
          Nə isə səhv getdi
        </h1>
        <p className="mt-3 max-w-md text-sm text-zinc-600">
          Tətbiqdə gözlənilməz xəta baş verdi. Səhifəni yeniləyin.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-emerald-600 px-6 text-sm font-semibold text-white"
        >
          Yenidən cəhd et
        </button>
      </body>
    </html>
  );
}

"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app.error]", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-700">
        Xəta
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900">
        Nə isə səhv getdi
      </h1>
      <p className="mt-3 text-sm leading-6 text-zinc-600">
        Səhifəni yenidən yükləyin. Problem davam edərsə, bir az sonra yenidən
        cəhd edin.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 items-center justify-center rounded-full bg-emerald-600 px-6 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          Yenidən cəhd et
        </button>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200 transition hover:bg-emerald-50"
        >
          Ana səhifə
        </Link>
      </div>
    </div>
  );
}

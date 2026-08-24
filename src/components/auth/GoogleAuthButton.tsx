"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Spinner } from "@/components/ui/Spinner";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3.01h3.86c2.26-2.08 3.59-5.15 3.59-8.66Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.93l-3.86-3.01c-1.07.72-2.44 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.28v3.11C3.25 21.3 7.31 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.25a7.2 7.2 0 0 1 0-4.5V6.64H1.28a11.96 11.96 0 0 0 0 10.72l3.99-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.94 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.28 6.64l3.99 3.11C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

function GoogleRedirectHint() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const tooltipId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={tooltipId}
        aria-label="Google ilə giriş haqqında məlumat"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 ring-1 ring-zinc-200 transition hover:bg-zinc-50 hover:text-zinc-600"
      >
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
          <circle cx="10" cy="10" r="8.25" stroke="currentColor" strokeWidth="1.4" />
          <path
            d="M7.7 7.6c.2-.9 1-1.5 2.1-1.5 1.2 0 2.1.7 2.1 1.8 0 .9-.5 1.3-1.3 1.8-.7.4-1 .7-1 1.4v.2"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="9.6" cy="14" r="0.9" fill="currentColor" />
        </svg>
      </button>

      {open ? (
        <div
          id={tooltipId}
          role="dialog"
          className="absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-zinc-200/80 bg-white p-3.5 text-left text-sm leading-6 text-zinc-600 shadow-[0_16px_40px_-20px_rgba(24,24,27,0.45)]"
        >
          Google giriş zamanı ünvan çubuğunda saytımızın adı yerinə texniki
          bir domen (...supabase.co) görünə bilər. Bu normaldır — hesabınızın
          təhlükəsizliyini təmin edən doğrulanmış xidmətdir.
        </div>
      ) : null}
    </div>
  );
}

export function GoogleAuthButton({ next }: { next?: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setPending(true);
    setError("");

    const safeNext =
      next && next.startsWith("/") && !next.startsWith("//") ? next : "/shop";

    const supabase = createClient();
    const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}`,
        skipBrowserRedirect: true,
      },
    });

    if (oauthError || !data?.url) {
      console.error("[GoogleAuthButton]", oauthError?.message);
      setError("Google ilə giriş hazırda mövcud deyil.");
      setPending(false);
      return;
    }

    window.location.href = data.url;
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleClick}
          disabled={pending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? <Spinner className="h-4 w-4" /> : <GoogleIcon />}
          Google ilə davam et
        </button>
        <GoogleRedirectHint />
      </div>
      {error ? (
        <p className="mt-2 text-center text-sm text-rose-600">{error}</p>
      ) : null}
    </div>
  );
}

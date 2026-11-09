"use client";

import { useEffect, useRef, useState } from "react";

/**
 * "Tətbiqi yüklə": puts Barakatly on the phone's home screen.
 *
 * Chrome and Edge (Android, computer) hand the page an install prompt
 * (beforeinstallprompt), which the button opens. Safari has none, on the
 * iPhone or the Mac, nor do some other browsers: there the button explains
 * the two taps it takes. Inside the installed app the button is not shown.
 */

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Platform = "ios" | "android" | "mac-safari" | "desktop";

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  // iPadOS reports itself as a Mac; the touch screen gives it away.
  const iOS = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  if (iOS) return "ios";
  if (/Android/.test(ua)) return "android";
  if (/Safari/.test(ua) && !/Chrome|Chromium|Edg|OPR|Firefox/.test(ua)) return "mac-safari";
  return "desktop";
}

function isInstalledApp(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return Boolean(nav.standalone) || window.matchMedia("(display-mode: standalone)").matches;
}

function PhoneDownloadIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path d="M12 7v7" />
      <path d="m9 11 3 3 3-3" />
      <path d="M11 18.5h2" />
    </svg>
  );
}

/** The iPhone's share icon, as Safari draws it, for the instructions. */
function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="inline h-4 w-4 align-[-2px] text-sky-600"
    >
      <path d="M12 3v12" />
      <path d="m8 7 4-4 4 4" />
      <path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
    </svg>
  );
}

function Steps({ platform }: { platform: Platform }) {
  if (platform === "ios") {
    return (
      <ol className="list-decimal space-y-2 pl-5">
        <li>
          Saytı <strong>Safari</strong>-də açın.
        </li>
        <li>
          Safari-nin <strong>Paylaş</strong> düyməsinə <ShareIcon /> toxunun.
        </li>
        <li>
          <strong>“Ana ekrana əlavə et”</strong> seçin və <strong>“Əlavə et”</strong>-ə basın.
        </li>
      </ol>
    );
  }
  if (platform === "android") {
    return (
      <ol className="list-decimal space-y-2 pl-5">
        <li>
          Brauzerin menyusunu (<strong>⋮</strong>) açın.
        </li>
        <li>
          <strong>“Tətbiqi quraşdır”</strong> və ya <strong>“Ana ekrana əlavə et”</strong> seçin.
        </li>
      </ol>
    );
  }
  if (platform === "mac-safari") {
    return (
      <ol className="list-decimal space-y-2 pl-5">
        <li>
          Yuxarı menyuda <strong>File</strong> (Fayl) açın.
        </li>
        <li>
          <strong>“Add to Dock”</strong> seçin.
        </li>
      </ol>
    );
  }
  return (
    <ol className="list-decimal space-y-2 pl-5">
      <li>
        Saytı <strong>Chrome</strong> və ya <strong>Edge</strong>-də açın.
      </li>
      <li>
        Ünvan zolağının sağındakı <strong>quraşdır</strong> ikonuna basın.
      </li>
      <li>Telefonda isə saytı açıb brauzerin menyusundan “Ana ekrana əlavə et” seçin.</li>
    </ol>
  );
}

export function InstallAppButton({
  variant,
  className = "",
}: {
  variant: "hero" | "footer";
  className?: string;
}) {
  const [installed, setInstalled] = useState(false);
  const [platform, setPlatform] = useState<Platform>("desktop");
  const promptRef = useRef<InstallPromptEvent | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- navigator exists only
       in the browser; the server renders the button for everyone. */
    setInstalled(isInstalledApp());
    setPlatform(detectPlatform());
    /* eslint-enable react-hooks/set-state-in-effect */

    const onPrompt = (event: Event) => {
      // Keep it for the button instead of the browser's own banner.
      event.preventDefault();
      promptRef.current = event as InstallPromptEvent;
    };
    const onInstalled = () => {
      promptRef.current = null;
      setInstalled(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  async function install() {
    const prompt = promptRef.current;
    if (prompt) {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      // A prompt works once; the browser offers a new one later if needed.
      promptRef.current = null;
      if (outcome === "accepted") setInstalled(true);
      return;
    }
    dialogRef.current?.showModal();
  }

  const look =
    variant === "hero"
      ? "h-11 rounded-xl bg-white/10 px-5 text-white ring-1 ring-white/20 backdrop-blur-sm hover:bg-white/15"
      : "h-10 rounded-full bg-white/10 px-4 text-white ring-1 ring-white/15 hover:bg-white/15";

  return (
    <>
      <button
        type="button"
        onClick={install}
        className={`inline-flex items-center justify-center gap-2 text-sm font-semibold transition app:hidden ${look} ${className}`}
      >
        <PhoneDownloadIcon className="h-[18px] w-[18px]" />
        Tətbiqi yüklə
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="install-app-title"
        className="m-auto w-[min(92vw,24rem)] rounded-2xl bg-white p-0 text-left text-zinc-800 shadow-2xl backdrop:bg-black/50"
        onClick={(event) => {
          // A tap outside the card closes it.
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
      >
        <div className="p-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <PhoneDownloadIcon className="h-6 w-6" />
            </span>
            <h2 id="install-app-title" className="text-lg font-semibold text-zinc-900">
              Barakatly tətbiqi
            </h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            Telefonunuzun ana ekranına əlavə edin: tam ekranda, bir toxunuşla açılır.
          </p>
          <div className="mt-4 text-sm leading-6 text-zinc-700">
            <Steps platform={platform} />
          </div>
          <form method="dialog" className="mt-6">
            <button
              type="submit"
              className="h-11 w-full rounded-xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              Aydındır
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
}

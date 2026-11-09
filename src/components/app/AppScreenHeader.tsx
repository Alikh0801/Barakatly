"use client";

import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@/components/app/icons";

/**
 * The installed app's screen header (Figma "header"): a round back button,
 * the title in the middle and an optional button on the right. It carries
 * data-app-screen, so the website's own header steps aside in the app.
 * Shown only in the app.
 */
export function AppScreenHeader({
  title,
  fallback = "/",
  right,
}: {
  title: string;
  /** Where "back" goes when the app was opened straight on this screen. */
  fallback?: string;
  right?: React.ReactNode;
}) {
  const router = useRouter();

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push(fallback);
  }

  return (
    <header data-app-screen className="hidden h-14 items-center justify-between gap-3 px-4 font-app text-app-ink app:flex">
      <button
        type="button"
        onClick={goBack}
        aria-label="Geri"
        data-static-hover
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f3eee2]"
      >
        <ArrowLeftIcon className="h-5 w-5" />
      </button>
      <h1 className="min-w-0 truncate font-app-display text-xl font-bold">{title}</h1>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center">{right}</span>
    </header>
  );
}

import Link from "next/link";
import { Suspense } from "react";
import { getProfile } from "@/lib/auth/session";
import { getUnreadNotificationCount } from "@/lib/notifications/queries";
import { Skeleton } from "@/components/ui/Skeleton";

async function NotificationBellInner({
  variant,
}: {
  variant: "hero" | "solid";
}) {
  const profile = await getProfile();
  if (!profile) return null;

  const unread = await getUnreadNotificationCount();
  const iconWrap =
    variant === "hero"
      ? "relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/15 backdrop-blur-sm transition hover:bg-white/15"
      : "relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200 transition hover:bg-zinc-200";

  return (
    <Link
      href="/notifications"
      prefetch
      aria-label="Bildirişlər"
      className={iconWrap}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-4 w-4"
      >
        <path
          d="M6 9a6 6 0 1 1 12 0c0 3.5 1.5 5 2 6H4c.5-1 2-2.5 2-6Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M10 19a2 2 0 0 0 4 0" strokeLinecap="round" />
      </svg>
      {unread > 0 ? (
        <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-semibold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
    </Link>
  );
}

function NotificationBellSkeleton({
  variant,
}: {
  variant: "hero" | "solid";
}) {
  return (
    <Skeleton
      className={[
        "h-9 w-9 rounded-full",
        variant === "hero" ? "bg-white/20" : "bg-zinc-200",
      ].join(" ")}
    />
  );
}

export function NotificationBell({
  variant = "solid",
}: {
  variant?: "hero" | "solid";
}) {
  return (
    <Suspense fallback={<NotificationBellSkeleton variant={variant} />}>
      <NotificationBellInner variant={variant} />
    </Suspense>
  );
}

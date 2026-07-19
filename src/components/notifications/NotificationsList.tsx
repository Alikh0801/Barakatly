"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications/actions";
import {
  getNotificationActionLabel,
  getNotificationHref,
} from "@/lib/notifications/links";
import { getNotificationTypeLabel } from "@/lib/orders/labels";
import type { Notification, UserRole } from "@/types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("az-AZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function NotificationsList({
  notifications,
  viewerRole,
}: {
  notifications: Notification[];
  viewerRole: UserRole;
}) {
  const router = useRouter();

  if (notifications.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-zinc-200">
        <p className="text-lg font-medium text-zinc-900">Bildiriş yoxdur</p>
        <p className="mt-2 text-sm text-zinc-500">
          Sifariş və ödəniş yenilikləri burada görünəcək.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={async () => {
            await markAllNotificationsRead();
            router.refresh();
          }}
          className="text-sm font-medium text-emerald-700 hover:underline"
        >
          Hamısını oxunmuş et
        </button>
      </div>

      <div className="space-y-3">
        {notifications.map((notification) => {
          const href = getNotificationHref(notification, viewerRole);
          const actionLabel = getNotificationActionLabel(
            notification,
            viewerRole,
          );
          const unread = !notification.read_at;

          return (
            <article
              key={notification.id}
              className={[
                "rounded-2xl p-5 shadow-sm ring-1 transition",
                unread
                  ? "bg-emerald-50/60 ring-emerald-200"
                  : "bg-white ring-zinc-200",
              ].join(" ")}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    {getNotificationTypeLabel(notification.type)}
                  </div>
                  <h2 className="mt-1 font-semibold text-zinc-900">
                    {notification.title}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-600">{notification.body}</p>
                  <p className="mt-2 text-xs text-zinc-500">
                    {formatDate(notification.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {href ? (
                    <Link
                      href={href}
                      prefetch
                      className="text-sm font-medium text-emerald-700 hover:underline"
                    >
                      {actionLabel}
                    </Link>
                  ) : null}
                  {unread ? (
                    <button
                      type="button"
                      onClick={async () => {
                        await markNotificationRead(notification.id);
                        router.refresh();
                      }}
                      className="text-sm text-zinc-600 hover:text-zinc-900"
                    >
                      Oxundu
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

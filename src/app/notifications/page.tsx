import Link from "next/link";
import { redirect } from "next/navigation";
import { SolidPageShell } from "@/components/layout/SolidPageShell";
import { NotificationsList } from "@/components/notifications/NotificationsList";
import { getNotifications } from "@/lib/notifications/queries";
import { getProfile } from "@/lib/auth/session";

export const metadata = {
  title: "Bildirişlər — BARAKATLY",
};

export default async function NotificationsPage() {
  const profile = await getProfile();
  if (!profile) {
    redirect("/signin?next=/notifications");
  }

  const notifications = await getNotifications();

  return (
    <SolidPageShell>
      <div className="mx-auto w-full max-w-3xl px-4 py-10 md:px-6 md:py-12">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Bildirişlər
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Sifariş və ödəniş yenilikləriniz
        </p>
        <div className="mt-8">
          <NotificationsList notifications={notifications} />
        </div>
        <div className="mt-8">
          <Link
            href="/orders"
            prefetch
            className="text-sm font-medium text-emerald-700 hover:underline"
          >
            ← Sifarişlərimə qayıt
          </Link>
        </div>
      </div>
    </SolidPageShell>
  );
}

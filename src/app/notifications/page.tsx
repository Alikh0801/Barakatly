import Link from "next/link";
import { redirect } from "next/navigation";
import { AppScreenHeader } from "@/components/app/AppScreenHeader";
import { SolidPageShell } from "@/components/layout/SolidPageShell";
import { NotificationsList } from "@/components/notifications/NotificationsList";
import { getNotifications } from "@/lib/notifications/queries";
import { resolvePendingActionNotificationIds } from "@/lib/notifications/pending";
import { getProfile } from "@/lib/auth/session";

export const metadata = {
  title: "Bildirişlər",
};

function backLinkForRole(role: string) {
  switch (role) {
    case "admin":
      return { href: "/admin/payments", label: "← Admin panelə qayıt" };
    case "farmer":
      return { href: "/farmer", label: "← Fermer panelə qayıt" };
    case "courier":
      return { href: "/courier", label: "← Kuryer panelə qayıt" };
    default:
      return { href: "/orders", label: "← Sifarişlərimə qayıt" };
  }
}

export default async function NotificationsPage() {
  const profile = await getProfile();
  if (!profile) {
    redirect("/signin?next=/notifications");
  }

  const notifications = await getNotifications();
  const pendingActionIds = await resolvePendingActionNotificationIds(notifications);
  const back = backLinkForRole(profile.role);

  return (
    <SolidPageShell>
      <AppScreenHeader title="Bildirişlər" fallback={back.href} />
      <div className="mx-auto w-full max-w-3xl px-4 py-10 md:px-6 md:py-12 app:px-6 app:pt-2 app:pb-8 app:font-app">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 app:hidden">
          Bildirişlər
        </h1>
        <p className="mt-2 text-sm text-zinc-500 app:hidden">
          Sifariş və ödəniş yenilikləriniz
        </p>
        <div className="mt-8 app:mt-0">
          <NotificationsList
            notifications={notifications}
            viewerRole={profile.role}
            pendingActionIds={[...pendingActionIds]}
          />
        </div>
        <div className="mt-8 app:hidden">
          <Link
            href={back.href}
            prefetch
            className="text-sm font-medium text-emerald-700 hover:underline"
          >
            {back.label}
          </Link>
        </div>
      </div>
    </SolidPageShell>
  );
}

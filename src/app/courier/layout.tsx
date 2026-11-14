import type { Metadata } from "next";
import { AppGreeting } from "@/components/app/AppGreeting";
import { AppPortalNav } from "@/components/app/AppPortalNav";
import { PortalShell } from "@/components/layout/PortalShell";
import { requireCourier } from "@/lib/courier/auth";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function CourierLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { profile } = await requireCourier();
  const links = [
    { href: "/courier", label: "Növbə" },
    { href: "/courier/history", label: "Tarixçə" },
  ];

  return (
    <PortalShell title="Kuryer · Barakatly" links={links} hideHeaderInApp>
      {/* The installed app's top, in place of the portal header. */}
      <AppGreeting fullName={profile.full_name} profileHref="/account" fallbackName="Kuryer" />
      <AppPortalNav links={links} />
      {children}
    </PortalShell>
  );
}

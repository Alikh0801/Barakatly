import type { Metadata } from "next";
import { PortalShell } from "@/components/layout/PortalShell";
import { requireCourier } from "@/lib/courier/auth";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function CourierLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireCourier();

  return (
    <PortalShell
      title="Kuryer · Barakatly"
      links={[{ href: "/courier", label: "Növbə" }]}
    >
      {children}
    </PortalShell>
  );
}

import { PortalShell } from "@/components/layout/PortalShell";
import { requireCourier } from "@/lib/courier/auth";

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

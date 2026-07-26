import type { Metadata } from "next";
import { PortalShell } from "@/components/layout/PortalShell";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function FarmerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <PortalShell
      title="Fermer · Barakatly"
      links={[
        { href: "/farmer", label: "Profil" },
        { href: "/farmer/products", label: "Məhsullar" },
        { href: "/farmer/orders", label: "Sifarişlər" },
      ]}
    >
      {children}
    </PortalShell>
  );
}

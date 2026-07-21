import { PortalShell } from "@/components/layout/PortalShell";

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

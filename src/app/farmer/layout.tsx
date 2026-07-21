import { PortalShell } from "@/components/layout/PortalShell";

export default function FarmerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <PortalShell
      title="Fermer · Barakatly"
      links={[
        { href: "/farmer?tab=posts", label: "Profil" },
        { href: "/farmer?tab=products", label: "Məhsullar" },
        { href: "/farmer?tab=orders", label: "Sifarişlər" },
        { href: "/farmer?tab=about", label: "Redaktə" },
      ]}
    >
      {children}
    </PortalShell>
  );
}

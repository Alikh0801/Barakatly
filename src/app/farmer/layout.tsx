import type { Metadata } from "next";
import { PortalShell } from "@/components/layout/PortalShell";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function FarmerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <PortalShell title="Fermer · Barakatly" links={[]} hideNav>
      {children}
    </PortalShell>
  );
}

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export function SolidPageShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#faf9f5]">
      <SiteHeader variant="solid" />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

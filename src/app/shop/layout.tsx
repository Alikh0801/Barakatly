import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function ShopLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col bg-[#faf9f5]">
      <SiteHeader variant="solid" />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

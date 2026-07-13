import { CartView } from "@/components/cart/CartView";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata = {
  title: "Səbət — BARAKATLY",
};

export default function CartPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#faf9f5]">
      <SiteHeader variant="solid" />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-12">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Səbət
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Seçdiyiniz məhsulları yoxlayın və sifarişə keçin
          </p>
          <div className="mt-8">
            <CartView />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

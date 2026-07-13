import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getActiveBanks } from "@/lib/checkout/queries";
import { getProfile } from "@/lib/auth/session";

export const metadata = {
  title: "Ödəniş — BARAKATLY",
};

export default async function CheckoutPage() {
  const profile = await getProfile();

  if (!profile) {
    redirect("/signin?next=/checkout");
  }

  const banks = await getActiveBanks();

  return (
    <div className="flex min-h-screen flex-col bg-[#faf9f5]">
      <SiteHeader variant="solid" />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-12">
          <Link
            href="/cart"
            className="text-sm font-medium text-emerald-700 hover:underline"
          >
            ← Səbətə qayıt
          </Link>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900">
            Ödəniş
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Əlaqə məlumatlarınızı doldurun, bank seçin və çeki yükləyin
          </p>
          <div className="mt-8">
            <CheckoutForm banks={banks} defaultPhone={profile.phone} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

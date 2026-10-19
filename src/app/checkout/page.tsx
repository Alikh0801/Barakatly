import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { SolidPageShell } from "@/components/layout/SolidPageShell";
import { getActiveBanks, getSavedAddresses } from "@/lib/checkout/queries";
import { getProfile } from "@/lib/auth/session";
import { getCartItems } from "@/lib/cart/queries";
import { getAppliedPromo } from "@/lib/promo/server";
import { displaySerif } from "@/lib/fonts";

export const metadata = {
  title: "Ödəniş",
};

export default async function CheckoutPage() {
  const [profile, banks] = await Promise.all([getProfile(), getActiveBanks()]);

  if (!profile) {
    redirect("/signin?next=/checkout");
  }

  const [items, promo, savedAddresses] = await Promise.all([
    getCartItems(),
    getAppliedPromo(),
    getSavedAddresses(profile.id),
  ]);

  return (
    <SolidPageShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-12">
        <Link
          href="/cart"
          prefetch
          className="text-sm font-medium text-emerald-700 hover:underline"
        >
          ← Səbətə qayıt
        </Link>
        <h1 className={`${displaySerif.className} mt-4 text-3xl tracking-tight text-zinc-900 md:text-4xl`}>
          Sifarişi rəsmiləşdir
        </h1>
        <div className="mt-6">
          <CheckoutForm
            banks={banks}
            defaultPhone={profile.phone}
            defaultName={profile.full_name}
            savedAddresses={savedAddresses}
            items={items}
            userId={profile.id}
            promo={promo}
          />
        </div>
      </div>
    </SolidPageShell>
  );
}

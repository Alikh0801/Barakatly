import Link from "next/link";
import { CartView } from "@/components/cart/CartView";
import { SolidPageShell } from "@/components/layout/SolidPageShell";
import { getSessionUser } from "@/lib/auth/session";
import { getCartItems } from "@/lib/cart/queries";

export const metadata = {
  title: "Səbət — BARAKATLY",
};

export default async function CartPage() {
  const user = await getSessionUser();

  return (
    <SolidPageShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-12">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Səbət
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Seçdiyiniz məhsulları yoxlayın və sifarişə keçin
        </p>
        <div className="mt-8">
          {user ? (
            <CartView items={await getCartItems()} />
          ) : (
            <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-zinc-200">
              <p className="text-lg font-medium text-zinc-900">
                Səbətinizi görmək üçün daxil olun
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                Səbətiniz hesabınıza bağlıdır — istənilən cihazdan daxil olub
                davam edə bilərsiniz.
              </p>
              <Link
                href="/signin?next=/cart"
                className="mt-6 inline-flex rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                Daxil ol
              </Link>
            </div>
          )}
        </div>
      </div>
    </SolidPageShell>
  );
}

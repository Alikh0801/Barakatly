import { Suspense } from "react";
import { redirect } from "next/navigation";
import { SolidPageShell } from "@/components/layout/SolidPageShell";
import { OrdersList } from "@/components/orders/OrdersList";
import { OrderListSkeleton } from "@/components/skeletons";
import { getProfile } from "@/lib/auth/session";

export const metadata = {
  title: "Sifarişlərim — BARAKATLY",
};

export default async function OrdersPage() {
  const profile = await getProfile();

  if (!profile) {
    redirect("/signin?next=/orders");
  }

  return (
    <SolidPageShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-12">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Sifarişlərim
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Keçmiş sifarişlərinizi və ödəniş statusunu izləyin
        </p>

        <Suspense
          fallback={
            <div className="mt-8">
              <OrderListSkeleton />
            </div>
          }
        >
          <OrdersList />
        </Suspense>
      </div>
    </SolidPageShell>
  );
}

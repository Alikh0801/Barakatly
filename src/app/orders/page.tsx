import { Suspense } from "react";
import { redirect } from "next/navigation";
import { SolidPageShell } from "@/components/layout/SolidPageShell";
import { OrdersList } from "@/components/orders/OrdersList";
import { OrderListSkeleton } from "@/components/skeletons";
import { getProfile } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata = {
  title: "Sifarişlərim",
};

export default async function OrdersPage() {
  const profile = await getProfile();

  if (!profile) {
    redirect("/signin?next=/orders");
  }

  return (
    <SolidPageShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-12">
        <PageHeader title="Sifarişlərim" description="Keçmiş sifarişlərinizi və ödəniş statusunu izləyin" />

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

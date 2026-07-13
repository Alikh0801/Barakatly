import { SolidPageShell } from "@/components/layout/SolidPageShell";
import { OrdersPageSkeleton } from "@/components/skeletons";

export default function OrdersLoading() {
  return (
    <SolidPageShell>
      <OrdersPageSkeleton />
    </SolidPageShell>
  );
}

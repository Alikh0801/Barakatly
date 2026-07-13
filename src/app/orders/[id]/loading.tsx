import { SolidPageShell } from "@/components/layout/SolidPageShell";
import { OrderDetailSkeleton } from "@/components/skeletons";

export default function OrderDetailLoading() {
  return (
    <SolidPageShell>
      <OrderDetailSkeleton />
    </SolidPageShell>
  );
}

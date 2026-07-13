import { SolidPageShell } from "@/components/layout/SolidPageShell";
import { CheckoutPageSkeleton } from "@/components/skeletons";

export default function CheckoutLoading() {
  return (
    <SolidPageShell>
      <CheckoutPageSkeleton />
    </SolidPageShell>
  );
}

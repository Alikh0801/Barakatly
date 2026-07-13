import { SolidPageShell } from "@/components/layout/SolidPageShell";
import { CartPageSkeleton } from "@/components/skeletons";

export default function CartLoading() {
  return (
    <SolidPageShell>
      <CartPageSkeleton />
    </SolidPageShell>
  );
}

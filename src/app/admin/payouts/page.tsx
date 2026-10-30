import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminPayoutsPanel } from "@/components/admin/AdminPayoutsPanel";
import { requireAdmin } from "@/lib/admin/auth";
import {
  getAdminPayouts,
  getPayoutDebts,
  getPayoutFarmers,
  type PayoutFilter,
} from "@/lib/admin/payout-queries";

export const metadata = { title: "Fermer ödənişləri - Admin" };

function parseFilter(value?: string): PayoutFilter {
  return value === "paid" || value === "all" ? value : "pending";
}

export default async function AdminPayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; farmer?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const filter = parseFilter(params.status);
  const farmerId = params.farmer?.trim() || null;

  const [payouts, debts, farmers] = await Promise.all([
    getAdminPayouts(filter, farmerId),
    getPayoutDebts(),
    getPayoutFarmers(),
  ]);

  return (
    <AdminPageShell title="Fermer ödənişləri">
      <AdminPayoutsPanel
        payouts={payouts}
        debts={debts}
        farmers={farmers}
        filter={filter}
        farmerId={farmerId}
      />
    </AdminPageShell>
  );
}

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { PendingPaymentsPanel } from "@/components/admin/AdminPanels";
import { getPendingPayments } from "@/lib/admin/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Ödənişlər — Admin",
};

export default async function AdminPaymentsPage() {
  const payments = await getPendingPayments();
  const supabase = await createClient();

  const paymentsWithReceipts = await Promise.all(
    payments.map(async (payment) => {
      let receiptSignedUrl: string | null = null;
      if (payment.receipt_url) {
        const { data } = await supabase.storage
          .from("payment-receipts")
          .createSignedUrl(payment.receipt_url, 3600);
        receiptSignedUrl = data?.signedUrl ?? null;
      }
      return { ...payment, receiptSignedUrl };
    })
  );

  return (
    <AdminPageShell
      title="Ödənişlər"
      description="Gözləyən çekləri yoxlayın, təsdiqləyin və ya rədd edin"
    >
      <PendingPaymentsPanel payments={paymentsWithReceipts} />
    </AdminPageShell>
  );
}

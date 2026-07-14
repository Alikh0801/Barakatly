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
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
        Gözləyən ödənişlər
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        Çekləri yoxlayın, təsdiqləyin və ya rədd edin
      </p>
      <div className="mt-8">
        <PendingPaymentsPanel payments={paymentsWithReceipts} />
      </div>
    </div>
  );
}

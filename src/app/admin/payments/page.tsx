import { AdminBanksPanel } from "@/components/admin/AdminBanksPanel";
import { PendingPaymentsPanel } from "@/components/admin/AdminPanels";
import { getAdminBanks, getPendingPayments } from "@/lib/admin/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Ödənişlər — Admin",
};

export default async function AdminPaymentsPage() {
  const [payments, banks] = await Promise.all([
    getPendingPayments(),
    getAdminBanks(),
  ]);
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
    <div className="w-full space-y-10 px-4 py-8 md:px-8 md:py-10">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Ödənişlər
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Kart məlumatlarını idarə edin və gözləyən çekləri yoxlayın
        </p>
      </section>

      <section>
        <AdminBanksPanel banks={banks} />
      </section>

      <section>
        <h2 className="text-xl font-semibold text-zinc-900">
          Gözləyən ödənişlər
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          Çekləri yoxlayın, təsdiqləyin və ya rədd edin
        </p>
        <div className="mt-5">
          <PendingPaymentsPanel payments={paymentsWithReceipts} />
        </div>
      </section>
    </div>
  );
}

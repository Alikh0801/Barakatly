"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { normalizePan } from "@/lib/admin/bank-format";
import { createClient } from "@/lib/supabase/server";

export type PayoutActionState = { error?: string; success?: string };

const NOTE_MAX = 300;

function revalidatePayouts() {
  revalidatePath("/admin/payouts");
  revalidatePath("/farmer");
}

/** Records that the farmer has been paid. */
export async function markPayoutPaid(
  _prev: PayoutActionState,
  formData: FormData,
): Promise<PayoutActionState> {
  const admin = await requireAdmin();
  const payoutId = String(formData.get("payout_id") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (!payoutId) return { error: "Ödəniş tapılmadı." };
  if (note.length > NOTE_MAX) return { error: `Qeyd ən çox ${NOTE_MAX} simvol ola bilər.` };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("farmer_payouts")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      paid_by: admin.id,
      note: note || null,
    })
    .eq("id", payoutId)
    .eq("status", "pending")
    .select("id");

  if (error) {
    console.error("[admin.markPayoutPaid]", error.message);
    return { error: "Ödəniş qeyd olunmadı." };
  }
  if (!data || data.length === 0) return { error: "Bu ödəniş artıq ödənilib." };

  revalidatePayouts();
  return { success: "Ödənildi kimi qeyd olundu." };
}

/** Undoes a "paid" pressed by mistake. */
export async function revertPayout(
  _prev: PayoutActionState,
  formData: FormData,
): Promise<PayoutActionState> {
  await requireAdmin();
  const payoutId = String(formData.get("payout_id") ?? "");
  if (!payoutId) return { error: "Ödəniş tapılmadı." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("farmer_payouts")
    .update({ status: "pending", paid_at: null, paid_by: null })
    .eq("id", payoutId)
    .eq("status", "paid")
    .select("id");

  if (error) {
    console.error("[admin.revertPayout]", error.message);
    return { error: "Ödəniş geri qaytarılmadı." };
  }
  if (!data || data.length === 0) return { error: "Bu ödəniş artıq gözləyir." };

  revalidatePayouts();
  return { success: "Ödəniş yenidən gözləyənlərə qaytarıldı." };
}

/**
 * Saves the card a farmer is paid to. Their pending payouts that were made
 * without a card get it too: they copy the card when created, so they would
 * otherwise keep showing "Kart yoxdur".
 */
export async function saveFarmerPayoutAccount(
  _prev: PayoutActionState,
  formData: FormData,
): Promise<PayoutActionState> {
  await requireAdmin();
  const farmerId = String(formData.get("farmer_id") ?? "");
  const bankName = String(formData.get("bank_name") ?? "").trim();
  const pan = normalizePan(String(formData.get("pan_number") ?? ""));

  if (!farmerId) return { error: "Fermer tapılmadı." };
  if (!bankName) return { error: "Bankın adını yazın." };
  if (bankName.length > 60) return { error: "Bankın adı çox uzundur." };
  if (!pan) return { error: "Kart nömrəsi 16 rəqəm olmalıdır." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("farmer_payout_accounts")
    .upsert(
      { farmer_id: farmerId, bank_name: bankName, pan_number: pan, is_active: true },
      { onConflict: "farmer_id" },
    );

  if (error) {
    console.error("[admin.saveFarmerPayoutAccount]", error.message);
    return { error: "Kart saxlanılmadı." };
  }

  const { error: payoutsError } = await supabase
    .from("farmer_payouts")
    .update({ bank_name: bankName, pan_number: pan })
    .eq("farmer_id", farmerId)
    .eq("status", "pending")
    .or("pan_number.is.null,pan_number.eq.");

  if (payoutsError) {
    console.error("[admin.saveFarmerPayoutAccount.payouts]", payoutsError.message);
    return { error: "Kart saxlanıldı, amma gözləyən ödənişlərə yazılmadı." };
  }

  revalidatePayouts();
  return { success: "Kart saxlanıldı." };
}

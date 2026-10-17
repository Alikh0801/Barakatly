"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { PROMO_CODE_PATTERN, normalizePromoCode } from "@/lib/promo/constants";
import { createClient } from "@/lib/supabase/server";

export type AdminPromoActionState = { error?: string; success?: string };

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function revalidatePromoCodes() {
  revalidatePath("/admin/promo-codes");
  revalidatePath("/cart");
  revalidatePath("/checkout");
}

function readMoney(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").trim().replace(",", ".");
  if (!text) return null;
  const number = Number(text);
  return Number.isFinite(number) ? Math.round(number * 100) / 100 : NaN;
}

/** Creates a code, or updates the one named by `id`. */
export async function savePromoCode(
  _prev: AdminPromoActionState,
  formData: FormData,
): Promise<AdminPromoActionState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const code = normalizePromoCode(String(formData.get("code") ?? ""));
  const name = String(formData.get("name") ?? "").trim();
  const discountType = String(formData.get("discount_type") ?? "");
  const discountValue = readMoney(formData.get("discount_value"));
  const minOrder = readMoney(formData.get("min_order_amount"));
  const maxUsesText = String(formData.get("max_uses") ?? "").trim();
  const expiresOn = String(formData.get("expires_on") ?? "").trim();

  if (!PROMO_CODE_PATTERN.test(code)) {
    return { error: "Kod 3–30 simvol olmalıdır: yalnız latın hərfləri, rəqəmlər, - və _." };
  }
  if (!name) return { error: "Promokodun adını yazın." };
  if (name.length > 80) return { error: "Ad ən çox 80 simvol ola bilər." };
  if (discountType !== "percent" && discountType !== "fixed") {
    return { error: "Endirim növünü seçin." };
  }
  if (discountValue === null || Number.isNaN(discountValue) || discountValue <= 0) {
    return { error: "Endirimin dəyərini düzgün yazın." };
  }
  if (discountType === "percent" && discountValue > 100) {
    return { error: "Faiz endirimi 100%-dən çox ola bilməz." };
  }
  if (minOrder !== null && (Number.isNaN(minOrder) || minOrder < 0)) {
    return { error: "Minimum sifariş məbləğini düzgün yazın." };
  }
  let maxUses: number | null = null;
  if (maxUsesText) {
    maxUses = Number(maxUsesText);
    if (!Number.isInteger(maxUses) || maxUses <= 0) {
      return { error: "İstifadə limiti müsbət tam ədəd olmalıdır." };
    }
  }
  if (expiresOn && !DATE.test(expiresOn)) return { error: "Son istifadə tarixini seçin." };

  const row = {
    code,
    name,
    discount_type: discountType as "percent" | "fixed",
    discount_value: discountValue,
    min_order_amount: minOrder ?? 0,
    max_uses: maxUses,
    // The code works until the end of that day in Baku.
    expires_at: expiresOn ? new Date(`${expiresOn}T23:59:59+04:00`).toISOString() : null,
    once_per_customer: formData.get("once_per_customer") === "on",
    is_active: formData.get("is_active") === "on",
    updated_at: new Date().toISOString(),
  };

  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("promo_codes").update(row).eq("id", id)
    : await supabase.from("promo_codes").insert(row);

  if (error) {
    console.error("[admin.savePromoCode]", error.message);
    if (error.code === "23505") return { error: `"${code}" kodu artıq mövcuddur.` };
    if (error.message.includes("promo_codes")) {
      return { error: "promo_codes cədvəli tapılmadı. Supabase-də 042_promo_codes.sql işə salın." };
    }
    return { error: "Promokod yadda saxlanmadı." };
  }

  revalidatePromoCodes();
  return { success: id ? "Promokod yeniləndi." : `"${code}" promokodu yaradıldı.` };
}

export async function setPromoCodeActive(id: string, active: boolean): Promise<AdminPromoActionState> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("promo_codes")
    .update({ is_active: active, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    console.error("[admin.setPromoCodeActive]", error.message);
    return { error: "Status dəyişmədi." };
  }
  revalidatePromoCodes();
  return {};
}

/** Orders that used it keep the code's text and their discount. */
export async function deletePromoCode(id: string): Promise<AdminPromoActionState> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("promo_codes").delete().eq("id", id);
  if (error) {
    console.error("[admin.deletePromoCode]", error.message);
    return { error: "Promokod silinmədi." };
  }
  revalidatePromoCodes();
  return {};
}

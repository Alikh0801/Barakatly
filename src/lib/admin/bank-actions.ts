"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { normalizePan } from "@/lib/admin/bank-format";
import { createClient } from "@/lib/supabase/server";

export type AdminBankActionState = {
  error?: string;
  success?: string;
};

function revalidateBanks() {
  updateTag("banks");
  revalidatePath("/admin/payments");
  revalidatePath("/checkout");
}

export async function createBank(
  _prev: AdminBankActionState,
  formData: FormData
): Promise<AdminBankActionState> {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const pan = normalizePan(String(formData.get("pan_number") ?? ""));

  if (!name) return { error: "Bank adı tələb olunur." };
  if (!pan) return { error: "Kart nömrəsi 16 rəqəm olmalıdır." };

  const supabase = await createClient();
  const { error } = await supabase.from("banks").insert({
    name,
    pan_number: pan,
    is_active: true,
  });

  if (error) {
    console.error("[admin.createBank]", error.message);
    return { error: "Bank məlumatı əlavə edilmədi." };
  }

  revalidateBanks();
  return { success: "Bank məlumatı əlavə olundu." };
}

export async function updateBank(
  _prev: AdminBankActionState,
  formData: FormData
): Promise<AdminBankActionState> {
  await requireAdmin();

  const id = String(formData.get("bank_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const pan = normalizePan(String(formData.get("pan_number") ?? ""));

  if (!id) return { error: "Bank tapılmadı." };
  if (!name) return { error: "Bank adı tələb olunur." };
  if (!pan) return { error: "Kart nömrəsi 16 rəqəm olmalıdır." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("banks")
    .update({ name, pan_number: pan })
    .eq("id", id);

  if (error) {
    console.error("[admin.updateBank]", error.message);
    return { error: "Bank məlumatı yenilənmədi." };
  }

  revalidateBanks();
  return { success: "Bank məlumatı yeniləndi." };
}

export async function toggleBankActive(
  _prev: AdminBankActionState,
  formData: FormData
): Promise<AdminBankActionState> {
  await requireAdmin();

  const id = String(formData.get("bank_id") ?? "");
  const isActive = String(formData.get("is_active") ?? "") === "true";
  if (!id) return { error: "Bank tapılmadı." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("banks")
    .update({ is_active: !isActive })
    .eq("id", id);

  if (error) {
    console.error("[admin.toggleBankActive]", error.message);
    return { error: "Bank statusu yenilənmədi." };
  }

  revalidateBanks();
  return {
    success: !isActive
      ? "Bank aktivləşdirildi — müştərilərə görünür."
      : "Bank deaktiv edildi — ödəniş pəncərəsində gizlədildi.",
  };
}

export async function deleteBank(
  _prev: AdminBankActionState,
  formData: FormData
): Promise<AdminBankActionState> {
  await requireAdmin();

  const id = String(formData.get("bank_id") ?? "");
  if (!id) return { error: "Bank tapılmadı." };

  const supabase = await createClient();
  const { count, error: countError } = await supabase
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("bank_id", id);

  if (countError) {
    console.error("[admin.deleteBank.count]", countError.message);
    return { error: "Bank yoxlanıla bilmədi." };
  }

  if ((count ?? 0) > 0) {
    return {
      error:
        "Bu banka daxil olan ödənişlər var. Silmək əvəzinə deaktiv edin.",
    };
  }

  const { error } = await supabase.from("banks").delete().eq("id", id);
  if (error) {
    console.error("[admin.deleteBank]", error.message);
    return { error: "Bank silinmədi." };
  }

  revalidateBanks();
  return { success: "Bank məlumatı silindi." };
}

"use server";

import { refresh, revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import {
  azPhoneLocalPart,
  isValidAzPhone,
  normalizeAzPhone,
} from "@/lib/phone/az";
import { isPhoneTakenByAnother } from "@/lib/phone/uniqueness";
import { createClient } from "@/lib/supabase/server";

const PHONE_TAKEN = "Bu telefon nömrəsi başqa hesabda istifadə olunur.";

export type AccountActionState = {
  error?: string;
  success?: string;
};

/** Lets a signed-in user edit their own name and phone. */
export async function updateAccountProfile(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const user = await getSessionUser();
  if (!user) return { error: "Əvvəlcə daxil olun." };

  const fullName = String(formData.get("full_name") ?? "").trim();
  const phoneRaw = String(formData.get("phone") ?? "").trim();

  if (!fullName) return { error: "Ad boş ola bilməz." };
  if (fullName.length > 80) {
    return { error: "Ad çox uzundur (maks. 80 simvol)." };
  }

  // Phone is optional here; validate only when something was entered.
  let phone: string | null = null;
  if (azPhoneLocalPart(phoneRaw)) {
    if (!isValidAzPhone(phoneRaw)) {
      return { error: "Telefon +994 ilə başlamalıdır (məs: +994501234567)." };
    }
    phone = normalizeAzPhone(phoneRaw);

    if (await isPhoneTakenByAnother(phone, user.id)) {
      return { error: PHONE_TAKEN };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, phone })
    .eq("id", user.id);

  if (error) {
    // Unique index race: another account grabbed the same phone concurrently.
    if ((error as { code?: string }).code === "23505") {
      return { error: PHONE_TAKEN };
    }
    console.error("[account.updateAccountProfile]", error.message);
    return { error: "Məlumatlar yenilənmədi. Yenidən cəhd edin." };
  }

  // Keep auth metadata in sync (used as a fallback in a few places).
  await supabase.auth.updateUser({
    data: { full_name: fullName, phone: phone ?? "" },
  });

  revalidatePath("/account");
  refresh();
  return { success: "Məlumatlar yadda saxlanıldı." };
}

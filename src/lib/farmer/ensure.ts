import { createClient } from "@/lib/supabase/server";
import type { Farmer } from "@/types";

/**
 * Creates a pending farmer row from auth user_metadata when missing.
 * Used after email confirmation when signup had no session yet.
 */
export async function ensureFarmerRecord(userId: string): Promise<Farmer | null> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("farmers")
    .select("*")
    .eq("profile_id", userId)
    .maybeSingle();

  if (existing) return existing;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== userId) return null;

  const meta = user.user_metadata ?? {};
  const farmName = String(meta.farm_name ?? "").trim();
  if (!farmName) return null;

  const phone = String(meta.phone ?? "").trim();
  if (phone) {
    await supabase.from("profiles").update({ phone }).eq("id", userId);
  }

  const { data: farmer, error } = await supabase
    .from("farmers")
    .insert({
      profile_id: userId,
      farm_name: farmName,
      description: String(meta.farm_description ?? "").trim() || null,
      location_text: String(meta.farm_location_text ?? "").trim() || null,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) {
    console.error("[farmer.ensureFarmerRecord]", error.message);
    return null;
  }

  return farmer;
}

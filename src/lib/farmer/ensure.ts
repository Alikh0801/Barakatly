import { createClient } from "@/lib/supabase/server";
import type { Farmer } from "@/types";

type EnsureFarmerInput = {
  farmName?: string | null;
  description?: string | null;
  locationText?: string | null;
  phone?: string | null;
};

/**
 * Ensures a farmers row exists for the signed-in user when they have
 * farmer intent (role, metadata, or explicit farm details).
 */
export async function ensureFarmerRecord(
  userId: string,
  input: EnsureFarmerInput = {},
): Promise<Farmer | null> {
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
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, role")
    .eq("id", userId)
    .maybeSingle();

  const metaFarmName = String(meta.farm_name ?? "").trim();
  const explicitFarmName = String(input.farmName ?? "").trim();
  const hasFarmerIntent =
    profile?.role === "farmer" ||
    profile?.role === "admin" ||
    // Farm details (in signup metadata or passed explicitly) mean the user
    // applied to be a farmer. Admin delete clears the metadata, so a demoted
    // user is not recreated. Role stays "customer" until admin approval.
    Boolean(metaFarmName) ||
    Boolean(explicitFarmName);

  if (!hasFarmerIntent) return null;

  const farmName =
    explicitFarmName ||
    String(meta.farm_name ?? "").trim() ||
    String(profile?.full_name ?? meta.full_name ?? "").trim() ||
    String(user.email?.split("@")[0] ?? "").trim() ||
    "Təsərrüfat";

  const description =
    String(input.description ?? "").trim() ||
    String(meta.farm_description ?? "").trim() ||
    null;

  const locationText =
    String(input.locationText ?? "").trim() ||
    String(meta.farm_location_text ?? "").trim() ||
    null;

  const phone =
    String(input.phone ?? "").trim() ||
    String(meta.phone ?? "").trim() ||
    String(profile?.phone ?? "").trim();

  // Role is NOT promoted here — a pending farmer stays "customer" until an
  // admin approves the farmers row (see approveFarmer).
  if (phone) {
    await supabase.from("profiles").update({ phone }).eq("id", userId);
  }

  const { data: farmer, error } = await supabase
    .from("farmers")
    .insert({
      profile_id: userId,
      farm_name: farmName,
      description,
      location_text: locationText,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) {
    const { data: raced } = await supabase
      .from("farmers")
      .select("*")
      .eq("profile_id", userId)
      .maybeSingle();
    if (raced) return raced;

    console.error("[farmer.ensureFarmerRecord]", error.message);
    return null;
  }

  return farmer;
}

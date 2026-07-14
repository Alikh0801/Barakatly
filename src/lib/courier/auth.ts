import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { Courier, Profile } from "@/types";

export type CourierContext = {
  profile: Profile;
  courier: Courier;
};

export async function requireCourier(): Promise<CourierContext> {
  const profile = await getProfile();

  if (!profile) {
    redirect("/signin?next=/courier");
  }

  if (profile.role !== "courier" && profile.role !== "admin") {
    redirect("/account");
  }

  const supabase = await createClient();
  const { data: courier } = await supabase
    .from("couriers")
    .select("*")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!courier || (!courier.is_active && profile.role !== "admin")) {
    redirect("/account");
  }

  return { profile, courier };
}

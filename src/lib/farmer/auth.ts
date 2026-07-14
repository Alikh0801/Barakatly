import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { Farmer, Profile } from "@/types";

export type FarmerContext = {
  profile: Profile;
  farmer: Farmer;
};

export async function requireFarmer(): Promise<FarmerContext> {
  const profile = await getProfile();

  if (!profile) {
    redirect("/signin?next=/farmer");
  }

  if (profile.role !== "farmer" && profile.role !== "admin") {
    redirect("/account");
  }

  const supabase = await createClient();
  const { data: farmer } = await supabase
    .from("farmers")
    .select("*")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!farmer) {
    redirect("/farmer/signup");
  }

  return { profile, farmer };
}

export async function requireApprovedFarmer(): Promise<FarmerContext> {
  const context = await requireFarmer();

  if (context.farmer.status !== "approved" && context.profile.role !== "admin") {
    redirect("/farmer");
  }

  return context;
}

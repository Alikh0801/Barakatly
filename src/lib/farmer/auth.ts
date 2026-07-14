import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";
import { ensureFarmerRecord } from "@/lib/farmer/ensure";
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const metaRole = user?.user_metadata?.role;
  const isFarmer =
    profile.role === "farmer" ||
    profile.role === "admin" ||
    metaRole === "farmer";

  if (!isFarmer) {
    redirect("/account");
  }

  // Rebuild farmers row after email confirmation / deferred signup insert.
  const farmer = await ensureFarmerRecord(profile.id);

  if (!farmer) {
    redirect("/farmer/signup");
  }

  return {
    profile: {
      ...profile,
      role: profile.role === "admin" ? "admin" : "farmer",
    },
    farmer,
  };
}

export async function requireApprovedFarmer(): Promise<FarmerContext> {
  const context = await requireFarmer();

  if (context.farmer.status !== "approved" && context.profile.role !== "admin") {
    redirect("/farmer");
  }

  return context;
}

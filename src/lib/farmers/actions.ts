"use server";

import { refresh, revalidatePath } from "next/cache";
import { getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type FollowActionState = {
  following: boolean;
  error?: string;
};

export async function toggleFollowFarmer(
  prevState: FollowActionState,
  formData: FormData,
): Promise<FollowActionState> {
  const farmerId = String(formData.get("farmer_id") ?? "").trim();
  if (!farmerId) {
    return { ...prevState, error: "Fermer tapılmadı." };
  }

  const profile = await getProfile();
  if (!profile) {
    return { ...prevState, error: "İzləmək üçün daxil olun." };
  }

  const supabase = await createClient();

  if (prevState.following) {
    const { error } = await supabase
      .from("farmer_follows")
      .delete()
      .eq("farmer_id", farmerId)
      .eq("follower_id", profile.id);

    if (error) {
      console.error("[farmers.toggleFollowFarmer.unfollow]", error.message);
      return { ...prevState, error: "Əməliyyat uğursuz oldu." };
    }

    revalidatePath(`/farmers/${farmerId}`);
    refresh();
    return { following: false };
  }

  const { error } = await supabase
    .from("farmer_follows")
    .insert({ farmer_id: farmerId, follower_id: profile.id });

  if (error) {
    console.error("[farmers.toggleFollowFarmer.follow]", error.message);
    return { ...prevState, error: "Əməliyyat uğursuz oldu." };
  }

  revalidatePath(`/farmers/${farmerId}`);
  refresh();
  return { following: true };
}

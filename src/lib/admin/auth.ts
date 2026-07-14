import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";
import type { Profile } from "@/types";

export async function requireAdmin(): Promise<Profile> {
  const profile = await getProfile();

  if (!profile) {
    redirect("/signin?next=/admin");
  }

  if (profile.role !== "admin") {
    redirect("/account");
  }

  return profile;
}

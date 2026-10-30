import { cache } from "react";
import { getProfile } from "@/lib/auth/session";
import { notifyUser } from "@/lib/notifications/helpers";
import { createClient } from "@/lib/supabase/server";
import type { FarmerStatus } from "@/types";

export { FARMER_APPLICATION_PATH } from "@/lib/farmer/application-path";

export const FARMER_REJECTED_TITLE = "Fermer müraciəti rədd edildi";

export type FarmerApplication = {
  status: FarmerStatus;
  location_text: string | null;
  /** The admin's reason, when the application was rejected. */
  rejectionReason: string | null;
};

/**
 * The signed-in user's farmer application while it is pending or rejected,
 * or null (no application, or already approved / suspended). Cached per
 * request: the header banner and the page both ask.
 */
export const getOpenFarmerApplication = cache(async (): Promise<FarmerApplication | null> => {
  const profile = await getProfile();
  // Applicants stay customers until approved; anyone else has no open one.
  if (!profile || profile.role !== "customer") return null;

  const supabase = await createClient();
  const { data: farmer } = await supabase
    .from("farmers")
    .select("status, location_text")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!farmer || (farmer.status !== "pending" && farmer.status !== "rejected")) return null;

  let rejectionReason: string | null = null;
  if (farmer.status === "rejected") {
    // The reason lives in the rejection notification (farmers has no column
    // for it): metadata.reason, or the text after "Səbəb:" in older ones.
    const { data: notification } = await supabase
      .from("notifications")
      .select("body, metadata")
      .eq("user_id", profile.id)
      .eq("title", FARMER_REJECTED_TITLE)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const metadata = (notification?.metadata ?? {}) as Record<string, unknown>;
    rejectionReason =
      (typeof metadata.reason === "string" && metadata.reason.trim()) ||
      notification?.body.split("Səbəb:")[1]?.trim() ||
      null;
  }

  return { status: farmer.status, location_text: farmer.location_text, rejectionReason };
});

/** Tells the applicant their farmer application arrived. */
export async function notifyApplicationReceived(userId: string, name: string | null | undefined) {
  await notifyUser({
    userId,
    type: "farmer_registration",
    title: "Fermer müraciətiniz qəbul edildi",
    body: `${name?.trim() || "Fermer"} — admin təsdiqi gözlənilir.`,
  });
}

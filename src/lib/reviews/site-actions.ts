"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { getSessionUser } from "@/lib/auth/session";
import { AZ_REGIONS } from "@/lib/az/regions";
import {
  SITE_REVIEW_MAX_LENGTH,
  SITE_REVIEW_MIN_LENGTH,
  SITE_REVIEWS_TAG,
} from "@/lib/reviews/site-constants";
import { createClient } from "@/lib/supabase/server";

export type SiteReviewActionState = { error?: string; success?: string };

/**
 * A customer's review of Barakatly. Writing again edits it; either way it
 * waits for an admin before the home page shows it. The database decides
 * who may write one (a delivered order is required) and sets the public
 * name and the "pending" status itself.
 */
export async function submitSiteReview(
  _prev: SiteReviewActionState,
  formData: FormData,
): Promise<SiteReviewActionState> {
  const user = await getSessionUser();
  if (!user) return { error: "Rəy yazmaq üçün daxil olun." };

  const rating = Number(formData.get("rating") ?? 0);
  const comment = String(formData.get("comment") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "1-dən 5-ə qədər ulduz seçin." };
  }
  if (comment.length < SITE_REVIEW_MIN_LENGTH) {
    return { error: `Rəy ən azı ${SITE_REVIEW_MIN_LENGTH} simvol olmalıdır.` };
  }
  if (comment.length > SITE_REVIEW_MAX_LENGTH) {
    return { error: `Rəy ${SITE_REVIEW_MAX_LENGTH} simvoldan uzun ola bilməz.` };
  }
  if (!(AZ_REGIONS as readonly string[]).includes(city)) {
    return { error: "Şəhər və ya rayonu seçin." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("site_reviews")
    .upsert(
      { customer_id: user.id, rating, comment, city },
      { onConflict: "customer_id" },
    );

  if (error) {
    console.error("[reviews.submitSiteReview]", error.message);
    return {
      error: "Rəy yazmaq üçün ən azı bir sifarişiniz çatdırılmış olmalıdır.",
    };
  }

  // An edit of an approved review takes it off the home page until re-approved.
  updateTag(SITE_REVIEWS_TAG);
  revalidatePath("/admin", "layout");
  return {
    success: "Rəyiniz göndərildi, təşəkkür edirik! Yoxlanıldıqdan sonra ana səhifədə görünə bilər.",
  };
}

const MODERATION_STATUSES = ["approved", "hidden"] as const;

export async function moderateSiteReview(
  _prev: SiteReviewActionState,
  formData: FormData,
): Promise<SiteReviewActionState> {
  await requireAdmin();
  const id = String(formData.get("review_id") ?? "").trim();
  const status = String(formData.get("status") ?? "");
  if (!id) return { error: "Rəy tapılmadı." };
  if (!(MODERATION_STATUSES as readonly string[]).includes(status)) {
    return { error: "Yanlış əməliyyat." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("site_reviews")
    .update({ status: status as (typeof MODERATION_STATUSES)[number] })
    .eq("id", id);

  if (error) {
    console.error("[reviews.moderateSiteReview]", error.message);
    return { error: "Rəy yenilənmədi." };
  }

  updateTag(SITE_REVIEWS_TAG);
  revalidatePath("/");
  revalidatePath("/admin", "layout");
  return {
    success: status === "approved" ? "Rəy ana səhifədə göstərilir." : "Rəy gizlədildi.",
  };
}

export async function deleteSiteReview(
  _prev: SiteReviewActionState,
  formData: FormData,
): Promise<SiteReviewActionState> {
  await requireAdmin();
  const id = String(formData.get("review_id") ?? "").trim();
  if (!id) return { error: "Rəy tapılmadı." };

  const supabase = await createClient();
  const { error } = await supabase.from("site_reviews").delete().eq("id", id);
  if (error) {
    console.error("[reviews.deleteSiteReview]", error.message);
    return { error: "Rəy silinmədi." };
  }

  updateTag(SITE_REVIEWS_TAG);
  revalidatePath("/");
  revalidatePath("/admin", "layout");
  return { success: "Rəy silindi." };
}

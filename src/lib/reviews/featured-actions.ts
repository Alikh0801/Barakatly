"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { FEATURED_REVIEWS_TAG } from "@/lib/reviews/featured-constants";
import { createClient } from "@/lib/supabase/server";

export type FeaturedReviewActionState = { error?: string; success?: string };

/** Puts a product review on the home page, or takes it off. */
export async function setReviewFeatured(
  _prev: FeaturedReviewActionState,
  formData: FormData,
): Promise<FeaturedReviewActionState> {
  await requireAdmin();
  const reviewId = String(formData.get("review_id") ?? "").trim();
  const featured = String(formData.get("featured") ?? "") === "true";
  if (!reviewId) return { error: "Rəy tapılmadı." };

  const supabase = await createClient();
  if (featured) {
    // Only a review with words in it can stand on the home page.
    const { data: review } = await supabase
      .from("product_reviews")
      .select("comment")
      .eq("id", reviewId)
      .maybeSingle();
    if (!review?.comment?.trim()) return { error: "Yalnız mətni olan rəy ana səhifədə göstərilə bilər." };
  }

  const { error } = await supabase
    .from("product_reviews")
    .update({ featured_at: featured ? new Date().toISOString() : null })
    .eq("id", reviewId);

  if (error) {
    console.error("[reviews.setReviewFeatured]", error.message);
    return { error: "Rəy yenilənmədi." };
  }

  updateTag(FEATURED_REVIEWS_TAG);
  revalidatePath("/admin/reviews");
  revalidatePath("/");
  return { success: featured ? "Ana səhifədə göstərilir." : "Ana səhifədən götürüldü." };
}

/** Removes a product review (the product's rating follows). */
export async function deleteReviewAsAdmin(
  _prev: FeaturedReviewActionState,
  formData: FormData,
): Promise<FeaturedReviewActionState> {
  await requireAdmin();
  const reviewId = String(formData.get("review_id") ?? "").trim();
  if (!reviewId) return { error: "Rəy tapılmadı." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_reviews")
    .delete()
    .eq("id", reviewId)
    .select("product_id");

  if (error || !data?.length) {
    console.error("[reviews.deleteReviewAsAdmin]", error?.message);
    return { error: "Rəy silinmədi." };
  }

  updateTag(FEATURED_REVIEWS_TAG);
  revalidatePath("/admin/reviews");
  revalidatePath(`/shop/${data[0].product_id}`);
  return { success: "Rəy silindi." };
}

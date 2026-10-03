"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type ReviewActionState = {
  error?: string;
  success?: string;
};

const MAX_COMMENT_LENGTH = 1000;

export async function submitProductReview(
  _prev: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const user = await getSessionUser();
  if (!user) return { error: "Rəy yazmaq üçün daxil olun." };

  const productId = String(formData.get("product_id") ?? "").trim();
  const rating = Number(formData.get("rating") ?? 0);
  const comment = String(formData.get("comment") ?? "").trim();

  if (!productId) return { error: "Məhsul tapılmadı." };

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "1-dən 5-ə qədər ulduz seçin." };
  }

  if (comment.length > MAX_COMMENT_LENGTH) {
    return { error: `Rəy ${MAX_COMMENT_LENGTH} simvoldan uzun ola bilməz.` };
  }

  const supabase = await createClient();
  // Writing again replaces the customer's earlier review (unique per pair).
  // RLS still decides whether they may review at all: it requires a delivered
  // order_item for this product.
  const { error } = await supabase.from("product_reviews").upsert(
    {
      product_id: productId,
      customer_id: user.id,
      rating,
      comment: comment || null,
    },
    { onConflict: "product_id,customer_id" },
  );

  if (error) {
    console.error("[shop.submitProductReview]", error.message);
    // The insert policy is the only thing that can reject an otherwise valid
    // review, and it does so exactly when the product was never delivered.
    return {
      error:
        "Rəy yazmaq üçün bu məhsulu sifariş edib təhvil almış olmalısınız.",
    };
  }

  revalidatePath(`/shop/${productId}`);
  return { success: "Rəyiniz paylaşıldı. Təşəkkürlər!" };
}

export async function deleteProductReview(
  _prev: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const user = await getSessionUser();
  if (!user) return { error: "Daxil olun." };

  const productId = String(formData.get("product_id") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase
    .from("product_reviews")
    .delete()
    .eq("product_id", productId)
    .eq("customer_id", user.id);

  if (error) {
    console.error("[shop.deleteProductReview]", error.message);
    return { error: "Rəy silinmədi. Yenidən cəhd edin." };
  }

  revalidatePath(`/shop/${productId}`);
  return { success: "Rəyiniz silindi." };
}

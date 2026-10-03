import { getSessionUser } from "@/lib/auth/session";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";

export type ProductReview = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  customerId: string;
  customerName: string;
};

export type ProductRatingSummary = {
  average: number;
  total: number;
  /** Count per star, indexed 1..5. */
  breakdown: Record<number, number>;
};

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  customer_id: string;
  customer_name: string | null;
};

export const EMPTY_RATING_SUMMARY: ProductRatingSummary = {
  average: 0,
  total: 0,
  breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
};

/** Only a first name + initial is shown publicly, never the full name. */
function publicReviewerName(fullName: string | null): string {
  const trimmed = (fullName ?? "").trim();
  if (!trimmed) return "Müştəri";

  const [first, ...rest] = trimmed.split(/\s+/);
  const lastInitial = rest.at(-1)?.[0];
  return lastInitial ? `${first} ${lastInitial.toUpperCase()}.` : first;
}

export async function getProductReviews(
  productId: string,
): Promise<ProductReview[]> {
  const supabase = createPublicClient();
  // Goes through the security-definer function: the reviewer's name sits in
  // profiles, which RLS hides from other visitors.
  const { data, error } = await supabase.rpc("list_product_reviews", {
    p_product_id: productId,
  });

  if (error) {
    console.error("[shop.getProductReviews]", error.message);
    return [];
  }

  return ((data ?? []) as unknown as ReviewRow[]).map((row) => ({
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    created_at: row.created_at,
    customerId: row.customer_id,
    customerName: publicReviewerName(row.customer_name),
  }));
}

export function summarizeRatings(reviews: ProductReview[]): ProductRatingSummary {
  if (reviews.length === 0) return EMPTY_RATING_SUMMARY;

  const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;

  for (const review of reviews) {
    breakdown[review.rating] = (breakdown[review.rating] ?? 0) + 1;
    sum += review.rating;
  }

  return {
    average: sum / reviews.length,
    total: reviews.length,
    breakdown,
  };
}

/**
 * True when the signed-in customer received this product, which is what the
 * insert policy requires before a review is accepted.
 */
export async function canReviewProduct(productId: string): Promise<boolean> {
  const user = await getSessionUser();
  if (!user) return false;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("order_items")
    .select("id, orders!inner(customer_id)")
    .eq("product_id", productId)
    .eq("status", "delivered")
    .eq("orders.customer_id", user.id)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[shop.canReviewProduct]", error.message);
    return false;
  }

  return Boolean(data);
}

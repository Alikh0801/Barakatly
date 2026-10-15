import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { SITE_REVIEWS_TAG } from "@/lib/reviews/site-constants";
import type { SiteReview } from "@/types";

export type PublicSiteReview = Pick<
  SiteReview,
  "id" | "rating" | "comment" | "city" | "display_name"
>;

async function fetchApprovedSiteReviews(limit: number): Promise<PublicSiteReview[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("site_reviews")
    .select("id, rating, comment, city, display_name")
    .eq("status", "approved")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[reviews.getApprovedSiteReviews]", error.message);
    return [];
  }
  return data ?? [];
}

/** The newest reviews an admin has approved for the home page. */
export function getApprovedSiteReviews(limit = 3) {
  return unstable_cache(
    async () => fetchApprovedSiteReviews(limit),
    ["approved-site-reviews", String(limit)],
    { revalidate: 300, tags: [SITE_REVIEWS_TAG] },
  )();
}

/** The signed-in customer's own review, whatever its status. */
export async function getMySiteReview(customerId: string): Promise<SiteReview | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_reviews")
    .select("*")
    .eq("customer_id", customerId)
    .maybeSingle();

  if (error) {
    console.error("[reviews.getMySiteReview]", error.message);
    return null;
  }
  return data;
}

export async function getAdminSiteReviews(): Promise<SiteReview[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_reviews")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[reviews.getAdminSiteReviews]", error.message);
    return [];
  }
  return data ?? [];
}

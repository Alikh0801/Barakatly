import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminProductReviewsPanel } from "@/components/admin/AdminProductReviewsPanel";
import { getAdminProductReviews } from "@/lib/reviews/featured";
import type { ReviewFilter } from "@/lib/reviews/featured-constants";

export const metadata = { title: "Rəylər - Admin" };

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const active: ReviewFilter = filter === "featured" ? "featured" : "all";
  const reviews = await getAdminProductReviews();

  return (
    <AdminPageShell title="Rəylər">
      <AdminProductReviewsPanel reviews={reviews} filter={active} />
    </AdminPageShell>
  );
}

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminSiteReviewsPanel } from "@/components/admin/AdminSiteReviewsPanel";
import { getAdminSiteReviews } from "@/lib/reviews/site";
import { REVIEW_FILTERS, type ReviewFilter } from "@/lib/reviews/site-constants";

export const metadata = { title: "Rəylər - Admin" };

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter: ReviewFilter = REVIEW_FILTERS.some((item) => item.id === status)
    ? (status as ReviewFilter)
    : "pending";
  const reviews = await getAdminSiteReviews();
  const counts: Record<ReviewFilter, number> = { pending: 0, approved: 0, hidden: 0 };
  for (const review of reviews) counts[review.status] += 1;

  return (
    <AdminPageShell
      title="Rəylər"
    >
      <AdminSiteReviewsPanel reviews={reviews} filter={filter} counts={counts} />
    </AdminPageShell>
  );
}

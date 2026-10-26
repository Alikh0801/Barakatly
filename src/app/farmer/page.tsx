import { FarmerPendingCard } from "@/components/farmer/FarmerPanels";
import {
  FarmerProfileDashboard,
  type FarmerProfileTab,
} from "@/components/farmer/FarmerProfile";
import { requireFarmer } from "@/lib/farmer/auth";
import {
  getFarmerBlogPosts,
  getFarmerOrderItems,
  getFarmerPayouts,
  getFarmerProducts,
} from "@/lib/farmer/queries";
import {
  getFarmerCertificates,
  getFarmerFollowerCount,
  getFarmerRatingSummary,
} from "@/lib/farmers/queries";
import { currentBakuMonthStart, getFarmerSalesStats } from "@/lib/farmer/stats";

export const metadata = { title: "Fermer profili" };

function parseTab(value?: string): FarmerProfileTab {
  if (
    value === "stats" ||
    value === "products" ||
    value === "orders" ||
    value === "payouts" ||
    value === "about" ||
    value === "certificates" ||
    value === "posts" ||
    value === "blog"
  ) {
    return value === "blog" ? "posts" : value;
  }
  return "stats";
}

export default async function FarmerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { profile, farmer } = await requireFarmer();
  const params = await searchParams;
  const initialTab = parseTab(params.tab);

  if (farmer.status !== "approved") {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 md:px-6">
        <h1 className="text-3xl font-semibold text-zinc-900">Fermer paneli</h1>
        <div className="mt-8">
          <FarmerPendingCard farmer={farmer} />
        </div>
      </div>
    );
  }

  const [products, orders, posts, followerCount, rating, certificates, sales, payouts] =
    await Promise.all([
      getFarmerProducts(farmer.id),
      getFarmerOrderItems(farmer.id),
      getFarmerBlogPosts(farmer.id),
      getFarmerFollowerCount(farmer.id),
      getFarmerRatingSummary(farmer.id),
      getFarmerCertificates(farmer.id),
      getFarmerSalesStats(farmer.id),
      getFarmerPayouts(farmer.id),
    ]);

  const monthStart = currentBakuMonthStart();
  const approved = products.filter((product) => product.status === "approved");
  const productCounts = {
    approved: approved.length,
    newThisMonth: approved.filter((product) => new Date(product.created_at) >= monthStart)
      .length,
    inReview: products.filter((product) => product.status === "pending").length,
  };

  return (
    <FarmerProfileDashboard
      farmer={farmer}
      profile={profile}
      initialTab={initialTab}
      products={products}
      orders={orders}
      posts={posts}
      followerCount={followerCount}
      rating={rating}
      certificates={certificates}
      sales={sales}
      productCounts={productCounts}
      payouts={payouts}
    />
  );
}

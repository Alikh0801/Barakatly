import { FarmerPendingCard } from "@/components/farmer/FarmerPanels";
import {
  FarmerProfileDashboard,
  type FarmerProfileTab,
} from "@/components/farmer/FarmerProfile";
import { requireFarmer } from "@/lib/farmer/auth";
import {
  getFarmerBlogPosts,
  getFarmerOrderItems,
  getFarmerProducts,
} from "@/lib/farmer/queries";

export const metadata = { title: "Fermer profili — BARAKATLY" };

function parseTab(value?: string): FarmerProfileTab {
  if (
    value === "products" ||
    value === "orders" ||
    value === "about" ||
    value === "posts" ||
    value === "blog"
  ) {
    return value === "blog" ? "posts" : value;
  }
  return "posts";
}

export default async function FarmerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { profile, farmer } = await requireFarmer();
  const params = await searchParams;
  const tab = parseTab(params.tab);

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

  const [products, orders, posts] = await Promise.all([
    getFarmerProducts(farmer.id),
    getFarmerOrderItems(farmer.id),
    getFarmerBlogPosts(farmer.id),
  ]);

  return (
    <FarmerProfileDashboard
      farmer={farmer}
      profile={profile}
      tab={tab}
      products={products}
      orders={orders}
      posts={posts}
    />
  );
}

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  PublicFarmerProfile,
  type PublicFarmerProfileTab,
} from "@/components/farmer/FarmerProfile";
import {
  getPublicFarmerBlogPosts,
  getPublicFarmerById,
  getPublicFarmerProducts,
} from "@/lib/farmers/queries";
import type { FarmerBlogPost } from "@/lib/farmer/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const farmer = await getPublicFarmerById(id);
  if (!farmer) {
    return { title: "Fermer" };
  }

  const description =
    farmer.description?.slice(0, 160) || "Təsdiqlənmiş fermer profili";

  return {
    title: `${farmer.farm_name} — BARAKATLY`,
    description,
    alternates: { canonical: `/farmers/${farmer.id}` },
    openGraph: {
      title: farmer.farm_name,
      description,
      type: "website",
      url: `/farmers/${farmer.id}`,
      images: farmer.avatar_url
        ? [{ url: farmer.avatar_url, alt: farmer.farm_name }]
        : undefined,
    },
  };
}

function parseTab(value?: string): PublicFarmerProfileTab {
  if (value === "products" || value === "about" || value === "posts") {
    return value;
  }
  return "posts";
}

export default async function FarmerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab: tabParam } = await searchParams;

  if (id === "apply") {
    notFound();
  }

  const farmer = await getPublicFarmerById(id);
  if (!farmer) notFound();

  const initialTab = parseTab(tabParam);

  const [products, rawPosts] = await Promise.all([
    getPublicFarmerProducts(farmer.id),
    getPublicFarmerBlogPosts(farmer.id),
  ]);

  const posts = rawPosts.map(
    (post): FarmerBlogPost => ({
      id: post.id,
      farmer_id: farmer.id,
      caption: post.caption,
      created_at: post.created_at,
      updated_at: post.created_at,
      farmer_post_media: post.farmer_post_media.map((media) => ({
        id: media.id,
        post_id: post.id,
        media_type: media.media_type,
        url: media.url,
        sort_order: media.sort_order,
        created_at: post.created_at,
      })),
    })
  );

  return (
    <PublicFarmerProfile
      farmer={farmer}
      initialTab={initialTab}
      products={products}
      posts={posts}
    />
  );
}

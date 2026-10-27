import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  PublicFarmerProfile,
  type PublicFarmerProfileTab,
} from "@/components/farmer/FarmerProfile";
import {
  getFarmerCertificates,
  getFarmerFollowerCount,
  getFarmerRatingSummary,
  getIsFollowingFarmer,
  isOwnFarm,
  getPublicFarmerBlogPosts,
  getPublicFarmerById,
  getPublicFarmerProducts,
} from "@/lib/farmers/queries";
import type { FarmerBlogPost } from "@/lib/farmer/queries";
import { getProfile } from "@/lib/auth/session";
import { farmerDisplayName } from "@/lib/farmers/name";
import { getDefaultOgImage } from "@/lib/og-image";

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
  const name = farmerDisplayName(farmer.owner_name);
  // These openGraph and twitter objects replace the site-wide ones, so they
  // name their own picture: the avatar, else the cover, else the default card.
  const ownImage = farmer.avatar_url || farmer.cover_url;
  const image = ownImage ? { url: ownImage, alt: name } : await getDefaultOgImage();

  return {
    title: name,
    description,
    alternates: { canonical: `/farmers/${farmer.id}` },
    openGraph: {
      title: name,
      description,
      type: "website",
      url: `/farmers/${farmer.id}`,
      images: [image],
    },
    twitter: { card: "summary_large_image", title: name, description, images: [image.url] },
  };
}

function parseTab(value?: string): PublicFarmerProfileTab {
  if (
    value === "products" ||
    value === "about" ||
    value === "posts" ||
    value === "certificates"
  ) {
    return value;
  }
  return "products";
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

  const profile = await getProfile();

  const [products, rawPosts, followerCount, isFollowing, rating, certificates, isOwner] =
    await Promise.all([
      getPublicFarmerProducts(farmer.id),
      getPublicFarmerBlogPosts(farmer.id),
      getFarmerFollowerCount(farmer.id),
      profile ? getIsFollowingFarmer(farmer.id, profile.id) : Promise.resolve(false),
      getFarmerRatingSummary(farmer.id),
      getFarmerCertificates(farmer.id),
      profile?.role === "farmer" ? isOwnFarm(farmer.id, profile.id) : Promise.resolve(false),
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
      followerCount={followerCount}
      isFollowing={isFollowing}
      isAuthenticated={Boolean(profile)}
      isOwner={isOwner}
      rating={rating}
      certificates={certificates}
    />
  );
}

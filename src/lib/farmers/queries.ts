import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { ProductListItem } from "@/types/shop";

export type PublicFarmer = {
  id: string;
  farm_name: string;
  owner_name: string | null;
  description: string | null;
  location_text: string | null;
  verified_at: string | null;
  avatar_url: string | null;
  productCount: number;
  created_at: string;
};

const productSelect = `
  id,
  title,
  description,
  unit_type,
  final_price,
  farmer_price,
  quantity_available,
  in_stock,
  farmer:farmers (
    id,
    farm_name,
    location_text,
    status
  ),
  category:categories (
    slug,
    name_az
  ),
  product_images (
    url,
    sort_order
  )
`;

function mapPublicFarmer(
  farmer: {
    id: string;
    farm_name: string;
    description: string | null;
    location_text: string | null;
    verified_at: string | null;
    avatar_url?: string | null;
    created_at: string;
    products?: { id: string; status: string }[] | null;
  },
  ownerName: string | null,
): PublicFarmer {
  const products = Array.isArray(farmer.products) ? farmer.products : [];
  const approvedCount = products.filter(
    (product) => product.status === "approved",
  ).length;

  return {
    id: farmer.id,
    farm_name: farmer.farm_name,
    owner_name: ownerName,
    description: farmer.description,
    location_text: farmer.location_text,
    verified_at: farmer.verified_at,
    avatar_url: farmer.avatar_url ?? null,
    productCount: approvedCount,
    created_at: farmer.created_at,
  };
}

async function fetchOwnerNames(
  supabase: ReturnType<typeof createPublicClient>,
): Promise<Map<string, string | null>> {
  const { data, error } = await supabase
    .from("public_farmer_names")
    .select("farmer_id, owner_name");

  if (error) {
    console.error("[farmers.fetchOwnerNames]", error.message);
    return new Map();
  }

  return new Map((data ?? []).map((row) => [row.farmer_id, row.owner_name]));
}

async function fetchPublicFarmers(): Promise<PublicFarmer[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("farmers")
    .select(
      `
      id,
      farm_name,
      description,
      location_text,
      verified_at,
      avatar_url,
      created_at,
      products ( id, status )
    `,
    )
    .eq("status", "approved")
    .order("farm_name", { ascending: true });

  if (error) {
    console.error("[farmers.getPublicFarmers]", error.message);
    return [];
  }

  const ownerNames = await fetchOwnerNames(supabase);

  return (
    (data ?? []) as unknown as Parameters<typeof mapPublicFarmer>[0][]
  ).map((farmer) => mapPublicFarmer(farmer, ownerNames.get(farmer.id) ?? null));
}

async function fetchPublicFarmerById(id: string): Promise<PublicFarmer | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("farmers")
    .select(
      `
      id,
      farm_name,
      description,
      location_text,
      verified_at,
      avatar_url,
      created_at,
      products ( id, status )
    `,
    )
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();

  if (error) {
    console.error("[farmers.getPublicFarmerById]", error.message);
    return null;
  }

  if (!data) return null;

  const { data: nameRow, error: nameError } = await supabase
    .from("public_farmer_names")
    .select("owner_name")
    .eq("farmer_id", id)
    .maybeSingle();

  if (nameError) {
    console.error("[farmers.getPublicFarmerById.ownerName]", nameError.message);
  }

  return mapPublicFarmer(
    data as unknown as Parameters<typeof mapPublicFarmer>[0],
    nameRow?.owner_name ?? null,
  );
}

async function fetchFarmerProducts(farmerId: string): Promise<ProductListItem[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("products")
    .select(productSelect)
    .eq("farmer_id", farmerId)
    .eq("status", "approved")
    .eq("in_stock", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[farmers.getFarmerProducts]", error.message);
    return [];
  }

  return (data ?? []) as unknown as ProductListItem[];
}

export type PublicFarmerBlogPost = {
  id: string;
  caption: string;
  created_at: string;
  farmer_post_media: {
    id: string;
    media_type: "image" | "video";
    url: string;
    sort_order: number;
  }[];
};

async function fetchPublicFarmerBlogPosts(
  farmerId: string
): Promise<PublicFarmerBlogPost[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("farmer_posts")
    .select(
      `
      id,
      caption,
      created_at,
      farmer_post_media (
        id,
        media_type,
        url,
        sort_order
      )
    `
    )
    .eq("farmer_id", farmerId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    console.error("[farmers.getPublicFarmerBlogPosts]", error.message);
    return [];
  }

  return ((data ?? []) as unknown as PublicFarmerBlogPost[]).map((post) => ({
    ...post,
    farmer_post_media: [...(post.farmer_post_media ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order
    ),
  }));
}

export function getPublicFarmers() {
  return unstable_cache(fetchPublicFarmers, ["public-farmers"], {
    revalidate: 60,
    tags: ["farmers"],
  })();
}

export function getPublicFarmerById(id: string) {
  return unstable_cache(
    async () => fetchPublicFarmerById(id),
    ["public-farmer", id],
    { revalidate: 60, tags: ["farmers"] },
  )();
}

export function getPublicFarmerProducts(farmerId: string) {
  return unstable_cache(
    async () => fetchFarmerProducts(farmerId),
    ["public-farmer-products", farmerId],
    { revalidate: 60, tags: ["farmers", "products"] },
  )();
}

export function getPublicFarmerBlogPosts(farmerId: string) {
  return unstable_cache(
    async () => fetchPublicFarmerBlogPosts(farmerId),
    ["public-farmer-blog", farmerId],
    { revalidate: 60, tags: ["farmers"] },
  )();
}

export async function getFarmerFollowerCount(farmerId: string): Promise<number> {
  const supabase = createPublicClient();
  const { count, error } = await supabase
    .from("farmer_follows")
    .select("id", { count: "exact", head: true })
    .eq("farmer_id", farmerId);

  if (error) {
    console.error("[farmers.getFarmerFollowerCount]", error.message);
    return 0;
  }

  return count ?? 0;
}

export async function getIsFollowingFarmer(
  farmerId: string,
  followerId: string,
): Promise<boolean> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("farmer_follows")
    .select("id")
    .eq("farmer_id", farmerId)
    .eq("follower_id", followerId)
    .maybeSingle();

  if (error) {
    console.error("[farmers.getIsFollowingFarmer]", error.message);
    return false;
  }

  return Boolean(data);
}

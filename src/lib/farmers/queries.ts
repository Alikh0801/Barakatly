import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { ProductListItem } from "@/types/shop";

export type PublicFarmer = {
  id: string;
  farm_name: string;
  description: string | null;
  location_text: string | null;
  verified_at: string | null;
  productCount: number;
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

function mapPublicFarmer(farmer: {
  id: string;
  farm_name: string;
  description: string | null;
  location_text: string | null;
  verified_at: string | null;
  products?: { id: string; status: string }[] | null;
}): PublicFarmer {
  const products = Array.isArray(farmer.products) ? farmer.products : [];
  const approvedCount = products.filter(
    (product) => product.status === "approved",
  ).length;

  return {
    id: farmer.id,
    farm_name: farmer.farm_name,
    description: farmer.description,
    location_text: farmer.location_text,
    verified_at: farmer.verified_at,
    productCount: approvedCount,
  };
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
      products ( id, status )
    `,
    )
    .eq("status", "approved")
    .order("farm_name", { ascending: true });

  if (error) {
    console.error("[farmers.getPublicFarmers]", error.message);
    return [];
  }

  return ((data ?? []) as unknown as Parameters<typeof mapPublicFarmer>[0][]).map(
    mapPublicFarmer,
  );
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

  return data
    ? mapPublicFarmer(data as unknown as Parameters<typeof mapPublicFarmer>[0])
    : null;
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

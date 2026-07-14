import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";

export type PublicFarmer = {
  id: string;
  farm_name: string;
  description: string | null;
  location_text: string | null;
  verified_at: string | null;
  productCount: number;
};

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

  return (data ?? []).map((farmer) => {
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
  });
}

export function getPublicFarmers() {
  return unstable_cache(fetchPublicFarmers, ["public-farmers"], {
    revalidate: 60,
    tags: ["farmers"],
  })();
}

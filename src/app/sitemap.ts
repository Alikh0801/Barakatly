import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/auth/urls";
import { getPublicFarmers } from "@/lib/farmers/queries";
import { getProducts } from "@/lib/shop/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getAppUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    {
      url: `${base}/shop`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${base}/farmers`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${base}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${base}/search`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];

  let productRoutes: MetadataRoute.Sitemap = [];
  let farmerRoutes: MetadataRoute.Sitemap = [];

  try {
    const [products, farmers] = await Promise.all([
      getProducts(),
      getPublicFarmers(),
    ]);

    productRoutes = products.map((product) => ({
      url: `${base}/shop/${product.id}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));

    farmerRoutes = farmers.map((farmer) => ({
      url: `${base}/farmers/${farmer.id}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error("[sitemap]", error);
  }

  return [...staticRoutes, ...productRoutes, ...farmerRoutes];
}

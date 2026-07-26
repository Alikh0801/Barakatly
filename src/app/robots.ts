import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/auth/urls";

export default function robots(): MetadataRoute.Robots {
  const base = getAppUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/farmer",
          "/farmer/",
          "/courier",
          "/courier/",
          "/account",
          "/checkout",
          "/orders",
          "/notifications",
          "/cart",
          "/signin",
          "/signup",
          "/auth/",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}

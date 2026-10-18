import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/auth/urls";
import { IS_PRE } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  if (IS_PRE) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

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

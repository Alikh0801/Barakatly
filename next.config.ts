import type { NextConfig } from "next";

function supabaseHostname() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

const supabaseHost = supabaseHostname();

// Link-preview crawlers get the title, description and picture in the
// <head> of a fully rendered page instead of streamed after it. This is
// Next.js's own list (html-bots.ts), which setting the option replaces, plus
// the messengers it leaves out: Telegram, Viber, Pinterest, Snapchat.
const LINK_PREVIEW_BOTS =
  /[\w-]+-Google|Google-[\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight|TelegramBot|Viber|Pinterest|Snapchat/i;

const nextConfig: NextConfig = {
  htmlLimitedBots: LINK_PREVIEW_BOTS,
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
    // Checkout accepts payment receipts up to 5MB (RECEIPT_MAX_BYTES); the
    // default Server Action body limit is 1MB, so uploads above that always
    // failed with "Body exceeded 1 MB limit" before this override.
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  images: {
    // Served straight from Supabase Storage, not through Vercel's optimizer:
    // its monthly quota ran out and every new size answered 402, leaving
    // grey boxes on phones. Our photos are 100–500 KB, so the cost is small.
    // While this is on, formats and minimumCacheTTL below have no effect.
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
    // Every upload gets a new file name (timestamp + UUID), so an image at a
    // given URL never changes. The default 4-hour TTL made Vercel transform
    // each image again every 4 hours, and every one of those counts against
    // the monthly Image Transformations quota.
    minimumCacheTTL: 2678400, // 31 days
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      ...(supabaseHost
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHost,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : [
            {
              protocol: "https" as const,
              hostname: "*.supabase.co",
              pathname: "/storage/v1/object/public/**",
            },
          ]),
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // The test site stays out of search engines, files included.
          ...(process.env.NEXT_PUBLIC_APP_ENV?.trim().replace(/^["']|["']$/g, "").toLowerCase() === "pre"
            ? [{ key: "X-Robots-Tag", value: "noindex, nofollow" }]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;

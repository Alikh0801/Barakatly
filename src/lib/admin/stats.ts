import { createClient } from "@/lib/supabase/server";

export const STATS_PERIODS = [
  { days: 1, label: "Bu gün" },
  { days: 7, label: "Son 7 gün" },
  { days: 21, label: "Son 21 gün" },
] as const;

export type StatsPeriod = (typeof STATS_PERIODS)[number]["days"];

export type StatsRow = { label: string | null; views: number };

export type PageViewStats = {
  days: number;
  views: number;
  visitors: number;
  signedInViews: number;
  daily: { day: string; views: number; visitors: number }[];
  hourly: { hour: number; views: number }[];
  pages: { path: string; label: string; views: number }[];
  countries: StatsRow[];
  cities: (StatsRow & { country: string | null })[];
  devices: StatsRow[];
  browsers: StatsRow[];
  os: StatsRow[];
  referrers: StatsRow[];
  roles: StatsRow[];
};

type RawStats = {
  days: number;
  views: number;
  visitors: number;
  signed_in_views: number;
  daily: { day: string; views: number; visitors: number }[];
  hourly: { hour: number; views: number }[];
  pages: { label: string; views: number }[];
  countries: StatsRow[];
  cities: (StatsRow & { country: string | null })[];
  devices: StatsRow[];
  browsers: StatsRow[];
  os: StatsRow[];
  referrers: StatsRow[];
  roles: StatsRow[];
};

const PAGE_NAMES: Record<string, string> = {
  "/": "Ana səhifə",
  "/shop": "Mağaza",
  "/farmers": "Fermerlər",
  "/farmers/apply": "Fermer ol",
  "/about": "Haqqımızda",
  "/search": "Axtarış",
  "/cart": "Səbət",
  "/checkout": "Sifarişin rəsmiləşdirilməsi",
  "/orders": "Sifarişlərim",
  "/account": "Hesabım",
  "/notifications": "Bildirişlər",
  "/signin": "Daxil ol",
  "/signup": "Qeydiyyat",
  "/farmer": "Fermer paneli",
  "/courier": "Kuryer paneli",
};

const UUID_SEGMENT = "([0-9a-f-]{36})";
const PRODUCT_PATH = new RegExp(`^/shop/${UUID_SEGMENT}$`, "i");
const FARMER_PATH = new RegExp(`^/farmers/${UUID_SEGMENT}$`, "i");
const ORDER_PATH = new RegExp(`^/orders/${UUID_SEGMENT}$`, "i");

/**
 * Gives product and farmer pages their names instead of a bare id, so
 * "most viewed pages" reads as a list of products and farms.
 */
async function labelPages(
  supabase: Awaited<ReturnType<typeof createClient>>,
  pages: { label: string; views: number }[],
) {
  const productIds = pages.flatMap((p) => p.label.match(PRODUCT_PATH)?.[1] ?? []);
  const farmerIds = pages.flatMap((p) => p.label.match(FARMER_PATH)?.[1] ?? []);

  const [products, farmers] = await Promise.all([
    productIds.length
      ? supabase.from("products").select("id, title").in("id", productIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    farmerIds.length
      ? supabase.from("farmers").select("id, owner_name").in("id", farmerIds)
      : Promise.resolve({ data: [] as { id: string; owner_name: string | null }[] }),
  ]);

  const productTitles = new Map((products.data ?? []).map((p) => [p.id, p.title]));
  const farmerNames = new Map((farmers.data ?? []).map((f) => [f.id, f.owner_name]));

  return pages.map((page) => {
    const path = page.label;
    const productId = path.match(PRODUCT_PATH)?.[1];
    const farmerId = path.match(FARMER_PATH)?.[1];
    let label = PAGE_NAMES[path] ?? path;
    if (productId) label = `Məhsul: ${productTitles.get(productId) ?? "silinmiş məhsul"}`;
    else if (farmerId) label = `Fermer: ${farmerNames.get(farmerId) ?? "silinmiş fermer"}`;
    else if (ORDER_PATH.test(path)) label = "Sifariş səhifəsi";
    return { path, label, views: page.views };
  });
}

export function parseStatsPeriod(value?: string): StatsPeriod {
  const days = Number(value);
  return STATS_PERIODS.some((p) => p.days === days) ? (days as StatsPeriod) : 7;
}

export async function getPageViewStats(days: StatsPeriod): Promise<PageViewStats | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_page_view_stats", { p_days: days });

  if (error || !data) {
    console.error("[admin.getPageViewStats]", error?.message);
    return null;
  }

  const raw = data as unknown as RawStats;
  return {
    days: raw.days,
    views: raw.views,
    visitors: raw.visitors,
    signedInViews: raw.signed_in_views,
    daily: raw.daily,
    hourly: raw.hourly,
    pages: await labelPages(supabase, raw.pages),
    countries: raw.countries,
    cities: raw.cities,
    devices: raw.devices,
    browsers: raw.browsers,
    os: raw.os,
    referrers: raw.referrers,
    roles: raw.roles,
  };
}

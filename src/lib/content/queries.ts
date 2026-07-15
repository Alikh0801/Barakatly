import { unstable_cache } from "next/cache";
import {
  WHY_BARAKATLY_DEFAULT,
  WHY_BARAKATLY_DEFAULT_FEATURES,
  WHY_BARAKATLY_KEY,
  type WhyBarakatlyFeature,
} from "@/lib/content/defaults";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";

export type WhyBarakatlyContent = {
  key: string;
  title: string;
  body: string;
  items: WhyBarakatlyFeature[];
  updated_at?: string;
};

function parseFeatures(value: unknown): WhyBarakatlyFeature[] {
  const defaults = [...WHY_BARAKATLY_DEFAULT_FEATURES];
  if (!Array.isArray(value) || value.length === 0) {
    return defaults;
  }

  return defaults.map((fallback, index) => {
    const item = value[index];
    if (!item || typeof item !== "object") return fallback;
    const record = item as Record<string, unknown>;
    const title = String(record.title ?? "").trim();
    const description = String(record.description ?? "").trim();
    const icon = String(record.icon ?? "").trim() || fallback.icon;
    if (!title || !description) return fallback;
    return { title, description, icon };
  });
}

async function fetchWhyBarakatly(): Promise<WhyBarakatlyContent> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("site_content")
    .select("key, title, body, items")
    .eq("key", WHY_BARAKATLY_KEY)
    .maybeSingle();

  if (error) {
    console.error("[content.getWhyBarakatly]", error.message);
    return {
      key: WHY_BARAKATLY_DEFAULT.key,
      title: WHY_BARAKATLY_DEFAULT.title,
      body: WHY_BARAKATLY_DEFAULT.body,
      items: [...WHY_BARAKATLY_DEFAULT_FEATURES],
    };
  }

  if (!data) {
    return {
      key: WHY_BARAKATLY_DEFAULT.key,
      title: WHY_BARAKATLY_DEFAULT.title,
      body: WHY_BARAKATLY_DEFAULT.body,
      items: [...WHY_BARAKATLY_DEFAULT_FEATURES],
    };
  }

  return {
    key: data.key,
    title: data.title,
    body: data.body,
    items: parseFeatures(data.items),
  };
}

export const getWhyBarakatlyContent = unstable_cache(
  fetchWhyBarakatly,
  ["why-barakatly-content"],
  { revalidate: 300, tags: ["site-content", "why-barakatly"] }
);

export async function getAdminWhyBarakatlyContent(): Promise<WhyBarakatlyContent> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_content")
    .select("key, title, body, items, updated_at")
    .eq("key", WHY_BARAKATLY_KEY)
    .maybeSingle();

  if (error) {
    console.error("[admin.getWhyBarakatly]", error.message);
    return {
      key: WHY_BARAKATLY_DEFAULT.key,
      title: WHY_BARAKATLY_DEFAULT.title,
      body: WHY_BARAKATLY_DEFAULT.body,
      items: [...WHY_BARAKATLY_DEFAULT_FEATURES],
      updated_at: new Date(0).toISOString(),
    };
  }

  if (!data) {
    return {
      key: WHY_BARAKATLY_DEFAULT.key,
      title: WHY_BARAKATLY_DEFAULT.title,
      body: WHY_BARAKATLY_DEFAULT.body,
      items: [...WHY_BARAKATLY_DEFAULT_FEATURES],
      updated_at: new Date(0).toISOString(),
    };
  }

  return {
    key: data.key,
    title: data.title,
    body: data.body,
    items: parseFeatures(data.items),
    updated_at: data.updated_at,
  };
}

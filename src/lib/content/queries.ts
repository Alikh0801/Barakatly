import { unstable_cache } from "next/cache";
import {
  WHY_BARAKATLY_DEFAULT,
  WHY_BARAKATLY_KEY,
} from "@/lib/content/defaults";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import type { SiteContent } from "@/types";

async function fetchWhyBarakatly(): Promise<
  Pick<SiteContent, "key" | "title" | "body">
> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("site_content")
    .select("key, title, body")
    .eq("key", WHY_BARAKATLY_KEY)
    .maybeSingle();

  if (error) {
    console.error("[content.getWhyBarakatly]", error.message);
    return { ...WHY_BARAKATLY_DEFAULT };
  }

  if (!data) return { ...WHY_BARAKATLY_DEFAULT };
  return data;
}

export const getWhyBarakatlyContent = unstable_cache(
  fetchWhyBarakatly,
  ["why-barakatly-content"],
  { revalidate: 300, tags: ["site-content", "why-barakatly"] }
);

export async function getAdminWhyBarakatlyContent(): Promise<
  Pick<SiteContent, "key" | "title" | "body" | "updated_at">
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_content")
    .select("key, title, body, updated_at")
    .eq("key", WHY_BARAKATLY_KEY)
    .maybeSingle();

  if (error) {
    console.error("[admin.getWhyBarakatly]", error.message);
    return {
      ...WHY_BARAKATLY_DEFAULT,
      updated_at: new Date(0).toISOString(),
    };
  }

  if (!data) {
    return {
      ...WHY_BARAKATLY_DEFAULT,
      updated_at: new Date(0).toISOString(),
    };
  }

  return data;
}

import { unstable_cache } from "next/cache";
import {
  ABOUT_DEFAULT,
  ABOUT_DEFAULT_ITEMS,
  ABOUT_DEFAULT_VALUES,
  ABOUT_KEY,
  FAQ_DEFAULT,
  FAQ_DEFAULT_ITEMS,
  FAQ_KEY,
  WHY_BARAKATLY_DEFAULT,
  WHY_BARAKATLY_DEFAULT_FEATURES,
  WHY_BARAKATLY_KEY,
  type AboutItems,
  type AboutValue,
  type FaqItem,
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

export type FaqContent = {
  key: string;
  title: string;
  items: FaqItem[];
  updated_at?: string;
};

function parseFaqItems(value: unknown): FaqItem[] {
  if (!Array.isArray(value) || value.length === 0) {
    return [...FAQ_DEFAULT_ITEMS];
  }

  const items = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const question = String(
        record.question ?? record.title ?? record.q ?? ""
      ).trim();
      const answer = String(
        record.answer ?? record.description ?? record.a ?? ""
      ).trim();
      if (!question || !answer) return null;
      return { question, answer };
    })
    .filter((item): item is FaqItem => item !== null);

  return items.length > 0 ? items : [...FAQ_DEFAULT_ITEMS];
}

async function fetchFaqContent(): Promise<FaqContent> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("site_content")
    .select("key, title, items")
    .eq("key", FAQ_KEY)
    .maybeSingle();

  if (error) {
    console.error("[content.getFaq]", error.message);
    return {
      key: FAQ_DEFAULT.key,
      title: FAQ_DEFAULT.title,
      items: [...FAQ_DEFAULT_ITEMS],
    };
  }

  if (!data) {
    return {
      key: FAQ_DEFAULT.key,
      title: FAQ_DEFAULT.title,
      items: [...FAQ_DEFAULT_ITEMS],
    };
  }

  return {
    key: data.key,
    title: data.title,
    items: parseFaqItems(data.items),
  };
}

export const getFaqContent = unstable_cache(fetchFaqContent, ["faq-content"], {
  revalidate: 300,
  tags: ["site-content", "faq"],
});

export async function getAdminFaqContent(): Promise<FaqContent> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_content")
    .select("key, title, items, updated_at")
    .eq("key", FAQ_KEY)
    .maybeSingle();

  if (error) {
    console.error("[admin.getFaq]", error.message);
    return {
      key: FAQ_DEFAULT.key,
      title: FAQ_DEFAULT.title,
      items: [...FAQ_DEFAULT_ITEMS],
      updated_at: new Date(0).toISOString(),
    };
  }

  if (!data) {
    return {
      key: FAQ_DEFAULT.key,
      title: FAQ_DEFAULT.title,
      items: [...FAQ_DEFAULT_ITEMS],
      updated_at: new Date(0).toISOString(),
    };
  }

  return {
    key: data.key,
    title: data.title,
    items: parseFaqItems(data.items),
    updated_at: data.updated_at,
  };
}

export type AboutContent = {
  key: string;
  title: string;
  body: string;
  items: AboutItems;
  updated_at?: string;
};

function parseAboutValues(value: unknown): AboutValue[] {
  const defaults = [...ABOUT_DEFAULT_VALUES];
  if (!Array.isArray(value) || value.length === 0) return defaults;

  return defaults.map((fallback, index) => {
    const item = value[index];
    if (!item || typeof item !== "object") return fallback;
    const record = item as Record<string, unknown>;
    const title = String(record.title ?? "").trim();
    const text = String(record.text ?? record.description ?? "").trim();
    if (!title || !text) return fallback;
    return { title, text };
  });
}

function parseAboutItems(value: unknown): AboutItems {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      ...ABOUT_DEFAULT_ITEMS,
      values: [...ABOUT_DEFAULT_VALUES],
    };
  }

  const record = value as Record<string, unknown>;
  const missionTitle =
    String(record.missionTitle ?? "").trim() ||
    ABOUT_DEFAULT_ITEMS.missionTitle;
  const missionBody =
    String(record.missionBody ?? "").trim() || ABOUT_DEFAULT_ITEMS.missionBody;
  const farmerTitle =
    String(record.farmerTitle ?? "").trim() || ABOUT_DEFAULT_ITEMS.farmerTitle;
  const farmerBody =
    String(record.farmerBody ?? "").trim() || ABOUT_DEFAULT_ITEMS.farmerBody;

  return {
    missionTitle,
    missionBody,
    values: parseAboutValues(record.values),
    farmerTitle,
    farmerBody,
  };
}

async function fetchAboutContent(): Promise<AboutContent> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("site_content")
    .select("key, title, body, items")
    .eq("key", ABOUT_KEY)
    .maybeSingle();

  if (error) {
    console.error("[content.getAbout]", error.message);
    return {
      key: ABOUT_DEFAULT.key,
      title: ABOUT_DEFAULT.title,
      body: ABOUT_DEFAULT.body,
      items: {
        ...ABOUT_DEFAULT_ITEMS,
        values: [...ABOUT_DEFAULT_VALUES],
      },
    };
  }

  if (!data) {
    return {
      key: ABOUT_DEFAULT.key,
      title: ABOUT_DEFAULT.title,
      body: ABOUT_DEFAULT.body,
      items: {
        ...ABOUT_DEFAULT_ITEMS,
        values: [...ABOUT_DEFAULT_VALUES],
      },
    };
  }

  return {
    key: data.key,
    title: data.title,
    body: data.body,
    items: parseAboutItems(data.items),
  };
}

export const getAboutContent = unstable_cache(
  fetchAboutContent,
  ["about-content"],
  { revalidate: 300, tags: ["site-content", "about"] },
);

export async function getAdminAboutContent(): Promise<AboutContent> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_content")
    .select("key, title, body, items, updated_at")
    .eq("key", ABOUT_KEY)
    .maybeSingle();

  if (error) {
    console.error("[admin.getAbout]", error.message);
    return {
      key: ABOUT_DEFAULT.key,
      title: ABOUT_DEFAULT.title,
      body: ABOUT_DEFAULT.body,
      items: {
        ...ABOUT_DEFAULT_ITEMS,
        values: [...ABOUT_DEFAULT_VALUES],
      },
      updated_at: new Date(0).toISOString(),
    };
  }

  if (!data) {
    return {
      key: ABOUT_DEFAULT.key,
      title: ABOUT_DEFAULT.title,
      body: ABOUT_DEFAULT.body,
      items: {
        ...ABOUT_DEFAULT_ITEMS,
        values: [...ABOUT_DEFAULT_VALUES],
      },
      updated_at: new Date(0).toISOString(),
    };
  }

  return {
    key: data.key,
    title: data.title,
    body: data.body,
    items: parseAboutItems(data.items),
    updated_at: data.updated_at,
  };
}

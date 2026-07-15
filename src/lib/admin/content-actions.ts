"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import {
  FAQ_DEFAULT,
  FAQ_DEFAULT_ITEMS,
  FAQ_KEY,
  WHY_BARAKATLY_DEFAULT,
  WHY_BARAKATLY_DEFAULT_FEATURES,
  WHY_BARAKATLY_KEY,
  type FaqItem,
  type WhyBarakatlyFeature,
} from "@/lib/content/defaults";
import { createClient } from "@/lib/supabase/server";

export type AdminContentActionState = {
  error?: string;
  success?: string;
};

const FEATURE_COUNT = 4;

function parseFeatureForm(formData: FormData): WhyBarakatlyFeature[] | string {
  const features: WhyBarakatlyFeature[] = [];

  for (let index = 0; index < FEATURE_COUNT; index += 1) {
    const title = String(formData.get(`feature_title_${index}`) ?? "").trim();
    const description = String(
      formData.get(`feature_description_${index}`) ?? ""
    ).trim();
    const icon =
      String(formData.get(`feature_icon_${index}`) ?? "").trim() ||
      WHY_BARAKATLY_DEFAULT_FEATURES[index]?.icon ||
      "🌿";

    if (!title) return `${index + 1}-ci kartın başlığı tələb olunur.`;
    if (!description) return `${index + 1}-ci kartın mətni tələb olunur.`;
    if (title.length > 80) return `${index + 1}-ci kartın başlığı çox uzundur.`;
    if (description.length > 300) {
      return `${index + 1}-ci kartın mətni çox uzundur.`;
    }

    features.push({ title, description, icon });
  }

  return features;
}

function revalidateWhyContent() {
  updateTag("site-content");
  updateTag("why-barakatly");
  revalidatePath("/");
  revalidatePath("/admin/content");
}

function revalidateFaqContent() {
  updateTag("site-content");
  updateTag("faq");
  revalidatePath("/");
  revalidatePath("/admin/content");
}

function parseFaqForm(formData: FormData): FaqItem[] | string {
  const count = Number.parseInt(String(formData.get("faq_count") ?? "0"), 10);
  if (!Number.isFinite(count) || count < 1) {
    return "Ən azı 1 sual lazımdır.";
  }
  if (count > 20) return "Maksimum 20 sual ola bilər.";

  const items: FaqItem[] = [];
  for (let index = 0; index < count; index += 1) {
    const question = String(formData.get(`faq_question_${index}`) ?? "").trim();
    const answer = String(formData.get(`faq_answer_${index}`) ?? "").trim();
    if (!question) return `${index + 1}-ci sual tələb olunur.`;
    if (!answer) return `${index + 1}-ci cavab tələb olunur.`;
    if (question.length > 200) return `${index + 1}-ci sual çox uzundur.`;
    if (answer.length > 1000) return `${index + 1}-ci cavab çox uzundur.`;
    items.push({ question, answer });
  }

  return items;
}

export async function updateWhyBarakatlyContent(
  _prev: AdminContentActionState,
  formData: FormData
): Promise<AdminContentActionState> {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const features = parseFeatureForm(formData);

  if (!title) return { error: "Başlıq tələb olunur." };
  if (!body) return { error: "Mətn tələb olunur." };
  if (title.length > 120) return { error: "Başlıq çox uzundur." };
  if (body.length > 500) return { error: "Mətn çox uzundur." };
  if (typeof features === "string") return { error: features };

  const supabase = await createClient();
  const { error } = await supabase.from("site_content").upsert(
    {
      key: WHY_BARAKATLY_KEY,
      title,
      body,
      items: features,
    },
    { onConflict: "key" }
  );

  if (error) {
    console.error("[admin.updateWhyBarakatlyContent]", error.message);
    if (error.message.toLowerCase().includes("site_content")) {
      return {
        error:
          "site_content cədvəli tapılmadı. Supabase-də 009_site_content.sql işə salın.",
      };
    }
    if (error.message.toLowerCase().includes("items")) {
      return {
        error:
          "items sütunu tapılmadı. Supabase-də 009_site_content.sql-i yenidən işə salın.",
      };
    }
    return { error: "Məzmun yenilənmədi." };
  }

  revalidateWhyContent();
  return { success: "Niyə Barakatly? bölməsi yeniləndi." };
}

export async function resetWhyBarakatlyContent(
  _prev: AdminContentActionState,
  _formData: FormData
): Promise<AdminContentActionState> {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase.from("site_content").upsert(
    {
      key: WHY_BARAKATLY_KEY,
      title: WHY_BARAKATLY_DEFAULT.title,
      body: WHY_BARAKATLY_DEFAULT.body,
      items: [...WHY_BARAKATLY_DEFAULT_FEATURES],
    },
    { onConflict: "key" }
  );

  if (error) {
    console.error("[admin.resetWhyBarakatlyContent]", error.message);
    return { error: "Default məzmun bərpa edilmədi." };
  }

  revalidateWhyContent();
  return { success: "Default məzmun bərpa olundu." };
}

export async function updateFaqContent(
  _prev: AdminContentActionState,
  formData: FormData
): Promise<AdminContentActionState> {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const items = parseFaqForm(formData);

  if (!title) return { error: "Başlıq tələb olunur." };
  if (title.length > 120) return { error: "Başlıq çox uzundur." };
  if (typeof items === "string") return { error: items };

  const supabase = await createClient();
  const { error } = await supabase.from("site_content").upsert(
    {
      key: FAQ_KEY,
      title,
      body: "",
      items,
    },
    { onConflict: "key" }
  );

  if (error) {
    console.error("[admin.updateFaqContent]", error.message);
    if (error.message.toLowerCase().includes("site_content")) {
      return {
        error:
          "site_content cədvəli tapılmadı. Supabase-də 009_site_content.sql işə salın.",
      };
    }
    return { error: "FAQ yenilənmədi." };
  }

  revalidateFaqContent();
  return { success: "Tez-tez verilən suallar yeniləndi." };
}

export async function resetFaqContent(
  _prev: AdminContentActionState,
  _formData: FormData
): Promise<AdminContentActionState> {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase.from("site_content").upsert(
    {
      key: FAQ_KEY,
      title: FAQ_DEFAULT.title,
      body: FAQ_DEFAULT.body,
      items: [...FAQ_DEFAULT_ITEMS],
    },
    { onConflict: "key" }
  );

  if (error) {
    console.error("[admin.resetFaqContent]", error.message);
    return { error: "Default FAQ bərpa edilmədi." };
  }

  revalidateFaqContent();
  return { success: "Default FAQ bərpa olundu." };
}

"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { uploadHeroImage } from "@/lib/admin/hero-image-upload";
import {
  ABOUT_DEFAULT,
  ABOUT_DEFAULT_ITEMS,
  ABOUT_DEFAULT_VALUES,
  ABOUT_KEY,
  FAQ_DEFAULT,
  FAQ_DEFAULT_ITEMS,
  FAQ_KEY,
  HERO_DEFAULT,
  HERO_DEFAULT_ITEMS,
  HERO_KEY,
  WHY_BARAKATLY_DEFAULT,
  WHY_BARAKATLY_DEFAULT_FEATURES,
  WHY_BARAKATLY_KEY,
  type AboutItems,
  type AboutValue,
  type FaqItem,
  type HeroItems,
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

function revalidateHeroContent() {
  updateTag("site-content");
  updateTag("hero");
  revalidatePath("/");
  revalidatePath("/admin/hero");
}

type HeroFormResult = { title: string; body: string; items: HeroItems };

function parseHeroForm(
  formData: FormData,
  currentImageUrl: string,
): HeroFormResult | string {
  const title = String(formData.get("title") ?? "").trim();
  const highlight = String(formData.get("highlight") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!title) return "Başlığın 1-ci sətri tələb olunur.";
  if (!highlight) return "Başlığın 2-ci sətri tələb olunur.";
  if (!body) return "Alt mətn tələb olunur.";
  if (title.length > 60) return "Başlığın 1-ci sətri çox uzundur.";
  if (highlight.length > 60) return "Başlığın 2-ci sətri çox uzundur.";
  if (body.length > 400) return "Alt mətn çox uzundur.";

  return {
    title,
    body,
    items: { highlight, imageUrl: currentImageUrl },
  };
}

export async function updateHeroContent(
  _prev: AdminContentActionState,
  formData: FormData
): Promise<AdminContentActionState> {
  await requireAdmin();

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("site_content")
    .select("items")
    .eq("key", HERO_KEY)
    .maybeSingle();

  const existingItems = existing?.items as Partial<HeroItems> | null;
  let imageUrl = existingItems?.imageUrl || HERO_DEFAULT_ITEMS.imageUrl;

  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    const uploaded = await uploadHeroImage(supabase, image);
    if ("error" in uploaded) return { error: uploaded.error };
    imageUrl = uploaded.url;
  }

  const parsed = parseHeroForm(formData, imageUrl);
  if (typeof parsed === "string") return { error: parsed };

  const { error } = await supabase.from("site_content").upsert(
    {
      key: HERO_KEY,
      title: parsed.title,
      body: parsed.body,
      items: parsed.items,
    },
    { onConflict: "key" }
  );

  if (error) {
    console.error("[admin.updateHeroContent]", error.message);
    if (error.message.toLowerCase().includes("site_content")) {
      return {
        error:
          "site_content cədvəli tapılmadı. Supabase-də 009_site_content.sql işə salın.",
      };
    }
    return { error: "Hero bölməsi yenilənmədi." };
  }

  revalidateHeroContent();
  return { success: "Hero bölməsi yeniləndi." };
}

export async function resetHeroContent(
  _prev: AdminContentActionState,
  _formData: FormData
): Promise<AdminContentActionState> {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase.from("site_content").upsert(
    {
      key: HERO_KEY,
      title: HERO_DEFAULT.title,
      body: HERO_DEFAULT.body,
      items: { ...HERO_DEFAULT_ITEMS },
    },
    { onConflict: "key" }
  );

  if (error) {
    console.error("[admin.resetHeroContent]", error.message);
    return { error: "Default Hero məzmunu bərpa edilmədi." };
  }

  revalidateHeroContent();
  return { success: "Default Hero məzmunu bərpa olundu." };
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

const VALUE_COUNT = 3;

function parseAboutForm(formData: FormData): AboutItems | string {
  const missionTitle = String(formData.get("mission_title") ?? "").trim();
  const missionBody = String(formData.get("mission_body") ?? "").trim();
  const farmerTitle = String(formData.get("farmer_title") ?? "").trim();
  const farmerBody = String(formData.get("farmer_body") ?? "").trim();

  if (!missionTitle) return "Missiya başlığı tələb olunur.";
  if (!missionBody) return "Missiya mətni tələb olunur.";
  if (!farmerTitle) return "Fermer bölməsi başlığı tələb olunur.";
  if (!farmerBody) return "Fermer bölməsi mətni tələb olunur.";
  if (missionTitle.length > 120) return "Missiya başlığı çox uzundur.";
  if (missionBody.length > 1000) return "Missiya mətni çox uzundur.";
  if (farmerTitle.length > 120) return "Fermer bölməsi başlığı çox uzundur.";
  if (farmerBody.length > 500) return "Fermer bölməsi mətni çox uzundur.";

  const values: AboutValue[] = [];
  for (let index = 0; index < VALUE_COUNT; index += 1) {
    const title = String(formData.get(`value_title_${index}`) ?? "").trim();
    const text = String(formData.get(`value_text_${index}`) ?? "").trim();
    if (!title) return `${index + 1}-ci dəyərin başlığı tələb olunur.`;
    if (!text) return `${index + 1}-ci dəyərin mətni tələb olunur.`;
    if (title.length > 80) return `${index + 1}-ci dəyərin başlığı çox uzundur.`;
    if (text.length > 400) return `${index + 1}-ci dəyərin mətni çox uzundur.`;
    values.push({ title, text });
  }

  return {
    missionTitle,
    missionBody,
    values,
    farmerTitle,
    farmerBody,
  };
}

function revalidateAboutContent() {
  updateTag("site-content");
  updateTag("about");
  revalidatePath("/about");
  revalidatePath("/admin/content");
}

export async function updateAboutContent(
  _prev: AdminContentActionState,
  formData: FormData
): Promise<AdminContentActionState> {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const items = parseAboutForm(formData);

  if (!title) return { error: "Başlıq tələb olunur." };
  if (!body) return { error: "Mətn tələb olunur." };
  if (title.length > 160) return { error: "Başlıq çox uzundur." };
  if (body.length > 1000) return { error: "Mətn çox uzundur." };
  if (typeof items === "string") return { error: items };

  const supabase = await createClient();
  const { error } = await supabase.from("site_content").upsert(
    {
      key: ABOUT_KEY,
      title,
      body,
      items,
    },
    { onConflict: "key" }
  );

  if (error) {
    console.error("[admin.updateAboutContent]", error.message);
    if (error.message.toLowerCase().includes("site_content")) {
      return {
        error:
          "site_content cədvəli tapılmadı. Supabase-də 009_site_content.sql işə salın.",
      };
    }
    return { error: "Haqqımızda məzmunu yenilənmədi." };
  }

  revalidateAboutContent();
  return { success: "Haqqımızda səhifəsi yeniləndi." };
}

export async function resetAboutContent(
  _prev: AdminContentActionState,
  _formData: FormData
): Promise<AdminContentActionState> {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase.from("site_content").upsert(
    {
      key: ABOUT_KEY,
      title: ABOUT_DEFAULT.title,
      body: ABOUT_DEFAULT.body,
      items: {
        ...ABOUT_DEFAULT_ITEMS,
        values: [...ABOUT_DEFAULT_VALUES],
      },
    },
    { onConflict: "key" }
  );

  if (error) {
    console.error("[admin.resetAboutContent]", error.message);
    return { error: "Default Haqqımızda məzmunu bərpa edilmədi." };
  }

  revalidateAboutContent();
  return { success: "Default Haqqımızda məzmunu bərpa olundu." };
}

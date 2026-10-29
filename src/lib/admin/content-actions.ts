"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { resolveSiteImagePath } from "@/lib/admin/site-image-upload";
import { readLogoHeader, siteLogoError, SITE_LOGO_TYPE_ERROR } from "@/lib/admin/site-logo";
import { ogImageError, OG_IMAGE_TYPE_ERROR } from "@/lib/admin/og-image-rules";
import { isSingleEmoji } from "@/lib/content/emoji";
import {
  ABOUT_DEFAULT,
  ABOUT_DEFAULT_ITEMS,
  ABOUT_DEFAULT_VALUES,
  ABOUT_KEY,
  AUTH_IMAGE_DEFAULT,
  AUTH_IMAGE_DEFAULT_ITEMS,
  AUTH_IMAGE_KEY,
  FAQ_DEFAULT,
  FAQ_DEFAULT_ITEMS,
  FAQ_KEY,
  HERO_DEFAULT,
  HERO_DEFAULT_ITEMS,
  HERO_KEY,
  OG_IMAGE_DEFAULT,
  OG_IMAGE_KEY,
  type OgImageItems,
  SITE_LOGO_DEFAULT_URL,
  SITE_LOGO_KEY,
  WHY_BARAKATLY_DEFAULT,
  WHY_BARAKATLY_DEFAULT_FEATURES,
  WHY_BARAKATLY_KEY,
  type AboutItems,
  type AboutValue,
  type AuthImageItems,
  type FaqItem,
  type HeroItems,
  type HeroStats,
  type SiteLogoItems,
  HERO_STAT_FIELDS,
  HERO_STAT_MAX_LENGTH,
  type WhyBarakatlyFeature,
} from "@/lib/content/defaults";
import { CONTACT_KEY } from "@/lib/content/defaults";
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
    if (!isSingleEmoji(icon)) return `${index + 1}-ci kartın ikonu bir emoji olmalıdır.`;

    if (!title) return `${index + 1}-ci kartın başlığı tələb olunur.`;
    if (!description) return `${index + 1}-ci kartın mətni tələb olunur.`;
    if (title.length > 80) return `${index + 1}-ci kartın başlığı çox uzundur.`;
    if (description.length > 300) {
      return `${index + 1}-ci kartın mətni çox uzundur.`;
    }

    const enabled = formData.get(`feature_enabled_${index}`) !== "0";
    features.push({ title, description, icon, enabled });
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
  mobileImageUrl: string,
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

  const stats: HeroStats = { farmers: "", products: "", customers: "" };
  for (const field of HERO_STAT_FIELDS) {
    const value = String(formData.get(`stat_${field.key}`) ?? "").trim();
    if (value.length > HERO_STAT_MAX_LENGTH) {
      return `"${field.label}" göstəricisi ən çox ${HERO_STAT_MAX_LENGTH} simvol ola bilər.`;
    }
    if (value && !/\d/.test(value)) {
      return `"${field.label}" göstəricisində rəqəm olmalıdır (məsələn 200+).`;
    }
    stats[field.key] = value;
  }

  return {
    title,
    body,
    items: { highlight, imageUrl: currentImageUrl, mobileImageUrl, stats },
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
  let mobileImageUrl = existingItems?.mobileImageUrl ?? "";

  // The browser has already uploaded any new photo; only its path is sent.
  const imagePath = String(formData.get("image_path") ?? "").trim();
  if (imagePath) {
    const resolved = await resolveSiteImagePath(supabase, imagePath, "hero");
    if ("error" in resolved) return { error: resolved.error };
    imageUrl = resolved.url;
  }

  const mobileImagePath = String(formData.get("mobile_image_path") ?? "").trim();
  if (mobileImagePath) {
    const resolved = await resolveSiteImagePath(supabase, mobileImagePath, "hero");
    if ("error" in resolved) return { error: `Mobil şəkil: ${resolved.error}` };
    mobileImageUrl = resolved.url;
  } else if (imagePath || String(formData.get("remove_mobile_image") ?? "") === "1") {
    // A new background on its own replaces the picture on every screen: an
    // older portrait upload kept showing on phones and looked like the new
    // one hadn't saved.
    mobileImageUrl = "";
  }

  const parsed = parseHeroForm(formData, imageUrl, mobileImageUrl);
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
  // The button restores the text and photo; the figures are kept.
  const { data: existing } = await supabase
    .from("site_content")
    .select("items")
    .eq("key", HERO_KEY)
    .maybeSingle();
  const existingStats = (existing?.items as Partial<HeroItems> | null)?.stats;

  const { error } = await supabase.from("site_content").upsert(
    {
      key: HERO_KEY,
      title: HERO_DEFAULT.title,
      body: HERO_DEFAULT.body,
      items: {
        ...HERO_DEFAULT_ITEMS,
        stats: { ...HERO_DEFAULT_ITEMS.stats, ...existingStats },
      },
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

function revalidateAuthImageContent() {
  updateTag("site-content");
  updateTag("auth-image");
  revalidatePath("/signin");
  revalidatePath("/signup");
  revalidatePath("/admin/hero");
}

type AuthImageFormResult = { title: string; body: string; items: AuthImageItems };

function parseAuthImageForm(
  formData: FormData,
  currentImageUrl: string,
): AuthImageFormResult | string {
  const title = String(formData.get("title") ?? "").trim();
  const highlight = String(formData.get("highlight") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!title) return "Başlığın 1-ci sətri tələb olunur.";
  if (!highlight) return "Başlığın 2-ci sətri tələb olunur.";
  if (!body) return "Alt mətn tələb olunur.";
  if (title.length > 60) return "Başlığın 1-ci sətri çox uzundur.";
  if (highlight.length > 60) return "Başlığın 2-ci sətri çox uzundur.";
  if (body.length > 300) return "Alt mətn çox uzundur.";

  return {
    title,
    body,
    items: { highlight, imageUrl: currentImageUrl },
  };
}

export async function updateAuthImageContent(
  _prev: AdminContentActionState,
  formData: FormData
): Promise<AdminContentActionState> {
  await requireAdmin();

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("site_content")
    .select("items")
    .eq("key", AUTH_IMAGE_KEY)
    .maybeSingle();

  const existingItems = existing?.items as Partial<AuthImageItems> | null;
  let imageUrl = existingItems?.imageUrl || AUTH_IMAGE_DEFAULT_ITEMS.imageUrl;

  // The browser has already uploaded any new photo; only its path is sent.
  const imagePath = String(formData.get("image_path") ?? "").trim();
  if (imagePath) {
    const resolved = await resolveSiteImagePath(supabase, imagePath, "auth");
    if ("error" in resolved) return { error: resolved.error };
    imageUrl = resolved.url;
  }

  const parsed = parseAuthImageForm(formData, imageUrl);
  if (typeof parsed === "string") return { error: parsed };

  const { error } = await supabase.from("site_content").upsert(
    {
      key: AUTH_IMAGE_KEY,
      title: parsed.title,
      body: parsed.body,
      items: parsed.items,
    },
    { onConflict: "key" }
  );

  if (error) {
    console.error("[admin.updateAuthImageContent]", error.message);
    if (error.message.toLowerCase().includes("site_content")) {
      return {
        error:
          "site_content cədvəli tapılmadı. Supabase-də 009_site_content.sql işə salın.",
      };
    }
    return { error: "Giriş şəkli yenilənmədi." };
  }

  revalidateAuthImageContent();
  return { success: "Giriş səhifəsi yeniləndi." };
}

export async function resetAuthImageContent(
  _prev: AdminContentActionState,
  _formData: FormData
): Promise<AdminContentActionState> {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase.from("site_content").upsert(
    {
      key: AUTH_IMAGE_KEY,
      title: AUTH_IMAGE_DEFAULT.title,
      body: AUTH_IMAGE_DEFAULT.body,
      items: { ...AUTH_IMAGE_DEFAULT_ITEMS },
    },
    { onConflict: "key" }
  );

  if (error) {
    console.error("[admin.resetAuthImageContent]", error.message);
    return { error: "Default giriş şəkli bərpa edilmədi." };
  }

  revalidateAuthImageContent();
  return { success: "Default giriş şəkli bərpa olundu." };
}

function revalidateSiteLogo() {
  updateTag("site-logo");
  // The logo sits in every header and footer.
  revalidatePath("/", "layout");
}

/** Saves a logo the admin's browser uploaded under logo/. */
export async function updateSiteLogo(
  _prev: AdminContentActionState,
  formData: FormData
): Promise<AdminContentActionState> {
  await requireAdmin();

  const logoPath = String(formData.get("logo_path") ?? "").trim();
  if (!logoPath) return { error: "Loqo faylı seçin." };

  const supabase = await createClient();
  const resolved = await resolveSiteImagePath(supabase, logoPath, "logo");
  if ("error" in resolved) return { error: resolved.error };

  // The panel checks the file before uploading, but the request can come
  // from elsewhere: read the stored file's own header.
  const { data: file, error: downloadError } = await supabase.storage
    .from("product-images")
    .download(logoPath);
  if (downloadError || !file) {
    console.error("[admin.updateSiteLogo.download]", downloadError?.message);
    return { error: "Şəkil tapılmadı. Yenidən seçin." };
  }
  const header = readLogoHeader(new Uint8Array(await file.arrayBuffer()));
  if (!header) return { error: SITE_LOGO_TYPE_ERROR };
  const invalid = siteLogoError({ ...header, size: file.size });
  if (invalid) return { error: invalid };

  const { error } = await supabase.from("site_content").upsert(
    {
      key: SITE_LOGO_KEY,
      title: "Loqo",
      body: "",
      items: { logoUrl: resolved.url } satisfies SiteLogoItems,
    },
    { onConflict: "key" }
  );

  if (error) {
    console.error("[admin.updateSiteLogo]", error.message);
    return { error: "Loqo yenilənmədi." };
  }

  revalidateSiteLogo();
  return { success: "Loqo yeniləndi." };
}

export async function resetSiteLogo(
  _prev: AdminContentActionState,
  _formData: FormData
): Promise<AdminContentActionState> {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase.from("site_content").upsert(
    {
      key: SITE_LOGO_KEY,
      title: "Loqo",
      body: "",
      items: { logoUrl: SITE_LOGO_DEFAULT_URL } satisfies SiteLogoItems,
    },
    { onConflict: "key" }
  );

  if (error) {
    console.error("[admin.resetSiteLogo]", error.message);
    return { error: "Default loqo bərpa edilmədi." };
  }

  revalidateSiteLogo();
  return { success: "Default loqo bərpa olundu." };
}

function revalidateOgImage() {
  updateTag("og-image");
  // Every page's preview falls back to it.
  revalidatePath("/", "layout");
}

/** Saves a link-preview picture the admin's browser uploaded under og/. */
export async function updateOgImage(
  _prev: AdminContentActionState,
  formData: FormData
): Promise<AdminContentActionState> {
  await requireAdmin();

  const imagePath = String(formData.get("og_path") ?? "").trim();
  if (!imagePath) return { error: "Şəkil faylı seçin." };

  const supabase = await createClient();
  const resolved = await resolveSiteImagePath(supabase, imagePath, "og");
  if ("error" in resolved) return { error: resolved.error };

  // The panel checks the file before uploading, but the request can come
  // from elsewhere: read the stored file's own header.
  const { data: file, error: downloadError } = await supabase.storage
    .from("product-images")
    .download(imagePath);
  if (downloadError || !file) {
    console.error("[admin.updateOgImage.download]", downloadError?.message);
    return { error: "Şəkil tapılmadı. Yenidən seçin." };
  }
  const header = readLogoHeader(new Uint8Array(await file.arrayBuffer()));
  if (!header) return { error: OG_IMAGE_TYPE_ERROR };
  const invalid = ogImageError({ ...header, size: file.size });
  if (invalid) return { error: invalid };

  const { error } = await supabase.from("site_content").upsert(
    {
      key: OG_IMAGE_KEY,
      title: "Link preview şəkli",
      body: "",
      items: {
        imageUrl: resolved.url,
        width: header.width,
        height: header.height,
      } satisfies OgImageItems,
    },
    { onConflict: "key" }
  );

  if (error) {
    console.error("[admin.updateOgImage]", error.message);
    return { error: "Şəkil yenilənmədi." };
  }

  revalidateOgImage();
  return { success: "Preview şəkli yeniləndi." };
}

export async function resetOgImage(
  _prev: AdminContentActionState,
  _formData: FormData
): Promise<AdminContentActionState> {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase.from("site_content").upsert(
    {
      key: OG_IMAGE_KEY,
      title: "Link preview şəkli",
      body: "",
      items: OG_IMAGE_DEFAULT,
    },
    { onConflict: "key" }
  );

  if (error) {
    console.error("[admin.resetOgImage]", error.message);
    return { error: "Default şəkil bərpa edilmədi." };
  }

  revalidateOgImage();
  return { success: "Default preview şəkli bərpa olundu." };
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
    const enabled = formData.get(`faq_enabled_${index}`) !== "0";
    items.push({ question, answer, enabled });
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
    const enabled = formData.get(`value_enabled_${index}`) !== "0";
    values.push({ title, text, enabled });
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

// Loose on purpose: landlines and short numbers are fine, only digits and
// the usual separators.
const CONTACT_PHONE_PATTERN = /^\+?[\d\s()-]{7,20}$/;
const CONTACT_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Footer phone and email. Leaving a field empty hides it on the site. */
export async function updateContactContent(
  _prev: AdminContentActionState,
  formData: FormData
): Promise<AdminContentActionState> {
  await requireAdmin();

  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  if (phone && !CONTACT_PHONE_PATTERN.test(phone)) {
    return { error: "Telefon nömrəsi düzgün deyil (məs. +994 50 123 45 67)." };
  }
  if (email && (email.length > 120 || !CONTACT_EMAIL_PATTERN.test(email))) {
    return { error: "Email ünvanı düzgün deyil." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("site_content").upsert(
    { key: CONTACT_KEY, title: "Əlaqə", body: "", items: { phone, email } },
    { onConflict: "key" }
  );

  if (error) {
    console.error("[admin.updateContactContent]", error.message);
    return { error: "Əlaqə məlumatları yadda saxlanılmadı." };
  }

  updateTag("site-content");
  updateTag("contact");
  revalidatePath("/", "layout");
  revalidatePath("/admin/content");
  return {
    success:
      phone || email
        ? "Əlaqə məlumatları yeniləndi."
        : "Əlaqə məlumatları silindi, footerdə göstərilmir.",
  };
}

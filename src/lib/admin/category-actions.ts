"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { slugifyAz } from "@/lib/admin/slug";
import { revalidateCategories } from "@/lib/shop/revalidate";
import { createClient } from "@/lib/supabase/server";
import type { AdminPortalActionState } from "@/lib/admin/portal-actions";

function normalizeImageUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

async function uniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  base: string,
  excludeId?: string
): Promise<string | null> {
  if (!base) return null;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    let query = supabase.from("categories").select("id").eq("slug", candidate);
    if (excludeId) {
      query = query.neq("id", excludeId);
    }
    const { data } = await query.maybeSingle();
    if (!data) return candidate;
  }

  return null;
}

export async function createCategory(
  _prev: AdminPortalActionState,
  formData: FormData
): Promise<AdminPortalActionState> {
  await requireAdmin();

  const nameAz = String(formData.get("name_az") ?? "").trim();
  const sortOrderRaw = String(formData.get("sort_order") ?? "0").trim();
  const imageUrlRaw = String(formData.get("image_url") ?? "");
  const sortOrder = Number.parseInt(sortOrderRaw, 10);

  if (!nameAz) return { error: "Kateqoriya adı tələb olunur." };
  if (!Number.isFinite(sortOrder)) return { error: "Sıra düzgün deyil." };

  const imageUrl = imageUrlRaw.trim()
    ? normalizeImageUrl(imageUrlRaw)
    : null;
  if (imageUrlRaw.trim() && !imageUrl) {
    return { error: "Şəkil URL düzgün deyil (http/https olmalıdır)." };
  }

  const supabase = await createClient();
  const slug = await uniqueSlug(supabase, slugifyAz(nameAz));
  if (!slug) return { error: "Slug yaradıla bilmədi." };

  const { error } = await supabase.from("categories").insert({
    name_az: nameAz,
    slug,
    sort_order: sortOrder,
    image_url: imageUrl,
  });

  if (error) {
    console.error("[admin.createCategory]", error.message);
    return { error: "Kateqoriya əlavə edilmədi." };
  }

  revalidateCategories();
  return { success: "Kateqoriya əlavə olundu." };
}

export async function updateCategory(
  _prev: AdminPortalActionState,
  formData: FormData
): Promise<AdminPortalActionState> {
  await requireAdmin();

  const id = String(formData.get("category_id") ?? "");
  const nameAz = String(formData.get("name_az") ?? "").trim();
  const sortOrderRaw = String(formData.get("sort_order") ?? "0").trim();
  const imageUrlRaw = String(formData.get("image_url") ?? "");
  const sortOrder = Number.parseInt(sortOrderRaw, 10);

  if (!id) return { error: "Kateqoriya tapılmadı." };
  if (!nameAz) return { error: "Kateqoriya adı tələb olunur." };
  if (!Number.isFinite(sortOrder)) return { error: "Sıra düzgün deyil." };

  const imageUrl = imageUrlRaw.trim()
    ? normalizeImageUrl(imageUrlRaw)
    : null;
  if (imageUrlRaw.trim() && !imageUrl) {
    return { error: "Şəkil URL düzgün deyil (http/https olmalıdır)." };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (!existing) return { error: "Kateqoriya tapılmadı." };

  const { error } = await supabase
    .from("categories")
    .update({
      name_az: nameAz,
      sort_order: sortOrder,
      image_url: imageUrl,
    })
    .eq("id", id);

  if (error) {
    console.error("[admin.updateCategory]", error.message);
    return { error: "Kateqoriya yenilənmədi." };
  }

  revalidateCategories();
  return { success: "Kateqoriya yeniləndi." };
}

export async function deleteCategory(
  _prev: AdminPortalActionState,
  formData: FormData
): Promise<AdminPortalActionState> {
  await requireAdmin();

  const id = String(formData.get("category_id") ?? "");
  if (!id) return { error: "Kateqoriya tapılmadı." };

  const supabase = await createClient();

  const { count, error: countError } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);

  if (countError) {
    console.error("[admin.deleteCategory.count]", countError.message);
    return { error: "Kateqoriya yoxlanıla bilmədi." };
  }

  if ((count ?? 0) > 0) {
    return {
      error:
        "Bu kateqoriyada məhsul var. Əvvəl məhsulları başqa kateqoriyaya keçirin və ya silin.",
    };
  }

  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    console.error("[admin.deleteCategory]", error.message);
    return { error: "Kateqoriya silinmədi." };
  }

  revalidateCategories();
  return { success: "Kateqoriya silindi." };
}

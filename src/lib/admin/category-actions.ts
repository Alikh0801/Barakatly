"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { uploadCategoryImage } from "@/lib/admin/category-image-upload";
import { slugifyAz } from "@/lib/admin/slug";
import { revalidateCategories } from "@/lib/shop/revalidate";
import { createClient } from "@/lib/supabase/server";
import type { AdminPortalActionState } from "@/lib/admin/portal-actions";

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
  const image = formData.get("image");
  const sortOrder = Number.parseInt(sortOrderRaw, 10);

  if (!nameAz) return { error: "Kateqoriya adı tələb olunur." };
  if (!Number.isFinite(sortOrder)) return { error: "Sıra düzgün deyil." };

  const supabase = await createClient();

  let imageUrl: string | null = null;
  if (image instanceof File && image.size > 0) {
    const uploaded = await uploadCategoryImage(supabase, image);
    if ("error" in uploaded) return { error: uploaded.error };
    imageUrl = uploaded.url;
  }

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
  const image = formData.get("image");
  const sortOrder = Number.parseInt(sortOrderRaw, 10);

  if (!id) return { error: "Kateqoriya tapılmadı." };
  if (!nameAz) return { error: "Kateqoriya adı tələb olunur." };
  if (!Number.isFinite(sortOrder)) return { error: "Sıra düzgün deyil." };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("categories")
    .select("id, image_url")
    .eq("id", id)
    .maybeSingle();

  if (!existing) return { error: "Kateqoriya tapılmadı." };

  let imageUrl = existing.image_url;
  if (image instanceof File && image.size > 0) {
    const uploaded = await uploadCategoryImage(supabase, image);
    if ("error" in uploaded) return { error: uploaded.error };
    imageUrl = uploaded.url;
  }

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

export async function approveCategory(
  _prev: AdminPortalActionState,
  formData: FormData
): Promise<AdminPortalActionState> {
  await requireAdmin();

  const id = String(formData.get("category_id") ?? "");
  if (!id) return { error: "Kateqoriya tapılmadı." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ approved: true })
    .eq("id", id);

  if (error) {
    console.error("[admin.approveCategory]", error.message);
    return { error: "Kateqoriya təsdiqlənmədi." };
  }

  revalidateCategories();
  return { success: "Kateqoriya təsdiqləndi." };
}

async function uniqueSubcategorySlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  categoryId: string,
  base: string
): Promise<string | null> {
  const root = base || "alt-kateqoriya";
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = attempt === 0 ? root : `${root}-${attempt + 1}`;
    const { data } = await supabase
      .from("subcategories")
      .select("id")
      .eq("category_id", categoryId)
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) return candidate;
  }
  return null;
}

export async function createSubcategory(
  _prev: AdminPortalActionState,
  formData: FormData
): Promise<AdminPortalActionState> {
  await requireAdmin();

  const categoryId = String(formData.get("category_id") ?? "");
  const nameAz = String(formData.get("name_az") ?? "").trim();

  if (!categoryId) return { error: "Kateqoriya tapılmadı." };
  if (!nameAz) return { error: "Alt kateqoriya adı tələb olunur." };

  const supabase = await createClient();
  const slug = await uniqueSubcategorySlug(supabase, categoryId, slugifyAz(nameAz));
  if (!slug) return { error: "Slug yaradıla bilmədi." };

  const { error } = await supabase.from("subcategories").insert({
    category_id: categoryId,
    name_az: nameAz,
    slug,
    approved: true,
  });

  if (error) {
    console.error("[admin.createSubcategory]", error.message);
    return { error: "Alt kateqoriya əlavə edilmədi." };
  }

  revalidateCategories();
  return { success: "Alt kateqoriya əlavə olundu." };
}

export async function approveSubcategory(
  _prev: AdminPortalActionState,
  formData: FormData
): Promise<AdminPortalActionState> {
  await requireAdmin();

  const id = String(formData.get("subcategory_id") ?? "");
  if (!id) return { error: "Alt kateqoriya tapılmadı." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("subcategories")
    .update({ approved: true })
    .eq("id", id);

  if (error) {
    console.error("[admin.approveSubcategory]", error.message);
    return { error: "Alt kateqoriya təsdiqlənmədi." };
  }

  revalidateCategories();
  return { success: "Alt kateqoriya təsdiqləndi." };
}

export async function deleteSubcategory(
  _prev: AdminPortalActionState,
  formData: FormData
): Promise<AdminPortalActionState> {
  await requireAdmin();

  const id = String(formData.get("subcategory_id") ?? "");
  if (!id) return { error: "Alt kateqoriya tapılmadı." };

  const supabase = await createClient();
  const { error } = await supabase.from("subcategories").delete().eq("id", id);

  if (error) {
    console.error("[admin.deleteSubcategory]", error.message);
    return { error: "Alt kateqoriya silinmədi." };
  }

  revalidateCategories();
  return { success: "Alt kateqoriya silindi." };
}

"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { uploadCategoryImage } from "@/lib/admin/category-image-upload";
import { MAX_CATEGORY_POSITION } from "@/lib/admin/category-constants";
import { slugifyAz } from "@/lib/admin/slug";
import { notifyUser } from "@/lib/notifications/helpers";
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

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Approved categories in their current order (ties: older first). */
async function approvedCategoryOrder(supabase: Supabase) {
  const { data, error } = await supabase
    .from("categories")
    .select("id, sort_order")
    .eq("approved", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Writes positions 1..N in the order given, touching only rows whose
 * number changes. Any gap or duplicate left by older data closes here.
 */
async function writeCategoryPositions(
  supabase: Supabase,
  ids: string[],
  current: Map<string, number>,
) {
  const changes = ids
    .map((id, index) => ({ id, position: index + 1 }))
    .filter(({ id, position }) => current.get(id) !== position);
  const results = await Promise.all(
    changes.map(({ id, position }) =>
      supabase.from("categories").update({ sort_order: position }).eq("id", id),
    ),
  );
  const failed = results.find((result) => result.error);
  if (failed?.error) throw new Error(failed.error.message);
}

/** Puts `id` at `position` (1-based) among the approved categories. */
async function placeCategory(supabase: Supabase, id: string, position: number) {
  const order = await approvedCategoryOrder(supabase);
  const current = new Map(order.map((row) => [row.id, row.sort_order]));
  const ids = order.map((row) => row.id).filter((other) => other !== id);
  ids.splice(Math.min(Math.max(position, 1), ids.length + 1) - 1, 0, id);
  await writeCategoryPositions(supabase, ids, current);
}

/** Closes the gap a deleted category leaves. */
async function renumberCategories(supabase: Supabase) {
  const order = await approvedCategoryOrder(supabase);
  await writeCategoryPositions(
    supabase,
    order.map((row) => row.id),
    new Map(order.map((row) => [row.id, row.sort_order])),
  );
}

export async function createCategory(
  _prev: AdminPortalActionState,
  formData: FormData
): Promise<AdminPortalActionState> {
  await requireAdmin();

  const nameAz = String(formData.get("name_az") ?? "").trim();
  const image = formData.get("image");

  if (!nameAz) return { error: "Kateqoriya adı tələb olunur." };

  const supabase = await createClient();

  // A new category takes the next number, so it heads the admin list.
  let order: Awaited<ReturnType<typeof approvedCategoryOrder>>;
  try {
    order = await approvedCategoryOrder(supabase);
  } catch (error) {
    console.error("[admin.createCategory.order]", (error as Error).message);
    return { error: "Kateqoriya əlavə edilmədi." };
  }
  if (order.length >= MAX_CATEGORY_POSITION) {
    return { error: `Ən çox ${MAX_CATEGORY_POSITION} kateqoriya ola bilər.` };
  }
  const sortOrder = order.length + 1;

  let imageUrl: string | null = null;
  if (image instanceof File && image.size > 0) {
    const uploaded = await uploadCategoryImage(supabase, image);
    if ("error" in uploaded) return { error: uploaded.error };
    imageUrl = uploaded.url;
  }

  const slug = await uniqueSlug(supabase, slugifyAz(nameAz));
  if (!slug) return { error: "Slug yaradıla bilmədi." };

  const { data: created, error } = await supabase
    .from("categories")
    .insert({
      name_az: nameAz,
      slug,
      sort_order: sortOrder,
      image_url: imageUrl,
    })
    .select("id")
    .single();

  if (error || !created) {
    console.error("[admin.createCategory]", error?.message);
    return { error: "Kateqoriya əlavə edilmədi." };
  }

  try {
    // Last place, and any gaps older data left are closed on the way.
    await placeCategory(supabase, created.id, sortOrder);
  } catch (renumberError) {
    console.error("[admin.createCategory.renumber]", (renumberError as Error).message);
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
  const positionRaw = String(formData.get("sort_order") ?? "").trim();
  const image = formData.get("image");

  if (!id) return { error: "Kateqoriya tapılmadı." };
  if (!nameAz) return { error: "Kateqoriya adı tələb olunur." };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("categories")
    .select("id, image_url, approved")
    .eq("id", id)
    .maybeSingle();

  if (!existing) return { error: "Kateqoriya tapılmadı." };

  // Only approved categories are numbered; one awaiting approval has none.
  let position: number | null = null;
  if (existing.approved) {
    let count: number;
    try {
      count = (await approvedCategoryOrder(supabase)).length;
    } catch (error) {
      console.error("[admin.updateCategory.order]", (error as Error).message);
      return { error: "Kateqoriya yenilənmədi." };
    }
    if (!/^\d{1,2}$/.test(positionRaw)) {
      return { error: `Sıra 1 ilə ${count} arasında rəqəm olmalıdır.` };
    }
    position = Number(positionRaw);
    if (position < 1 || position > count) {
      return { error: `Sıra 1 ilə ${count} arasında olmalıdır: aralarında boş nömrə qala bilməz.` };
    }
  }

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
      image_url: imageUrl,
    })
    .eq("id", id);

  if (error) {
    console.error("[admin.updateCategory]", error.message);
    return { error: "Kateqoriya yenilənmədi." };
  }

  if (position !== null) {
    try {
      // The others shift by one to make room, so the numbers stay 1..N.
      await placeCategory(supabase, id, position);
    } catch (moveError) {
      console.error("[admin.updateCategory.position]", (moveError as Error).message);
      return { error: "Ad yadda saxlandı, amma sıra dəyişmədi." };
    }
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

  try {
    await renumberCategories(supabase);
  } catch (renumberError) {
    console.error("[admin.deleteCategory.renumber]", (renumberError as Error).message);
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
  const { data: category } = await supabase
    .from("categories")
    .select("id, name_az, created_by")
    .eq("id", id)
    .single();

  let count: number;
  try {
    count = (await approvedCategoryOrder(supabase)).length;
  } catch (orderError) {
    console.error("[admin.approveCategory.order]", (orderError as Error).message);
    return { error: "Kateqoriya təsdiqlənmədi." };
  }
  if (count >= MAX_CATEGORY_POSITION) {
    return { error: `Ən çox ${MAX_CATEGORY_POSITION} kateqoriya ola bilər.` };
  }

  // Approved now, it takes the next number like a new category.
  const { error } = await supabase
    .from("categories")
    .update({ approved: true, sort_order: count + 1 })
    .eq("id", id);

  if (error) {
    console.error("[admin.approveCategory]", error.message);
    return { error: "Kateqoriya təsdiqlənmədi." };
  }

  try {
    await placeCategory(supabase, id, count + 1);
  } catch (renumberError) {
    console.error("[admin.approveCategory.renumber]", (renumberError as Error).message);
  }

  if (category?.created_by) {
    await notifyUser({
      userId: category.created_by,
      type: "general",
      title: "Kateqoriya təklifiniz təsdiqləndi",
      body: `"${category.name_az}" kateqoriyası admin tərəfindən təsdiqləndi və indi məhsul əlavə edərkən seçilə bilər.`,
      metadata: { category_id: id },
    });
  }

  revalidateCategories();
  revalidatePath("/notifications");
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
  const { data: subcategory } = await supabase
    .from("subcategories")
    .select("id, name_az, created_by")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("subcategories")
    .update({ approved: true })
    .eq("id", id);

  if (error) {
    console.error("[admin.approveSubcategory]", error.message);
    return { error: "Alt kateqoriya təsdiqlənmədi." };
  }

  if (subcategory?.created_by) {
    await notifyUser({
      userId: subcategory.created_by,
      type: "general",
      title: "Alt kateqoriya təklifiniz təsdiqləndi",
      body: `"${subcategory.name_az}" alt kateqoriyası admin tərəfindən təsdiqləndi və indi məhsul əlavə edərkən seçilə bilər.`,
      metadata: { subcategory_id: id },
    });
  }

  revalidateCategories();
  revalidatePath("/notifications");
  return { success: "Alt kateqoriya təsdiqləndi." };
}

export async function renameSubcategory(
  _prev: AdminPortalActionState,
  formData: FormData
): Promise<AdminPortalActionState> {
  await requireAdmin();

  const id = String(formData.get("subcategory_id") ?? "");
  const nameAz = String(formData.get("name_az") ?? "").trim();

  if (!id) return { error: "Alt kateqoriya tapılmadı." };
  if (!nameAz) return { error: "Alt kateqoriya adı tələb olunur." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("subcategories")
    .update({ name_az: nameAz })
    .eq("id", id);

  if (error) {
    console.error("[admin.renameSubcategory]", error.message);
    return { error: "Alt kateqoriya adı yenilənmədi." };
  }

  revalidateCategories();
  revalidatePath("/admin/products");
  return { success: "Alt kateqoriya adı yeniləndi." };
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

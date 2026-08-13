"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthCallbackUrl, getSupabaseEnvError } from "@/lib/auth/urls";
import { getProfile } from "@/lib/auth/session";
import { requireApprovedFarmer } from "@/lib/farmer/auth";
import { ensureFarmerRecord } from "@/lib/farmer/ensure";
import { uploadProductImage } from "@/lib/farmer/image-upload";
import { uploadFarmerMedia } from "@/lib/farmer/media-upload";
import {
  FARMER_ITEM_STATUS_TRANSITIONS,
  getOrderItemStatusLabel,
} from "@/lib/orders/labels";
import {
  insertEventAndNotify,
  notifyAdmins,
} from "@/lib/notifications/helpers";
import { AZ_REGIONS } from "@/lib/az/regions";
import {
  emailAlreadyRegistered,
  isDuplicateSignUpUser,
  translateAuthError,
} from "@/lib/auth/signup";
import { isValidAzPhone, normalizeAzPhone } from "@/lib/phone/az";
import { isPhoneTakenByAnother } from "@/lib/phone/uniqueness";
import { revalidateProductCatalog } from "@/lib/shop/revalidate";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { slugifyAz } from "@/lib/admin/slug";
import type { OrderItemStatus, UnitType } from "@/types";

type AdminClient = ReturnType<typeof createAdminClient>;

async function uniqueCategorySlug(
  admin: AdminClient,
  base: string,
): Promise<string> {
  const root = base || "kateqoriya";
  for (let i = 0; i < 25; i += 1) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const { data } = await admin
      .from("categories")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) return candidate;
  }
  return `${root}-${Date.now()}`;
}

async function uniqueSubcategorySlug(
  admin: AdminClient,
  categoryId: string,
  base: string,
): Promise<string> {
  const root = base || "alt-kateqoriya";
  for (let i = 0; i < 25; i += 1) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const { data } = await admin
      .from("subcategories")
      .select("id")
      .eq("category_id", categoryId)
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) return candidate;
  }
  return `${root}-${Date.now()}`;
}

type ResolvedTaxonomy =
  | { categoryId: string; subcategoryId: string; createdLabels: string[] }
  | { error: string };

/**
 * Resolves the category + subcategory for a product form. Handles the "__new__"
 * sentinel by creating a pending (unapproved) category/subcategory owned by the
 * farmer, so admins can review it. Subcategory is always required.
 */
async function resolveTaxonomy(
  formData: FormData,
  farmerProfileId: string,
): Promise<ResolvedTaxonomy> {
  const categoryIdRaw = String(formData.get("category_id") ?? "").trim();
  const subcategoryIdRaw = String(formData.get("subcategory_id") ?? "").trim();
  const newCategoryName = String(formData.get("new_category_name") ?? "").trim();
  const newSubcategoryName = String(
    formData.get("new_subcategory_name") ?? "",
  ).trim();

  const admin = createAdminClient();
  const createdLabels: string[] = [];

  let categoryId = categoryIdRaw;
  if (categoryIdRaw === "__new__") {
    if (!newCategoryName) return { error: "Yeni kateqoriya adını daxil edin." };
    const slug = await uniqueCategorySlug(admin, slugifyAz(newCategoryName));
    const { data, error } = await admin
      .from("categories")
      .insert({
        name_az: newCategoryName,
        slug,
        approved: false,
        created_by: farmerProfileId,
        sort_order: 999,
      })
      .select("id")
      .single();
    if (error || !data) {
      console.error("[farmer.resolveTaxonomy.category]", error?.message);
      return { error: "Yeni kateqoriya yaradıla bilmədi." };
    }
    categoryId = data.id;
    createdLabels.push(`kateqoriya "${newCategoryName}"`);
  } else if (!categoryIdRaw) {
    return { error: "Kateqoriya seçin." };
  }

  let subcategoryId: string;
  if (subcategoryIdRaw === "__new__") {
    if (!newSubcategoryName) {
      return { error: "Yeni alt-kateqoriya adını daxil edin." };
    }
    const slug = await uniqueSubcategorySlug(
      admin,
      categoryId,
      slugifyAz(newSubcategoryName),
    );
    const { data, error } = await admin
      .from("subcategories")
      .insert({
        category_id: categoryId,
        name_az: newSubcategoryName,
        slug,
        approved: false,
        created_by: farmerProfileId,
      })
      .select("id")
      .single();
    if (error || !data) {
      console.error("[farmer.resolveTaxonomy.subcategory]", error?.message);
      return { error: "Yeni alt-kateqoriya yaradıla bilmədi." };
    }
    subcategoryId = data.id;
    createdLabels.push(`alt-kateqoriya "${newSubcategoryName}"`);
  } else if (!subcategoryIdRaw) {
    return { error: "Alt-kateqoriya seçin." };
  } else {
    subcategoryId = subcategoryIdRaw;
  }

  return { categoryId, subcategoryId, createdLabels };
}

async function notifyNewTaxonomy(farmName: string, labels: string[]) {
  if (labels.length === 0) return;
  await notifyAdmins({
    type: "general",
    title: "Yeni kateqoriya təsdiq gözləyir",
    body: `${farmName} yeni ${labels.join(" və ")} əlavə etdi. Təsdiq üçün Kateqoriyalar panelinə baxın.`,
  });
}

export type FarmerActionState = {
  error?: string;
  success?: string;
};

function parseRegion(formData: FormData): string | null {
  const value = String(formData.get("location_text") ?? "").trim();
  if (!value) return null;
  return (AZ_REGIONS as readonly string[]).includes(value) ? value : null;
}

export async function signUpFarmer(
  _prev: FarmerActionState,
  formData: FormData
): Promise<FarmerActionState> {
  const envError = getSupabaseEnvError();
  if (envError) return { error: envError };

  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("password_confirm") ?? "");
  const farmName = String(formData.get("farm_name") ?? "").trim();
  const locationText = parseRegion(formData);
  const phone = normalizeAzPhone(String(formData.get("phone") ?? ""));

  if (!fullName || !email || !password || !passwordConfirm || !farmName || !phone) {
    return { error: "Mütləq sahələri doldurun." };
  }

  if (!locationText) {
    return { error: "Bölgə seçin." };
  }

  if (!isValidAzPhone(phone)) {
    return {
      error: "Telefon +994 ilə başlamalıdır (məs: +994501234567).",
    };
  }

  if (password.length < 6) {
    return { error: "Şifrə ən azı 6 simvol olmalıdır." };
  }

  if (password !== passwordConfirm) {
    return { error: "Şifrələr uyğun gəlmir." };
  }

  if (await emailAlreadyRegistered(email)) {
    return {
      error:
        "Bu email artıq qeydiyyatdadır. Daxil olun — sonra mövcud hesabla fermer ola bilərsiniz.",
    };
  }

  if (await isPhoneTakenByAnother(phone)) {
    return { error: "Bu telefon nömrəsi başqa hesabda istifadə olunur." };
  }

  const supabase = await createClient();
  const callbackUrl = `${getAuthCallbackUrl()}?next=${encodeURIComponent("/farmer")}`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        // Stays "customer" until an admin approves; farm details drive the
        // pending farmers row (see ensureFarmerRecord / approveFarmer).
        full_name: fullName,
        role: "customer",
        phone,
        farm_name: farmName,
        farm_location_text: locationText,
      },
      emailRedirectTo: callbackUrl,
    },
  });

  if (error) {
    console.error("[farmer.signUpFarmer]", error.message);
    return { error: translateAuthError(error.message) };
  }

  if (isDuplicateSignUpUser(data.user)) {
    return {
      error:
        "Bu email artıq qeydiyyatdadır. Daxil olun — sonra mövcud hesabla fermer ola bilərsiniz.",
    };
  }

  const userId = data.user?.id;
  if (!userId) {
    return { error: "Qeydiyyat tamamlanmadı." };
  }

  // Email confirmation required — no session yet, so farmers insert is deferred.
  if (!data.session) {
    return {
      success:
        "Təsdiq linki email ünvanınıza göndərildi. Linkə klikləyərək qeydiyyatı tamamlayın.",
    };
  }

  // Role stays "customer" until an admin approves the pending farmers row.
  await supabase.from("profiles").update({ phone }).eq("id", userId);

  const { error: farmerError } = await supabase.from("farmers").insert({
    profile_id: userId,
    farm_name: farmName,
    description: null,
    location_text: locationText,
    status: "pending",
  });

  if (farmerError) {
    console.error("[farmer.signUpFarmer.insert]", farmerError.message);
    return {
      error: "Fermer profili yaradıla bilmədi. Bir az sonra yenidən cəhd edin.",
    };
  }

  await notifyAdmins({
    type: "farmer_registration",
    title: "Yeni fermer qeydiyyatı",
    body: `${farmName} təsdiq gözləyir.`,
    metadata: { farmer_profile_id: userId },
  });

  redirect("/farmer");
}

/** Completes farm profile for an already authenticated farmer (no new auth user). */
export async function completeFarmerProfile(
  _prev: FarmerActionState,
  formData: FormData
): Promise<FarmerActionState> {
  const profile = await getProfile();
  if (!profile) {
    return { error: "Əvvəlcə daxil olun." };
  }

  const farmName = String(formData.get("farm_name") ?? "").trim();
  const locationText = parseRegion(formData);
  const phone = normalizeAzPhone(String(formData.get("phone") ?? ""));

  if (!farmName) {
    return { error: "Təsərrüfat adı mütləqdir." };
  }

  if (!locationText) {
    return { error: "Bölgə seçin." };
  }

  if (!phone || !isValidAzPhone(phone)) {
    return {
      error: "Telefon +994 ilə başlamalıdır (məs: +994501234567).",
    };
  }

  if (await isPhoneTakenByAnother(phone, profile.id)) {
    return { error: "Bu telefon nömrəsi başqa hesabda istifadə olunur." };
  }

  const farmer = await ensureFarmerRecord(profile.id, {
    farmName,
    locationText,
    phone,
  });

  if (!farmer) {
    return { error: "Fermer profili yaradıla bilmədi. Yenidən cəhd edin." };
  }

  const supabase = await createClient();
  // Role stays "customer" until an admin approves the pending farmers row.
  await supabase
    .from("profiles")
    .update({ phone })
    .eq("id", profile.id)
    .neq("role", "admin");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await supabase.auth.updateUser({
      data: {
        farm_name: farmName,
        farm_location_text: locationText,
        phone,
      },
    });
  }

  if (farmer.status === "pending") {
    await notifyAdmins({
      type: "farmer_registration",
      title: "Yeni fermer qeydiyyatı",
      body: `${farmName} təsdiq gözləyir.`,
      metadata: { farmer_id: farmer.id },
    });
  }

  revalidatePath("/farmer");
  redirect("/farmer");
}

export async function createProduct(
  _prev: FarmerActionState,
  formData: FormData
): Promise<FarmerActionState> {
  const { farmer, profile } = await requireApprovedFarmer();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const unitType = String(formData.get("unit_type") ?? "").trim() as UnitType;
  const farmerPrice = Number(formData.get("farmer_price") ?? 0);
  const quantity = Number(formData.get("quantity_available") ?? 0);
  const image = formData.get("image");

  if (!title || !description || !unitType) {
    return { error: "Bütün sahələr mütləqdir." };
  }

  if (!["kg", "piece", "liter"].includes(unitType)) {
    return { error: "Vahid tipi yanlışdır." };
  }

  if (!(farmerPrice > 0) || !(quantity >= 0)) {
    return { error: "Qiymət və miqdar düzgün deyil." };
  }

  if (!(image instanceof File) || image.size === 0) {
    return { error: "Məhsul şəklini cihazınızdan seçin." };
  }

  const taxonomy = await resolveTaxonomy(formData, profile.id);
  if ("error" in taxonomy) return { error: taxonomy.error };

  const supabase = await createClient();
  const { data: product, error } = await supabase
    .from("products")
    .insert({
      farmer_id: farmer.id,
      category_id: taxonomy.categoryId,
      subcategory_id: taxonomy.subcategoryId,
      title,
      description,
      unit_type: unitType,
      farmer_price: farmerPrice,
      quantity_available: quantity,
      in_stock: quantity > 0,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !product) {
    console.error("[farmer.createProduct]", error?.message);
    return { error: "Məhsul yaradıla bilmədi." };
  }

  const uploaded = await uploadProductImage(
    supabase,
    profile.id,
    product.id,
    image,
  );

  if ("error" in uploaded) {
    await supabase.from("products").delete().eq("id", product.id);
    return { error: uploaded.error };
  }

  const { error: imageError } = await supabase.from("product_images").insert({
    product_id: product.id,
    url: uploaded.url,
    sort_order: 0,
  });

  if (imageError) {
    console.error("[farmer.createProduct.image]", imageError.message);
    await supabase.from("products").delete().eq("id", product.id);
    return { error: "Şəkil saxlanılmadı. Yenidən cəhd edin." };
  }

  await notifyAdmins({
    type: "product_submission",
    title: "Yeni məhsul göndərildi",
    body: `"${title}" təsdiq gözləyir.`,
    metadata: { product_id: product.id },
  });

  await notifyNewTaxonomy(farmer.farm_name, taxonomy.createdLabels);

  revalidatePath("/farmer/products");
  revalidatePath("/farmer");
  revalidatePath("/admin/products");
  revalidatePath("/admin/categories");
  revalidateProductCatalog(product.id);
  redirect("/farmer/products");
}

export async function updateProduct(
  _prev: FarmerActionState,
  formData: FormData
): Promise<FarmerActionState> {
  const { farmer, profile } = await requireApprovedFarmer();
  const productId = String(formData.get("product_id") ?? "").trim();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const unitType = String(formData.get("unit_type") ?? "").trim() as UnitType;
  const farmerPrice = Number(formData.get("farmer_price") ?? 0);
  const quantity = Number(formData.get("quantity_available") ?? 0);
  const image = formData.get("image");

  if (!productId || !title || !description || !unitType) {
    return { error: "Bütün sahələr mütləqdir." };
  }

  const taxonomy = await resolveTaxonomy(formData, profile.id);
  if ("error" in taxonomy) return { error: taxonomy.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({
      title,
      description,
      category_id: taxonomy.categoryId,
      subcategory_id: taxonomy.subcategoryId,
      unit_type: unitType,
      farmer_price: farmerPrice,
      quantity_available: quantity,
      in_stock: quantity > 0,
      status: "pending",
      final_price: null,
    })
    .eq("id", productId)
    .eq("farmer_id", farmer.id);

  if (error) {
    console.error("[farmer.updateProduct]", error.message);
    return { error: "Məhsul yenilənmədi." };
  }

  await notifyNewTaxonomy(farmer.farm_name, taxonomy.createdLabels);

  if (image instanceof File && image.size > 0) {
    const uploaded = await uploadProductImage(
      supabase,
      profile.id,
      productId,
      image,
    );

    if ("error" in uploaded) {
      return { error: uploaded.error };
    }

    await supabase.from("product_images").delete().eq("product_id", productId);
    const { error: imageError } = await supabase.from("product_images").insert({
      product_id: productId,
      url: uploaded.url,
      sort_order: 0,
    });

    if (imageError) {
      console.error("[farmer.updateProduct.image]", imageError.message);
      return { error: "Şəkil yenilənmədi." };
    }
  }

  await notifyAdmins({
    type: "product_submission",
    title: "Məhsul yenidən göndərildi",
    body: `"${title}" yenidən təsdiq gözləyir.`,
    metadata: { product_id: productId },
  });

  revalidatePath("/farmer/products");
  revalidatePath(`/farmer/products/${productId}`);
  revalidatePath("/admin/products");
  revalidateProductCatalog(productId);
  return { success: "Məhsul yeniləndi və yenidən təsdiqə göndərildi." };
}

export async function updateOrderItemStatus(
  _prev: FarmerActionState,
  formData: FormData
): Promise<FarmerActionState> {
  const { profile, farmer } = await requireApprovedFarmer();
  const itemId = String(formData.get("order_item_id") ?? "").trim();
  const nextStatus = String(formData.get("next_status") ?? "") as OrderItemStatus;

  if (!itemId || !nextStatus) {
    return { error: "Status seçin." };
  }

  const supabase = await createClient();
  const { data: item, error } = await supabase
    .from("order_items")
    .select("*, orders(id, customer_id, order_code, status)")
    .eq("id", itemId)
    .eq("farmer_id", farmer.id)
    .single();

  if (error || !item) {
    return { error: "Sifariş məhsulu tapılmadı." };
  }

  const allowed = FARMER_ITEM_STATUS_TRANSITIONS[item.status] ?? [];
  if (!allowed.includes(nextStatus)) {
    return { error: "Bu status keçidinə icazə verilmir." };
  }

  const { error: updateError } = await supabase
    .from("order_items")
    .update({ status: nextStatus })
    .eq("id", itemId);

  if (updateError) {
    return { error: "Status yenilənmədi." };
  }

  const order = Array.isArray(item.orders) ? item.orders[0] : item.orders;
  const statusLabel = getOrderItemStatusLabel(nextStatus);

  if (order) {
    await insertEventAndNotify({
      orderId: order.id,
      customerId: order.customer_id,
      orderItemId: itemId,
      status: nextStatus,
      note: `${item.product_title}: ${statusLabel}`,
      changedBy: profile.id,
      notification: {
        type: "general",
        title: "Sifariş yeniləndi",
        body: `${order.order_code} — ${item.product_title} indi: ${statusLabel}.`,
      },
    });

    await notifyAdmins({
      type: "general",
      title: "Fermer sifariş statusunu yenilədi",
      body: `${order.order_code} — ${item.product_title}: ${statusLabel}. Sifariş statusunu yoxlayın.`,
      metadata: {
        order_id: order.id,
        order_code: order.order_code,
        order_item_id: itemId,
        item_status: nextStatus,
      },
    });
  }

  revalidatePath("/farmer/orders");
  revalidatePath("/farmer");
  revalidatePath("/orders");
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  revalidatePath("/notifications");
  return { success: "Status yeniləndi." };
}

export async function updateFarmerProfile(
  _prev: FarmerActionState,
  formData: FormData
): Promise<FarmerActionState> {
  const { profile, farmer } = await requireApprovedFarmer();
  const farmName = String(formData.get("farm_name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const locationText = String(formData.get("location_text") ?? "").trim();
  const avatarFile = formData.get("avatar");
  const removeAvatar = String(formData.get("remove_avatar") ?? "") === "1";

  if (!farmName) {
    return { error: "Təsərrüfat adı mütləqdir." };
  }

  const supabase = await createClient();
  let avatarUrl = farmer.avatar_url;

  if (removeAvatar) {
    avatarUrl = null;
  } else if (avatarFile instanceof File && avatarFile.size > 0) {
    const uploaded = await uploadFarmerMedia(
      supabase,
      profile.id,
      "avatar",
      avatarFile
    );
    if ("error" in uploaded) return { error: uploaded.error };
    if (uploaded.mediaType !== "image") {
      return { error: "Profil şəkli yalnız şəkil ola bilər." };
    }
    avatarUrl = uploaded.url;
  }

  const { error } = await supabase
    .from("farmers")
    .update({
      farm_name: farmName,
      description: description || null,
      location_text: locationText || null,
      avatar_url: avatarUrl,
    })
    .eq("id", farmer.id);

  if (error) {
    console.error("[farmer.updateFarmerProfile]", error.message);
    return { error: "Profil yenilənmədi." };
  }

  revalidatePath("/farmer");
  revalidatePath("/farmers");
  revalidatePath(`/farmers/${farmer.id}`);
  updateTag("farmers");

  return { success: "Profil yeniləndi." };
}

export async function createFarmerBlogPost(
  _prev: FarmerActionState,
  formData: FormData
): Promise<FarmerActionState> {
  const { profile, farmer } = await requireApprovedFarmer();
  const caption = String(formData.get("caption") ?? "").trim();
  const files = formData
    .getAll("media")
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (files.length === 0) {
    return { error: "Ən azı bir şəkil və ya video seçin." };
  }

  if (files.length > 6) {
    return { error: "Bir paylaşıma ən çox 6 fayl əlavə etmək olar." };
  }

  const supabase = await createClient();
  const { data: post, error: postError } = await supabase
    .from("farmer_posts")
    .insert({
      farmer_id: farmer.id,
      caption,
    })
    .select("id")
    .single();

  if (postError || !post) {
    console.error("[farmer.createFarmerBlogPost]", postError?.message);
    return { error: "Paylaşım yaradıla bilmədi." };
  }

  const mediaRows: {
    post_id: string;
    media_type: "image" | "video";
    url: string;
    sort_order: number;
  }[] = [];

  for (const [index, file] of files.entries()) {
    const uploaded = await uploadFarmerMedia(
      supabase,
      profile.id,
      `posts/${post.id}`,
      file
    );
    if ("error" in uploaded) {
      await supabase.from("farmer_posts").delete().eq("id", post.id);
      return { error: uploaded.error };
    }
    mediaRows.push({
      post_id: post.id,
      media_type: uploaded.mediaType,
      url: uploaded.url,
      sort_order: index,
    });
  }

  const { error: mediaError } = await supabase
    .from("farmer_post_media")
    .insert(mediaRows);

  if (mediaError) {
    console.error("[farmer.createFarmerBlogPost.media]", mediaError.message);
    await supabase.from("farmer_posts").delete().eq("id", post.id);
    return { error: "Media yadda saxlanılmadı." };
  }

  revalidatePath("/farmer");
  revalidatePath(`/farmers/${farmer.id}`);
  updateTag("farmers");

  return { success: "Paylaşım əlavə olundu." };
}

export async function deleteFarmerBlogPost(
  _prev: FarmerActionState,
  formData: FormData
): Promise<FarmerActionState> {
  const { farmer } = await requireApprovedFarmer();
  const postId = String(formData.get("post_id") ?? "").trim();
  if (!postId) return { error: "Paylaşım tapılmadı." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("farmer_posts")
    .delete()
    .eq("id", postId)
    .eq("farmer_id", farmer.id);

  if (error) {
    console.error("[farmer.deleteFarmerBlogPost]", error.message);
    return { error: "Paylaşım silinmədi." };
  }

  revalidatePath("/farmer");
  revalidatePath(`/farmers/${farmer.id}`);
  updateTag("farmers");

  return { success: "Paylaşım silindi." };
}

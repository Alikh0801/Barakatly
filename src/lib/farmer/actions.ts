"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthCallbackUrl, getSupabaseEnvError } from "@/lib/auth/urls";
import { getProfile } from "@/lib/auth/session";
import { requireApprovedFarmer } from "@/lib/farmer/auth";
import { ensureFarmerRecord } from "@/lib/farmer/ensure";
import { uploadProductImage } from "@/lib/farmer/image-upload";
import {
  FARMER_ITEM_STATUS_TRANSITIONS,
  getOrderItemStatusLabel,
} from "@/lib/orders/labels";
import { insertEventAndNotify } from "@/lib/notifications/helpers";
import { createClient } from "@/lib/supabase/server";
import type { OrderItemStatus, UnitType } from "@/types";

export type FarmerActionState = {
  error?: string;
  success?: string;
};

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
  const description = String(formData.get("description") ?? "").trim();
  const locationText = String(formData.get("location_text") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!fullName || !email || !password || !passwordConfirm || !farmName) {
    return { error: "Mütləq sahələri doldurun." };
  }

  if (password.length < 6) {
    return { error: "Şifrə ən azı 6 simvol olmalıdır." };
  }

  if (password !== passwordConfirm) {
    return { error: "Şifrələr uyğun gəlmir." };
  }

  const supabase = await createClient();
  const callbackUrl = `${getAuthCallbackUrl()}?next=${encodeURIComponent("/farmer")}`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: "farmer",
        phone: phone || null,
        farm_name: farmName,
        farm_description: description || null,
        farm_location_text: locationText || null,
      },
      emailRedirectTo: callbackUrl,
    },
  });

  if (error) {
    console.error("[farmer.signUpFarmer]", error.message);
    return { error: error.message };
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

  if (phone) {
    await supabase.from("profiles").update({ phone }).eq("id", userId);
  }

  const { error: farmerError } = await supabase.from("farmers").insert({
    profile_id: userId,
    farm_name: farmName,
    description: description || null,
    location_text: locationText || null,
    status: "pending",
  });

  if (farmerError) {
    console.error("[farmer.signUpFarmer.insert]", farmerError.message);
    return {
      error: "Fermer profili yaradıla bilmədi. Bir az sonra yenidən cəhd edin.",
    };
  }

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
  const description = String(formData.get("description") ?? "").trim();
  const locationText = String(formData.get("location_text") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!farmName) {
    return { error: "Təsərrüfat adı mütləqdir." };
  }

  const farmer = await ensureFarmerRecord(profile.id, {
    farmName,
    description,
    locationText,
    phone,
  });

  if (!farmer) {
    return { error: "Fermer profili yaradıla bilmədi. Yenidən cəhd edin." };
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
  const categoryId = String(formData.get("category_id") ?? "").trim();
  const unitType = String(formData.get("unit_type") ?? "").trim() as UnitType;
  const farmerPrice = Number(formData.get("farmer_price") ?? 0);
  const quantity = Number(formData.get("quantity_available") ?? 0);
  const image = formData.get("image");

  if (!title || !description || !categoryId || !unitType) {
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

  const supabase = await createClient();
  const { data: product, error } = await supabase
    .from("products")
    .insert({
      farmer_id: farmer.id,
      category_id: categoryId,
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

  revalidatePath("/farmer/products");
  revalidatePath("/farmer");
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
  const categoryId = String(formData.get("category_id") ?? "").trim();
  const unitType = String(formData.get("unit_type") ?? "").trim() as UnitType;
  const farmerPrice = Number(formData.get("farmer_price") ?? 0);
  const quantity = Number(formData.get("quantity_available") ?? 0);
  const image = formData.get("image");

  if (!productId || !title || !description || !categoryId || !unitType) {
    return { error: "Bütün sahələr mütləqdir." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({
      title,
      description,
      category_id: categoryId,
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

  revalidatePath("/farmer/products");
  revalidatePath(`/farmer/products/${productId}`);
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
  if (order) {
    await insertEventAndNotify({
      orderId: order.id,
      customerId: order.customer_id,
      orderItemId: itemId,
      status: nextStatus,
      note: `${item.product_title}: ${getOrderItemStatusLabel(nextStatus)}`,
      changedBy: profile.id,
      notification: {
        type: "general",
        title: "Sifariş yeniləndi",
        body: `${order.order_code} — ${item.product_title} indi: ${getOrderItemStatusLabel(nextStatus)}.`,
      },
    });
  }

  revalidatePath("/farmer/orders");
  revalidatePath("/orders");
  revalidatePath("/admin/orders");
  return { success: "Status yeniləndi." };
}

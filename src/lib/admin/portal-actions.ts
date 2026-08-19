"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { notifyUser } from "@/lib/notifications/helpers";
import { revalidateProductCatalog } from "@/lib/shop/revalidate";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { UnitType } from "@/types";

export type AdminPortalActionState = {
  error?: string;
  success?: string;
};

export async function approveFarmer(
  _prev: AdminPortalActionState,
  formData: FormData
): Promise<AdminPortalActionState> {
  await requireAdmin();
  const farmerId = String(formData.get("farmer_id") ?? "");
  if (!farmerId) return { error: "Fermer tapılmadı." };

  const supabase = await createClient();
  const { data: farmer, error } = await supabase
    .from("farmers")
    .select("id, profile_id, farm_name")
    .eq("id", farmerId)
    .single();

  if (error || !farmer) return { error: "Fermer tapılmadı." };

  const { error: updateError } = await supabase
    .from("farmers")
    .update({
      status: "approved",
      verified_at: new Date().toISOString(),
    })
    .eq("id", farmerId);

  if (updateError) return { error: "Fermer təsdiqlənmədi." };

  // Promote the account to "farmer" only now, on approval. A cross-user
  // profile update needs the service-role client (RLS).
  const admin = createAdminClient();
  const { error: roleError } = await admin
    .from("profiles")
    .update({ role: "farmer" })
    .eq("id", farmer.profile_id)
    .neq("role", "admin");
  if (roleError) {
    console.error("[admin.approveFarmer.role]", roleError.message);
  }
  const { error: metaError } = await admin.auth.admin.updateUserById(
    farmer.profile_id,
    { user_metadata: { role: "farmer" } },
  );
  if (metaError) {
    console.error("[admin.approveFarmer.metadata]", metaError.message);
  }

  await notifyUser({
    userId: farmer.profile_id,
    type: "farmer_approval",
    title: "Fermer hesabınız təsdiqləndi",
    body: `${farmer.farm_name} hesabınız aktivdir. İndi məhsul əlavə edə bilərsiniz.`,
    metadata: { farmer_id: farmer.id },
  });

  revalidatePath("/admin/farmers");
  revalidatePath("/admin", "layout");
  revalidatePath("/farmer");
  return { success: "Fermer təsdiqləndi." };
}

export async function rejectFarmer(
  _prev: AdminPortalActionState,
  formData: FormData
): Promise<AdminPortalActionState> {
  await requireAdmin();
  const farmerId = String(formData.get("farmer_id") ?? "");
  if (!farmerId) return { error: "Fermer tapılmadı." };

  const supabase = await createClient();
  const { data: farmer } = await supabase
    .from("farmers")
    .select("id, profile_id, farm_name")
    .eq("id", farmerId)
    .single();

  if (!farmer) return { error: "Fermer tapılmadı." };

  const { error } = await supabase
    .from("farmers")
    .update({ status: "rejected", verified_at: null })
    .eq("id", farmerId);

  if (error) return { error: "Fermer rədd edilmədi." };

  await notifyUser({
    userId: farmer.profile_id,
    type: "farmer_approval",
    title: "Fermer müraciəti rədd edildi",
    body: `${farmer.farm_name} müraciətiniz rədd edildi. Yenidən müraciət etmək üçün dəstəklə əlaqə saxlayın.`,
    metadata: { farmer_id: farmer.id },
  });

  revalidatePath("/admin/farmers");
  revalidatePath("/admin", "layout");
  return { success: "Fermer rədd edildi." };
}

export async function approveFarmerProfileEdit(
  _prev: AdminPortalActionState,
  formData: FormData
): Promise<AdminPortalActionState> {
  await requireAdmin();
  const farmerId = String(formData.get("farmer_id") ?? "");
  if (!farmerId) return { error: "Fermer tapılmadı." };

  const supabase = await createClient();
  const { data: farmer } = await supabase
    .from("farmers")
    .select(
      "id, profile_id, pending_farm_name, pending_description, pending_location_text, pending_avatar_url, pending_submitted_at",
    )
    .eq("id", farmerId)
    .single();

  if (!farmer || !farmer.pending_submitted_at || !farmer.pending_farm_name) {
    return { error: "Gözləyən dəyişiklik tapılmadı." };
  }

  const { error } = await supabase
    .from("farmers")
    .update({
      farm_name: farmer.pending_farm_name,
      description: farmer.pending_description,
      location_text: farmer.pending_location_text,
      avatar_url: farmer.pending_avatar_url,
      pending_farm_name: null,
      pending_description: null,
      pending_location_text: null,
      pending_avatar_url: null,
      pending_submitted_at: null,
    })
    .eq("id", farmerId);

  if (error) {
    console.error("[admin.approveFarmerProfileEdit]", error.message);
    return { error: "Dəyişiklik təsdiqlənmədi." };
  }

  await notifyUser({
    userId: farmer.profile_id,
    type: "farmer_profile_update",
    title: "Profil dəyişiklikləriniz təsdiqləndi",
    body: "Göndərdiyiniz profil yenilikləri indi canlıdır.",
    metadata: { farmer_id: farmerId },
  });

  revalidatePath("/admin/farmers");
  revalidatePath("/admin", "layout");
  revalidatePath("/farmer");
  revalidatePath("/farmers");
  revalidatePath(`/farmers/${farmerId}`);
  updateTag("farmers");

  return { success: "Dəyişikliklər təsdiqləndi və yayımlandı." };
}

export async function rejectFarmerProfileEdit(
  _prev: AdminPortalActionState,
  formData: FormData
): Promise<AdminPortalActionState> {
  await requireAdmin();
  const farmerId = String(formData.get("farmer_id") ?? "");
  if (!farmerId) return { error: "Fermer tapılmadı." };

  const supabase = await createClient();
  const { data: farmer } = await supabase
    .from("farmers")
    .select("id, profile_id, pending_submitted_at")
    .eq("id", farmerId)
    .single();

  if (!farmer || !farmer.pending_submitted_at) {
    return { error: "Gözləyən dəyişiklik tapılmadı." };
  }

  const { error } = await supabase
    .from("farmers")
    .update({
      pending_farm_name: null,
      pending_description: null,
      pending_location_text: null,
      pending_avatar_url: null,
      pending_submitted_at: null,
    })
    .eq("id", farmerId);

  if (error) {
    console.error("[admin.rejectFarmerProfileEdit]", error.message);
    return { error: "Dəyişiklik rədd edilmədi." };
  }

  await notifyUser({
    userId: farmer.profile_id,
    type: "farmer_profile_update",
    title: "Profil dəyişiklikləriniz rədd edildi",
    body: "Göndərdiyiniz profil yenilikləri təsdiqlənmədi. Zəhmət olmasa yenidən cəhd edin.",
    metadata: { farmer_id: farmerId },
  });

  revalidatePath("/admin/farmers");
  revalidatePath("/admin", "layout");
  revalidatePath("/farmer");

  return { success: "Dəyişikliklər rədd edildi." };
}

export async function suspendFarmer(
  _prev: AdminPortalActionState,
  formData: FormData
): Promise<AdminPortalActionState> {
  await requireAdmin();
  const farmerId = String(formData.get("farmer_id") ?? "");
  if (!farmerId) return { error: "Fermer tapılmadı." };

  const supabase = await createClient();
  const { data: farmer } = await supabase
    .from("farmers")
    .select("id, profile_id, farm_name, status")
    .eq("id", farmerId)
    .single();

  if (!farmer) return { error: "Fermer tapılmadı." };

  if (farmer.status === "suspended") {
    return { error: "Fermer artıq deaktivdir." };
  }

  const { error } = await supabase
    .from("farmers")
    .update({ status: "suspended", verified_at: null })
    .eq("id", farmerId);

  if (error) return { error: "Fermer deaktiv edilmədi." };

  await notifyUser({
    userId: farmer.profile_id,
    type: "farmer_approval",
    title: "Fermer hesabınız deaktiv edildi",
    body: `${farmer.farm_name} hesabınız müvəqqəti dayandırılıb. Məhsullarınız satışda görünmür.`,
    metadata: { farmer_id: farmer.id },
  });

  revalidateProductCatalog();
  revalidatePath("/admin/farmers");
  revalidatePath("/admin", "layout");
  revalidatePath("/farmer");
  revalidatePath("/farmers");
  return { success: "Fermer deaktiv edildi." };
}

export async function deleteFarmer(
  _prev: AdminPortalActionState,
  formData: FormData
): Promise<AdminPortalActionState> {
  await requireAdmin();
  const farmerId = String(formData.get("farmer_id") ?? "");
  if (!farmerId) return { error: "Fermer tapılmadı." };

  const supabase = await createClient();
  const { data: farmer } = await supabase
    .from("farmers")
    .select("id, profile_id, farm_name")
    .eq("id", farmerId)
    .single();

  if (!farmer) return { error: "Fermer tapılmadı." };

  const admin = createAdminClient();

  // Hard delete farmer row (cascades products, images, blog, order_items).
  const { error: deleteError } = await admin
    .from("farmers")
    .delete()
    .eq("id", farmerId);

  if (deleteError) {
    console.error("[admin.deleteFarmer]", deleteError.message);
    return { error: "Fermer silinmədi. Sifariş tarixçəsi və ya digər bağlı məlumatlar mane ola bilər." };
  }

  // Keep auth account; demote profile and clear farmer metadata so they can
  // re-apply via /farmer/signup with the same login.
  const { error: profileError } = await admin
    .from("profiles")
    .update({ role: "customer" })
    .eq("id", farmer.profile_id)
    .neq("role", "admin");

  if (profileError) {
    console.error("[admin.deleteFarmer.profile]", profileError.message);
  }

  const { error: metaError } = await admin.auth.admin.updateUserById(
    farmer.profile_id,
    {
      user_metadata: {
        role: "customer",
        farm_name: null,
        farm_location_text: null,
        farm_description: null,
      },
    },
  );

  if (metaError) {
    console.error("[admin.deleteFarmer.metadata]", metaError.message);
  }

  await notifyUser({
    userId: farmer.profile_id,
    type: "general",
    title: "Fermer hesabınız silindi",
    body: `${farmer.farm_name} fermer profili admin tərəfindən silinib. Eyni hesabla yenidən fermer qeydiyyatından keçə bilərsiniz.`,
    metadata: { farmer_id: farmer.id },
  });

  revalidateProductCatalog();
  revalidatePath("/admin/farmers");
  revalidatePath("/admin", "layout");
  revalidatePath("/farmer");
  revalidatePath("/farmers");
  revalidatePath("/shop");
  return { success: "Fermer bazadan silindi." };
}

export async function approveProduct(
  _prev: AdminPortalActionState,
  formData: FormData
): Promise<AdminPortalActionState> {
  await requireAdmin();
  const productId = String(formData.get("product_id") ?? "");
  const finalPrice = Number(formData.get("final_price") ?? 0);

  if (!productId) return { error: "Məhsul tapılmadı." };
  if (!(finalPrice > 0)) return { error: "Final qiymət daxil edin." };

  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("id, title, farmer_id, farmers(profile_id, farm_name)")
    .eq("id", productId)
    .single();

  if (!product) return { error: "Məhsul tapılmadı." };

  const { error } = await supabase
    .from("products")
    .update({
      status: "approved",
      final_price: finalPrice,
    })
    .eq("id", productId);

  if (error) return { error: "Məhsul təsdiqlənmədi." };

  const farmer = Array.isArray(product.farmers)
    ? product.farmers[0]
    : product.farmers;

  if (farmer?.profile_id) {
    await notifyUser({
      userId: farmer.profile_id,
      type: "product_approval",
      title: "Məhsulunuz təsdiqləndi",
      body: `"${product.title}" mağazaya əlavə olundu.`,
      metadata: { product_id: product.id },
    });
  }

  revalidatePath("/admin/products");
  revalidatePath("/admin", "layout");
  revalidatePath("/farmer/products");
  revalidateProductCatalog(productId);
  return { success: "Məhsul təsdiqləndi." };
}

export async function updateProductFinalPrice(
  _prev: AdminPortalActionState,
  formData: FormData
): Promise<AdminPortalActionState> {
  await requireAdmin();
  const productId = String(formData.get("product_id") ?? "");
  const finalPrice = Number(formData.get("final_price") ?? 0);

  if (!productId) return { error: "Məhsul tapılmadı." };
  if (!(finalPrice > 0)) return { error: "Final qiymət daxil edin." };

  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("id, title, status, farmers(profile_id)")
    .eq("id", productId)
    .eq("status", "approved")
    .maybeSingle();

  if (!product) return { error: "Təsdiqlənmiş məhsul tapılmadı." };

  const { error } = await supabase
    .from("products")
    .update({ final_price: finalPrice })
    .eq("id", productId)
    .eq("status", "approved");

  if (error) return { error: "Qiymət yenilənmədi." };

  const farmer = Array.isArray(product.farmers)
    ? product.farmers[0]
    : product.farmers;

  if (farmer?.profile_id) {
    await notifyUser({
      userId: farmer.profile_id,
      type: "product_approval",
      title: "Son qiymət yeniləndi",
      body: `"${product.title}" üçün yeni son qiymət: ${finalPrice.toFixed(2)} ₼`,
      metadata: { product_id: product.id },
    });
  }

  revalidatePath("/admin/products");
  revalidatePath("/admin", "layout");
  revalidatePath("/farmer/products");
  revalidateProductCatalog(productId);
  return { success: "Son qiymət yeniləndi." };
}

export async function updateProductByAdmin(
  _prev: AdminPortalActionState,
  formData: FormData
): Promise<AdminPortalActionState> {
  await requireAdmin();
  const productId = String(formData.get("product_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "").trim();
  const subcategoryId = String(formData.get("subcategory_id") ?? "").trim();
  const unitType = String(formData.get("unit_type") ?? "").trim();

  if (!productId) return { error: "Məhsul tapılmadı." };
  if (!title || !description || !categoryId) {
    return { error: "Ad, təsvir və kateqoriya mütləqdir." };
  }
  if (!["kg", "piece", "liter"].includes(unitType)) {
    return { error: "Vahid tipi yanlışdır." };
  }

  const supabase = await createClient();
  // Note: farmer_price and quantity_available are intentionally not touched here —
  // the farmer's offer stays as submitted.
  const { error } = await supabase
    .from("products")
    .update({
      title,
      description,
      category_id: categoryId,
      subcategory_id: subcategoryId || null,
      unit_type: unitType as UnitType,
    })
    .eq("id", productId);

  if (error) {
    console.error("[admin.updateProductByAdmin]", error.message);
    return { error: "Məhsul yenilənmədi." };
  }

  revalidatePath("/admin/products");
  revalidatePath("/admin", "layout");
  revalidatePath("/farmer/products");
  revalidateProductCatalog(productId);
  return { success: "Məhsul yeniləndi." };
}

export async function rejectProduct(
  _prev: AdminPortalActionState,
  formData: FormData
): Promise<AdminPortalActionState> {
  await requireAdmin();
  const productId = String(formData.get("product_id") ?? "");
  if (!productId) return { error: "Məhsul tapılmadı." };

  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("id, title, farmers(profile_id)")
    .eq("id", productId)
    .single();

  if (!product) return { error: "Məhsul tapılmadı." };

  const { error } = await supabase
    .from("products")
    .update({ status: "rejected" })
    .eq("id", productId);

  if (error) return { error: "Məhsul rədd edilmədi." };

  const farmer = Array.isArray(product.farmers)
    ? product.farmers[0]
    : product.farmers;

  if (farmer?.profile_id) {
    await notifyUser({
      userId: farmer.profile_id,
      type: "product_approval",
      title: "Məhsulunuz rədd edildi",
      body: `"${product.title}" təsdiqlənmədi. Düzəliş edib yenidən göndərin.`,
      metadata: { product_id: product.id },
    });
  }

  revalidatePath("/admin/products");
  revalidatePath("/admin", "layout");
  revalidatePath("/farmer/products");
  revalidateProductCatalog(productId);
  return { success: "Məhsul rədd edildi." };
}

export async function createCourier(
  _prev: AdminPortalActionState,
  formData: FormData
): Promise<AdminPortalActionState> {
  await requireAdmin();

  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!fullName || !email || !password) {
    return { error: "Bütün sahələr mütləqdir." };
  }

  if (password.length < 6) {
    return { error: "Şifrə ən azı 6 simvol olmalıdır." };
  }

  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: "courier",
      },
    });

    if (error || !data.user) {
      return { error: error?.message ?? "Kuryer yaradıla bilmədi." };
    }

    await adminClient
      .from("profiles")
      .update({ role: "courier", full_name: fullName })
      .eq("id", data.user.id);

    const { error: courierError } = await adminClient.from("couriers").insert({
      profile_id: data.user.id,
      is_active: true,
    });

    if (courierError) {
      return { error: "Kuryer profili yaradıla bilmədi." };
    }
  } catch (error) {
    console.error("[admin.createCourier]", error);
    return {
      error:
        "Kuryer yaradıla bilmədi. SUPABASE_SERVICE_ROLE_KEY yoxlanmalıdır.",
    };
  }

  revalidatePath("/admin/couriers");
  revalidatePath("/admin", "layout");
  return { success: "Kuryer hesabı yaradıldı." };
}

export async function toggleCourierActive(
  _prev: AdminPortalActionState,
  formData: FormData
): Promise<AdminPortalActionState> {
  await requireAdmin();
  const courierId = String(formData.get("courier_id") ?? "");
  const isActive = String(formData.get("is_active") ?? "") === "true";

  if (!courierId) return { error: "Kuryer tapılmadı." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("couriers")
    .update({ is_active: !isActive })
    .eq("id", courierId);

  if (error) return { error: "Kuryer yenilənmədi." };

  revalidatePath("/admin/couriers");
  return { success: "Kuryer statusu yeniləndi." };
}

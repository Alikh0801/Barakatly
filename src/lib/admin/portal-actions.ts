"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { notifyUser } from "@/lib/notifications/helpers";
import { revalidateProductCatalog } from "@/lib/shop/revalidate";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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

  await notifyUser({
    userId: farmer.profile_id,
    type: "farmer_approval",
    title: "Fermer hesabınız təsdiqləndi",
    body: `${farmer.farm_name} hesabınız aktivdir. İndi məhsul əlavə edə bilərsiniz.`,
    metadata: { farmer_id: farmer.id },
  });

  revalidatePath("/admin/farmers");
  revalidatePath("/admin");
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
  revalidatePath("/admin");
  return { success: "Fermer rədd edildi." };
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
  revalidatePath("/admin");
  revalidatePath("/farmer/products");
  revalidateProductCatalog(productId);
  return { success: "Məhsul təsdiqləndi." };
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
  revalidatePath("/admin");
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

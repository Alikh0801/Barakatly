"use server";

import { refresh, revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type CartActionResult = {
  ok: boolean;
  needsAuth?: boolean;
  error?: string;
};

function revalidateCart() {
  revalidatePath("/cart");
  revalidatePath("/checkout");
  refresh();
}

export async function addToCart(
  productId: string,
  quantity = 1,
): Promise<CartActionResult> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, needsAuth: true };
  }

  if (!productId || !(quantity > 0)) {
    return { ok: false, error: "Məhsul seçilmədi." };
  }

  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("id, quantity_available, in_stock, status, farmer_id")
    .eq("id", productId)
    .eq("status", "approved")
    .maybeSingle();

  if (!product || !product.in_stock || product.quantity_available <= 0) {
    return { ok: false, error: "Bu məhsul hazırda mövcud deyil." };
  }

  // A farmer cannot order their own product.
  const { data: ownFarmer } = await supabase
    .from("farmers")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (ownFarmer && ownFarmer.id === product.farmer_id) {
    return { ok: false, error: "Öz məhsulunuza sifariş verə bilməzsiniz." };
  }

  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("customer_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  const nextQuantity = Math.min(
    (existing?.quantity ?? 0) + quantity,
    product.quantity_available,
  );

  if (existing) {
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: nextQuantity })
      .eq("id", existing.id);
    if (error) {
      console.error("[cart.addToCart.update]", error.message);
      return { ok: false, error: "Səbət yenilənmədi." };
    }
  } else {
    const { error } = await supabase.from("cart_items").insert({
      customer_id: user.id,
      product_id: productId,
      quantity: nextQuantity,
    });
    if (error) {
      console.error("[cart.addToCart.insert]", error.message);
      return { ok: false, error: "Səbətə əlavə edilmədi." };
    }
  }

  revalidateCart();
  return { ok: true };
}

export async function setCartQuantity(
  productId: string,
  quantity: number,
): Promise<CartActionResult> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, needsAuth: true };
  }

  const supabase = await createClient();

  if (quantity <= 0) {
    return removeFromCart(productId);
  }

  const { data: product } = await supabase
    .from("products")
    .select("quantity_available")
    .eq("id", productId)
    .maybeSingle();

  const capped = product
    ? Math.min(quantity, product.quantity_available)
    : quantity;

  const { error } = await supabase
    .from("cart_items")
    .update({ quantity: capped })
    .eq("customer_id", user.id)
    .eq("product_id", productId);

  if (error) {
    console.error("[cart.setCartQuantity]", error.message);
    return { ok: false, error: "Miqdar yenilənmədi." };
  }

  revalidateCart();
  return { ok: true };
}

export async function removeFromCart(
  productId: string,
): Promise<CartActionResult> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, needsAuth: true };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("customer_id", user.id)
    .eq("product_id", productId);

  if (error) {
    console.error("[cart.removeFromCart]", error.message);
    return { ok: false, error: "Məhsul silinmədi." };
  }

  revalidateCart();
  return { ok: true };
}

export async function clearCart(): Promise<CartActionResult> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, needsAuth: true };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("customer_id", user.id);

  if (error) {
    console.error("[cart.clearCart]", error.message);
    return { ok: false, error: "Səbət təmizlənmədi." };
  }

  revalidateCart();
  return { ok: true };
}

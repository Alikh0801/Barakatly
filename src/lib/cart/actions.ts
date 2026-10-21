"use server";

import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { initialQuantity, minOrderQuantity, normalizeQuantity } from "@/lib/shop/quantity";

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

/**
 * Adds to the cart. `quantity` is in the product's unit; left out (the
 * product cards' quick button) it is one unit or the product's minimum.
 * The total in the cart always lands on a step, between the minimum and
 * the stock.
 */
export async function addToCart(
  productId: string,
  quantity?: number,
): Promise<CartActionResult> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, needsAuth: true };
  }

  if (!productId || (quantity !== undefined && !(quantity > 0))) {
    return { ok: false, error: "Məhsul seçilmədi." };
  }

  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("id, quantity_available, in_stock, status, farmer_id, unit_type, min_order_quantity")
    .eq("id", productId)
    .eq("status", "approved")
    .maybeSingle();

  if (!product || !product.in_stock || product.quantity_available <= 0) {
    return { ok: false, error: "Bu məhsul hazırda mövcud deyil." };
  }

  const limits = {
    min: minOrderQuantity(product.unit_type, product.min_order_quantity),
    max: Number(product.quantity_available),
  };

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

  const adding = quantity ?? initialQuantity(product.unit_type, limits.min, limits.max);
  const nextQuantity = normalizeQuantity(
    product.unit_type,
    Number(existing?.quantity ?? 0) + adding,
    limits,
  );
  if (nextQuantity <= 0) {
    return { ok: false, error: "Anbarda minimum sifariş qədər məhsul qalmayıb." };
  }

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

/**
 * "İndi al": adds to the cart and goes to checkout in one response. Calling
 * router.push after addToCart raced with its refresh(), and Next sometimes
 * replaced the product page in history instead of pushing checkout.
 */
export async function buyNow(
  productId: string,
  quantity?: number,
): Promise<CartActionResult> {
  const result = await addToCart(productId, quantity);
  if (result.needsAuth) {
    redirect(`/signin?next=${encodeURIComponent("/checkout")}`);
  }
  if (result.ok) {
    redirect("/checkout");
  }
  return result;
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
    .select("quantity_available, in_stock, unit_type, min_order_quantity")
    .eq("id", productId)
    .eq("status", "approved")
    .maybeSingle();

  // Previously a missing product fell through to the requested quantity, so a
  // removed or unapproved item could be set to any amount.
  if (!product) {
    return { ok: false, error: "Bu məhsul artıq mövcud deyil." };
  }

  if (!product.in_stock || product.quantity_available <= 0) {
    return { ok: false, error: "Bu məhsul hazırda stokda yoxdur." };
  }

  const capped = normalizeQuantity(product.unit_type, quantity, {
    min: minOrderQuantity(product.unit_type, product.min_order_quantity),
    max: Number(product.quantity_available),
  });
  if (capped <= 0) {
    return { ok: false, error: "Anbarda minimum sifariş qədər məhsul qalmayıb." };
  }

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

"use server";

import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { initialQuantity, minOrderQuantity, normalizeQuantity } from "@/lib/shop/quantity";
import { defaultVariant, productVariants, variantInStock } from "@/lib/shop/variants";
import type { ProductVariant } from "@/types/shop";

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
 * Adds a size of a product to the cart. `quantity` is in that size's unit;
 * left out (the product cards' quick button) it is one unit or the
 * product's minimum. No `variantId` means the default size. The total in
 * the cart always lands on a step, between the minimum and the size's stock.
 */
export async function addToCart(
  productId: string,
  quantity?: number,
  variantId?: string,
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
    .select(
      "id, unit_type, unit_size, farmer_price, final_price, quantity_available, in_stock, status, farmer_id, min_order_quantity, variants:product_variants (id, unit_type, unit_size, farmer_price, final_price, quantity_available, in_stock, sort_order, image_url)",
    )
    .eq("id", productId)
    .eq("status", "approved")
    .maybeSingle();

  if (!product) {
    return { ok: false, error: "Bu məhsul hazırda mövcud deyil." };
  }

  const variants = productVariants(product as typeof product & { variants: ProductVariant[] });
  const variant = variantId
    ? variants.find((candidate) => candidate.id === variantId)
    : defaultVariant(variants);

  if (!variant || !variant.id) {
    return { ok: false, error: "Ölçü seçilmədi." };
  }
  if (!variantInStock(variant)) {
    return { ok: false, error: "Bu ölçü hazırda stokda yoxdur." };
  }

  const limits = {
    min: minOrderQuantity(variant.unit_type, product.min_order_quantity),
    max: variant.quantity_available,
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
    .eq("variant_id", variant.id)
    .maybeSingle();

  const adding = quantity ?? initialQuantity(variant.unit_type, limits.min, limits.max);
  const nextQuantity = normalizeQuantity(
    variant.unit_type,
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
      variant_id: variant.id,
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
  variantId?: string,
): Promise<CartActionResult> {
  const result = await addToCart(productId, quantity, variantId);
  if (result.needsAuth) {
    redirect(`/signin?next=${encodeURIComponent("/checkout")}`);
  }
  if (result.ok) {
    redirect("/checkout");
  }
  return result;
}

/** Sets the amount of one size in the cart (a cart line is one size). */
export async function setCartQuantity(
  variantId: string,
  quantity: number,
): Promise<CartActionResult> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, needsAuth: true };
  }

  const supabase = await createClient();

  if (quantity <= 0) {
    return removeFromCart(variantId);
  }

  const { data: variant } = await supabase
    .from("product_variants")
    .select("unit_type, quantity_available, in_stock, product:products!inner (status, min_order_quantity)")
    .eq("id", variantId)
    .eq("product.status", "approved")
    .maybeSingle();

  // A removed or unapproved product can't be set to any amount.
  if (!variant) {
    return { ok: false, error: "Bu məhsul artıq mövcud deyil." };
  }

  const product = variant.product as unknown as { min_order_quantity: number | null };
  if (!variant.in_stock || Number(variant.quantity_available) <= 0) {
    return { ok: false, error: "Bu məhsul hazırda stokda yoxdur." };
  }

  const capped = normalizeQuantity(variant.unit_type, quantity, {
    min: minOrderQuantity(variant.unit_type, product.min_order_quantity),
    max: Number(variant.quantity_available),
  });
  if (capped <= 0) {
    return { ok: false, error: "Anbarda minimum sifariş qədər məhsul qalmayıb." };
  }

  const { error } = await supabase
    .from("cart_items")
    .update({ quantity: capped })
    .eq("customer_id", user.id)
    .eq("variant_id", variantId);

  if (error) {
    console.error("[cart.setCartQuantity]", error.message);
    return { ok: false, error: "Miqdar yenilənmədi." };
  }

  revalidateCart();
  return { ok: true };
}

export async function removeFromCart(
  variantId: string,
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
    .eq("variant_id", variantId);

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

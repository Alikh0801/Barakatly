"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

/** The product ids the signed-in visitor has hearted; null for guests. */
export async function getWishlistIds(): Promise<string[] | null> {
  const user = await getSessionUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wishlist_items")
    .select("product_id")
    .eq("customer_id", user.id);

  if (error) {
    console.error("[wishlist.getWishlistIds]", error.message);
    return [];
  }
  return (data ?? []).map((row) => row.product_id);
}

export type WishlistToggleResult =
  | { ok: true; saved: boolean }
  | { ok: false; needsAuth?: boolean; error?: string };

/** Adds the product to favourites, or removes it when `save` is false. */
export async function setWishlisted(
  productId: string,
  save: boolean,
): Promise<WishlistToggleResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, needsAuth: true };
  if (!productId) return { ok: false, error: "Məhsul tapılmadı." };

  const supabase = await createClient();
  const { error } = save
    ? await supabase
        .from("wishlist_items")
        .upsert(
          { customer_id: user.id, product_id: productId },
          { onConflict: "customer_id,product_id", ignoreDuplicates: true },
        )
    : await supabase
        .from("wishlist_items")
        .delete()
        .eq("customer_id", user.id)
        .eq("product_id", productId);

  if (error) {
    console.error("[wishlist.setWishlisted]", error.message);
    return { ok: false, error: "Sevimlilər yenilənmədi." };
  }

  revalidatePath("/favorites");
  return { ok: true, saved: save };
}

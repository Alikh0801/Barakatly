import { getSessionUser } from "@/lib/auth/session";
import { getDisplayPrice, getProductImageUrl } from "@/lib/shop/format";
import { createClient } from "@/lib/supabase/server";
import type { UnitType } from "@/types";
import { minOrderQuantity } from "@/lib/shop/quantity";
import { variantLabel } from "@/lib/shop/variants";

/** One size of a product in the cart; two sizes are two lines. */
export type CartLineItem = {
  productId: string;
  variantId: string;
  title: string;
  /** "banka (kq)", "banka 1,5 kq" — shown only when the product has several sizes. */
  sizeLabel: string | null;
  price: number;
  unitType: UnitType;
  unitSize: string | null;
  /** The smallest amount allowed, from the product and its unit. */
  minQuantity: number;
  quantity: number;
  maxQuantity: number;
  imageUrl: string | null;
  farmerId: string;
  farmerName: string;
  farmerAvatarUrl: string | null;
};

type CartVariant = {
  id: string;
  unit_type: UnitType;
  unit_size: string | null;
  final_price: number | null;
  farmer_price: number;
  quantity_available: number;
  in_stock: boolean;
  image_url: string | null;
};

type CartRow = {
  quantity: number;
  variant: CartVariant | null;
  product: {
    id: string;
    title: string;
    unit_type: UnitType;
    unit_size: string | null;
    min_order_quantity: number | null;
    final_price: number | null;
    farmer_price: number;
    quantity_available: number;
    in_stock: boolean;
    status: string;
    farmer: { id: string; owner_name: string | null; status: string; avatar_url: string | null } | null;
    product_images: { url: string; sort_order: number }[];
    variants: { id: string }[];
  } | null;
};

const cartSelect = `
  quantity,
  variant:product_variants (
    id,
    unit_type,
    unit_size,
    final_price,
    farmer_price,
    quantity_available,
    in_stock,
    image_url
  ),
  product:products (
    id,
    title,
    unit_type,
    unit_size,
    min_order_quantity,
    final_price,
    farmer_price,
    quantity_available,
    in_stock,
    status,
    farmer:farmers ( id, owner_name, status, avatar_url ),
    product_images ( url, sort_order ),
    variants:product_variants ( id )
  )
`;

export async function getCartItems(): Promise<CartLineItem[]> {
  const user = await getSessionUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cart_items")
    .select(cartSelect)
    .eq("customer_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[cart.getCartItems]", error.message);
    return [];
  }

  const rows = (data ?? []) as unknown as CartRow[];

  return rows
    .filter(
      (row) =>
        row.product &&
        row.variant &&
        row.product.status === "approved" &&
        row.product.farmer?.status === "approved",
    )
    .map((row) => {
      const product = row.product!;
      const variant = row.variant!;
      return {
        productId: product.id,
        variantId: variant.id,
        title: product.title,
        sizeLabel:
          product.variants.length > 1 ? variantLabel(variant.unit_type, variant.unit_size) : null,
        price: getDisplayPrice(
          variant.final_price == null ? null : Number(variant.final_price),
          Number(variant.farmer_price),
        ),
        unitType: variant.unit_type,
        unitSize: variant.unit_size,
        minQuantity: minOrderQuantity(variant.unit_type, product.min_order_quantity),
        quantity: Number(row.quantity),
        maxQuantity: variant.in_stock ? Number(variant.quantity_available) : 0,
        imageUrl: variant.image_url ?? getProductImageUrl(product.product_images),
        farmerId: product.farmer?.id ?? "",
        farmerName: product.farmer?.owner_name ?? "Fermer",
        farmerAvatarUrl: product.farmer?.avatar_url ?? null,
      };
    });
}

export async function getCartCount(): Promise<number> {
  const user = await getSessionUser();
  if (!user) return 0;

  const supabase = await createClient();
  const { count, error } = await supabase
    .from("cart_items")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", user.id);

  if (error) {
    console.error("[cart.getCartCount]", error.message);
    return 0;
  }

  return count ?? 0;
}

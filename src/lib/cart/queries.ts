import { getSessionUser } from "@/lib/auth/session";
import { getDisplayPrice, getProductImageUrl } from "@/lib/shop/format";
import { createClient } from "@/lib/supabase/server";
import type { UnitType } from "@/types";

export type CartLineItem = {
  productId: string;
  title: string;
  price: number;
  unitType: UnitType;
  quantity: number;
  maxQuantity: number;
  imageUrl: string | null;
  farmerId: string;
  farmerName: string;
};

type CartRow = {
  quantity: number;
  product: {
    id: string;
    title: string;
    unit_type: UnitType;
    final_price: number | null;
    farmer_price: number;
    quantity_available: number;
    in_stock: boolean;
    status: string;
    farmer: { id: string; farm_name: string; status: string } | null;
    product_images: { url: string; sort_order: number }[];
  } | null;
};

const cartSelect = `
  quantity,
  product:products (
    id,
    title,
    unit_type,
    final_price,
    farmer_price,
    quantity_available,
    in_stock,
    status,
    farmer:farmers ( id, farm_name, status ),
    product_images ( url, sort_order )
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
        row.product.status === "approved" &&
        row.product.farmer?.status === "approved",
    )
    .map((row) => {
      const product = row.product!;
      return {
        productId: product.id,
        title: product.title,
        price: getDisplayPrice(product.final_price, product.farmer_price),
        unitType: product.unit_type,
        quantity: row.quantity,
        maxQuantity: product.quantity_available,
        imageUrl: getProductImageUrl(product.product_images),
        farmerId: product.farmer?.id ?? "",
        farmerName: product.farmer?.farm_name ?? "Fermer",
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

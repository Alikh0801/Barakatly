import type { UnitType } from "@/types";

export type ProductImage = {
  url: string;
  sort_order: number;
};

/** One size of a product: its own unit, price, stock and photo. */
export type ProductVariant = {
  id: string;
  unit_type: UnitType;
  unit_size: string | null;
  farmer_price: number;
  final_price: number | null;
  quantity_available: number;
  in_stock: boolean;
  sort_order: number;
  /** Shown when this size is picked; null means the product's first photo. */
  image_url: string | null;
};

export type ProductListItem = {
  id: string;
  title: string;
  description: string;
  unit_type: UnitType;
  /** Package size for the unit, e.g. "0,5 kq" for a jar. */
  unit_size: string | null;
  /** Farmer's minimum order; null means the unit's floor. */
  min_order_quantity: number | null;
  final_price: number | null;
  farmer_price: number;
  quantity_available: number;
  in_stock: boolean;
  sold_count: number;
  /** Average of the product's reviews; null until it has one. */
  rating_average?: number | null;
  rating_count?: number;
  farmer: {
    id: string;
    /** The farmer's own name. */
    owner_name: string | null;
    status?: string;
  } | null;
  category: {
    slug: string;
    name_az: string;
  } | null;
  product_images: ProductImage[];
  /** Its sizes. The unit, price and stock above mirror the default one. */
  variants: ProductVariant[];
};

export type ProductDetail = Omit<ProductListItem, "farmer"> & {
  farmer: {
    id: string;
    /** The farmer's own name. */
    owner_name: string | null;
    description: string | null;
    location_text: string | null;
    verified_at: string | null;
    avatar_url: string | null;
    status: string;
  } | null;
};

export type CategoryItem = {
  id: string;
  slug: string;
  name_az: string;
  icon: string | null;
  image_url: string | null;
};

import type { UnitType } from "@/types";

export type ProductImage = {
  url: string;
  sort_order: number;
};

export type ProductListItem = {
  id: string;
  title: string;
  description: string;
  unit_type: UnitType;
  final_price: number | null;
  farmer_price: number;
  quantity_available: number;
  in_stock: boolean;
  farmer: {
    id: string;
    farm_name: string;
  } | null;
  category: {
    slug: string;
    name_az: string;
  } | null;
  product_images: ProductImage[];
};

export type ProductDetail = ProductListItem & {
  farmer: {
    id: string;
    farm_name: string;
    location_text: string | null;
    status: string;
  } | null;
};

export type CategoryItem = {
  id: string;
  slug: string;
  name_az: string;
  icon: string | null;
};

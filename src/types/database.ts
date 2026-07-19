export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "customer" | "farmer" | "courier" | "admin";
export type FarmerStatus = "pending" | "approved" | "rejected" | "suspended";
export type ProductStatus = "pending" | "approved" | "rejected";
export type UnitType = "kg" | "piece" | "liter";
export type OrderStatus =
  | "awaiting_confirmation"
  | "confirmed"
  | "farmer_accepted"
  | "preparing"
  | "awaiting_courier"
  | "picked_up"
  | "delivered"
  | "cancelled";
export type OrderItemStatus =
  | "new"
  | "accepted"
  | "preparing"
  | "ready"
  | "awaiting_pickup"
  | "picked_up"
  | "delivered";
export type PaymentStatus = "pending" | "confirmed" | "rejected";
export type NotificationType =
  | "farmer_registration"
  | "farmer_approval"
  | "product_submission"
  | "product_approval"
  | "payment_received"
  | "order_confirmed"
  | "order_prepared"
  | "order_picked_up"
  | "order_delivered"
  | "general";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          full_name: string | null;
          email: string | null;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: UserRole;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      farmers: {
        Row: {
          id: string;
          profile_id: string;
          farm_name: string;
          description: string | null;
          location_text: string | null;
          location_lat: number | null;
          location_lng: number | null;
          location_map_url: string | null;
          status: FarmerStatus;
          verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          farm_name: string;
          description?: string | null;
          location_text?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          location_map_url?: string | null;
          status?: FarmerStatus;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          farm_name?: string;
          description?: string | null;
          location_text?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          location_map_url?: string | null;
          status?: FarmerStatus;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      couriers: {
        Row: {
          id: string;
          profile_id: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          slug: string;
          name_az: string;
          icon: string | null;
          image_url: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name_az: string;
          icon?: string | null;
          image_url?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name_az?: string;
          icon?: string | null;
          image_url?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          farmer_id: string;
          category_id: string;
          title: string;
          description: string;
          unit_type: UnitType;
          farmer_price: number;
          final_price: number | null;
          quantity_available: number;
          in_stock: boolean;
          status: ProductStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          farmer_id: string;
          category_id: string;
          title: string;
          description: string;
          unit_type: UnitType;
          farmer_price: number;
          final_price?: number | null;
          quantity_available?: number;
          in_stock?: boolean;
          status?: ProductStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          farmer_id?: string;
          category_id?: string;
          title?: string;
          description?: string;
          unit_type?: UnitType;
          farmer_price?: number;
          final_price?: number | null;
          quantity_available?: number;
          in_stock?: boolean;
          status?: ProductStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          url: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          url: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          url?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_code: string;
          customer_id: string;
          status: OrderStatus;
          contact_phone: string;
          delivery_address_text: string | null;
          delivery_lat: number | null;
          delivery_lng: number | null;
          delivery_map_url: string | null;
          subtotal: number;
          delivery_fee: number;
          total_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_code: string;
          customer_id: string;
          status?: OrderStatus;
          contact_phone: string;
          delivery_address_text?: string | null;
          delivery_lat?: number | null;
          delivery_lng?: number | null;
          delivery_map_url?: string | null;
          subtotal?: number;
          delivery_fee?: number;
          total_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_code?: string;
          customer_id?: string;
          status?: OrderStatus;
          contact_phone?: string;
          delivery_address_text?: string | null;
          delivery_lat?: number | null;
          delivery_lng?: number | null;
          delivery_map_url?: string | null;
          subtotal?: number;
          delivery_fee?: number;
          total_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          farmer_id: string;
          product_id: string;
          product_title: string;
          quantity: number;
          unit_type: UnitType;
          unit_price: number;
          line_total: number;
          status: OrderItemStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          farmer_id: string;
          product_id: string;
          product_title: string;
          quantity: number;
          unit_type: UnitType;
          unit_price: number;
          line_total: number;
          status?: OrderItemStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          farmer_id?: string;
          product_id?: string;
          product_title?: string;
          quantity?: number;
          unit_type?: UnitType;
          unit_price?: number;
          line_total?: number;
          status?: OrderItemStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_status_events: {
        Row: {
          id: string;
          order_id: string;
          order_item_id: string | null;
          status: string;
          changed_by: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          order_item_id?: string | null;
          status: string;
          changed_by?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          order_item_id?: string | null;
          status?: string;
          changed_by?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      banks: {
        Row: {
          id: string;
          name: string;
          pan_number: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          pan_number: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          pan_number?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          bank_id: string;
          receipt_url: string | null;
          status: PaymentStatus;
          confirmed_by: string | null;
          confirmed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          bank_id: string;
          receipt_url?: string | null;
          status?: PaymentStatus;
          confirmed_by?: string | null;
          confirmed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          bank_id?: string;
          receipt_url?: string | null;
          status?: PaymentStatus;
          confirmed_by?: string | null;
          confirmed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string;
          type: NotificationType;
          metadata: Json;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          body: string;
          type?: NotificationType;
          metadata?: Json;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          body?: string;
          type?: NotificationType;
          metadata?: Json;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      site_content: {
        Row: {
          key: string;
          title: string;
          body: string;
          items: Json;
          updated_at: string;
        };
        Insert: {
          key: string;
          title: string;
          body: string;
          items?: Json;
          updated_at?: string;
        };
        Update: {
          key?: string;
          title?: string;
          body?: string;
          items?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      generate_order_code: {
        Args: Record<string, never>;
        Returns: string;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      farmer_status: FarmerStatus;
      product_status: ProductStatus;
      unit_type: UnitType;
      order_status: OrderStatus;
      order_item_status: OrderItemStatus;
      payment_status: PaymentStatus;
      notification_type: NotificationType;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Farmer = Database["public"]["Tables"]["farmers"]["Row"];
export type Courier = Database["public"]["Tables"]["couriers"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
export type OrderStatusEvent =
  Database["public"]["Tables"]["order_status_events"]["Row"];
export type Bank = Database["public"]["Tables"]["banks"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type SiteContent = Database["public"]["Tables"]["site_content"]["Row"];

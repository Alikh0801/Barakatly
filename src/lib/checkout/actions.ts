"use server";

import { getSessionUser } from "@/lib/auth/session";
import {
  DELIVERY_FEE,
  RECEIPT_MAX_BYTES,
  RECEIPT_MIME_TYPES,
} from "@/lib/checkout/constants";
import { notifyAdmins } from "@/lib/notifications/helpers";
import { getDisplayPrice } from "@/lib/shop/format";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { UnitType } from "@/types";

export type CheckoutCartItem = {
  productId: string;
  quantity: number;
};

export type PlaceOrderState = {
  error?: string;
  orderId?: string;
};

type ValidatedLine = {
  productId: string;
  farmerId: string;
  title: string;
  quantity: number;
  unitType: UnitType;
  unitPrice: number;
  lineTotal: number;
};

function getReceiptExtension(file: File): string {
  const byType: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "application/pdf": "pdf",
  };

  return byType[file.type] ?? "bin";
}

function normalizePhone(phone: string): string {
  return phone.replace(/\s+/g, "");
}

export async function placeOrder(
  _prevState: PlaceOrderState,
  formData: FormData
): Promise<PlaceOrderState> {
  const user = await getSessionUser();
  if (!user) {
    return { error: "Sifariş üçün daxil olmalısınız." };
  }

  const contactPhone = normalizePhone(
    String(formData.get("contact_phone") ?? "").trim()
  );
  const deliveryAddress = String(
    formData.get("delivery_address_text") ?? ""
  ).trim();
  const bankId = String(formData.get("bank_id") ?? "").trim();
  const receipt = formData.get("receipt");
  const cartJson = String(formData.get("cart_items") ?? "[]");

  if (!contactPhone || contactPhone.length < 9) {
    return { error: "Düzgün telefon nömrəsi daxil edin." };
  }

  if (!bankId) {
    return { error: "Bank seçin." };
  }

  if (!(receipt instanceof File) || receipt.size === 0) {
    return { error: "Ödəniş çekini yükləyin." };
  }

  if (receipt.size > RECEIPT_MAX_BYTES) {
    return { error: "Çek faylı 5 MB-dan böyük ola bilməz." };
  }

  if (
    !RECEIPT_MIME_TYPES.includes(
      receipt.type as (typeof RECEIPT_MIME_TYPES)[number]
    )
  ) {
    return { error: "Çek JPEG, PNG, WebP və ya PDF formatında olmalıdır." };
  }

  let cartItems: CheckoutCartItem[];
  try {
    const parsed = JSON.parse(cartJson) as CheckoutCartItem[];
    if (!Array.isArray(parsed)) {
      return { error: "Səbət məlumatları yanlışdır." };
    }
    cartItems = parsed.filter(
      (item) =>
        item &&
        typeof item.productId === "string" &&
        typeof item.quantity === "number" &&
        item.quantity > 0
    );
  } catch {
    return { error: "Səbət məlumatları yanlışdır." };
  }

  if (cartItems.length === 0) {
    return { error: "Səbətiniz boşdur." };
  }

  const supabase = await createClient();
  const productIds = [...new Set(cartItems.map((item) => item.productId))];

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select(
      "id, title, unit_type, final_price, farmer_price, quantity_available, in_stock, status, farmer_id"
    )
    .in("id", productIds)
    .eq("status", "approved");

  if (productsError || !products?.length) {
    return { error: "Məhsullar tapılmadı və ya artıq mövcud deyil." };
  }

  const productMap = new Map(products.map((product) => [product.id, product]));
  const validatedLines: ValidatedLine[] = [];

  for (const item of cartItems) {
    const product = productMap.get(item.productId);
    if (!product) {
      return { error: "Səbətdəki bəzi məhsullar artıq mövcud deyil." };
    }
    if (!product.in_stock || product.quantity_available < item.quantity) {
      return {
        error: `"${product.title}" üçün kifayət qədər miqdar yoxdur.`,
      };
    }

    const unitPrice = getDisplayPrice(product.final_price, product.farmer_price);
    validatedLines.push({
      productId: product.id,
      farmerId: product.farmer_id,
      title: product.title,
      quantity: item.quantity,
      unitType: product.unit_type,
      unitPrice,
      lineTotal: unitPrice * item.quantity,
    });
  }

  const { data: bank, error: bankError } = await supabase
    .from("banks")
    .select("id")
    .eq("id", bankId)
    .eq("is_active", true)
    .maybeSingle();

  if (bankError || !bank) {
    return { error: "Seçilmiş bank tapılmadı." };
  }

  const subtotal = validatedLines.reduce((sum, line) => sum + line.lineTotal, 0);
  const totalAmount = subtotal + DELIVERY_FEE;

  const receiptPath = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${getReceiptExtension(receipt)}`;
  const { error: uploadError } = await supabase.storage
    .from("payment-receipts")
    .upload(receiptPath, receipt, {
      contentType: receipt.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("[checkout.placeOrder] upload", uploadError.message);
    return { error: "Çek yüklənmədi. Yenidən cəhd edin." };
  }

  const { data: orderCode, error: codeError } = await supabase.rpc(
    "generate_order_code"
  );

  if (codeError || !orderCode) {
    console.error("[checkout.placeOrder] order code", codeError?.message);
    return { error: "Sifariş kodu yaradıla bilmədi." };
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_code: orderCode,
      customer_id: user.id,
      contact_phone: contactPhone,
      delivery_address_text: deliveryAddress || null,
      subtotal,
      delivery_fee: DELIVERY_FEE,
      total_amount: totalAmount,
      status: "awaiting_confirmation",
    })
    .select("id")
    .single();

  if (orderError || !order) {
    console.error("[checkout.placeOrder] order", orderError?.message);
    return { error: "Sifariş yaradıla bilmədi." };
  }

  const { error: itemsError } = await supabase.from("order_items").insert(
    validatedLines.map((line) => ({
      order_id: order.id,
      farmer_id: line.farmerId,
      product_id: line.productId,
      product_title: line.title,
      quantity: line.quantity,
      unit_type: line.unitType,
      unit_price: line.unitPrice,
      line_total: line.lineTotal,
      status: "new" as const,
    }))
  );

  if (itemsError) {
    console.error("[checkout.placeOrder] items", itemsError.message);
    return { error: "Sifariş məhsulları əlavə edilə bilmədi." };
  }

  const { error: paymentError } = await supabase.from("payments").insert({
    order_id: order.id,
    bank_id: bankId,
    receipt_url: receiptPath,
    status: "pending",
  });

  if (paymentError) {
    console.error("[checkout.placeOrder] payment", paymentError.message);
    return {
      error:
        "Ödəniş qeydi yaradıla bilmədi. Dəstək ilə əlaqə saxlayın və sifariş kodunu qeyd edin.",
    };
  }

  // Decrement stock via service role (customers cannot update products via RLS).
  try {
    const admin = createAdminClient();
    for (const line of validatedLines) {
      const product = productMap.get(line.productId);
      if (!product) continue;
      const nextQty = Math.max(0, product.quantity_available - line.quantity);
      const { error: stockError } = await admin
        .from("products")
        .update({
          quantity_available: nextQty,
          in_stock: nextQty > 0,
        })
        .eq("id", line.productId)
        .gte("quantity_available", line.quantity);

      if (stockError) {
        console.error("[checkout.placeOrder] stock", stockError.message);
      }
    }
  } catch (error) {
    console.error("[checkout.placeOrder] stock admin", error);
  }

  await supabase.from("order_status_events").insert({
    order_id: order.id,
    status: "awaiting_confirmation",
    changed_by: user.id,
    note: "Sifariş yaradıldı",
  });

  await notifyAdmins({
    type: "payment_received",
    title: "Yeni ödəniş + çek",
    body: `${orderCode} sifarişi üçün ödəniş çeki yoxlama gözləyir.`,
    metadata: { order_id: order.id },
  });

  return { orderId: order.id };
}

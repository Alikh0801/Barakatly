"use server";

import { after } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import {
  DELIVERY_FEE,
  RECEIPT_MAX_BYTES,
  RECEIPT_MIME_TYPES,
} from "@/lib/checkout/constants";
import { notifyAdmins } from "@/lib/notifications/helpers";
import { isValidAzPhone, normalizeAzPhone } from "@/lib/phone/az";
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

export async function placeOrder(
  _prevState: PlaceOrderState,
  formData: FormData
): Promise<PlaceOrderState> {
  const user = await getSessionUser();
  if (!user) {
    return { error: "Sifariş üçün daxil olmalısınız." };
  }

  const contactPhoneRaw = String(formData.get("contact_phone") ?? "").trim();
  const deliveryAddress = String(
    formData.get("delivery_address_text") ?? ""
  ).trim();
  const bankId = String(formData.get("bank_id") ?? "").trim();
  const receipt = formData.get("receipt");

  if (!isValidAzPhone(contactPhoneRaw)) {
    return {
      error: "Telefon +994 ilə başlamalıdır (məs: +994501234567).",
    };
  }
  const contactPhone = normalizeAzPhone(contactPhoneRaw);

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

  const supabase = await createClient();

  // Read the cart straight from the server so the client cannot tamper with it.
  const { data: cartRows, error: cartError } = await supabase
    .from("cart_items")
    .select("product_id, quantity")
    .eq("customer_id", user.id);

  if (cartError) {
    console.error("[checkout.placeOrder] cart", cartError.message);
    return { error: "Səbət oxuna bilmədi." };
  }

  const cartItems: CheckoutCartItem[] = (cartRows ?? [])
    .filter((row) => row.quantity > 0)
    .map((row) => ({ productId: row.product_id, quantity: row.quantity }));

  if (cartItems.length === 0) {
    return { error: "Səbətiniz boşdur." };
  }

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

  // A farmer cannot order their own products.
  const { data: ownFarmer } = await supabase
    .from("farmers")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (ownFarmer && validatedLines.some((line) => line.farmerId === ownFarmer.id)) {
    return {
      error: "Öz məhsulunuza sifariş verə bilməzsiniz. Onu səbətdən çıxarın.",
    };
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

  // Stock decrement (service role — customers can't update products via RLS)
  // and the order-created audit event both affect what the customer sees
  // right after redirect, so run them concurrently but still await them.
  try {
    const admin = createAdminClient();
    await Promise.all([
      ...validatedLines.map(async (line) => {
        const product = productMap.get(line.productId);
        if (!product) return;
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
      }),
      supabase.from("order_status_events").insert({
        order_id: order.id,
        status: "awaiting_confirmation",
        changed_by: user.id,
        note: "Sifariş yaradıldı",
      }),
    ]);
  } catch (error) {
    console.error("[checkout.placeOrder] stock admin", error);
  }

  // Clearing the cart and notifying admins don't change what the customer
  // sees next, so defer them past the response instead of making them wait
  // (Vercel's waitUntil keeps the invocation alive until these settle).
  after(async () => {
    await supabase.from("cart_items").delete().eq("customer_id", user.id);
    await notifyAdmins({
      type: "payment_received",
      title: "Yeni ödəniş + çek",
      body: `${orderCode} sifarişi üçün ödəniş çeki yoxlama gözləyir.`,
      metadata: { order_id: order.id },
    });
  });

  return { orderId: order.id };
}

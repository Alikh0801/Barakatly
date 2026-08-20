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
import { createClient } from "@/lib/supabase/server";

export type CheckoutCartItem = {
  productId: string;
  quantity: number;
};

export type PlaceOrderState = {
  error?: string;
  orderId?: string;
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

/** Turns place_order()'s raised exceptions into customer-facing messages. */
function describePlaceOrderError(message: string): string {
  if (message === "EMPTY_CART") return "Səbətiniz boşdur.";
  if (message === "PRODUCT_NOT_FOUND") {
    return "Səbətdəki bəzi məhsullar artıq mövcud deyil.";
  }
  if (message.startsWith("OUT_OF_STOCK:")) {
    const title = message.slice("OUT_OF_STOCK:".length);
    return `"${title}" üçün kifayət qədər miqdar yoxdur.`;
  }
  return "Sifariş yaradıla bilmədi. Yenidən cəhd edin.";
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

  if (!deliveryAddress) {
    return { error: "Çatdırılma ünvanını daxil edin." };
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

  // A farmer cannot order their own products — checked here since it's not
  // a stock concern and doesn't need to be inside the atomic order function.
  const [{ data: cartProducts }, { data: ownFarmer }] = await Promise.all([
    supabase.from("products").select("id, farmer_id").in("id", productIds),
    supabase
      .from("farmers")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle(),
  ]);

  if (
    ownFarmer &&
    (cartProducts ?? []).some((product) => product.farmer_id === ownFarmer.id)
  ) {
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

  // Product validation, pricing, order/items/payment creation, and the stock
  // decrement all happen atomically inside place_order() — either everything
  // commits together or nothing does, so a stock shortfall can never leave
  // behind an order that oversold a product.
  const { data: placed, error: placeError } = await supabase.rpc(
    "place_order",
    {
      p_customer_id: user.id,
      p_contact_phone: contactPhone,
      p_delivery_address_text: deliveryAddress || null,
      p_bank_id: bankId,
      p_receipt_url: receiptPath,
      p_delivery_fee: DELIVERY_FEE,
      p_items: cartItems.map((item) => ({
        product_id: item.productId,
        quantity: item.quantity,
      })),
    }
  );

  if (placeError || !placed?.[0]) {
    console.error("[checkout.placeOrder] rpc", placeError?.message);
    await supabase.storage.from("payment-receipts").remove([receiptPath]);
    return { error: describePlaceOrderError(placeError?.message ?? "") };
  }

  const { order_id: orderId, order_code: orderCode } = placed[0];

  // Clearing the cart and notifying admins don't change what the customer
  // sees next, so defer them past the response instead of making them wait
  // (Vercel's waitUntil keeps the invocation alive until these settle).
  after(async () => {
    await supabase.from("cart_items").delete().eq("customer_id", user.id);
    await notifyAdmins({
      type: "payment_received",
      title: "Yeni ödəniş + çek",
      body: `${orderCode} sifarişi üçün ödəniş çeki yoxlama gözləyir.`,
      metadata: { order_id: orderId },
    });
  });

  return { orderId };
}

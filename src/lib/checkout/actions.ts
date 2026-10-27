"use server";

import { cookies } from "next/headers";
import { after } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import {
  DISTRICT_MAX,
  ORDER_NOTE_MAX,
  RECIPIENT_NAME_MAX,
  RECEIPT_MAX_BYTES,
  RECEIPT_TOO_LARGE_ERROR,
  RECEIPT_TYPE_ERROR,
  isOwnReceiptPath,
  isReceiptMimeType,
} from "@/lib/checkout/constants";
import { notifyAdmins } from "@/lib/notifications/helpers";
import {
  AZ_PHONE_FORMAT_ERROR,
  isValidAzPhone,
  normalizeAzPhone,
} from "@/lib/phone/az";
import { AZ_REGIONS } from "@/lib/az/regions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { PROMO_COOKIE, describePromoError } from "@/lib/promo/constants";
import { getAppliedPromo } from "@/lib/promo/server";
import { formatAmount, isOnStep, minOrderQuantity } from "@/lib/shop/quantity";
import type { UnitType } from "@/types";

export type CheckoutCartItem = {
  productId: string;
  /** The size; null only for a line saved before sizes existed. */
  variantId: string | null;
  quantity: number;
  unitType: UnitType | null;
  unitSize: string | null;
};

export type PlaceOrderState = {
  error?: string;
  orderId?: string;
};

/** Turns place_order()'s raised exceptions into customer-facing messages. */
function describePlaceOrderError(message: string): string {
  if (message === "EMPTY_CART") return "Səbətiniz boşdur.";
  if (message === "PRODUCT_NOT_FOUND") {
    return "Səbətdəki bəzi məhsullar artıq mövcud deyil.";
  }
  if (message.startsWith("PROMO_")) {
    // The code stopped working between the summary and the order, so the
    // amount the customer transferred no longer matches.
    return `${describePromoError(message.slice("PROMO_".length))} Səhifəni yeniləyin: məbləğ dəyişə bilər.`;
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
  // The browser uploads the receipt straight to Storage and sends only its
  // path — a file in the request body would hit Vercel's ~4.5 MB function
  // payload cap (413) long before the 7 MB receipt limit.
  const receiptPath = String(formData.get("receipt_path") ?? "").trim();

  if (!isValidAzPhone(contactPhoneRaw)) {
    return {
      error: AZ_PHONE_FORMAT_ERROR,
    };
  }
  const contactPhone = normalizeAzPhone(contactPhoneRaw);

  if (!deliveryAddress) {
    return { error: "Çatdırılma ünvanını daxil edin." };
  }
  if (deliveryAddress.length > 300) {
    return { error: "Ünvan çox uzundur." };
  }

  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const district = String(formData.get("district") ?? "").trim();
  const note = String(formData.get("order_note") ?? "").trim();

  if (!firstName || !lastName) {
    return { error: "Ad və soyadı daxil edin." };
  }
  if (firstName.length > RECIPIENT_NAME_MAX || lastName.length > RECIPIENT_NAME_MAX) {
    return { error: "Ad və ya soyad çox uzundur." };
  }
  if (!(AZ_REGIONS as readonly string[]).includes(city)) {
    return { error: "Şəhəri seçin." };
  }
  if (district.length > DISTRICT_MAX) {
    return { error: "Rayon/qəsəbə adı çox uzundur." };
  }
  if (note.length > ORDER_NOTE_MAX) {
    return { error: `Qeyd ən çox ${ORDER_NOTE_MAX} simvol ola bilər.` };
  }

  if (!bankId) {
    return { error: "Bank seçin." };
  }

  if (!receiptPath) {
    return { error: "Ödəniş çekini yükləyin." };
  }

  // The path is client-supplied: it must point into this user's own folder,
  // and the object must really exist with an allowed type and size.
  if (!isOwnReceiptPath(receiptPath, user.id)) {
    return { error: "Çek tapılmadı. Yenidən yükləyin." };
  }

  const supabase = await createClient();

  const { data: receiptInfo, error: receiptInfoError } = await supabase.storage
    .from("payment-receipts")
    .info(receiptPath);

  if (receiptInfoError || !receiptInfo) {
    return { error: "Çek tapılmadı. Yenidən yükləyin." };
  }
  if ((receiptInfo.size ?? 0) > RECEIPT_MAX_BYTES) {
    return { error: RECEIPT_TOO_LARGE_ERROR };
  }
  if (!isReceiptMimeType(receiptInfo.contentType ?? "")) {
    return { error: RECEIPT_TYPE_ERROR };
  }

  // Read the cart straight from the server so the client cannot tamper with it.
  const { data: cartRows, error: cartError } = await supabase
    .from("cart_items")
    .select("product_id, variant_id, quantity, variant:product_variants (unit_type, unit_size)")
    .eq("customer_id", user.id);

  if (cartError) {
    console.error("[checkout.placeOrder] cart", cartError.message);
    return { error: "Səbət oxuna bilmədi." };
  }

  const cartItems: CheckoutCartItem[] = (cartRows ?? [])
    .filter((row) => row.quantity > 0)
    .map((row) => {
      const variant = row.variant as unknown as { unit_type: UnitType; unit_size: string | null } | null;
      return {
        productId: row.product_id,
        variantId: row.variant_id,
        quantity: row.quantity,
        unitType: variant?.unit_type ?? null,
        unitSize: variant?.unit_size ?? null,
      };
    });

  if (cartItems.length === 0) {
    return { error: "Səbətiniz boşdur." };
  }

  const productIds = [...new Set(cartItems.map((item) => item.productId))];

  // A farmer cannot order their own products — checked here since it's not
  // a stock concern and doesn't need to be inside the atomic order function.
  const [{ data: cartProducts }, { data: ownFarmer }] = await Promise.all([
    supabase
      .from("products")
      .select("id, farmer_id, title, unit_type, unit_size, min_order_quantity")
      .in("id", productIds),
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

  // Amounts must sit on the unit's steps and reach the farmer's minimum; a
  // cart filled before a minimum was set can still be below it.
  for (const item of cartItems) {
    const product = (cartProducts ?? []).find((row) => row.id === item.productId);
    if (!product) continue;
    // A size's own unit; a line without one counts as the product's default.
    const unit = item.unitType ?? product.unit_type;
    const size = item.unitType ? item.unitSize : product.unit_size;
    const min = minOrderQuantity(unit, product.min_order_quantity);
    if (Number(item.quantity) < min - 1e-9 || !isOnStep(unit, Number(item.quantity))) {
      const amount = formatAmount(unit, min, size);
      return {
        error: `"${product.title}" üçün minimum sifariş: ${amount}. Səbətdə miqdarı dəyişin.`,
      };
    }
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

  // Only a code that works right now is sent: checkout showed the total
  // without it otherwise, and that is the amount the customer transferred.
  const promo = await getAppliedPromo();
  const promoCode = promo && !promo.error ? promo.code : null;

  // Product validation, pricing, order/items/payment creation, and the stock
  // decrement all happen atomically inside place_order() — either everything
  // commits together or nothing does, so a stock shortfall can never leave
  // behind an order that oversold a product.
  const { data: placed, error: placeError } = await supabase.rpc(
    "place_order",
    {
      p_contact_phone: contactPhone,
      p_delivery_address_text: deliveryAddress || null,
      p_bank_id: bankId,
      p_receipt_url: receiptPath,
      p_items: cartItems.map((item) => ({
        product_id: item.productId,
        variant_id: item.variantId,
        quantity: item.quantity,
      })),
      p_promo_code: promoCode,
      p_first_name: firstName,
      p_last_name: lastName,
      p_city: city,
      p_district: district || null,
      p_note: note || null,
    }
  );

  if (placeError || !placed?.[0]) {
    // The receipt is left in place: the form keeps the same file selected
    // and re-sends this path on retry instead of uploading it again.
    console.error("[checkout.placeOrder] rpc", placeError?.message);
    return { error: describePlaceOrderError(placeError?.message ?? "") };
  }

  const { order_id: orderId, order_code: orderCode } = placed[0];

  if (promo) (await cookies()).delete(PROMO_COOKIE);

  // Clearing the cart and notifying admins don't change what the customer
  // sees next, so defer them past the response instead of making them wait
  // (Vercel's waitUntil keeps the invocation alive until these settle).
  //
  // Both use the service-role client on purpose: the cookie-bound client can
  // rotate the Supabase refresh token mid-call, and once the response is out
  // the new token can no longer be written back to the browser — which would
  // leave the visitor holding a spent token and silently signed out.
  after(async () => {
    const admin = createAdminClient();
    await admin.from("cart_items").delete().eq("customer_id", user.id);
    await notifyAdmins({
      type: "payment_received",
      title: "Yeni ödəniş + çek",
      body: `${orderCode} sifarişi üçün ödəniş çeki yoxlama gözləyir.`,
      metadata: { order_id: orderId },
    });
  });

  return { orderId };
}

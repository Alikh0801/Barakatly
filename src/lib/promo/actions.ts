"use server";

import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import {
  PROMO_CODE_PATTERN,
  PROMO_COOKIE,
  PROMO_COOKIE_MAX_AGE,
  describePromoError,
  normalizePromoCode,
} from "@/lib/promo/constants";
import { checkPromoCode } from "@/lib/promo/server";

export type PromoActionState = { error?: string };

/** Checks the code against the cart and, if it works, keeps it for checkout. */
export async function applyPromoCode(
  _prev: PromoActionState,
  formData: FormData,
): Promise<PromoActionState> {
  const user = await getSessionUser();
  if (!user) return { error: describePromoError("NOT_SIGNED_IN") };

  const code = normalizePromoCode(String(formData.get("code") ?? ""));
  if (!code) return { error: "Promokodu daxil edin." };
  if (!PROMO_CODE_PATTERN.test(code)) return { error: describePromoError("NOT_FOUND") };

  const result = await checkPromoCode(code);
  if (result.error) return { error: result.error };

  (await cookies()).set(PROMO_COOKIE, code, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: PROMO_COOKIE_MAX_AGE,
  });
  refresh();
  return {};
}

export async function removePromoCode(): Promise<void> {
  (await cookies()).delete(PROMO_COOKIE);
  refresh();
}

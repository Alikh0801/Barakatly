import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  PROMO_COOKIE,
  describePromoError,
  normalizePromoCode,
  type AppliedPromo,
} from "@/lib/promo/constants";

type CheckResult = {
  code: string | null;
  name: string | null;
  discount: number | string | null;
  error: string | null;
  min_order_amount: number | string | null;
};

/** Judges `code` against the signed-in customer's cart (see check_promo_code). */
export async function checkPromoCode(code: string): Promise<AppliedPromo> {
  const normalized = normalizePromoCode(code);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("check_promo_code", { p_code: normalized });

  if (error || !data) {
    console.error("[promo.checkPromoCode]", error?.message);
    return { code: normalized, name: null, discount: 0, error: "Promokod yoxlanıla bilmədi. Yenidən cəhd edin." };
  }

  const result = data as unknown as CheckResult;
  if (result.error) {
    return {
      code: normalized,
      name: result.name,
      discount: 0,
      error: describePromoError(result.error, result.min_order_amount === null ? null : Number(result.min_order_amount)),
    };
  }
  return { code: result.code ?? normalized, name: result.name, discount: Number(result.discount ?? 0), error: null };
}

/** The code applied in the cart, judged against the cart as it is now. */
export async function getAppliedPromo(): Promise<AppliedPromo | null> {
  const code = (await cookies()).get(PROMO_COOKIE)?.value;
  if (!code) return null;
  return checkPromoCode(code);
}

import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

/**
 * Favourites ("Sevimlilər") for the hearts on product cards.
 *
 * A plain route rather than Server Actions: actions run one at a time and a
 * revalidating one re-renders the page it was called from, so on a slow
 * connection a heart waited seconds behind other requests, and removing one
 * on /favorites waited for the whole page to render again.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

/** The product ids the visitor has hearted; `ids: null` for guests. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return json({ ids: null });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wishlist_items")
    .select("product_id")
    .eq("customer_id", user.id);

  if (error) {
    console.error("[api.wishlist.GET]", error.message);
    return json({ ids: [] });
  }
  return json({ ids: (data ?? []).map((row) => row.product_id) });
}

/** `{ productId, save }`: adds the product to favourites or removes it. */
export async function POST(request: NextRequest) {
  // Server Actions check this themselves; a route has to.
  if (!sameOrigin(request)) return json({ error: "Forbidden" }, 403);

  const user = await getSessionUser();
  if (!user) return json({ error: "Daxil olun." }, 401);

  const body = (await request.json().catch(() => null)) as {
    productId?: unknown;
    save?: unknown;
  } | null;
  const productId = typeof body?.productId === "string" ? body.productId : "";
  if (!UUID.test(productId) || typeof body?.save !== "boolean") {
    return json({ error: "Məhsul tapılmadı." }, 400);
  }

  const supabase = await createClient();
  const { error } = body.save
    ? await supabase
        .from("wishlist_items")
        .upsert(
          { customer_id: user.id, product_id: productId },
          { onConflict: "customer_id,product_id", ignoreDuplicates: true },
        )
    : await supabase
        .from("wishlist_items")
        .delete()
        .eq("customer_id", user.id)
        .eq("product_id", productId);

  if (error) {
    console.error("[api.wishlist.POST]", error.message);
    return json({ error: "Sevimlilər yenilənmədi." }, 500);
  }

  revalidatePath("/favorites");
  return json({ saved: body.save });
}

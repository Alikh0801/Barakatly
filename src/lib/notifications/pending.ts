import { isActionNeededNotification } from "@/lib/orders/labels";
import { createClient } from "@/lib/supabase/server";
import type { Notification } from "@/types";

function metadataString(
  metadata: Notification["metadata"],
  key: string,
): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * Which of the given action-needed notifications still point at something
 * genuinely awaiting admin review right now — as opposed to "unread", which
 * only tracks whether the admin has looked at it. A notification stays red
 * on /notifications until the underlying farmer/product/category/payment is
 * actually resolved in the admin panel, no matter how many times it's been
 * marked read.
 */
export async function resolvePendingActionNotificationIds(
  notifications: Notification[],
): Promise<Set<string>> {
  const actionable = notifications.filter((n) =>
    isActionNeededNotification(n.type),
  );
  if (actionable.length === 0) return new Set();

  const supabase = await createClient();
  const pending = new Set<string>();

  // farmer_registration: metadata carries either farmer_id or
  // farmer_profile_id depending on the signup path that created it.
  const farmerRegistration = actionable.filter(
    (n) => n.type === "farmer_registration",
  );
  if (farmerRegistration.length > 0) {
    const farmerIds = new Set<string>();
    const profileIds = new Set<string>();
    for (const n of farmerRegistration) {
      const farmerId = metadataString(n.metadata, "farmer_id");
      const profileId = metadataString(n.metadata, "farmer_profile_id");
      if (farmerId) farmerIds.add(farmerId);
      if (profileId) profileIds.add(profileId);
    }

    const ids = [...farmerIds, ...profileIds];
    if (ids.length > 0) {
      const { data } = await supabase
        .from("farmers")
        .select("id, profile_id, status")
        .or(`id.in.(${ids.join(",")}),profile_id.in.(${ids.join(",")})`);

      const pendingFarmerIds = new Set(
        (data ?? []).filter((f) => f.status === "pending").map((f) => f.id),
      );
      const pendingProfileIds = new Set(
        (data ?? [])
          .filter((f) => f.status === "pending")
          .map((f) => f.profile_id),
      );

      for (const n of farmerRegistration) {
        const farmerId = metadataString(n.metadata, "farmer_id");
        const profileId = metadataString(n.metadata, "farmer_profile_id");
        if (
          (farmerId && pendingFarmerIds.has(farmerId)) ||
          (profileId && pendingProfileIds.has(profileId))
        ) {
          pending.add(n.id);
        }
      }
    }
  }

  // farmer_profile_update: still pending while the edit hasn't been
  // approved/rejected (pending_submitted_at cleared either way).
  const profileUpdates = actionable.filter(
    (n) => n.type === "farmer_profile_update",
  );
  if (profileUpdates.length > 0) {
    const farmerIds = [
      ...new Set(
        profileUpdates
          .map((n) => metadataString(n.metadata, "farmer_id"))
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    if (farmerIds.length > 0) {
      const { data } = await supabase
        .from("farmers")
        .select("id, pending_submitted_at")
        .in("id", farmerIds);

      const stillPending = new Set(
        (data ?? [])
          .filter((f) => f.pending_submitted_at !== null)
          .map((f) => f.id),
      );

      for (const n of profileUpdates) {
        const farmerId = metadataString(n.metadata, "farmer_id");
        if (farmerId && stillPending.has(farmerId)) pending.add(n.id);
      }
    }
  }

  // product_submission: still pending while status stays "pending".
  const productSubmissions = actionable.filter(
    (n) => n.type === "product_submission",
  );
  if (productSubmissions.length > 0) {
    const productIds = [
      ...new Set(
        productSubmissions
          .map((n) => metadataString(n.metadata, "product_id"))
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    if (productIds.length > 0) {
      const { data } = await supabase
        .from("products")
        .select("id, status")
        .in("id", productIds);

      const stillPending = new Set(
        (data ?? []).filter((p) => p.status === "pending").map((p) => p.id),
      );

      for (const n of productSubmissions) {
        const productId = metadataString(n.metadata, "product_id");
        if (productId && stillPending.has(productId)) pending.add(n.id);
      }
    }
  }

  // category_submission: still pending while the category and/or
  // subcategory it references hasn't been approved yet.
  const categorySubmissions = actionable.filter(
    (n) => n.type === "category_submission",
  );
  if (categorySubmissions.length > 0) {
    const categoryIds = [
      ...new Set(
        categorySubmissions
          .map((n) => metadataString(n.metadata, "category_id"))
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const subcategoryIds = [
      ...new Set(
        categorySubmissions
          .map((n) => metadataString(n.metadata, "subcategory_id"))
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const [categoriesResult, subcategoriesResult] = await Promise.all([
      categoryIds.length > 0
        ? supabase.from("categories").select("id, approved").in("id", categoryIds)
        : Promise.resolve({ data: [] }),
      subcategoryIds.length > 0
        ? supabase
            .from("subcategories")
            .select("id, approved")
            .in("id", subcategoryIds)
        : Promise.resolve({ data: [] }),
    ]);

    const unapprovedCategoryIds = new Set(
      (categoriesResult.data ?? [])
        .filter((c) => !c.approved)
        .map((c) => c.id),
    );
    const unapprovedSubcategoryIds = new Set(
      (subcategoriesResult.data ?? [])
        .filter((s) => !s.approved)
        .map((s) => s.id),
    );

    for (const n of categorySubmissions) {
      const categoryId = metadataString(n.metadata, "category_id");
      const subcategoryId = metadataString(n.metadata, "subcategory_id");
      if (
        (categoryId && unapprovedCategoryIds.has(categoryId)) ||
        (subcategoryId && unapprovedSubcategoryIds.has(subcategoryId))
      ) {
        pending.add(n.id);
      }
    }
  }

  // payment_received: still pending while the order's payment hasn't been
  // confirmed or rejected.
  const paymentNotifications = actionable.filter(
    (n) => n.type === "payment_received",
  );
  if (paymentNotifications.length > 0) {
    const orderIds = [
      ...new Set(
        paymentNotifications
          .map((n) => metadataString(n.metadata, "order_id"))
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    if (orderIds.length > 0) {
      const { data } = await supabase
        .from("payments")
        .select("order_id, status")
        .in("order_id", orderIds);

      const stillPending = new Set(
        (data ?? [])
          .filter((p) => p.status === "pending")
          .map((p) => p.order_id),
      );

      for (const n of paymentNotifications) {
        const orderId = metadataString(n.metadata, "order_id");
        if (orderId && stillPending.has(orderId)) pending.add(n.id);
      }
    }
  }

  return pending;
}

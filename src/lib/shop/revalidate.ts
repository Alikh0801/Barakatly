import { revalidatePath, updateTag } from "next/cache";

/** Invalidate public catalog caches after product create/approve/reject/update. */
export function revalidateProductCatalog(productId?: string) {
  updateTag("products");
  updateTag("farmers");
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/farmers");

  if (productId) {
    updateTag(`product-${productId}`);
    revalidatePath(`/shop/${productId}`);
  }
}

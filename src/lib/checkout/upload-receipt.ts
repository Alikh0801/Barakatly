import {
  RECEIPT_EXTENSIONS,
  RECEIPT_MAX_BYTES,
  RECEIPT_TOO_LARGE_ERROR,
  RECEIPT_TYPE_ERROR,
  isReceiptMimeType,
} from "@/lib/checkout/constants";
import { createClient } from "@/lib/supabase/client";

/** Client-side mirror of the server's receipt checks, for instant feedback. */
export function validateReceiptFile(file: File | null): string | null {
  if (!file || file.size === 0) return "Ödəniş çekini yükləyin.";
  if (file.size > RECEIPT_MAX_BYTES) return RECEIPT_TOO_LARGE_ERROR;
  if (!isReceiptMimeType(file.type)) return RECEIPT_TYPE_ERROR;
  return null;
}

/**
 * Uploads the receipt from the browser into the customer's own folder of
 * the payment-receipts bucket and returns its path. Going direct to Storage
 * keeps the file out of the Server Action request, whose body Vercel caps
 * at ~4.5 MB regardless of Next's bodySizeLimit.
 */
export async function uploadReceipt(
  file: File,
  userId: string,
): Promise<{ path: string } | { error: string }> {
  const invalid = validateReceiptFile(file);
  if (invalid) return { error: invalid };

  const extension = isReceiptMimeType(file.type)
    ? RECEIPT_EXTENSIONS[file.type]
    : "bin";
  const path = `${userId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const { error } = await createClient()
    .storage.from("payment-receipts")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    console.error("[checkout.uploadReceipt]", error.message);
    // Storage enforces the bucket's own size limit as a last line.
    if (/exceed|too large|payload/i.test(error.message)) {
      return { error: RECEIPT_TOO_LARGE_ERROR };
    }
    return { error: "Çek yüklənmədi. Yenidən cəhd edin." };
  }

  return { path };
}

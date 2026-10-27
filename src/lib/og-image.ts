import { getOgImage } from "@/lib/content/queries";

const OG_IMAGE_ALT = "Barakatly: fermerdən birbaşa süfrənizə";

/**
 * The link preview (WhatsApp, Telegram, Facebook) for pages without a
 * picture of their own: the one set in the admin panel (/admin/hero), else
 * the bundled card with the logo and the motto.
 */
export async function getDefaultOgImage() {
  const image = await getOgImage();
  return { url: image.imageUrl, width: image.width, height: image.height, alt: OG_IMAGE_ALT };
}

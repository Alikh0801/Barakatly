import { Playfair_Display } from "next/font/google";

/**
 * Serif display face for section titles. latin-ext carries ə/Ə, which most
 * Azerbaijani headings use. Farmer names use the plain site font.
 */
export const displaySerif = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  weight: ["700"],
  display: "swap",
});

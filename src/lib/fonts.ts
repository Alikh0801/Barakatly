import { Playfair_Display } from "next/font/google";

/**
 * Serif display face for farmer names and section titles. latin-ext carries
 * ə/Ə, which most Azerbaijani names and headings use.
 */
export const displaySerif = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  weight: ["700"],
  display: "swap",
});

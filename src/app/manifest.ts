import type { MetadataRoute } from "next";
import { IS_PRE } from "@/lib/env";

/**
 * The web app manifest: what the phone needs to install Barakatly as an
 * app (name, icons, full screen). The icons are made from public/logo.
 * The test site installs under its own name, so the two are never mixed
 * up on one phone.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: IS_PRE ? "Barakatly TEST" : "Barakatly",
    short_name: IS_PRE ? "Barakatly T" : "Barakatly",
    description: "Fermerdən birbaşa süfrənizə: təzə və təbii kənd məhsulları.",
    lang: "az",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fbf7ef",
    theme_color: "#fbf7ef",
    icons: [
      { src: "/app-icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/app-icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/app-icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

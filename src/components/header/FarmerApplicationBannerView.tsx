"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FARMER_APPLICATION_PATH } from "@/lib/farmer/application-path";

export function FarmerApplicationBannerView({ rejected, text }: { rejected: boolean; text: string }) {
  // The application page says it in full already.
  if (usePathname() === FARMER_APPLICATION_PATH) return null;

  return (
    <Link
      href={FARMER_APPLICATION_PATH}
      className={`block px-4 py-2 text-center text-sm font-medium ${
        rejected ? "bg-rose-100 text-rose-900 hover:bg-rose-200" : "bg-amber-100 text-amber-900 hover:bg-amber-200"
      }`}
    >
      {text}
      <span className="ml-2 underline underline-offset-2">Ətraflı</span>
    </Link>
  );
}

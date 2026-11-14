"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The installed app's switch between a panel's pages (the courier's
 * "Növbə" and "Tarixçə"), drawn as the design's pills. The website keeps
 * its links in the portal header. App only.
 */
export function AppPortalNav({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Bölmələr" data-app-screen className="hidden gap-2 px-6 pb-1 font-app app:flex">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            data-static-hover
            aria-current={active ? "page" : undefined}
            className={`rounded-2xl px-4 py-2 text-[13px] ${
              active ? "bg-app-green font-bold text-white" : "bg-[#f3eee2] font-medium text-app-ink"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

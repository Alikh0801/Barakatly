"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  CircleXIcon,
  HouseIcon,
  ReceiptIcon,
  SearchIcon,
  ShoppingBagIcon,
  UserIcon,
} from "@/components/app/icons";

/**
 * The bottom tab bar of the installed app (Figma: "bottom-navigation").
 * It exists only there: the `app:` variant shows it when the site runs
 * from the home screen (display-mode: standalone); in a browser tab it
 * stays hidden and the site looks as it always has.
 *
 * Which tabs, and on which pages, follows the design: the customer's five
 * on the shop's browsing pages, the farmer's four on their panel. Pages the
 * design draws without it (a product, checkout, an order, sign-in) get
 * none.
 */

type Tab = {
  href: string;
  label: string;
  Icon: (props: { className?: string }) => React.ReactNode;
  active: boolean;
};

function customerTabs(pathname: string): Tab[] {
  return [
    { href: "/", label: "Ana səhifə", Icon: HouseIcon, active: pathname === "/" || pathname === "/shop" },
    { href: "/search", label: "Axtarış", Icon: SearchIcon, active: pathname === "/search" },
    { href: "/cart", label: "Səbət", Icon: ShoppingBagIcon, active: pathname === "/cart" },
    { href: "/orders", label: "Sifarişlər", Icon: ReceiptIcon, active: pathname === "/orders" },
    {
      href: "/account",
      label: "Profil",
      Icon: UserIcon,
      active: pathname === "/account" || pathname === "/favorites" || pathname === "/notifications",
    },
  ];
}

function farmerTabs(pathname: string, tab: string | null): Tab[] {
  const onProfile = pathname === "/farmer" && tab === "about";
  return [
    { href: "/farmer", label: "Panel", Icon: HouseIcon, active: pathname === "/farmer" && !onProfile },
    { href: "/farmer/products", label: "Məhsullar", Icon: CircleXIcon, active: pathname === "/farmer/products" },
    { href: "/farmer/orders", label: "Sifarişlər", Icon: ShoppingBagIcon, active: pathname === "/farmer/orders" },
    { href: "/farmer?tab=about", label: "Profil", Icon: UserIcon, active: onProfile },
  ];
}

// The cart has the bar while empty; a full cart hides it (data-hide-tabbar).
const CUSTOMER_PAGES = ["/", "/shop", "/farmers", "/search", "/cart", "/orders", "/account", "/favorites", "/notifications"];
const FARMER_PAGES = ["/farmer", "/farmer/products", "/farmer/orders"];

function tabsFor(pathname: string, tab: string | null): Tab[] | null {
  if (FARMER_PAGES.includes(pathname)) return farmerTabs(pathname, tab);
  // A farmer's public page has the bar too; a product page does not.
  if (CUSTOMER_PAGES.includes(pathname) || /^\/farmers\/[^/]+$/.test(pathname)) {
    return customerTabs(pathname);
  }
  return null;
}

export function AppTabBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabs = tabsFor(pathname, searchParams.get("tab"));
  if (!tabs) return null;

  return (
    <>
      {/* Keeps the page's last lines clear of the fixed bar. */}
      <div aria-hidden="true" data-app-tabbar-spacer className="app-tabbar-height hidden shrink-0 app:block" />
      <nav
        aria-label="Əsas menyu"
        data-app-tabbar
        className="app-tabbar-height fixed inset-x-0 bottom-0 z-50 hidden border-t border-[#ece4d3] bg-white px-4 pt-3 app:flex"
      >
        <ul className="mx-auto flex w-full max-w-md items-start justify-between">
          {tabs.map(({ href, label, Icon, active }) => (
            <li key={href} className="w-[70px]">
              <Link
                href={href}
                data-static-hover
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 font-app text-[11px] font-semibold ${
                  active ? "text-app-green" : "text-app-muted"
                }`}
              >
                <Icon className="h-6 w-6" />
                <span className="w-full truncate text-center">{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}

import Link from "next/link";
import {
  BellIcon,
  ChevronRightIcon,
  HeartIcon,
  LogOutIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  StoreIcon,
  TruckIcon,
} from "@/components/app/icons";
import type { Profile } from "@/types";

/**
 * The installed app's profile (Figma "customer-profile"): who is signed in
 * and a menu of their places. The profile form below it is the website's,
 * styled for the app. App only.
 */

type Row = { href: string; label: string; Icon: AppMenuRow["Icon"] };

/** A row of an app menu: a link, or a button for a section shown in place. */
export type AppMenuRow = {
  label: string;
  Icon: (props: { className?: string }) => React.ReactNode;
} & ({ href: string; onClick?: never } | { onClick: () => void; href?: never });

/** The design's menu list: white, rounded, a round icon and a chevron per row. */
export function AppMenu({ rows, className = "" }: { rows: AppMenuRow[]; className?: string }) {
  const rowClass = "flex w-full items-center gap-3 px-4 py-3.5 text-left text-[15px] font-semibold";
  return (
    <ul className={`divide-y divide-app-line overflow-hidden rounded-[20px] bg-white ${className}`}>
      {rows.map((row) => {
        const content = (
          <>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f3eee2] text-app-green">
              <row.Icon className="h-[18px] w-[18px]" />
            </span>
            <span className="flex-1">{row.label}</span>
            <ChevronRightIcon className="h-4 w-4 text-app-muted" />
          </>
        );
        return (
          <li key={row.label}>
            {row.href ? (
              <Link href={row.href} data-static-hover className={rowClass}>
                {content}
              </Link>
            ) : (
              <button type="button" onClick={row.onClick} data-static-hover className={rowClass}>
                {content}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function rowsFor(role: Profile["role"]): Row[] {
  const rows: Row[] = [
    { href: "/orders", label: "Sifarişlərim", Icon: ReceiptIcon },
    { href: "/favorites", label: "Sevimlilər", Icon: HeartIcon },
    { href: "/notifications", label: "Bildirişlər", Icon: BellIcon },
  ];
  if (role === "farmer") rows.push({ href: "/farmer", label: "Fermer paneli", Icon: StoreIcon });
  else if (role === "courier") rows.push({ href: "/courier", label: "Kuryer paneli", Icon: TruckIcon });
  else if (role === "admin") rows.push({ href: "/admin", label: "Admin paneli", Icon: ShieldCheckIcon });
  else rows.push({ href: "/farmers/apply", label: "Fermer ol", Icon: StoreIcon });
  return rows;
}

export function AppAccountSummary({
  profile,
  initials,
  displayName,
  roleLabel,
}: {
  profile: Profile;
  initials: string;
  displayName: string;
  roleLabel: string;
}) {
  return (
    <div data-app-screen className="hidden font-app text-app-ink app:block">
      <h1 className="font-app-display text-[22px] font-bold">Profil</h1>
      <div className="mt-4 flex items-center gap-4 rounded-[20px] bg-white p-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-app-green text-lg font-bold text-white">
          {initials}
        </span>
        <div className="min-w-0">
          <p className="truncate font-app-display text-lg font-bold">{displayName}</p>
          {profile.email ? <p className="truncate text-sm text-app-muted">{profile.email}</p> : null}
          <span className="mt-1 inline-flex rounded-lg bg-[#e9f1e2] px-2 py-0.5 text-xs font-semibold text-[#3b7a2c]">{roleLabel}</span>
        </div>
      </div>
      <AppMenu rows={rowsFor(profile.role)} className="mt-4" />
      <h2 className="mt-6 font-app-display text-lg font-bold">Profil məlumatları</h2>
    </div>
  );
}

export function AppSignOut() {
  return (
    <form action="/auth/signout" method="post" className="mt-4 hidden app:block">
      <button
        type="submit"
        data-static-hover
        className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#f3eee2] font-app text-[15px] font-bold text-rose-700"
      >
        <LogOutIcon className="h-5 w-5" />
        Çıxış
      </button>
    </form>
  );
}

import Image from "next/image";
import Link from "next/link";
import { SiteLogo } from "@/components/SiteLogo";

/**
 * The top of the farmer's panel in the installed app (Figma
 * "farmer-dashboard"), as on the home screen: the site logo, "Xoş
 * gəldiniz" and the farmer's first name, their picture on the right.
 * App only.
 */
export function AppFarmerGreeting({
  fullName,
  avatarUrl,
}: {
  fullName: string | null;
  avatarUrl: string | null;
}) {
  const name = fullName?.trim().split(/\s+/)[0] || "Fermer";

  return (
    <header data-app-screen className="hidden items-center gap-3 px-6 py-4 font-app text-app-ink app:flex">
      <Link href="/" aria-label="Barakatly" className="shrink-0">
        <SiteLogo size={44} className="h-11 w-11 rounded-full object-cover" />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-app-muted">Xoş gəldiniz</p>
        <p className="truncate font-app-display text-[22px] font-bold leading-tight">{name}</p>
      </div>
      <Link
        href="/farmer?tab=about"
        aria-label="Profil"
        className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-app-green text-base font-bold text-white"
      >
        {avatarUrl ? (
          <Image src={avatarUrl} alt="" fill sizes="44px" className="object-cover" />
        ) : (
          name.slice(0, 1).toUpperCase()
        )}
      </Link>
    </header>
  );
}

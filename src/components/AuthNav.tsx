import Link from "next/link";
import { ProfileMenu } from "@/components/auth/ProfileMenu";
import { getProfile } from "@/lib/auth/session";

function getInitials(name: string | null | undefined, email: string | null | undefined) {
  if (name) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }

  if (email) {
    return email.slice(0, 2).toUpperCase();
  }

  return "??";
}

export async function AuthNav({
  variant = "hero",
}: {
  variant?: "hero" | "solid" | "adaptive";
}) {
  const profile = await getProfile();

  if (!profile) {
    const signInClass =
      variant === "adaptive"
        ? "ml-1 inline-flex h-9 items-center rounded-full bg-white px-4 text-sm font-semibold text-zinc-950 shadow-sm transition hover:bg-white/90 group-data-[scrolled=true]/header:bg-emerald-600 group-data-[scrolled=true]/header:text-white group-data-[scrolled=true]/header:shadow-none group-data-[scrolled=true]/header:hover:bg-emerald-500"
        : variant === "hero"
          ? "ml-1 inline-flex h-9 items-center rounded-full bg-white px-4 text-sm font-semibold text-zinc-950 shadow-sm transition hover:bg-white/90"
          : "ml-1 inline-flex h-9 items-center rounded-full bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-500";

    return (
      <Link href="/signin" className={signInClass}>
        Daxil ol
      </Link>
    );
  }

  return (
    <ProfileMenu
      variant={variant}
      fullName={profile.full_name}
      email={profile.email}
      role={profile.role}
      initials={getInitials(profile.full_name, profile.email)}
    />
  );
}

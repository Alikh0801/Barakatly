import Link from "next/link";
import { getProfile } from "@/lib/auth/session";

function getInitials(name: string | null | undefined, email: string | null | undefined) {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  if (email) {
    return email.slice(0, 2).toUpperCase();
  }

  return "??";
}

export async function AuthNav() {
  const profile = await getProfile();

  if (!profile) {
    return (
      <Link
        href="/signin"
        className="ml-1 inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-950 shadow-sm ring-1 ring-white/20 transition hover:bg-white/90"
      >
        Daxil ol
      </Link>
    );
  }

  const displayName = profile.full_name ?? profile.email ?? "Hesab";
  const initials = getInitials(profile.full_name, profile.email);

  return (
    <div className="ml-1 flex items-center gap-2">
      <Link
        href="/account"
        className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white ring-1 ring-white/15 backdrop-blur-sm transition hover:bg-white/15"
        title={displayName}
      >
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-semibold text-white">
          {initials}
        </span>
        <span className="hidden max-w-[120px] truncate sm:inline">
          {displayName.split(" ")[0]}
        </span>
      </Link>
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="inline-flex items-center rounded-full bg-white px-3 py-2 text-sm font-semibold text-zinc-950 shadow-sm ring-1 ring-white/20 transition hover:bg-white/90"
        >
          Çıxış
        </button>
      </form>
    </div>
  );
}

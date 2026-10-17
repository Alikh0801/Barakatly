import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";
import { AccountProfileForm } from "@/components/account/AccountProfileForm";

export const metadata = {
  title: "Hesabım",
  robots: { index: false, follow: false },
};

function roleLabel(role: string): string {
  switch (role) {
    case "farmer":
      return "Fermer";
    case "courier":
      return "Kuryer";
    case "admin":
      return "Admin";
    default:
      return "Müştəri";
  }
}

function initialsFrom(name: string | null, email: string | null): string {
  const source = (name?.trim() || email || "").trim();
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export default async function AccountPage() {
  const profile = await getProfile();

  if (!profile) {
    redirect("/signin");
  }

  const displayName = profile.full_name?.trim() || profile.email || "Hesab";
  const initials = initialsFrom(profile.full_name, profile.email);
  const role = roleLabel(profile.role);

  return (
    <div className="flex min-h-screen min-h-dvh flex-col bg-[#faf9f5]">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center px-4 py-4 md:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-semibold tracking-tight text-emerald-800"
          >
            <Image
              src="/logo/logo.png"
              alt="Barakatly"
              width={32}
              height={32}
              className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-black/5"
            />
            Barakatly
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 py-10 md:px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Hesabım
        </h1>
        <div className="mt-1 flex items-end justify-between gap-4">
          <p className="min-w-0 text-sm text-zinc-500">
            Profil məlumatlarınızı görün və redaktə edin
          </p>
          <Link
            href="/"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="h-4 w-4 self-center">
              <path d="M12.5 15 7.5 10l5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Sayta qayıt
          </Link>
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-zinc-200">
          <div className="flex items-center gap-4 border-b border-zinc-100 bg-[linear-gradient(180deg,#f2faf3_0%,#ffffff_100%)] px-6 py-5">
            <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-lg font-semibold text-white ring-4 ring-emerald-100">
              {initials}
            </span>
            <div className="min-w-0">
              <div className="truncate text-lg font-semibold text-zinc-900">
                {displayName}
              </div>
              <div className="mt-1 inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-100">
                {role}
              </div>
            </div>
          </div>

          <div className="px-6 py-6">
            <AccountProfileForm
              fullName={profile.full_name ?? ""}
              phone={profile.phone ?? ""}
              email={profile.email ?? "—"}
              roleLabel={role}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

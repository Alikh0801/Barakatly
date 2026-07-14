import Link from "next/link";
import { getProfile } from "@/lib/auth/session";

export async function PortalShell({
  title,
  children,
  links,
}: {
  title: string;
  children: React.ReactNode;
  links: { href: string; label: string }[];
}) {
  const profile = await getProfile();

  return (
    <div className="flex min-h-screen flex-col bg-[#faf9f5]">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-semibold tracking-tight text-emerald-800"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white">
              🌿
            </span>
            {title}
          </Link>
          <nav className="flex flex-wrap items-center gap-3 text-sm font-medium">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-zinc-600 hover:text-zinc-900"
              >
                {link.label}
              </Link>
            ))}
            {profile ? (
              <Link href="/account" className="text-zinc-600 hover:text-zinc-900">
                Hesab
              </Link>
            ) : null}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}

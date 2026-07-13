import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";

export const metadata = {
  title: "Hesabım — BARAKATLY",
};

export default async function AccountPage() {
  const profile = await getProfile();

  if (!profile) {
    redirect("/signin");
  }

  return (
    <div className="flex min-h-screen min-h-dvh flex-col bg-[#faf9f5]">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-semibold tracking-tight text-emerald-800"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white">
              🌿
            </span>
            Barakatly
          </Link>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-100"
            >
              Çıxış
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 py-12 md:px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Hesabım
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Profil məlumatlarınız və sifarişləriniz
        </p>

        <div className="mt-8 space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Ad
            </div>
            <div className="mt-1 text-sm text-zinc-900">
              {profile.full_name ?? "—"}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Email
            </div>
            <div className="mt-1 text-sm text-zinc-900">
              {profile.email ?? "—"}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Rol
            </div>
            <div className="mt-1 text-sm capitalize text-zinc-900">
              {profile.role === "customer" ? "Müştəri" : profile.role}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Link
            href="/orders"
            className="inline-flex items-center rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            Sifarişlərim
          </Link>
        </div>
      </main>
    </div>
  );
}

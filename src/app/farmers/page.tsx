import Link from "next/link";
import type { Metadata } from "next";
import { FarmerCard } from "@/components/farmers/FarmerCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { getSessionUser } from "@/lib/auth/session";
import { getFollowedFarmerIds, getPublicFarmersWithRatings } from "@/lib/farmers/queries";

export const metadata: Metadata = {
  title: "Fermerlər",
  description:
    "Barakatly platformasında təsdiqlənmiş yerli fermerlər.",
};

function ViewTab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      prefetch
      data-static-hover
      aria-current={active ? "page" : undefined}
      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
        active
          ? "bg-emerald-600 text-white"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
      }`}
    >
      {children}
    </Link>
  );
}

export default async function FarmersPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const [{ view }, allFarmers, user] = await Promise.all([
    searchParams,
    getPublicFarmersWithRatings(),
    getSessionUser(),
  ]);
  const followedIds = user ? await getFollowedFarmerIds(user.id) : new Set<string>();
  const followedCount = allFarmers.filter((farmer) => followedIds.has(farmer.id)).length;
  // Only signed-in visitors can follow, so only they get the second view.
  const showFollowing = Boolean(user) && view === "following";
  const farmers = showFollowing
    ? allFarmers.filter((farmer) => followedIds.has(farmer.id))
    : allFarmers;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-12">
      <PageHeader
        title="Fermerlər"
        description="Fermer profilləri · məhsullar və paylaşımlar"
        action={
          <Link
            href="/farmers/apply"
            className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            Fermer ol
          </Link>
        }
      />

      {user ? (
        <nav
          aria-label="Fermer siyahısı"
          className="mt-8 inline-flex rounded-full bg-white p-1 shadow-sm ring-1 ring-zinc-200"
        >
          <ViewTab href="/farmers" active={!showFollowing}>
            Bütün fermerlər
          </ViewTab>
          <ViewTab href="/farmers?view=following" active={showFollowing}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="h-4 w-4">
              <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" strokeLinejoin="round" />
            </svg>
            İzlədiklərim
            <span
              className={`rounded-full px-1.5 text-xs ${
                showFollowing ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-600"
              }`}
            >
              {followedCount}
            </span>
          </ViewTab>
        </nav>
      ) : null}

      {farmers.length === 0 ? (
        showFollowing ? (
          <div className="mt-8 max-w-xl rounded-[1.5rem] bg-white px-6 py-10 text-center shadow-sm ring-1 ring-zinc-200">
            <p className="text-base font-semibold text-zinc-900">
              Hələ heç bir fermeri izləmirsiniz
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Fermerin profilində “İzlə” düyməsinə basın, o burada görünəcək.
            </p>
            <Link
              href="/farmers"
              className="mt-5 inline-flex rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              Fermerlərə bax
            </Link>
          </div>
        ) : (
          <div className="mt-12 max-w-xl">
            <p className="text-sm leading-6 text-zinc-600">
              Hazırda siyahıda göstəriləcək təsdiqlənmiş fermer yoxdur.
            </p>
          </div>
        )
      ) : (
        <ul className={`${user ? "mt-6" : "mt-10"} grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3`}>
          {farmers.map((farmer) => (
            <li key={farmer.id} className="min-w-0">
              <FarmerCard
                farmer={farmer}
                following={followedIds.has(farmer.id)}
                headingLevel="h2"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";
import { SiteLogo } from "@/components/SiteLogo";
import { UserIcon } from "@/components/app/icons";
import { getProfile } from "@/lib/auth/session";
import { getHeroContent } from "@/lib/content/queries";
import { getVisibleCategories } from "@/lib/shop/queries";

/**
 * The installed app's home screen (Figma "home", 2:79): a greeting, the
 * season banner and the categories. Rendered next to the website's home
 * page and shown only in the app (`app:`); the website hides itself there.
 *
 * The banner's text is the hero text the admin edits on /admin/hero. Its
 * picture and the header's logo are the site logo for now; the design's
 * own mascot pictures replace them once they can be fetched from Figma.
 */

/** 3 × 3, as in the design; "Hamısına bax" leads to the rest. */
const HOME_CATEGORY_COUNT = 9;

function firstName(fullName: string | null | undefined): string | null {
  const name = fullName?.trim().split(/\s+/)[0];
  return name || null;
}

export async function AppHome() {
  const [profile, hero, categories] = await Promise.all([
    getProfile(),
    getHeroContent(),
    getVisibleCategories(),
  ]);
  const name = firstName(profile?.full_name);

  return (
    <div data-app-screen className="hidden min-h-dvh font-app text-app-ink app:block">
      <header className="flex items-center gap-3 px-6 py-4">
        <Link href="/" aria-label="Barakatly" className="shrink-0">
          <SiteLogo size={44} className="h-11 w-11 rounded-full object-cover" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-app-muted">Xoş gəldiniz</p>
          <p className="truncate font-app-display text-[22px] font-bold leading-tight">
            {name ?? "Barakatly"}
          </p>
        </div>
        <Link
          href={profile ? "/account" : "/signin"}
          aria-label={profile ? "Profil" : "Daxil ol"}
          className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-app-green text-base font-bold text-white"
        >
          {profile ? (name?.slice(0, 1).toUpperCase() ?? <UserIcon className="h-5 w-5" />) : <UserIcon className="h-5 w-5" />}
        </Link>
      </header>

      <div className="px-6 pb-6">
        <Link
          href="/shop"
          data-static-hover
          className="relative flex h-40 flex-col justify-between overflow-hidden rounded-3xl bg-app-sun p-5"
        >
          <span className="self-start rounded-lg bg-app-green px-2.5 py-1 text-[11px] font-bold">
            MÖVSÜMÜN SÖHFƏTİ
          </span>
          <span className="relative z-10 flex w-[210px] max-w-[60%] flex-col gap-1">
            <span className="line-clamp-2 font-app-display text-xl font-bold leading-tight">
              {hero.title} {hero.items.highlight}
            </span>
            <span className="line-clamp-2 text-[13px] leading-snug">{hero.body}</span>
          </span>
          <span className="absolute top-4 right-3.5 h-32 w-32">
            <SiteLogo size={128} className="h-32 w-32 rounded-full object-cover" />
          </span>
        </Link>
      </div>

      {categories.length > 0 ? (
        <section className="flex flex-col gap-4 px-6 pb-6">
          <div className="flex items-center justify-between">
            <h2 className="font-app-display text-lg font-bold">Kateqoriyalar</h2>
            <Link href="/shop" className="text-sm font-semibold text-app-green">
              Hamısına bax →
            </Link>
          </div>
          <ul className="grid grid-cols-3 gap-3">
            {categories.slice(0, HOME_CATEGORY_COUNT).map((category) => (
              <li key={category.id}>
                <Link
                  href={`/shop?category=${category.slug}`}
                  className="flex h-[104px] flex-col items-center justify-center gap-2 rounded-2xl bg-white p-3"
                >
                  {category.image_url ? (
                    <Image
                      src={category.image_url}
                      alt=""
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-xl object-cover"
                    />
                  ) : (
                    <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-xl bg-app-bg text-2xl">
                      {category.icon ?? "🌿"}
                    </span>
                  )}
                  <span className="w-full truncate text-center text-xs font-bold">{category.name_az}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

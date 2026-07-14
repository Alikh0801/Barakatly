import Link from "next/link";

const SHOP_LINKS = [
  { href: "/shop?category=vegetables", label: "Tərəvəzlər" },
  { href: "/shop?category=fruits", label: "Meyvələr" },
  { href: "/shop?category=dairy", label: "Süd məhsulları" },
  { href: "/shop?category=honey", label: "Bal" },
  { href: "/shop", label: "Bütün məhsullar" },
] as const;

const COMPANY_LINKS = [
  { href: "/about", label: "Haqqımızda" },
  { href: "/about#mission", label: "Missiyamız" },
  { href: "/blog", label: "Bloq" },
  { href: "/careers", label: "Karyera" },
  { href: "/press", label: "Mətbuat" },
] as const;

const SUPPORT_LINKS = [
  { href: "/help", label: "Kömək mərkəzi" },
  { href: "/contact", label: "Əlaqə" },
  { href: "/returns", label: "Qaytarma" },
  { href: "/track", label: "Sifarişi izlə" },
  { href: "/privacy", label: "Məxfilik" },
] as const;

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: ReadonlyArray<{ href: string; label: string }>;
}) {
  return (
    <div>
      <div className="text-sm font-semibold text-white">{title}</div>
      <ul className="mt-3 space-y-2 text-sm text-white/70">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-zinc-950">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 md:px-6">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-semibold tracking-tight text-white"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/90 ring-1 ring-emerald-300/40">
                <span aria-hidden="true" className="text-base">
                  🌿
                </span>
              </span>
              <span>Barakatly</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/70">
              Yerli fermerləri şüurlu istehlakçılarla birləşdiririk — təzə,
              izlənəbilən və dayanıqlı qida üçün.
            </p>

            <div className="mt-5 flex items-center gap-3 text-white/70">
              <Link
                href="#"
                aria-label="Instagram"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10 transition hover:bg-white/10"
              >
                ☐
              </Link>
              <Link
                href="#"
                aria-label="X"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10 transition hover:bg-white/10"
              >
                ☐
              </Link>
              <Link
                href="#"
                aria-label="Facebook"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10 transition hover:bg-white/10"
              >
                ☐
              </Link>
            </div>
          </div>

          <FooterColumn title="Mağaza" links={SHOP_LINKS} />
          <FooterColumn title="Şirkət" links={COMPANY_LINKS} />
          <FooterColumn title="Dəstək" links={SUPPORT_LINKS} />
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-white/50">
          © {new Date().getFullYear()} Barakatly. Bütün hüquqlar qorunur.
        </div>
      </div>
    </footer>
  );
}


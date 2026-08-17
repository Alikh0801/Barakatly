import Image from "next/image";
import Link from "next/link";

type FooterLink = {
  href: string;
  label: string;
};

const SHOP_LINKS: FooterLink[] = [
  { href: "/shop?category=vegetables", label: "Tərəvəzlər" },
  { href: "/shop?category=fruits", label: "Meyvələr" },
  { href: "/shop?category=dairy", label: "Süd məhsulları" },
  { href: "/shop?category=honey", label: "Bal" },
  { href: "/shop", label: "Bütün məhsullar" },
];

const COMPANY_LINKS: FooterLink[] = [
  { href: "/about", label: "Haqqımızda" },
  { href: "/farmers", label: "Fermerlər" },
  { href: "/about#mission", label: "Missiyamız" },
];

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: ReadonlyArray<FooterLink>;
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
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-semibold tracking-tight text-white"
            >
              <Image
                src="/logo/logo.png"
                alt="Barakatly"
                width={32}
                height={32}
                className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-black/5"
              />
              <span>Barakatly</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/70">
              Yerli fermerləri şüurlu istehlakçılarla birləşdiririk — təzə,
              izlənəbilən və dayanıqlı qida üçün.
            </p>
          </div>

          <FooterColumn title="Mağaza" links={SHOP_LINKS} />
          <FooterColumn title="Şirkət" links={COMPANY_LINKS} />
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-white/50">
          © {new Date().getFullYear()} Barakatly. Bütün hüquqlar qorunur.
        </div>
      </div>
    </footer>
  );
}

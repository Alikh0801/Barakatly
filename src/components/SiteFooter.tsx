import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { getContactContent } from "@/lib/content/queries";

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

/** "+994 50 123 45 67" -> "tel:+994501234567" */
function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

function ContactColumn({ phone, email }: { phone: string; email: string }) {
  return (
    <div>
      <div className="text-sm font-semibold text-white">Əlaqə</div>
      <ul className="mt-3 space-y-2 text-sm text-white/70">
        {phone ? (
          <li>
            <a href={telHref(phone)} className="inline-flex items-center gap-2 hover:text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="h-4 w-4 shrink-0">
                <path d="M5 4h3l1.5 4-2 1.3a11 11 0 0 0 5.2 5.2l1.3-2 4 1.5v3a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2Z" strokeLinejoin="round" />
              </svg>
              <span>{phone}</span>
            </a>
          </li>
        ) : null}
        {email ? (
          <li>
            <a href={`mailto:${email}`} className="inline-flex items-center gap-2 break-all hover:text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="h-4 w-4 shrink-0">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3.5 6.5 8.5 6 8.5-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{email}</span>
            </a>
          </li>
        ) : null}
      </ul>
    </div>
  );
}

/**
 * The footer waits for the contact details, so it streams in on its own
 * rather than holding back the page.
 */
export function SiteFooter() {
  return (
    <Suspense fallback={null}>
      <SiteFooterContent />
    </Suspense>
  );
}

async function SiteFooterContent() {
  const contact = await getContactContent();
  const hasContact = Boolean(contact.phone || contact.email);

  return (
    <footer className="bg-zinc-950">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 md:px-6">
        <div className={`grid gap-10 ${hasContact ? "sm:grid-cols-2 md:grid-cols-5" : "md:grid-cols-4"}`}>
          <div className={hasContact ? "sm:col-span-2" : "md:col-span-2"}>
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
          {hasContact ? <ContactColumn phone={contact.phone} email={contact.email} /> : null}
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-white/50">
          © {new Date().getFullYear()} Barakatly. Bütün hüquqlar qorunur.
        </div>
      </div>
    </footer>
  );
}

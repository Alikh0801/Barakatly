import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getProfile } from "@/lib/auth/session";
import { FARMER_APPLICATION_PATH, getOpenFarmerApplication } from "@/lib/farmer/application";

export const metadata: Metadata = {
  title: "Fermer müraciəti",
  robots: { index: false, follow: false },
};

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="w-24 shrink-0 text-sm text-zinc-500">{label}</dt>
      <dd className="break-words text-sm font-medium text-zinc-900">{value}</dd>
    </div>
  );
}

export default async function FarmerApplicationPage() {
  const profile = await getProfile();
  if (!profile) redirect(`/signin?next=${FARMER_APPLICATION_PATH}`);

  // Approved, suspended or never applied: the farmer panel sorts those out.
  const application = await getOpenFarmerApplication();
  if (!application) redirect("/farmer");

  const rejected = application.status === "rejected";

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-12 md:px-6 md:py-16">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 sm:p-8">
        <span
          aria-hidden="true"
          className={`inline-flex h-12 w-12 items-center justify-center rounded-full ${
            rejected ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
          }`}
        >
          {rejected ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
              <circle cx="12" cy="12" r="9" />
              <path d="m9 9 6 6M15 9l-6 6" strokeLinecap="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>

        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-zinc-900">
          {rejected ? "Müraciətiniz rədd edildi" : "Müraciətiniz qəbul edildi"}
        </h1>
        {rejected ? (
          <p className="mt-3 text-[15px] leading-7 text-zinc-600">
            {application.rejectionReason
              ? `Səbəb: ${application.rejectionReason}`
              : "Səbəb bildirişlərdə göstərilib."}
          </p>
        ) : (
          <p className="mt-3 text-[15px] leading-7 text-zinc-600">
            Fermer hesabınız admin təsdiqini gözləyir. Adətən 24 saat ərzində yoxlanılır.
            Təsdiqləndikdən sonra sizə bildiriş göndəriləcək və məhsul əlavə edə biləcəksiniz.
          </p>
        )}

        <dl className="mt-6 space-y-2.5 rounded-2xl bg-zinc-50 px-4 py-4 ring-1 ring-zinc-100">
          <Detail label="Ad" value={profile.full_name} />
          <Detail label="Email" value={profile.email} />
          <Detail label="Telefon" value={profile.phone} />
          <Detail label="Bölgə" value={application.location_text} />
        </dl>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/shop"
            className="inline-flex h-11 items-center justify-center rounded-full bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            Mağazaya keç
          </Link>
          <Link
            href="/notifications"
            className="inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-zinc-800 ring-1 ring-zinc-300 hover:bg-zinc-50"
          >
            Bildirişlər
          </Link>
        </div>
      </div>
    </div>
  );
}

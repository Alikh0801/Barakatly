import Link from "next/link";
import { SignInForm } from "@/components/auth/SignInForm";

export const metadata = {
  title: "Daxil ol — BARAKATLY",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
}) {
  const params = await searchParams;
  const linkExpired = params.error === "auth" && params.message === "link-expired";
  const next = params.next?.startsWith("/") ? params.next : undefined;

  return (
    <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 sm:p-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Daxil ol
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Hesabınıza daxil olun və sifarişlərinizi idarə edin
        </p>
      </div>

      {linkExpired ? (
        <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">
          Təsdiq linkinin vaxtı bitib və ya artıq istifadə olunub. Yenidən{" "}
          <Link href="/signup" className="font-semibold underline">
            qeydiyyatdan keçin
          </Link>
          .
        </p>
      ) : null}

      <div className={linkExpired ? "mt-5" : "mt-6"}>
        <SignInForm next={next} />
      </div>
    </div>
  );
}

import Link from "next/link";
import { APP_AUTH_CARD, APP_AUTH_TITLE } from "@/components/auth/app-styles";
import { SignInForm } from "@/components/auth/SignInForm";
import { safeNext } from "@/lib/url/safe-next";

export const metadata = {
  title: "Daxil ol",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
}) {
  const params = await searchParams;
  const linkExpired = params.error === "auth" && params.message === "link-expired";
  // Only a path on this site; "/\\evil.com" and the like are dropped.
  const next = params.next ? safeNext(params.next, "") || undefined : undefined;

  return (
    <div className={`w-full max-w-md rounded-3xl bg-white p-5 shadow-xl shadow-zinc-200/60 ring-1 ring-zinc-200/70 sm:p-8 ${APP_AUTH_CARD}`}>
      <div className="text-center">
        <h1 className={`text-2xl font-semibold tracking-tight text-zinc-900 ${APP_AUTH_TITLE}`}>
          Daxil ol
        </h1>
        <p className="mt-2 text-sm text-zinc-500 app:text-app-muted">
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

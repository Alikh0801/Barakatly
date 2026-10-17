import Link from "next/link";
import { SetNewPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { getSessionUser } from "@/lib/auth/session";

export const metadata = {
  title: "Yeni şifrə",
};

/** Where the link in the reset email lands, already signed in by /auth/callback. */
export default async function ResetPasswordPage() {
  const user = await getSessionUser();

  return (
    <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-xl shadow-zinc-200/60 ring-1 ring-zinc-200/70 sm:p-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Yeni şifrə
        </h1>
        {user?.email ? (
          <p className="mt-2 text-sm text-zinc-500">{user.email}</p>
        ) : null}
      </div>

      <div className="mt-6">
        {user ? (
          <SetNewPasswordForm />
        ) : (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">
            Linkin vaxtı bitib və ya artıq istifadə olunub.{" "}
            <Link href="/forgot-password" className="font-semibold underline">
              Yeni kod istəyin
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}

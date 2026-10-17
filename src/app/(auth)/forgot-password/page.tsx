import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata = {
  title: "Şifrəni bərpa et",
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const linkExpired = params.error === "link-expired";

  return (
    <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-xl shadow-zinc-200/60 ring-1 ring-zinc-200/70 sm:p-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Şifrəni bərpa et
        </h1>
      </div>

      {linkExpired ? (
        <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">
          Linkin vaxtı bitib və ya artıq istifadə olunub. Yeni kod istəyin, ya
          da məktubdakı 6 rəqəmli kodu burada daxil edin.
        </p>
      ) : null}

      <div className="mt-5">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}

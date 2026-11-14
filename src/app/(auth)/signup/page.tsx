import { SignUpForm } from "@/components/auth/SignUpForm";
import { APP_AUTH_CARD, APP_AUTH_TITLE } from "@/components/app/form-styles";

export const metadata = {
  title: "Qeydiyyat",
};

export default function SignUpPage() {
  return (
    <div className={`w-full max-w-md rounded-3xl bg-white p-5 shadow-xl shadow-zinc-200/60 ring-1 ring-zinc-200/70 sm:p-8 ${APP_AUTH_CARD}`}>
      <div className="text-center">
        <h1 className={`text-2xl font-semibold tracking-tight text-zinc-900 ${APP_AUTH_TITLE}`}>
          Qeydiyyat
        </h1>
        <p className="mt-2 text-sm text-zinc-500 app:text-app-muted">
          Yeni hesab yaradın və təzə məhsullar sifariş edin
        </p>
      </div>

      <div className="mt-8">
        <SignUpForm />
      </div>
    </div>
  );
}

import Link from "next/link";
import { SignUpForm } from "@/components/auth/SignUpForm";

export const metadata = {
  title: "Qeydiyyat — BARAKATLY",
};

export default function SignUpPage() {
  return (
    <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 sm:p-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Qeydiyyat
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Yeni hesab yaradın və təzə məhsullar sifariş edin
        </p>
      </div>

      <div className="mt-8">
        <SignUpForm />
      </div>

      <div className="mt-6 border-t border-zinc-200 pt-5">
        <Link
          href="/farmer/signup"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200 transition hover:bg-emerald-100 hover:ring-emerald-300"
        >
          Fermer kimi qeydiyyatdan keç
        </Link>
      </div>
    </div>
  );
}

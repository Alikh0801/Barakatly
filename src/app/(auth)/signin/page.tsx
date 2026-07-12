import Link from "next/link";
import { SignInForm } from "@/components/auth/SignInForm";

export const metadata = {
  title: "Daxil ol — BARAKATLY",
};

export default function SignInPage() {
  return (
    <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm ring-1 ring-zinc-200">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Daxil ol
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Hesabınıza daxil olun və sifarişlərinizi idarə edin
        </p>
      </div>

      <div className="mt-8">
        <SignInForm />
      </div>

      <p className="mt-6 text-center text-xs text-zinc-500">
        Fermersiniz?{" "}
        <Link href="/farmer/signup" className="text-emerald-700 hover:underline">
          Fermer qeydiyyatı
        </Link>{" "}
        (tezliklə)
      </p>
    </div>
  );
}

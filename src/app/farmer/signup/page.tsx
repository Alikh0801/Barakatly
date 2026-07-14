import Link from "next/link";
import { FarmerSignUpForm } from "@/components/farmer/FarmerPanels";
import { getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = { title: "Fermer qeydiyyatı — BARAKATLY" };

export default async function FarmerSignUpPage() {
  const profile = await getProfile();

  if (profile) {
    const supabase = await createClient();
    const { data: farmer } = await supabase
      .from("farmers")
      .select("id")
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (farmer) redirect("/farmer");
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-10 md:px-6">
      <h1 className="text-3xl font-semibold text-zinc-900">Fermer qeydiyyatı</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Fermənizi qeydiyyatdan keçirin. Admin təsdiqindən sonra satışa başlaya bilərsiniz.
      </p>
      <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
        <FarmerSignUpForm />
        <p className="mt-4 text-center text-sm text-zinc-600">
          Artıq hesabınız var?{" "}
          <Link href="/signin?next=/farmer" className="font-semibold text-emerald-700">
            Daxil olun
          </Link>
        </p>
      </div>
    </div>
  );
}

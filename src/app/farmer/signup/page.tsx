import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CompleteFarmerProfileForm,
  FarmerSignUpForm,
} from "@/components/farmer/FarmerPanels";
import { getProfile } from "@/lib/auth/session";
import { ensureFarmerRecord } from "@/lib/farmer/ensure";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Fermer qeydiyyatı — BARAKATLY" };

export default async function FarmerSignUpPage() {
  const profile = await getProfile();

  if (profile) {
    const farmer = await ensureFarmerRecord(profile.id);
    if (farmer) {
      redirect("/farmer");
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const meta = user?.user_metadata ?? {};
    const isFarmerIntent =
      profile.role === "farmer" ||
      profile.role === "admin" ||
      meta.role === "farmer";

    if (isFarmerIntent) {
      return (
        <div className="mx-auto w-full max-w-lg px-4 py-10 md:px-6">
          <h1 className="text-3xl font-semibold text-zinc-900">
            Təsərrüfatı tamamla
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Email təsdiqindən sonra yalnız təsərrüfat məlumatları qalıb.
          </p>
          <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
            <CompleteFarmerProfileForm
              defaultFarmName={String(meta.farm_name ?? profile.full_name ?? "")}
              defaultPhone={String(meta.phone ?? profile.phone ?? "")}
            />
          </div>
        </div>
      );
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-10 md:px-6">
      <h1 className="text-3xl font-semibold text-zinc-900">Fermer qeydiyyatı</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Fermənizi qeydiyyatdan keçirin. Admin təsdiqindən sonra satışa başlaya
        bilərsiniz.
      </p>
      <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
        <FarmerSignUpForm />
        <p className="mt-4 text-center text-sm text-zinc-600">
          Artıq hesabınız var?{" "}
          <Link
            href="/signin?next=/farmer"
            className="font-semibold text-emerald-700"
          >
            Daxil olun
          </Link>
        </p>
      </div>
    </div>
  );
}

import Link from "next/link";
import { AppScreenHeader } from "@/components/app/AppScreenHeader";
import { redirect } from "next/navigation";
import {
  CompleteFarmerProfileForm,
  FarmerSignUpForm,
} from "@/components/farmer/FarmerPanels";
import { getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Fermer qeydiyyatı" };

export default async function FarmerSignUpPage() {
  const profile = await getProfile();

  // Logged-in user: keep the same auth account and only collect farm details.
  // Do NOT auto-create a farmers row here — that blocked re-apply after admin delete.
  if (profile) {
    const supabase = await createClient();
    const { data: existingFarmer } = await supabase
      .from("farmers")
      .select("id")
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (existingFarmer) {
      redirect("/farmer");
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const meta = user?.user_metadata ?? {};
    const accountEmail = user?.email ?? profile.email ?? "";

    return (
      <>
        <AppScreenHeader title="Fermer ol" fallback="/account" />
        <div className="mx-auto w-full max-w-lg px-4 py-10 md:px-6 app:px-6 app:pt-2 app:pb-8">
          <h1 className="text-3xl font-semibold text-zinc-900 app:hidden">Fermer ol</h1>
          <p className="mt-2 text-sm text-zinc-600 app:mt-0 app:text-center app:text-app-muted">
            Mövcud hesabınızla davam edirsiniz. Yenidən email və ya şifrə tələb
            olunmur — yalnız telefon və bölgəni doldurun.
          </p>
          <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 app:mt-5 app:bg-transparent app:p-0 app:shadow-none app:ring-0">
            <CompleteFarmerProfileForm
              accountEmail={accountEmail}
              defaultPhone={String(meta.phone ?? profile.phone ?? "")}
            />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AppScreenHeader title="Fermer qeydiyyatı" fallback="/account" />
      <div className="mx-auto w-full max-w-lg px-4 py-10 md:px-6 app:px-6 app:pt-2 app:pb-8">
        <h1 className="text-3xl font-semibold text-zinc-900 app:hidden">Fermer qeydiyyatı</h1>
        <p className="mt-2 text-sm text-zinc-600 app:mt-0 app:text-center app:text-app-muted">
          Fermənizi qeydiyyatdan keçirin. Admin təsdiqindən sonra satışa başlaya
          bilərsiniz.
        </p>
        <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 app:mt-5 app:bg-transparent app:p-0 app:shadow-none app:ring-0">
          <FarmerSignUpForm />
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-zinc-600">
            <Link
              href="/signin?next=/farmer/signup"
              className="font-semibold text-emerald-700 hover:underline"
            >
              Daxil ol
            </Link>
            <span className="text-zinc-300" aria-hidden>
              ·
            </span>
            <Link
              href="/signup"
              className="font-semibold text-emerald-700 hover:underline"
            >
              Müştəri kimi qeydiyyat
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

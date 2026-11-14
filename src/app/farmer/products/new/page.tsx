import { FarmerProductForm } from "@/components/farmer/FarmerPanels";
import { AppScreenHeader } from "@/components/app/AppScreenHeader";
import { requireApprovedFarmer } from "@/lib/farmer/auth";
import {
  getShopCategories,
  getShopSubcategories,
} from "@/lib/farmer/queries";

export const metadata = { title: "Yeni məhsul - Fermer" };

export default async function FarmerNewProductPage() {
  const { profile } = await requireApprovedFarmer();
  const [categories, subcategories] = await Promise.all([
    getShopCategories(),
    getShopSubcategories(),
  ]);

  return (
    <>
      <AppScreenHeader title="Yeni məhsul" fallback="/farmer/products" />
      <div className="mx-auto w-full max-w-2xl px-4 py-10 md:px-6 app:px-6 app:pt-2 app:pb-8">
        <h1 className="text-3xl font-semibold text-zinc-900 app:hidden">Yeni məhsul</h1>
        <p className="mt-2 text-sm text-zinc-500 app:mt-0 app:text-center app:text-app-muted">
          Məhsul admin təsdiqindən sonra mağazaya düşəcək
        </p>
        <div className="mt-8 app:mt-5">
          <FarmerProductForm
            categories={categories}
            subcategories={subcategories}
            userId={profile.id}
          />
        </div>
      </div>
    </>
  );
}

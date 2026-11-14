import { notFound } from "next/navigation";
import { AppScreenHeader } from "@/components/app/AppScreenHeader";
import {
  FarmerProductForm,
  ProductArchiveToggle,
} from "@/components/farmer/FarmerPanels";
import { requireApprovedFarmer } from "@/lib/farmer/auth";
import {
  getFarmerProductById,
  getShopCategories,
  getShopSubcategories,
} from "@/lib/farmer/queries";

export const metadata = { title: "Məhsulu redaktə et - Fermer" };

export default async function FarmerEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { farmer, profile } = await requireApprovedFarmer();
  const [product, categories, subcategories] = await Promise.all([
    getFarmerProductById(farmer.id, id),
    getShopCategories(),
    getShopSubcategories(),
  ]);

  if (!product) notFound();

  return (
    <>
      <AppScreenHeader title="Məhsulu redaktə et" fallback="/farmer/products" />
      <div className="mx-auto w-full max-w-2xl px-4 py-10 md:px-6 app:px-6 app:pt-2 app:pb-8">
        <h1 className="text-3xl font-semibold text-zinc-900 app:hidden">Məhsulu redaktə et</h1>
        <p className="mt-2 text-sm text-zinc-500 app:mt-0 app:text-center app:text-app-muted">
          Dəyişiklikdən sonra məhsul yenidən təsdiqə göndərilir
        </p>
        <div className="mt-8 space-y-6 app:mt-5 app:space-y-4">
          <FarmerProductForm
            categories={categories}
            subcategories={subcategories}
            product={product}
            userId={profile.id}
          />
          <ProductArchiveToggle product={product} />
        </div>
      </div>
    </>
  );
}

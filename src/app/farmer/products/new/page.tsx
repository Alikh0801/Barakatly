import { FarmerProductForm } from "@/components/farmer/FarmerPanels";
import { requireApprovedFarmer } from "@/lib/farmer/auth";
import { getShopCategories } from "@/lib/farmer/queries";

export const metadata = { title: "Yeni məhsul — Fermer" };

export default async function FarmerNewProductPage() {
  await requireApprovedFarmer();
  const categories = await getShopCategories();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 md:px-6">
      <h1 className="text-3xl font-semibold text-zinc-900">Yeni məhsul</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Məhsul admin təsdiqindən sonra mağazaya düşəcək
      </p>
      <div className="mt-8">
        <FarmerProductForm categories={categories} />
      </div>
    </div>
  );
}

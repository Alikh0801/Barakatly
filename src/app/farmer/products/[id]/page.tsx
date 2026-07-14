import { notFound } from "next/navigation";
import { FarmerProductForm } from "@/components/farmer/FarmerPanels";
import { requireApprovedFarmer } from "@/lib/farmer/auth";
import {
  getFarmerProductById,
  getShopCategories,
} from "@/lib/farmer/queries";

export const metadata = { title: "Məhsulu redaktə et — Fermer" };

export default async function FarmerEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { farmer } = await requireApprovedFarmer();
  const [product, categories] = await Promise.all([
    getFarmerProductById(farmer.id, id),
    getShopCategories(),
  ]);

  if (!product) notFound();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 md:px-6">
      <h1 className="text-3xl font-semibold text-zinc-900">Məhsulu redaktə et</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Dəyişiklikdən sonra məhsul yenidən təsdiqə göndərilir
      </p>
      <div className="mt-8">
        <FarmerProductForm categories={categories} product={product} />
      </div>
    </div>
  );
}

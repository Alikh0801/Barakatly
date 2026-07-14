import Link from "next/link";
import { FarmerProductsList } from "@/components/farmer/FarmerPanels";
import { requireApprovedFarmer } from "@/lib/farmer/auth";
import { getFarmerProducts } from "@/lib/farmer/queries";

export const metadata = { title: "Məhsullarım — Fermer" };

export default async function FarmerProductsPage() {
  const { farmer } = await requireApprovedFarmer();
  const products = await getFarmerProducts(farmer.id);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-zinc-900">Məhsullar</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Məhsullarınızı idarə edin və təsdiqə göndərin
          </p>
        </div>
        <Link
          href="/farmer/products/new"
          className="inline-flex rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Yeni məhsul
        </Link>
      </div>
      <div className="mt-8">
        <FarmerProductsList products={products} />
      </div>
    </div>
  );
}

import Link from "next/link";
import { APP_PAGE_TITLE } from "@/components/app/form-styles";
import { FarmerProductsList } from "@/components/farmer/FarmerPanels";
import { requireApprovedFarmer } from "@/lib/farmer/auth";
import { getFarmerProducts } from "@/lib/farmer/queries";

export const metadata = { title: "Məhsullarım - Fermer" };

export default async function FarmerProductsPage() {
  const { farmer } = await requireApprovedFarmer();
  const products = await getFarmerProducts(farmer.id);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-12 app:px-6 app:pt-4 app:pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={`text-3xl font-semibold text-zinc-900 ${APP_PAGE_TITLE}`}>Məhsullar</h1>
          <p className="mt-2 text-sm text-zinc-500 app:mt-1 app:text-app-muted">
            Məhsullarınızı idarə edin və təsdiqə göndərin
          </p>
        </div>
        <Link
          href="/farmer/products/new"
          className="inline-flex rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white app:h-11 app:items-center app:bg-app-green app:px-5 app:font-bold"
        >
          Yeni məhsul
        </Link>
      </div>
      <div className="mt-8 app:mt-5">
        <FarmerProductsList products={products} />
      </div>
    </div>
  );
}

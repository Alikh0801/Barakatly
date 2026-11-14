import { FarmerOrdersList } from "@/components/farmer/FarmerPanels";
import { APP_PAGE_TITLE } from "@/components/app/form-styles";
import { requireApprovedFarmer } from "@/lib/farmer/auth";
import { getFarmerOrderItems } from "@/lib/farmer/queries";

export const metadata = { title: "Sifarişlər - Fermer" };

export default async function FarmerOrdersPage() {
  const { farmer } = await requireApprovedFarmer();
  const items = await getFarmerOrderItems(farmer.id);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-12 app:px-6 app:pt-4 app:pb-6">
      <h1 className={`text-3xl font-semibold text-zinc-900 ${APP_PAGE_TITLE}`}>Sifarişlər</h1>
      <p className="mt-2 text-sm text-zinc-500 app:mt-1 app:text-app-muted">
        Status: qəbul → hazırlanır → hazırlandı → kuryer gözləyir → götürüldü
      </p>
      <div className="mt-8 app:mt-5">
        <FarmerOrdersList items={items} />
      </div>
    </div>
  );
}

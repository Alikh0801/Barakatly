import { AdminCouriersPanel } from "@/components/admin/AdminPortalPanels";
import { getAdminCouriers } from "@/lib/admin/queries";

export const metadata = { title: "Kuryerlər — Admin" };

export default async function AdminCouriersPage() {
  const couriers = await getAdminCouriers();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-12">
      <h1 className="text-3xl font-semibold text-zinc-900">Kuryerlər</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Kuryer hesabları yaradın və aktivliyi idarə edin
      </p>
      <div className="mt-8">
        <AdminCouriersPanel couriers={couriers} />
      </div>
    </div>
  );
}

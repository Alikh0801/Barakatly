import { AdminFarmersPanel } from "@/components/admin/AdminPortalPanels";
import { getAdminFarmers } from "@/lib/admin/queries";

export const metadata = { title: "Fermerlər — Admin" };

export default async function AdminFarmersPage() {
  const farmers = await getAdminFarmers();

  return (
    <div className="w-full px-4 py-8 md:px-8 md:py-10">
      <h1 className="text-3xl font-semibold text-zinc-900">Fermerlər</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Müraciətləri təsdiqləyin və ya rədd edin
      </p>
      <div className="mt-8">
        <AdminFarmersPanel farmers={farmers} />
      </div>
    </div>
  );
}

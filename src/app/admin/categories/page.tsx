import { AdminCategoriesPanel } from "@/components/admin/AdminCategoriesPanel";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { getAdminCategories } from "@/lib/admin/queries";

export const metadata = { title: "Kateqoriyalar - Admin" };

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();

  return (
    <AdminPageShell
      title="Kateqoriyalar"
    >
      <AdminCategoriesPanel categories={categories} />
    </AdminPageShell>
  );
}

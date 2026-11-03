import { AdminCategoriesPanel } from "@/components/admin/AdminCategoriesPanel";
import { requireAdmin } from "@/lib/admin/auth";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { getAdminCategories } from "@/lib/admin/queries";

export const metadata = { title: "Kateqoriyalar - Admin" };

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const categories = await getAdminCategories();

  return (
    <AdminPageShell
      title="Kateqoriyalar"
    >
      <AdminCategoriesPanel categories={categories} />
    </AdminPageShell>
  );
}

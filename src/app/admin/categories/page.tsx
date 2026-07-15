import { AdminCategoriesPanel } from "@/components/admin/AdminCategoriesPanel";
import { getAdminCategories } from "@/lib/admin/queries";

export const metadata = { title: "Kateqoriyalar — Admin" };

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();

  return (
    <div className="w-full px-4 py-8 md:px-8 md:py-10">
      <h1 className="text-3xl font-semibold text-zinc-900">Kateqoriyalar</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Ad, sıra və banner şəkil URL-lərini idarə edin
      </p>
      <div className="mt-8">
        <AdminCategoriesPanel categories={categories} />
      </div>
    </div>
  );
}

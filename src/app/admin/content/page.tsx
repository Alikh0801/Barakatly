import { AdminWhyBarakatlyPanel } from "@/components/admin/AdminWhyBarakatlyPanel";
import { getAdminWhyBarakatlyContent } from "@/lib/content/queries";

export const metadata = { title: "Məzmun — Admin" };

export default async function AdminContentPage() {
  const content = await getAdminWhyBarakatlyContent();

  return (
    <div className="w-full px-4 py-8 md:px-8 md:py-10">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
        Məzmun
      </h1>
      <p className="mt-2 text-sm text-zinc-600">
        Ana səhifə bölmələrinin başlıq və mətnlərini idarə edin
      </p>
      <div className="mt-8 max-w-2xl">
        <AdminWhyBarakatlyPanel
          title={content.title}
          body={content.body}
          items={content.items}
        />
      </div>
    </div>
  );
}

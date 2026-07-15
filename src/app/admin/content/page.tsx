import { AdminFaqPanel } from "@/components/admin/AdminFaqPanel";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminWhyBarakatlyPanel } from "@/components/admin/AdminWhyBarakatlyPanel";
import {
  getAdminFaqContent,
  getAdminWhyBarakatlyContent,
} from "@/lib/content/queries";

export const metadata = { title: "Məzmun — Admin" };

export default async function AdminContentPage() {
  const [whyContent, faqContent] = await Promise.all([
    getAdminWhyBarakatlyContent(),
    getAdminFaqContent(),
  ]);

  return (
    <AdminPageShell
      title="Məzmun"
      description="Ana səhifə bölmələrinin başlıq və mətnlərini idarə edin"
    >
      <div className="grid gap-6 xl:grid-cols-2">
        <AdminWhyBarakatlyPanel
          title={whyContent.title}
          body={whyContent.body}
          items={whyContent.items}
        />
        <AdminFaqPanel title={faqContent.title} items={faqContent.items} />
      </div>
    </AdminPageShell>
  );
}

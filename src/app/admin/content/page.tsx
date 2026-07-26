import { AdminAboutPanel } from "@/components/admin/AdminAboutPanel";
import { AdminFaqPanel } from "@/components/admin/AdminFaqPanel";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminWhyBarakatlyPanel } from "@/components/admin/AdminWhyBarakatlyPanel";
import {
  getAdminAboutContent,
  getAdminFaqContent,
  getAdminWhyBarakatlyContent,
} from "@/lib/content/queries";

export const metadata = { title: "Məzmun — Admin" };

export default async function AdminContentPage() {
  const [whyContent, faqContent, aboutContent] = await Promise.all([
    getAdminWhyBarakatlyContent(),
    getAdminFaqContent(),
    getAdminAboutContent(),
  ]);

  return (
    <AdminPageShell
      title="Məzmun"
      description="Ana səhifə və Haqqımızda mətnlərini idarə edin"
    >
      <div className="grid gap-6 xl:grid-cols-2">
        <AdminWhyBarakatlyPanel
          title={whyContent.title}
          body={whyContent.body}
          items={whyContent.items}
        />
        <AdminFaqPanel title={faqContent.title} items={faqContent.items} />
        <AdminAboutPanel
          title={aboutContent.title}
          body={aboutContent.body}
          items={aboutContent.items}
        />
      </div>
    </AdminPageShell>
  );
}

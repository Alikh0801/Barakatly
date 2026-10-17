import { AdminAboutPanel } from "@/components/admin/AdminAboutPanel";
import { AdminContactPanel } from "@/components/admin/AdminContactPanel";
import { AdminFaqPanel } from "@/components/admin/AdminFaqPanel";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminWhyBarakatlyPanel } from "@/components/admin/AdminWhyBarakatlyPanel";
import {
  getAdminAboutContent,
  getAdminContactContent,
  getAdminFaqContent,
  getAdminWhyBarakatlyContent,
} from "@/lib/content/queries";

export const metadata = { title: "Məzmun - Admin" };

export default async function AdminContentPage() {
  const [whyContent, faqContent, aboutContent, contact] = await Promise.all([
    getAdminWhyBarakatlyContent(),
    getAdminFaqContent(),
    getAdminAboutContent(),
    getAdminContactContent(),
  ]);

  return (
    <AdminPageShell
      title="Məzmun"
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
        <AdminContactPanel contact={contact} />
      </div>
    </AdminPageShell>
  );
}

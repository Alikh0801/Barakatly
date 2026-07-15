import { AdminFaqPanel } from "@/components/admin/AdminFaqPanel";
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
    <div className="w-full px-4 py-8 md:px-8 md:py-10">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
        Məzmun
      </h1>
      <p className="mt-2 text-sm text-zinc-600">
        Ana səhifə bölmələrinin başlıq və mətnlərini idarə edin
      </p>
      <div className="mt-8 grid max-w-5xl gap-6 lg:grid-cols-2">
        <AdminWhyBarakatlyPanel
          title={whyContent.title}
          body={whyContent.body}
          items={whyContent.items}
        />
        <AdminFaqPanel title={faqContent.title} items={faqContent.items} />
      </div>
    </div>
  );
}

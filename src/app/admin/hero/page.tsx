import { AdminAuthImagePanel } from "@/components/admin/AdminAuthImagePanel";
import { AdminHeroPanel } from "@/components/admin/AdminHeroPanel";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { getAdminAuthImageContent, getAdminHeroContent } from "@/lib/content/queries";

export const metadata = { title: "Hero — Admin" };

export default async function AdminHeroPage() {
  const [heroContent, authImageContent] = await Promise.all([
    getAdminHeroContent(),
    getAdminAuthImageContent(),
  ]);

  return (
    <AdminPageShell
      title="Hero"
      description="Ana səhifənin ilk bölməsi və giriş səhifəsindəki şəkil/mətnləri idarə edin"
    >
      <div className="grid gap-6 xl:grid-cols-2">
        <AdminHeroPanel
          title={heroContent.title}
          body={heroContent.body}
          items={heroContent.items}
        />
        <AdminAuthImagePanel items={authImageContent.items} />
      </div>
    </AdminPageShell>
  );
}

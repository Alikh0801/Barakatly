import { AdminHeroPanel } from "@/components/admin/AdminHeroPanel";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { getAdminHeroContent } from "@/lib/content/queries";

export const metadata = { title: "Hero — Admin" };

export default async function AdminHeroPage() {
  const heroContent = await getAdminHeroContent();

  return (
    <AdminPageShell
      title="Hero"
      description="Ana səhifənin ilk bölməsindəki fon şəklini və mətnləri idarə edin"
    >
      <div className="grid gap-6 xl:grid-cols-2">
        <AdminHeroPanel
          title={heroContent.title}
          body={heroContent.body}
          items={heroContent.items}
        />
      </div>
    </AdminPageShell>
  );
}

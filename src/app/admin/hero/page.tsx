import { AdminAuthImagePanel } from "@/components/admin/AdminAuthImagePanel";
import { AdminHeroPanel } from "@/components/admin/AdminHeroPanel";
import { AdminLogoPanel } from "@/components/admin/AdminLogoPanel";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import {
  getAdminAuthImageContent,
  getAdminHeroContent,
  getAdminSiteLogo,
} from "@/lib/content/queries";

export const metadata = { title: "Hero - Admin" };

export default async function AdminHeroPage() {
  const [heroContent, authImageContent, logoUrl] = await Promise.all([
    getAdminHeroContent(),
    getAdminAuthImageContent(),
    getAdminSiteLogo(),
  ]);

  return (
    <AdminPageShell
      title="Hero"
    >
      <div className="grid gap-6 xl:grid-cols-2">
        <AdminHeroPanel
          title={heroContent.title}
          body={heroContent.body}
          items={heroContent.items}
        />
        <AdminAuthImagePanel
          title={authImageContent.title}
          body={authImageContent.body}
          items={authImageContent.items}
        />
        <AdminLogoPanel logoUrl={logoUrl} />
      </div>
    </AdminPageShell>
  );
}

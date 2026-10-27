import { AdminAuthImagePanel } from "@/components/admin/AdminAuthImagePanel";
import { AdminHeroPanel } from "@/components/admin/AdminHeroPanel";
import { AdminLogoPanel } from "@/components/admin/AdminLogoPanel";
import { AdminOgImagePanel } from "@/components/admin/AdminOgImagePanel";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import {
  getAdminAuthImageContent,
  getAdminHeroContent,
  getAdminOgImage,
  getAdminSiteLogo,
} from "@/lib/content/queries";

export const metadata = { title: "Hero - Admin" };

export default async function AdminHeroPage() {
  const [heroContent, authImageContent, logoUrl, ogImage] = await Promise.all([
    getAdminHeroContent(),
    getAdminAuthImageContent(),
    getAdminSiteLogo(),
    getAdminOgImage(),
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
        <AdminOgImagePanel imageUrl={ogImage.imageUrl} />
      </div>
    </AdminPageShell>
  );
}

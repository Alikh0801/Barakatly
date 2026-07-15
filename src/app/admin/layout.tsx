import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { requireAdmin } from "@/lib/admin/auth";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdmin();

  return (
    <div className="min-h-dvh bg-zinc-100 lg:flex">
      <AdminSidebar />
      <div className="min-w-0 flex-1 overflow-x-hidden">
        <main className="min-h-dvh pb-[env(safe-area-inset-bottom)]">
          {children}
        </main>
      </div>
    </div>
  );
}

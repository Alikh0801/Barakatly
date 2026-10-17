import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminStatsPanels, StatsPeriodTabs } from "@/components/admin/AdminStatsPanels";
import { getPageViewStats, parseStatsPeriod } from "@/lib/admin/stats";

export const metadata = { title: "Statistika - Admin" };

export default async function AdminStatisticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const { days } = await searchParams;
  const period = parseStatsPeriod(days);
  const stats = await getPageViewStats(period);

  return (
    <AdminPageShell
      title="Statistika"
    >
      <div className="mb-5 sm:mb-6">
        <StatsPeriodTabs active={period} />
      </div>
      {stats ? (
        <AdminStatsPanels stats={stats} />
      ) : (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
          Statistika yüklənmədi. 038_page_view_stats.sql miqrasiyasının işə salındığını yoxlayın.
        </p>
      )}
    </AdminPageShell>
  );
}

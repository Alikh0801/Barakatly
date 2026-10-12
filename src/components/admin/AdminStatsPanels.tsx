import Link from "next/link";
import {
  STATS_PERIODS,
  type PageViewStats,
  type StatsPeriod,
  type StatsRow,
} from "@/lib/admin/stats";

const numberFormat = new Intl.NumberFormat("az-AZ");
const fmt = (value: number) => numberFormat.format(value);

const DEVICE_NAMES: Record<string, string> = {
  mobile: "Telefon",
  tablet: "Planşet",
  desktop: "Kompüter",
  other: "Digər",
};

const ROLE_NAMES: Record<string, string> = {
  customer: "Müştəri",
  farmer: "Fermer",
  courier: "Kuryer",
};

// Vercel reports cities by their English names.
const CITY_NAMES: Record<string, string> = {
  Baku: "Bakı",
  Ganja: "Gəncə",
  Sumqayit: "Sumqayıt",
  Sumgait: "Sumqayıt",
  Mingachevir: "Mingəçevir",
  Lankaran: "Lənkəran",
  Shirvan: "Şirvan",
  Nakhchivan: "Naxçıvan",
  Shaki: "Şəki",
  Sheki: "Şəki",
  Khachmaz: "Xaçmaz",
  Yevlakh: "Yevlax",
  Shamakhi: "Şamaxı",
  Qabala: "Qəbələ",
  Gabala: "Qəbələ",
  Quba: "Quba",
  Guba: "Quba",
  Masally: "Masallı",
  Jalilabad: "Cəlilabad",
  Barda: "Bərdə",
  Agdam: "Ağdam",
  Zaqatala: "Zaqatala",
  Khirdalan: "Xırdalan",
};

let regionNames: Intl.DisplayNames | null = null;
try {
  regionNames = new Intl.DisplayNames(["az"], { type: "region" });
} catch {
  regionNames = null;
}

function countryName(code: string | null) {
  if (!code) return "Naməlum";
  try {
    return regionNames?.of(code) ?? code;
  } catch {
    return code;
  }
}

function dayLabel(day: string) {
  const [, month, date] = day.split("-");
  return `${date}.${month}`;
}

function hourLabel(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

/** A round top for the value axis, so its ticks read as plain numbers. */
function niceMax(value: number) {
  if (value <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * magnitude >= value) ?? 10;
  return step * magnitude;
}

function percent(part: number, whole: number) {
  if (!whole) return "0%";
  const value = (part / whole) * 100;
  return `${value < 10 ? value.toFixed(1).replace(".", ",") : Math.round(value)}%`;
}

function Card({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 sm:p-5 ${className}`}>
      <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
      {subtitle ? <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 sm:p-5">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">{value}</p>
      {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}

type Column = { key: string; axisLabel: string | null; value: number; tooltip: string };

/**
 * Single-series column chart: thin bars on a shared baseline, a recessive
 * grid with three ticks, a tooltip on hover/focus for every bar, and the
 * same numbers in a screen-reader table.
 */
function ColumnChart({ columns, caption }: { columns: Column[]; caption: string }) {
  const top = niceMax(Math.max(0, ...columns.map((c) => c.value)));
  const ticks = [top, top / 2, 0];

  return (
    <figure>
      <div className="flex gap-2">
        <div className="flex h-44 w-8 shrink-0 flex-col justify-between text-right text-[11px] leading-none text-zinc-400" aria-hidden="true">
          {ticks.map((tick) => (
            <span key={tick} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">
              {fmt(tick)}
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="relative h-44" role="img" aria-label={caption}>
            {ticks.map((tick, index) => (
              <div
                key={tick}
                aria-hidden="true"
                className={`absolute inset-x-0 border-t ${index === ticks.length - 1 ? "border-zinc-300" : "border-zinc-100"}`}
                style={{ top: `${(index / (ticks.length - 1)) * 100}%` }}
              />
            ))}
            <div className="absolute inset-0 flex items-end gap-[2px]">
              {columns.map((column) => (
                <div
                  key={column.key}
                  tabIndex={0}
                  aria-label={column.tooltip}
                  className="group relative flex h-full min-w-0 flex-1 items-end outline-none"
                >
                  <div
                    className="w-full rounded-t-[4px] bg-emerald-600 transition-colors group-hover:bg-emerald-700 group-focus-visible:bg-emerald-700"
                    style={{
                      height: `${(column.value / top) * 100}%`,
                      minHeight: column.value > 0 ? 2 : 0,
                    }}
                  />
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-zinc-900 px-2.5 py-1.5 text-xs text-white shadow-lg group-hover:block group-focus-visible:block">
                    {column.tooltip}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-1.5 flex gap-[2px] text-[11px] text-zinc-500" aria-hidden="true">
            {columns.map((column) => (
              <span key={column.key} className="min-w-0 flex-1 overflow-visible whitespace-nowrap text-center">
                {column.axisLabel ?? ""}
              </span>
            ))}
          </div>
        </div>
      </div>
      <table className="sr-only">
        <caption>{caption}</caption>
        <tbody>
          {columns.map((column) => (
            <tr key={column.key}>
              <td>{column.tooltip}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** Ranked rows with the count, the share and a thin bar for scale. */
function RankedList({
  rows,
  total,
}: {
  rows: { key: string; label: string; detail?: string; views: number }[];
  total: number;
}) {
  if (rows.length === 0) {
    return <p className="py-6 text-center text-sm text-zinc-500">Məlumat yoxdur.</p>;
  }
  const max = Math.max(...rows.map((r) => r.views));

  return (
    <ol className="space-y-3">
      {rows.map((row) => (
        <li key={row.key}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-zinc-800" title={row.detail ?? row.label}>
              {row.label}
              {row.detail ? <span className="ml-1.5 text-xs text-zinc-400">{row.detail}</span> : null}
            </span>
            <span className="shrink-0 tabular-nums text-zinc-900">
              {fmt(row.views)}
              <span className="ml-1.5 text-xs text-zinc-500">{percent(row.views, total)}</span>
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-100" aria-hidden="true">
            <div
              className="h-full rounded-full bg-emerald-600"
              style={{ width: `${max ? (row.views / max) * 100 : 0}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

function rowsOf(rows: StatsRow[], name: (label: string | null) => string) {
  return rows.map((row, index) => ({
    key: `${row.label ?? "null"}-${index}`,
    label: name(row.label),
    views: row.views,
  }));
}

export function StatsPeriodTabs({ active }: { active: StatsPeriod }) {
  return (
    <nav aria-label="Dövr" className="inline-flex rounded-xl bg-white p-1 shadow-sm ring-1 ring-zinc-200">
      {STATS_PERIODS.map((period) => {
        const isActive = period.days === active;
        return (
          <Link
            key={period.days}
            href={`/admin/statistics?days=${period.days}`}
            data-static-hover
            aria-current={isActive ? "page" : undefined}
            className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              isActive ? "bg-emerald-600 text-white" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
            }`}
          >
            {period.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminStatsPanels({ stats }: { stats: PageViewStats }) {
  const { views } = stats;

  if (views === 0) {
    return (
      <div className="rounded-2xl bg-white px-6 py-14 text-center shadow-sm ring-1 ring-zinc-200">
        <p className="text-base font-semibold text-zinc-900">Bu dövrdə hələ baxış qeydə alınmayıb</p>
        <p className="mt-1 text-sm text-zinc-500">
          Ziyarətçilər sayta girdikcə statistika burada görünəcək.
        </p>
      </div>
    );
  }

  const dailyStep = stats.daily.length > 10 ? 3 : 1;
  const dailyColumns: Column[] = stats.daily.map((day, index) => ({
    key: day.day,
    axisLabel: index % dailyStep === 0 ? dayLabel(day.day) : null,
    value: day.views,
    tooltip: `${dayLabel(day.day)}: ${fmt(day.views)} baxış, ${fmt(day.visitors)} ziyarətçi`,
  }));
  const hourlyColumns: Column[] = stats.hourly.map((hour) => ({
    key: String(hour.hour),
    axisLabel: hour.hour % 3 === 0 ? String(hour.hour).padStart(2, "0") : null,
    value: hour.views,
    tooltip: `${hourLabel(hour.hour)}–${hourLabel((hour.hour + 1) % 24)}: ${fmt(hour.views)} baxış`,
  }));

  const perVisitor = stats.visitors ? stats.views / stats.visitors : 0;
  const busiestHour = stats.hourly.reduce((best, h) => (h.views > best.views ? h : best), stats.hourly[0]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatTile label="Səhifə baxışı" value={fmt(stats.views)} />
        <StatTile label="Unikal ziyarətçi" value={fmt(stats.visitors)} hint="Eyni brauzer bir dəfə sayılır" />
        <StatTile
          label="Ziyarətçi başına baxış"
          value={perVisitor.toFixed(1).replace(".", ",")}
        />
        <StatTile
          label="Daxil olmuş istifadəçilər"
          value={percent(stats.signedInViews, stats.views)}
          hint="Baxışların payı"
        />
      </div>

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-2">
        {stats.days > 1 ? (
          <Card title="Günlər üzrə baxışlar" subtitle="Bakı vaxtı ilə">
            <ColumnChart columns={dailyColumns} caption="Günlər üzrə səhifə baxışları" />
          </Card>
        ) : null}
        <Card
          title="Saatlar üzrə baxışlar"
          subtitle={busiestHour.views > 0 ? `Ən sıx saat: ${hourLabel(busiestHour.hour)}–${hourLabel((busiestHour.hour + 1) % 24)} · Bakı vaxtı ilə` : "Bakı vaxtı ilə"}
          className={stats.days > 1 ? "" : "xl:col-span-2"}
        >
          <ColumnChart columns={hourlyColumns} caption="Saatlar üzrə səhifə baxışları" />
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Card title="Ən çox baxılan səhifələr" className="lg:col-span-2 xl:col-span-1 xl:row-span-2">
          <RankedList
            total={views}
            rows={stats.pages.map((page) => ({
              key: page.path,
              label: page.label,
              detail: page.label === page.path ? undefined : page.path,
              views: page.views,
            }))}
          />
        </Card>
        <Card title="Şəhərlər" subtitle="IP-yə görə təxmini">
          <RankedList
            total={views}
            rows={stats.cities.map((row, index) => ({
              key: `${row.label}-${row.country}-${index}`,
              label: row.label ? CITY_NAMES[row.label] ?? row.label : "Naməlum",
              detail: row.country && row.country !== "AZ" ? countryName(row.country) : undefined,
              views: row.views,
            }))}
          />
        </Card>
        <Card title="Ölkələr">
          <RankedList total={views} rows={rowsOf(stats.countries, countryName)} />
        </Card>
        <Card title="Cihazlar">
          <RankedList total={views} rows={rowsOf(stats.devices, (l) => DEVICE_NAMES[l ?? "other"] ?? "Digər")} />
        </Card>
        <Card title="Gəliş mənbəyi">
          <RankedList total={views} rows={rowsOf(stats.referrers, (l) => l ?? "Birbaşa / daxili keçid")} />
        </Card>
        <Card title="Brauzerlər">
          <RankedList total={views} rows={rowsOf(stats.browsers, (l) => l ?? "Naməlum")} />
        </Card>
        <Card title="Əməliyyat sistemləri">
          <RankedList total={views} rows={rowsOf(stats.os, (l) => l ?? "Naməlum")} />
        </Card>
        <Card title="Ziyarətçi növü">
          <RankedList
            total={views}
            rows={rowsOf(stats.roles, (l) => (l ? ROLE_NAMES[l] ?? l : "Qonaq (daxil olmayıb)"))}
          />
        </Card>
      </div>
    </div>
  );
}

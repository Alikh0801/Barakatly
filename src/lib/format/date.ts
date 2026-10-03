/**
 * Dates are always shown in Azerbaijan time (UTC+4), never in the runtime's
 * own zone. Server rendering happens on Vercel in UTC, so Date#getHours() and
 * friends were four hours behind, and the browser then hydrated with the
 * visitor's own zone — two different times for the same order.
 */
const TIME_ZONE = "Asia/Baku";

const bakuFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function bakuParts(date: Date) {
  const parts = bakuFormatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    day: get("day"),
    month: get("month"),
    year: get("year"),
    hour: get("hour"),
    minute: get("minute"),
  };
}

function toDate(value: string | Date): Date | null {
  const date = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Formats as dd.mm.yy in Azerbaijan time. */
export function formatDate(value: string | Date) {
  const date = toDate(value);
  if (!date) return "";

  const { day, month, year } = bakuParts(date);
  return `${day}.${month}.${year}`;
}

/** Formats as dd.mm.yy HH:mm in Azerbaijan time. */
export function formatDateTime(value: string | Date) {
  const date = toDate(value);
  if (!date) return "";

  const { day, month, year, hour, minute } = bakuParts(date);
  return `${day}.${month}.${year} ${hour}:${minute}`;
}

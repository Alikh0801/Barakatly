/**
 * Orders are delivered on Sundays (Baku time, UTC+4, no daylight saving):
 * one placed Monday to Friday 13:59 arrives that week's Sunday; one placed
 * from Friday 14:00, on Saturday or on Sunday arrives the next week's.
 *
 * The date is worked out from when the order was placed, so every page
 * (checkout, order, admin, courier) shows the same day for it.
 */

const BAKU_OFFSET_MS = 4 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
/** Friday orders from this hour on go to the following Sunday. */
const FRIDAY_CUTOFF_HOUR = 14;

const MONTHS_AZ = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avqust",
  "sentyabr",
  "oktyabr",
  "noyabr",
  "dekabr",
];

/**
 * The delivery Sunday for an order placed at `placedAt`, as a calendar date
 * ("2026-11-01"), the same whatever time zone the code runs in.
 */
export function deliveryDateFor(placedAt: Date | string): string {
  // Shifted by the offset, the UTC fields read as Baku's wall clock.
  const baku = new Date(new Date(placedAt).getTime() + BAKU_OFFSET_MS);
  const weekday = baku.getUTCDay(); // 0 Sunday … 6 Saturday
  const thisWeek =
    (weekday >= 1 && weekday <= 4) ||
    (weekday === 5 && baku.getUTCHours() < FRIDAY_CUTOFF_HOUR);
  const daysToSunday = (7 - weekday) % 7 || 7; // Sunday itself counts as next
  const days = thisWeek ? daysToSunday : daysToSunday + (weekday === 0 ? 0 : 7);
  return new Date(baku.getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

/** "1 noyabr, bazar" — the delivery date as the site shows it. */
export function formatDeliveryDate(date: string): string {
  const [, month, day] = date.split("-").map(Number);
  return `${day} ${MONTHS_AZ[month - 1]}, bazar`;
}

/** The delivery day of an order placed at `placedAt`, formatted. */
export function deliveryLabel(placedAt: Date | string): string {
  return formatDeliveryDate(deliveryDateFor(placedAt));
}

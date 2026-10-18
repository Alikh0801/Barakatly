/**
 * True on the pre-production site (pre.barakatly.az), where Vercel's
 * Preview environment sets NEXT_PUBLIC_APP_ENV=pre. Read at build time, so
 * the same code builds the live site and the test site.
 */
export const IS_PRE = process.env.NEXT_PUBLIC_APP_ENV === "pre";

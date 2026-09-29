/**
 * Escapes user input for a LIKE/ILIKE pattern so it matches literally.
 *
 * `%`, `_` and `\` are escaped with a backslash, Postgres' default LIKE
 * escape. PostgREST also reads `*` as an alias for `%` and offers no way to
 * escape it, so `*` becomes `_` (exactly one character): never match-all,
 * but a superset — callers that need an exact match on `*` re-check rows.
 */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&").replace(/\*/g, "_");
}

import "server-only";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

/**
 * audit_log (migration 20261102150000): who did what, and when. Rows are
 * written here with the service role, only after the caller has checked
 * who is asking; nobody can change or remove them afterwards.
 *
 * A failed write never stops the action it records, but it is logged.
 */

type AuditTarget = { type: string; id: string | null | undefined };

async function requestInfo(): Promise<{ ip: string | null; userAgent: string | null }> {
  try {
    const list = await headers();
    // Vercel sets x-real-ip and puts the client first in x-forwarded-for.
    const ip = list.get("x-real-ip") ?? list.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    return { ip: ip || null, userAgent: list.get("user-agent")?.slice(0, 300) ?? null };
  } catch {
    return { ip: null, userAgent: null };
  }
}

async function writeAuditRow(row: {
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Json;
}) {
  const { ip, userAgent } = await requestInfo();
  try {
    const { error } = await createAdminClient()
      .from("audit_log")
      .insert({ ...row, ip, user_agent: userAgent });
    if (error) console.error("[audit]", row.action, error.message);
  } catch (error) {
    console.error("[audit]", row.action, error);
  }
}

/** Records an admin's action. `admin` comes from requireAdmin(). */
export async function logAdminAction(
  admin: { id: string; email?: string | null },
  action: string,
  target?: AuditTarget,
  details: Record<string, unknown> = {},
) {
  await writeAuditRow({
    actor_id: admin.id,
    actor_email: admin.email ?? null,
    action,
    target_type: target?.type ?? null,
    target_id: target?.id ?? null,
    details: details as Json,
  });
}

export type AuthFailureKind =
  | "signin"
  | "signup_otp"
  | "signup_otp_resend"
  | "password_reset_request"
  | "password_reset_code"
  | "password_reset_update";

/**
 * Records a failed sign-in, code check or password reset. A captcha
 * failure is left out: no password or code was tried, and it would let
 * anyone fill the table without solving one.
 */
export async function logAuthFailure(kind: AuthFailureKind, email: string, reason: string) {
  const normalizedReason = reason.slice(0, 200);
  console.warn("[auth.failed]", kind, email, normalizedReason);
  if (normalizedReason.toLowerCase().includes("captcha")) return;

  await writeAuditRow({
    actor_id: null,
    actor_email: email.trim().toLowerCase().slice(0, 254) || null,
    action: `auth.${kind}_failed`,
    target_type: "auth",
    target_id: null,
    details: { reason: normalizedReason },
  });
}

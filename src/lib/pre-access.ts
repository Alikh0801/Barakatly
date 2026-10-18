import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { IS_PRE } from "@/lib/env";

/**
 * A shared login for the test site, so only testers can open it. The
 * browser asks once and then sends it with every request. Set
 * PRE_ACCESS_USER and PRE_ACCESS_PASSWORD for the pre branch in Vercel;
 * without them (and always on the live site) nothing is asked.
 */
function same(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function preAccessDenied(request: NextRequest): Response | null {
  if (!IS_PRE) return null;
  const user = process.env.PRE_ACCESS_USER;
  const password = process.env.PRE_ACCESS_PASSWORD;
  if (!user || !password) return null;

  const header = request.headers.get("authorization") ?? "";
  if (header.startsWith("Basic ")) {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const separator = decoded.indexOf(":");
    if (
      separator > 0 &&
      same(decoded.slice(0, separator), user) &&
      same(decoded.slice(separator + 1), password)
    ) {
      return null;
    }
  }

  return new Response("Test mühitinə giriş üçün istifadəçi adı və şifrə lazımdır.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Barakatly test", charset="UTF-8"',
      "Content-Type": "text/plain; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

/**
 * Where browsers report what the Content-Security-Policy blocked (or, in
 * Report-Only mode, would have blocked). Nothing is stored: each report is
 * one line in the Vercel logs, searchable by "[csp]".
 */

const MAX_BODY = 8000;

type LegacyReport = {
  "csp-report"?: {
    "document-uri"?: string;
    "violated-directive"?: string;
    "effective-directive"?: string;
    "blocked-uri"?: string;
    "source-file"?: string;
    "line-number"?: number;
  };
};

function pathOf(uri: string | undefined): string {
  if (!uri) return "-";
  try {
    return new URL(uri).pathname;
  } catch {
    return uri.slice(0, 120);
  }
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > MAX_BODY) return new Response(null, { status: 204 });

  try {
    const report = (JSON.parse(raw) as LegacyReport)["csp-report"];
    if (report) {
      console.warn(
        "[csp]",
        report["effective-directive"] ?? report["violated-directive"] ?? "-",
        "blocked:", (report["blocked-uri"] ?? "-").slice(0, 160),
        "page:", pathOf(report["document-uri"]),
        report["source-file"] ? `source: ${report["source-file"].slice(0, 160)}:${report["line-number"] ?? ""}` : "",
      );
    }
  } catch {
    // Not a report: ignore.
  }
  return new Response(null, { status: 204 });
}

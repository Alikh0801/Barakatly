import type { NotificationType } from "@/types";

const TELEGRAM_API = "https://api.telegram.org";

function adminChatIds(): string[] {
  return String(process.env.TELEGRAM_ADMIN_CHAT_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

/** Deep link to the admin page most relevant to a notification type. */
export function adminLinkForType(type: NotificationType): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://barakatly.az";
  switch (type) {
    case "farmer_registration":
    case "farmer_profile_update":
      return `${base}/admin/farmers`;
    case "product_submission":
      return `${base}/admin/products`;
    case "payment_received":
      return `${base}/admin/orders`;
    default:
      return `${base}/admin`;
  }
}

/**
 * Best-effort Telegram push to the configured admin chat(s). It is a no-op when
 * TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_IDS are unset, so the app runs
 * unchanged without Telegram configured. Errors are logged, never thrown.
 */
export async function sendAdminTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatIds = adminChatIds();
  if (!token || chatIds.length === 0) return;

  await Promise.all(
    chatIds.map(async (chatId) => {
      // Cap each call so a slow/unreachable Telegram API can't stall whatever
      // action triggered this notification.
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            disable_web_page_preview: true,
          }),
          signal: controller.signal,
        });
        if (!res.ok) {
          console.error(
            "[telegram] sendMessage failed",
            res.status,
            await res.text(),
          );
        }
      } catch (error) {
        console.error("[telegram] sendMessage error", error);
      } finally {
        clearTimeout(timeout);
      }
    }),
  );
}

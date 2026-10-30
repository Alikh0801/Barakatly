-- ---------------------------------------------------------------------------
-- Notifications and order status events are written only by the server
-- (OWASP A01-004).
--
-- The insert policies let any farmer or courier send any user a
-- notification with any text, type and metadata, and let farmers and
-- couriers write events on orders with any status and any changed_by
-- (an admin's id included). The site writes both from server actions that
-- have already checked who is asking; those now use the service role
-- (lib/notifications/helpers.ts, lib/admin/actions.ts), so API users lose
-- insert on the two tables. place_order() runs as its owner and keeps
-- writing its own events.
--
-- Users still mark their own notifications read and delete them; update is
-- narrowed to read_at so title, body, type and metadata stay as sent.
--
-- The "oi.order_id = oi.order_id" select policy was fixed in
-- 20261029120000.
-- ---------------------------------------------------------------------------

drop policy if exists "Staff insert notifications" on public.notifications;
drop policy if exists "Staff insert status events" on public.order_status_events;

revoke insert on public.notifications, public.order_status_events from anon, authenticated;

revoke update on public.notifications from anon, authenticated;
grant update (read_at) on public.notifications to authenticated;

revoke update, delete on public.order_status_events from anon, authenticated;

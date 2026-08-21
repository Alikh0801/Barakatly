-- ---------------------------------------------------------------------------
-- New category/subcategory proposals from a farmer notified admins with
-- type "general" — the same generic type used for unrelated, non-actionable
-- notifications (e.g. "farmer updated order item status"). That made it
-- impossible to give category-approval notifications their own red
-- "needs review" styling without also flagging unrelated general
-- notifications. Give it its own type instead.
-- ---------------------------------------------------------------------------
alter type public.notification_type
  add value if not exists 'category_submission';

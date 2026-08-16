-- notifications had select/update/insert RLS policies but no delete policy,
-- so a user could never delete their own notifications (RLS denies by
-- default when no policy matches the operation).

create policy "Users delete own notifications"
on public.notifications for delete
using (user_id = auth.uid());

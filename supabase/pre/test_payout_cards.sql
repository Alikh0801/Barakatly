-- PRE only — fake payout cards so /admin/payouts can be tested. Real cards
-- live only in production and are never copied here. Gives every approved
-- farmer without a card a "Test Bank" card 0000-0000-0000-NNNN.
insert into public.farmer_payout_accounts (farmer_id, bank_name, pan_number)
select f.id, 'Test Bank', '0000-0000-0000-' || lpad(((select count(*) from public.farmer_payout_accounts) + row_number() over (order by f.created_at))::text, 4, '0')
from public.farmers f
where f.status = 'approved'
  and not exists (select 1 from public.farmer_payout_accounts a where a.farmer_id = f.id)
on conflict (farmer_id) do nothing;

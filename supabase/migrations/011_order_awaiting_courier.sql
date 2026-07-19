-- Replace single "picked_up" admin step with awaiting courier + on the way
alter type public.order_status
  add value if not exists 'awaiting_courier' after 'preparing';

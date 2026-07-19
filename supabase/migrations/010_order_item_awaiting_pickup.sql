-- Add farmer line-item status: waiting for courier pickup
alter type public.order_item_status
  add value if not exists 'awaiting_pickup' after 'ready';

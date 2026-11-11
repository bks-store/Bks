-- Allow admin users to delete orders (and order_items via CASCADE)
-- Run in Supabase > SQL Editor

create policy "Admins can delete orders"
  on orders for delete to authenticated
  using (is_admin());

-- order_items has ON DELETE CASCADE on orders, but add explicit policy too
create policy "Admins can delete order_items"
  on order_items for delete to authenticated
  using (is_admin());

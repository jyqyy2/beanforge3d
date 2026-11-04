begin;

create table public.orders (
  id uuid primary key,
  stripe_session_id text unique,
  status text not null default 'pending' check (status in ('pending', 'paid', 'checkout_failed')),
  currency text not null check (currency = 'SGD'),
  amount_total_minor integer not null check (amount_total_minor > 0),
  quote jsonb not null check (jsonb_typeof(quote) = 'object'),
  customer_email text,
  shipping_name text,
  shipping_address jsonb,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index orders_status_created_at_idx on public.orders (status, created_at);
alter table public.orders enable row level security;
revoke all on public.orders from public, anon, authenticated;
grant all on public.orders to service_role;

commit;

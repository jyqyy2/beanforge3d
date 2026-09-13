begin;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(btrim(name)) > 0),
  description text,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(btrim(name)) > 0),
  description text not null check (length(btrim(description)) > 0),
  is_active boolean not null default false,
  featured_rank integer check (featured_rank >= 0),
  price_display text not null default 'fixed' check (price_display in ('fixed', 'from')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.colours (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(btrim(name)) > 0 and name = btrim(name)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index colours_name_case_insensitive on public.colours (lower(name));

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  colour_id uuid not null references public.colours(id) on delete restrict,
  sku text unique check (sku is null or length(btrim(sku)) > 0),
  price_minor integer not null check (price_minor >= 0),
  currency text not null default 'SGD' check (currency = 'SGD'),
  is_active boolean not null default false,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_variants_product_colour_key unique (product_id, colour_id),
  constraint product_variants_id_product_key unique (id, product_id)
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  variant_id uuid,
  storage_path text not null check (length(btrim(storage_path)) > 0),
  alt_text text not null check (length(btrim(alt_text)) > 0),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_images_variant_product_fkey
    foreign key (variant_id, product_id)
    references public.product_variants(id, product_id) on delete restrict
);

create index products_category_active_rank_idx
  on public.products (category_id, is_active, featured_rank, id);
create index products_featured_idx
  on public.products (featured_rank, id) where is_active and featured_rank is not null;
create index product_variants_product_active_order_idx
  on public.product_variants (product_id, is_active, sort_order, id);
create index product_variants_colour_idx on public.product_variants (colour_id);
create index product_images_product_order_idx
  on public.product_images (product_id, sort_order, id);
create unique index product_images_base_order_key
  on public.product_images (product_id, sort_order) where variant_id is null;
create unique index product_images_variant_order_key
  on public.product_images (variant_id, sort_order) where variant_id is not null;

create function private.set_catalogue_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = clock_timestamp();
  return new;
end;
$$;

revoke all on function private.set_catalogue_updated_at() from public, anon, authenticated;

create trigger categories_updated_at before update on public.categories
  for each row execute function private.set_catalogue_updated_at();
create trigger products_updated_at before update on public.products
  for each row execute function private.set_catalogue_updated_at();
create trigger colours_updated_at before update on public.colours
  for each row execute function private.set_catalogue_updated_at();
create trigger product_variants_updated_at before update on public.product_variants
  for each row execute function private.set_catalogue_updated_at();
create trigger product_images_updated_at before update on public.product_images
  for each row execute function private.set_catalogue_updated_at();

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.colours enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;

create function private.is_catalogue_product_visible(target_product_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.products as product
    join public.categories as category on category.id = product.category_id
    where product.id = target_product_id
      and product.is_active
      and category.is_active
      and exists (
        select 1 from public.product_variants as variant
        where variant.product_id = product.id and variant.is_active
      )
  );
$$;

alter function private.is_catalogue_product_visible(uuid) owner to postgres;
revoke all on function private.is_catalogue_product_visible(uuid) from public, anon, authenticated;
grant execute on function private.is_catalogue_product_visible(uuid) to anon, authenticated;

revoke all on table public.categories, public.products, public.colours,
  public.product_variants, public.product_images from public, anon, authenticated;
grant select on table public.categories, public.products, public.colours,
  public.product_variants, public.product_images to anon, authenticated;
grant all on table public.categories, public.products, public.colours,
  public.product_variants, public.product_images to service_role;

create policy categories_public_read on public.categories
  for select to anon, authenticated using (is_active);

create policy products_public_read on public.products
  for select to anon, authenticated
  using (private.is_catalogue_product_visible(id));

create policy product_variants_public_read on public.product_variants
  for select to anon, authenticated
  using (is_active and private.is_catalogue_product_visible(product_id));

create policy product_images_public_read on public.product_images
  for select to anon, authenticated
  using (
    private.is_catalogue_product_visible(product_id)
    and (
      variant_id is null
      or exists (
        select 1 from public.product_variants as variant
        where variant.id = product_images.variant_id
          and variant.product_id = product_images.product_id
          and variant.is_active
      )
    )
  );

create policy colours_public_read on public.colours
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.product_variants as variant
      where variant.colour_id = colours.id
    )
  );

commit;

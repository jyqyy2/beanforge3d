begin;

insert into public.categories (slug, name, description, sort_order, is_active)
values ('studio', 'Studio', 'Customisable clickers and keycaps', 2, true)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description,
  sort_order = excluded.sort_order, is_active = true;

insert into public.colours (code, name)
values ('purple', 'Purple'), ('turquoise', 'Turquoise')
on conflict (code) do update set name = excluded.name;

insert into public.products (category_id, slug, name, description, featured_rank, price_display, is_active)
select category.id, product.slug, product.name, product.description, product.featured_rank, 'from', true
from (values
  ('custom-keycaps', 'Keycap Studio', 'Create a 1–8 character clicker board with optional extra keycaps.', 3),
  ('halloween-clicker', 'Halloween Fidget Clicker', 'Choose a 1x1, 2x1, 2x2 or 4x1 board and your Halloween keycaps.', 4)
) as product(slug, name, description, featured_rank)
join public.categories as category on category.slug = 'studio'
on conflict (slug) do update set
  category_id = excluded.category_id, name = excluded.name, description = excluded.description,
  featured_rank = excluded.featured_rank, price_display = excluded.price_display, is_active = true;

insert into public.product_variants (product_id, colour_id, price_minor, currency, is_active, sort_order)
select product.id, colour.id, variant.price_minor, 'SGD', true, variant.sort_order
from (values
  ('custom-keycaps', 'Cream', 490, 0),
  ('custom-keycaps', 'Pink', 490, 1),
  ('custom-keycaps', 'Black', 490, 2),
  ('halloween-clicker', 'Cream', 790, 0),
  ('halloween-clicker', 'Pink', 790, 1),
  ('halloween-clicker', 'Black', 790, 2),
  ('halloween-clicker', 'Purple', 790, 3),
  ('halloween-clicker', 'White', 790, 4),
  ('halloween-clicker', 'Turquoise', 790, 5)
) as variant(product_slug, colour_name, price_minor, sort_order)
join public.products as product on product.slug = variant.product_slug
join public.colours as colour on colour.name = variant.colour_name
on conflict (product_id, colour_id) do update set
  price_minor = excluded.price_minor, currency = excluded.currency,
  is_active = true, sort_order = excluded.sort_order;

update public.products
set description = 'A personalised 1–10 letter name keychain. S$6.90 for one letter, plus S$1.00 per additional letter.'
where slug = 'custom-name-keychain';

commit;

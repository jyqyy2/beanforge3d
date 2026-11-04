begin;

insert into public.categories (slug, name, description, sort_order, is_active)
values
  ('custom', 'Custom', 'Personalised pieces made to order', 0, true),
  ('qr-nfc', 'QR / NFC', 'Stands for counters and businesses', 1, true)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description, sort_order = excluded.sort_order, is_active = true;

insert into public.colours (code, name)
values ('red', 'Red'), ('white', 'White'), ('black', 'Black'), ('yellow', 'Yellow'),
  ('cream', 'Cream'), ('pink', 'Pink'), ('blue', 'Blue'), ('orange', 'Orange')
on conflict (code) do update set name = excluded.name;

insert into public.products (category_id, slug, name, description, featured_rank, price_display, is_active)
select category.id, product.slug, product.name, product.description, product.featured_rank, product.price_display, true
from (values
  ('custom', 'custom-carplate-keychain', 'Custom Car Plate Keychain',
    'A personalised miniature car plate keychain.', 0, 'fixed'),
  ('custom', 'custom-name-keychain', 'Custom Name Keychain',
    'A personalised 1–10 letter name keychain. Only one-letter pricing is approved.', 1, 'from'),
  ('qr-nfc', 'qr-nfc-stand', 'QR / NFC Stand',
    'A character stand for QR payments, menus and NFC interactions.', 2, 'fixed')
) as product(category_slug, slug, name, description, featured_rank, price_display)
join public.categories as category on category.slug = product.category_slug
on conflict (slug) do update set
  category_id = excluded.category_id, name = excluded.name, description = excluded.description,
  featured_rank = excluded.featured_rank, price_display = excluded.price_display, is_active = true;

insert into public.product_variants (product_id, colour_id, price_minor, currency, is_active, sort_order)
select product.id, colour.id, variant.price_minor, 'SGD', true, variant.sort_order
from (values
  ('custom-carplate-keychain', 'Red', 490, 0),
  ('custom-carplate-keychain', 'White', 490, 1),
  ('custom-carplate-keychain', 'Black', 490, 2),
  ('custom-carplate-keychain', 'Yellow', 490, 3),
  ('custom-name-keychain', 'Cream', 690, 0),
  ('custom-name-keychain', 'Pink', 690, 1),
  ('custom-name-keychain', 'Blue', 690, 2),
  ('custom-name-keychain', 'Black', 690, 3),
  ('qr-nfc-stand', 'Black', 1590, 0),
  ('qr-nfc-stand', 'White', 1590, 1),
  ('qr-nfc-stand', 'Orange', 1590, 2)
) as variant(product_slug, colour_name, price_minor, sort_order)
join public.products as product on product.slug = variant.product_slug
join public.colours as colour on colour.name = variant.colour_name
on conflict (product_id, colour_id) do update set
  price_minor = excluded.price_minor, currency = excluded.currency,
  is_active = true, sort_order = excluded.sort_order;

update public.products set is_active = false where slug = 'bean-keycap';

commit;

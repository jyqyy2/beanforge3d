# Catalogue schema checkpoint

This directory contains a local migration, not a connected or deployed database.
React still reads `catalogue.ts → products.ts`. No seed, storage bucket, SDK,
environment file, project link, customer account or checkout is created here.

## The five notebooks

| Table | What it remembers |
|---|---|
| categories | Groups such as Keycaps; an active empty SKÅDIS category is allowed |
| products | Bean Keycap's shared name, description and URL slug |
| colours | Shared labels such as Pink; case-insensitive names prevent duplicates |
| product_variants | Bean Keycap / Pink, with its own price in cents and display order |
| product_images | Ordered base-product or variant images, using verified storage paths later |

The migration is `migrations/20260913000100_catalogue.sql`. It creates five
tables, five SELECT policies, five timestamp triggers, two private functions
and supporting indexes. UUIDs and timestamps are generated automatically;
sort order starts at zero; new categories/products/variants are inactive.
Products default to fixed price display and variants to SGD. No stock or SKU
values are invented. Variant prices have no competing product-price column.

## Relationships and constraints

Slugs/codes must use lowercase ASCII letters/numbers separated by single
hyphens. Display names can contain Unicode, including SKÅDIS. Required text
cannot be blank. Colour names cannot have surrounding spaces. Prices, ranks
and ordering cannot be negative. Currency is SGD only; price display is fixed
or from. Optional SKUs are unique when supplied (case-sensitive).

Each product has one category. Each variant has one product and colour, with
one variant per product/colour pair. Each image has a product and optionally
a variant. The combined image foreign key prevents a Bean Keycap image from
referencing a QR Stand variant. NULL variant means a base image, checked by
the independent product FK. Base and variant galleries each have unique sort
positions. Referenced rows cannot be deleted; prefer deactivation.

Indexes support category/active/featured-rank queries, global featured ordering,
variant listing and colour lookups, and image gallery ordering. Primary and
unique constraints supply their own indexes. Variant gallery uniqueness also
supports variant foreign-key lookups. No additional product sort_order is
invented: the approved product ordering field is featured_rank, with ID as a
deterministic tie-breaker.

## Public visibility without circular policies

RLS is enabled on all five tables. Both anonymous and signed-in browser roles
have SELECT only, with no write policies or write privileges. Categories must
be active. Products must be active, have an active category AND at least one
active variant. Variants must themselves be active under a visible product.
Base images require a visible product; variant images also require a visible
variant. Colours are readable only if referenced by a visible variant.

Products and variants cannot query each other's RLS policies recursively.
`private.is_catalogue_product_visible(uuid)` therefore performs a small,
read-only visibility check as its trusted postgres owner. It returns a boolean,
uses fully qualified relations and an empty search_path, has no dynamic SQL,
and has EXECUTE revoked from PUBLIC then granted only to anon/authenticated.
It bypasses RLS only to evaluate that fixed predicate. The caller still gets
only rows authorized by each policy. Keep private OUT of Supabase's exposed API
schemas. Browser roles get schema USAGE, never CREATE. Do not change the owner
or force owner RLS without revisiting this dependency and testing for recursion.

This is a read filter, not a publication workflow: a trusted editor can prepare
an active product with no active variants, but visitors cannot see it. Once its
first variant becomes active it is readable. Deactivating the last variant or
category immediately hides it and dependent catalogue rows. Empty active
categories remain visible. No publication triggers are needed.

The separate timestamp function runs before each row update and replaces
updated_at with the database clock. Its execution is not granted to browser
roles; the five installed triggers invoke it.

service_role has table privileges and Supabase's trusted role bypasses RLS.
This key is a server secret and must never be used in React, Vite variables or
chat. A publishable/legacy anon key is browser-safe only with correct RLS and
grants. Neither this key nor an admin interface is introduced in this milestone.

Public database visibility does not secure public Storage objects. No bucket
policies or image paths are created. Verify actual uploads and paths separately.
Equal variant prices are still required by today's UI; fixed/from copy does
not implement variable pricing. These are later adapter/publication checks.

## Applying later, manually and deliberately

No Supabase CLI, psql or Docker was found on the command path during this
milestone, and the repository has no linked project. Migration execution needs
a Supabase database with the standard anon, authenticated, service_role and
postgres roles. It is not a generic role-agnostic PostgreSQL bootstrap script.

1. Choose/create a development Supabase project in your own account. Keep
   credentials in your own secure environment; do not paste secrets into chat.
2. Use a reviewed migration workflow: with the CLI installed, initialize local
   config via `supabase init`, inspect generated changes, then explicitly link
   the intended development project. Do not reset an existing database.
3. Review a dry run with `supabase db push --dry-run`, then apply only to the
   confirmed development target with `supabase db push`. Alternatively, run the
   migration once in a new development project's SQL editor and reconcile its
   migration history before switching to CLI management; do not run it twice.
4. Check that private is not exposed through the Data API. Test policies as
   anon/authenticated, not just as postgres (which bypasses RLS).

The migration is transactional: a failure rolls back its objects. It is a
versioned one-time migration, not a repeatable CREATE TABLE IF NOT EXISTS script.
No remote command was executed during this milestone.

## Database verification gate

Before using this schema for a read adapter, run checks in a disposable local
Supabase or development database. Temporary fixtures are test data, never a
production seed. Roll them back after checks. Test constraint failures inside
savepoints so expected errors do not abort the entire test run.

- Apply migration successfully; verify exactly the five application tables.
- Verify UUID/defaults, inactive defaults, NOT NULL requirements and timestamp
  changes on UPDATE for every table.
- Reject duplicate slug/code, case-insensitive colour name, supplied SKU and
  product/colour pair. Permit NULL SKUs on multiple variants.
- Reject uppercase/blank slugs, blank required text, negative prices/orders/
  ranks, non-SGD currency and invalid price_display.
- Reject missing category/product/colour references and a cross-product
  variant image. Reject duplicate base and variant gallery positions; allow
  the same position in different galleries.
- Reject deleting referenced category, product, colour or image-used variant.
- Inspect pg_class.relrowsecurity, pg_policies, pg_constraint, pg_indexes,
  function owners/search_path and table/function grants.
- As anon AND authenticated, verify active empty categories are visible;
  inactive categories and their products are hidden; active products with zero
  active variants are hidden; a visible product's active variant/base image
  are visible; inactive variants and their images are hidden; unused or
  inactive-only colours are hidden. Test shared colours across hidden/visible
  products and last-active-variant deactivation. Confirm no recursive RLS error.
- As both browser roles reject INSERT, UPDATE, DELETE and TRUNCATE on every
  table, and verify PUBLIC has no write grants. Check privileged writes only
  through trusted tools; no anonymous write RPC is provided.

## Verification status

Local source review covers the relationships, partial uniqueness, five RLS
policies, grants and acyclic policy dependencies. Frontend lint/build and Git
whitespace checks are run separately for this checkpoint. Actual SQL parsing,
migration execution, constraints, triggers and role behaviour require a real
PostgreSQL/Supabase runtime; static review is not a substitute for those tests.

Stop after schema review/application checks. Production seed/image mapping and
connecting React require separate approval. Suggested Git message:
`add Supabase catalogue schema`. Nothing is committed or pushed automatically.

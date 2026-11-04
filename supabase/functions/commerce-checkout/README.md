# Commerce checkout

The public checkout function reads the catalogue through Supabase's anonymous
role and RLS. It accepts purchase intent, calculates a fresh quote, saves a
private pending order, then creates a Stripe **test** Checkout Session only
for Singapore. The browser cannot provide prices, totals, product names, or
a shipping amount. The service-role key is used only server-side for orders.
Checkout creates a fresh quote and the cart checks it against the displayed
quote before redirecting. If amounts changed, the customer must review the
new total and click again.

Configure server secrets in the target Supabase project:

- `SITE_URL`: exact site origin, for example `https://shop.example`. Used
  for CORS, success and cancellation redirects.
- `STRIPE_SECRET_KEY`: a rotated Stripe **test** secret. Live keys are rejected.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only order writes. Never expose it to the browser.
- `STRIPE_WEBHOOK_SECRET`: signing secret for the `commerce-webhook` endpoint.
- `KEYCAP_STUDIO_PRICING_JSON`: optional, server-owned final Studio pricing
  containing `boardPricesMinor`, `characterPricesMinor`, `boardColours`,
  and `characterColours`. Studio checkout is unavailable until this is set.
  Do not copy the frontend's temporary development prices into this setting
  without explicitly approving those prices for sale.

Supabase supplies `SUPABASE_URL` and `SUPABASE_ANON_KEY` to the function.
The site needs only the public `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` values. Never put a Stripe secret or service-role key
in a `VITE_` variable.

Apply `20260913000100_catalogue.sql`, then `20261104000100_v1_products.sql`,
then `20261104000200_orders.sql` before deploying both Edge Functions.
The V1 seed contains active, visible Custom Car Plate Keychain
(Red, White, Black, Yellow at S$4.90), one-letter Custom Name Keychain
(currently displayed from S$6.90), and QR/NFC Stand (S$15.90) rows with
active SGD variants and colours. Longer-name prices are not approved, so
checkout rejects names longer than one letter. These migrations are local
files and have **not** been applied to a Supabase project. Missing or inactive
rows fail closed. The Stand's supported Chick/Bee design choice remains a
server-validated V1 rule; the current schema does not model stand design.

Configure Stripe's test webhook destination for `commerce-webhook` and subscribe
to `checkout.session.completed` and `checkout.session.async_payment_succeeded`.
Use its endpoint-specific signing secret. The webhook verifies the raw body,
timestamp and signature; it matches session, order ID, amount and currency
before marking an order paid. The stored server quote contains the selections
and personalisation needed for manual fulfilment. Duplicate deliveries do not
create duplicate paid orders. The order table is private to the service role.

Before accepting live payments, verify a complete test payment, webhook delivery,
customer/shipping details, refund and manual fulfilment workflow in the target
project. This implementation intentionally rejects live Stripe keys. Inventory,
taxes and Malaysia carrier rates are not configured. Do not assume a return to
the success page is proof of payment; the webhook records the authoritative order.

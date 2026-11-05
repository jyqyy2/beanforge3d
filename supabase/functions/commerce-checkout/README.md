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

Studio board and add-on pricing is defined server-side in `_shared/commerce.ts`.
Redeploy the commerce functions when approved prices change; the browser's
estimated cart prices never authorize a payment.

Supabase supplies `SUPABASE_URL` and `SUPABASE_ANON_KEY` to the function.
The site needs only the public `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` values. Never put a Stripe secret or service-role key
in a `VITE_` variable.

Apply `20260913000100_catalogue.sql`, then `20261104000100_v1_products.sql`,
then `20261104000200_orders.sql` before deploying both Edge Functions.
The V1 seed contains active, visible Custom Car Plate Keychain
(Red, White, Black, Yellow at S$4.90), Custom Name Keychain (S$6.90 for one
letter, plus S$1.00 per additional letter through ten), and QR/NFC Stand
(S$15.90) rows with active SGD variants and colours. Keycap Studio includes
1–8 characters at S$4.90, S$6.90, S$8.90, S$10.90, S$12.90, S$14.90,
S$16.90 and S$17.90 respectively; optional spare keycaps cost S$2.00 each.
Halloween 1x1, 2x1, 2x2 and 4x1 boards cost S$7.90, S$9.90, S$11.90 and
S$11.90 respectively, with S$2.50 per extra keycap. Studio prices are
server-owned and not database catalogue rows. These migrations were applied
to the user-designated staging project `eyrjmyhhxqplgnzclrui` on November 5,
2026; both functions were deployed. Missing or inactive
catalogue rows fail closed for standard products. The Stand's supported
Chick/Bee design choice remains a server-validated V1 rule; the current
schema does not model stand design.

Staging currently accepts `http://localhost:5173` as `SITE_URL` for local test
quotes and return URLs. Its quote endpoint was checked against all five item
types, including both kinds of add-ons. Stripe test checkout is **not ready**:
the ignored `.env.staging.local` contains only the public staging URL and anon
key. Run `npm run dev -- --mode staging --port 5173` after stopping any existing
server on that port to connect the local cart to staging quotes. A staging
build uses `npm run build -- --mode staging`; do not publish that build to the
production storefront.

To enable payment in staging,
set a newly rotated `STRIPE_SECRET_KEY`, create the Stripe test webhook
destination for `commerce-webhook`, and set its `STRIPE_WEBHOOK_SECRET` without
placing either value in the repo or chat. Change `SITE_URL` to the exact
staging storefront origin before using a hosted staging frontend. Only then
perform a test payment and confirm the webhook records the paid order.

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

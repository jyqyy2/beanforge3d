# Commerce checkout

The public checkout function reads the catalogue through Supabase's anonymous
role and RLS. It accepts purchase intent, calculates a fresh quote, saves a
private pending order, then creates a Stripe Checkout Session only
for Singapore. The browser cannot provide prices, totals, product names, or
a shipping amount. The service-role key is used only server-side for orders.
Checkout creates a fresh quote and the cart checks it against the displayed
quote before redirecting. If amounts changed, the customer must review the
new total and click again.

Configure server secrets in the target Supabase project:

- `SITE_URL`: exact site origin, for example `https://shop.example`. Used
  for CORS, success and cancellation redirects.
- `STRIPE_SECRET_KEY`: a Stripe secret from the selected mode; keep it server-side.
- `STRIPE_ENVIRONMENT`: `test` (the default) or explicitly `live`. A live key without `live` is rejected. Live mode requires an HTTPS `SITE_URL`.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only order writes. Never expose it to the browser.
- `STRIPE_WEBHOOK_SECRET`: endpoint-specific signing secret for the same Stripe mode as `STRIPE_SECRET_KEY`. The webhook rejects mismatched event and session modes.

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

The project now uses `SITE_URL=https://beanforge3d.com` and explicit
`STRIPE_ENVIRONMENT=test` while the live storefront is verified. The
production Cloudflare build has only public `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` variables. Test Checkout Sessions and webhook
deliveries were exercised in the separate Stripe sandbox. The ignored
`.env.staging.local` contains only the public project URL and anon key;
local development cannot request checkout quotes while `SITE_URL` is
restricted to the production origin.

Configure Stripe's test webhook destination for `commerce-webhook` and subscribe
to `checkout.session.completed` and `checkout.session.async_payment_succeeded`.
Use its endpoint-specific signing secret. The webhook verifies the raw body,
timestamp and signature; it matches session, order ID, amount and currency
before marking an order paid. The stored server quote contains the selections
and personalisation needed for manual fulfilment. Duplicate deliveries do not
create duplicate paid orders. The order table is private to the service role.

Before accepting live payments, deploy the current storefront build with public
Supabase URL and anon key, set `SITE_URL=https://beanforge3d.com`, set
`STRIPE_ENVIRONMENT=live` with the live Stripe key, and create a **new live**
Stripe event destination for `commerce-webhook` subscribed to
`checkout.session.completed` and `checkout.session.async_payment_succeeded`.
Do not reuse the test destination secret or an unrelated WooCommerce destination.
Confirm the SG shipping rule (S$3.90, free from S$40), fulfilment,
refund/contact process, and a complete test payment before switching secrets.
BeanForge3D is not GST-registered. Stripe automatic tax is not enabled; do not
add GST to checkout, display GST-inclusive pricing claims, or issue GST tax
invoices. Revisit tax settings only if registration status changes.
Live checkout must be smoke-tested with a controlled real payment and a verified
paid order before public promotion. Inventory, taxes and Malaysia carrier rates
are not configured. The webhook, not the success page, is authoritative for payment.

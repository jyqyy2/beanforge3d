# Commerce checkout

This public Edge Function reads the five-table catalogue through Supabase's
anonymous role and RLS. It accepts purchase intent, calculates a fresh quote,
and creates a Stripe Checkout Session only for Singapore. The browser cannot
provide prices, totals, product names, or a shipping amount. No service-role
key is used.
Checkout creates a fresh quote and the cart checks it against the displayed
quote before redirecting. If amounts changed, the customer must review the
new total and click again.

Configure server secrets in the target Supabase project:

- `SITE_URL`: exact site origin, for example `https://shop.example`. Used
  for CORS, success and cancellation redirects.
- `STRIPE_SECRET_KEY`: a rotated Stripe **test** secret. Live keys are rejected.
- `KEYCAP_STUDIO_PRICING_JSON`: optional, server-owned final Studio pricing
  containing `boardPricesMinor`, `characterPricesMinor`, `boardColours`,
  and `characterColours`. Studio checkout is unavailable until this is set.
  Do not copy the frontend's temporary development prices into this setting
  without explicitly approving those prices for sale.

Supabase supplies `SUPABASE_URL` and `SUPABASE_ANON_KEY` to the function.
The site needs only the public `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` values. Never put a Stripe secret or service-role key
in a `VITE_` variable.

The deployed catalogue must contain active, visible Bean Keycap and QR/NFC
Stand rows with active SGD variants and colours. The current development
catalogue has not been populated by this change. Missing or inactive rows
fail closed. The Stand's supported Chick/Bee design choice remains a
server-validated V1 rule; the current schema does not model stand design.

No Stripe webhook or order store exists yet. A successful test payment is
visible in the Stripe dashboard, but this change does not automate
fulfilment or persist custom design details as an order. Keep test mode until
those steps are complete.

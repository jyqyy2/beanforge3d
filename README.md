# BeanForge3D storefront

React/Vite storefront deployed as static assets by the Cloudflare Worker
`beanforge3d`. Cloudflare builds the `main` branch with
`npm run build` and deploys with `npx wrangler deploy`.

The Worker build needs only `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` as public build variables. Do not add Stripe
secrets or the Supabase service-role key to the Vite build. Stripe Checkout
and order recording run in Supabase Edge Functions; see
`supabase/functions/commerce-checkout/README.md` for deployment and
payment-mode checks.

Run `npm test`, `npm run lint`, and `npm run build` before
publishing. The Cloudflare Worker serves `dist` with a single-page app
fallback so deep links such as `/studio/keycaps` and `/cart` work.

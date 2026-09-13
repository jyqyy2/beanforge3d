# Cart checkpoint

The storefront cart milestones are implemented: shared state, cart route,
product details, empty state, remove controls, quantity editing with a minimum
of one, subtotal/total, responsive styling, and the header quantity badge/link.

Identical product slugs and colours merge; different colours stay separate.
The cart persists under `beanforge-cart` in localStorage. Invalid saved rows
are ignored. If storage is unavailable, the cart still works for the current
page session, but cannot persist after a refresh.

Product pages announce successful additions and provide a View cart link.
Cart rows link back to products and show unit prices as well as line totals.
Quantity controls have descriptive accessible names and disabled minimums.

## Review checklist

- Add the same product/colour twice: one row, combined quantity.
- Add another colour: a separate row with its chosen colour/image.
- Increase/decrease quantity: badge, line total and summary update together.
- At quantity one: decrement is disabled.
- Remove a row: other rows remain; remove the last row: empty state appears.
- Reload: cart quantities persist.
- Follow View cart, product links and Continue shopping.
- Review cart layout at desktop, tablet and phone widths.
- Run `npm run build` and `npm run lint` before committing.

## Scope and next steps

Total currently equals the merchandise subtotal; shipping is not included.
Checkout is disabled. Payments, orders, inventory, backend persistence and
custom configuration identities belong to later milestones. Clear-all is an
optional future convenience; individual removal is available now.

The cart is ready for a Git checkpoint after review. Suggested commit message:
`finish cart experience`. No commit or push is performed automatically.

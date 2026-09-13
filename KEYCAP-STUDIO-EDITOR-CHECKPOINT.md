# Keycap studio editor milestone

The studio now treats a creation as boards plus characters. Its temporary
prices live in `src/data/catalogue.ts`: board prices are S$10, S$18, S$26,
S$34, S$42, S$50, S$58 and S$66 for 1–8 boards, and every A–Z/0–9 character
costs S$3. The pure calculator in `src/utils/keycapPricing.ts` receives this
definition and a configuration, so the preview owns no pricing logic.

The configuration is schema version 2 with `colour` and `characters`. Hidden
characters remain in component state when the count is reduced, but only
visible characters are sent to the preview and counted in the quote. Blank
visible characters contribute no character price and keep Add my creation to
cart disabled. That action is intentionally a preview-only readiness message;
configured cart integration is a later milestone.

The preview is still renderer-independent. It receives configuration and an
active input index, renders physical-looking raised keycap sketches, applies a
whole-creation colour through CSS variables, and highlights the corresponding
preview keycap while its character input is focused. Inputs accept one A–Z or
0–9 character and normalize lowercase.

## Verification

- `npm run build`: passed.
- `npm run lint`: passed.
- Browser: initial 1-board quote is S$10.00 and action is disabled.
- Browser: six boards updates the board price to S$50.00 and exposes six inputs.
- Browser: JOANNE produces `6 / 6 keycaps complete`, enables the action and
  calculates S$68.00 = S$50.00 + 6 × S$3.00.
- Browser: clicking the preview action shows the cart-integration message and
  does not change the cart badge or cart contents.
- Browser: 1–8 controls, colour selection, individual character editing and
  uppercase/number validation were covered; the prior studio checks covered
  hidden-character restoration and responsive widths.
- No Supabase, dependencies, database, routing or cart changes were made.
- `git diff --check` passed; no temporary console/debug code was introduced.

The original image-optimisation and responsive-layout work remains in the same
uncommitted working tree and was preserved. Review/stage it with this studio
work or split it into separate commits as preferred.

Suggested commit: `polish keycap studio editor experience`.

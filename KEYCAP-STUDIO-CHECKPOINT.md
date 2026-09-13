# Keycap studio: state and sketch milestone

Route: `/studio/keycaps`. Open it from the homepage Custom section's
“Explore the keycap studio” link.

The studio reads the existing Bean Keycap colour list through catalogue.ts.
This is a prototype palette, not a new catalogue product or pricing agreement.
No custom product record, price, order, cart configuration or database logic
has been added.

## State and renderer contract

KeycapStudioPage owns count (1–8), colour and eight editable letter slots.
The shared KeycapConfiguration type contains schemaVersion, colour and only
the visible letters. Count is derived from that array by the renderer, so the
preview cannot receive a conflicting count and letter list.

Reducing count hides extra slots but remembers their contents for the current
mount. Leaving or refreshing resets the sketch. Inputs currently accept one
A–Z letter each and normalize lowercase to uppercase. Other alphabets and
symbols need an explicit product/font decision before being supported.

KeycapPreview takes configuration as a prop and knows nothing about the
catalogue, database, cart or a 3D library. Its CSS shapes and colour values are
explicitly illustrative. The supplied 1–8 product assets can replace this
renderer later without moving configuration ownership into image/3D code.

## Verification

- Lint and TypeScript/Vite build passed.
- Browser verified one J tile, six JOANNE tiles, Pink selection and live updates.
- Reducing six to one then returning to six preserves JOANNE.
- Eight produces eight inputs and eight tiles; numeric input is rejected.
- No horizontal overflow at 320, 390, 768 and 1024 px; desktop/mobile sketches
  inspected visually. Buttons have 44px minimum targets, inputs have labels,
  options use fieldsets/legends and pressed states, preview has a live summary.
- Homepage entry link works; returning resets local state as explained in UI.
- No browser console errors observed. Existing cart count remained 23; no cart
  mutations were performed during this milestone.

Next: review this interaction model and integrate verified supplied assets as
a separate preview milestone. Configured cart identity and full 3D come later.

Earlier image-optimisation changes were already uncommitted when this work
began and were preserved. Review/stage that checkpoint separately if desired.
Suggested studio commit: `add keycap studio state and layout preview`.

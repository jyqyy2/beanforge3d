# Studio mobile and keyboard review

Reviewed 2026-09-14 using the in-app Chromium browser and an isolated localhost test origin.

## Findings

- At 320, 390, 768 and 1280 CSS pixels, the page has no horizontal overflow with eight characters and the palette open.
- Preview targets measure approximately 27, 35, 75 and 100 pixels wide respectively. Narrow-screen targets are below the preferred 44-pixel touch size; the corresponding character inputs provide larger equivalent controls (approximately 60 pixels wide at 320). The compact preview layout is preserved.
- Preview keyboard activation focuses the matching character input. Close palette returns focus to that input.
- Fixed the palette relationship: only the selected character input now references the displayed palette with aria-controls. Previously every visible input referenced the selected character's palette.

## Scope

This is a focused browser/DOM review, not a WCAG compliance certification. Real-device touch/virtual-keyboard behaviour and screen-reader speech require additional device testing. User-selected low-contrast keycap/character combinations remain possible by design; automatic contrast is available. No pricing, draft, cart or configuration logic changes are included.

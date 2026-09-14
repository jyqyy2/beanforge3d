# Keycap regression checks

Run `npm test` from the project root with Node 24. Tests use Node's built-in runner and the existing Vite SSR loader to execute the actual TypeScript utilities, including catalogue imports. No browser or new dependency is required; the Vite loader closes after imports.

Coverage includes counts 1–8, A–Z/0–9, incomplete/invalid configurations, current development pricing, independent colours, automatic-contrast identity normalization, cart edit snapshots and merges, malformed drafts, hidden-character persistence, and storage failures. Storage tests use an isolated in-memory substitute, not real browser data.

These are utility regression tests, not browser end-to-end tests. They do not prove the React editor's count switching, lowercase normalization, Add to Cart handler, focus, reset confirmation, or navigation/refresh guards. Manually check those behaviours in an isolated browser origin:

- Select each count, type characters, change all colour layers, reduce/increase count and reload; confirm hidden values return and pricing uses active characters only.
- Check empty → complete → empty states and the disabled/enabled cart action.
- Add a design twice, edit its draft, and confirm the cart snapshot remains unchanged and quantities merge.
- Edit a cart design; test Keep editing, discard, save, and the native refresh warning.
- Test Start new design and Keep my design; saved cart designs must survive draft reset.
- Check preview/card selection, keyboard focus, Enter/Space, palette Escape/Close, mobile/tablet widths and console errors.

Run `npm run lint`, `npm run build`, and `git diff --check` alongside this suite. When intentional pricing or schema changes occur, review expectations explicitly rather than weakening the assertions.

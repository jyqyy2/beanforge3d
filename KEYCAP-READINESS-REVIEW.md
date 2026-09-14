# Keycap Studio readiness review

## Current milestone status — 2026-09-14

This section supersedes the historical remaining-work list below. The Studio is a browser-local configurator, not a production ordering system.

| Milestone | Status | Evidence / remaining gate |
| --- | --- | --- |
| Configuration and three colour layers | Implemented | Existing editor; counts 1–8, A–Z/0–9, hidden characters retained, independent colours |
| Product-flow hierarchy | Implemented | Count options, live preview, completion guidance, price and cart action |
| Preview/card selection and empty states | Implemented | Shared selection, orange outline, existing input focus, subtle +, accessible empty descriptions |
| Draft reassurance and reset confirmation | Implemented | Browser-local save feedback; explicit confirmation; Keep my design preserves draft |
| Cart snapshots, editing and merging | Implemented | Studio snapshots; updateKeycapCart; quantity merge; navigation protection |
| Utility regression suite | Implemented | npm test: 18 tests; tests/README.md defines coverage and browser-only gaps |
| Focused mobile/keyboard review | Completed within documented scope | tests/ACCESSIBILITY-REVIEW.md; not full assistive-technology certification |
| Production-readiness checklist | Documented here | Business approvals and engineering gates below remain open |

Draft reset/refresh acceptance is recorded in KEYCAP-FRONTEND-ACCEPTANCE.md. Cart write failures are no longer silent: CartContext exposes storageFailed and the Studio renders an alert. Actual browser failure/recovery rendering has not been fault-injected. Do not mistake helper tests for browser end-to-end coverage.

## Remaining Studio acceptance gates

- Real iOS/Android touch and virtual-keyboard testing, tablet use, screen-reader speech, and native refresh-warning checks on supported browsers. Record device/browser versions and outcomes. Narrow preview targets have larger equivalent character-card inputs.
- Browser end-to-end automation now covers count changes, draft reset/reload, preview selection, cart Add/Edit/Save, merge and in-app navigation guards on desktop/mobile viewports. See tests/e2e/studio.spec.ts and tests/README.md. Native refresh prompts and real-device acceptance remain open.
- Browser storage write failure/recovery warnings now have passing fault-injection tests. Read failures and corrupt-data recovery still require hardening: verify that a failed read cannot silently destroy a recoverable draft/cart.
- Decide and implement multi-tab conflict handling and unreadable-storage recovery. These are persistence changes, not visual polish; define conflict/recovery behaviour before implementation. Current storage is not cross-device and simultaneous tabs may overwrite each other's changes.

## Business approval worksheet

All values below are pending owner approval; do not substitute development assumptions.

| Decision | Required before release |
| --- | --- |
| Prices | Final 1–8 board prices, character prices, currency, tax treatment and rounding |
| Sellable options | Actual materials and colour availability; allowed combinations and substitution policy |
| Product specification | Dimensions, switch compatibility, assembly, included parts and tested tolerances |
| Fulfilment | Manufacturing/dispatch lead times, capacity, destinations, shipping rates and packaging |
| Customer policies | Custom-product cancellation/returns, defects, care and applicable safety information |
| Preview promise | Approve how illustrative colour/shape differences are explained; do not imply manufacturing accuracy |

## Deferred production implementation sequence

1. Explicitly approve resuming catalogue/database work; persist supported options and approved pricing without duplicating the Studio configuration model.
2. Server-side configuration validation and authoritative repricing. Reject unsupported characters/counts/colours and stale or tampered client prices. Preserve versioned immutable order configuration snapshots.
3. Store-wide checkout, shipping/tax calculation, payment verification/idempotency and durable orders. Validate success, cancellation, retries and failure paths before any real transactions.
4. Availability, production/fulfilment workflow, operational monitoring, recovery/backups, privacy and deployment acceptance.
5. Optional 3D asset preparation and integration only after explicit approval. It is not a prerequisite for a functional illustrative Studio; no assets are changed in this milestone.

Authentication, inventory, orders, payments and 3D remain deferred. A general request to finish Studio milestones does not resolve their business decisions or supersede their explicit postponement.

## Release gate

Run npm test, npm run lint, npm run build and git diff --check; complete the browser checklist in tests/README.md on supported devices. Release only after the business worksheet, data-loss acceptance gates and store-wide ordering verification are signed off. Passing the frontend build alone does not establish production readiness.

## Historical checkpoint (superseded where noted above)

## Implemented frontend milestones

- Counts 1–8, A–Z/0–9, active-slot completeness and hidden-slot retention.
- Independent board, keycap and symbol colours, automatic symbol contrast.
- Linked-board illustrative preview and compact cart preview.
- Catalogue-owned development prices and separate pricing calculator.
- Configured cart identity, snapshots, persistence, editing and quantity merge.
- Browser-local drafts, save feedback and reset confirmation.
- Unsaved cart-edit navigation guard and save feedback. User confirmed native
  refresh warning testing in the previous milestone.
- Responsive controls and screen-reader configuration summaries.

## Focused hardening in this checkpoint

The calculator now rejects out-of-range counts even if future pricing data
accidentally includes them, and prevents unsafe integer totals from enabling
purchase actions. Palette controls no longer reference an absent palette node.
No styling, database, dependencies or production prices changed.

## Still required before production

1. Verify draft reset/refresh end to end with disposable data. Earlier checkpoint
   intentionally avoided deleting the user's populated draft.
2. Broader route/history and keyboard/screen-reader regression review, including
   focus after closing palettes and leaving the unsaved-change prompt.
3. Decide actual prices, available materials/colours, compatibility, lead times,
   fulfilment and product care information. Current prices are development only.
4. Server-side configuration validation and repricing before checkout. Browser
   localStorage values are not trusted orders or authoritative prices.
5. Checkout, shipping, payments, durable order snapshots, and fulfilment workflow.
   These are store-wide milestones, not a frontend-studio polish change.
6. Review cart storage failure feedback and multi-tab behaviour before launch.
   Draft storage feedback exists; cart storage failure is still silent.

## Explicitly deferred

Supplied preview asset integration was skipped by request. Real 3D, database
connection, inventory and admin tools remain separate scoped projects. The
renderer contract is prepared; their implementation is not implied by that.

The frontend studio is feature-rich but is not a production-ready purchasing
system. Do not label all remaining milestones complete or enable checkout until
the relevant business decisions and backend verification are complete.

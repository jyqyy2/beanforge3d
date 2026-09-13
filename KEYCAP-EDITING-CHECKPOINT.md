# Visual cart, saved-design editing and studio drafts

This checkpoint supersedes earlier notes that cart links start a new design
and studio configurations reset on refresh.

- Custom cart rows reuse KeycapPreview in compact mode, including an accessible
  text summary. Standard product rows retain their existing presentation.
- Edit design opens the selected cart configuration. Save replaces that row,
  preserves its quantity and recalculates its development unit price. Matching
  configurations combine quantities; unsafe quantity overflow is rejected.
- Cancel leaves cart state unchanged. Refreshing an edit reloads the saved cart
  configuration, not unsaved changes. Missing/stale edit links show a recovery
  screen rather than adding a new row accidentally.
- The existing cart identity is carried in the edit URL, avoiding a second ID
  system or a migration of saved rows. It is a local lookup, not authorization.
- Normal studio drafts persist under beanforge-keycap-draft, version 1, using
  the existing schema-version-3 configuration plus active count. All eight slots
  are retained. Invalid/unsupported drafts are ignored. Unavailable storage is
  handled without preventing current-session editing.
- Cart editing never overwrites the independent studio draft. Only active,
  complete characters may be saved to cart. Checkout remains unavailable.

Verification: lint, TypeScript/Vite build and whitespace checks; pure-function
smoke checks for pricing/counts 1–8, quantity preservation, merge, missing rows,
incomplete configurations, overflow, malformed drafts and hidden slots. Browser
checks cover draft refresh/restoration, incomplete save blocking via keyboard,
saved edit replacement, cancellation and original saved configuration on reload.
Custom cart widths 320/768/1024 have no page overflow; phone cart preview inspected.
The edited test row was restored to its original HELL/Blue configuration.

No dependencies, Supabase, payment integration or automatic commit introduced.

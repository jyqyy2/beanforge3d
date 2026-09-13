# Draft management

Normal studio mode now reports saving, saved, or failed-to-save status based on
the latest draft write. Storage failures do not prevent current-session editing.
Start new design reveals an inline confirmation using existing button styles.
Keep my design cancels; Confirm new design resets count, board colour and all
eight slots, including symbol colours and hidden slots. Cart data is untouched.
Cart-edit mode does not expose these draft controls. Focus returns to the start
button after either confirmation choice.

Checks: lint, TypeScript/Vite build and whitespace checks passed. Browser verified
saved feedback, confirmation copy, cancellation preserving the populated draft,
no overflow at 320/768 pixels and no captured console errors. Storage helper
smoke checks cover successful eight-slot writes and quota failure. Reset handler
reviewed; destructive confirmation was not clicked on the user's populated draft.
No CSS changes, dependencies or automatic commit.

Pending: end-to-end confirmation/reset/reload test on a disposable draft before
marking this milestone ready for commit. Next milestone is cart-edit safeguards.

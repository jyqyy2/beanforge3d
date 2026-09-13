# Character-colour verification

Each slot supports an optional characterColour for the A–Z/0–9 symbol,
independent of its keycap colour and the global board colour. Omission means
automatic contrast. The existing schema-version-3 records remain supported.
Explicit default colours share identity with their automatic equivalent;
different visible symbol colours produce separate configured-cart identities.
The Close palette button retains its original placement and styling.

Verification completed across this milestone:
- Lint and TypeScript/Vite build passed.
- Staged and unstaged whitespace checks passed.
- Browser: independent symbol colour, automatic contrast following keycap
  colour, existing cart edit links, Close palette and cancellation passed.
- Browser: no page overflow at 320, 768 and 1024 pixels; desktop palette
  visually reviewed; no captured browser console errors.
- Pure-function smoke checks: colour-edit save and immutable original snapshot,
  quantity preservation, matching-design merge, incomplete-edit rejection,
  draft JSON round-trip retaining all eight slot colours for active counts 1–8,
  malformed-draft rejection and unchanged board-plus-character pricing passed.

Draft restoration and merge coverage above is data-level, not a new end-to-end
browser save/reload test. Existing user cart and draft data were not modified by
these regression checks. No additional feature or styling changes were needed.

Next, after this commit checkpoint: draft-management controls and accurate
storage feedback. Cart-edit navigation safeguards follow as a separate milestone.
No automatic commit performed.

# Unsaved-warning focus restoration

Keep editing returns keyboard focus to the last focused character input. If
count has decreased, the target is clamped to a visible input. No style or
cart/persistence changes were made.

Browser verified: change Character 2, attempt cancellation, choose Keep editing;
focus returns to Character 2 and the unsaved value remains. Restoring the original
value permits navigation without a warning; saved HELLO and quantity 1 remain
unchanged. Lint, TypeScript/Vite build and whitespace checks passed.

Suggested commit: restore character focus after unsaved edit warning

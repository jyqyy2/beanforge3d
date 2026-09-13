# Cart storage feedback

Cart and studio now show an alert when the latest cart write fails. In-memory
cart editing continues. A subsequent successful write clears the failure state.
No storage keys, pricing, configuration, routing or styles changed.

Lint, TypeScript/Vite build and whitespace checks pass. Isolated storage-helper
smoke tests pass for successful writes, throwing storage and recovery. Browser
storage-failure UI was not fault-injected; that remains a manual verification.
This addresses write feedback only, not cross-tab synchronization or unreadable
saved-cart recovery. No user storage was modified by the smoke tests.

Suggested commit: show cart storage failure feedback

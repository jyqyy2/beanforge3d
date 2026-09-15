# Local recovery preservation

## Draft recovery UI (2026-09-15)

Unreadable draft initialization now blocks the editor and autosave without changing the original string. Customers can download available draft data or reload/retry. The download is JSON containing the exact current `raw` string and any `preservedRaw` recovery copy, plus an export format/version identifier; it is not a second persistence model. Keeping raw strings allows malformed JSON and unknown schema versions to be preserved without lossy parsing. Cart data is never included.

If browser storage remains inaccessible or neither value exists, download reports failure without modifying storage. Download initiation cannot prove the customer saved the file. No import, automatic repair or Start fresh action is provided in this milestone. Existing legacy recovery copies remain untouched. Cart recovery is unchanged.

Desktop/mobile browser tests verify export contents, original-byte preservation, keyboard activation/focus, no horizontal overflow, normal-draft absence, and reload behaviour.

## Earlier preservation behaviour

Before saving over unreadable cart/draft data, the original raw string is copied to `beanforge-cart-recovery` or `beanforge-keycap-draft-recovery`. These copies stay in the same browser and are never silently replaced by different data. If reading storage or preserving a copy fails, saving returns false and existing save-failure feedback applies.

This is preservation, not automatic repair. Malformed JSON cannot reliably be reconstructed. Do not delete recovery keys or paste their contents into public issue reports. A future recovery interface should let the customer export a copy and explicitly approve removal or replacement. Recovery copies share the browser's quota and are not durable server backups.

Initial read exceptions now latch a per-key write block for the document lifetime, including React StrictMode repeat initialization. A cart read failure blocks cart-provider children; a draft read failure blocks the draft editor. Both show a reload/retry action. Reload creates a fresh read attempt; transient storage recovery alone cannot save an empty fallback over the original. The original bytes are verified unchanged in desktop/mobile browser tests before and after retry. Malformed but readable JSON continues through the recovery-copy path described above.

Still open: customer-facing repair/export workflow, cross-tab conflict policy, real-device acceptance and production business approvals. No database or 3D work is included.

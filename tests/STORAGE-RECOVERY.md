# Local recovery preservation

Before saving over unreadable cart/draft data, the original raw string is copied to `beanforge-cart-recovery` or `beanforge-keycap-draft-recovery`. These copies stay in the same browser and are never silently replaced by different data. If reading storage or preserving a copy fails, saving returns false and existing save-failure feedback applies.

This is preservation, not automatic repair. Malformed JSON cannot reliably be reconstructed. Do not delete recovery keys or paste their contents into public issue reports. A future recovery interface should let the customer export a copy and explicitly approve removal or replacement. Recovery copies share the browser's quota and are not durable server backups.

Still open: customer-facing repair/export workflow, initialization read-failure recovery, cross-tab conflict policy, real-device acceptance and production business approvals. No database or 3D work is included.

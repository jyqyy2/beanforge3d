# Configured cart and linked board preview

This checkpoint supersedes the preview-only cart notes in earlier studio and
cart checkpoints. Complete studio configurations now add to the existing
localStorage cart; checkout, backend validation and production pricing remain
out of scope.

Cart rows optionally carry the existing schema-version-3 KeycapConfiguration.
The studio copies only visible characters into each cart snapshot. Identity
includes the custom product discriminator, schema version, board colour and
ordered character/colour pairs. Standard product/colour identity is unchanged.
Changing the studio after adding does not edit a saved row. Returning through
a custom cart row's studio link starts a new design, as stated in the cart.

Saved custom configurations are checked for version, count 1–8, A–Z/0–9 and
supported colours. Invalid configurations are ignored on reload. Local cart
prices are development snapshots, not trusted checkout quotes; a future backend
must validate and price purchases independently.

The illustrative preview uses linked chamfered housings and recessed centres
based on the supplied top/side reference images, replacing the continuous slab.
It is not a dimensional model and does not reproduce internal mechanical details.
Blank slots show empty housings; populated slots show independently coloured caps.
No dependencies, actual 3D assets or Supabase connection were introduced.

Verification: lint and TypeScript/Vite build; pure count/pricing 1–8, configuration
validation and identity smoke checks; browser duplicate merging, different-colour
separation, snapshot preservation, reload persistence and quantity controls.
Existing standard rows retained their values. Cart widths 320/768/1024 and studio
widths 320/390/768/1024 showed no page overflow. Visual review includes an eight-cap
phone layout. Two custom test rows (three creations total) remain in the local cart.

Awaiting user visual approval before any commit.

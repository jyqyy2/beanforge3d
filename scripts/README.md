# Product image assets

`optimise-images.py` creates 320, 640 and 1280 pixel wide WebP versions of the
three original catalogue JPEGs. Originals are retained. It applies EXIF
orientation, preserves aspect ratio, strips source metadata through conversion,
and uses WebP quality 82. Run with Python and Pillow available:

```sh
python scripts/optimise-images.py
```

Pillow is an asset-generation tool, not a frontend/runtime dependency. The
generated images are checked in, so normal `npm run build` needs no Python.

`ResponsiveImage` supplies width-based srcset candidates; each UI location
provides its display sizes. Browsers choose a candidate based on screen width
and pixel density. Product data still passes through the catalogue boundary.
Unknown URLs, including future colour-specific photos, pass through unchanged.
Known old local JPEG references in persisted carts are mapped for display to
the corresponding WebP set without altering cart contents.

Keep all three widths together when regenerating assets. Review legibility,
colour and crop at mobile/tablet/desktop widths; compression is not a substitute
for accurate product photography. No product image claims or artwork changed.

This milestone reduced the three largest display assets from 13,973,366 bytes
of JPEGs to 167,306 bytes of WebP (about 98.8% smaller). This compares file sizes,
not measured end-to-end page loading time. All nine WebP candidates together
are 260,314 bytes. The browser downloads the selected candidate, not every size.

Verification: lint/build and whitespace checks; browser image-loading and
overflow checks at 390/768/1024 px across homepage, all product routes and cart;
mobile colour/quantity/add flow, restored original cart and refresh persistence;
no observed browser console errors. Database work remains paused.

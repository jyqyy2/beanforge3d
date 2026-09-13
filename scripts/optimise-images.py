from pathlib import Path
from PIL import Image, ImageOps

assets = Path(__file__).resolve().parents[1] / 'src' / 'assets'
for name in ('bean-keycap', 'name-tag', 'qr-stand'):
    with Image.open(assets / f'{name}.jpg') as original:
        image = ImageOps.exif_transpose(original).convert('RGB')
        for width in (320, 640, 1280):
            height = round(image.height * width / image.width)
            resized = image.resize((width, height), Image.Resampling.LANCZOS)
            output = assets / f'{name}-{width}.webp'
            resized.save(output, 'WEBP', quality=82, method=6)
            print(f'{output.name}: {width}x{height}, {output.stat().st_size} bytes')

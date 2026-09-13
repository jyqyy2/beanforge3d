import type { ImgHTMLAttributes } from 'react'

const images = import.meta.glob('../assets/*-*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

export default function ResponsiveImage({
  src,
  alt,
  sizes,
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  const legacyName = src?.match(/^\/(?:src\/assets|assets)\/(bean-keycap|name-tag|qr-stand)(?:-[A-Za-z0-9_-]+)?\.jpg$/)?.[1]
  const path = legacyName
    ? `../assets/${legacyName}-1280.webp`
    : Object.keys(images).find((key) => images[key] === src)
  const srcSet = path?.endsWith('-1280.webp')
    ? [320, 640, 1280].map((width) =>
        `${images[path.replace('-1280.webp', `-${width}.webp`)]} ${width}w`
      ).join(', ')
    : undefined

  return <img {...props} src={path ? images[path] : src} srcSet={srcSet} sizes={srcSet ? sizes : undefined} alt={alt} decoding="async" />
}

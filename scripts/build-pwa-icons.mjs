// Generates the PNG app icons for the PWA manifest and iOS from the logo SVG.
//   pnpm pwa:icons
// Output (public/icons/):
//   pwa-192.png, pwa-512.png        "any" icons — the logo as-is (rounded square)
//   pwa-maskable-512.png            full-bleed green, logo inside Android's safe zone
//   apple-touch-icon-180.png        full-bleed green (iOS rounds the corners itself)
import { mkdirSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import sharp from "sharp"

const root = resolve(import.meta.dirname, "..")
const logoSvg = readFileSync(resolve(root, "public/images/logo-lumbung.svg"), "utf8")
const outDir = resolve(root, "public/icons")
mkdirSync(outDir, { recursive: true })

const BRAND = "#007f51"

/** The logo's inner shapes (everything except its own background rect). */
const inner = logoSvg
  .replace(/^[\s\S]*?<svg[^>]*>/, "")
  .replace(/<\/svg>\s*$/, "")
  .replace(/<rect[^>]*\/>/, "")

/** Full-bleed square with the logo scaled around the centre. */
function fullBleed(scale) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <rect width="120" height="120" fill="${BRAND}"/>
  <g transform="translate(60 60) scale(${scale}) translate(-60 -60)">${inner}</g>
</svg>`
}

async function render(svg, size, file) {
  await sharp(Buffer.from(svg), { density: 384 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(resolve(outDir, file))
  console.log(`  ${file} (${size}×${size})`)
}

console.log("Membuat ikon PWA di public/icons/")
await render(logoSvg, 192, "pwa-192.png")
await render(logoSvg, 512, "pwa-512.png")
// Maskable icons may be cropped to a circle of 80% diameter; 0.8 keeps the art inside it.
await render(fullBleed(0.8), 512, "pwa-maskable-512.png")
await render(fullBleed(0.85), 180, "apple-touch-icon-180.png")

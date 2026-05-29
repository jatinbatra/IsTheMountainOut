# Image asset pipeline

Single source of truth for paths: [`src/lib/assets.ts`](../../src/lib/assets.ts).

## Status

### ✅ Shipped (vector / procedural — authored as production SVG)
These were recreated faithfully from the asset atlas. SVG is intentional:
scalable, a few KB each, crisp at any DPI, and ideal for CSS layering.

| Path | Use |
|------|-----|
| `ui/compass.svg` | Direction-to-Rainier compass rose |
| `ui/pnw-badge.svg` | "Pacific Northwest" seal (footer) |
| `ui/mountain-illustration.svg` | Decorative Rainier illustration |
| `textures/film-grain.svg` | Film-grain overlay |
| `textures/fog-overlay.svg` | Soft fog overlay |
| `textures/vignette.svg` | Edge vignette |
| `maps/topo-map-green.svg` | Decorative topographic layer (green) |
| `maps/topo-map-dark.svg` | Decorative topographic layer (dark/gold) |

### ⬜ Needs real photography (drop files at these exact paths)
These cannot be generated here — they require real PNW photography (or an
image generator). Stock/placeholder imagery is intentionally **not** used.
Once a file exists at the path, it's consumed automatically via the manifest.

| Path | Subject | Ratio |
|------|---------|-------|
| `hero/hero-clear-peak.jpg` | Seattle skyline + Rainier, golden hour | 16:9 |
| `hero/hero-spring-rain.jpg` | Rainy forest road, moody | 16:9 |
| `hero/hero-foggy-morning.jpg` | Foggy Rainier morning | 16:9 |
| `hero/hero-winter-bluehour.jpg` | Winter blue-hour Rainier | 16:9 |
| `viewpoints/kerry-park.jpg` … `snoqualmie-pass.jpg` | Location photos | square-safe |
| `mountain/rainier-clear-day.jpg` … `rainier-snow.jpg` | Weather/season states | 4:3 |
| `textures/cedar-texture.jpg` | Cedar wood grain | tile |
| `atmosphere/atmosphere-fog.jpg`, `atmosphere/sun-rays.jpg` | Mood overlays | 16:9 |

## Optimization guidance
- Export hero/mountain/atmosphere at ~2400px wide, quality ~80.
- Provide `.avif` + `.webp` alongside `.jpg`; `next/image` will negotiate format.
- Preload the active hero (`<link rel="preload" as="image">` / `priority` on `next/image`).

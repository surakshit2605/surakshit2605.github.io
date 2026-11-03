# Design system and creative direction

This file is the source of truth for the visual identity. Recreate it in Figma
as Variables (colours, spacing) and Text Styles, then keep the two in sync.

## Concept

**"The Secure Core."** A glowing network core (a faceted node surrounded by
orbiting nodes and links) is the single recurring 3D object. It does not
decorate the page, it *is* the narrative: the camera and the core reposition
for each section, so the story reads as one continuous shot instead of
separate pages. Network + security = nodes, links, a protected centre.

## Colour tokens (defined in `src/styles/main.css`)

| Token            | Hex       | Use                          |
| ---------------- | --------- | ---------------------------- |
| `--black`        | `#05070d` | Page background              |
| `--navy`         | `#0a1330` | Panels, 3D solid             |
| `--charcoal`     | `#12161f` | Cards, surfaces              |
| `--blue`         | `#2f7bff` | Primary accent, wireframes   |
| `--sky`          | `#8fc8ff` | Subtle highlights, labels    |
| `--white`        | `#eef2f8` | Body and heading text        |
| `--muted`        | `#8b94a7` | Secondary text               |

Rules: one accent colour (electric blue). Sky blue only for small highlights.
No gradients except the single subtle vignette behind the canvas. No neon.

## Typography

- Headings and body: **Space Grotesk** (variable)
- Labels, dates, tags: **JetBrains Mono** (variable), uppercase, wide tracking
- Scale: fluid `clamp()` for display sizes, 16px minimum body

## Layout

- 12-column feeling, max width 1200px, 24px gutters (16px on mobile)
- Each section: label (mono) + title + content, 140px vertical rhythm
- Text sits on the side opposite the 3D core where possible

## Motion principles

1. One easing family (`power3.out` / `power3.inOut`), durations 0.8–1.6s
2. Reveal once, never replay on scroll back
3. The 3D camera moves only on section change, never continuously fights scroll
4. `prefers-reduced-motion`: no scroll animations, no camera tweens, static
   render, content fully visible

## Section → camera map (`KEYS` in `src/scene/scene.js`)

hero, about, education, skills, journey, projects, achievements, contact

## Figma checklist

1. Create Variables from the colour table above
2. Create Text Styles: Display, H2, Body, Label (mono)
3. Build components: Nav, Section header, Card, Tag, Timeline node, Button
4. Frame each section at 1440 / 834 / 390 widths
5. Export any raster previews (project screenshots) to `public/projects/`

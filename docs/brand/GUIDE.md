# Tidemark identity guide

Enough to extend the product without guessing. Tokens live in `web/src/shared/styles/globals.css`.

## The idea

Platforms delete their history. Tidemark keeps it, and shows where the platform's memory ends. A tidemark is the line left
after the water recedes.

Positioning: **Your numbers, kept after the platforms let them go.**

Character: patient, exact, a little salty. World: hydrographic survey, meaning charts, tide tables and soundings.

**The metaphor stays in the brand.** Name, logo, colour and the tide line carry the sea. Interface words are plain:
"Expires in 6 days", never "ebbing".

## Name

`BRAND` in `web/src/shared/lib/brand.ts` is the one place the product name lives in the UI. The `creator-analytics` MCP
server name, Postgres schema and package names stay, so existing agent configuration keeps working.

## Logo

A tide staff: gauge with ticks, one long magenta tick at the mark. `BrandMark.tsx` in the UI, `web/public/favicon.svg` for
the tab. The wordmark is Hepta Slab, sentence case. No tile, gradient or effect.

## Colour

Use the shadcn role names and these tokens, never hex in components.

| Token | Role |
|---|---|
| `paper`, `surface`, `step` | Page, panels, hover and quiet fills |
| `ink`, `ink-2`, `ink-3` | Primary, secondary and tertiary text |
| `shoal` | "Only you have this" band, active navigation, drag state |
| `deep` | Links, focus ring, single-hue bars |
| `overprint` | Expiry only |
| `danger` | Destructive actions and errors |

**`overprint` always means time is running out.** At most twice per screen, flat, never on a button. A calm screen has only
the logo tick. If it appears on a long list, it has stopped meaning anything.

Platform colours are fixed to the platform, never assigned by rank, and used for series only. Text stays in ink tokens.
Blue-yellow colour-blind separation is weak, so a platform is always also labelled and marked with its glyph
(`PlatformBadge`). Re-run `dataviz/scripts/validate_palette.js --pairs all` before changing any of them.

Dark mode is a second selected palette, not an inversion, and is an equal lead. Check both.

## Type

| Face | Use |
|---|---|
| Hepta Slab | Wordmark, page titles, one lead number per screen |
| Schibsted Grotesk | Everything else |
| Noto Sans Arabic | Falls in automatically for Arabic text |
| Spline Sans Mono | Metric values, dates, keys, axes |

Weights 400 and 500 only. Sentence case, no tracking, no uppercase labels. Scale 12, 14, 16, 20, 28, 40. All fonts are
self-hosted: a personal archive makes no third-party calls on load.

User text always gets `dir="auto"`. Emoji in post titles are the author's and stay.

## Numbers

Every metric value goes through `Sounding`. `—` means no data and is never the same as `0`. Compact on screen, exact on hover
and for screen readers. Never sum across platforms or currencies.

## Charts

- One series, in the platform colour. No dual axes.
- Real calendar x-axis. A missing stretch stays a gap.
- The tide line shows wherever the metric has a retention window. It drops once on load, 400ms, and is static under reduced motion.
- Ticks on the baseline mark published posts.
- Keyboard readable with arrow keys, a text summary, and a table view.

## Shape and motion

4px spacing. Radius 3px on controls, 6px on panels. No panel shadows; depth is paper against surface. 120ms hover and press,
180ms sheets, one ease-out curve. `animate-pulse` is for real skeletons only.

## Voice

Plain, exact, unhurried. Say what happened, name the number and the source, give the next step. No exclamation marks, no
apologies, no greetings. An action keeps its name: "Import file" produces "saved", and errors state cause and fix.

| Avoid | Write |
|---|---|
| Dashboard | Today |
| Upserted | Saved |
| Batch #12 | The file name |
| Scope, semantics | Applies to, what it counts |
| `text_post` | Text post |

Destructive actions say exactly what is lost. Deleting an account requires typing its handle, because the platform may
no longer have that history.

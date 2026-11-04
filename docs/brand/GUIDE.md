# UI style guide

The layout follows Postiz. Surfaces are neutral graphite, and the brand violet is the one accent, kept for the primary action,
the leading bar and the chart. Tokens live in `web/src/shared/styles/globals.css`. Components use role names, never hex values.

## Layout

- A slim left rail (88px) with icon-over-label items; a scrolling bottom bar on phones. The active item is a raised `muted` step.
- Rail and content are separate rounded panels on a flat graphite page, 8px apart.
- `PageHeader` is the title bar across the top of the content panel, with filters on the right.
- The dashboard runs stat tiles, then a list beside a chart, then tables.

## Colour

Dark is the default; light is an explicit choice. Values were sampled from the reference art.

| Role | Dark | Light | Use |
|---|---|---|---|
| `background` | `#0F0F10` | `#F4F4F5` | Page |
| `panel` | `#141415` | `#FAFAFA` | Rail and content panels |
| `card` | `#19191B` | `#FFFFFF` | Cards and tables |
| `muted` | `#232325` | `#EFEFF1` | Inputs, quiet fills, the active rail item |
| `accent` | `#2A2A2D` | `#E7E7EA` | Hover fills |
| `primary` | `#6556FB` | `#5B47E9` | Primary button, today, the leading bar |
| `link` | `#A69DFF` | `#4F3BE0` | Links, focus ring |
| `chart` | `#8070FA` | `#5B47E9` | Chart line and fill |
| `success` | `#4CC38A` | `#0B7A50` | Healthy status |
| `warning` | `#F5A524` | `#B45309` | Close to expiring, and the platform's history limit |
| `destructive` | `#F87171` | `#C62828` | Delete and errors |

All text pairs meet WCAG AA in both themes. Use `link`, not `primary`, for text on dark surfaces.

Platforms appear as their own coloured tiles through `PlatformTile`, with official marks. Charts use `chart`, not platform colours.

## Type

Plus Jakarta Sans throughout, with Noto Sans Arabic falling in for Arabic text. Both are self-hosted. Titles and buttons are
medium (500), body is regular, numbers use tabular figures. Sentence case. User text always gets `dir="auto"`.

## Components

- Cards: 12px radius, no border or shadow, 20px padding.
- Controls: 8px radius, 40px tall, filled `muted`.
- Stat tile: label and large number, nothing else.
- List row: 24px platform tile, medium title, muted detail, coloured status on the right.
- Bar lists: neutral bars, `primary` only on the leader.
- Chart: line over a violet fade, with quiet grid lines.
- Tables: muted headers, 48px rows, sortable headers where supported.

## Numbers

Every metric goes through `Sounding`. `—` means no data and is never the same as `0`. Dashboard totals add across platforms,
so one person following on two platforms counts twice. Currencies are never added together.

# UI style guide

The product is styled after Postiz: layout, components and type from its app, with the navy and violet palette of its brand
art. Tokens live in `web/src/shared/styles/globals.css`. Components use role names, never hex values.

## Layout

- A slim left rail (88px) with icon-over-label items; a scrolling bottom bar on phones. The active item is solid violet.
- Rail and content are separate rounded panels on a navy page, 8px apart.
- `PageHeader` is the title bar across the top of the content panel, with filters on the right.
- The dashboard runs stat tiles, then a list beside a chart, then tables.

## Colour

Dark is the default; light is an explicit choice. Values were sampled from the reference art.

| Role | Dark | Light | Use |
|---|---|---|---|
| `background` | `#0B1141` | `#EEF0FB` | Page |
| `panel` | `#0D121C` | `#F8F9FE` | Rail and content panels |
| `card` | `#151823` | `#FFFFFF` | Cards and tables |
| `muted` | `#1E2230` | `#E9EBF7` | Inputs and quiet fills |
| `accent` | `#272463` | `#E2E0FE` | Icon tiles and tinted fills |
| `primary` | `#6556FB` | `#5B47E9` | Buttons, active items, bars |
| `link` | `#A69DFF` | `#4F3BE0` | Links, focus ring |
| `chart` | `#8070FA` | `#5B47E9` | Chart line and fill |
| `success` | `#34D399` | `#0B7A50` | Healthy status |
| `warning` | `#F472B6` | `#C01A78` | Close to expiring, and the platform's history limit |
| `destructive` | `#F87171` | `#C62828` | Delete and errors |

All text pairs meet WCAG AA in both themes. Use `link`, not `primary`, for text on dark surfaces.

Platforms appear as their own coloured tiles through `PlatformTile`, with official marks. Charts use `chart`, not platform colours.

## Type

Plus Jakarta Sans throughout, with Noto Sans Arabic falling in for Arabic text. Both are self-hosted. Titles and buttons are
semibold, body is regular, numbers use tabular figures. Sentence case. User text always gets `dir="auto"`.

## Components

- Cards: 12px radius, no border or shadow, 20px padding.
- Controls: 8px radius, 40px tall, filled `muted`.
- Stat tile: icon on a tinted tile, label, large number.
- List row: 40px platform tile, bold title, muted detail, coloured status on the right.
- Chart: line over a violet fade, with quiet grid lines.
- Tables: muted headers, 48px rows, sortable headers where supported.

## Numbers

Every metric goes through `Sounding`. `—` means no data and is never the same as `0`. Dashboard totals add across platforms,
so one person following on two platforms counts twice. Currencies are never added together.

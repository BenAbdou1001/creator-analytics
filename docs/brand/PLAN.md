> **Superseded.** The nautical Tidemark direction below was rejected on 2026-11-02. The current style is in `GUIDE.md`. This plan remains as a record of the product audit and the features it produced.

# Brand and UI/UX identity plan

Status: implemented on branch `brand-identity`; section 12 lists what was cut. Working name: **Tidemark** (not cleared).

Evidence base: code reading of `web/`, `backend/` and the Alembic seed, then a readiness run on 2026-11-01 against the
real database. Section 11 records what that run changed; where it conflicts with earlier sections, section 11 wins.

## 1. What the product actually is

The README says "one place for your numbers". The code says something sharper.

- **Who:** one creator running their own YouTube, TikTok, Instagram and LinkedIn accounts. Self-hosted, no auth,
  no teams, no public site.
- **How data arrives:** nothing is automatic. A person uploads CSV/XLSX exports, or an agent writes through MCP
  (`sync_content`, `sync_account_metrics`, `sync_relationships`, `import_file`).
- **What makes it unusual:**
  - Platforms delete their history, and the catalogue records when: 100 metrics seeded, 59 with a retention window
    (Instagram 90 and 730 days, LinkedIn 90 to 1000, TikTok 365, YouTube none recorded). The window values are seed
    data and have not been re-checked against the platforms.
  - It remembers what platforms hide: `deleted_observed_at` ("Not seen since"), `v_inferred_unfollows`, follower
    snapshots.
  - Every value has provenance: `import_batches` with a file SHA-256, `captured_at`, `verification`.
  - Agents are first-class users. The MCP tools call the same services as the REST API.
- **The job:** get your numbers out before the platform forgets them, then keep them, with proof of where they
  came from.

Positioning line: **"Your numbers, kept after the platforms let them go."**

Everything in the current UI treats this as a generic dashboard. The one place the idea surfaces is a red number in
a catalogue column. The brand should be built on that idea, and the home screen should lead with it.

## 2. Audit of what exists

Verified in code:

| Area | Finding | Where |
|---|---|---|
| Identity | Default shadcn neutrals, a stock Lucide chart icon as logo, product name repeated in the top bar | `globals.css`, `AppSidebar.tsx`, `__root.tsx` |
| Leftover tell | Dark sidebar primary is shadcn's stock violet, `oklch(0.488 0.243 264)` | `globals.css:64` |
| Type | `Inter` is declared but no font is ever loaded, so the app renders in the system fallback | `globals.css:109` |
| Type | Uppercase labels on stat tiles and every table header | `StatTiles.tsx`, `DataTable.tsx` |
| Layout | Five equal tiles, then equal account cards, then chart, then table. Nothing leads | `DashboardPage.tsx` |
| Honesty | Tiles sum followers and views across platforms. The same person counts twice, and LinkedIn falls back to impressions on its card | `StatTiles.tsx`, `AccountCards.tsx` |
| Unused value | `v_expiring_metrics` and `v_inferred_unfollows` are not used in the UI. No screen covers audience breakdowns, retention curves, revenue, comments or messages, although the tables exist | `features/` |
| Expiry | `v_expiring_metrics` only sorts the catalogue. It does not know what you have captured, so it cannot say what you are about to lose | Alembic initial schema |
| States | No route pending or error component; 404 is one line of text | `__root.tsx`, `router.tsx` |
| Theme | Follows the OS only, with no toggle. The comment mentions `data-theme`, which the code does not read | `theme.ts` |
| Accessibility | Table rows are click-only, so no keyboard access. Chart is pointer-only. No skip link. No `aria-sort`; sorting is a separate select | `DataTable.tsx`, `LineChart.tsx`, `ContentPage.tsx` |
| Flow | Post detail renders below the table, out of view, and focus does not move. A `Sheet` component already exists | `ContentDetail.tsx` |
| State | Trend chart selection is `useState`, so it cannot be linked or restored. Search only fires on Enter | `TrendCard.tsx`, `ContentPage.tsx` |
| Safety | Deleting an account cascades through all its data behind a `window.confirm` | `AccountsPage.tsx:38` |
| Import | Three decisions and a paragraph of rules before upload; the result is one sentence | `ImportForm.tsx`, `ImportSummary.tsx` |
| Copy | Engineer vocabulary: "upserted", "Batch #", "scope", "semantics", raw enum values in selects | Imports, Metrics |
| Dependency | `cn` npm package is installed and never imported. `shared/lib/utils` provides `cn` | `package.json` |
| Docs | README still lists `db/`, which this working tree deletes | `README.md` |

## 3. Direction

```
Product    Keeps one creator's platform numbers after the platforms delete them, with proof of origin.
Character  Patient, exact, a little salty.
World      Hydrographic survey: nautical charts, tide tables, soundings, tide gauges.
Signature  The tide line, a marked boundary on every time chart: left of it, only you still have this.
Risk       A chart-magenta accent and slab headings in an analytics tool.
```

Why this world: a tide table is a list of when things go under, which is precisely this product's job. A tidemark is
the line that stays after the water recedes. The metaphor is structural, not decorative.

Considered and rejected:

- **Ledger or archive on cream paper with a serif.** The obvious fit for "records", and two of the current AI-design
  defaults at once (cream and terracotta, broadsheet hairlines).
- **`ui-ux-pro-max` output (blue and amber, Fira Code and Fira Sans).** Sound rules, generic result. It would fit any
  BI tool. Its data-dense style guidance is kept; its palette and fonts are not.
- **Creator-economy bright gradients.** Sells energy. This product sells keeping.

Guardrail: **the metaphor stays in the brand layer.** Interface words are plain. A user reads "Expires in 6 days",
never "ebbing". Name, logo, colour and the line carry the sea; labels do not.

### Name

| Name | For | Against |
|---|---|---|
| **Tidemark** (recommended) | The line left behind. Says the idea, reads well as a wordmark | Used by other companies; not cleared |
| Holdfast | The root that anchors kelp to rock. Strong verb | Less obvious, says nothing of time |
| Soundings | Survey term for measured depths | Reads as audio |

## 4. Identity system

### Logo

A tide staff: a vertical gauge with ticks, one long tick in magenta at the mark. Flat, one or two colours, drawn on a
16px grid so it survives as a favicon. Wordmark in Hepta Slab, sentence case. No tile, no gradient.

```
 ┤
 ┤
 ┼━━   Tidemark
 ┤
 ┤
```

### Colour

Named from chart printing. Roles, not raw hex, reach components. Contrast below was measured.

| Token | Light | Dark | Role | Measured |
|---|---|---|---|---|
| `--paper` | `#F2F6F5` | `#0C181C` | Page | |
| `--surface` | `#FBFCFB` | `#122227` | Panels, tables | |
| `--ink` | `#12282E` | `#E4ECEA` | Primary text | 14.1 / 13.6 |
| `--ink-2` | `#3F555B` | `#A9BABA` | Secondary text | 7.2 / 8.1 |
| `--ink-3` | `#5A6F74` | `#8A9EA0` | Tertiary text | 4.9 / 5.8 |
| `--shoal` | `#DCEBEE` | `#173640` | "Held only here" band, selection | ink 12.5 / 10.7 |
| `--deep` | `#1F5F73` | `#7CC3D6` | Links, focus ring | 6.9 / 8.3 |
| `--overprint` | `#A3176A` | `#F27DBC` | Accent: expiry and the tide line only | 6.7 / 6.6 |
| `--danger` | `#B3261E` | `#F2857A` | Destructive actions, errors | 6.4 / 6.6 |

`--overprint` is the magenta charts use for navigational notes. Rule: **it always means "time is running out here"**,
at most twice per screen, flat, never on a button or gradient. Primary buttons are `--ink`. Light is the brand's lead
mode; dark is a "night chart" and stays blue-black, so it does not read as near-black plus one neon.

Hairlines are `--ink` at 12%. No shadows on panels; depth comes from paper against surface. Overlays alone get one
soft shadow.

### Platform colour

Fixed slots, assigned to the platform and never by rank. Validated with `dataviz/scripts/validate_palette.js --pairs all`.

| Platform | Light | Dark |
|---|---|---|
| YouTube | `#C8322B` | `#CC3F3A` |
| TikTok | `#0F8F7E` | `#129C86` |
| Instagram | `#B97F0F` | `#B58E14` |
| LinkedIn | `#2F6DB8` | `#4A84DC` |

Results: all checks pass in both modes. Worst CVD pair ΔE 8.8 light, 9.6 dark. Normal-vision floor 15.5 light, 17.0
dark. Tritan separation is weaker (5.9 and 3.5), so colour never identifies a platform alone: every series gets a
direct label and a platform glyph.

Instagram moves from pink to ochre so nothing competes with the accent. Glyphs are official marks, unmodified, in
`--ink-2`, as four inline SVGs. Text uses ink tokens, never series colours.

### Type

| Role | Face | Use |
|---|---|---|
| Display | Hepta Slab | Wordmark, page titles, one lead number per screen. Weight 500 |
| Body and UI | Schibsted Grotesk | Everything else. 14px base in tables, 16px in forms and prose |
| Soundings | Spline Sans Mono | Every metric value, date, key and axis label. Tabular by nature |

All three are published as `@fontsource-variable/*` (5.3.0 confirmed on npm). Self-hosted, because a personal archive
should not call Google on load. Scale: 12, 14, 16, 20, 28, 40. Weights 400 and 500 only, sentence case throughout.

Numbers are the hero of this product, so they get their own voice: a `<Sounding>` component with one formatter.
Compact by default, exact on hover and focus, `—` for no data, and always the same unit treatment. It replaces the
current mix of `num()` and `toLocaleString`.

### Shape, spacing, motion

- 4px spacing scale. Radius 3px on controls, 6px on panels. No pills except status text.
- Motion: 120ms for hover and press, 180ms for sheets, one ease-out curve. No `animate-pulse` except real skeletons.
- One orchestrated moment: on chart load the tide line draws down once, 400ms. Static under `prefers-reduced-motion`.

### Voice

Plain, exact, unhurried. States what happened, names the number and the source, gives the next step.

| Now | Becomes |
|---|---|
| Dashboard | Today |
| Batch #12: 40 items upserted, 312 metric values stored. | 40 posts and 312 values saved from `studio-export.csv` |
| Ignored columns: x, y | 2 columns not recognised: x, y. Add them to the catalogue or ignore them |
| No daily data for this metric yet. | Nothing saved for Watch time yet. Export it from Studio › Analytics › Overview |
| Not seen since 2026-06-20 | Removed from TikTok around 20 Jun 2026. Your copy is safe |
| kept for 90 days | TikTok keeps this 90 days |

## 5. Information architecture

Names come from what the person controls, and the first group is what they do weekly.

```
Tidemark
  Today          what expires next, one trend, recent posts       /
  Posts          every post across platforms                      /content
  Audience       followers, demographics, who left                /audience   (new)
  Earnings       revenue by source                                /earnings   (new)
  Bring in data  upload, history, coverage by date                /import

  Reference
  Metrics        catalogue with expiry                            /metrics
  Accounts       your four accounts                               /accounts
  Raw tables     browse and edit any table                        /data

  footer: last saved, theme, agent connection (MCP)
```

Keep existing URLs. Mobile uses the existing sidebar sheet. Comments and messages stay off the nav until there is data
to show; see Phase 5.

## 6. Signature screens

### Today

Replaces tiles and cards. One lead element, then quiet rows.

```
┌ Today ──────────────────────────────────────────── Last saved 2 days ago ┐
│                                                                          │
│  6 days      TikTok daily views start falling off          [Export steps]│
│  ─────────── ───────────────────────────────────────────────────────     │
│  Expires next                                                            │
│    6 days   TikTok      Video views        last saved 12 Oct             │
│   21 days   Instagram   Reach              last saved 28 Oct             │
│   38 days   LinkedIn    Profile viewers    never saved                   │
│                                                                          │
│  ┌ Trend: account ▾  metric ▾  range ▾ ───────────────────────────────┐  │
│  │░░░░░░░░░░░░░░░░░░░░░░░░░░│                                         │  │
│  │░░░ only you have this ░░░│  platform still shows this      ╱──     │  │
│  │░░░░░░░░░░░░░░░╱──────────┼────────────────────────────────╱        │  │
│  └──────────────────────────┴─────────────────────────────────────────┘  │
│                                                                          │
│  Accounts: one row each, platform, followers, change, last saved         │
│  Recent posts: compact table                                             │
└──────────────────────────────────────────────────────────────────────────┘
```

No cross-platform totals. Followers and views are shown per platform, because summing them overstates reach.

Empty state is onboarding: add an account, pick the first export, see the first line appear. It is written as steps
because it is one.

### The tide line

Lives in the shared `LineChart`, for any metric with a `retention_days`:

- A vertical `--overprint` line at `today − retention`, labelled "TikTok keeps from here".
- Left of it, a `--shoal` band labelled "Only you have this".
- For metrics with no recorded window, no line. The chart does not imply a limit.
- Gaps in capture render as gaps, not interpolated lines.
- Keyboard focusable points, exact values on focus, the existing table view retained, a text summary as the label.

### Bring in data

One drop zone. Detect platform and file kind from headers, then show a preview: columns matched, columns not
recognised, date range, and how much is new. Confirm, then show the result with a coverage strip per metric, so the
person sees the gap they just closed. The rules paragraph moves into per-platform "where to export this" steps, using
`gui_path` from the catalogue.

### Post detail

A `Sheet` with URL state (`?post=id`), so it opens over the list, takes focus, closes back to the row and can be linked.
Header shows provenance: captured when, from which file. Removed posts get a clear marker.

### Provenance

A reusable "where this came from" popover on any value: file, SHA-256, import date, verification state. Small to build
and only this product can have it.

## 7. Backend required

The signature needs one thing that does not exist: an account-aware expiry query. Add `GET /dashboard/expiring`,
returning per account and metric: `retention_days`, last captured `period_end`, and
`days_left = last_end + 1 + retention − today`. Never captured means data is being lost now. Expose it as an MCP tool
too, so an agent can answer "what do I need to export this week?".

Also needed: `retention_days` on the timeseries response, breakdown and revenue read endpoints for Phase 5. Generic
table reads may be enough to start.

Ship a test for `days_left` covering never-captured, boundary-day and no-retention cases; this logic drives the headline.

## 8. Engineering plan

Stays as is: TanStack stack, feature folders, shadcn primitives, `NativeSelect`, hand-rolled SVG chart. No chart library.

| Change | Detail |
|---|---|
| Tokens | Replace `globals.css` values under the existing shadcn variable names, so `ui/*` inherits. Add `--shoal`, `--deep`, `--overprint`, font and motion tokens |
| Deps | Add three fontsource packages and `alert-dialog` via shadcn. Remove unused `cn` |
| New shared components | `Sounding`, `PlatformMark`, `TideLine` (inside the chart), `ExpiryRow`, `EmptyState`, `Provenance`, `CoverageStrip` |
| `DataTable` | Sentence-case headers, real link or button in the row, `aria-sort` with clickable headers, sticky header, one row height |
| Layout | Remove `max-w-6xl` on data-heavy pages, keep a readable measure for forms |
| Root | Skip link, route pending, error and not-found components, focus to `main` on navigation |
| URL state | Trend selection and post detail in search params, debounced title search |
| Theme | System, light, dark toggle in the footer, persisted; `theme.ts` is reduced to one rule |
| Delete | `AlertDialog` for account delete: state what is lost and require typing the handle. This data may no longer exist anywhere else, so it is not optional |

Quality floor, per screen: keyboard pass, AA contrast in both modes, 320, 768, 1024 and 1440px, reduced motion, and
loading, empty and error states.

## 9. Phases

Each ends in something visible and can stop there.

| # | Work | Done when |
|---|---|---|
| 0 | Run the app with seed-like data, screenshot every page. Settle the name with a trademark check. Build one static specimen of Today in light and dark with real tokens | You approve the specimen |
| 1 | Foundation: tokens, fonts, logo, favicon, `Sounding`, `PlatformMark`, theme toggle, root states | Every page is on-brand with no layout change |
| 2 | Shell and vocabulary: nav, renames, copy pass, table fixes | Keyboard pass on every page |
| 3 | Signature: expiring endpoint, MCP tool, Today, tide line, provenance | Test passes; Today answers "what do I export next?" |
| 4 | Screens: Posts with sheet, Bring in data preview, Metrics, Accounts, Raw tables | `unslop` audit finds nothing heavy |
| 5 | New surfaces: Audience, Earnings. Comments and messages only if data exists | Each has a real data source and empty state |
| 6 | Identity pack: `docs/brand/` guide, logo files, README rewrite, MCP tool wording | Another agent can extend the UI from the guide alone |

Phase 5 depends on data that may not arrive. No service writes `revenue_facts` or `retention_curve_points`, so today only
the generic `create_rows` can fill them. `breakdown_facts` has one writer, in `crud_metric.py`. Add import paths first.

## 10. Open risks

- **Magenta and slab are the risk taken.** The specimen decides. Fallback accent is a deep buoy orange; fallback display
  is Schibsted Grotesk at weight 500.
- **Retention windows are the headline.** If seeded values are wrong, the home screen is confidently wrong. Check the 59
  values against platform docs in Phase 3.
- **`days_left` assumes a rolling window** and daily data. Metrics with only lifetime values need different wording.
- **The product depends on the habit of exporting.** The design can show urgency, but nothing notifies the person
  outside the app. A scheduled agent run over MCP is the natural answer and is out of this plan's scope.

## 11. Readiness run, 2026-11-01

Passed: web typecheck and build, Alembic at head, backend test on a throwaway database, API and all six pages respond
(`/content` and `/data` redirect to add default search params), screens render on real data.

Real data: one LinkedIn account, 12 posts, 1,112 account values. Three metrics have daily history, 2025-10-29 to
2026-10-28. No other platform has data.

Changes to the plan:

1. **Dark is equal lead, not secondary.** This machine runs in dark mode and the app follows the OS, so dark is what
   gets seen daily. Judge the specimen in dark first. Overrides section 4.
2. **Arabic is a requirement.** One real post title is Arabic, and the Latin faces chosen do not cover it. Add an Arabic
   face to the body stack, picked and tested in Phase 0, and set `dir="auto"` on user text. Titles also contain emoji,
   which are the author's content and stay. Truncation currently cuts that title on the wrong side.
3. **The Today mock is not what the data says.** Saved daily metrics have 362 days left, so "6 days" is fiction today.
   The lead needs a calm state ("Nothing at risk for 11 months") and a second lead, gaps: metrics never saved daily.
4. **`days_left` must count period kinds.** Comments, Reactions and others exist as `range` values but not `day`, so a
   day-only query reports them as never saved. The endpoint reports saved at day level, range only, or never.
5. **The tide line is nearly invisible at first.** The window is 365 days and the history is 368 days old at the left
   edge, so the "only you have this" band is about 3 days wide. It grows with time. The specimen must show this honest
   state as well as an aged one, and the signature must not depend on the band being large.
6. **Demo data needs its own database.** Multi-platform colour, marks and the expiring list cannot be judged on LinkedIn
   alone. Seed a separate `creator_demo` database, never the real one, and point the backend at it with `DATABASE_URL`.
7. **Mark post dates on the trend.** The real series is near zero with sharp spikes, so a plain line explains little.
   A post marker on the axis connects each spike to its cause. This is the single largest UX gain the data suggests.
8. **`0` is wrong where there is no data.** "Content views 0" shows on a LinkedIn-only account, which has no views. Fixed
   by removing totals, and `Sounding` must keep `—` distinct from `0`.
9. **Tables clip at 1440px.** The last columns, saves and engagements, need horizontal scroll inside `max-w-6xl`. Hide
   columns that have no values for the current platforms, including Views for LinkedIn.
10. **Run tests away from real data.** `uv run pytest` defaults to the real database and writes to it, though it cleans
    up after itself. Use a disposable database via `DATABASE_URL`; fix the default in Phase 1.

Must happen before Phase 1:

- Commit the current refactor. 26 tracked files differ from the only commit, plus the new backend and `web/src/features`,
  so without a baseline no brand change can be reviewed or reverted.
- Decide whether `unslop/` (3.9 MB, already installed as a skill) belongs in the repo. Recommended: remove it from the
  project or ignore it.

## 12. Implementation notes, 2026-11-01

Built: phases 0 to 6, with the section 11 changes. The approval gate in Phase 0 was skipped at the owner's request to
implement everything. The identity guide is `GUIDE.md`.

Added beyond the plan: `POST /imports/preview` runs the real import and rolls back, so preview numbers are exact.
`sync_revenue` is the write path for Earnings.

Cut or reduced:

- Retention values were not re-checked against platform docs. This still needs doing, because Today's headline depends on them.
- Expiry covers account-level metrics only. Post-level windows, such as Instagram's 730 days, are not tracked.
- Earnings has no file import, only `sync_revenue`.
- Retention curves, comments and messages have no UI. The tables are empty today.
- Follower change on the accounts table, agent connection status in the footer and sticky table headers were dropped.
- Exact values show on hover and to screen readers, not on keyboard focus, to avoid a tab stop in every cell.
- Provenance is an inline line on the trend and the post sheet, not a popover on every value.
- Sort is descending only.

# Importing data

Creator Analytics never scrapes the platforms or calls their APIs. Data comes in three ways:

1. **File imports**: the CSV and XLSX exports the platforms offer, through the web app's Import page, the REST API or the
   `import_file` MCP tool.
2. **Syncs**: structured data sent by an AI agent (MCP `sync_*` tools) or any script (REST `/api/v1/sync/*`).
3. **Manual edits**: the Accounts, Posts and Data pages, or the generic table endpoints and tools.

Every import and sync is recorded in `import_batches` with its source, the file name and, for files, its SHA-256 hash.
The web app shows this as the "Saved from …" line under numbers.

## Which metrics expire

Platforms only keep part of their history. The **Metrics** page lists every metric in the catalogue, how long its
platform keeps it and where in the platform's interface to export it. The dashboard's **Expiring soon** panel, and the
`expiring_metrics` MCP tool, show what each account has saved and how many days are left before unsaved days start
being lost.

## File imports

### Import page

1. Choose the account the file belongs to.
2. Drop the file. The app runs a **dry run** and shows exactly how many posts and values will be saved. Nothing is
   stored yet. If the same file was imported before for that account, the preview says so.
3. Click **Import file** to save it.

**File options** lets you override the detected file kind, the default content type for new posts, and the period of
each row (day by default).

### Supported files

**LinkedIn analytics `.xlsx`** (Analytics › Export). Detected automatically. Reads daily impressions and engagements,
followers, posts and demographics.

**CSV, one row per post**, for example YouTube Studio › Content › Export.

- Needs an id column: `Content`, `Video ID`, `Post ID`, `external_id`…
- `Video title`, `Video publish time`, `Duration`, `url` and `type` are read as post fields.
- Values are stored as lifetime totals for each post.

**CSV, one row per date**, for example YouTube Studio › Analytics › Advanced mode › Export current view.

- Needs a `Date` column.
- Values are stored as account metrics for that day (or the period chosen in File options).

### How columns are matched

Any other column is matched to `metric_definitions` by `metric_key` or by its GUI `label`, case-insensitive, so `Views`
and `Watch time (hours)` work as they come out of the platform. Unmatched columns are reported back and skipped, `Total`
rows are skipped, and posts are upserted by `(platform, external_id)`, so importing a newer export updates existing posts
instead of duplicating them.

### Through the REST API

```bash
# dry run
curl -F account_id=1 -F file=@content.csv http://localhost:8000/api/v1/imports/preview
# import
curl -F account_id=1 -F file=@content.csv http://localhost:8000/api/v1/imports
```

Optional form fields: `kind` (`auto`, `content` or `account_metrics`), `default_content_type`, `period_kind`.

## Syncs

Syncs are snapshot syncs, which matches how the data model works:

| Sync | Behaviour |
|---|---|
| Content (`sync_content`, `POST /sync/content`) | Upserts posts by `(platform, external_id)` and stores a metrics snapshot for each. With `full_snapshot`, posts missing from the list get `deleted_observed_at`. |
| Account metrics (`sync_account_metrics`, `POST /sync/account-metrics`) | Stores daily or ranged account-level values. |
| Revenue (`sync_revenue`, `POST /sync/revenue`) | Stores earnings per source, period and currency. Currencies are never added together. |
| Relationships (`sync_relationships`, `POST /sync/relationships`) | Upserts a follower / subscriber / connection list. With `full_snapshot`, people who disappeared get `ended_inferred_at` (see `v_inferred_unfollows`). |

Metric names in syncs may be the `metric_key` or the GUI label, as in file imports. Each call creates one
`import_batches` row.

## Content briefs

`content_briefs` holds the creative decisions behind a post: topic, format, hook, script, editing and written copy.
Briefs are written by hand in the post editor or by an AI agent through `create_rows`, never by imports or syncs.

- A post can have several briefs, one per version. The newest `brief_id` is the current brief, and `active_from`
  records when each version went live.
- `v_content_performance` gives one row per post: its numbers, its current brief, `caption_length`, `engagement_rate`
  (per view, or per impression when a platform has no views), `brief_count`, and `followers_3d`.
- `followers_3d` is the followers gained on the publish day and the two days after, from the account's daily follower
  metric, split equally between posts published within two days of each other. It is empty when those days are not
  saved.
- The Posts page's **What worked** breakdown averages views or engagement rate per brief field. By default it counts only
  single-version posts, because a post's lifetime numbers mix all of its versions.

After an import, the Posts and Import pages show how many posts have no brief. An AI agent can draft them; see
[MCP setup › Drafting briefs](mcp-setup.md#drafting-briefs-with-an-agent).

## Experiments

Plan a post before publishing it (Posts › **Plan a post**): a draft post with its brief and a **hypothesis**. After the
post goes live and the next export is imported, link the plan to the real post; the brief moves onto it. From a week
after publishing, the post page compares it with your typical (median) post and asks for a verdict: confirmed, not
confirmed or unclear. The Posts page tracks what is planned, ready to review and still settling, and **What worked**
lists field combinations you have never tried.

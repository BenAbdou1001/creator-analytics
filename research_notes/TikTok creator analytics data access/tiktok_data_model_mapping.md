# TikTok data sources mapped onto the creator-analytics data model, and a TikTok ingestion architecture (late 2026)

Conventions used in these notes:
- **Codebase citations** are `path:line`, relative to the repo root `C:/Users/User/Documents/Abdou-Work/tau/creator-analytics`. `MIG` means `backend/alembic/versions/2026_10_29_1244-ad3132ff58f0_initial_schema.py`.
- **Source names.**
  - **DISPLAY**: Login Kit + Display API v2 (`/v2/user/info/`, `/v2/video/list/`, `/v2/video/query/`).
  - **BIZ**: TikTok API for Business organic "Accounts API" (`/business/get/`, `/business/video/list/`, comments).
  - **STUDIO**: TikTok Studio / web analytics CSV/XLSX download.
  - **DYD**: "Download your data" archive (JSON/TXT), or its programmatic twin, the Data Portability API.
  - **MANUAL**: manual or agent entry through the existing MCP `sync_*` tools.
- **How verified each claim is.**
  - **[official]**: from a developers.tiktok.com or ads.tiktok.com page fetched for these notes, or for the earlier note `research_notes/Meta and YouTube API feasibility/tiktok_linkedin_apis.md`.
  - **[SDK]**: the third-party Go SDK `github.com/bububa/tiktok-business`. Its struct doc comments are paraphrased from TikTok's own Business API docs, so it is the closest thing to the official field list that could be retrieved. business-api.tiktok.com itself could not be fetched.
  - **[connector]**: Windsor.ai, Adriel, Zernio or Adverity docs.
  - **UNVERIFIED**: no source was retrieved in this session.

---

## Q1. Every TikTok catalogue row: best source, API field, unit conversion, backfill, snapshot-only?

### Takeaway
All 23 TikTok rows are at `MIG:124-147`, inside the `SEED_METRICS` SQL string (`MIG:95-98`). Their sources split three ways:
- **BIZ covers 13 of the 23 rows**: 5 of the 10 account rows and all 8 content rows. Per-video `saves`, watch time, average watch time, full-watch rate and new followers exist **only** in BIZ.
- **DISPLAY covers only the 5 public counters**: follower count and per-video views, likes, comments and shares. These are lifetime values, and any history has to be built by snapshotting.
- **The rest have no API**: account-level range uniques (total, new and returning viewers), the 3 LIVE rows and the `estimated_rewards` revenue row. They stay on STUDIO export or MANUAL/agent entry.

### Cited Findings

**Catalogue rows.** All rows have `verification='verified_official'`. The table columns are `(platform, scope, metric_key, label, definition, unit, semantics, requires, retention_days, gui_path, verification)` (`MIG:97-98`).

**Account rows** (`MIG:125-134`): all count, `retention_days=365`, `gui_path` under "TikTok Studio > Analytics".

| line | metric_key | semantics | Best source → field | Conversion / storage | Backfill? |
|---|---|---|---|---|---|
| 125 | `video_views` | period | BIZ `metrics[].video_views` (daily) | 1 row per day, `period_kind=day` | Yes, ≤60 days. `start_date` max lookback is 60 days [SDK] |
| 126 | `profile_views` | period | BIZ `metrics[].profile_views` (daily) | day | ≤60 days. [SDK] says it is returned only for Business accounts with completed business registration. [connector] Zernio claims `user.insights` gives it for personal accounts too: **conflict** |
| 127 | `likes` | period | BIZ `metrics[].likes` (daily) | day. "Does not subtract unlikes" [SDK] | ≤60 days |
| 128 | `comments` | period | BIZ `metrics[].comments` | day | ≤60 days |
| 129 | `shares` | period | BIZ `metrics[].shares` | day | ≤60 days |
| 130 | `total_followers` | point_in_time | BIZ `metrics[].followers_count` (per date) or `data.followers_count`; DISPLAY `follower_count` (`user.info.stats`) | DISPLAY: write an `account_profile_snapshots.follower_count` plus a `total_followers` fact with `period_kind=snapshot` | BIZ: ≤60 days of per-date totals. DISPLAY: none, snapshot only |
| 131 | `net_followers` | period | BIZ `metrics[].daily_new_followers` minus `daily_lost_followers`. Fallback: the difference between consecutive DISPLAY `follower_count` snapshots | day. **Feeds `followers_3d`** (see Q2) | BIZ ≤60 days. DISPLAY only forward, derived |
| 132 | `total_viewers` | period (unique) | BIZ `metrics[].unique_video_views` is a **daily** unique count. Daily uniques cannot be summed into a range | Store as `period_kind=day` only. For 7/28/60-day ranges use STUDIO or MANUAL | Daily ≤60 days. No range uniques from the API |
| 133 | `new_viewers` | period | No account-level API field. BIZ has only a per-video `audience_types` `NEW_VIEWER` % | STUDIO / MANUAL | Export window only |
| 134 | `returning_viewers` | period | Same as above (`RETURN_VIEWER` per video only) | STUDIO / MANUAL | Same |

**Content rows** (`MIG:135-143`): `retention_days=NULL`, `gui_path` "TikTok Studio > Content > post > Analytics".

| line | metric_key | unit / semantics | DISPLAY field | BIZ field (`/business/video/list/`) | Conversion |
|---|---|---|---|---|---|
| 135 | `views` | count / lifetime | `view_count` | `video_views` ("replays count toward views", T+24-48h) [SDK] | None |
| 136 | `likes` | count / lifetime | `like_count` | `likes` | None |
| 137 | `comments` | count / lifetime | `comment_count` | `comments` | None |
| 138 | `shares` | count / lifetime | `share_count` | `shares` (includes in-app "Send to friends") [SDK] | None |
| 139 | `saves` | count / lifetime | **none** | `favorites`. The Go SDK JSON tag is spelled `favorities`, so **verify the real key** | None |
| 140 | `total_play_time_sec` | seconds / lifetime | none | `total_time_watched`, "in seconds" [SDK]. Windsor and Adriel say "unit not stated" | Probably none. Verify on the first real video |
| 141 | `avg_watch_time_sec` | seconds / rate | none | `average_time_watched` (seconds) [SDK] | None |
| 142 | `watched_full_pct` | percent / rate | none | `full_video_watched_rate`, **a ratio such as 0.0395** [SDK] | ×100 to match `unit='percent'` |
| 143 | `new_followers` | count / lifetime | none | `new_followers` [SDK] | None |

**LIVE and revenue rows** (`MIG:144-147`):

| line | key | Source |
|---|---|---|
| 144 | live `unique_viewers` | No API in DISPLAY or BIZ (neither SDK model has LIVE fields). STUDIO LIVE analytics or MANUAL |
| 145 | live `peak_concurrent` | MANUAL (LIVE Center). Also fills `live_sessions.peak_concurrent` |
| 146 | live `diamonds` | MANUAL. Also a `revenue_facts` candidate (`revenue_source='gifts/Diamonds'`, `fact.py:106`) |
| 147 | revenue `estimated_rewards` | MANUAL (no Creator Rewards API was found) |

**Supporting source facts**
- **DISPLAY Video Object fields**: id, create_time, cover_image_url (**6-hour TTL**), share_url, video_description, duration, height, width, title, embed_html, embed_link, like_count, comment_count, share_count, view_count, is_aigc. There are no watch-time, reach or audience fields — [TikTok Video Object](https://developers.tiktok.com/doc/tiktok-api-v2-video-object) [official, via the earlier note]
- **`user.info.stats`** gives follower_count, following_count, likes_count and video_count. `video_count` counts only public videos — [Get User Info](https://developers.tiktok.com/doc/tiktok-api-v2-get-user-info) [official]
- **`/business/get/` request**: `start_date` and `end_date` are UTC `YYYY-MM-DD` and inclusive. **Maximum lookback is 60 days**, the default range is the last 7 days, and the end defaults to yesterday. — [bububa/tiktok-business model/business](https://pkg.go.dev/github.com/bububa/tiktok-business/model/business) [SDK]
- **`/business/get/` per-day `metrics[]`**: `date`, `video_views`, `unique_video_views`, `profile_views`, `likes`, `comments`, `shares`, `phone_number_clicks`, `lead_submissions`, `app_download_clicks`, `bio_link_clicks`, `email_clicks`, `address_clicks`, `daily_total_followers` (the Go SDK tag reads `daily_total_viewers`, but Windsor calls it `daily_total_followers`, "Daily Total Followers Growth": **verify**), `daily_new_followers`, `daily_lost_followers`, `followers_count`, `audience_activity[]{hour,count}` (needs ≥100 followers) and `engaged_audience`. Data lags 24-48 hours. — [SDK](https://pkg.go.dev/github.com/bububa/tiktok-business/model/business); corroborated by [Windsor.ai TikTok Organic fields](https://windsor.ai/data-field/tiktok_organic/)
- **`/business/get/` top level**: `is_business_account` (scope `user.account.type`), `username`, `display_name`, `profile_image` (temporary URL), `profile_deep_link`, `bio_description`, `is_verified`, `following_count`, `followers_count`, `total_likes`, `videos_count`, plus follower `audience_ages` / `audience_genders` / `audience_countries` (top 3) / `audience_cities`, **each needing ≥100 followers** — [SDK](https://pkg.go.dev/github.com/bububa/tiktok-business/model/business)
- **`/business/video/list/` request**: `business_id` (the `open_id` from `/tt_user/oauth2/token/`), `fields[]` (each needs a matching scope), `filters{video_ids, ad_post_only}`, a millisecond `cursor` and `max_count` (≤20). — [SDK video model](https://pkg.go.dev/github.com/bububa/tiktok-business/model/business/video). The path `/v1.3/business/video/list/` is confirmed by [TikTok API for Business docs](https://ads.tiktok.com/gateway/docs/index?doc_id=1762228421622786&identify_key=c0138ffadd90a955c1f0670a56fe348d1d40680b3c89461e09f78ed26785164b&language=ENGLISH) [official]
- **`/business/video/list/` fields**:
  - Metadata: `item_id`, `media_type` (VIDEO/PHOTO), `is_ad`, `thumbnail_url` (expires; see `x-expires`), `share_url`, `embed_url`, `caption`, `video_duration` (seconds, 3 decimals), `create_time` (UTC epoch).
  - Counters: `likes`, `comments`, `shares`, favorites, `reach`, `video_views`, `total_time_watched`, `average_time_watched`, `full_video_watched_rate`, `new_followers`, and the Business-only `profile_views`, `website_clicks` and other button clicks.
  - Breakdowns: `video_view_retention[]{second, percentage}`, `impression_sources[]{impression_source, percentage}`, `audience_genders`, `audience_countries`, `audience_cities` (≥100 followers), `audience_types[]{type ∈ NEW_VIEWER, RETURN_VIEWER, FOLLOWER_PERCENT, NON_FOLLOWER_PERCENT; percentage}` and `engagement_likes[]{second, percentage}`.
  - — [SDK](https://pkg.go.dev/github.com/bububa/tiktok-business/model/business/video)
- **Video metrics are lifetime only** ("an API limitation affecting historical reporting") — [Adverity TikTok Business tips](https://docs.adverity.com/guides/tips-and-best-practices/tiktok-business-tips.html) [connector]. Adriel builds per-video "delta" (day-over-day) values itself, and its first delta for videos published before connection is 0 — [Adriel TikTok Organic data reference](https://docs.adriel.com/data-sources/o-z/tiktok-organic/data-reference.md) [connector]
- **History windows.**
  - Adriel's first fetch pulls about 1,099 days of videos (lifetime metrics only) and the last 59 days of daily page data, then re-pulls the latest 3 days every day. Follower and audience data have no backfill. — [Adriel](https://docs.adriel.com/data-sources/o-z/tiktok-organic/data-reference.md) [connector]
  - Zernio limits daily figures to 89 days, with "up to 48 hours" delay, and serves per-video metrics only for posts active in the last 7 days (a Zernio product limit) — [Zernio](https://docs.zernio.com/analytics/get-tiktok-account-insights) [connector]
- **Percent scale.** Windsor's deprecated country object uses values like 0.0132, which points to fractions rather than 0-100 — [Windsor.ai](https://windsor.ai/data-field/tiktok_organic/) [connector]
- **STUDIO export.**
  - The web analytics download covers "the past 60 days" (video views, profile views, comments, …) — [Coupler.io blog](https://blog.coupler.io/how-to-export-data-from-tiktok/) [connector]
  - Third-party guides describe a desktop TikTok Studio › Analytics export as CSV or XLSX, from the Overview and Content pages — [Graphed](https://www.graphed.com/blog/how-to-export-tiktok-analytics) [secondary]. No official help page was found.

### Inferences
- **Catalogue `retention_days=365` is probably the GUI's range selector**, not what can be pulled. The API gives 60 days and the export (secondary sources) gives 60 days. `v_expiring_metrics` (`MIG:42-50`) and `saved_history` (`backend/app/creator/crud/crud_dashboard.py:69-75`) use `retention_days` to warn, so a TikTok account fed by the API or exports should be warned at about 60 days, not 365.
- **`total_viewers` (unique) must never be summed across days.** Store daily uniques as `day` facts. A range value has to be a separate `range`/`week`/`month` fact from STUDIO. This is the same rule as Instagram `reach` in `reports/Instagram connector findings.md:72-73`.
- **Two sources for one metric.** Where DISPLAY and BIZ both supply a content counter (views, likes, comments, shares), they write the same `metric_id`. The latest `captured_at` wins in `v_content_latest_metrics` (`MIG:24-40`), and `v_content_summary` takes `max()` over lifetime facts (`MIG:83-89`). Mixing is harmless as long as both are lifetime counts. BIZ values lag 24-48 hours, so DISPLAY is fresher.
- **`net_followers` derived from DISPLAY snapshots is "followers at snapshot T minus followers at snapshot T-1".** It is not TikTok's calendar-day (UTC) net. Label it in the batch `source_label` and keep the snapshot time fixed, e.g. 00:15 UTC.

### Gaps
- business-api.tiktok.com reference pages could not be fetched. All BIZ field names rest on the Go SDK plus connector docs. In particular, the favorites key spelling, `daily_total_followers` vs `daily_total_viewers`, the `total_time_watched` unit, and the percentage scale (0-1 vs 0-100) are UNVERIFIED.
- No official source confirms a TikTok Studio export's columns, its range options (7/28/60/365 days) or its XLSX format.
- No LIVE or Creator Rewards API for creators was found. This is an absence of evidence, not proof that none exists.

---

## Q2. Every relevant table and column: which source can fill it?

### Takeaway
- **DISPLAY alone** fills `accounts`, `account_profile_snapshots`, `content_items` (most columns) and 4 lifetime content counters.
- **BIZ adds** the daily `account_metric_facts` (≤60 days back), every remaining content counter, most of `breakdown_facts` (demographics, traffic source, viewer type, follower status, hour of day), **`retention_curve_points` (`video_view_retention`, per second)** and `comments`.
- **Never filled by an API**: `relationships`, `revenue_facts`, `live_sessions`, and most of `interactions`.

### Cited Findings (model facts from the codebase, source facts as cited in Q1)

**`accounts`** (`backend/app/creator/model/account.py:12-30`)
- `external_id`: DISPLAY `open_id` or BIZ `business_id`. Both are app-scoped `open_id`s. DISPLAY also returns `union_id`, which is stable across one developer's apps [official, Get User Info].
- `handle`: `username` (DISPLAY scope `user.info.profile`, or BIZ).
- `display_name`: `display_name`.
- `profile_url`: `profile_deep_link`.
- `account_type`: from BIZ `is_business_account` (scope `user.account.type`) → `business`; otherwise `creator`/`personal` (`enums.py:11-16`) stays manual.
- `is_monetized`, `region`, `created_on`, `premium_tier`: MANUAL.

**`account_profile_snapshots`** (`account.py:33-47`)
- `bio`: `bio_description`.
- `follower_count`: DISPLAY `follower_count` or BIZ `followers_count`.
- `following_count`: `following_count`.
- `content_count`: DISPLAY `video_count` or BIZ `videos_count`.
- `extra`: `{likes_count | total_likes, is_verified, avatar_url (expires)}`.
- `headline`, `links`, `contact_email`, `connection_count`: not available. `links` (bio link) is MANUAL.
- The dashboard's follower number reads either this table or a `total_followers` fact, latest `captured_at` (`crud_dashboard.py:22-39`).

**`content_items`** (`backend/app/creator/model/content.py:21-48`)

| column | DISPLAY | BIZ | Notes |
|---|---|---|---|
| `external_id` | `id` | `item_id` | Same TikTok video id. Verify on the first video. |
| `content_type` | always `video` | `media_type` VIDEO → `video`, PHOTO → `carousel` or `image_post` | `ContentType` enum (`enums.py:19-37`) has no "photo mode" value; pick `carousel` |
| `title` | `title` (often empty) | none | |
| `caption` | `video_description` | `caption` | |
| `url` | `share_url` | `share_url` | |
| `published_at` | `create_time` (epoch seconds, UTC) | `create_time` (epoch, UTC) | |
| `duration_seconds` | `duration` (integer seconds) | `video_duration` (float seconds) | |
| `thumbnail_url` | `cover_image_url` | `thumbnail_url` | **Both expire** (6 hours for DISPLAY). Don't treat as durable; re-fetch or cache the image |
| `extra` | `embed_link`, `height`, `width`, `is_aigc` | `embed_url`, `is_ad` | |
| `visibility` | `public` | | `video.list` only returns public posts. "video_count counts only public videos" [official] |
| `deleted_observed_at` | | | Set by a full `video.list` snapshot with `full_snapshot=True` (`sync_service.py:52-53`). A post made private also "disappears" (see Inferences) |
| `language`, `scheduled_for`, `status`, `restrictions`, `is_collab` | n/a | n/a | MANUAL |

**`content_tags`** (`content.py:55-65`): no API. Parse `#hashtags` and `@mentions` from the caption, as for Instagram (`reports/Instagram connector findings.md:139`).

**`content_metric_facts`** (`backend/app/creator/model/fact.py:36-55`)
- Unique on `(content_id, metric_id, period_kind, coalesce(period_start), coalesce(period_end), captured_at)` (`fact.py:51-53`). Inserts use `on_conflict_do_nothing` (`backend/app/creator/crud/crud_metric.py:28-34`).
- Every snapshot with a new `captured_at` is a new row, so the table is an append-only snapshot log.
- **Lifetime rows**: DISPLAY views, likes, comments, shares. BIZ adds saves, total_play_time_sec, avg_watch_time_sec, watched_full_pct and new_followers.
- **Proposed new content keys** (BIZ): `reach`, `profile_views`, `website_clicks`.

**`account_metric_facts`** (`fact.py:13-29`)
- Unique includes `captured_at` (`fact.py:15-18`). `timeseries` takes the latest capture per period via `DISTINCT ON` (`crud_dashboard.py:52-64`), so re-pulling the last 3 days is safe and the latest wins.
- **BIZ daily**: `video_views`, `profile_views`, `likes`, `comments`, `shares`, `total_followers` (per-date `followers_count`), `net_followers`, `total_viewers` (daily `unique_video_views`).
- **Proposed new keys**: `new_followers_daily`, `lost_followers`, `engaged_audience`, `bio_link_clicks` (Business-registered only).

**`breakdown_facts`** (`fact.py:58-80`): `content_id` NULL means an account-level breakdown. `Dimension` values are listed at `enums.py:87-120`.

| BIZ field | Level | Dimension | `dimension_value` | Value |
|---|---|---|---|---|
| `audience_ages[]{age,percentage}` | account | `age_range` | 18-24 … 55+ | percent (×100?) |
| `audience_genders[]` | account / video | `gender` | Female/Male/Other | percent |
| `audience_countries[]` (account: top 3) | account / video | `country` | code | percent |
| `audience_cities[]{city_name}` | account / video | `city` | name | percent |
| `metrics[].audience_activity[]{hour,count}` | account, per day | `hour_of_day` | 0-23 | count of active followers |
| `impression_sources[]` | video | `traffic_source` | For You / Follow / Search / Sound / Direct Message … | percent |
| `audience_types` NEW_VIEWER / RETURN_VIEWER | video | `viewer_type` | new / returning | percent |
| `audience_types` FOLLOWER_PERCENT / NON_FOLLOWER_PERCENT | video | `follower_status` | follower / non_follower | percent |
| `engagement_likes[]{second,percentage}` | video | **no fitting dimension** | | percent |

- **Catalogue gap: there are no TikTok `audience`-scope rows** in `MIG:124-147`. Every breakdown fact needs a `metric_id`, so new keys are required, e.g. `audience/follower_share`, `audience/viewer_share`, `audience/active_followers`, `content/traffic_share`.

**`retention_curve_points`** (`fact.py:83-95`)
- The table docstring already says "Per-video retention curves (YouTube, TikTok)".
- Map BIZ `video_view_retention[]{second (string), percentage}` as `position_sec = float(second)`, `position_pct = second / video_duration × 100` (the CHECK requires 0-100, `fact.py:87`, so clamp), `audience_pct = percentage` (×100 if it is a fraction).

**`comments`** (`backend/app/creator/model/engagement.py:11-34`)
- BIZ comment fields: `comment_id`, `comment_text`, `comment_username`, `comment_likes`, `comment_parent_id`, `comment_video_id`, `comment_visibility` — [Windsor.ai](https://windsor.ai/data-field/tiktok_organic/) [connector].
- These map to `external_id`, `body`, author → `people.handle`, `like_count`, `parent_comment_id`, `content_id`, `status`.
- The endpoint path (believed to be `/business/comment/list/`) and its scope are UNVERIFIED. DISPLAY has no comments.

**`people` / `relationships`** (`backend/app/creator/model/people.py:13-45`): no API returns follower identities (see Q3).

**`interactions`** (`engagement.py:42-56`)
- No API.
- The model comment "TikTok profile views 30" (`engagement.py:54`) refers to the in-app profile-view history, which is MANUAL/agent only.

**`live_sessions`** (`content.py:68-77`): MANUAL.

**`revenue_facts`** (`fact.py:98-115`): MANUAL.

**`import_batches.source_kind`** (`backend/app/creator/model/batch.py:18`)
- `SourceKind` (`enums.py:156-163`) has `gui_manual`, `csv_export`, `xlsx_export`, `sheets_export`, `takeout_archive`, `screenshot` and `copy_paste`.
- There is **no `platform_api`** value. The Instagram findings report already calls for adding one (`reports/Instagram connector findings.md:151-152`).

**Views that depend on TikTok data**
- `followers_3d` reads daily `('tiktok','net_followers')` facts (`backend/alembic/versions/2026_11_04_1604-bb4e007b30a5_brief_experiments.py:31-32`). It returns NULL unless all 3 days exist ("HAVING count(*) = 3", `2026_11_04_1600-793732957eb1_follower_lift_per_post.py:36-39`).
- So the connector must write a `net_followers` fact for **every** day, BIZ or derived from snapshots, or post experiments show "no data".

### Inferences
- **A post that becomes private or friends-only drops out of `video.list`.** `full_snapshot` would then mark it `deleted_observed_at`. Treat "missing from list" as "deleted or hidden", in line with Instagram's archived-post caveat (`reports/Instagram connector findings.md:84-85`).
- **`engagement_likes` (likes by second)** fits neither `breakdown_facts` nor `retention_curve_points`. Either add a nullable `series` / `kind` column to `retention_curve_points` ('audience' | 'likes'), or skip it.
- **Account-level breakdown percentages need a `period_kind`.** BIZ follower demographics are point-in-time snapshots, so use `period_kind=snapshot` with NULL dates. Per-video breakdowns are lifetime, so use `period_kind=lifetime`.
- **`sync_service` has no breakdown or retention writer.** It only has `sync_content`, `sync_account_metrics`, `sync_revenue` and `sync_relationships` (`backend/app/creator/service/sync_service.py:16-118`). Only `linkedin_service` writes breakdowns (`backend/app/creator/service/linkedin_service.py:116`). A `sync_breakdowns` and a `sync_retention` method (plus MCP and REST counterparts) are needed.

### Gaps
- The comment endpoint name, scope and pagination are unverified.
- Whether DISPLAY `id` equals BIZ `item_id` is unverified. It is expected, since both are the public video id in `share_url`.

---

## Q3. Tables that can never be filled for TikTok via API, and realistic fallbacks

### Takeaway
No API exists for these tables:
- `relationships` / `people` as followers (no follower list)
- `interactions`
- `revenue_facts`
- `live_sessions`
- the three LIVE rows
- account-level new and returning viewers and range uniques

`retention_curve_points` **is** fillable via BIZ, unlike Instagram. Fallbacks:
- **DYD**: an archive of your own data whose per-file contents (follower and following lists) are unverified.
- **STUDIO**: 60-day exports.
- **MANUAL/agent**: the existing MCP `sync_*` tools.

### Cited Findings
- **Neither SDK model exposes follower identities.**
  - `/business/get/` returns counts and follower demographics only — [SDK](https://pkg.go.dev/github.com/bububa/tiktok-business/model/business).
  - DISPLAY returns counts only — [Get User Info](https://developers.tiktok.com/doc/tiktok-api-v2-get-user-info).
  - Zernio: "Not exposed: account-level impressions/reach, follower inflow/outflow, and account-level watch time." Zernio synthesizes `followers_gained` and `followers_lost` itself — [Zernio](https://docs.zernio.com/analytics/get-tiktok-account-insights). BIZ `daily_lost_followers` (a count) contradicts the "no outflow" part — [SDK].
- **"Download your data".**
  - Path: Profile › Menu › Settings and Privacy › Account › Download your data. TXT or JSON. It takes days to prepare and holds profile details and activity logs beyond 60 days — [Coupler.io](https://blog.coupler.io/how-to-export-data-from-tiktok/).
  - The file stays downloadable for about 4 days — [Graphed](https://www.graphed.com/blog/how-to-download-tiktok-analytics-data) [secondary].
  - The JSON's top level has an "Activity" object; liked videos are under "Like List" › "ItemFavoriteList" — [levon003 blog](https://levon003.github.io/2025/01/16/tiktok-download.html) [secondary].
  - A tool README sketches "Video" › "Videos" › "VideoList" entries with Date, Likes and Link — [zollo/tiktok-downloader](https://www.github.com/zollo/tiktok-downloader) [secondary].
- **Data Portability API.**
  - Categories: `all_data`, `video`, `profile`, `activity`, `direct_message`. Formats: `text` or `json`.
  - Scopes: `portability.all.single/.ongoing`, `portability.postsandprofile.*`, `portability.activity.*`, `portability.directmessages.*`. A `.single` scope allows one request.
  - The page does not say whether follower lists are included — [TikTok: Add data request](https://developers.tiktok.com/docs/en/data-portability-api-add-data-request) [official].
  - Sandbox **does not offer the Data Portability API** — [TikTok: Add a sandbox](https://developers.tiktok.com/doc/add-a-sandbox) [official, search snippet].
- **Instagram precedent.** The same "never from the API" list (relationships, viewer lists, revenue) appears at `reports/Instagram connector findings.md:131-140`.

### Inferences
- **`relationships` fallback.** Import the DYD JSON (`source_kind=takeout_archive`, which already exists at `enums.py:161`) through `sync_relationships(full_snapshot=True)` (`sync_service.py:98-118`). Each archive is a full snapshot, so `v_inferred_unfollows` (`MIG:51-61`) works at archive cadence, e.g. monthly. This depends on the archive containing follower/following lists with usernames and dates (`relation_since`). That is commonly reported, but **UNVERIFIED** in this session.
- **The Data Portability API `.ongoing` scope** could automate DYD for an audited app only, since it is not in sandbox. That is out of reach for a solo self-hoster.
- **`revenue_facts`, LIVE and `interactions(profile_view)`**: agent or manual capture through `sync_revenue` / `sync_account_metrics(scope='live')` / table endpoints, with `source_kind=gui_manual` or `screenshot`.
- **`new_viewers` / `returning_viewers` / range `total_viewers`**: STUDIO export or agent reading of the Viewers tab. The per-video `audience_types` (BIZ) is a partial proxy.

### Gaps
- The exact file and key names in the 2026 DYD JSON (follower list, video list, comments) were not verified. Before building the parser, request one and inspect it.
- Data Portability API regional eligibility (historically EEA/UK) was not confirmed on the fetched page.

---

## Q4. Snapshotting strategy and rate-limit cost

### Takeaway
- **What to snapshot.** Take a DISPLAY snapshot once a day at a fixed UTC time: 1 `user.info` call plus ⌈N/20⌉ `video.list` pages. For N = 500 videos that is 26 calls/day, against a limit of 600 per minute **per endpoint**. Cost is negligible.
- **Where history comes from.** Day-over-day deltas of the lifetime counters give a per-video daily views/likes/comments/shares series and a daily `net_followers` series, starting from the first snapshot. Nothing before the first snapshot can be recovered (except ≤60 days of account daily metrics via BIZ).
- **Early velocity.** Extra snapshots for videos under 72 hours old (1h/6h/24h) add only ⌈young/20⌉ `video.query` calls each.

### Cited Findings
- **Rate limits.** `/v2/user/info/` and `/v2/video/list/` each allow 600 requests per 1-minute sliding window; over the limit returns HTTP 429 `rate_limit_exceeded` — [TikTok: Rate limits](https://developers.tiktok.com/doc/tiktok-api-v2-rate-limit) [official, earlier note]
- **Paging.** `video.list` takes `max_count` up to 20 and a millisecond `create_time` cursor, sorted newest first, so a crawl can page back through all public videos with no stated lookback limit — [List Videos](https://developers.tiktok.com/doc/tiktok-api-v2-video-list) [official, earlier note]
- **BIZ timing.** BIZ video fields update at T+24-48h and account daily metrics lag 24-48 hours — [SDK](https://pkg.go.dev/github.com/bububa/tiktok-business/model/business/video). Adriel re-pulls the latest 3 days every day — [Adriel](https://docs.adriel.com/data-sources/o-z/tiktok-organic/data-reference.md).
- **BIZ paging.** `/business/video/list/` is ⌈N/20⌉ pages (max_count 20) — [SDK]. BIZ rate limits were not found.
- **The model fits an append-only design.** Unique keys include `captured_at` (`fact.py:15-18`, `fact.py:51-53`). `v_content_latest_metrics` keeps the latest capture (`MIG:24-40`). `PeriodKind` already has `day`, `snapshot`, `first_24h` and `realtime` (`enums.py:69-78`).

### Inferences
- **Recommended storage, raw.** Store each DISPLAY counter as a `content_metric_facts` row with `period_kind='lifetime'` and `captured_at = snapshot time`. That table is the snapshot log.
- **Recommended storage, deltas.** Compute daily deltas in a **view** (e.g. `v_content_daily_deltas`: `LAG()` over captured_at per content and metric, bucketed by UTC date) rather than storing them, so there is one source of truth.
  - Do **not** write deltas as `lifetime` rows: `v_content_summary` takes `max()` over lifetime facts (`MIG:83-89`).
  - If they are materialized, use `period_kind='day'` with `period_start = period_end = date`.
- **Exception: `net_followers` must be written as facts.** It goes into `account_metric_facts` (`day`) because `followers_3d` reads facts, not views. Prefer BIZ `daily_new_followers - daily_lost_followers`. Otherwise use the DISPLAY snapshot difference, with a distinct `source_label` such as "derived from Display API follower_count snapshots".
- **Missed snapshots.** Use the gap delta spread over the missing days, or leave those days NULL. `followers_3d` requires all 3 days, so a missing day makes it NULL, which is honest.
- **Clamp negative deltas.** Likes and comments can be removed, so a negative delta is real. Views should never decrease; if they do, it is a data artifact.
- **Cost model with both APIs, daily, N videos:**
  - DISPLAY: 1 + ⌈N/20⌉.
  - BIZ: 1 (`/business/get/`, last 3-4 days) + ⌈N/20⌉ for counters.
  - Breakdowns and retention: request them only for videos under 30 days old daily (filter by `video_ids`), plus a weekly full refresh. Payloads get large because retention is per second.
  - Total for N = 500 is about 55 calls/day. Rate limits are not the binding constraint. Token expiry and app approval are.

### Gaps
- BIZ Accounts API rate limits and quotas were not found.
- Whether the DISPLAY `view_count` updates in near real time or with a lag was not documented.

---

## Q5. Recommended architecture: connector layout, OAuth, sandbox vs audited app, scheduler, idempotency, provenance, catalogue and model changes

### Takeaway
- **Build DISPLAY first**, in sandbox mode with the creator as one of up to 10 target users. It gives daily snapshots → follower and per-video daily deltas.
- **Add BIZ as an optional second client.** It is the only route to watch time, saves, completion, traffic sources, demographics, retention curves and 60-day daily account backfill. It is available only if the creator can register a TikTok API for Business developer app and authorize their (ideally Business) account.
- **Keep STUDIO and DYD imports plus MANUAL/agent** for the rest.
- **Write everything through the existing `sync_service`.** Add `platform_api` / `derived` source kinds, `sync_breakdowns` and `sync_retention`, a token table and a small scheduler.

### Cited Findings

**OAuth and tokens**
- **DISPLAY tokens**: access token 2 hours (`expires_in`), refresh token 180 days (`refresh_expires_in`), both returned as remaining seconds. **Refresh rotates the refresh token**: reusing an old one fails and forces re-authorization — [TikTok: OAuth user access token management](https://developers.tiktok.com/doc/oauth-user-access-token-management) [official].
  - Conflict: third-party and legacy docs give 24 hours / 365 days — [TikTok legacy user access token guide](https://developers.tiktok.com/docs/en/legacy-user-access-guide?enter_method=left_navigation) (legacy open-api endpoints); [bundle.social](https://bundle.social/blog/oauth-token-refresh-social-apis). Trust the returned fields, not constants.
- **PKCE and redirect URIs**: the token-management page does not cover PKCE or redirect URI rules. Login Kit has separate Web and Desktop flows — [Login Kit for Web](https://developers.tiktok.com/doc/login-kit-web), [Login Kit for Desktop](https://developers.tiktok.com/doc/login-kit-desktop) (titles only seen in search). These rules are **UNVERIFIED**: that Desktop requires PKCE (`code_challenge`, S256) and that Web redirect URIs must be pre-registered https URLs.
- **BIZ authorization**: `business_id` is "the `open_id` returned by `/tt_user/oauth2/token/`", and `fields` need matching scopes, checkable via `/tt_user/token_info/get/` — [SDK](https://pkg.go.dev/github.com/bububa/tiktok-business/model/business).
  - Scope names: Zernio uses `user.insights` and `user.info.stats` — [Zernio](https://docs.zernio.com/analytics/get-tiktok-account-insights); `user.account.type` gates `is_business_account` — [SDK]. Other BIZ scope names (e.g. `video.insights`, `comment.list`) are UNVERIFIED.
  - BIZ token lifetimes are not documented in retrieved sources.

**Sandbox and app review**
- **Sandbox**: a restricted environment for trying integrations without review; **up to 10 target users**, each authorized via Login Kit; it can be imported into a production draft. It does not include the Data Portability API or Content Posting to public — [TikTok: Add a sandbox](https://developers.tiktok.com/doc/add-a-sandbox) [official, search snippet]. A third party reports 5 authorizations per 24 hours in sandbox — [keryx guide](https://keryx-a0a6a5.gitlab.io/how-to/tiktok-credentials/) (UNVERIFIED).
- **Production review**: needs a "fully developed" website, a privacy policy, terms and a demo video. "Apps must not be for private or personal use." — [TikTok App review guidelines](https://developers.tiktok.com/doc/app-review-guidelines) [official, earlier note]
- **TikTok account types**: Personal (general and creator) vs Business — [TikTok Ads Help](https://ads.tiktok.com/help/article/upgrade-your-tiktok-account). BIZ `profile_views` and click metrics are "Business accounts with completed registration only" — [SDK].

**Codebase facts that shape the design**
- **Provenance and no scheduler.** The data path is `sync_service` → `batch_dao.create(source_kind, source_label, …)` (`sync_service.py:31-32`, `67-69`). No scheduler, APScheduler or Celery was found in `backend/app` (grep, this session).
- **Docs promise no API calls.** `docs/guides/importing-data.md:3` states the project "never scrapes the platforms or calls their APIs". Instagram findings item 7 flags this text for change (`reports/Instagram connector findings.md:171`).
- **Instagram-planned changes.** These are relevant to TikTok too:
  - add `platform_api` with an autocommit enum migration (`reports/Instagram connector findings.md:151-152`)
  - re-pull the last 2-3 days
  - a daily account pull
  - list posts, then fetch lifetime insights (`reports/Instagram connector findings.md:167-170`)
- **Credentials precedent.** Instagram stores credentials in `backend/.env` (`reports/Instagram connector findings.md:27`). That works for a never-expiring Meta token, but **not** for TikTok's rotating refresh token.
- **File-import dispatch** (`backend/app/creator/service/import_service.py:27-56`):
  - `PK` → LinkedIn xlsx only. A TikTok XLSX export would currently be misrouted to `linkedin_service`.
  - CSV: header aliases `video id` / `post id` → content, `date` → account metrics (`import_service.py:15-24`).
  - Columns match `metric_key` or GUI `label` case-insensitively (`backend/app/creator/crud/crud_metric.py:24-25`; `docs/guides/importing-data.md:50-53`).

### Inferences: recommended architecture

**1. Module layout.** Use one shared package that the Instagram connector would also use:
```
backend/app/creator/connector/
  base.py            # Connector protocol: refresh_auth(), pull(account, since) -> SyncPayload; shared retry/429 backoff
  tokens.py          # CRUD for new table platform_credentials
  scheduler.py       # job registry + run_due(); invoked by APScheduler in-process or by a CLI/cron
  tiktok/
    oauth.py         # authorize URL (state + PKCE verifier), code exchange, refresh (persist rotated refresh_token)
    display_client.py# /v2/user/info/, /v2/video/list/ (cursor paging, max_count=20), /v2/video/query/
    business_client.py# /business/get/, /business/video/list/, comments (optional; feature-flagged)
    mapping.py       # API JSON -> sync_service payloads (field renames, ratio→percent, epoch→datetime, PHOTO→carousel)
    sync.py          # orchestrates: profile snapshot, content snapshot, account daily, breakdowns, retention
  instagram/ ...     # same shape
```
Add REST `/api/v1/connections/tiktok/{start,callback}` plus `POST /sync/run`, and MCP `run_platform_sync` / `sync_status`, matching the recommendation in `reports/Meta and YouTube API feasibility.md:98`.

**2. Token storage.** Add a new table `platform_credentials(account_id, provider ∈ {tiktok_display, tiktok_business}, open_id, union_id, scopes text[], access_token, access_expires_at, refresh_token, refresh_expires_at, updated_at)`.
- Encrypt with a key held in `.env`.
- Persist the rotated refresh token **inside the same transaction** as the refresh call result.
- Surface `refresh_expires_at` in the "Expiring soon" panel, since re-consent is due within 180 days.

**3. OAuth.**
- Self-hosters run the backend on localhost, so use the Login Kit Desktop flow with PKCE and a loopback or localhost redirect if TikTok allows it (UNVERIFIED). Otherwise use the Web flow with a registered https redirect, e.g. a tunnel or the self-hoster's own domain.
- Request `user.info.basic`, `user.info.profile`, `user.info.stats` and `video.list`.
- Validate the `state` value.

**4. Sandbox vs audited app.**
- A solo self-hoster should run the **sandbox app** with their own account as a target user. Each self-hoster registers their own TikTok developer app (bring-your-own client key and secret in `.env`).
- An audited app is unrealistic: review rejects personal-use apps.
- Durability risk: sandbox tokens and quotas are not documented as production-grade. Keep STUDIO and MANUAL paths working regardless.

**5. Scheduler.**
- Daily at 00:15 UTC: DISPLAY profile + full `video.list` with `full_snapshot=True`. Use BIZ `/business/get/` for `start_date = today-4 … end_date = yesterday`.
- Every 6 hours: `video.query` for videos under 72 hours old. This fills the `first_24h` period kind if desired.
- Weekly: BIZ breakdowns and retention for all videos; daily for videos under 30 days old.
- Monthly reminder: DYD request (manual) → follower list import.

**6. Idempotency.**
- Content upsert by `(platform, external_id)` already exists (`sync_service.py:43`).
- Facts are append-only with "latest capture wins". Re-runs within one second dedupe through `on_conflict_do_nothing`.
- Add a `job_runs` row or reuse `import_batches.notes`, store the request window in `range_start`/`range_end`, and make the scheduler skip a window already completed today.

**7. Provenance.**
- Add `SourceKind.platform_api` (raw API values) and `SourceKind.derived` (snapshot deltas such as `net_followers`) to `enums.py:156-163` and the `creator.source_kind_t` enum, in one autocommit migration shared with Instagram.
- `source_label` examples: "TikTok Display API v2 video.list", "TikTok Business API /business/get/".
- Optionally add `takeout_archive` usage for DYD (the value already exists).

**8. Catalogue and model changes** (one Alembic migration)
- **Retention fix.** TikTok account rows `retention_days` 365 → 60 if API/export reachability is the definition. Alternatively, keep 365 and add an `api_window_days` column. Decide before `v_expiring_metrics` misleads.
- **New `account` keys**: `new_followers_daily`, `lost_followers`, `engaged_audience`, `bio_link_clicks`, `total_likes` (point_in_time), `video_count` (point_in_time).
- **New `content` keys**: `reach`, `profile_views`, `website_clicks`.
- **New `audience` keys**: `follower_share` (percent; age, gender, country, city), `active_followers` (count; hour_of_day), `viewer_share` (percent; per-video gender, country, city, viewer_type, follower_status, traffic_source).
- **Dimension enum** (`enums.py:87-120`): the existing values cover everything. Optionally add `content_format_type` for VIDEO/PHOTO if aggregated. `follower_status` values: `follower` / `non_follower`; `viewer_type` values: `new` / `returning`.
- **`retention_curve_points`**: optionally add a `series` column ('audience' | 'likes') for `engagement_likes`.
- **`ContentType`**: decide PHOTO → `carousel`; optionally add `photo_post`.
- **New services**: `sync_breakdowns` and `sync_retention` in `sync_service`, with REST and MCP twins.
- **Importer**: add a TikTok STUDIO CSV/XLSX importer. Route `PK` files by sheet names, not always to LinkedIn. Add TikTok header aliases to `_CONTENT_ALIASES`. Add a DYD JSON importer → `sync_content` (video list) and `sync_relationships`.
- **Docs**: update `docs/guides/importing-data.md:3` and the README "never calls their APIs" claim.

**9. Order of work**
1. Enum and catalogue migration.
2. Token table and the DISPLAY sandbox connector, which immediately starts the follower and per-video history.
3. The `net_followers` derivation, so `followers_3d` works for TikTok.
4. The STUDIO import for the 60-day account metrics and viewers.
5. The BIZ client, if the creator can get a TikTok for Business developer app and accepts a Business account.
6. The DYD follower-list import.

### Gaps
- PKCE requirement, redirect URI rules (localhost allowed?) and the exact authorize and token URLs for Login Kit v2 were not re-verified in this session.
- BIZ developer-app eligibility for an individual, which account types can authorize (Personal/Creator vs Business only), scope names beyond `user.insights` / `user.account.type`, token lifetimes and rate limits are all unverified. business-api.tiktok.com pages could not be retrieved.
- Whether sandbox tokens last the full 180-day refresh window, and whether sandbox has a daily authorization cap, is unknown.
- A DISPLAY open_id and a BIZ business_id for the same person come from different apps and will differ. Store both, keyed by provider, in `platform_credentials`, and keep `accounts.external_id` = the DISPLAY `open_id` or `union_id`. The behaviour of `union_id` across Login Kit and Business apps is unverified.

# Instagram connector findings

Everything learned while connecting this project to the Instagram Graph API, from November 20 to 21, 2026: how
access was set up, what was tested, the rules found along the way, the gaps, and how each API field maps to the data
model.

Related files:
- `reports/Instagram API endpoints and metrics.md`: every endpoint with its real JSON response.
- `reports/Meta and YouTube API feasibility.md`: the earlier research report on Meta, YouTube, TikTok and LinkedIn.
- `backend/scripts/probe_instagram.ps1`: re-runnable probe of every endpoint (no dependencies).

---

## 1. Access setup (what exists now)

| Item | Value |
|---|---|
| Meta app | "Content Creation", ID `29040014458999092`, unpublished (Standard Access) |
| Business portfolio | "Content Creation", ID `2262650884310876`, unverified |
| Instagram account | @abdou_scope, IG user ID `17841473455783127`, Professional, Instagram tester on the app, added to the portfolio |
| Login method | Instagram API with Unified Login (Facebook Login for Business). "Instagram Login" is no longer offered to new apps. |
| Login configuration | "Creator Analytics read-only", ID `2631032287385584`, system-user token that never expires, asset = Instagram accounts |
| Granted permissions | `instagram_basic`, `instagram_manage_insights` (plus the automatic `public_profile`) |
| Also added to the app but not in the token | `instagram_business_basic`, `instagram_business_manage_insights` (Instagram-Login variants) |
| Token identity | "Content Creation System User" (`/me` id `122099069799557084`) |
| API host / version | `https://graph.facebook.com/v27.0` |
| Credentials | `backend/.env` (gitignored): `META_APP_ID`, `META_LOGIN_CONFIG_ID`, `META_GRAPH_VERSION`, `INSTAGRAM_USER_ID`, `INSTAGRAM_ACCESS_TOKEN` |
| Not stored | App secret. It isn't needed to read data. |

**Security note.** The token never expires, and it was pasted into a chat once. Regenerate it (app dashboard › Use
cases › Instagram API › API setup with Unified login › 2. Generate tokens) if that chat could be shared. Access can
be revoked from Instagram › Settings › Apps and websites.

**Pitfall found during setup.** A token generated before the Instagram account was added to the business portfolio
can't read the account: `Object with ID … does not exist … (subcode 33)`. Add the account to the portfolio first,
then generate the token.

---

## 2. Test results

`probe_instagram.ps1` makes 61 checks:

| Result | Count | What |
|---|---|---|
| OK | 32 | Token, profile, `business_discovery`, every account metric (yesterday, 7 days, 30 days), `reach` time series, every breakdown, the consistency checks |
| EMPTY | 21 | `/media`, `/stories`, `/live_media` (no content); 12 demographic combinations, `follows_and_unfollows`, `online_followers`, `follower_count` (need 100 followers); `content_views` |
| EXPECTED | 8 | `/tags`, `/mentioned_media` (permission not granted); 5 removed metrics (`impressions`, `email_contacts`, …); `views` as a time series (rejected) |
| FAIL | 0 | |

**Also verified using public posts** (via `business_discovery` on @instagram):
- post fields `id`, `caption`, `media_type`, `media_product_type`, `timestamp`, `permalink`, `media_url`,
  `thumbnail_url`, `like_count`, `comments_count`, and **`view_count` (Reels)**
- carousel `children`

**Confirmed refused.** Insights on another account's post fail with subcode 33. Per-post insights can only be tested
on our own posts.

---

## 3. Rules learned (the connector depends on these)

1. **Day windows.**
   - Days are bucketed in Pacific time and identified by their `end_time`: the next midnight in
     America/Los_Angeles, which is `08:00Z` in winter and `07:00Z` in summer.
   - A query sums every day whose `end_time` is in `[since, until]`, **both ends inclusive**.
   - For one day, use `since = until = end_time`. A 24-hour window covers two days and double counts.
   - Non-boundary timestamps return HTTP 400.
   - Verified: seven single-day calls add up exactly to the 7-day call (views 1198, likes 10, profile_views 41).
2. **Only `reach` (and `follower_count`) accept `time_series`.** Every other activity metric needs
   `metric_type=total_value`, so daily history takes one call per day.
3. **`reach` is unique accounts**, so daily values can't be summed into a period total. Ask the API for the period
   directly.
4. **Valid breakdowns:** `country`, `city`, `age`, `gender`, `follow_type`, `media_product_type`,
   `contact_button_type`. `follower_type` from older docs is rejected.
5. **`profile_views` and `website_clicks` still work** with `total_value`, despite being listed as deprecated since
   January 2025. They may disappear without notice.
6. **Data delay.** Yesterday's values were still partial or zero on the next day. Re-pull the last 2 to 3 days on
   every sync.
7. **History.** About 90 days for account metrics, about 2 years for posts, **24 hours** for Stories.
8. **100-follower threshold.** Below 100 followers, follows/unfollows, all demographics, `online_followers` and
   `follower_count` return `{"data": []}`. They start working with no code change.
9. **Rate limits** are reported in `X-Business-Use-Case-Usage`. A full probe run used about 1% of the budget.
10. **Archived posts are hidden.** `media_count` was 0, yet `views` showed 1,174 POST views in 7 days. Archived
    posts are probably still being viewed but aren't returned by `/media`.

---

## 4. Catalogue comparison (25 Instagram rows in `metric_definitions`)

| Scope | Rows | Tested and working | Needs 100 followers | Needs own content (untested) | Not applicable |
|---|---|---|---|---|---|
| account | 9 | 7 | 2 (`follows`, `unfollows`) | – | – |
| content | 15 | – | – | 15 | – |
| audience | 1 | – | – | – | 1 (`demographics_min_reach` is a threshold) |

24 of the 25 rows can come from the API. The per-metric mapping is in section 1 of
`Instagram API endpoints and metrics.md`.

---

## 5. Data model mapping

Status key:
- ✅ tested
- 🕓 documented, untested (needs our own content)
- ⚠️ needs 100 followers, or a model change
- ❌ impossible

### Tables the connector fills

| Table | Columns from the API | Not available |
|---|---|---|
| `accounts` ✅ | `external_id`=`id`, `handle`=`username`, `display_name`=`name`, `profile_url` (built from the username) | `is_monetized`, `premium_tier`, `region`, `created_on` (stay manual) |
| `account_profile_snapshots` ✅ | `bio`=`biography`, `links`=`website`, `follower_count`, `following_count`=`follows_count`, `content_count`=`media_count`, `extra`=`profile_picture_url` (the link expires) | `headline`, `contact_email`, `connection_count` |
| `account_metric_facts` ✅ | Daily facts for `views`, `accounts_reached`, `interactions`, `accounts_engaged`, `profile_visits`, `link_taps`, `total_followers`. ⚠️ `follows`, `unfollows`. | – |
| `content_items` ✅ fields, 🕓 own posts | `external_id`=`id`, `content_type` (from `media_product_type` + `media_type`), `caption`, `url`=`permalink`, `published_at`=`timestamp`, `thumbnail_url` (`thumbnail_url` for video, `media_url` for images), `parent_content_id` via `children`, `visibility`=public, `deleted_observed_at` via a full `/media` snapshot | `title`, `scheduled_for`, `language`, `restrictions`, `status`. `duration_seconds` and `is_collab` are unverified. |
| `content_metric_facts` 🕓 | Lifetime snapshots of the 15 content keys | – |
| `breakdown_facts` ✅ / ⚠️ | `follow_type` → `follower_status` ✅; demographics → `age_range`, `gender`, `country`, `city` ⚠️; `online_followers` → `hour_of_day` ⚠️; `contact_button_type` / `profile_activity` → `engagement_kind` | `media_product_type` has **no matching dimension** |
| `import_batches` ⚠️ | – | `SourceKind` has no `platform_api` value |
| `live_sessions` 🕓 | `started_at` while live | `peak_concurrent`, `avg_concurrent`, `ended_at`, `has_recording` |

### Possible only with extra permissions (not granted)

| Table | Needs |
|---|---|
| `comments`, `people` (commenters) | `instagram_manage_comments` → `/{media-id}/comments` |
| `interactions` (`mention`, `tag`) | Permission for `/tags` and `/mentioned_media` |
| `conversations`, `messages` | `instagram_manage_messages` (out of scope) |

### Never available from the API

| Table | Why |
|---|---|
| `relationships` / `v_inferred_unfollows` | No follower list. Only counts. |
| `interactions` (`story_view`, `profile_view`, `reaction` lists) | No viewer lists |
| `retention_curve_points` | No Reels retention graph (Facebook only) |
| `revenue_facts` | No Instagram earnings API |
| `content_tags` | No endpoint. Hashtags and @mentions can only be parsed from captions. |
| `content_briefs` | By design (written by hand or by the agent) |

### Views
- **`v_content_summary`:** `impressions` will always be NULL for Instagram (the metric was removed). `engagements`
  should come from `total_interactions`.
- **`v_expiring_metrics`:** shows wrong numbers for Stories until their retention is fixed.

---

## 6. Changes needed before writing the connector

1. Add `platform_api` to `SourceKind` and the `creator.source_kind_t` Postgres enum (the migration needs an
   autocommit block).
2. Add a content-type dimension (POST / REEL / STORY) to `Dimension`, or decide to reuse `discovery_surface`.
3. New catalogue keys:
   - account: `likes`, `comments`, `saves`, `shares`, `reposts`, `replies`
   - content: `profile_visits`, `total_interactions`, `crossposted_views`, `facebook_views`, story `link_clicks`,
     story `swipe_forward`
   - audience: follower, engaged and reached demographics
4. Fix the four `story_*` rows: `retention_days` 730 → 1.
5. Connector conversions:
   - `saved` → `saves`
   - Reels watch time, milliseconds → seconds
   - `total_interactions` → `interactions`
   - `reach` → `accounts_reached`
   - `profile_views` → `profile_visits`
   - `website_clicks` → `link_taps`
6. Sync schedule:
   - daily account pull, re-pulling the last 2 to 3 days
   - posts: list `/media`, then lifetime insights
   - Stories every 4 to 6 hours
7. Update the README and docs, which currently promise "no connections to the platforms".

---

## 7. Still to test

| What | How to unlock |
|---|---|
| `/{media-id}/insights` for feed posts (10 metrics), Reels (13), `profile_activity` | Restore an archived post, or publish a post and a Reel |
| `/{story-id}/insights`, `navigation` | Publish a Story, then run the probe within 24 hours |
| `/{media-id}/children` on our own carousel | Publish a carousel |
| Reels watch time units (milliseconds expected) | First Reel |
| `follows_and_unfollows`, demographics, `online_followers` with data | 100 followers |
| `duration_seconds`, `collaborators` fields | First video post |

Re-run with `powershell -ExecutionPolicy Bypass -File scripts/probe_instagram.ps1` from `backend/`. The probe picks
up any new posts and Stories automatically.

---

## 8. Next platform: YouTube

Nothing is set up yet. According to the feasibility report it's the easiest platform: one Google Cloud project, an
OAuth client (Desktop app, loopback redirect), and the `youtube.readonly`, `yt-analytics.readonly` and
`yt-analytics-monetary.readonly` scopes. Publish the app "In production" or use Personal mode, because refresh tokens
of apps left in "Testing" expire after 7 days. Create the Reporting API `channel_reach_basic_a1` job on day one to
start the impressions history.

# Meta APIs (Instagram Platform + Facebook Page Insights) as a source for a self-hosted creator analytics archive — state as of Nov 2026

Research date: 2026-11-20. Primary sources are Meta developer docs fetched on that date. Doc pages that disagree with each other are flagged inline.

Key URLs (shortened in citations below):
- IG account insights ref: https://developers.facebook.com/docs/instagram-platform/api-reference/instagram-user/insights
- IG media insights ref: https://developers.facebook.com/docs/instagram-platform/reference/instagram-media/insights
- IG changelog: https://developers.facebook.com/docs/instagram-platform/changelog
- IG overview: https://developers.facebook.com/docs/instagram-platform/overview
- Graph API versions: https://developers.facebook.com/docs/graph-api/changelog/versions

## Q1. Exact metric names, periods, metric_type and breakdowns, mapped to the catalogue

### Takeaway
Account-level `/{ig-user-id}/insights` now uses a "views + interactions" metric set. Almost everything is `period=day` with `metric_type=total_value`; only `reach` (and the deprecated `impressions`) also support `time_series`. Media-level `/{ig-media-id}/insights` gives views, reach, likes, comments, shares, saved, reposts, follows, profile_visits, Reels watch time, average watch time and (since Dec 2025) `reels_skip_rate`. Stories give `navigation`, broken down into tap_forward, tap_back, tap_exit and swipe_forward, plus `replies`. Most of the catalogue is covered. The gaps are bio-link taps at account level, account-level profile visits, and follower lists.

### Cited Findings
**Account-level `GET /{ig-user-id}/insights`, as currently documented**
- `accounts_engaged`: period `day`, `total_value`, no breakdowns. Counts accounts that interacted with content, including ads. Estimated. — [IG account insights ref](https://developers.facebook.com/docs/instagram-platform/api-reference/instagram-user/insights)
- `reach`: period `day`, `total_value` **and** `time_series`. Breakdowns `media_product_type`, `follow_type`. Counts unique accounts. Estimated. — [same](https://developers.facebook.com/docs/instagram-platform/api-reference/instagram-user/insights)
- `views`: period `day`, `total_value`. Breakdowns `follower_type`, `media_product_type`. Marked "in development". — [same](https://developers.facebook.com/docs/instagram-platform/api-reference/instagram-user/insights)
- `total_interactions`: `day`, `total_value`, breakdown `media_product_type`. Includes boosted content. — [same](https://developers.facebook.com/docs/instagram-platform/api-reference/instagram-user/insights)
- `likes`, `comments`, `saves`, `shares`: each `day`, `total_value`, breakdown `media_product_type`. `comments` is marked "in development". — [same](https://developers.facebook.com/docs/instagram-platform/api-reference/instagram-user/insights)
- `reposts`: `day`, `total_value`, no breakdown. Covers reposts of posts, stories, reels and videos. — [same](https://developers.facebook.com/docs/instagram-platform/api-reference/instagram-user/insights)
- `replies`: `day`, `total_value`. Counts story replies, including quick reactions. — [same](https://developers.facebook.com/docs/instagram-platform/api-reference/instagram-user/insights)
- `follows_and_unfollows`: `day`, `total_value`, breakdown `follow_type`. Counts accounts that followed, and accounts that unfollowed or left. — [same](https://developers.facebook.com/docs/instagram-platform/api-reference/instagram-user/insights)
- `profile_links_taps`: `day`, `total_value`, breakdown `contact_button_type` (`BOOK_NOW`, `CALL`, `DIRECTION`, `EMAIL`, `INSTANT_EXPERIENCE`, `TEXT`, `UNDEFINED`). It covers **contact buttons only, not the bio/website link**. — [same](https://developers.facebook.com/docs/instagram-platform/api-reference/instagram-user/insights)
- `follower_demographics` and `engaged_audience_demographics`: period `lifetime`, `total_value`. Breakdowns `age`, `city`, `country`, `gender`. A `timeframe` is required. — [same](https://developers.facebook.com/docs/instagram-platform/api-reference/instagram-user/insights)
- `impressions` is listed but **deprecated**. — [same](https://developers.facebook.com/docs/instagram-platform/api-reference/instagram-user/insights)
- Breakdown values:
  - `follow_type` = `FOLLOWER`, `NON_FOLLOWER`, `UNKNOWN`
  - `media_product_type` = `AD`, `STORY`, `REEL`, `POST`, `CAROUSEL_CONTAINER`
  - `follower_type` values are not defined in the doc
  - with `time_series`, breakdowns are not returned
  - an unsupported breakdown in a multi-metric request returns "An unknown error has occurred."
  - [same](https://developers.facebook.com/docs/instagram-platform/api-reference/instagram-user/insights)
- `follower_count` and `online_followers` still appear in the doc's Limitations section ("not available … fewer than 100 followers"; `online_followers` only for the last 30 days). They are **absent from the current metrics table**. — [same](https://developers.facebook.com/docs/instagram-platform/api-reference/instagram-user/insights)
  - A third party claims `follower_count` was removed from /insights in v22+. — [Zernio](https://docs.zernio.com/analytics/get-instagram-follower-history)
  - Supermetrics describes it as daily new followers that can only be fetched for the last 30 days, excluding today. — [Supermetrics fields](https://docs.supermetrics.com/docs/en/instagram-insights-fields.md)
  - Status is UNCERTAIN; verify with a live call.
- The IG User node field `followers_count` gives the current total follower count, and `follows_count` and `media_count` are also available. Snapshotting `followers_count` daily is the reliable way to build a follower-count history. — [IG User ref](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user)

**Media-level `GET /{ig-media-id}/insights`**
- FEED: `comments`, `facebook_views`, `follows`, `impressions` (deprecated), `likes`, `profile_activity` (breakdown `action_type`), `profile_visits`, `reach`, `reposts`, `saved`, `shares`, `total_interactions`, `views`. `total_comments`, `total_likes` and `total_views` include ads and are available with Facebook Login only. — [IG media insights ref](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media/insights)
- REELS:
  - `comments`, `likes`, `saved`, `shares`, `reposts`, `reach`, `total_interactions`, `views`
  - `crossposted_views`: IG and FB combined. Errors if the reel was not shared to FB.
  - `facebook_views`
  - `ig_reels_avg_watch_time`
  - `ig_reels_video_view_total_time`: includes replays; "in development"
  - `reels_skip_rate`: share of views that skipped in the first 3 seconds; estimated, "in development"
  - [same](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media/insights)
  - Note: **no `follows` or `profile_visits` listed for REELS**, only for FEED and STORY.
- STORY:
  - `facebook_views`, `reach`, `reposts`, `shares`, `total_interactions`, `views`, `follows`, `profile_visits`, `profile_activity`
  - `link_clicks`
  - `navigation`, with breakdown `story_navigation_action_type` = `TAP_FORWARD`, `TAP_BACK`, `TAP_EXIT`, `SWIPE_FORWARD` (responses use lowercase values)
  - `replies`: returns 0 for stories by users in Europe or Japan
  - `impressions`: deprecated for media created after 2 Jul 2024
  - [same](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media/insights)
- `profile_activity` `action_type` values: `BIO_LINK_CLICKED`, `CALL`, `DIRECTION`, `EMAIL`, `OTHER`, `TEXT`. This gives **per-post** bio-link taps after engagement. — [same](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media/insights)
- Insights are not available for media inside an album (carousel children). — [same](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media/insights)

**Catalogue mapping**

| Catalogue item | API source | Status |
|---|---|---|
| Account views | `views` (user insights) | Available |
| Reach | `reach` | Available |
| Interactions | `total_interactions` | Available |
| Accounts engaged | `accounts_engaged` | Available |
| Follower total | `followers_count` field | Available (snapshot it) |
| Follows / unfollows | `follows_and_unfollows` (`follow_type`) | Available; needs ≥100 followers |
| Profile visits (account) | `profile_views` | **Deprecated** (Oct 2024 changelog); only per-media `profile_visits` (FEED/STORY) remain |
| External link taps | `website_clicks` | **Deprecated**; `profile_links_taps` covers contact buttons only; bio-link taps only per post via `profile_activity`/`BIO_LINK_CLICKED` |
| Post views, reach, likes, comments, shares, saves, reposts | media insights metrics above | Available |
| Reels watch time / average watch time | `ig_reels_video_view_total_time`, `ig_reels_avg_watch_time` | Available |
| Skip rate | `reels_skip_rate` | Available |
| Follows from post | `follows` | FEED/STORY only per doc |
| Story exits, forward taps, back taps | `navigation` breakdown | Available |
| Story replies | `replies` | Available |
| Demographics | `follower_demographics` / `engaged_audience_demographics` | Available |
| Follower lists | none | Not available |

### Inferences
- An archive should call `/insights` once a day per metric with `period=day&metric_type=total_value` and a `since/until` covering one day. That builds the daily series itself, because most account metrics no longer support `time_series`.
- "Views" at the account level is still flagged "in development". Expect definition drift, so store raw responses.

### Gaps
- `follower_type` breakdown values for `views` are undocumented.
- The current status of `follower_count`, `online_followers` and `profile_views` is ambiguous. They appear in the Limitations section but not in the metric table, and `profile_views` is in the Oct 2024 deprecation list. Confirm with a live call.

## Q2. Deprecations 2024–2026, new metrics, and the Graph API version in effect late 2026

### Takeaway
- **Removed:** `video_views` and the `email_contacts` family (all versions from 8 Jan 2025); `impressions`, `plays`, `clips_replays_count` and `ig_reels_aggregated_all_plays_count` (all versions from 21 Apr 2025).
- **Added:** `views` (Jan 2025); `reposts`, `reels_skip_rate`, `crossposted_views` and `facebook_views` (Dec 2025); `total_likes`, `total_comments` and `total_views` (Apr 2026); story `link_clicks` (Jun 2026).
- **Version:** the latest Graph API is v26.0 (29 Jul 2026).

### Cited Findings
- **21 May 2024:** timeframes `last_14_days`, `last_30_days`, `last_90_days` and `prev_month` were deprecated for demographics (v20.0+; all versions 19 Aug 2024). — [IG changelog](https://developers.facebook.com/docs/instagram-platform/changelog)
- **17 Sep 2024:** new Instagram Login scope names were introduced. The old `business_*` scopes were deprecated on 27 Jan 2025. — [IG changelog](https://developers.facebook.com/docs/instagram-platform/changelog); [Instagram Login page](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login)
- **2 Oct 2024 (v21.0):** `video_views` was deprecated for media. `email_contacts`, `get_direction_clicks`, `profile_views`, `text_message_clicks`, `website_clicks` and `phone_call_clicks` were deprecated for user insights. All versions were affected from 8 Jan 2025. — [IG changelog](https://developers.facebook.com/docs/instagram-platform/changelog)
- **4 Dec 2024:** Instagram Basic Display API was shut down; all requests return errors. — [IG changelog](https://developers.facebook.com/docs/instagram-platform/changelog)
- **21 Jan 2025 (v22.0):** `views` was added for media and user. `impressions`, `plays`, `clips_replays_count` and `ig_reels_aggregated_all_plays_count` were deprecated (all versions 21 Apr 2025). v1.0 Instagram endpoints were deprecated. — [IG changelog](https://developers.facebook.com/docs/instagram-platform/changelog)
- **3 Dec 2025:** `reels_skip_rate`, `reposts` (media and user), `crossposted_views` and `facebook_views` were added. — [IG changelog](https://developers.facebook.com/docs/instagram-platform/changelog)
- **22 Apr 2026:** `total_likes`, `total_comments` and `total_views` (include ads) were added. `facebook_views` was expanded to Feed, Reels and Story. — [IG changelog](https://developers.facebook.com/docs/instagram-platform/changelog)
- **22 Jun 2026:** Story `link_clicks` was added. — [IG changelog](https://developers.facebook.com/docs/instagram-platform/changelog)
- `profile_links_taps` does not appear in the changelog, but it is in the current user-insights reference. — [IG changelog](https://developers.facebook.com/docs/instagram-platform/changelog); [IG account insights ref](https://developers.facebook.com/docs/instagram-platform/api-reference/instagram-user/insights)
- Graph API versions:

  | Version | Released | Expires |
  |---|---|---|
  | v26.0 | 29 Jul 2026 | TBD |
  | v25.0 | 18 Feb 2026 | 29 Jul 2028 |
  | v24.0 | 8 Oct 2025 | 18 Feb 2028 |
  | v23.0 | 29 May 2025 | 8 Oct 2027 |
  | v22.0 | 21 Jan 2025 | 20 May 2027 |
  | v21.0 | 2 Oct 2024 | 21 Jan 2027 |
  | v20.0 | 21 May 2024 | 24 Sep 2026 |

  No version newer than v26.0 is listed. — [Graph API versions](https://developers.facebook.com/docs/graph-api/changelog/versions); [v26 blog](https://developers.facebook.com/blog/post/2026/07/29/introducing-graph-api-v26-and-marketing-api-v26/)
- Conflict: one search summary said English pages show "TBD" for the v25 expiry, but the versions page fetched on 2026-11-20 shows 29 Jul 2028. — [Graph API versions](https://developers.facebook.com/docs/graph-api/changelog/versions)

### Inferences
- Target v26.0 (or v25.0) in late 2026. v21.0 dies on 21 Jan 2027.
- Meta adds metrics roughly twice a year. The archive schema should accept unknown metric names, for example by storing key/value rows.

### Gaps
- I found no evidence of further IG deprecations announced for 2026–2027 beyond the above.

## Q3. History windows and retention

### Takeaway
Instagram does not offer deep backfill. Meta's own pages conflict on retention for account metrics: "up to 90 days" vs 2 years. Media metrics are stored for up to 2 years. Story insights are only available for 24 hours. Demographics only come in `this_week` and `this_month` windows. A self-hosted archive must poll from day one; history cannot be backfilled.

### Cited Findings
- `since`/`until` are inclusive Unix timestamps. Without them the API looks back 24 hours. The current reference states no maximum range. Data can be delayed up to 48 hours. — [IG account insights ref](https://developers.facebook.com/docs/instagram-platform/api-reference/instagram-user/insights)
- Meta's Insights overview says: "User Metrics data is stored for up to 90 days." — [IG Insights overview](https://developers.facebook.com/documentation/instagram-platform/insights)
  - Conflicts with Supermetrics: metrics data is stored up to 2 years. — [Supermetrics](https://docs.supermetrics.com/docs/good-to-know-about-instagram-insights.md)
  - Conflicts with Fivetran: most user insights are kept about 6 months, except reach, which is kept up to 2 years. — [Fivetran](https://fivetran.com/docs/connectors/applications/instagram-business/troubleshooting/skipped-media-metrics-warning)
- Third parties report that `since`/`until` can only fetch 30 days per request. — [Mixed Analytics](https://mixedanalytics.com/knowledge-base/import-instagram-data-to-google-sheets/)
- A reported error reads "(#100) (follower_count) metric only supports querying data for the last 30 days excluding the current day." This is a third-party report, not current Meta docs. — [Supermetrics fields](https://docs.supermetrics.com/docs/en/instagram-insights-fields.md)
- `online_followers` is available only for the last 30 days. — [IG account insights ref](https://developers.facebook.com/docs/instagram-platform/api-reference/instagram-user/insights)
- Media metrics are stored for up to 2 years. — [IG media insights ref](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media/insights)
- Story insights are available for 24 hours. Use the `story_insights` webhook to capture them before expiry. That webhook is available with Facebook Login only, because insights webhooks are not supported with Instagram Login. Stories with fewer than 5 viewers return error code 10. — [IG media insights ref](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media/insights); [IG Insights overview](https://developers.facebook.com/documentation/instagram-platform/insights)
- Demographics `timeframe` options:
  - Only `this_week` (last 7 days) and `this_month` (last 30 days) remain. The `last_*` and `prev_month` options are no longer supported from v20.
  - `timeframe` overrides `since`/`until`.
  - Only the top 45 values are returned per breakdown.
  - [IG account insights ref](https://developers.facebook.com/docs/instagram-platform/api-reference/instagram-user/insights)
- Thresholds:
  - `follows_and_unfollows` and `follower_demographics` are not returned under 100 followers.
  - `engaged_audience_demographics` is not returned under 100 engagements in the timeframe.
  - Unavailable data returns an empty set, not 0.
  - [same](https://developers.facebook.com/docs/instagram-platform/api-reference/instagram-user/insights)

### Inferences
- Poll stories at least every few hours while they are live, with a last call near the 24-hour mark. Without Facebook Login there is no webhook, so the poller must catch them before they expire.
- Snapshot demographics weekly and monthly, and `followers_count` daily. Treat 90 days as the safe backfill horizon for account metrics, and query in chunks of 30 days or less.

### Gaps
- The exact maximum `since`/`until` span and retention for account metrics are not stated consistently by Meta. Test empirically.

## Q4. Auth and setup

### Takeaway
You need an Instagram Professional account (Creator or Business). For your own account, the easiest route is "Instagram API with Instagram Login" (`graph.instagram.com`): no Facebook Page is needed, the scopes are `instagram_business_basic` and `instagram_business_manage_insights`, and the app stays at Standard Access. Standard Access is for apps used only by accounts with roles on the app, so no App Review or Business Verification is required. Long-lived tokens last 60 days and can be refreshed once they are 24 hours old.

### Cited Findings
- Three setups exist:
  - **Unified Login** (`graph.facebook.com`): recommended for new integrations. Users log in with Instagram or Facebook; no Page is required; uses a Business Integration System User token.
  - **Instagram Login** (`graph.instagram.com`): for accounts without a Page; uses an Instagram User token.
  - **Facebook Login** (`graph.facebook.com`): for Page-linked accounts; uses a Facebook User or Page token.
  - [IG overview](https://developers.facebook.com/docs/instagram-platform/overview); [IG media insights ref](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media/insights)
- Instagram Login quote: "This API setup does not require a Facebook Page to be linked to the Instagram professional account." It cannot access ads or tagging. — [Instagram Login page](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login)
- Insights permissions:

  | Login type | Permissions |
  |---|---|
  | Instagram Login | `instagram_business_basic`, `instagram_business_manage_insights` |
  | Facebook Login | `instagram_basic`, `instagram_manage_insights`, `pages_read_engagement` (+ `ads_management`, `ads_read` if the user has a Business Manager role on the Page) |
  | Unified Login | `instagram_basic`, `instagram_manage_insights` |

  — [IG account insights ref](https://developers.facebook.com/docs/instagram-platform/api-reference/instagram-user/insights)
- Access levels:
  - Standard Access is the default and is "intended for apps that will only be used by people who have roles on them."
  - Advanced Access "requires App Review and Business Verification." It is needed only to serve accounts you don't own or manage.
  - [IG overview](https://developers.facebook.com/docs/instagram-platform/overview); [Business Login](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login)
- OAuth flow (Instagram Login):
  1. Send the user to `https://www.instagram.com/oauth/authorize`.
  2. The returned code is valid for 1 hour and can be used once.
  3. Exchange it at `https://api.instagram.com/oauth/access_token` for a short-lived token (1 hour).
  4. Call `GET https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=…` to get a long-lived token (60 days). This must happen server-side.
  - [Business Login](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login); [IG overview](https://developers.facebook.com/docs/instagram-platform/overview)
- Refresh:
  - Call `GET https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=…`.
  - The token must be at least 24 hours old, unexpired, and granted `instagram_business_basic`.
  - The new token is valid 60 days from the refresh.
  - "Tokens that have not been refreshed in 60 days will expire and can no longer be refreshed."
  - [Refresh ref](https://developers.facebook.com/docs/instagram-platform/reference/refresh_access_token); [Business Login](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login)

### Inferences
- A self-hosted single-creator tool can run as a Standard Access app, with the creator's IG account added in the App Dashboard. A scheduled job should refresh the token about every 30–50 days.
- Choose Facebook Login only if you want the `story_insights` webhook or the ads-inclusive `total_*` metrics. That route requires a linked Facebook Page.

### Gaps
- The pages fetched did not describe the exact Development-mode mechanics (adding an "Instagram Tester" role and accepting the invite in the IG app). Verify in the App Dashboard docs.
- Not verified: whether an app in Development mode (vs Live with Standard Access) can call insights.

## Q5. Rate limits and pagination

### Takeaway
Instagram uses Business Use Case (BUC) limits: calls within 24 hours = 4800 × the account's impressions in that window, per app and account pair. Usage is reported in the `X-Business-Use-Case-Usage` header. This is ample for a daily archive.

### Cited Findings
- "Calls within 24 hours = 4800 * Number of Impressions." This is a rolling 24-hour window per app/app-user pair. Impressions are the times the account's content appeared on screen in the last 24 hours. — [Rate limiting](https://developers.facebook.com/docs/graph-api/overview/rate-limiting); [IG overview](https://developers.facebook.com/docs/instagram-platform/overview)
- The `X-Business-Use-Case-Usage` header has fields `call_count`, `total_cputime`, `total_time`, `type` and `estimated_time_to_regain_access`. — [Rate limiting](https://developers.facebook.com/docs/graph-api/overview/rate-limiting)
- Business Discovery and Hashtag Search use Platform Rate Limits: 200 × number of users per hour per app. This is not a per-user cap. — [Rate limiting](https://developers.facebook.com/docs/graph-api/overview/rate-limiting)
- Facebook Page BUC: 4800 × engaged users per 24 hours, for Page or system-user tokens. — [Rate limiting](https://developers.facebook.com/docs/graph-api/overview/rate-limiting)

### Inferences
- Use cursor-based pagination (`paging.cursors.after` / `paging.next`) for `/{ig-user-id}/media`, as is standard on the Graph API. Not re-verified in this session; see Gaps.
- Batch metrics in one `/insights` call per media item. Mixing incompatible metrics or breakdowns can error.

### Gaps
- Pagination page sizes and limits for `/media` were not confirmed from a fetched page in this session.

## Q6. Follower lists / who unfollowed

### Takeaway
No. The Instagram APIs expose follower counts and daily follow/unfollow totals only, never identities.

### Cited Findings
- The IG User node exposes `followers_count` and `follows_count`. Its edges are media, stories, live_media, tags, mentioned_media, collaborative_media, insights, business_discovery and others. There is no followers or following edge. — [IG User ref](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user)
- `follows_and_unfollows` returns aggregate counts only. — [IG account insights ref](https://developers.facebook.com/docs/instagram-platform/api-reference/instagram-user/insights)
- Basic Display API (the old consumer API) is shut down. — [IG changelog](https://developers.facebook.com/docs/instagram-platform/changelog)

### Inferences
- Follower lists are only obtainable through the user's own "Download your information" export from Instagram, a manual non-API route outside this scope, or through scraping. Scraping breaches Meta terms.

### Gaps
- I found no explicit Meta sentence stating "follower lists are not available". The conclusion rests on the absence of an edge in the reference.

## Q7. Facebook Page and video insights (if the creator also has a Page)

### Takeaway
Page insights moved from "impressions" to "views" (`page_media_view`, `post_media_view`). Fan metrics became follow metrics. Data is available for 2 years, with up to 90 days per `since`/`until` query. Reels on Facebook have lifetime-only video insights (plays, watch time, follows).

### Cited Findings
- **Deprecated 15 Nov 2025** (calls return "invalid metric"):

  | Old metric | Replacement |
  |---|---|
  | `page_fans` | `page_follows` |
  | `page_fans_city` / `page_fans_country` | `page_follows_city` / `page_follows_country` |
  | `page_impressions` | `page_media_view` |
  | `page_impressions_paid` | `page_media_view` with `is_from_ads` breakdown |
  | `post_impressions` | `post_media_view` |
  | `post_impressions_fan` | `post_media_view` with `is_from_followers` breakdown |
  | `post_impressions_paid` / `post_impressions_organic` | `post_media_view` with `is_from_ads` breakdown |

  No replacement: `page_fan_adds(_unique)`, `page_fan_removes(_unique)`, `page_fans_locale`, viral/nonviral impressions. — [Deprecated Page metrics](https://developers.facebook.com/documentation/pages-api/platforminsights/page/deprecated-metrics); [Meta blog 15 Aug 2025](https://developers.facebook.com/blog/post/2025/08/15/page-insights-api-updates/)
- **By 15 Jun 2025:** `page_impressions_unique` → `page_total_media_view_unique` and `post_impressions_unique` → `post_total_media_view_unique`, plus the paid, viral and organic unique variants. — [Deprecated Page metrics](https://developers.facebook.com/documentation/pages-api/platforminsights/page/deprecated-metrics)
- **14 Mar 2024:** large removal of `page_engaged_users`, `page_consumptions`, `page_views_logged_in_*`, `page_fans_gender_age` and others. — [same](https://developers.facebook.com/documentation/pages-api/platforminsights/page/deprecated-metrics)
- Current Page metrics:

  | Metric | Periods | Notes |
  |---|---|---|
  | `page_media_view` | day/week/days_28 | Breakdowns `is_from_ads`, `is_from_followers` |
  | `page_total_media_view_unique` | | |
  | `page_follows` | | |
  | `page_daily_follows`, `page_daily_follows_unique` | | |
  | `page_daily_unfollows_unique` | | |
  | `page_post_engagements` | | |
  | `page_views_total` | | |
  | `page_video_views` | | 3s+ |
  | `page_video_view_time` | | ms |

  Post-level: `post_media_view`, `post_total_media_view_unique`, `post_clicks`, `post_reactions_by_type_total`, `post_video_avg_time_watched`, `post_video_retention_graph`.

  Requires `read_insights` and `pages_read_engagement` with a Page token that has the ANALYZE task. Needs 100+ likes for Page insights and 100+ people for demographics. — [Page Insights ref](https://developers.facebook.com/docs/graph-api/reference/insights)
- Limits: data for the last 2 years; "Only 90 days of insights can be viewed at one time" with `since`/`until`; most metrics update every 24 hours. — [Page Insights ref](https://developers.facebook.com/docs/graph-api/reference/insights)
- The Page Insights reference warns: "By June 15, 2026, a number of the Page Insights metrics will be deprecated for all API versions." Meta's deprecated-metrics page lists the impressions_unique family as "by June 15, 2025", so this "2026" may be a typo or a separate wave. UNCERTAIN. — [Page Insights ref](https://developers.facebook.com/docs/graph-api/reference/insights); [Deprecated Page metrics](https://developers.facebook.com/documentation/pages-api/platforminsights/page/deprecated-metrics)
- Facebook Reels video insights (`/{video-id}/video_insights`, lifetime only):
  - `blue_reels_play_count`, `fb_reels_total_plays`, `fb_reels_replay_count`
  - `post_impressions_unique` (still listed here despite the post-level deprecation above; conflict)
  - `post_video_avg_time_watched`, `post_video_view_time` (ms)
  - `post_video_followers` (follows from the reel), `post_video_social_actions`, `post_video_likes_by_reaction_type`, `post_video_retention_graph`
  - Data covers the past 2 years. Requires `pages_manage_engagement` and `read_insights`.
  - [Video insights ref](https://developers.facebook.com/docs/graph-api/reference/video/video_insights)

### Inferences
- If the creator crossposts Reels to Facebook, IG `crossposted_views`/`facebook_views` give a cheap combined view without Page tokens. Full FB Reels watch-time and retention data needs the Page and video insights endpoints.

### Gaps
- Which Page metrics, if any, were actually removed on 15 Jun 2026 could not be confirmed.

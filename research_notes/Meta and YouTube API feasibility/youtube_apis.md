# YouTube Data API v3, YouTube Analytics API and YouTube Reporting API as sources for a self-hosted creator analytics archive (as of Nov 2026)

Notes compiled 2026-11-20. All facts come from Google developer pages fetched on that date unless marked otherwise. Several 2026 changelog entries (for example the June 2026 quota buckets, the Aug 2026 view-definition change and "Personal mode" OAuth clients) are recent, so check them against the live docs before relying on them.

Abbreviations: **DataAPI** = YouTube Data API v3, **AA** = YouTube Analytics API (Targeted Queries, `reports.query`), **RA** = YouTube Reporting API (Bulk Reports).

## 1. Metric catalogue mapping: which API exposes each metric, and under what name

### Takeaway
Nearly every per-channel and per-video catalogue metric is available. AA gives views, watch time, engagement, subscribers gained/lost, demographics and revenue. DataAPI gives near-realtime counters. Impressions and impressions CTR were added to RA only, in Jan 2026 (`channel_reach_basic_a1`: `video_thumbnail_impressions`, `video_thumbnail_impressions_ctr`). I could not confirm that they exist in AA. No API exposes unique, new or returning viewers in their current Studio form, and subscriber identity lists are only partial.

### Cited Findings

**Mapping table** (sources are in the bullets below)

| Catalogue metric | API and field | Notes |
|---|---|---|
| Channel daily views | AA `views` with `dimensions=day`; RA `channel_basic_a3.views` | Definition changed in Mar 2025 (Shorts), Aug 2026 (first frame) and Nov 2026 (co-views). Also `engagedViews` / `engaged_views`. |
| Watch time (hours) | AA `estimatedMinutesWatched` (minutes, so divide by 60); RA `watch_time_minutes` | |
| Subscribers gained / lost / net | AA `subscribersGained`, `subscribersLost` (net = gained − lost, computed by you); RA `subscribers_gained`, `subscribers_lost` | Video-level values count only subs from the watch page. |
| Realtime subscriber count | DataAPI `channels.list` `statistics.subscriberCount` | Rounded down to 3 significant figures above 1,000 since Sep 2019. |
| Impressions | RA `video_thumbnail_impressions` (`channel_reach_basic_a1` / `channel_reach_combined_a1`) | Added 2026-01-15. AA availability is unconfirmed (see the conflict below). |
| Impressions CTR | RA `video_thumbnail_impressions_ctr` | Same as above. |
| Unique viewers | Not available in the Studio sense. AA has a legacy `uniques` metric only in "User activity by country for specific time periods". | See section 1 gaps. |
| New viewers / returning viewers | Not found in any API | Only `subscribedStatus` (SUBSCRIBED/UNSUBSCRIBED) exists as a split. |
| Per-video views, likes, comments, shares | AA `views`, `likes`, `comments`, `shares` with `dimensions=video` or `filters=video==ID`; RA `channel_basic_a3` per `video_id`; DataAPI `videos.list` `statistics` for current lifetime totals | `dislikes` is still an AA/RA metric. |
| Per-video watch time, average view duration, average % viewed | AA `estimatedMinutesWatched`, `averageViewDuration` (seconds), `averageViewPercentage`; RA `watch_time_minutes`, `average_view_duration_seconds`, `average_view_duration_percentage` | `averageViewPercentage` is non-core. |
| Per-video impressions / CTR | RA reach reports (dimension `video_id`) | |
| Per-video subscribers gained | AA `subscribersGained` with the video dimension; RA `subscribers_gained` | |
| Estimated revenue | AA `estimatedRevenue` (also `estimatedAdRevenue`, `estimatedRedPartnerRevenue`); RA system-managed revenue reports | Needs the monetary scope and YPP membership, otherwise 403. |
| CPM | AA `cpm` (gross per 1,000 ad impressions), `playbackBasedCpm` | |
| RPM | No `rpm` metric found. Compute it yourself as estimatedRevenue / views × 1000. | Developer policy III.E.4.h restricts "derived metrics" (see section 5). |
| Demographics (age, gender) | AA `viewerPercentage` by `ageGroup`, `gender`; RA `channel_demographics_a1` | Since Mar 2026, ageGroup includes users estimated to be under 18. |
| Country | AA `country` dimension (also `province`, `city`, `dma`); RA `country_code` in `channel_basic_a3` | |
| Subscriber identity lists | DataAPI `subscriptions.list?mySubscribers=true` / `myRecentSubscribers=true` | Partial: "might be limited". There is no unsubscriber list. |

**Analytics API metric definitions**
- AA metrics list: `views` (core), `engagedViews` (core; "viewed past the first frame, or the user clicks/taps to play"), `estimatedMinutesWatched` (core), `averageViewDuration` (core, seconds; excludes looping clips since 2021-12-13), `averageViewPercentage` (non-core), `likes`, `dislikes`, `comments`, `shares`, `subscribersGained`, `subscribersLost` (all core), and `viewerPercentage` (core). Video-level `subscribersGained`/`subscribersLost` count only the video's watch page. — [AA Metrics](https://developers.google.com/youtube/analytics/metrics)
- The `views` definition now includes co-views ("when multiple people watch together on a television screen") and "represents different numbers in different types of reports." — [AA Metrics](https://developers.google.com/youtube/analytics/metrics)
- Revenue metrics: `estimatedRevenue` (core, formerly `earnings`), `estimatedAdRevenue`, `estimatedRedPartnerRevenue`, `grossRevenue`, `cpm` (formerly `impressionBasedCpm`, gross revenue per 1,000 ad impressions), `adImpressions` (formerly `impressions`, which means ad impressions, not thumbnail impressions), `monetizedPlaybacks`, `playbackBasedCpm`. All are subject to month-end adjustment. USD is the default, and some metrics accept a `currency` parameter. — [AA Metrics](https://developers.google.com/youtube/analytics/metrics)
- Core metrics are covered by the Deprecation Policy. Non-core metrics are not. — [AA Metrics](https://developers.google.com/youtube/analytics/metrics)
- I found no `rpm` metric on the AA metrics page. — [AA Metrics](https://developers.google.com/youtube/analytics/metrics)
- Monetary metrics need the `yt-analytics-monetary.readonly` scope, and the channel must be in the YouTube Partner Program. Otherwise the call returns `403 Forbidden`. This was restated in the Sep 9, 2026 revision. — [AA Channel Reports](https://developers.google.com/youtube/analytics/channel_reports); [AA Revision History](https://developers.google.com/youtube/analytics/revision_history)
- Demographics report: dimensions `ageGroup` and/or `gender`, optionally with `creatorContentType`, `liveOrOnDemand` or `subscribedStatus`. Metric: `viewerPercentage`. Geographic reports: `country`, `province` (needs `country==US`), `city` (needs maxResults ≤ 250 and a sort), `dma` (needs `country==US` or a province filter). — [AA Channel Reports](https://developers.google.com/youtube/analytics/channel_reports)
- Mar 9, 2026: `ageGroup` (AA) and `age_group` (RA) now include users YouTube "estimates to be under 18." — [AA Revision History](https://developers.google.com/youtube/analytics/revision_history)
- The only "unique" metric in AA channel reports is `uniques`, in the "User activity by country for specific time periods" report. There is no `uniqueViewers` metric. — [AA Channel Reports](https://developers.google.com/youtube/analytics/channel_reports)
- The dimensions page does not mention uniques, new viewers or returning viewers. The closest split is `subscribedStatus` (`SUBSCRIBED`/`UNSUBSCRIBED`), which is recorded as of the time of the activity. — [AA Dimensions](https://developers.google.com/youtube/analytics/dimensions)

**Impressions and CTR**
- Jan 15, 2026: reach reports were added to the Reporting API for channels and content owners: `channel_reach_basic_a1`, `channel_reach_combined_a1`, `content_owner_reach_basic_a1`, `content_owner_reach_combined_a1`. The new metrics are `video_thumbnail_impressions` and `video_thumbnail_impressions_ctr`. — [AA/RA Revision History](https://developers.google.com/youtube/analytics/revision_history)
- `channel_reach_basic_a1` has dimensions `date`, `channel_id`, `video_id`. `channel_reach_combined_a1` adds `traffic_source_type`, `traffic_source_detail`, `operating_system`, `device_type`. Both have metrics `video_thumbnail_impressions` and `video_thumbnail_impressions_ctr`. Per the docs, "Reach reports provide statistics for video thumbnail impressions and click-through rates." — [RA Channel Reports](https://developers.google.com/youtube/reporting/v1/reports/channel_reports)
- **Conflict or uncertainty for the Analytics API:** a web-search snippet of the AA metrics page showed a "Reach metrics" heading listing `videoThumbnailImpressions`. The description under it looked misaligned with the metric name. — [WebSearch snippet of AA Metrics](https://developers.google.com/youtube/analytics/metrics?authuser=5). However, two direct fetches of the AA metrics page found no "Reach metrics" section, and the AA channel-reports page and revision history do not mention these metric names. — [AA Metrics](https://developers.google.com/youtube/analytics/metrics?hl=en); [AA Channel Reports](https://developers.google.com/youtube/analytics/channel_reports). Treat AA `videoThumbnailImpressions` / `videoThumbnailImpressionsClickRate` as unverified, and plan on RA as the source of record for impressions.
- Aug 27, 2026 revision: "Thumbnail Impression is also unchanged" by the new public-view definition. Engaged views still drive CTR and average view duration. — [AA Revision History](https://developers.google.com/youtube/analytics/revision_history)

**Reporting API bulk data**
- `channel_basic_a3` (User activity) has dimensions `date`, `channel_id`, `video_id`, `live_or_on_demand`, `subscribed_status`, `country_code`. Its metrics include `engaged_views`, `views`, `comments`, `likes`, `dislikes`, `shares`, `watch_time_minutes`, `average_view_duration_seconds`, `average_view_duration_percentage`, `subscribers_gained`, `subscribers_lost`, `red_views`, `red_watch_time_minutes`, plus card and annotation metrics. Other channel reports: `channel_province_a3`, `channel_playback_location_a3`, `channel_traffic_source_a3`, `channel_device_os_a3`, `channel_demographics_a1`, `channel_sharing_service_a2`, `channel_cards_a1`, `channel_end_screens_a2`, `channel_subtitles_a3`, `channel_combined_a3`. — [RA Channel Reports](https://developers.google.com/youtube/reporting/v1/reports/channel_reports)
- Revenue in RA comes through system-managed reports, which "contain ad revenue data and YouTube Premium subscription revenue data." — [RA Reports overview](https://developers.google.com/youtube/reporting/v1/reports)

**Data API: realtime counts and subscriber lists**
- Sep 10, 2019: subscriber counts above 1,000 are rounded down to three significant figures. — [Data API Revision History](https://developers.google.com/youtube/v3/revision_history)
- Sep 9, 2026: AA data is delayed 48–72 hours, and end dates are cut back to the last fully processed day. The docs recommend `videos.list` for real-time statistics. — [AA Revision History](https://developers.google.com/youtube/analytics/revision_history)
- Jun 3, 2026: new `videos.batchGetStats` method. It costs 1 unit in its own bucket, with a default of 10,000 units/day. — [Data API Revision History](https://developers.google.com/youtube/v3/revision_history)
- Dislike counts have been private since Dec 13, 2021. They appear only for requests authenticated by the video owner. — [Data API Revision History](https://developers.google.com/youtube/v3/revision_history)

### Inferences
- A complete archive needs all three APIs. Use AA for daily channel and video time series, demographics and revenue. Use RA for impressions/CTR, and as a cheap bulk daily dump of per-video `channel_basic_a3`. Use DataAPI for current lifetime counters, metadata and the subscriber count.
- Studio's "unique viewers", "new viewers" and "returning viewers" should be marked "not available via API" in the catalogue. The legacy AA `uniques` metric has narrow scope and does not match Studio's definition.
- RPM has to be computed (estimatedRevenue / views × 1000). The UI must label it as independently calculated (see section 5).

### Gaps
- I could not confirm whether AA currently supports `videoThumbnailImpressions` / `videoThumbnailImpressionsClickRate` (the sources conflict, as noted above). Test with a live query.
- I could not find whether the RA reach reports include Shorts impressions. The report page has no note either way.
- I did not find the exact current definition, or the time-period restrictions, of the AA `uniques` metric.

## 2. Shorts: engaged views vs views, and how to tell Shorts apart

### Takeaway
Since Mar 31, 2025, Shorts `views` count every start or replay. The old method lives on as `engagedViews` / `engaged_views`. In Aug 2026, public views for all content switched to "from the first frame", and in Nov 2026 co-views were added. Shorts are identified with the AA dimension `creatorContentType=SHORTS` (data from Jan 1, 2019). That dimension is not available in the RA user-activity reports.

### Cited Findings
- Mar 26, 2025 announcement: the Shorts view change takes effect Mar 31, 2025. Targeted Queries were updated by Apr 30 and Bulk Reports by Jun 30. Until then, Shorts and channel views would not match Studio. — [AA Revision History](https://developers.google.com/youtube/analytics/revision_history)
- Apr 24, 2025: in AA, `views` counts starts and replays, and `engagedViews` is available in all reports that include views. — [AA Revision History](https://developers.google.com/youtube/analytics/revision_history)
- Jun 24, 2025: the bulk-report change takes effect Jun 30, 2025. Affected reports got new versions (for example a2 → a3), with a new `engaged_views` column that keeps the old counting method. Previous versions stayed available until Sep 30, 2025, later extended to Oct 31, 2025. — [AA Revision History](https://developers.google.com/youtube/analytics/revision_history)
- DataAPI: `channels.statistics.viewCount` and `videos.statistics.viewCount` return the new Shorts count from Mar 31, 2025. — [Data API Revision History](https://developers.google.com/youtube/v3/revision_history)
- Aug 27, 2026: public views now count from the first frame of playback, including autoplay, hover and click-to-play. Engaged views are unchanged and still drive monetization, CTR and average view duration. Creator earnings are based on "Engaged Shorts views" and Engaged Watch Hours. The YPP thresholds were renamed "qualified Shorts views" and "qualified watch hours". — [AA Revision History](https://developers.google.com/youtube/analytics/revision_history); [Data API Revision History](https://developers.google.com/youtube/v3/revision_history)
- Nov 16, 2026: co-views (several people watching together on a TV) count toward public views and watch time for long-form, Live and Shorts. Engaged views exclude co-views. Earnings are unchanged. — [AA Revision History](https://developers.google.com/youtube/analytics/revision_history); [Data API Revision History](https://developers.google.com/youtube/v3/revision_history)
- `creatorContentType` values are `LIVE_STREAM`, `SHORTS`, `STORY`, `VIDEO_ON_DEMAND`, `UNSPECIFIED`. "Data for this dimension is available for dates beginning January 1, 2019." The dimension was added Dec 15, 2022. — [AA Dimensions](https://developers.google.com/youtube/analytics/dimensions); [AA Revision History](https://developers.google.com/youtube/analytics/revision_history)
- `creatorContentType` is supported in the country, province, city, DMA, subscribed-status, playback-location, traffic-source, device/OS, demographics and several top-videos reports. It is **not** supported in the basic user-activity report (dimensions "[None]"), the audience retention report or the concurrent viewers report. — [AA Channel Reports](https://developers.google.com/youtube/analytics/channel_reports)
- The RA channel report page lists no `creator_content_type` dimension for any channel report. — [RA Channel Reports](https://developers.google.com/youtube/reporting/v1/reports/channel_reports)
- Nov 6, 2026: new playback location values `SHORTS_FEED` and `IMMERSIVE_LIVE_FEED` for AA `insightPlaybackLocationType`, and 11 and 12 for RA `playback_location_type`. — [AA Revision History](https://developers.google.com/youtube/analytics/revision_history)
- Oct 30, 2026: new Shorts asset-view reports were added for content owners only, for example `music_content_owner_shorts_asset_views_a1`. — [AA Revision History](https://developers.google.com/youtube/analytics/revision_history)

### Inferences
- Store `views` and `engagedViews` side by side. Expect discontinuities in `views` at 2025-03-31, 2026-08-27 and 2026-11-16. Historical data re-queried today may not match values archived earlier.
- To split a channel's daily totals by Shorts vs long-form, query AA with `dimensions=day,creatorContentType` (or classify videos yourself), because RA does not carry the content type. I have not confirmed that `day,creatorContentType` together is an accepted combination. Unsupported combos return "The query is not supported." (400).
- The DataAPI `videos` resource has no documented "isShort" flag in the sources I checked. Per-video classification would have to come from AA `creatorContentType` with a video dimension, if supported.

### Gaps
- I did not verify whether `dimensions=day,creatorContentType` or `video,creatorContentType` are valid AA combinations.

## 3. History: how far back AA can go, and RA retention, backfill and generation

### Takeaway
I found no documented start date for AA date ranges. Queries can, in principle, cover channel history, with per-metric and per-dimension floors (for example `creatorContentType` from 2019-01-01, playlist add/remove metrics from 2014-10-01). AA data lags 48–72h. RA only generates data from job creation onward, plus a 30-day historical backfill. Reports stay downloadable for 60 days (30 days for historical-data reports), so RA must be polled and archived continuously.

### Cited Findings
- AA (Sep 9, 2026): data is delayed 48–72 hours, and end dates are cut back to the last fully processed day. Bulk report `video_id`/`channel_id` columns can be empty strings, which keeps totals for deleted resources. — [AA Revision History](https://developers.google.com/youtube/analytics/revision_history)
- AA `day` dimension: "the report actually returns data up until the last day for which all metrics specified in the request are available." The page gives no earliest date. — [AA Dimensions](https://developers.google.com/youtube/analytics/dimensions)
- Per-field floors: `creatorContentType` from Jan 1, 2019. `videosAddedToPlaylists`/`videosRemovedFromPlaylists` from Oct 1, 2014. Annotation metrics from Jul 16, 2013. Top-videos reports before Jan 1, 2013 return only the top 10 videos. — [AA Dimensions](https://developers.google.com/youtube/analytics/dimensions); [AA Metrics](https://developers.google.com/youtube/analytics/metrics); [AA Channel Reports](https://developers.google.com/youtube/analytics/channel_reports)
- AA traffic-source queries return an error when (videos × days) exceeds 50,000, effective Nov 18, 2024. — [AA Revision History](https://developers.google.com/youtube/analytics/revision_history)
- RA: "YouTube does not begin to generate your report until you create a reporting job for that report." Each report covers one day, 00:00–23:59 PST (UTC-8). "Reports are updated daily." Reports can be retrieved within 48 hours of job creation. Days with no data still produce header-only reports. — [RA Reports overview](https://developers.google.com/youtube/reporting/v1/reports)
- RA retention: "API reports are available for 60 days from the time that they are generated." "Reports containing historical data are available for 30 days." — [RA Reports overview](https://developers.google.com/youtube/reporting/v1/reports)
- RA historical data: on job creation YouTube generates reports "covering the 30-day period prior to the time that you created the job", usually all within a couple of days. — [RA Reports overview](https://developers.google.com/youtube/reporting/v1/reports)
- RA backfill: "Backfill data refers to a dataset that replaces a previously delivered set." A backfill gets a new report ID with the same start and end times. — [RA Reports overview](https://developers.google.com/youtube/reporting/v1/reports)
- RA report versions get deprecated (for example the a2 → a3 move in 2025, and the content-owner reference report v1.0 deprecated Jan 15, 2027). — [AA Revision History](https://developers.google.com/youtube/analytics/revision_history)

### Inferences
- Impressions/CTR history is the hard limit. RA reach reports start 30 days before the reach-report job is created, and I found no way to get older impressions programmatically. Create the `channel_reach_basic_a1` job on day one and download at least every ~50 days. Dedupe by (start time, end time), preferring the latest backfill.
- For other metrics, backfill history from AA (a full date range per video) and use RA as the ongoing daily feed.

### Gaps
- I found no explicit statement of the earliest date AA will return for `views` / `estimatedMinutesWatched` (presumably channel creation, but undocumented in the pages fetched).
- I did not fetch the retention and schedule of RA system-managed revenue reports (they are on a separate page).

## 4. Auth: OAuth scopes, verification, testing-mode token expiry, brand accounts

### Takeaway
Use `youtube.readonly` (DataAPI), `yt-analytics.readonly` (AA/RA) and `yt-analytics-monetary.readonly` (revenue). A personal self-hosted app does not need Google verification. However, an External-type project in "Testing" status gets refresh tokens that expire in 7 days. The ways around this are Google's newer "Personal mode" OAuth client (single user, no verification) or publishing to "In production" unverified (fewer than 100 users, click through the warning screen).

### Cited Findings
- RA/AA scopes: `https://www.googleapis.com/auth/yt-analytics.readonly` ("View YouTube Analytics reports for your YouTube content"). `https://www.googleapis.com/auth/yt-analytics-monetary.readonly` covers user-activity metrics plus estimated revenue and ad performance, and is required for earnings/ad data. — [RA Reports overview](https://developers.google.com/youtube/reporting/v1/reports)
- Sep 1, 2026: `videos.getRating` accepts the `youtube.readonly` scope. — [Data API Revision History](https://developers.google.com/youtube/v3/revision_history)
- `subscriptions.list` `mine`/`mySubscribers`/`myRecentSubscribers` require "a properly authorized request". The page names no specific scope. — [subscriptions.list](https://developers.google.com/youtube/v3/docs/subscriptions/list)
- Testing mode: an External-type project in "Testing" status "is issued a refresh token expiring in 7 days", unless it requests only name, email and profile scopes. — [Google OAuth 2.0 overview](https://developers.google.com/identity/protocols/oauth2)
- Other refresh-token limits: 100 refresh tokens per Google Account per OAuth client ID (the oldest is silently invalidated). A token unused for six months expires. — [Google OAuth 2.0 overview](https://developers.google.com/identity/protocols/oauth2)
- No verification needed: "If you are the only user of your app, you can create your project and OAuth client in Personal mode." Personal mode is limited to the creator's account, skips verification and shows no unverified-app screen. Apps in "development/testing/staging mode are not subject to verification." Limited-audience apps (fewer than 100 users) can click through the "unverified app" warning. "The 100-user cap will be in effect when an app is in development/testing/staging." — [Google Cloud Help: When verification is not needed](https://support.google.com/cloud/answer/13464323)
- Apps that request sensitive or restricted scopes and need verification must provide a demo video and a per-scope justification. Restricted scopes also need an annual security assessment. — [Google Cloud Help: verification requirements](https://support.google.com/cloud/answer/13464321)

### Inferences
- For a self-hosted single-owner archive, the recommended setup is a Personal-mode OAuth client (if it is available to the user's account), or an External app set to "In production" without submitting for verification. The owner clicks through the unverified warning once and gets a long-lived refresh token. Leaving the app in "Testing" means re-consenting every 7 days, which breaks cron jobs.
- The job must run at least once every 6 months to keep the refresh token alive. Daily jobs satisfy this easily.
- "Personal mode" is a newer Google Cloud feature. Treat its availability as something to verify in the console.

### Gaps
- I did not confirm whether `youtube.readonly` / `yt-analytics.readonly` are classified "sensitive" or "restricted".
- Brand accounts and channel managers: not researched with sources. To be verified: the OAuth consent flow asks the user to pick a channel or brand account, tokens are bound to that channel, and a manager with appropriate permissions can authorize. Also whether managers (versus owners) can get monetary data. AA `ids=channel==MINE` works for the selected channel. Content-owner (`onBehalfOfContentOwner`) access is for MCN/CMS partners only.

## 5. Quotas, audits and data-storage policy

### Takeaway
As of June 2026 the DataAPI default is 10,000 units/day for general methods, plus separate buckets: 100 `search.list` calls/day, 100 `videos.insert` calls/day, and 10,000 units/day for `videos.batchGetStats`. List calls cost 1 unit. An archive of one channel uses a tiny fraction of this. Default quota needs no audit. Only extensions do. AA quota is not documented on the pages I found. YouTube Analytics/Reporting data may be stored indefinitely, but authorization must be rechecked every 30 days.

### Cited Findings
- Costs: `channels.list` 1, `playlistItems.list` 1, `videos.list` 1, `subscriptions.list` 1, `commentThreads.list` 1. `search.list` is 1 unit per call within a separate 100-call daily bucket, and so is `videos.insert`. Default: "10,000 units per day combined for all other endpoints". Resets at midnight Pacific. — [Data API Quota Calculator](https://developers.google.com/youtube/v3/determine_quota_cost)
- Jun 1, 2026: granular quota buckets began, giving `videos.insert` and `search.list` their own buckets. Increases go through the Quota Extension Form. Dec 4, 2025: the documented upload cost dropped from ~1,600 to ~100 units. — [Data API Revision History](https://developers.google.com/youtube/v3/revision_history)
- **Conflict:** secondary sources still say `search.list` costs 100 units of the 10,000 pool. — [search summary citing determine_quota_cost](https://developers.google.com/youtube/data/determine_quota_cost); [zernio blog](https://zernio.com/blog/youtube-api-limits-how-to-calculate-api-usage-cost-and-fix-exceeded-api-quota). The current official page and revision history supersede them (bucket model since Jun 2026).
- Audits: a project that wants more than the default must first complete an audit showing compliance with the YouTube API Services Terms. The default quota is available without an audit. Forms: Audit and Quota Extension, Appeals, Periodic Audit, Change of Control. — [Quota and Compliance Audits](https://developers.google.com/youtube/v3/guides/quota_and_compliance_audits)
- AA quota: one secondary source reports 720 requests/minute and 100k/day for Analytics v2. A Stack Overflow mirror cites older "1M units/day" figures. I found no official confirmation. — [ytstudio-cli docs](https://jdwit.github.io/ytstudio-cli/api-quota/); [kiwix SO mirror](https://kiwix.lema.org/stackoverflow.com_en_all_2023-11/a/43213975)
- Storage policy III.E.4.b: YouTube Analytics data, YouTube Reporting data and statistics (as Authorized Data) may be stored "for as long as is necessary", but "the Client must still ensure every 30 days that it is still authorized by the user." Other Authorized Data (for example metadata) must be deleted or refreshed after 30 days. Non-authorized statistics may not be stored longer than 30 days. — [YouTube API Services Developer Policies](https://developers.google.com/youtube/terms/developer-policies)
- Revocation: delete within 7 days for in-app revocation, and within 30 days for revocation through Google security settings. — [Developer Policies](https://developers.google.com/youtube/terms/developer-policies)
- Derived metrics: you must not "access or use API Data to create new or derived data or metrics" or "replace API Data with similar, independently calculated data". Independently calculated metrics shown alongside API data must be clearly labelled. Section L (from Jun 1, 2026) gives audited developers with approved analytics use cases additional derived-metric and storage allowances. — [Developer Policies](https://developers.google.com/youtube/terms/developer-policies)

### Inferences
- A daily sync for a channel with N videos needs about 1 `channels.list` call, ceil(N/50) `playlistItems.list` calls and ceil(N/50) `videos.list` calls. That is well under 10,000 units even for channels with thousands of videos. `search.list` is not needed (use the uploads playlist).
- The derived-metric clause matters for computed RPM, "net subscribers" and similar metrics. Label them as computed locally. A strict reading may require Section L approval. This is legal-review territory for a published tool, and lower risk for a purely personal archive.
- Video titles and descriptions (non-statistics Authorized Data) must be refreshed at least every 30 days. A daily sync does this anyway.

### Gaps
- I found no official AA/RA quota numbers.

## 6. Subscriber identity lists and unsubscribers

### Takeaway
`subscriptions.list` with `mySubscribers=true` or `myRecentSubscribers=true` still works and costs 1 unit, but Google warns the number returned "might be limited". In practice it only covers subscribers whose subscriptions are public (folklore, not stated on the current page). No API lists who unsubscribed. Only the aggregate `subscribersLost` exists.

### Cited Findings
- `mySubscribers` returns the authenticated user's subscribers "in no particular order". `myRecentSubscribers` returns them newest first. Both note that "the maximum number of subscribers returned through this API might be limited." `maxResults` is 0–50. Cost: 1 unit. The current page shows no deprecation notice and does not mention a 1,000 cap or the public-subscription restriction. — [subscriptions.list](https://developers.google.com/youtube/v3/docs/subscriptions/list)
- History: the old `mySubscribers` (activities/channels-level) parameter was deprecated Jul 30, 2013 and removed from the docs Sep 9, 2020, with `subscriptions.list?mySubscribers` as the replacement. — [Data API Revision History](https://developers.google.com/youtube/v3/revision_history)
- Unsubscribes are only available as aggregate counts (`subscribersLost` in AA, `subscribers_lost` in RA). — [AA Metrics](https://developers.google.com/youtube/analytics/metrics); [RA Channel Reports](https://developers.google.com/youtube/reporting/v1/reports/channel_reports)

### Inferences
- You could infer "who unsubscribed" by diffing daily snapshots of `mySubscribers`, but this is unreliable (capped, public-only) and may conflict with the developer-policy restrictions on derived data and on storing non-statistics data longer than 30 days. Treat subscriber identity lists as "partial / not recommended".

### Gaps
- I could not verify the widely reported ~1,000 cap and public-subscriptions-only behaviour against current official docs.

## 7. Other 2024–2026 changes relevant to the archive

### Takeaway
The most consequential recent changes are: RA reach reports (Jan 2026), three changes to view definitions (Mar 2025, Aug 2026, Nov 2026), AA's 48–72h delay and the YPP gate on revenue (Sep 2026), the quota buckets (Jun 2026) and reversal of the unverified-upload restriction (Nov 2026). Older but still relevant: private dislikes (2021) and rounded subscriber counts (2019).

### Cited Findings
- AA/RA (Sep 9, 2026): invalid or mutually exclusive dimension combinations now return "The query is not supported." (400). — [AA Revision History](https://developers.google.com/youtube/analytics/revision_history)
- AA: `isCurated` was removed from channel reports (unsupported after Dec 31, 2024, removed Apr 22, 2025). New playlist metrics: `playlistViews`, `playlistEstimatedMinutesWatched`, `playlistAverageViewDuration`, `playlistSaves`. — [AA Revision History](https://developers.google.com/youtube/analytics/revision_history)
- AA May 6, 2024: new channel reports: User activity by DMA, Concurrent viewers, Member Cancellations. Retention metrics `startedWatching`, `stoppedWatching`, `totalSegmentImpressions` were added. — [AA Revision History](https://developers.google.com/youtube/analytics/revision_history)
- AA Jun 25, 2026: the content-owner "User activity by city" report was removed. Channel reports are not affected according to the entry. — [AA Revision History](https://developers.google.com/youtube/analytics/revision_history)
- DataAPI Nov 2, 2026: uploads from unverified projects are no longer forced to private, reversing the Jul 28, 2020 policy. — [Data API Revision History](https://developers.google.com/youtube/v3/revision_history)
- DataAPI Jul 10, 2025: the `videos.list` `mostPopular` chart now draws from the Trending Music, Movies and Gaming charts after the Trending page was deprecated. Apr 30, 2024: channel discussions are no longer supported. — [Data API Revision History](https://developers.google.com/youtube/v3/revision_history)
- DataAPI Nov 16, 2026: a new `posts` resource is in a pilot with select partners, with GA planned for 2027. — [Data API Revision History](https://developers.google.com/youtube/v3/revision_history)

### Inferences
- The archive should record the API version and the view definition in force with each stored row, so that charts can annotate the 2025-03-31, 2026-08-27 and 2026-11-16 definition breaks.

### Gaps
- I did not read the remaining ~125k characters of the Data API revision history (pre-2023 entries) or the full RA revision history page separately. The 2025–2026 RA entries appear in the combined AA revision history page fetched.

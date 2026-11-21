# TikTok API for Business: Accounts API (organic) as a source for a creator's own analytics archive (as of Nov 2026)

Method note: the official business-api.tiktok.com portal pages for the Accounts API, such as "Get profile data of a TikTok account" and "Get post data of a TikTok account", are a client-rendered Next.js app. WebFetch returned only page titles. The SEO description for the profile endpoint was readable: "Use this endpoint to access detailed analytics and insights about a TikTok account's follower base and profile engagement." I tried to call the portal's internal doc-content JSON API directly, and the sandbox permission layer blocked it. So exact official field lists come from TikTok-quoted text in connector docs (Coupler quotes the "TikTok API reference") and from connector field catalogs (Adverity, Windsor.ai, Supermetrics). Official TikTok pages were used where they could be read: token lifetimes, organic API product list, authorization scopes, and the official SDK docs.

## 1. Which account types can authorize the Accounts API, and what a creator loses by switching to Business

### Takeaway
TikTok's docs, as far as they could be read, do not state the account-type rule verbatim. Third-party evidence conflicts. Hootsuite (May 2026) says it "works with TikTok Business accounts only" because of TikTok's API restrictions. Coupler says "Creator and Business accounts" can connect but personal accounts cannot. Zernio and Metricool say personal accounts can connect but get fewer metrics: no daily gained/lost followers and no demographics. The safe assumption for full insights (demographics, per-video watch time, traffic sources) is a Business Account. Switching costs the full music library (Commercial Sounds only) and Creator Rewards Program eligibility.

### Cited Findings
- TikTok defines the Organic API as "the Accounts, Mentions, TikTok One (TTO), Discovery, and Spark Ads Recommendation APIs." Access starts with registering as a developer — [TikTok Ads Help: About API for Business](https://ads.tiktok.com/help/article/marketing-api?lang=en)
- The official profile endpoint page is titled "Get profile data of a TikTok account". It is described as giving "detailed analytics and insights about a TikTok account's follower base and profile engagement". That text comes from the page's embedded SEO metadata; the page body was not retrievable — [TikTok API Docs: Get profile data of a TikTok account](https://business-api.tiktok.com/portal/docs/get-profile-data-of-a-tiktok-account/v1.3). The post endpoint is a separate page — [Get post data of a TikTok account](https://business-api.tiktok.com/portal/docs/get-post-data-of-a-tiktok-account/v1.3)
- An older gateway doc index (seen in a search snippet) maps "Get profile data of a TikTok account" to `/business/get/` under the permission group "TikTok Accounts > Account User" — [TikTok API for Business gateway doc index](https://business-api.tiktok.com/gateway/docs/index?identify_key=c0138ffadd90a955c1f0670a56fe348d1d40680b3c89461e09f78ed26785164b&language=ENGLISH&doc_id=1735713875563521)
- Official setup steps (from a search snippet): "1. Create a TikTok For Business account. 2. Register as a developer. 3. Create a developer app." Then authorization — [TikTok: Get started with Accounts API](https://business-api.tiktok.com/portal/docs/get-started/v1.3); [Get Started Overview](https://business-api.tiktok.com/portal/docs/get-started-guide/v1.3)
- Hootsuite blog, May 19, 2026: "Hootsuite works with TikTok Business accounts only," which it attributes to "TikTok's API restrictions." Business accounts "are limited to Commercial Sounds only" and "cannot access the Creator Rewards Program, Gifts, Diamonds". Personal-account analytics are under Creator Tools, where "the data cannot be exported", with ranges up to 365 days. Business accounts can "download analytics reports". "Some users report losing access to previously collected analytics data after switching." Path to switch: Settings and privacy → Account → Switch to Business Account. Switching is free and reversible — [Hootsuite: TikTok Business vs Personal (2026)](https://blog.hootsuite.com/tiktok-business-vs-personal/)
- Coupler.io: "Only Creator and Business accounts have analytics access; personal accounts cannot connect." It also requires an Admin/Editor role — [Coupler.io TikTok data overview](https://docs.coupler.io/sources/category/social-media/tiktok-public/data-overview)
- Zernio: daily account figures from the "TikTok Business Accounts API" (scope `user.insights`) "work for Business and personal TikTok accounts connected through Zernio's TikTok connection." Accounts connected through the original TikTok (Login Kit) integration or your own TikTok app "cannot read them." Rich per-video metrics are available only for accounts connected through the "TikTok for Business app" connection — [Zernio: TikTok account insights](https://docs.zernio.com/analytics/get-tiktok-account-insights)
- Metricool: "The type you select when you connect, personal or Business, decides which features and metrics you get, regardless of your account type in TikTok." — [Metricool: How to connect TikTok](https://help.metricool.com/how-to-connect-tiktok-to-metricool-0ea7e). Per search-result summaries of Metricool help, personal connections get net follower change only, because "TikTok doesn't provide daily metrics for gained or lost followers for personal accounts". Demographics are Business-only and need at least 100 followers. After switching type, "not all previous data is guaranteed to display" — [Metricool: TikTok metrics](https://help.metricool.com/tiktok-metrics-fe7io) (summarized from search results, not fetched directly)
- Supermetrics marks "Reached audience" as "only available for Business Accounts" — [Supermetrics TIKBA fields](https://supermetrics.com/api/getFields?ds=TIKBA)
- The API returns an `is_business_account` boolean, so it reports the account type rather than requiring it — [Adverity TikTok Business fields](https://www.adverity.com/docs/reference/connectors/connector-tiktok-business.html); [Windsor.ai TikTok Organic fields](https://windsor.ai/data-field/tiktok_organic/)
- Creator Rewards Program: third-party guides say Business accounts are ineligible. You must switch to Personal and can apply about 30 days after switching. Other requirements are 18+, 10k followers, 100k views in 30 days, and an eligible country — [Buffer](https://buffer.com/resources/tiktok-creativity-program/); [Sirency](https://www.sirency.com/blog/tiktok-creator-rewards-program-eligibility). No official support.tiktok.com page was retrieved for this.

### Inferences
- The `is_business_account` field, plus Zernio's and Metricool's statements, suggest a Personal/Creator account can authorize the Business-API organic connection and get a reduced metric set. Demographics, daily new/lost followers, reached audience and probably the rich per-video metrics need a Business Account. Hootsuite's "Business only" is probably a product decision, or reflects the older approach.
- For a monetizing creator in the Creator Rewards Program, switching to Business trades monetization and the full music library for API insights. That is probably a bad trade unless they don't monetize via CRP.

### Gaps
- No verbatim official TikTok statement on account-type eligibility for `/business/get/` was retrievable, because the portal is JS-rendered.
- No official support.tiktok.com page was found for "Business accounts not eligible for Creator Rewards".

## 2. `/business/get/` (profile) fields, history window and date parameters

### Takeaway
`/business/get/` (v1.3 base `https://business-api.tiktok.com/open_api/v1.3/business/get/`) takes `business_id`, a `fields` list and `start_date`/`end_date`. It returns profile fields plus daily metrics: video_views, profile_views, likes, comments, shares, followers_count, daily new/lost/total followers, engaged_audience, unique_video_views (daily reached audience) and audience_activity by hour. It also returns 60-day aggregate audience splits (genders, countries, ages). Data exists only for the last 60 days, and only after TikTok Analytics was enabled. Several connectors cap requests at 60 to 89 days.

### Cited Findings
- TikTok API reference text quoted by Coupler: "The data you can get from `/business/get/` depends on the availability of corresponding TikTok Analytics data"; "any profile data prior to the actual date when TikTok Analytics is enabled won't be available through the API"; "TikTok's API only provides 60 days of historical data." Latency: "Offline data (such as `likes`, and `audience_countries`) usually have a delay of 24-48 hours (UTC Time)"; "Real-time data (such as `username`, and `share_url`) usually have no latency"; "The analytics API reports the count at the end of each day in UTC." `start_date` is named as a parameter — [Coupler.io TikTok data overview](https://docs.coupler.io/sources/category/social-media/tiktok-public/data-overview)
- Profile/account fields per Adverity's field list, which uses API names: `display_name`, `username`, `profile_image`, `is_business_account`, `followers_count`, `profile_views`, `video_views` ("total views across profile videos for profile data"), `likes`, `comments`, `shares`, `daily_new_followers`, `daily_lost_followers`, `daily_total_followers` (maps to `followers_count`), `audience_activity` / `audience_activity_hour`, `audience_countries` ("past 60 days" of followers), `audience_genders`, and `date` — [Adverity TikTok Business fields](https://www.adverity.com/docs/reference/connectors/connector-tiktok-business.html)
- Windsor.ai profile daily fields: `engaged_audience` (daily people who liked, commented or shared at least one post), `unique_video_views` ("Daily reached audience"), `audience_activity_count` + `audience_activity_hour` (followers online per hour), `audience_ages_age` (18-24, 25-34, 35-44, 45-54, 55+) + `audience_ages_percentage`, `followers_count`, `daily_total_followers`, `daily_lost_followers`, `total_followers_count`, `profile_views` — [Windsor.ai TikTok Organic fields](https://windsor.ai/data-field/tiktok_organic/)
- Supermetrics descriptions: video views, profile views, likes, comments and shares are each "available per day". Likes are not reduced by later unlikes. "Reached audience" ("the daily number of people who watched your published content at least once") is limited to ranges of 7 days or less and aggregates weekly for longer ranges; it is Business-only. Follower country and gender are 60-day aggregates, lag 24-48h, and return no rows below 100 followers. Gender values are Female/Male/Other, as ratios — [Supermetrics TIKBA fields](https://supermetrics.com/api/getFields?ds=TIKBA)
- Zernio caps account-insight ranges at 89 days (default 30). The latest day is yesterday, and settling takes 24-48h. Not exposed at account level: impressions/reach, follower inflow/outflow breakdown, account-level watch time. Demographics (age, gender, country, city) are on a separate Zernio endpoint — [Zernio](https://docs.zernio.com/analytics/get-tiktok-account-insights)
- Coupler's normalized profile entities: followers, video, view, like, comment, share and download counts; audience genders; countries; hourly activity — [Coupler.io](https://docs.coupler.io/sources/category/social-media/tiktok-public/data-overview)
- Native Business Suite ranges: last 7/28/60 days or custom, with download — [TikTok Ads Help: Web Business Suite](https://ads.tiktok.com/resources/help/article/navigate-web-business-suite?lang=en)
- Sprout Social backfills up to 60 days on connection, then keeps history itself (search-result summary; the help page returned 403) — [Sprout: TikTok reporting features](https://support.sproutsocial.com/hc/en-us/articles/6167159478029-What-reporting-features-are-available-for-TikTok). Sked Social also backfills 60 days — [Sked Social help](https://help.skedsocial.com/tiktok-insights-metrics-and-specifications-sked-social-help-center)

### Inferences
- An archiver must call `/business/get/` daily, or at least every under-60 days, and store each day. Days older than 60 are unrecoverable. Re-pull the last 2-3 days on each run because of the 24-48h settling.
- The audience splits are rolling 60-day snapshots, not daily series. Archive a dated snapshot each run to build a time series.
- Engaged audience and unique (reached) daily viewers appear in Windsor's catalog. They are probably official field names (`engaged_audience`, `unique_video_views`), but this was not confirmed against TikTok.

### Gaps
- Exact official `fields` enum, parameter names (`start_date`/`end_date` format, max range) and response JSON shape were not verified from TikTok directly. `audience_ages` and `audience_cities` at profile level are unconfirmed as official field names.
- Whether `audience_activity` is per-day or a rolling aggregate is unclear.

## 3. `/business/video/list/` per-video metrics

### Takeaway
`/business/video/list/` (v1.3) returns the account's videos with lifetime (not daily) metrics:
- item_id, create_time, caption, thumbnail/share/embed URLs, video_duration
- video_views, reach, likes, comments, shares, favorites
- full_video_watched_rate, total_time_watched, average_time_watched
- video_view_retention (per-second curve)
- impression_sources (For You/Follow/Hashtag/Sound/Search/Profile %)
- audience_countries (top 10), audience_cities, audience_types (new/returning, follower/non-follower)
- new_followers, profile_views and website_clicks attributable to the video

There are no per-video daily time series, so daily curves must come from your own snapshots.

### Cited Findings
- Endpoint URL `https://business-api.tiktok.com/open_api/v1.3/business/video/list` — [Databox metric library](https://databox.com/metric-library/metrics/tiktok-organic/total-full-video-watched-rate-by-video) (via search snippet)
- Adverity video fields: `item_id`, `caption`, `create_time` (Unix seconds), `thumbnail_url`, `share_url`, `video_duration`, `video_views`, `reach` (unique users), `likes`, `comments`, `shares`, `full_video_watched_rate`, `total_time_watched` (s), `average_time_watched` (s), `impressions_source` / `impression_percentage`. A search snippet of Adverity's tips page says "video metrics only available at lifetime level - This is an API limitation" — [Adverity fields](https://www.adverity.com/docs/reference/connectors/connector-tiktok-business.html); [Adverity tips](https://docs.adverity.com/guides/tips-and-best-practices/tiktok-business-tips.html)
- Windsor.ai video fields:
  - Retention: `video_view_retention_second` + `video_view_retention_percentage`, the "share of viewers still watching at a given second"
  - Traffic sources: `video_impression_sources` (types such as For You, Follow, Hashtag, Sound, Search, with percentage)
  - Geography: `video_audience_countries` (top 10), `video_audience_cities`
  - Audience types: `video_audience_types` (new viewer, returning viewer, follower share, non-follower share)
  - Attributed actions: `video_new_followers`, `video_profile_views`, `video_website_clicks`
  - Reach: `video_reach`, "reported 24-48 hours after views" and can "under-report it for high-volume videos"
  - The date range selects videos by creation date
  - Source: [Windsor.ai TikTok Organic fields](https://windsor.ai/data-field/tiktok_organic/)
- Supermetrics video fields include favorites, reach, completion rate, total time watched and average view time (= total time watched / views), plus embed URL — [Supermetrics TIKBA](https://supermetrics.com/api/getFields?ds=TIKBA)
- Zernio: per-video profile views, website clicks, follows, full-watched rate, watch time, impression sources, viewer types and countries arrive "roughly 24-48h after publishing". They are available "only for posts active in the last 7 days" in Zernio's implementation, and only for Business-app connections. Other connections get only views, likes, comments and shares — [Zernio](https://docs.zernio.com/analytics/get-tiktok-account-insights)
- Coupler quotes the TikTok reference: "The share count displayed in the `shares` field from `/business/video/list/` corresponds to…" (a discrepancy note). Its video entities include `reachCount`, `downloadCount` and video top countries — [Coupler.io](https://docs.coupler.io/sources/category/social-media/tiktok-public/data-overview)
- A Fivetran community request (date not captured) asked to add "Video view retention, Impression sources, followers gained from post" to the TikTok Organic connector. That suggests these fields exist in the API but not every connector exposes them — [Fivetran community](https://support.fivetran.com/hc/en-us/community/posts/39226651424791-Connector-Improvement-Add-Video-view-rentention-Impression-sources-followers-gained-from-post-to-tiktok-organic-app)

### Inferences
- Per-video metrics are lifetime-to-date. Snapshot every video daily, or at least for the first ~30 days after posting, then weekly, to get growth curves. Zernio's "posts active in last 7 days" suggests insights for older posts may stop updating or be harder to get. This is unverified.
- The Windsor/Supermetrics field names match the in-app TikTok Studio post analytics, so the API covers almost all of the in-app per-post view. A possible exception is the "engagement by time" curve, which no source mentions.

### Gaps
- Official exact field names (for example `video_view_retention` vs `retention`, `impression_sources` vs `impressions_source`) are unconfirmed. Windsor marks the nested `video_impression_sources` / `video_audience_countries` objects "Deprecated" in its own schema, which may reflect connector refactoring rather than API deprecation.
- Pagination parameters (cursor, max_count) and filters (video_ids) were not verified.
- Whether video insights are available for videos older than 60 days was not confirmed.

## 4. Comments endpoints and follower lists

### Takeaway
The API exposes comment listing with comment_id, text, username, likes, parent_id, visibility and video_id. Reply/manage endpoints exist according to the endpoint naming in the brief, but I did not verify them. No source shows a follower-list endpoint. Only counts and aggregate demographics are available.

### Cited Findings
- Comment fields: `comment_id`, `comment_likes`, `comment_parent_id`, `comment_text`, `comment_username`, `comment_video_id`, `comment_visibility` — [Windsor.ai](https://windsor.ai/data-field/tiktok_organic/)
- Supermetrics comment fields: ID, date/datetime, username and text. Sticker/GIF-only comments return empty text because "TikTok's API doesn't return their content" — [Supermetrics TIKBA](https://supermetrics.com/api/getFields?ds=TIKBA)
- Zernio: "follower inflow/outflow breakdown" is not exposed — [Zernio](https://docs.zernio.com/analytics/get-tiktok-account-insights)

### Gaps
- Official comment endpoint paths (`/business/comment/list/`, `/business/comment/reply/create/`, etc.) and scopes were not verified from TikTok docs.
- No source explicitly states "no follower list endpoint". This is an inference from every connector catalog lacking one.

## 5. Access process: developer app, scopes, review, individuals, sandbox, tokens, rate limits

### Takeaway
Steps: create a TikTok For Business account, register as a developer on business-api.tiktok.com, create a developer app with the TikTok Accounts permissions (scopes like `user.info.basic`, `user.insights`, `video.list`, `video.insights`, `comment.list`), and get app approval. Then have the TikTok account owner authorize via an OAuth link. Tokens: the access token lasts 24h and the refresh token 1 year, refreshed via `/tt_user/oauth2/refresh_token/`, then the user must re-authorize. Review time and whether an individual with a self-only use case is approved are not documented.

### Cited Findings
- Official SDK docs: "The creator access token is valid for 24 hours and the refresh token is valid for one year. Within one year you will need to refresh the access token with the refresh token on a daily basis. After one year you will need to ask the creator to reauthorize." — [tiktok/tiktok-business-api-sdk AuthenticationApi.md](https://github.com/tiktok/tiktok-business-api-sdk/blob/main/js_sdk/docs/AuthenticationApi.md)
- Official Accounts API Authentication page (search snippet): the TikTok account access token is valid for one day and the refresh token for one year. Refresh is via `https://business-api.tiktok.com/open_api/v1.3/tt_user/oauth2/refresh_token/` and revoke via `/tt_user/oauth2/revoke/` — [TikTok: Accounts API Authentication](https://business-api.tiktok.com/portal/docs/accounts-api-authentication/v1.3). Sprinklr agrees: the "refresh token expires automatically for a TikTok Business account after 365 days" — [Sprinklr TikTok FAQ](https://www.sprinklr.com/help/articles/know-more-tiktok/frequently-asked-questions-tiktok/645260250d27fc559bbe5376)
- Scopes: Zernio names `user.insights` for daily account metrics and `user.info.stats` for profile counters — [Zernio](https://docs.zernio.com/analytics/get-tiktok-account-insights). A Stack Overflow answer showed an auth URL with `user.insights` and `video.insights` (community source) — [kiwix SO mirror](https://kiwix.lema.org/stackoverflow.com_en_all_2023-11/questions/74185027/publishing-videos-on-tiktok-using-tiktok-api)
- Creator authorization (TikTok One / creator marketing flow, not the self-account Accounts API): you share an authorization URL, and the creator approves the scopes `biz.creator.insights`, `user.insights.creator` and `biz.creator.info` and is then redirected — [TikTok: Get authorization from Creators](https://business-api.tiktok.com/portal/docs/get-authorization-from-creators/v1.3) (search snippet)
- No official review-time figure was found for API for Business apps. The TikTok for Developers (Login Kit) review is described as several days to two weeks with no guarantee. That is a different portal — [TikTok for Developers: Getting started FAQ](https://developers.tiktok.com/doc/getting-started-faq)

### Inferences
- An archiver must refresh tokens daily (a 24h access token) and prompt the user to re-authorize every 12 months.
- The API for Business is aimed at businesses and partners. An individual can register as a developer, but approval of the TikTok Accounts permissions for a single-user, self-hosted app is uncertain. Expect to need a business-like app description, website and privacy policy.

### Gaps
- Official rate limits for the `/business/*` endpoints were not found.
- No sandbox or test-mode details for the Accounts API were found.
- No reports of individuals being approved or rejected were found.
- The exact list of scope names in the "TikTok Accounts" permission group was not verified.

## 6. How third-party tools get TikTok organic data (summary matrix)

### Takeaway
All the analytics vendors that were checked use TikTok's official API. The richer ones (Adverity, Windsor, Supermetrics, Coupler, Zernio's Business connection) use the API for Business Accounts endpoints (`/business/get/`, `/business/video/list/`). They converge on a 60-day backfill and then forward collection. Account-type support varies: Business-only (Hootsuite), Business+Creator (Coupler), Business+personal with reduced metrics (Metricool, Zernio).

### Cited Findings
- Hootsuite: Business only, "TikTok's API restrictions" — [Hootsuite blog, May 2026](https://blog.hootsuite.com/tiktok-business-vs-personal/)
- Coupler: Creator + Business, 60 days, daily refresh; names `/business/get/` and `/business/video/list/` — [Coupler.io](https://docs.coupler.io/sources/category/social-media/tiktok-public/data-overview)
- Metricool: personal or Business connection type, with fewer metrics on personal; demographics are Business-only and need 100+ followers — [Metricool connect](https://help.metricool.com/how-to-connect-tiktok-to-metricool-0ea7e); [Metricool TikTok metrics](https://help.metricool.com/tiktok-metrics-fe7io)
- Zernio: Business Accounts API, `user.insights`, 89-day max range, 24-48h delay — [Zernio](https://docs.zernio.com/analytics/get-tiktok-account-insights)
- Supermetrics: daily profile metrics, lifetime video metrics, 60-day demographics, comments — [Supermetrics TIKBA](https://supermetrics.com/api/getFields?ds=TIKBA)
- Windsor.ai: the fullest field catalog, including retention, impression sources, audience types/cities, engaged audience and unique video views — [Windsor.ai](https://windsor.ai/data-field/tiktok_organic/)
- Adverity: API field names, lifetime-only video metrics — [Adverity](https://www.adverity.com/docs/reference/connectors/connector-tiktok-business.html)
- Sprout Social and Sked Social: 60-day backfill on connect — [Sprout](https://support.sproutsocial.com/hc/en-us/articles/6167159478029-What-reporting-features-are-available-for-TikTok); [Sked](https://help.skedsocial.com/tiktok-insights-metrics-and-specifications-sked-social-help-center)
- A third-party article (unverified) claims Hootsuite TikTok analytics needs "Advanced Access or Verified Business Accounts" and mentions an April 30, 2026 Business-account requirement. Not confirmed — [sozee.ai](https://www.sozee.ai/resources/tiktok-analytics-hootsuite/)

### Gaps
- Later, Dash Hudson and Iconosquare help pages were not checked because of the tool-call budget.

## 7. Changes 2024-2026

### Takeaway
The API is still on v1.3 paths (`/open_api/v1.3/business/...`) as of late 2026. I found no official changelog entry for new or deprecated Accounts API fields in 2024-2026, and no US joint venture (USDS JV, Jan 2026) effect specific to the Business API.

### Cited Findings
- Current docs are versioned v1.3 — [TikTok: Get profile data (v1.3)](https://business-api.tiktok.com/portal/docs/get-profile-data-of-a-tiktok-account/v1.3); [Accounts API Authentication v1.3](https://business-api.tiktok.com/portal/docs/accounts-api-authentication/v1.3)
- The USDS Joint Venture was established in Jan 2026. ByteDance-owned US entities keep advertising and e-commerce — [TikTok Newsroom](https://newsroom.tiktok.com/announcement-from-the-new-tiktok-usds-joint-venture-llc?lang=en)
- Hootsuite's May 2026 article attributes its Business-only policy to TikTok API restrictions. A third party mentions an April 30, 2026 change (unverified) — [Hootsuite](https://blog.hootsuite.com/tiktok-business-vs-personal/); [sozee.ai](https://www.sozee.ai/resources/tiktok-analytics-hootsuite/)

### Inferences
- Because advertising stayed with ByteDance US entities, the API for Business (ads + organic) plausibly continued without a structural change after the JV. This is not verified.

### Gaps
- The API for Business changelog was not retrievable (JS portal). Field additions such as engaged_audience, unique_video_views and audience_types could not be dated.

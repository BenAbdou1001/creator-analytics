# TikTok and LinkedIn official APIs for an individual creator's self-hosted analytics archive (as of Nov 2026)

## TikTok: what can an individual creator realistically get via official APIs?

### Takeaway
TikTok's only general developer path (Login Kit + Display API) gives lifetime profile counters (followers, following, total likes, video count) and per-video lifetime public counters (views, likes, comments, shares). It gives no reach, watch time, traffic sources, profile views or demographics. Even that path needs a reviewed app, and TikTok's review guidelines explicitly reject apps "for private or personal use". The richer organic insights (daily profile views, watch time, audience demographics, a roughly 60-day window) sit in the TikTok API for Business "Accounts API", aimed at Business Accounts and business developers. The Research API is limited to vetted researchers. For a solo creator archive, the realistic options are sandbox-only Display API use (unclear long-term), manual export from TikTok Studio / Business Suite, or browser automation.

### Cited Findings
**Display API / Login Kit (developers.tiktok.com)**
- `GET /v2/user/info/` fields by scope: `user.info.basic` gives open_id, union_id, avatar URLs and display_name. `user.info.profile` gives bio_description, profile_deep_link, is_verified and username. `user.info.stats` gives follower_count, following_count, likes_count and video_count. `video_count` counts only publicly posted videos. The page notes "There is a migration plan related to this API" but gives no detail — [TikTok: Get User Info](https://developers.tiktok.com/doc/tiktok-api-v2-get-user-info)
- `video.list` scope. `max_count` defaults to 10 and is at most 20 per page. Results are sorted by create_time descending, and the cursor is a millisecond UTC timestamp, so you can page back through all public videos. The page states no lookback limit — [TikTok: List Videos](https://developers.tiktok.com/doc/tiktok-api-v2-video-list)
- Video Object fields: id, create_time, cover_image_url (6-hour TTL), share_url, video_description, duration, height, width, title, embed_html, embed_link, like_count, comment_count, share_count, view_count and is_aigc. There are no watch-time, completion-rate, reach, traffic-source or audience fields — [TikTok: Video Object](https://developers.tiktok.com/doc/tiktok-api-v2-video-object)
- Rate limits: /v2/user/info/ and /v2/video/list/ each allow 600 requests per 1-minute sliding window. Exceeding it returns HTTP 429 `rate_limit_exceeded` — [TikTok: Rate limits](https://developers.tiktok.com/doc/tiktok-api-v2-rate-limit)
- Tokens: the access token lasts 2 hours (`expires_in`) and the refresh token lasts 180 days (`refresh_expires_in`). Both fields return the remaining lifetime in seconds. So an unattended archiver must refresh the access token and get the user to re-consent at least every ~6 months — [TikTok: OAuth token management](https://developers.tiktok.com/doc/oauth-user-access-token-management)

**App review / sandbox**
- App review needs a "fully developed" official website (a landing or login page doesn't count), a visible privacy policy and terms of service, and a demo video of the end-to-end flow covering every requested scope. The guidelines state: "Apps must not be for private or personal use," and apps still in development or testing are not approved — [TikTok: App review guidelines](https://developers.tiktok.com/doc/app-review-guidelines)
- A sandbox exists, and never-approved apps must use it to record the review demo. The guidelines don't present it as a way to run without review, and the fetched page says nothing about sandbox target-user limits — [TikTok: App review guidelines](https://developers.tiktok.com/doc/app-review-guidelines)

**TikTok API for Business (organic)**
- The Organic API is made up of the Accounts, Mentions, TikTok One (TTO), Discovery and Spark Ads Recommendation APIs. Access starts with registering as a developer on the API for Business homepage. The help page doesn't state eligibility or account-type rules — [TikTok Ads Help: About API for Business](https://ads.tiktok.com/help/article/marketing-api?lang=en)
- TikTok separates Personal Accounts (general users and creators) from Business Accounts, which offer commercial tools that Personal Accounts don't have — [TikTok Ads Help: Types of TikTok accounts](https://ads.tiktok.com/help/article/upgrade-your-tiktok-account)
- Third-party aggregator (secondary source): daily account metrics (video_views, likes, comments, shares, profile_views) come from the "TikTok Business Accounts API" with the `user.insights` scope. Per-video profile views, website clicks, follows, watch time and viewer breakdowns are available only for accounts connected through the TikTok for Business app. Account-level impressions/reach, follower inflow/outflow and account-level watch time are not available through any public TikTok API. Demographics (age, gender, country, city) are on a separate endpoint. Per-video metrics arrive 24-48h after posting — [Zernio docs: TikTok account insights](https://docs.zernio.com/analytics/get-tiktok-account-insights)
- Connector docs (secondary) say the `/business/get/` endpoint only returns data within the last 60 days, depending on what exists in TikTok Analytics. Follower country and gender are 60-day aggregates — [Coupler.io TikTok data overview](https://docs.coupler.io/sources/category/social-media/tiktok-public/data-overview); [Supermetrics TikTok fields](https://supermetrics.com/api/getFields?ds=TIKBA); [Adverity TikTok Business connector](https://docs.adverity.com/reference/connectors/connector-tiktok-business.html)
- One scheduler backfills only 60 days of insights when an account is first connected, then collects going forward — [Sked Social help](https://help.skedsocial.com/tiktok-insights-metrics-and-specifications-sked-social-help-center)
- TikTok's web Business Suite offers Reach, Engagement, Conversion and Followers data for the last 7, 28 or 60 days or a custom range, with download — [TikTok Ads Help: Web Business Suite](https://ads.tiktok.com/resources/help/article/navigate-web-business-suite?lang=en)

**Research API**
- Research Tools changes in 2025-2026 were about vetted researchers: a data access application for vetted researchers (Dec 23, 2025), a Virtual Compute Environment test-stage filter for users with at least 25,000 followers (Apr 26, 2025), and `favorites_count` added to query endpoints (May 21, 2026). It is not a creator self-analytics product — [TikTok developer changelog](https://developers.tiktok.com/docs/en/changelog)

**2025-2026 changes**
- The developer changelog (last updated Aug 2026) has no 2025-2026 entries for the Display API, Login Kit scopes, rate limits or analytics. The 2026 entries cover the Data Portability API (Login Kit dependency guidance, Aug 2026), Research Tools and TikTok GO — [TikTok developer changelog](https://developers.tiktok.com/docs/en/changelog)
- TikTok USDS Joint Venture LLC was established in Jan 2026. US user data is held in Oracle's US cloud, ByteDance-owned US entities keep advertising and e-commerce, and "global interoperability" was promised — [TikTok Newsroom, Jan 23 2026](https://newsroom.tiktok.com/announcement-from-the-new-tiktok-usds-joint-venture-llc?lang=en); [TechCrunch](https://techcrunch.com/2025/12/30/heres-whats-you-should-know-about-the-us-tiktok-deal)
- TikTok rewrote its US terms after the transfer — [Open Terms Archive memo](https://opentermsarchive.org/en/memos/tiktok-rewrites-all-terms-following-usa-operations-transfer/). A search-result summary said the Developer Terms gained a "TikTok Developer US Data Sharing Agreement" section in Jan 2026. Its content was not retrieved, so this is unverified.

### Inferences
- Display API data is enough for a "lifetime counters snapshot" archive. Polling daily and diffing gives you your own per-video daily view/like deltas and a follower time series going forward. It cannot recover past history or watch-time and audience metrics.
- The "not for private or personal use" rule makes it unlikely that a self-only archiver gets through production review. Sandbox use with your own account as a test user is the realistic way to call the API. Whether sandbox tokens and scopes are durable enough for production-like use is unconfirmed.
- The Business Accounts insights path probably needs the creator to switch to a Business Account (which can limit commercial music use, per general TikTok account-type differences) and to register an API for Business developer app. Its 60-day window means you must poll continuously to build history.
- The Data Portability API (Login Kit dependency) is a possible new route for exporting the user's own data. Its data categories were not checked. Analytics are probably not included, but that is unverified.

### Gaps
- The official business-api.tiktok.com reference for `/business/get/` (exact metric names, `user.insights` scope, date params, Business-Account-only eligibility) could not be fetched. Business-only and 60-day claims rest on third-party connector docs.
- Sandbox limits (number of target users, token validity, whether `user.info.stats` / `video.list` work fully in sandbox) were not found.
- The in-app history windows (60 days vs 365 days in TikTok Studio) were not confirmed from an official source, beyond the Business Suite 7/28/60/custom ranges.
- The details of the "user info scope migration" bulletin were not retrieved.
- No US-JV-specific developer API change was found.

## LinkedIn: can a solo developer pull their own personal-profile analytics?

### Takeaway
LinkedIn now has the right endpoints: `memberCreatorPostAnalytics` (r_member_postAnalytics) and `memberFollowersCount` (r_member_profileAnalytics), with impressions, members reached, reactions, comments, reshares, saves, sends, link clicks, follows and profile views from content, and daily follower counts. But they are part of the Community Management API, which is "only available to registered legal organizations for commercial use cases only". It requires a business email, a verified organization, website and domain, and a LinkedIn Page super-admin verifying the app. A solo individual with no company can't qualify. A one-person registered company with a Page and website might get Development tier (500 calls/app/day, 100/member/day, 12-month integration window). The official XLSX export from creator analytics remains the practical route for most individuals.

### Cited Findings
**Member post analytics**
- `memberCreatorPostAnalytics` has two finders. `q=entity` returns stats for a single post (ugcPost or share URN). `q=me` returns stats aggregated across all of the member's posts. Permission: `r_member_postAnalytics` ("Retrieve your posts and their reporting data") — [Microsoft Learn: Member Post Statistics](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/members/post-statistics)
- Metrics in versions 2026-01 to 2026-03: IMPRESSION, MEMBERS_REACHED, RESHARE, REACTION and COMMENT. From 2026-04 they add POST_SAVE, POST_SEND, LINK_CLICKS, PREMIUM_CTA_CLICKS, FOLLOWER_GAINED_FROM_CONTENT and PROFILE_VIEW_FROM_CONTENT — [same](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/members/post-statistics)
- Aggregation is DAILY or TOTAL (default). DAILY is not supported for MEMBERS_REACHED, LINK_CLICKS, FOLLOWER_GAINED_FROM_CONTENT or PROFILE_VIEW_FROM_CONTENT. The note "Daily impression metrics are not supported if given entity is post". Without `dateRange` you get lifetime totals. The docs give no maximum lookback. For `q=me`, "RESHARE, REACTION, COMMENT are not consistent with UI at the moment". Data is "best-effort accurate" — [same](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/members/post-statistics)
- Version deprecation: Marketing version 202601 is sunset Jan 15, 2027, so integrations must track monthly versioned APIs — [same](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/members/post-statistics)

**Member follower statistics**
- `memberFollowersCount` with `q=me` returns the lifetime follower count. With `q=dateRange` it returns daily follower counts (if the range is omitted, daily counts for the whole lifetime). Permission: `r_member_profileAnalytics`, described as "profile analytics, including the number of profile viewers, followers, and search appearances. Restricted to members." This page documents only follower counts, not profile viewers or search appearances — [Microsoft Learn: Member Follower Statistics](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/members/follower-statistics)
- No member-level demographics endpoint was found in these docs. (Same page. Demographics appear only for organization follower stats.)

**Access process (Community Management API)**
- "At this time, our Community Management APIs are only available to registered legal organizations for commercial use cases only." You must provide a business email (verified), the organization's legal name, registered address, website and privacy policy. "Personal email addresses won't pass the vetting process." A super admin of the organization's LinkedIn Page must verify the app — [Microsoft Learn: Community Management App Review](https://learn.microsoft.com/en-us/linkedin/marketing/community-management-app-review)
- Development tier review covers the approved use case, verified business email, verified organization, verified website and domain, and Page verification. If rejected, you have to create a new app and you can't reapply with the same app — [same](https://learn.microsoft.com/en-us/linkedin/marketing/community-management-app-review)
- Standard tier needs a fully integrated app, a company and product overview, test credentials and a narrated screencast for each use case. "Executive Management" and "Employee Advocacy" use cases cover posting to and reading a member's own profile — [same](https://learn.microsoft.com/en-us/linkedin/marketing/community-management-app-review)
- Development tier limits: 500 API calls per app per 24h and 100 per member per 24h, no BATCH_GET, and integration must be finished within 12 months. Community Management can only be requested on a new app with no other API products. Standard tier has no call restrictions — summarized from search results over [Microsoft Learn: Community Management App Review](https://learn.microsoft.com/en-us/linkedin/marketing/community-management-app-review) and [Microsoft Learn: Increasing Access](https://learn.microsoft.com/linkedin/marketing/increasing-access). The 500/100 figures come from search snippets, not a direct fetch.

**Official export path**
- All members have creator analytics. Post impressions can be exported to .XLSX from Analytics > Show all analytics > Post impressions > Export, for a date range of 7 to 365 days — [LinkedIn Help: Combined post analytics](https://www.linkedin.com/help/linkedin/answer/a701208); [LinkedIn Help: creator analytics](https://www.linkedin.com/help/learning/answer/a704175)
- Single-post analytics became exportable — [Lindsey Gamble blog](https://www.lindseygamble.com/blog/linkedin-introduces-exportable-single-post-analytics)
- Retention per a search summary of LinkedIn help: discovery and engagement counts are kept 1,000 days, members reached 400 days, demographics 180 days. This is not verified by a direct fetch, but the source is likely [LinkedIn Help: Combined post analytics](https://www.linkedin.com/help/linkedin/answer/a701208)

### Inferences
- A truly individual developer (personal email, no registered entity or Page) cannot get `r_member_postAnalytics` / `r_member_profileAnalytics`. The documented gate is organizational, not technical.
- A creator who has a registered sole-proprietor or LLC entity, a real website with a privacy policy, a business-domain email and a company Page could plausibly apply for Development tier with an "Executive Management / creator analytics" use case. Approval is discretionary, and the 12-month integration window and new-app-only rule add friction.
- If you can get access, the API is more complete than TikTok's: daily per-post engagement plus a daily follower time series. Demographics and profile-viewer and search-appearance detail are still missing compared with the in-app view.
- Given the 365-day maximum export range and the 180-400 day retention on some metrics, a scheduled XLSX export (manual or browser-agent-driven) is the practical archive mechanism for most individuals.

### Gaps
- No documented maximum `dateRange` lookback for `memberCreatorPostAnalytics`.
- No first-hand developer-forum reports of individuals being approved or rejected were found.
- The exact contents of the in-app XLSX export (columns, demographics sheets) were not verified from an official source.

## For both: is CSV/XLSX export or an AI-agent-with-browser path still the practical option?

### Takeaway
Yes, for most solo creators. TikTok's API that is reachable without business vetting exposes only lifetime public counters, its insights API is business-oriented with a 60-day window, and its review bans personal-use apps. LinkedIn's member analytics API is gated to registered organizations. Official exports (LinkedIn XLSX up to 365 days; TikTok Business Suite download with 7/28/60/custom ranges), plus a browser agent that runs them on a schedule, are the most realistic path. The Display API can add lifetime per-video counters where sandbox access works.

### Cited Findings
- TikTok review: "Apps must not be for private or personal use" — [TikTok App review guidelines](https://developers.tiktok.com/doc/app-review-guidelines)
- LinkedIn: only "registered legal organizations for commercial use cases" — [Microsoft Learn: CM App Review](https://learn.microsoft.com/en-us/linkedin/marketing/community-management-app-review)
- LinkedIn XLSX export, 7-365 day range — [LinkedIn Help a701208](https://www.linkedin.com/help/linkedin/answer/a701208)
- TikTok Business Suite download with last 7/28/60 days or a custom range — [TikTok Ads Help: Web Business Suite](https://ads.tiktok.com/resources/help/article/navigate-web-business-suite?lang=en)
- No public TikTok API exposes account-level reach or impressions for any account type (third-party claim) — [Zernio docs](https://docs.zernio.com/analytics/get-tiktok-account-insights)

### Inferences
- Hybrid design: (1) TikTok Display API via a sandbox app for daily counter snapshots, if feasible; (2) scheduled exports or browser-agent scraping of TikTok Studio / Business Suite and LinkedIn creator analytics for richer metrics; (3) store the raw exports, because platform retention windows (TikTok ~60 days in API/tooling; LinkedIn 180-1,000 days depending on metric) mean history is lost if you don't archive it.
- Browser automation of logged-in sessions may conflict with platform ToS (both prohibit scraping in general terms). This was not checked in this research, so flag it as a risk.

### Gaps
- Platform ToS positions on a user automating their own logged-in analytics pages were not researched.
- Whether TikTok's personal/creator account (non-Business) in-app analytics has a downloadable export was not confirmed.

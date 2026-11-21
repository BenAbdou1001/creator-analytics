# TikTok developer platform APIs (developers.tiktok.com) as a data source for a solo creator's own analytics archive (as of Nov 2026)

Builds on `research_notes/Meta and YouTube API feasibility/tiktok_linkedin_apis.md`. The pages below were fetched on 2026-11-21 unless noted. This file covers the gaps that file left open: sandbox limits, token durability, the exact guideline wording, Data Portability contents, the Research and Commercial Content APIs, and changes in 2024-2026.

## Login Kit + Display API: scopes, endpoints, fields, history depth

### Takeaway
Display API v2 has two read endpoints for the authenticated creator: `GET /v2/user/info/` and the video list/query endpoints. It returns **only current lifetime counters**: profile totals, plus per-video view, like, comment and share counts for **public** videos. There is no per-day, time-series, watch-time, reach or audience data. A time series has to come from your own daily snapshots.

### Cited Findings
- Endpoint: `GET https://open.tiktokapis.com/v2/user/info/`. Fields by scope:
  - `user.info.basic`: open_id, union_id, avatar_url, avatar_url_100, avatar_large_url, display_name
  - `user.info.profile`: bio_description, profile_deep_link, is_verified, username
  - `user.info.stats`: follower_count, following_count, likes_count, video_count

  The page says "There is a migration plan related to this API" and links to a user-info scope-migration bulletin without giving details. — [TikTok: Get User Info](https://developers.tiktok.com/doc/tiktok-api-v2-get-user-info)
- The official scopes reference lists 25 scopes. The ones relevant here:
  - `user.info.basic`: "Read a user's profile info (open id, avatar, display name ...)"
  - `user.info.profile`: "Read access to profile_web_link, profile_deep_link, bio_description, is_verified". This mentions `profile_web_link`, but the Get User Info field table does not list it, so the docs are inconsistent.
  - `user.info.stats`: "likes count, follower count, following count, and video count"
  - `video.list`: "Read a user's public videos on TikTok"
  - Write scopes: `video.upload`, `video.publish`, `video.manage` ("inspect editable post elements, edit published posts, check edit status") and `video.collab`
  - Eight `portability.*` scopes, plus `research.*` scopes

  The page does not say which scopes need review. — [TikTok: Scopes Reference](https://developers.tiktok.com/docs/en/tiktok-api-scopes)
- `video.list` paging: `max_count` defaults to 10, maximum 20. Results are sorted by create_time descending, and the cursor is a UTC millisecond timestamp. No lookback limit is documented, so you can page back through all **public** videos. The Display API reference sidebar also lists a "Query Videos" endpoint, used to refresh known video IDs. — [TikTok: List Videos](https://developers.tiktok.com/doc/tiktok-api-v2-video-list); sidebar seen on [Get User Info](https://developers.tiktok.com/doc/tiktok-api-v2-get-user-info)
- Video object fields: id, create_time, cover_image_url (6-hour TTL), share_url, video_description, duration, height, width, title, embed_html, embed_link, like_count, comment_count, share_count, view_count, is_aigc. — [TikTok: Video Object](https://developers.tiktok.com/doc/tiktok-api-v2-video-object) (fetched for the earlier notes)
- `video_count` counts only publicly posted videos. — [Get User Info](https://developers.tiktok.com/doc/tiktok-api-v2-get-user-info) (per earlier notes)
- Rate limits: /v2/user/info/ and /v2/video/list/ each allow 600 requests per 1-minute sliding window. Exceeding it returns HTTP 429 `rate_limit_exceeded`. — [TikTok: Rate limits](https://developers.tiktok.com/doc/tiktok-api-v2-rate-limit) (per earlier notes)
- Users can approve some requested scopes and decline others, so the app should check `scope` in the token response. — [Get User Info](https://developers.tiktok.com/doc/tiktok-api-v2-get-user-info) via search summary; token response includes `scope` per [Refresh token doc](https://developers.tiktok.com/doc/oauth-refresh-a-user-access-token)

### Inferences
- Private, friends-only and draft videos are invisible to `video.list`. An archive built on this endpoint misses non-public posts and records nothing when a video goes private.
- 600 requests/min is far beyond what one creator needs. A daily poll of user/info plus N/20 video/list pages costs almost nothing.
- Because `cover_image_url` expires after 6 hours, the archiver should download thumbnails at poll time rather than store the URL.

### Gaps
- The content of the "user info scope migration" bulletin is still unknown. It may affect `user.info.profile`/`stats` gating.
- Whether `profile_web_link` (the bio link) is actually returned is unclear, because the two docs disagree.
- No official statement on how far back `video.list` reaches for accounts with thousands of videos. It is undocumented, and nobody reported a cap.

## App review / audit and the "private or personal use" rule

### Takeaway
The App Review Guidelines state verbatim, under "Review criteria for app details" > "Description": **"Apps must not be for private or personal use."** Review also requires a fully developed public website, visible privacy policy and terms, and a demo video recorded in sandbox. A self-only archiver fails the stated criteria. No public enforcement data or rejection reports specific to personal apps were found.

### Cited Findings
- The exact wording, "Apps must not be for private or personal use," is under the **Description** heading of "Review criteria for app details". The same criteria say apps still in development or testing are not approved, apps must not contain adult content, and apps must not request permissions they don't need. — [TikTok: App review guidelines](https://developers.tiktok.com/doc/app-review-guidelines)
- **Website:** a "valid, official" site that is fully developed and externally accessible. It cannot be a landing or login page. Privacy Policy and Terms of Service links must be visible without opening a menu. — [same](https://developers.tiktok.com/doc/app-review-guidelines)
- **Demo video:** 1 to 5 videos, each up to 50 MB, showing the complete end-to-end flow. Every requested product and scope must be shown. For web apps, the domain in the video must match the website URL. Unused products or scopes delay review. — [same](https://developers.tiktok.com/doc/app-review-guidelines)
- An app that has never been approved "must use a sandbox environment" to record the demo. — [same](https://developers.tiktok.com/doc/app-review-guidelines)
- App icon and name rules: the name must not reference social-media companies, and the icon must not resemble a known brand's. No review timeline is stated. — [same](https://developers.tiktok.com/doc/app-review-guidelines)
- URL ownership verification became mandatory for apps created after 9 Sep 2024. App Review added a "more information" submission section and app-icon specs on 22 Oct 2024. The App Review Guidelines were published 24 Jun 2024. — [TikTok developer changelog](https://developers.tiktok.com/docs/en/changelog)
- **Content Posting API:** "All content posted by unaudited clients will be restricted to private viewing mode." An audit is needed to lift this. — [TikTok: Content Posting API Get Started](https://developers.tiktok.com/doc/content-posting-api-get-started)
- Developer Terms (last modified 26 Dec 2025), Sec. II.1: End User access to TikTok information is granted "on a personal, non-exclusive…" basis "solely for the purpose of developing, maintaining, and supporting your Applications."
  - III.3(h) forbids using data to "build, help build, or supplement any profiles, databases, or similar records on any individual".
  - Section VI requires deleting TikTok information on termination.
  - The Terms set no retention period or cache limit. — [TikTok Developer Terms of Service](https://www.tiktok.com/legal/page/global/tik-tok-developer-terms-of-service/en)
- A November 2026 open-source project's issue records the same plan: request review for `user.info.stats` and keep numbers hand-kept until review passes. No outcome is recorded. — [GitHub: ChiefGyk3D/Reach-Around #388](https://github.com/ChiefGyk3D/Reach-Around/issues/388)

### Inferences
- A creator archiving their **own** data is arguably not "building a database on an individual" in the III.3(h) sense, because they are the authorizing user. This is a reading of the terms, not a ruling.
- A self-hosted, single-user archiver is exactly the "private or personal use" case the guideline excludes. Passing review would mean presenting it as a multi-user product with a public site, which would misrepresent a personal tool. Plan around sandbox instead.

### Gaps
- No first-hand developer reports were found of an app rejected specifically for personal use, or of how strictly the rule is applied.
- The guidelines don't say whether unaudited Display API apps get any restriction beyond sandbox-only use. For Content Posting there is the private-only rule above.

## Sandbox mode

### Takeaway
Since 24 Jun 2024, any developer can create up to **5 sandboxes per app**. Each sandbox can have up to **10 target users, which must be TikTok accounts the developer owns** and logs in with. Target users can authorize Login Kit and the products that depend on it, with no review. Sandbox excludes Data Portability and public-video Content Posting. No expiry is documented. This is the only plausible no-review path for a solo creator, but nothing official says whether it may run indefinitely or whether stats scopes return live data.

### Cited Findings
- Quotes from the sandbox doc:
  - "You can create up to 5 sandboxes."
  - Target users: "You can add up to 10 accounts". Each must be a TikTok account you own, added by logging in and accepting the Developer ToS.
  - Changes may take up to an hour to appear.
  - Target users "can be authorized for Login Kit and products that depend on it".
  - "Sandbox mode does not offer access to Content Posting API for public videos or Data Portability API." — [TikTok: Add a sandbox](https://developers.tiktok.com/doc/add-a-sandbox)
- To create a sandbox: Manage apps > select the app > switch the toggle to **Sandbox** > Create Sandbox (optionally cloning production or another sandbox) > add products > Apply changes. A sandbox config can be imported into a production Draft, which overwrites the draft's existing config. — [same](https://developers.tiktok.com/doc/add-a-sandbox)
- The sandbox doc says nothing about expiry or about access to data from accounts other than target users. — [same](https://developers.tiktok.com/doc/add-a-sandbox)
- Sandbox mode launched on 24 Jun 2024, along with the new app page UI and the App Review Guidelines. — [Changelog](https://developers.tiktok.com/docs/en/changelog)
- A third-party developer note (Nov 2026) says: "Whether user.info.stats returns data there is not documented." — [GitHub issue #388](https://github.com/ChiefGyk3D/Reach-Around/issues/388)

### Inferences
- Since target users are real accounts the developer owns, sandbox tokens almost certainly read those accounts' real data. Sandbox is described as a way to "try out integrations" against target users, not against mock data. This is not explicitly confirmed. The cheapest check is to create a sandbox, authorize your own account, and call `/v2/user/info/?fields=follower_count,...` and `/v2/video/list/`.
- A solo creator with ≤10 accounts fits within the target-user limits. The risk is policy, not quota: sandbox is meant for testing, and TikTok could add expiry or restrictions without notice.

### Gaps
- Sandbox expiry or inactivity cleanup: not documented. I found no reports either way.
- Whether `user.info.stats` and `video.list` return full data in sandbox: no official confirmation and no first-hand report found.
- Whether sandbox tokens follow the same 2h/24h and 180d/365d token lifetimes as production: not documented.

## Tokens, PKCE, redirect URIs, rate limits

### Takeaway
TikTok's own docs **contradict each other** on token lifetimes. The management page (current English text) says the access token lasts 2 hours and the refresh token 180 days. The refresh endpoint's sample response shows `expires_in: 86400` (24 h) and `refresh_expires_in: 31536000` (365 d), and other official pages and third parties still say 24 h / 365 d. Refresh tokens **rotate** on every refresh. Code should read `expires_in` / `refresh_expires_in` from each response and plan for user re-consent at least every ~6 months. Desktop Login Kit uses PKCE (S256, hex-encoded) and allows `http://localhost` / `127.0.0.1` redirect URIs. Web Login Kit requires static https URIs.

### Cited Findings
- Token management page: access token "2 hours" (`expires_in`), refresh token "180 days" (`refresh_expires_in`). "Both fields return the remaining lifetime in seconds." "A refresh request will return a different `refresh_token` from the one you sent". If you keep using a replaced token, "later refresh requests fail and the user must authorize your app again." Refresh must be done server-side, because the request includes the client secret. — [TikTok: Manage user access tokens](https://developers.tiktok.com/doc/oauth-user-access-token-management)
- Refresh endpoint: `POST https://open.tiktokapis.com/v2/oauth/token/`, `application/x-www-form-urlencoded`, with client_key, client_secret, `grant_type=refresh_token` and refresh_token. Within that one page:
  - The sample response shows `"expires_in": 86400` and `"refresh_expires_in": 31536000`.
  - The prose says the access token "expires within 2 hours" and the refresh token "is valid for 180 days after the initial issuance". — [TikTok: Refresh a user access token](https://developers.tiktok.com/doc/oauth-refresh-a-user-access-token)
- A search summary reports that the English token-management and silent-login pages state 24 h / 365 d, and that the Chinese page states 2 h / 180 d. My direct fetch of the English management page on 2026-11-21 returned 2 h / 180 d, so the docs appear to have changed recently or differ by version. — [search result: token management EN](https://developers.tiktok.com/docs/en/oauth-user-access-token-management); [ZH](https://developers.tiktok.com/docs/zh-Hans/oauth-user-access-token-management); [silent login](https://developers.tiktok.com/docs/en/silent-login)
- Third-party guides from 2026 still quote 24 h / 365 d. — [Phyllo TikTok API guide (Jul 2026)](https://www.getphyllo.com/post/tiktok-api-integration-guide-2026-setup-endpoints-common-pitfalls); [bundle.social token refresh (Aug 2026)](https://bundle.social/blog/oauth-token-refresh-social-apis)
- **Web Login Kit:**
  - Authorize URL: `https://www.tiktok.com/v2/auth/authorize/`, with client_key, response_type=code, scope (comma-separated), redirect_uri, state, and optional disable_auto_auth.
  - Up to 10 redirect URIs, each under 512 characters.
  - URIs "must be absolute and begin with `https`", must be static ("Parameters will be denied"), and must have no fragment.
  - The page does not mention PKCE or localhost. — [TikTok: Login Kit for Web](https://developers.tiktok.com/doc/login-kit-web)
- **Desktop Login Kit:**
  - PKCE is required. Verifier: 43-128 characters, generated fresh for each request. "You must use hex encoding of SHA256 to generate the code challenge". The method is always `S256`. Note that this is hex, not the base64url that standard RFC 7636 uses.
  - Redirect URIs may be `http` or `https`. "Only `localhost` or loopback IP `127.0.0.1` are allowed host names in URI"; examples include `http://localhost:3455/callback/` and `http://127.0.0.1:*/callback/`. The `*` wildcard port is supported.
  - The page's Express sample wrongly sends the verifier as `code_challenge`. — [TikTok: Login Kit for Desktop](https://developers.tiktok.com/doc/login-kit-desktop)
- Login Kit for Android has required https redirect URIs since 8 Oct 2024. — [Changelog](https://developers.tiktok.com/docs/en/changelog)
- Research API and Commercial Content API use client access tokens. All other APIs use user access tokens. — search summary of [token management (ZH)](https://developers.tiktok.com/docs/zh-Hans/oauth-user-access-token-management)
- Rate limits: 600 requests/min per endpoint for user/info and video/list. — [TikTok: Rate limits](https://developers.tiktok.com/doc/tiktok-api-v2-rate-limit) (per earlier notes)

### Inferences
- A self-hosted app should register as a **Desktop** Login Kit platform to get a localhost redirect with PKCE. Web platform requires an https public URI, which works only with a tunnel or a public domain.
- Plan for the worst case (180 days). Store the rotated refresh token atomically on every refresh, refresh daily, and alert the user before `refresh_expires_in` runs out. Losing one rotated token forces re-authorization.

### Gaps
- Which token lifetime is authoritative in production as of Nov 2026, and whether it differs for sandbox. Only an empirical check of `expires_in` / `refresh_expires_in` will settle it.
- Whether a refresh resets the refresh-token lifetime, or whether the lifetime is counted from "initial issuance" as the prose wording suggests. If it counts from initial issuance, re-consent is mandatory at 180 or 365 days no matter how often you refresh.

## Data Portability API

### Takeaway
It exports the user's "Download your data" archive by API: four categories, each with a single or ongoing scope. It contains no analytics. The only per-post metric is likes received, and it has a dated follower list (who followed, when) but no view counts, watch time or insights. It needs a **separate Data Portability application** (about 3-4 weeks) **plus Login Kit approval**, it is unavailable in sandbox, and the application assumes an organization (business-domain email, live org website). It is not usable by a solo developer without review. The earlier finding that it is limited to EEA/UK users under the DMA could not be re-confirmed from the current pages.

### Cited Findings
- Scopes: `portability.all|postsandprofile|activity|directmessages` × `.single|.ongoing`. Endpoints: Add Data Request, Check Status, Cancel, Download. Data can be downloaded for 4 days after it is prepared. Webhooks are optional. The docs show a naming mismatch: lifecycle categories all_data/activity/video/profile/direct_message versus the scope names. — [TikTok: Data Portability Get Started](https://developers.tiktok.com/doc/data-portability-api-get-started); [Scopes Reference](https://developers.tiktok.com/docs/en/tiktok-api-scopes)
- Approval: "Login Kit approval is required in addition to your Data Portability API application approval." "You can typically expect to hear back within 3-4 weeks." The application requires UX mockups and an app in at least Draft status. — [Get Started](https://developers.tiktok.com/doc/data-portability-api-get-started)
- Application guidelines:
  - "Enter the name of your representative or employee, rather than a business/organization name"
  - "Use an email address that matches your business/organization domain"
  - The org website must not be "a holding page or otherwise incomplete website"
  - "Select only the data scopes your stated use case requires"
  - Login Kit is reviewed separately. — [TikTok: Data Portability Application Guidelines](https://developers.tiktok.com/doc/data-portability-api-application-guidelines)
- "Sandbox mode does not offer access to … Data Portability API." — [Add a sandbox](https://developers.tiktok.com/doc/add-a-sandbox)
- Data types (updated 4 Jun 2026):
  - **Posts:** Date, video download link, "Received Likes num", title, privacy and interaction settings, AI-generated flag, location, sound, and "Number of Collections (only for photo post)"
  - **Recently deleted posts** (with likes)
  - **Follower** (Date, Username)
  - **Following**
  - **Profile Information:** includes Follower Count, Following Count and Like(s) Received
  - **Activity:** watch history, searches, share history, login history, purchases/gifts, off-TikTok activity, ad interests
  - **Direct Messages**
  - **Full archive only:** Go LIVE history with Total Views, Total Gifters, Total Earnings and Total Likes Received
  - No per-video views, watch time or insights. — [TikTok: Data Portability Data Types](https://developers.tiktok.com/doc/data-portability-data-types); [Changelog Jun 4 2026](https://developers.tiktok.com/docs/en/changelog)
- Changelog: Data Portability docs were updated on 19 Aug 2026 (Login Kit dependency guidance in Get Started, Guidelines and FAQ) and on 25 Aug 2026 (Login Kit info in the portal product config). — [Changelog](https://developers.tiktok.com/docs/en/changelog)

### Inferences
- What it adds for an archiver: the full **post inventory including private posts**, original video files, a **dated follower list** that can rebuild follower growth history (with no unfollow data), and LIVE totals. That is complementary to Display API, not a substitute for analytics.
- The same data is available manually through the in-app "Download your data" request, which needs no developer approval. For a solo creator, that manual export is the practical equivalent.

### Gaps
- Regional scope (EEA/UK only, or global): the overview page returned 404, and the fetched pages don't state it.
- Export file format (JSON/TXT) was not confirmed on these pages.
- No explicit statement allowing or banning individual/personal applicants. The org-centric form implies a business is expected.

## Research API and Commercial Content API

### Takeaway
Neither is a creator-analytics source. Both expose **public** data only, to vetted researchers (Research API) or to approved applicants for ad-library data limited to the EU (Commercial Content API). Both use client tokens, not user tokens.

### Cited Findings
- Research API eligibility:
  - "Qualified researchers in the U.S., Europe, Canada, and Brazil"
  - Academic institutions in the US, EEA, UK, Canada or Switzerland
  - EU not-for-profit/independent research bodies (beta)
  - Brazilian academic or non-profit bodies (youth-safety research)
  - Data: public profiles, follower/following lists, and liked, pinned and reposted videos. Nothing about creator analytics. — [TikTok: Research API](https://developers.tiktok.com/products/research-api/)
- Research changelog: a vetted-researcher data access application (23 Dec 2025); the VCE test stage limited to users with at least 25k followers (26 Apr 2025); coverage of all public videos, including those not eligible for the For You feed (26 Feb 2026); `favorites_count` added (21 May 2026). — [Changelog](https://developers.tiktok.com/docs/en/changelog)
- Commercial Content API: ad data including published and last-seen dates, targeting and reach, plus advertiser and "other commercial content" data. It is "made available globally" but "in this phase we are ONLY including data from EU countries". Data is kept for 1 year after an ad was last shown. Applicants need a developer account with an official email. — [TikTok: Commercial Content API](https://developers.tiktok.com/products/commercial-content-api)

### Inferences
- A US creator who is not an academic cannot use the Research API. Even a qualifying user would get only public counters similar to Display API, and the terms restrict use to research.

### Gaps
- None material to this use case.

## Content Posting API (status and metrics only)

### Takeaway
It returns no analytics. "Get Post Status" (polled by `publish_id`) only tracks upload and publish processing. Unaudited clients can post only privately, and sandbox cannot post public videos.

### Cited Findings
- "All content posted by unaudited clients will be restricted to private viewing mode." Get Post Status is used with the `publish_id` from the init call, and processing is asynchronous. No metrics are described. — [Content Posting API Get Started](https://developers.tiktok.com/doc/content-posting-api-get-started)
- Sandbox: no Content Posting API for public videos. — [Add a sandbox](https://developers.tiktok.com/doc/add-a-sandbox)
- New `video.manage` scope covers editing published posts and checking edit status. — [Scopes Reference](https://developers.tiktok.com/docs/en/tiktok-api-scopes)

### Gaps
- Any per-user or per-day posting caps for unaudited clients were not stated on the fetched page.

## Changes 2024–2026, incl. TikTok USDS Joint Venture

### Takeaway
Since 2024 there have been **no Display API, Login Kit scope or rate-limit changelog entries**. The changelog was last updated 26 Aug 2026. Platform-level changes were sandbox plus the review guidelines (Jun 2024), URL ownership verification (Sep 2024), Android https redirects (Oct 2024) and Data Portability doc updates (2026). The token-lifetime text on the docs (2 h / 180 d vs the long-standing 24 h / 365 d) appears to have changed without a changelog entry. No US-JV-specific developer portal, API change or developer-terms section was found.

### Cited Findings
- Changelog entries:
  - **2026:** 25 Aug and 19 Aug (Data Portability / Login Kit dependency); 4 Jun (Data Portability data types); 21 May and 26 Feb (Research Tools); 20 Jan (TikTok GO)
  - **2025:** Research items; Mini Games; organization management UI (23 Dec)
  - **2024:** Research API items; 22 Oct (App Review info section, icon specs); 8 Oct (Android https); 9 Sep (URL ownership verification); 24 Jun (sandbox and review guidelines); 17 Jan (doc search)

  The changelog has no Display API entries since its May 2023 reorganization and no token-lifetime entry. Last updated 26 Aug 2026. — [TikTok developer changelog](https://developers.tiktok.com/docs/en/changelog)
- The Developer Terms were last modified 26 Dec 2025. They have **no US-specific section** and no mention of USDS or a "US Data Sharing Agreement". The only US reference is export control (BIS). This contradicts the unverified search-snippet claim recorded in the earlier notes. — [TikTok Developer Terms of Service](https://www.tiktok.com/legal/page/global/tik-tok-developer-terms-of-service/en)
- TikTok USDS Joint Venture LLC closed in Jan 2026:
  - Ownership: 80.1% US and global investors, 19.9% ByteDance; Oracle, Silver Lake and MGX hold 15% each.
  - The algorithm is retrained on US data in Oracle's cloud.
  - Its safeguards cover TikTok, CapCut and Lemon8 in the US.
  - No developer-API changes were reported. — [Malwarebytes, Jan 2026](https://www.malwarebytes.com/blog/news/2026/01/tiktok-narrowly-avoids-a-us-ban-by-spinning-up-a-new-american-joint-venture); [NBC News](https://www.nbcnews.com/business/corporations/tiktok-bytedance-venture-trump-deal-rcna249989); [TikTok Newsroom](https://newsroom.tiktok.com/announcement-from-the-new-tiktok-usds-joint-venture-llc?lang=en) (via earlier notes)

### Inferences
- For a US creator, the developers.tiktok.com APIs appear operationally unchanged by the JV as of Nov 2026. Future US-specific developer terms are possible but not evidenced.
- Since the token docs changed silently, the archiver should not hard-code lifetimes. It should log `expires_in` / `refresh_expires_in` on every refresh.

### Gaps
- Whether the USDS JV publishes its own developer terms or a separate US developer portal: no source found.
- Contents of the user-info scope-migration bulletin: not retrieved.

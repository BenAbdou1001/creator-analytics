# TikTok creator analytics: non-API data access and terms (as of Nov 2026)

Research method note: TikTok's own Help Center (support.tiktok.com, which now redirects to tiktok.com/support/faq_detail?id=...) and Creator Academy pages render with JavaScript and came back empty when fetched. Claims attributed to them below were confirmed through secondary summaries (mainly Sirency, Oct 1 2026, which cites the specific TikTok articles) and search snippets. They are marked [secondary] where that applies. The legal pages (tiktok.com/legal) and developers.tiktok.com did fetch, so those findings are primary.

## In-app analytics (TikTok app Creator tools/TikTok Studio > Analytics; web tiktok.com/tiktokstudio)

### Takeaway
TikTok Studio Analytics has five tabs: Overview, Content, Viewers, Followers and LIVE. Current Creator Academy guidance offers 7, 28, 60 and 365-day presets plus custom ranges, and on web the custom range reaches back to July 17, 2022. Older guidance said 60 days (custom up to 60, Content tab 7 days only), and many third-party guides still repeat it. Analytics needs at least one public post, and some follower insights need 100 followers.

### Cited Findings
- Where to find it: mobile app is profile, then menu, then TikTok Studio, then "View all" under Analytics. Web is the Analytics tab on the left of TikTok Studio. The standalone Studio app has an Analytics tab at the bottom. Citing Creator Academy "introduction to analytics" [secondary] — [Sirency, Oct 2026](https://www.sirency.com/blog/tiktok-analytics-explained)
- Web URL is tiktok.com/tiktokstudio/analytics [secondary] — [search summary of Creator Academy / third-party guides](https://www.tiktok.com/creator-academy/en/article/tool-analytics-intro)
- **Overview** tab: post views, profile views, likes/comments/shares, estimated rewards, traffic source, search queries [secondary] — [Sirency](https://www.sirency.com/blog/tiktok-analytics-explained)
- **Content** tab: top posts, ranked by views, likes, new viewers or new followers. Each post shows retention rate (the retention curve), average watch time, watched full video, traffic sources and viewer information [secondary] — [Sirency](https://www.sirency.com/blog/tiktok-analytics-explained)
- **Viewers** tab: unique and returning viewers, modelled viewer insights (gender, age, location), most active times (last 7 days), related creators/posts [secondary] — [Sirency](https://www.sirency.com/blog/tiktok-analytics-explained)
- **Followers** tab: follower demographics and follower activity by hour and day [secondary] — [Sirency](https://www.sirency.com/blog/tiktok-analytics-explained)
- **LIVE** tab: LIVE count, total LIVE views and time, new viewers, new followers, unique viewers, Diamonds. It filters over 7 to 28 days. Citing Creator Academy "LIVE analytics" [secondary] — [Sirency](https://www.sirency.com/blog/tiktok-analytics-explained)
- Date presets: last 7, 28, 60 or 365 days, or custom. Custom ranges on web reach back to July 17, 2022. Citing Creator Academy "introduction to analytics" [secondary] — [Sirency](https://www.sirency.com/blog/tiktok-analytics-explained); also surfaced in search snippets of [Creator Academy tool-analytics-intro](https://www.tiktok.com/creator-academy/en/article/tool-analytics-intro)
- Conflict: an older Creator Academy article ("understanding your audience") says custom ranges go up to 60 days and Content ("All Content") metrics cover only the last 7 days. Sirency treats the newer intro as current and advises trusting the dashboard's own date picker — [Sirency](https://www.sirency.com/blog/tiktok-analytics-explained). Many third-party guides still say analytics "only go back 60 days" — [Sozee](https://www.sozee.ai/resources/export-tiktok-analytics-data/), [Graphed](https://www.graphed.com/blog/how-to-export-tiktok-analytics)
- Eligibility: analytics needs at least one public video. First-time users tap "Turn on" in the mobile app, and it is not on the mobile website. Analytics is "not yet available to everyone." Citing Help Center "viewing Analytics" / "how to use TikTok Analytics" [secondary] — [Sirency](https://www.sirency.com/blog/tiktok-analytics-explained)
- Data is generated only for videos posted after analytics is turned on [secondary] — [Sirency](https://www.sirency.com/blog/tiktok-analytics-explained)
- Follower insights need 100 followers. Citing Help Center "follower analytics not showing" [secondary] — [Sirency](https://www.sirency.com/blog/tiktok-analytics-explained)
- Recent data can take 1–2 days to update. Follower activity uses local time, other analytics use UTC [secondary] — [Sirency](https://www.sirency.com/blog/tiktok-analytics-explained)
- Demographics (gender/age/location) are modelled predictions, not confirmed user data. This is Sirency's description drawn from TikTok definitions — [Sirency](https://www.sirency.com/blog/tiktok-analytics-explained)
- Account type: one guide says export generally requires a Creator or Business account, and other sources dispute whether personal accounts are locked out [low confidence] — [Sozee](https://www.sozee.ai/resources/export-tiktok-analytics-data/)

### Inferences
- An archive that snapshots regularly (daily or weekly) is still worth having. Even with 365-day presets, the Content tab may show some metrics only for recent windows, demographics are modelled and get revised, and per-video counts keep changing after posting.
- Mixed time zones (UTC for most metrics, local for follower activity) need explicit normalisation in the archive.

### Gaps
- No primary, fetchable TikTok page could be read directly to confirm the exact current tab metric list (for example "total play time" and "search queries" per video, or "audience territories").
- No official statement says how long TikTok keeps per-video or daily analytics. The July 17, 2022 floor is the only concrete retention bound found.
- Official personal vs Creator vs Business eligibility rules for analytics weren't confirmed. Analytics now appears available on personal accounts with a public post.

## Official exports (TikTok Studio "Download data")

### Takeaway
Desktop web TikTok Studio has a download/export button in Analytics. Current guidance allows up to 365 days per download, and older guides say 60. The mobile app has no CSV export. Exports are split by section (overview, content, followers). TikTok publishes no column schema, and practitioners report that headers change between exports.

### Cited Findings
- Up to 365 days can be downloaded at a time (Creator Academy "introduction to analytics"). The "Download Data" button is available only on desktop web (Help Center "downloading Analytics data") [secondary] — [Sirency](https://www.sirency.com/blog/tiktok-analytics-explained)
- Path given as TikTok.com, then Profile icon, then TikTok Studio, then Analytics, then "Export Data". Desktop only, mobile app has no CSV export. Says 60-day limit [secondary, possibly outdated] — [Sozee](https://www.sozee.ai/resources/export-tiktok-analytics-data/)
- One category per download (account overview, video performance, audience demographics), each a separate download. Exported files use UTC timestamps [secondary] — [Sozee](https://www.sozee.ai/resources/export-tiktok-analytics-data/), [Graphed](https://graphed.com/blog/how-to-download-tiktok-analytics-data)
- A practitioner export (Oct 2026) produced three files. The Content file has one row per video with publish time, views, likes, comments, shares, average watch duration, total play time and new followers. The Overview file has daily aggregates. The Followers file has daily follower counts and demographic snapshots — [dev.to, knickman](https://dev.to/knickman/i-exported-90-days-of-my-tiktok-analytics-and-joined-the-csvs-the-app-refuses-to-show-you-537p)
- Header drift observed: "Video title" in a March export vs "Video name" in a May export. Titles are truncated to a fixed length, dates come in "a couple of formats," and field names "vary by region and change without notice." Per-video new-follower counts keep updating after publish, so merging snapshots naively double-counts — [dev.to](https://dev.to/knickman/i-exported-90-days-of-my-tiktok-analytics-and-joined-the-csvs-the-app-refuses-to-show-you-537p)
- Business-side tools are separate: TikTok Business Hub has a "Download data" button with XLSX or CSV — [Metricool](https://metricool.com/tiktok-reports/). TikTok One project reporting exports .csv, .xlsx or zip — [TikTok One help](https://ads.tiktok.com/resources/help/article/about-tiktok-one-campaign-reporting)

### Inferences
- The CSV importer should match columns by alias (for example title/name, and lowercase/underscore-normalised headers) and parse dates leniently. It should store each export as a dated snapshot rather than overwriting.
- Retention curves, traffic-source breakdowns and search-query lists are not reported as present in CSV exports. Having the agent read the dashboard may stay the only route for those.

### Gaps
- No official list of CSV/XLSX columns or file names. Whether the format is CSV or XLSX (or the user chooses) is not confirmed by a primary source.
- Whether Viewers and LIVE tabs are exportable is unconfirmed.

## "Download your data" (personal data archive)

### Takeaway
Settings and privacy > Account > Download your data produces a TXT or JSON archive. It contains posts (with like counts but **not view counts**), follower and following lists **with dates**, likes, comments, watch history, LIVE host history (including total views and earnings per LIVE), and wallet transactions. It is not an analytics export. Because the follower list is dated, it can feed a follower-diff/unfollow tracker.

### Cited Findings
- Path: Profile, then menu, then Settings and privacy, then Account (Manage account), then Download your data. Pick TXT or JSON, then Request data. TXT is described as human-readable and JSON as machine-readable [secondary] — [PIRG](https://pirg.org/edfund/resources/how-to-request-and-download-tiktok-data/), [MakeUseOf](https://www.makeuseof.com/how-to-download-your-tiktok-data/)
- Processing "may take up to a few days," with status shown under the "Download data" tab. The file is reportedly downloadable for up to four days [secondary] — [PIRG](https://pirg.org/edfund/resources/how-to-request-and-download-tiktok-data/). A claim of a 24-hour verification delay comes from a low-authority source and is unverified
- TikTok notes not all data may be included, "especially if it impacts others' privacy" [secondary, via search summary] — [TechCrunch Jan 2025](https://techcrunch.com/2025/01/17/tiktok-ban-how-to-download-your-videos-and-data)
- The official data categories (Data Portability API data types, which mirror the archive) are listed below. Source for all of them: [TikTok for Developers, data types](https://developers.tiktok.com/doc/data-portability-data-types)
  - **Posts:** date, download link (.mp4/.jpg), received likes count, title, privacy, comment/duet/stitch settings, AI-generated flag, location, sound, alt text.
  - **Recently deleted posts:** includes the date deleted.
  - **Profile:** username, bio, follower and following counts, likes received, block list, and other profile fields.
  - **Followers and following:** "date and username" for each.
  - **Activity:** watch history, searches, share history, login history, off-TikTok activity, purchases (gift send/buy).
  - **Direct messages.**
  - **Full archive extras:** likes and favourites (with dates), comments made, TikTok Shop data (orders, returns, browsing), TikTok LIVE host data (go-live history with duration, room ID, title, total views, gifters, earnings, likes), and income/wallet transaction history (type, date, currency, amount, status, ID).
- No general analytics: video view counts are not listed for posts. Only likes, LIVE total views/gifters/earnings, and wallet transactions appear. "Not all features are available in all regions," and files may be empty — [TikTok for Developers](https://developers.tiktok.com/doc/data-portability-data-types)
- The same data is available programmatically to apps through the Data Portability API (introduced 2024), which has its own application guidelines covering deletion of TikTok-sourced data — [TikTok dev blog](https://developers.tiktok.com/blog/2024-introducing-tiktok-data-portability-api), [DPA application guidelines](https://developers.tiktok.com/doc/data-portability-api-application-guidelines)

### Inferences
- The dated follower list makes an unfollow tracker feasible by diffing successive archives. Because generating an archive takes days, the tracker can't be close to real time. The follower list carries no reason for leaving and no user IDs beyond the username, and a username change would look like an unfollow followed by a new follow.
- For monetization history, the wallet/income transactions and LIVE host history are the most complete official records found.

### Gaps
- No primary confirmation of the 4-day download window or typical processing time in 2026.
- Whether the Data Portability API is open in the US post-JV (it was historically aimed at EEA/UK users) is unconfirmed.

## ToS / Developer Terms on scraping and automated access

### Takeaway
The US Terms (TikTok USDS Joint Venture LLC, last updated July 15, 2026) ban scraping, crawling, exporting or extracting data "in any form, for any purpose" using automated systems, including bots, unless approved in writing. The global/ROW Terms ban "automated scripts to collect information from or otherwise interact with the Services." Neither has an exception for a user's own account. The Developer Terms allow automation only through documented Developer Services. No TikTok statement specifically addresses AI browser agents, and no documented case was found of an account restricted for reading its own analytics.

### Cited Findings
- **US ToS** (contracting entity TikTok USDS Joint Venture LLC, last updated July 15, 2026), Section 3.4 "What you can't do." It prohibits using "any automated system or software, including automated “bots,”" to "scrape, crawl, export or otherwise extract any data or content in any form, for any purpose" "except as approved in writing by TikTok USDS Joint Venture" — [TikTok US ToS](https://www.tiktok.com/legal/page/us/terms-of-service/en)
- US ToS Section 3.10 also bars using generative-AI features "via any automated system or software" "unless otherwise authorized." Section 3.4 bars reverse engineering without written authorization — [TikTok US ToS](https://www.tiktok.com/legal/page/us/terms-of-service/en)
- US ToS Section 5.2: the JV may ban, suspend or restrict features "at any time and without prior notice" if it believes the Terms were violated, and appeals go through in-platform functions — [TikTok US ToS](https://www.tiktok.com/legal/page/us/terms-of-service/en)
- **ROW ToS** (TikTok Pte. Ltd. or affiliates, last updated 1 December 2025), Section 5. You may not "use automated scripts to collect information from or otherwise interact with the Services" or "bypass any measures we may use to prevent or restrict access to the Services" — [TikTok ROW ToS](https://www.tiktok.com/legal/page/row/terms-of-service/en)
- US terms history: the US ToS was updated January 22, 2026 (per TikTok's own California AB 587 report) — [CA AG filing](https://oag.ca.gov/sites/default/files/TikTok%20California%20AB%20587%20Report%20%28Q3%20%26%20Q4%202025%29.pdf/TikTok%20California%20AB%20587%20Report%20%28Q3%20%26%20Q4%202025%29.pdf). Open Terms Archive reports a rewrite on Jan 23, 2026 that creates US-only documents naming "TikTok USDS Joint Venture LLC" as "operator of the Platform in the United States" — [Open Terms Archive](https://opentermsarchive.org/en/memos/tiktok-rewrites-all-terms-following-usa-operations-transfer/)
- The US Privacy Policy rewrite added collection of AI-interaction data and precise location (depending on settings), and widened sharing with affiliates "to facilitate a global and interoperable experience" — [Open Terms Archive](https://opentermsarchive.org/en/memos/tiktok-rewrites-all-terms-following-usa-operations-transfer/); users had to accept to continue — [ProPakistani citing Wired](https://propakistani.pk/2026/01/24/tiktok-now-collects-even-more-user-data-after-us-take-over/)
- A new "TikTok Developer US Data Sharing Agreement" section was added to the Developer Terms. The memo doesn't describe its contents — [Open Terms Archive](https://opentermsarchive.org/en/memos/tiktok-rewrites-all-terms-following-usa-operations-transfer/)
- **Developer Terms** (global, last modified Dec 26, 2025). Section II.1 allows you to "use automated means in your Application to collect information from" the Developer Services, as documented. Section III.3(k) bars using "any robot, spider, site search or retrieval application, or other device to collect information about users" for unauthorized purposes. Section III.3(g) bars usage that "exceeds reasonable request volume" — [TikTok Developer Terms](https://www.tiktok.com/legal/page/global/tik-tok-developer-terms-of-service/en)
- Developer Terms on deletion: on termination you must "delete TikTok Confidential Information or TikTok Information obtained through TikTok Developer Services in all forms" (Section VI). There is no explicit cache-duration or deletion-on-user-revocation clause in the main Developer Terms — [TikTok Developer Terms](https://www.tiktok.com/legal/page/global/tik-tok-developer-terms-of-service/en)
- By contrast, TikTok's advertising terms (as tracked by a third party) require users to stop access and delete data when authorization is revoked — [ConductAtlas](https://conductatlas.com/platform/tiktok-ads/tiktok-advertising-terms/provision/CA-P-069778/permitted-users-must-delete-data-upon-revocation/). The Research API requires periodic data refresh and removal of records the API no longer returns — [Technomoral Substack](https://technomoral.substack.com/p/researcher-beware-four-red-flags)
- Enforcement: vendor and blog sources say bot-like or automated activity and "third-party automation tools" can trigger restrictions or shadowbans. No official TikTok statement about analytics extensions or browser agents was found [low-authority] — [Ayrshare](https://www.ayrshare.com/docs/help-center/technical-support/tiktok_account_restricted), [Manychat](https://manychat.com/blog/tiktok-shadowban/)

### Inferences
- An AI agent driving a logged-in browser to read and record one's own Studio dashboards plausibly falls within "automated system or software ... extract any data ... for any purpose" in the US ToS. There is no own-account carve-out. The practical risk is account-level action (Section 5.2) rather than litigation. Human-paced, low-volume reading lowers detection risk but doesn't change the contractual position.
- The ToS-clean routes are manual CSV downloads by the user, the "Download your data" archive, and official APIs (Display API / Data Portability API) under Developer Terms. A self-hosted archive should prefer these and treat agent dashboard reading as a gap-filler the user knowingly accepts.
- The Developer Terms deletion-on-termination duty applies only to data obtained via Developer Services. Data the user exported manually is the user's own copy.

### Gaps
- Exact text of the "TikTok Developer US Data Sharing Agreement" was not retrieved.
- No confirmed enforcement cases specific to own-account automated analytics reading.

## Creator monetization data

### Takeaway
Monetization figures appear in TikTok Studio, where Analytics Overview shows "estimated rewards", the Creator Rewards dashboard shows qualified views, RPM and payouts, and LIVE analytics shows Diamonds. No source confirms a CSV export for rewards. The personal data archive's income/wallet transactions and LIVE host history (with earnings) are the only documented downloadable monetization records.

### Cited Findings
- Overview's "estimated rewards" covers the selected range and is an estimate, not a final payment [secondary] — [Sirency](https://www.sirency.com/blog/tiktok-analytics-explained)
- The Creator Rewards Program dashboard shows estimated rewards, qualified views and program eligibility (TikTok newsroom, March 18, 2024) — [TikTok Newsroom](https://newsroom.tiktok.com/introducing-the-new-creator-rewards-program). Later updates reportedly added RPM, monthly estimated-reward charts and a payout section with past and upcoming payouts [secondary] — [Metricool](https://metricool.com/tiktok-creator-next/)
- Only videos longer than one minute qualify for Creator Rewards — [Metricool](https://metricool.com/tiktok-creator-fund/), [TikTok Newsroom](https://newsroom.tiktok.com/introducing-the-new-creator-rewards-program)
- The LIVE tab shows Diamonds [secondary] — [Sirency](https://www.sirency.com/blog/tiktok-analytics-explained)
- The data archive includes income and wallet transaction history (type, date, currency, amount, status, transaction ID), gift purchase history, LIVE host earnings per session, and TikTok Shop order data — [TikTok for Developers, data types](https://developers.tiktok.com/doc/data-portability-data-types)

### Inferences
- For a single-user archive, the wallet/income transactions in "Download your data" are the most reliable ledger. Dashboard estimates should be stored as dated estimates and reconciled against them later.

### Gaps
- No source on exports for Subscriptions income or TikTok Shop affiliate commissions (beyond the Shop order data in the archive). The TikTok Shop Seller/Affiliate Center may have its own exports, but this was not researched.
- No confirmation of whether the Studio "Download data" export includes an estimated-rewards column.

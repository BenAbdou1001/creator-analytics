# Terms of Service, Data Storage Constraints, and Implementation Patterns for a Self-Hosted YouTube + Instagram Analytics Archive

Scope: a single-user, self-hosted, MIT-licensed FastAPI + SQLAlchemy async + PostgreSQL app that pulls the owner's own data from the YouTube APIs and Meta's Instagram APIs. Research date: 2026-11-20. Policy pages were fetched live on this date. Some fetch summaries are paraphrased by the fetch tool; check exact wording on the source pages before quoting it in user-facing docs. None of this is legal advice.

## A1. YouTube API Services Terms and Developer Policies: storage, revocation, branding, audits, personal-tool applicability

### Takeaway
Analytics, Reporting API data and statistics from the owner's own channel (Authorized Data) may be stored indefinitely, as long as the client re-verifies every 30 days that the user's authorization is still valid. Other Authorized Data, such as video titles and descriptions, must be refreshed or deleted every 30 days. On revocation, the client must delete data within 7 days (in-app revoke) or 30 days (revoke from Google's settings page). The policies carry no exemption for personal or single-user tools. In practice a self-hosted owner-only tool can comply easily: keep refreshing metadata, check the token at least every 30 days, add revoke-and-purge, write a privacy policy, and show YouTube attribution. A compliance audit happens only if the user requests a quota extension, and the default quota is very likely enough for one channel.

### Cited Findings
- **Analytics and Reporting data can be kept beyond 30 days with 30-day re-verification.** III.E.4.b: data from the YouTube Analytics API, data from the YouTube Reporting API, and statistics from other YouTube API services (such as view counts) may be stored beyond 30 days. The client must verify "every 30 days that it is still authorized by the user to access that data." — [YouTube Developer Policies](https://developers.google.com/youtube/terms/developer-policies)
- **Other Authorized Data has a 30-day limit.** III.E.4.c: other Authorized Data, such as video metadata, may be stored for no more than 30 calendar days and must then be deleted or refreshed. — [YouTube Developer Policies](https://developers.google.com/youtube/terms/developer-policies)
- **Non-Authorized Data:** only limited amounts may be stored, temporarily and for no more than 30 days. Statistics retrieved as Non-Authorized Data, such as public view counts of other channels, also cannot be kept beyond 30 days. — [YouTube Developer Policies](https://developers.google.com/youtube/terms/developer-policies)
- **Definition:** "Authorized Data" is "API Data that an active user expressly authorizes an API Client to access" through User Credentials. — [YouTube Developer Policies, Section IV](https://developers.google.com/youtube/terms/developer-policies)
- **Tokens** may be kept "for as long as is necessary" for purposes tied to the user's active consent (III.E.4.a). — [YouTube Developer Policies](https://developers.google.com/youtube/terms/developer-policies)
- **Consistency and display:**
  - Stored data must be kept reasonably consistent with current data (III.E.4.e).
  - Clients must display the latest available data. Historical data is acceptable if it is presented accurately for its time period (III.E.4.f).
  - Clients must not replace API Data with independently calculated figures. Derived metrics are allowed only with a clear disclosure that they do not come from YouTube (III.E.4.h).
  - Source: [YouTube Developer Policies](https://developers.google.com/youtube/terms/developer-policies)
- **New derived-metrics policy (Section III.L):** a policy for derived metrics took effect on June 1, 2026. It applies "only to audited developers with analytics use cases" approved through the quota extension process. — [YouTube Developer Policies](https://developers.google.com/youtube/terms/developer-policies). Uncertain: the fetch summary did not explain how this interacts with III.E.4.h for unaudited clients. Read III.L directly.
- **Deletion on request:** data must be deleted "as soon as possible and within 7 calendar days" (III.E.4.g). — [YouTube Developer Policies](https://developers.google.com/youtube/terms/developer-policies)
- **Revocation:**
  - Users must have an easy in-app way to revoke consent. The client "must programmatically revoke that token right away" and delete Authorized Data within 7 days (III.D.2.3.a).
  - If the user revokes through Google's security settings page, the client must delete the related data within 30 days (III.D.2.3.b).
  - Source: [YouTube Developer Policies](https://developers.google.com/youtube/terms/developer-policies)
- **Privacy policy is required (III.A.2).** It must:
  - be agreed to before use and stay prominently accessible;
  - disclose the use of YouTube API Services;
  - link to Google's Privacy Policy;
  - explain what data is collected, stored and shared;
  - explain how to revoke access through Google's security settings;
  - give contact information.
  - Sources: [YouTube Developer Policies](https://developers.google.com/youtube/terms/developer-policies). The ToS also says: "Each API Client will provide and adhere to a published privacy policy" (§7). — [YouTube API Services Terms of Service](https://developers.google.com/youtube/terms/api-services-terms-of-service)
- **Branding (III.F.2):**
  - Pages showing YouTube data must make clear that YouTube is the source, using YouTube Brand Features under the Branding Guidelines.
  - Each YouTube result needs its own attribution.
  - Attribution must appear on all device types.
  - Source: [YouTube Developer Policies](https://developers.google.com/youtube/terms/developer-policies)
- **Quota extensions and audits (III.D.3):**
  - A developer who hits the quota can apply for more by completing an "API Compliance Audit."
  - Granted quota may be used only for the approved use case.
  - Developers audited and found compliant within the past 12 months can apply for more through the same form.
  - YouTube may request accounts that give access to all features of production clients (III.H.3).
  - Source: [YouTube Developer Policies](https://developers.google.com/youtube/terms/developer-policies)
- **YouTube may audit at any time.** The ToS lets YouTube "monitor and audit your access to and use of the YouTube API Services, at any time" (§6). — [YouTube API Services ToS](https://developers.google.com/youtube/terms/api-services-terms-of-service)
- **Security and termination:**
  - The client must keep "reasonable and appropriate administrative, organizational, technical and physical controls" (§8).
  - On termination, it must delete all API Data (§24.3).
  - Source: [YouTube API Services ToS](https://developers.google.com/youtube/terms/api-services-terms-of-service)
- **No personal-use carve-out.** The ToS contains no general personal or internal-use exemption. The only "personal" language is the brand-feature license in §10.1. — [YouTube API Services ToS](https://developers.google.com/youtube/terms/api-services-terms-of-service)
- **YouTube Analytics API scopes:**
  - `yt-analytics.readonly` covers view and engagement reports.
  - `yt-analytics-monetary.readonly` adds revenue and ad metrics.
  - Source: [YouTube Analytics API reference](https://developers.google.com/youtube/analytics/reference)
- **Google OAuth verification exemptions (the Google-side counterpart to the YouTube rules):**
  - **"Personal mode"** is for apps where "you are the only user." It is limited to your own Google Account, shows no unverified-app warning, and is a one-time choice that cannot be converted later.
  - **Development/testing apps** show the unverified-app screen and are capped at 100 users.
  - **Limited-audience apps** (under 100 users) can be clicked through the warning.
  - Source: [Google Cloud Help – When is verification not needed](https://support.google.com/cloud/answer/13464323)
- **Testing-status projects get 7-day refresh tokens.** A refresh token from an External-type project in "Testing" publishing status expires in 7 days, unless the app requests only name, email and profile scopes. This would break unattended daily sync. — [Google OAuth 2.0 overview](https://developers.google.com/identity/protocols/oauth2)
- **Other refresh-token limits:**
  - There is a limit of 100 refresh tokens per Google Account per OAuth client ID. The oldest token is invalidated silently once the limit is exceeded.
  - Tokens also expire after six months without use.
  - Source: [Google OAuth 2.0 overview](https://developers.google.com/identity/protocols/oauth2)

### Inferences
- An owner-only archive of daily analytics fits the III.E.4.b exception. The required design pieces are:
  - A scheduled "authorization still valid" check at least every 30 days. Any successful token refresh or API call probably satisfies it. Log the timestamp.
  - A 30-day refresh-or-purge job for non-analytics metadata (titles, descriptions, thumbnails).
  - Revoke-and-delete functionality: call Google's revoke endpoint, then delete the data.
  - Under III.E.4.h, any computed metrics the app shows (e.g. "follower lift", engagement rates) should be labeled as computed by the app, not by YouTube.
- Because each self-hoster creates their own Google Cloud project (the BYO client pattern), each self-hoster is technically the "developer" bound by the API ToS. The open-source repo should ship a template privacy policy and document the obligations.
- To avoid weekly re-auth, a self-hoster should set the consent screen to "In production". With personal mode or under 100 users, verification is not needed, though the user may click through a warning. Personal mode looks like the cleanest fit, but whether it is available for External-type projects with sensitive YouTube scopes was not confirmed.
- One channel's daily Analytics queries almost certainly fit the default quota, so no compliance audit would be triggered. The default quota figure itself was not fetched; see Gaps.

### Gaps
- The exact default daily quota for the YouTube Data API and the Analytics API was not re-verified in this session. 10,000 units/day for the Data API is widely cited, but it was not fetched.
- The page that sets up "personal mode" was not fetched, so its availability and steps for sensitive YouTube scopes are unconfirmed.
- The full text of the June 2026 derived-metrics policy (III.L) was not read.
- The policies do not say whether the 30-day authorization re-verification must be an explicit user action or can be a programmatic token check. Common practice treats a successful token refresh as verification. This is unconfirmed by Google.

## A2. Meta Platform Terms and Developer Policies: retention, deletion callback, indefinite storage of own insights, Data Use Checkup, own-app vs shared-app

### Takeaway
Meta's Platform Terms (updated Feb 3, 2026) have no fixed retention period. Platform Data must be deleted when it is no longer needed for a legitimate purpose, when the product stops operating, or when the user or Meta asks. Keeping your own insights indefinitely for your own archive appears permissible, because the purpose continues. Apps must provide either a data deletion callback URL or a deletion instructions URL, plus a privacy policy. If each self-hoster creates their own Meta app and only connects their own Instagram professional account, the app only needs Standard Access and no App Review. A shared, maintainer-run app would need Advanced Access and App Review, and would make the maintainer the data controller.

### Cited Findings
- **Platform Terms last updated 3 February 2026.** — [Meta Platform Terms](https://developers.facebook.com/terms/) (fetched in French: "Conditions générales de la Plateforme")
- **Deletion triggers (§3.d.i.2).** Delete Platform Data as soon as reasonably possible when:
  - it is no longer needed for legitimate purposes;
  - you stop operating the product;
  - Meta asks;
  - a user requests deletion or no longer has an account;
  - the law requires it.
  - Anonymized, aggregated or de-identified data is excluded from the user-deletion trigger.
  - Source: [Meta Platform Terms](https://developers.facebook.com/terms/)
- **User-facing deletion rights (§3.d.i.1, §4.a–b):**
  - Users must be able to request modification or deletion through an easy, clearly indicated method.
  - The privacy policy must explain how to request deletion.
  - Source: [Meta Platform Terms](https://developers.facebook.com/terms/)
- **Security (§6):**
  - Maintain safeguards that meet industry standards.
  - Protect access tokens and secret keys, and share them only with service providers.
  - Report incidents.
  - Source: [Meta Platform Terms](https://developers.facebook.com/terms/)
- **Certifications and audits (§7):**
  - Meta may request compliance certifications at any time, through the App Dashboard or elsewhere (§7.d). This is the mechanism behind the annual "Data Use Checkup."
  - Audits are limited to once per calendar year, with 10 business days' notice (§7.c).
  - Source: [Meta Platform Terms](https://developers.facebook.com/terms/). Note: the fetched Terms text does not use the phrase "Data Use Checkup".
- **Deletion callback.**
  - The docs say "all apps must inform users in their privacy policy how to request deletion of their data."
  - Developers "need to specify either a data deletion callback instruction URL or a callback URL."
  - A callback must use HTTPS, parse and verify a signed request, start deletion, and return `{url, confirmation_code}`.
  - The FAQ says "Nonaction will not result in deactivation", but non-compliance "may result in your callback being removed or your app being disabled."
  - Source: [Meta Data Deletion Callback docs](https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback)
- **Access levels for Instagram API with Instagram Login.** "Advanced Access if your app serves Instagram professional accounts you don't own or manage". Standard Access applies if you own or manage the accounts and have added them to the app in the App Dashboard. — [Business Login for Instagram](https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/business-login.md); same text on [Instagram Insights docs](https://developers.facebook.com/documentation/instagram-platform/insights.md)
- **Insights requirements:**
  - Permissions: `instagram_business_basic` and `instagram_business_manage_insights`.
  - Host: `graph.instagram.com`.
  - Account type: business or creator (professional) accounts only.
  - Source: [Instagram Insights docs](https://developers.facebook.com/documentation/instagram-platform/insights.md)
- **"User Metrics data is stored for up to 90 days."** Some metrics are unavailable below 100 followers, and missing data returns an empty set, not 0. — [Instagram Insights docs](https://developers.facebook.com/documentation/instagram-platform/insights.md)

### Inferences
- The 90-day window on Instagram user metrics is a strong reason to archive locally at least daily. Meta itself will not keep account-level history, so a gap longer than 90 days loses data permanently.
- **Keeping data indefinitely.** "Legitimate purpose" plus "operating the product" supports indefinite retention of the owner's own insights in their own archive. When the user disconnects, the app should offer, and probably default to, a purge.
  - Aggregated or de-identified data is exempt from the user-deletion trigger. That has little relevance when the data subject is the archive owner.
  - Confidence: moderate. No Meta source explicitly addresses "storing your own insights indefinitely".
- **Own-app pattern (recommended for this project).** Each self-hoster creates a Meta app, adds their own Instagram account as a role or tester, and stays on Standard Access.
  - No App Review is needed. Whether the app can stay in Development mode indefinitely is uncertain; see Gaps.
  - The self-hoster is the "developer" bound by the Platform Terms, so they still need a privacy policy URL and either a deletion instructions URL or a callback.
  - A static instructions page, for example a section in the repo's GitHub Pages docs, is the low-effort option. A callback would need a public HTTPS endpoint, which a localhost app lacks.
- **Shared-app pattern.** A shared app run by the maintainer would need Advanced Access and App Review, business verification, a public HTTPS backend for redirects and callbacks, and annual Data Use Checkups. It would also make the maintainer liable for every user's data. This is a poor fit for a self-hosted MIT project.

### Gaps
- The Meta Developer Policies page (developers.facebook.com/devpolicy) was not fetched separately. Its exact wording on retention and on "Data Use Checkup" frequency is unconfirmed here. Annual Data Use Checkup is common knowledge but uncited.
- Not confirmed:
  - whether a Development-mode app with only role-holding users must complete Data Use Checkup;
  - whether it needs a privacy policy URL before being switched to Live;
  - whether Instagram Login tokens work fully in Development mode for insights.
- The insights page still uses `impressions` in its examples. Meta reportedly deprecated `impressions` in favor of `views` for newer API versions in 2025. That claim is unverified here, so check the current metric list.
- No Meta rate-limit figures for the Instagram Platform were gathered.

## A3. Is scraping or browser automation (an AI agent reading dashboards) against YouTube/Instagram terms?

### Takeaway
Yes, on both platforms. YouTube's Terms of Service forbid accessing the Service "using any automated means (such as robots, botnets or scrapers)" except for public search engines, with prior written permission, or as allowed by applicable law. Instagram's terms forbid collecting information "in an automated way without our express permission". Meta's Automated Data Collection terms say Platform APIs are "the only allowable means to access data programmatically." The project's current agent-driven dashboard reading (YouTube Studio and Instagram insights) carries account-level enforcement risk. Official APIs remove that risk.

### Cited Findings
- **YouTube ToS (Permissions and Restrictions, item 3)** prohibits accessing the Service "using any automated means (such as robots, botnets or scrapers)". The exceptions are (a) public search engines following robots.txt, (b) prior written permission from YouTube, and (c) activity permitted by applicable law. — [YouTube Terms of Service](https://www.youtube.com/static?template=terms). The page was fetched in Arabic; this is a translation of the standard English text.
- **YouTube API ToS limits.** The API ToS limits API access to developing and operating your API Client (§3.1) and forbids circumventing quota (§15). It does not address scraping directly. — [YouTube API Services ToS](https://developers.google.com/youtube/terms/api-services-terms-of-service)
- **Instagram Terms of Use** say users can't "access or collect information in unauthorized ways. This includes ... collecting information in an automated way without our express permission." — quoted in search results for [Instagram Terms of Use](https://help.instagram.com/581066165581870). The live page did not render via fetch, so the wording is unverified on the live page.
- **Meta Automated Data Collection Terms.**
  - "Platform APIs are the only allowable means to access data programmatically, unless you have our prior written permission."
  - They also prohibit "The use of scripts, HTTP libraries, javascript or other executable code to automate actions."
  - "these terms still apply even if the conduct is not intentional."
  - Source: [Meta Automated Data Collection Terms](https://developers.facebook.com/documentation/development/terms-and-policies/automated-data-collection.md)
- **Meta enforces against scrapers in court.** One example is litigation against Social Data for scraping Instagram. — [Nixon Peabody](https://www.nixonpeabody.com/insights/articles/2021/12/23/meta-attempts-to-stop-scraping-of-instagram-user-data)

### Inferences
- Reading your own logged-in dashboards with an AI browser agent is still "automated means" under the plain wording on both platforms. The terms do not exempt the account's own data.
- Practical enforcement risk for a single owner reading their own Studio or Insights pages at low frequency is probably low, but it is not zero. The likely consequences are a checkpoint, CAPTCHA, temporary lock or account restriction, not legal action. Losing a creator's main account is a high-cost outcome.
- Official APIs give a sanctioned path, stable schemas and token-based auth with no stored passwords. They do cost setup friction (developer app creation, OAuth, privacy policy) and some metric gaps relative to Studio. Some Studio-only metrics may be unavailable via API; this was not verified here.
- Recommended framing for the project: make the APIs the primary path. If the browser agent stays as a fallback at all, mark it clearly as user-at-own-risk and against platform ToS.

### Gaps
- No source quantified enforcement likelihood for low-volume personal automation.
- No source compared metric coverage between Studio or Instagram Insights UIs and the APIs.

## B1. OAuth patterns for an open-source self-hosted app: BYO client, localhost redirects, token storage, refresh scheduling

### Takeaway
Use "bring your own client ID/secret": each self-hoster registers their own Google Cloud OAuth client and their own Meta app, and puts the credentials in env or config. This is what Postiz does.

- **Google.** Loopback redirects (`http://127.0.0.1:<port>`) are officially supported for Desktop-app clients, with PKCE. Web-type clients can also register `http://localhost` redirect URIs.
- **Meta.** It historically allowed `http://localhost` redirects only for apps in Development mode, and otherwise enforced HTTPS. Current official confirmation for Instagram Login was not found, so plan for HTTPS (a local cert or a tunnel such as ngrok) as a fallback.
- **Token handling.** Encrypt refresh and long-lived tokens at rest. Run a scheduler that refreshes Instagram tokens well before their 60-day expiry, and keeps Google refresh tokens alive with at least one use within 6 months.

### Cited Findings
- **Google loopback redirects for desktop apps.**
  - Recommended for macOS, Linux and Windows desktop apps: start a local listener on a random port and use `http://127.0.0.1:port` or `http://[::1]:port`. `localhost` also works but "may be blocked by some client firewalls".
  - Create the client as the "Desktop app" type.
  - "Desktop apps are public clients and cannot keep secrets confidential". The client_secret is optional and PKCE is required.
  - "Always use PKCE." S256 is recommended.
  - OOB copy/paste flow: no longer supported. Custom URI schemes: also no longer supported.
  - Source: [Google OAuth for installed apps](https://developers.google.com/identity/protocols/oauth2/native-app)
- **Google Testing-mode refresh tokens expire in 7 days; there is a 100-token-per-client limit; tokens expire after 6 months unused.** — [Google OAuth 2.0 overview](https://developers.google.com/identity/protocols/oauth2)
- **Instagram Login redirect URI must exactly match a URI configured in the App Dashboard.** The docs do not mention HTTPS or localhost. — [Business Login for Instagram](https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/business-login.md)
- **Meta HTTPS enforcement.**
  - Meta's 2018 announcement said HTTP may still be used with "localhost" only while the app is in development mode. — [Meta blog: Enforce HTTPS for Facebook Login](https://developers.facebook.com/blog/post/2018/06/08/enforce-https-facebook-login/)
  - Community answers quote Meta saying http://localhost redirects are "automatically allowed while in development mode only". — [Stack Overflow archive](https://kiwix.lema.org/stackoverflow.com_en_all_2023-11/questions/61263234/how-to-disable-enforce-https-for-facebook-auth-at-localhost)
  - Others report HTTPS was needed even for localhost, using ngrok or a local cert. — [next-auth Instagram provider docs](https://next-auth.js.org/providers/instagram); [Stack Overflow archive (Basic Display era)](https://kiwix.lema.org/stackoverflow.com_en_all_2023-11/questions/67777861/testing-instagram-basic-api-locally)
  - Conflicting evidence; both apply to Facebook Login and the now-retired Basic Display API, not to Instagram Login.
- **Instagram tokens.**
  - Authorization code: 1 hour, single use.
  - Short-lived token: exchanged server-side for a 60-day long-lived token via `GET graph.instagram.com/access_token?grant_type=ig_exchange_token`.
  - Refresh: via `GET graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token`. Only possible when the token is at least 24 hours old, not yet expired, and was granted `instagram_business_basic`.
  - "A token not refreshed within 60 days expires and cannot be refreshed."
  - Source: [Business Login for Instagram](https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/business-login.md)
- **Meta Platform Terms on tokens:** protect user IDs, access tokens and secret keys (§6.a.iv). — [Meta Platform Terms](https://developers.facebook.com/terms/)
- **Postiz's self-host model (bring your own app).**
  - For most platforms, "you register an app on that platform's developer portal and set the resulting keys as environment variables".
  - Redirect format is `{FRONTEND_URL}/integrations/social/{provider}`.
  - Instagram via Facebook Business uses the Facebook app keys. Instagram Standalone has its own keys.
  - Lesson: unconfigured providers still appear in the UI and fail without a clear error.
  - Source: [Postiz providers overview](https://docs.postiz.com/self-host/providers/overview.md)
- **Postiz README:** self-hosters must go through each platform's approval themselves; Meta, YouTube and TikTok "can take weeks". — via search summary of the [Postiz repo](https://github.com/gitroomhq/postiz-app). The exact quote is unverified.
- **Redirect issues are common:**
  - Postiz issue #1155 reports a redirect problem with Instagram Standalone setup. — [Postiz issue #1155](https://github.com/gitroomhq/postiz-app/issues/1155)
  - Postiz YouTube setup docs advise adding your Google account as a test user. — [Postiz YouTube provider](https://docs.postiz.com/providers/youtube)

### Inferences
- **Recommended Google setup.** Have the user create a "Web application" OAuth client (needed if FastAPI serves the callback at a fixed port, e.g. `http://localhost:8000/oauth/google/callback`) or a "Desktop app" client (loopback on a random port, PKCE). Either works for a local FastAPI server. Desktop type avoids needing a confidential secret. Web type matches a fixed FastAPI route more simply.
  - Uncertain: whether Web-type clients still accept `http://localhost` redirects in late 2026. Historically they did; this was not re-fetched.
- **Recommended Meta setup.** Register `https://localhost:<port>/oauth/instagram/callback` and serve FastAPI over HTTPS locally with mkcert or uvicorn `--ssl-keyfile`, or document an ngrok/Cloudflare Tunnel option. First try `http://localhost`, which may be accepted while the app is in Development mode.
- **Token storage.** Encrypt refresh and long-lived tokens in Postgres using a key stored outside the DB, for example with Fernet from the Python `cryptography` package and a key in env, the OS keyring or a file with restricted permissions. Store `expires_at`, `scopes` and `last_verified_at` (for YouTube's 30-day re-verification rule). This is standard practice; no single source in this session prescribes it.
- **Refresh schedule.**
  - Instagram: refresh the long-lived token on every sync once it is more than 24 hours old, or at least weekly. Alert the user well before day 60.
  - Google: the client library refreshes access tokens automatically. A daily sync keeps the refresh token from going unused for 6 months. Alert on an `invalid_grant` error, which usually means revocation or Testing-mode expiry.
  - The app should create only one refresh token per connection, to avoid hitting the 100-token limit through repeated re-consent.

### Gaps
- No current (2025–2026) official Meta statement was found on `http://localhost` redirect URIs for Instagram API with Instagram Login specifically.
- Not re-verified whether Google Web-application OAuth clients still accept `http://localhost` redirect URIs.

## B2. Python libraries: Google client libraries vs httpx; Instagram Graph SDK vs httpx

### Takeaway
google-api-python-client is "complete and in maintenance mode". It is synchronous and works for YouTube Data and Analytics, but it fits poorly in an async FastAPI app; it would need `run_in_threadpool`. A practical stack uses google-auth-oauthlib / google-auth for the OAuth flow and token refresh, plus plain `httpx.AsyncClient` against the small set of REST endpoints (`youtubeanalytics.googleapis.com/v2/reports`, `youtube/v3/...`). For Instagram, plain httpx against `graph.instagram.com` is simplest. No maintained Instagram-specific Python SDK for Instagram Login was confirmed.

### Cited Findings
- google-api-python-client's README says: "This library is considered complete and is in maintenance mode." It recommends Cloud Client Libraries for new development. The README does not mention asyncio. — [google-api-python-client on GitHub](https://github.com/googleapis/google-api-python-client)
- Desktop-app OAuth with PKCE and a loopback listener is the documented Google flow. — [Google OAuth for installed apps](https://developers.google.com/identity/protocols/oauth2/native-app)
- The Instagram Login API uses the `graph.instagram.com` host with Instagram User access tokens. — [Instagram Insights docs](https://developers.facebook.com/documentation/instagram-platform/insights.md)
- Meta's automated-data terms say allowable requests can only go to `graph.facebook.com`. The Instagram Login product uses `graph.instagram.com`, which Meta's own Instagram docs direct developers to. — [Meta Automated Data Collection Terms](https://developers.facebook.com/documentation/development/terms-and-policies/automated-data-collection.md); [Instagram Insights docs](https://developers.facebook.com/documentation/instagram-platform/insights.md)

### Inferences
- There is no Google Cloud Client Library (the "recommended" family) for YouTube. YouTube is only covered by the discovery-based google-api-python-client, so "maintenance mode" here does not imply a better official alternative.
- The facebook-business SDK (facebook-python-business-sdk) targets the Marketing API on graph.facebook.com and is synchronous. For a few Instagram insights endpoints, httpx with typed pydantic models is lighter and async-native. This is not verified against the SDK's current docs.

### Gaps
- The current state of facebook-python-business-sdk (maintenance, Instagram Login support) was not checked.
- Async alternatives such as `aiogoogle` were not checked.
- Whether google-auth offers async credential refresh (`google.auth.aio` / `google-auth[aiohttp]`) was not checked.

## B3. Scheduling inside a local single-user app: APScheduler in the lifespan vs an OS scheduler calling a CLI; incremental sync, backfill, rate limits

### Takeaway
No authoritative source was gathered in this session that settles this question. The recommendations below come from the platform constraints found above (Instagram's 90-day window, YouTube's 30-day refresh and re-verification, Instagram's 60-day token expiry) and from general engineering practice. They are labeled as inferences.

### Cited Findings
- Instagram account-level user metrics are kept only 90 days, so the sync must run at least every few weeks or data is lost. — [Instagram Insights docs](https://developers.facebook.com/documentation/instagram-platform/insights.md)
- YouTube non-analytics Authorized Data must be refreshed or deleted every 30 days. Analytics data needs authorization re-verification every 30 days. — [YouTube Developer Policies](https://developers.google.com/youtube/terms/developer-policies)
- Instagram long-lived tokens die permanently if they are not refreshed within 60 days. — [Business Login for Instagram](https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/business-login.md)
- Quota circumvention is prohibited by the YouTube API ToS §15, so rate-limit handling must back off rather than rotate keys or projects. — [YouTube API Services ToS](https://developers.google.com/youtube/terms/api-services-terms-of-service)

### Inferences
- **Scheduler choice.** A local app on a laptop is often not running at sync time.
  - **OS scheduler calling a CLI** (`python -m app sync`): cron/systemd timer, or Windows Task Scheduler with "run task as soon as possible after a scheduled start is missed".
    - Pro: survives app restarts and catches up after sleep.
    - Con: platform-specific setup.
  - **APScheduler in the FastAPI lifespan.**
    - Pro: zero setup.
    - Con: runs only while the server is up, and needs a persistent job store or catch-up logic (`misfire_grace_time`, `coalesce=True`). With multiple uvicorn workers it can run jobs twice.
  - **Suggested approach:** make the sync an idempotent CLI command and run it from both places. The app's lifespan runs a "catch-up if last successful sync > N hours" check on startup and on an interval, and docs offer an optional OS-scheduler recipe. A Postgres advisory lock prevents concurrent runs.
- **Idempotent incremental sync.**
  - Upsert by natural keys (`platform, account_id, metric, date` / `media_id, metric, captured_at`) using `INSERT ... ON CONFLICT DO UPDATE`.
  - Keep a per-source `sync_state` (last complete date) and always re-pull a trailing window of about 3–7 days, because YouTube Analytics data lags and is revised. Uncertain: the exact YouTube Analytics data-latency window was not cited in this session.
- **Backfill on first connect.**
  - YouTube Analytics accepts arbitrary date ranges, so backfill by month chunks from the channel creation date.
  - Instagram account-level metrics can only be backfilled about 90 days. Media-level lifetime insights can be pulled for existing media.
  - Users should be told that pre-connection Instagram history is mostly unrecoverable via API.
- **Rate-limit errors.**
  - Use exponential backoff with jitter on HTTP 429 and 5xx, and on YouTube 403 errors with reasons such as `quotaExceeded` or `rateLimitExceeded`. On `quotaExceeded`, stop for the day instead of retrying.
  - For Meta, honor any `X-App-Usage` / `X-Business-Use-Case-Usage` headers if present. Unverified for graph.instagram.com.
  - `tenacity` or a small custom retry around httpx are both reasonable.

### Gaps
- No primary sources on APScheduler 4.x status and FastAPI lifespan integration were fetched (APScheduler 4 had been in pre-release for a long time; current status unverified).
- YouTube Analytics data latency and its exact quota cost per `reports.query` call were not cited.
- Instagram Platform rate-limit formula and headers were not cited.

## B4. Existing open-source projects and lessons

### Takeaway
The most mature self-hosted comparator is Postiz, a scheduler with analytics. It uses the bring-your-own-developer-app pattern with env-var credentials and a fixed redirect path per provider. Its documented pain points are platform approval delays, Meta redirect mismatches, and silent failures for unconfigured providers. Some smaller analytics-archiving projects exist (andromeda, RPSync), but their activity and design were not verified. No widely used, maintained Python project for a personal YouTube + Instagram analytics archive was found.

### Cited Findings
- **Postiz:**
  - BYO apps via env vars, one redirect pattern `{FRONTEND_URL}/integrations/social/{provider}`.
  - Instagram via the Facebook Business app vs Instagram Standalone with separate keys.
  - Unconfigured providers fail without a clear error.
  - Source: [Postiz providers overview](https://docs.postiz.com/self-host/providers/overview.md); repo: [gitroomhq/postiz-app](https://github.com/gitroomhq/postiz-app)
- **Postiz YouTube setup:** YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET, enable YouTube Data API v3, add your account as a test user. — [Postiz YouTube provider docs](https://docs.postiz.com/providers/youtube)
- **Postiz issue #1155:** Instagram Standalone redirect returns to the instance but the channel is never added. — [GitHub issue](https://github.com/gitroomhq/postiz-app/issues/1155)
- **Chatwoot:** its self-hosted Instagram Business Login uses a `/instagram/callback` path on the instance's own domain and says to set the app to "Live" to receive webhooks. — [Chatwoot docs](https://developers.chatwoot.com/self-hosted/configuration/features/integrations/instagram-via-instagram-business-login)
- **jellyfish-insights/andromeda:** collects YouTube, Google Ads, Facebook and Instagram analytics "into a single data lake database". — [GitHub](https://github.com/jellyfish-insights/andromeda). Activity, language and license were not verified.
- **fluffyriot/rpsync:** "open-source, self-hosted social media analytics application" using Postgres. — [GitHub](https://github.com/fluffyriot/rpsync); [itechguides](https://www.itechguides.com/products/rpsync/). Its language was reportedly Go; not verified.
- **jakim/ig-monitoring:** self-hosted Instagram analytics, now archived. — [GitHub](https://github.com/jakim/ig-monitoring)
- **Mixpost:** a self-hosted Laravel social media manager. Its Meta setup docs were not found in search. — [madewithvuejs listing](https://madewithvuejs.com/go/mixpost)

### Inferences
- Lessons to adopt:
  1. Ship a step-by-step "create your Google Cloud project / Meta app" guide with screenshots and exact redirect URIs.
  2. Have a startup check that reports which providers are configured, instead of failing silently.
  3. Document the Google "In production" switch to avoid 7-day token expiry, and the Meta Standard Access / own-account role setup to avoid App Review.
  4. Ship a template privacy policy and deletion-instructions page that self-hosters can publish (e.g. on GitHub Pages), since both Google and Meta require URLs.

### Gaps
- No post-mortems or blog write-ups from these projects about Meta or YouTube policy enforcement were found.
- Socioboard was not investigated.
- Mixpost's Meta/YouTube setup docs were not located.

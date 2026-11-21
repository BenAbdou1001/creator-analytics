# Instagram API endpoints and metrics

Live reference for the Instagram Graph API as reached by this project's token, compared with the Instagram rows of the
`metric_definitions` catalogue.

- **Captured:** 2026-11-21, against `https://graph.facebook.com/v27.0/17841473455783127` (@abdou_scope).
- **Token:** system-user token from the "Content Creation" app, permissions `instagram_basic` and
  `instagram_manage_insights`. Stored in `backend/.env` and redacted everywhere below.
- **Sample window:** the 7 days up to 2026-11-21 (`since=1794610800`, `until=1795215600`).
- **Response bodies** are real. Long `description` strings are shortened with `…`, and `paging` URLs are replaced
  with `<paging url>`. Meta returns `title` and `description` in the account's language (French here).
- **Not testable yet:** the account has 0 posts, so the per-post endpoints (section 3) come from Meta's docs and have
  not been called live.

---

## 1. Summary: catalogue vs API

Status key:
- ✅ works live
- ⚠️ works, but empty until the account has 100+ followers
- 🕓 per-post, documented but untested because there are no posts
- ❌ not available

### Account scope (9 catalogue rows)

| Catalogue `metric_key` | Catalogue label | API source | Status |
|---|---|---|---|
| `views` | Views | `/insights?metric=views&metric_type=total_value` | ✅ |
| `accounts_reached` | Viewers / Accounts reached | `/insights?metric=reach` (time_series or total_value) | ✅ |
| `interactions` | Interactions | `/insights?metric=total_interactions&metric_type=total_value` | ✅ |
| `accounts_engaged` | Accounts engaged | `/insights?metric=accounts_engaged&metric_type=total_value` | ✅ |
| `total_followers` | Total followers | profile field `followers_count` (snapshot) | ✅ |
| `follows` | Follows | `/insights?metric=follows_and_unfollows&breakdown=follow_type` | ⚠️ |
| `unfollows` | Unfollows | same call, other breakdown value | ⚠️ |
| `profile_visits` | Profile visits | `/insights?metric=profile_views&metric_type=total_value` | ✅ * |
| `link_taps` | External link taps | `/insights?metric=website_clicks&metric_type=total_value` | ✅ * |

\* Meta's changelog lists `profile_views` and `website_clicks` as deprecated since January 2025, but both still return
data with `metric_type=total_value` and appear in the API's own list of valid metrics. They should be treated as
something that may disappear without notice.

### Content scope (15 catalogue rows), from `/{ig-media-id}/insights`

| Catalogue `metric_key` | Catalogue label | API metric | Status |
|---|---|---|---|
| `views` | Views | `views` | 🕓 |
| `accounts_reached` | Viewers | `reach` | 🕓 |
| `likes` | Likes | `likes` (or field `like_count`) | 🕓 |
| `comments` | Comments | `comments` (or field `comments_count`) | 🕓 |
| `shares` | Shares | `shares` | 🕓 |
| `saves` | Saves | **`saved`** (name differs) | 🕓 |
| `reposts` | Reposts | `reposts` | 🕓 |
| `watch_time_sec` | Watch time | `ig_reels_video_view_total_time` (Reels; docs give **milliseconds**, check ÷1000) | 🕓 |
| `avg_watch_time_sec` | Average watch time | `ig_reels_avg_watch_time` (Reels; **milliseconds**) | 🕓 |
| `skip_rate` | Skip rate | `reels_skip_rate` (Reels, added Dec 2025) | 🕓 |
| `follows` | Follows | `follows` (posts and Stories only, **not Reels**) | 🕓 |
| `story_exits` | Exits | `navigation`, breakdown `story_navigation_action_type` = `tap_exit` | 🕓 |
| `story_forward` | Forward taps | `navigation` → `tap_forward` | 🕓 |
| `story_back` | Back taps | `navigation` → `tap_back` | 🕓 |
| `story_replies` | Replies | `replies` (returns 0 for viewers in Europe/Japan) | 🕓 |

### Audience scope (1 catalogue row)

| Catalogue `metric_key` | API | Status |
|---|---|---|
| `demographics_min_reach` | Not a metric. It records the 100-follower threshold that the demographic calls enforce (they return `{"data":[]}` below it). | n/a |

### Result

| | Count |
|---|---|
| Catalogue Instagram rows | 25 |
| Available from the API | 24 (all except the threshold row) |
| Working live today | 7 of 9 account rows |
| Waiting on 100 followers | 2 (follows, unfollows) |
| Waiting on a first post | 15 content rows |

### Catalogue fixes the API reveals

1. **Story retention.** The four `story_*` rows have `retention_days = 730`, but Story insights disappear 24 hours
   after the Story expires. The value should be 1.
2. **Reels watch time units.** The API documents milliseconds. The connector must convert to seconds for
   `watch_time_sec` and `avg_watch_time_sec`.
3. **Account `views` description.** "Plays/displays incl. repeats" is right. The API also splits it by
   `media_product_type`.

### API data the catalogue does not have yet

| API metric or field | What it gives | Worth adding? |
|---|---|---|
| Account `likes`, `comments`, `saves`, `shares`, `reposts`, `replies` | Daily account-level counts of each interaction type (the catalogue only has the combined `interactions`) | Yes |
| `reach` with `breakdown=follow_type` | Followers vs non-followers reached | Yes (`breakdown_facts`) |
| `reach` or `views` with `breakdown=media_product_type` | Split across POST, REEL, STORY, … | Yes (`breakdown_facts`) |
| `profile_links_taps` | Taps on contact buttons (call, email, directions, book). Not the bio link. | Optional |
| `follower_demographics`, `engaged_audience_demographics`, `reached_audience_demographics` | Age, gender, country, city. Only `this_week` and `this_month` timeframes, top 45 values. | Yes, once the account has 100+ followers |
| `online_followers` | Followers online by hour (last 30 days) | Optional |
| Profile `follows_count`, `media_count` | Accounts followed, number of posts | Optional |
| Per-post `profile_visits`, `profile_activity` (incl. `BIO_LINK_CLICKED`) | Profile visits and bio-link taps caused by one post | Yes |
| Per-Reel `crossposted_views`, `facebook_views` | Views of the same Reel on Facebook | Optional |
| Story `navigation` → `swipe_forward`, `link_clicks`, `follows`, `profile_visits` | Extra Story actions | Optional |

---

## 2. Account endpoints (tested live)

### 2.1 Profile: `GET /{ig-user-id}?fields=…`

Fields: `id, username, name, biography, website, profile_picture_url, followers_count, follows_count, media_count`.

```json
HTTP 200
{
  "id": "17841473455783127",
  "username": "abdou_scope",
  "name": "Abdallah Benassloune",
  "biography": "A Price is always exacted for what fate bestows ⏳\nToo curious to stick to one thing.",
  "website": "https://abdallahbenassloundev.netlify.app",
  "profile_picture_url": "https://scontent.fqfd1-2.fna.fbcdn.net/v/…(signed CDN URL, expires)…",
  "followers_count": 16,
  "follows_count": 1,
  "media_count": 0
}
```

Maps to `total_followers` (store as a daily `point_in_time` snapshot). The picture URL is signed and expires, so
don't store it as a permanent link.

### 2.2 Posts and Reels: `GET /{ig-user-id}/media`

Fields: `id, caption, media_type, media_product_type, timestamp, permalink, like_count, comments_count`. Paged with
`paging.cursors.after`.

```json
HTTP 200
{ "data": [] }
```

Empty because the account has no posts. With posts, each item looks like the `business_discovery` sample in 2.5.
`media_type` is `IMAGE`, `VIDEO` or `CAROUSEL_ALBUM`. `media_product_type` is `FEED`, `REELS`, `STORY` or `AD`.

The connector would use this to upsert `content_items`:

| API field | Column |
|---|---|
| `id` | `external_id` |
| `caption` | caption |
| `timestamp` | published time |
| `permalink` | url |
| `media_product_type` / `media_type` | `content_type` (`reel`, `image_post`, `carousel`, `story`) |

### 2.3 Stories: `GET /{ig-user-id}/stories`

Only Stories that are live right now (the last 24 hours).

```json
HTTP 200
{ "data": [] }
```

### 2.4 Live videos: `GET /{ig-user-id}/live_media`

```json
HTTP 200
{ "data": [] }
```

### 2.5 Other public accounts: `GET /{ig-user-id}?fields=business_discovery.username(NAME){…}`

Public numbers of any other Business or Creator account. It returns no insights, only public counters. The sample
uses `@instagram`:

```json
HTTP 200
{
  "id": "17841473455783127",
  "business_discovery": {
    "id": "17841400039600391",
    "username": "instagram",
    "followers_count": 686208221,
    "follows_count": 178,
    "media_count": 8656,
    "media": {
      "data": [
        {
          "id": "18121703761973833",
          "media_type": "CAROUSEL_ALBUM",
          "media_product_type": "FEED",
          "timestamp": "2026-11-20T20:06:11+0000",
          "like_count": 133735,
          "comments_count": 1196
        }
      ],
      "paging": { "cursors": { "after": "QVFIVEFs…" } }
    }
  }
}
```

### 2.6 Posts you're tagged in: `GET /{ig-user-id}/tags` (not allowed)

```json
HTTP 400
{
  "error": {
    "message": "(#10) Application does not have permission for this action",
    "code": 10,
    "type": "OAuthException"
  }
}
```

This needs another permission. It isn't required for the catalogue.

---

## 3. Account insights: `GET /{ig-user-id}/insights`

### How the call works

| Parameter | Values |
|---|---|
| `metric` | Comma-separated list (see the valid list below) |
| `period` | `day` for activity metrics, `lifetime` for demographics and `online_followers` |
| `metric_type` | `total_value`: one number for the whole range. `time_series`: one value per day, **only accepted for `reach`** (and `follower_count`). |
| `since`, `until` | Unix timestamps. Without them the API returns the last day. Days end at `08:00 UTC` (midnight Pacific). History goes back about 90 days. |
| `breakdown` | `media_product_type`, `follow_type`, `contact_button_type`, `age`, `gender`, `country`, `city` (it depends on the metric) |
| `timeframe` | Demographics only: `this_week` or `this_month` |

**Day windows (verified live).** Each day is bucketed in Pacific time and identified by the moment it ends, its
`end_time`: the next midnight in America/Los_Angeles, which is `08:00Z` in winter and `07:00Z` in summer. A query
returns the sum of every day whose `end_time` falls in `[since, until]`, with **both ends inclusive**.

- **One day:** pass `since = until = end_time of that day`. For example, `since=until=2026-11-17T08:00Z` returned
  reach 14, views 216 and likes 5. That matches the `reach` time series value labelled `end_time 2026-11-17T08:00Z`.
- **A plain 24-hour window double counts.** `since = D 08:00Z, until = D+1 08:00Z` covers two days.
- **Non-boundary timestamps fail.** Any timestamp that isn't a day boundary returns HTTP 400.
- **Checked:** for `views`, `likes` and `profile_views`, seven single-day calls add up to the 7-day call.

To get a daily series for metrics that only accept `total_value`, the sync makes one call per day using this rule.

**Valid account metrics**, as listed by the API itself in its error message:

> reach, follower_count, website_clicks, profile_views, online_followers, accounts_engaged, total_interactions,
> likes, comments, shares, saves, replies, engaged_audience_demographics, reached_audience_demographics,
> follower_demographics, follows_and_unfollows, profile_links_taps, views, threads_likes, threads_replies, reposts,
> quotes, threads_followers, threads_follower_demographics, content_views, threads_views, threads_clicks,
> threads_reposts

The `threads_*` and `quotes` metrics belong to Threads. They reject `total_value` and need Threads permissions.

### 3.1 `reach`, daily time series (catalogue `accounts_reached`)

`?metric=reach&period=day&since=…&until=…`

```json
HTTP 200
{
  "data": [
    {
      "id": "17841473455783127/insights/reach/day",
      "name": "reach",
      "period": "day",
      "values": [
        { "value": 0,  "end_time": "2026-11-14T08:00:00+0000" },
        { "value": 0,  "end_time": "2026-11-15T08:00:00+0000" },
        { "value": 0,  "end_time": "2026-11-16T08:00:00+0000" },
        { "value": 14, "end_time": "2026-11-17T08:00:00+0000" },
        { "value": 1,  "end_time": "2026-11-18T08:00:00+0000" },
        { "value": 0,  "end_time": "2026-11-19T08:00:00+0000" },
        { "value": 0,  "end_time": "2026-11-20T08:00:00+0000" }
      ],
      "title": "Couverture",
      "description": "Nombre total de vues uniques des médias du compte professionnel"
    }
  ],
  "paging": { "previous": "<paging url>", "next": "<paging url>" }
}
```

### 3.2 `reach` total, split by content type

`?metric=reach&period=day&metric_type=total_value&breakdown=media_product_type`

```json
HTTP 200
{
  "data": [
    {
      "name": "reach",
      "period": "day",
      "title": "Comptes touchés",
      "description": "Le nombre de comptes uniques qui ont vu votre contenu au moins une fois, y compris dans les publicités. …",
      "total_value": {
        "value": 15,
        "breakdowns": [
          {
            "dimension_keys": ["media_product_type"],
            "results": [ { "dimension_values": ["STORY"], "value": 15 } ]
          }
        ]
      }
    }
  ]
}
```

The 7-day total (15) is **not** the sum of the daily values (0+0+0+14+1+0+0 = 15 here, but in general it isn't).
Reach counts unique accounts, so it can't be added up across days.

### 3.3 `reach` total, followers vs non-followers

`?metric=reach&period=day&metric_type=total_value&breakdown=follow_type`

```json
HTTP 200
{
  "data": [
    {
      "name": "reach",
      "total_value": {
        "value": 15,
        "breakdowns": [
          {
            "dimension_keys": ["follow_type"],
            "results": [
              { "dimension_values": ["NON_FOLLOWER"], "value": 2 },
              { "dimension_values": ["FOLLOWER"], "value": 13 }
            ]
          }
        ]
      }
    }
  ]
}
```

### 3.4 `views` (catalogue `views`)

`?metric=views&period=day&metric_type=total_value`

```json
HTTP 200
{
  "data": [
    {
      "id": "17841473455783127/insights/views/day",
      "name": "views",
      "period": "day",
      "title": "Vues",
      "description": "Le nombre de fois où votre contenu a été lu ou affiché. Le contenu comprend les reels, publications et stories.",
      "total_value": { "value": 1196 }
    }
  ]
}
```

With `breakdown=media_product_type`, the result splits the same total (the response was truncated in capture):

```json
"total_value": {
  "value": 1196,
  "breakdowns": [ { "dimension_keys": ["media_product_type"],
                    "results": [ { "dimension_values": ["POST"], "value": 1173 },
                                 { "dimension_values": ["STORY"], "value": … } ] } ]
}
```

Errors from the same metric:
- `views` with `metric_type=time_series` is rejected: `(#100) The following metrics (views) should be specified with parameter metric_type=total_value`.
- `breakdown=follower_type` (named in older docs) is rejected: `breakdown[0] must be one of the following values: country, city, age, gender, follow_type, media_product_type, contact_button_type`.

### 3.5 Engagement totals (catalogue `accounts_engaged`, `interactions`)

`?metric=accounts_engaged,total_interactions,likes,comments,saves,shares,reposts,replies&period=day&metric_type=total_value`

```json
HTTP 200
{
  "data": [
    { "name": "accounts_engaged",   "title": "Comptes ayant interagi",       "total_value": { "value": 12 } },
    { "name": "total_interactions", "title": "Interactions avec le contenu", "total_value": { "value": 14 } },
    { "name": "likes",              "title": "Mentions J’aime",              "total_value": { "value": 10 } },
    { "name": "comments",           "title": "Commentaires",                 "total_value": { "value": 0 } },
    { "name": "saves",              "title": "Enregistrements",              "total_value": { "value": 0 } },
    { "name": "shares",             "title": "Partages",                     "total_value": { "value": 2 } },
    { "name": "reposts",            "title": "Republications",               "total_value": { "value": 0 } },
    { "name": "replies",            "title": "Réponses",                     "total_value": { "value": 0 } }
  ]
}
```

Each item also has `id` (`…/insights/<metric>/day`), `period: "day"` and a `description`. Here
`total_interactions` (14) = likes 10 + shares 2 + other interactions.

### 3.6 `profile_views` (catalogue `profile_visits`)

`?metric=profile_views&period=day&metric_type=total_value`

```json
HTTP 200
{
  "data": [
    {
      "id": "17841473455783127/insights/profile_views/day",
      "name": "profile_views",
      "period": "day",
      "title": "Visites du profil",
      "description": "Le nombre de fois que votre profil a été consulté.",
      "total_value": { "value": 3 }
    }
  ]
}
```

Over the 7-day window the total was 41. With `time_series` the call is rejected with the same "should be specified
with parameter metric_type=total_value" error.

### 3.7 `website_clicks` (catalogue `link_taps`)

`?metric=website_clicks&period=day&metric_type=total_value`

```json
HTTP 200
{
  "data": [
    {
      "id": "17841473455783127/insights/website_clicks/day",
      "name": "website_clicks",
      "period": "day",
      "title": "Appuis (mobile) sur le lien vers le site web",
      "description": "Le nombre de clics (mobile) sur le lien vers votre site web.",
      "total_value": { "value": 1 }
    }
  ]
}
```

### 3.8 `profile_links_taps` (not in the catalogue)

`?metric=profile_links_taps&period=day&metric_type=total_value&breakdown=contact_button_type`

```json
HTTP 200
{
  "data": [
    {
      "name": "profile_links_taps",
      "title": "Appuis sur les liens du profil",
      "description": "Le nombre d’appuis sur l’adresse de votre entreprise, votre bouton Appeler, votre bouton Envoyer un e-mail et votre bouton Envoyer un texto.",
      "total_value": { "value": 0, "breakdowns": [ { "dimension_keys": ["contact_button_type"] } ] }
    }
  ]
}
```

This counts contact buttons only. It is **not** the same as `link_taps` (bio website link), which is 3.7.

### 3.9 `follows_and_unfollows` (catalogue `follows`, `unfollows`)

`?metric=follows_and_unfollows&period=day&metric_type=total_value&breakdown=follow_type`

```json
HTTP 200
{ "data": [], "paging": { "previous": "<paging url>", "next": "<paging url>" } }
```

It is empty below 100 followers. Above that, `total_value.breakdowns[0].results` holds `FOLLOWER` (new follows) and
`NON_FOLLOWER` (unfollows). Who followed or unfollowed is never returned.

### 3.10 Demographics (not in the catalogue yet)

```
?metric=follower_demographics&period=lifetime&metric_type=total_value&timeframe=this_month&breakdown=age,gender
?metric=engaged_audience_demographics&period=lifetime&metric_type=total_value&timeframe=this_month&breakdown=country
?metric=reached_audience_demographics&period=lifetime&metric_type=total_value&timeframe=this_month&breakdown=age
```

```json
HTTP 200
{ "data": [] }
```

All three return empty until the account has 100+ followers (the catalogue's `demographics_min_reach` row). Above
that, `results` lists the top 45 values of each dimension.

### 3.11 `online_followers` and `follower_count`

```
?metric=online_followers&period=lifetime
?metric=follower_count&period=day&since=…&until=…
```

```json
HTTP 200
{ "data": [], "paging": { "previous": "<paging url>", "next": "<paging url>" } }
```

Both return nothing below 100 followers. Use the profile's `followers_count` snapshot instead (2.1).

### 3.12 Other metrics in the valid list

| Call | Response |
|---|---|
| `metric=content_views&metric_type=total_value` | `200 {"data":[]}`. Undocumented, no data. |
| `metric=quotes&metric_type=total_value` | `400 (#100) The following metric (quotes) is incompatible with the metric type (total_value)` (Threads) |
| `metric=threads_views&metric_type=total_value` | `400`, same message (Threads) |

### 3.13 Removed metrics

`?metric=impressions&period=day`

```json
HTTP 400
{
  "error": {
    "message": "(#100) metric[0] must be one of the following values: reach, follower_count, website_clicks, profile_views, …",
    "code": 100,
    "type": "OAuthException"
  }
}
```

`impressions` and `plays` are gone. `views` replaces them.

---

## 4. Per-post insights: `GET /{ig-media-id}/insights` (from the docs, untested)

Example call: `?metric=views,reach,likes,comments,shares,saved,reposts,total_interactions,follows,profile_visits`.
The response has the same shape as section 3: one entry per metric, with the value in `values[0].value` (lifetime).

| Metric | Feed posts | Reels | Stories | Catalogue key |
|---|---|---|---|---|
| `views` | ✓ | ✓ | ✓ | `views` |
| `reach` | ✓ | ✓ | ✓ | `accounts_reached` |
| `likes` | ✓ | ✓ | | `likes` |
| `comments` | ✓ | ✓ | | `comments` |
| `shares` | ✓ | ✓ | ✓ | `shares` |
| `saved` | ✓ | ✓ | | `saves` |
| `reposts` | ✓ | ✓ | | `reposts` |
| `total_interactions` | ✓ | ✓ | ✓ | (not in catalogue per post) |
| `follows` | ✓ | | ✓ | `follows` |
| `profile_visits` | ✓ | | ✓ | (not in catalogue) |
| `profile_activity` (breakdown `action_type`, incl. `BIO_LINK_CLICKED`) | ✓ | | ✓ | (not in catalogue) |
| `ig_reels_video_view_total_time` | | ✓ | | `watch_time_sec` (ms → s) |
| `ig_reels_avg_watch_time` | | ✓ | | `avg_watch_time_sec` (ms → s) |
| `reels_skip_rate` | | ✓ | | `skip_rate` |
| `crossposted_views`, `facebook_views` | | ✓ | | (not in catalogue) |
| `navigation` (breakdown `story_navigation_action_type`: `tap_forward`, `tap_back`, `tap_exit`, `swipe_forward`) | | | ✓ | `story_forward`, `story_back`, `story_exits` |
| `replies` | | | ✓ | `story_replies` |
| `link_clicks` | | | ✓ | (not in catalogue) |

Limits:
- Posts and Reels keep insights for about 2 years.
- Stories keep insights for **24 hours** only, so they need polling every few hours while a Story is live.
- Stories with fewer than 5 viewers return error code 10.
- Items inside a carousel have no insights of their own (`/{media-id}/children` only lists them).

---

## 5. What this means for the connector

1. **Daily account sync.** For each day, call 3.4–3.7 with a one-day window, plus `reach` as a time series and the
   profile snapshot. Write to `account_metric_facts` under the catalogue keys from section 1:

   | API metric | Catalogue key |
   |---|---|
   | `reach` | `accounts_reached` |
   | `total_interactions` | `interactions` |
   | `profile_views` | `profile_visits` |
   | `website_clicks` | `link_taps` |
   | `followers_count` | `total_followers` |

2. **Breakdowns.** Store the follower/non-follower and content-type splits in `breakdown_facts`.
3. **Per-post sync.** List `/media`, upsert `content_items`, then pull `/{media-id}/insights` as lifetime snapshots.
   Watch for the renames: `saved` → `saves`, and milliseconds → seconds for Reels watch time.
4. **Stories.** Poll `/stories` every 4–6 hours and capture their insights before they expire.
5. **Above 100 followers.** Follows/unfollows and demographics start returning data with no code change.

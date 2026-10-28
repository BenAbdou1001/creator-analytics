-- =====================================================================
-- Creator Analytics Data Model (PostgreSQL 14+)
-- Covers: YouTube Studio, TikTok Studio, Instagram Insights / Meta Business
-- Suite, LinkedIn personal-profile analytics (GUI-visible data only).
--
-- Design principles
--  1. One generic model for all platforms; platform-specific labels live in
--     metric_definitions (data), not in columns.
--  2. Metrics are stored long/narrow (fact tables) so new dashboard metrics
--     need an INSERT, not an ALTER TABLE.
--  3. Every fact carries captured_at + batch_id. Dashboards expire data
--     (IG 90d, LinkedIn 180/730/1000d, ...), so you keep your own snapshots.
--  4. Data enters through GUI exports / manual capture / takeout files,
--     so import_batches records provenance of every row.
--  5. Aggregate audience analytics are separated from identifiable people.
-- =====================================================================

CREATE SCHEMA IF NOT EXISTS creator;
SET search_path = creator, public;

-- ---------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------
CREATE TYPE platform_t AS ENUM ('youtube','tiktok','instagram','linkedin');

CREATE TYPE account_type_t AS ENUM (
  'channel',            -- YouTube channel
  'personal',           -- TikTok general / Instagram personal / LinkedIn member
  'creator','business', -- Instagram/TikTok professional types
  'company_page'        -- out of scope, kept to avoid mixing it with personal
);

CREATE TYPE content_type_t AS ENUM (
  'video','short','reel','story','image_post','carousel','text_post',
  'article','newsletter','newsletter_edition','live','live_recording',
  'repost','clip','playlist','poll','document','community_post'
);

CREATE TYPE visibility_t AS ENUM (
  'public','unlisted','private','connections_only','followers_only',
  'group_only','scheduled','draft','archived','removed','unknown'
);

CREATE TYPE metric_scope_t AS ENUM ('account','content','audience','live','revenue');

CREATE TYPE value_semantics_t AS ENUM (
  'period',       -- value for a selected date range
  'lifetime',     -- cumulative total
  'point_in_time',-- e.g. realtime / current follower count
  'rate'          -- percentage / ratio
);

CREATE TYPE period_kind_t AS ENUM (
  'lifetime','day','week','month','year','range','first_24h','realtime','snapshot'
);

CREATE TYPE verification_t AS ENUM ('verified_official','secondary_only','unverified');

CREATE TYPE dimension_t AS ENUM (
  -- demographics
  'age_range','gender','country','region','city','language',
  -- activity
  'hour_of_day','day_of_week',
  -- traffic / discovery
  'traffic_source','search_term','external_source','suggested_video','discovery_surface',
  -- viewer type
  'viewer_type','follower_status','subscription_status','device',
  -- professional (LinkedIn)
  'job_title','industry','seniority','company','company_size',
  -- misc
  'revenue_source','engagement_kind','audience_also_follows','audience_also_watches','keyword'
);

CREATE TYPE relation_t AS ENUM ('follower','following','subscriber','connection','blocked','close_friend');

CREATE TYPE comment_status_t AS ENUM (
  'published','held_for_review','filtered_spam','filtered_keyword',
  'hidden','removed_by_owner','deleted_observed'
);

CREATE TYPE interaction_t AS ENUM (
  'reaction','repost','mention','tag','story_view','post_view',
  'profile_view','share','save','send','collab_invite'
);

CREATE TYPE source_kind_t AS ENUM (
  'gui_manual','csv_export','xlsx_export','sheets_export',
  'takeout_archive','screenshot','copy_paste'
);

-- ---------------------------------------------------------------------
-- 1. ACCOUNTS
-- ---------------------------------------------------------------------
CREATE TABLE accounts (
  account_id       bigserial PRIMARY KEY,
  platform         platform_t      NOT NULL,
  account_type     account_type_t  NOT NULL,
  external_id      text,                      -- channel id, member urn, etc.
  handle           text            NOT NULL,
  display_name     text,
  profile_url      text,
  is_monetized     boolean         NOT NULL DEFAULT false, -- YPP, Creator Rewards, etc.
  is_public        boolean         NOT NULL DEFAULT true,  -- private IG gets no insights
  premium_tier     text,                      -- LinkedIn Premium, Meta One plan...
  region           text,
  created_on       date,
  notes            text,
  UNIQUE (platform, handle)
);

CREATE TABLE account_profile_snapshots (
  snapshot_id      bigserial PRIMARY KEY,
  account_id       bigint NOT NULL REFERENCES accounts ON DELETE CASCADE,
  captured_at      timestamptz NOT NULL DEFAULT now(),
  bio              text,
  headline         text,
  links            jsonb,          -- website / contact links
  contact_email    text,
  follower_count   bigint,
  following_count  bigint,
  connection_count bigint,
  content_count    bigint,
  extra            jsonb           -- platform-specific profile fields
);
CREATE INDEX ON account_profile_snapshots (account_id, captured_at DESC);

-- ---------------------------------------------------------------------
-- 2. PROVENANCE: every import / manual capture
-- ---------------------------------------------------------------------
CREATE TABLE import_batches (
  batch_id      bigserial PRIMARY KEY,
  account_id    bigint REFERENCES accounts ON DELETE CASCADE,
  source_kind   source_kind_t NOT NULL,
  source_label  text NOT NULL,       -- e.g. 'YouTube Advanced Mode > Export current view'
  gui_path      text,                -- exact navigation path used
  file_name     text,
  file_sha256   text,
  range_start   date,
  range_end     date,
  row_count     integer,
  imported_at   timestamptz NOT NULL DEFAULT now(),
  notes         text
);

-- ---------------------------------------------------------------------
-- 3. METRIC CATALOGUE (the "dictionary" of everything the dashboards show)
-- ---------------------------------------------------------------------
CREATE TABLE metric_definitions (
  metric_id        serial PRIMARY KEY,
  platform         platform_t NOT NULL,
  scope            metric_scope_t NOT NULL,
  metric_key       text NOT NULL,             -- stable snake_case key
  label            text NOT NULL,             -- label exactly as shown in the GUI
  definition       text,
  unit             text NOT NULL DEFAULT 'count', -- count|seconds|hours|percent|ratio|currency
  semantics        value_semantics_t NOT NULL DEFAULT 'period',
  applies_to       content_type_t[],          -- NULL = account-level / all
  requires         text,                      -- eligibility (YPP, 100+ reached, Premium...)
  retention_days   integer,                   -- how long the dashboard keeps it (NULL = unlimited/unknown)
  gui_path         text,
  verification     verification_t NOT NULL DEFAULT 'verified_official',
  UNIQUE (platform, scope, metric_key)
);

-- ---------------------------------------------------------------------
-- 4. CONTENT
-- ---------------------------------------------------------------------
CREATE TABLE content_items (
  content_id        bigserial PRIMARY KEY,
  account_id        bigint NOT NULL REFERENCES accounts ON DELETE CASCADE,
  platform          platform_t NOT NULL,
  external_id       text NOT NULL,            -- video id / post urn / media id
  content_type      content_type_t NOT NULL,
  parent_content_id bigint REFERENCES content_items,  -- live -> recording, carousel item, repost -> original
  original_author   text,                     -- for reposts
  title             text,
  caption           text,                     -- description / caption / post text
  url               text,
  visibility        visibility_t NOT NULL DEFAULT 'unknown',
  status            text,                     -- processing, restricted, etc.
  restrictions      text,                     -- YouTube restrictions column
  published_at      timestamptz,
  scheduled_for     timestamptz,
  duration_seconds  numeric,
  thumbnail_url     text,
  language          text,
  is_collab         boolean NOT NULL DEFAULT false,
  first_seen_at     timestamptz NOT NULL DEFAULT now(),
  last_seen_at      timestamptz NOT NULL DEFAULT now(),
  deleted_observed_at timestamptz,
  extra             jsonb,
  UNIQUE (platform, external_id)
);
CREATE INDEX ON content_items (account_id, published_at DESC);
CREATE INDEX ON content_items (account_id, content_type);

CREATE TABLE content_tags (
  content_id  bigint NOT NULL REFERENCES content_items ON DELETE CASCADE,
  tag_type    text NOT NULL CHECK (tag_type IN ('hashtag','mention','collaborator','location','product')),
  value       text NOT NULL,
  person_id   bigint,                         -- FK added after people exists
  PRIMARY KEY (content_id, tag_type, value)
);

CREATE TABLE live_sessions (
  content_id        bigint PRIMARY KEY REFERENCES content_items ON DELETE CASCADE,
  started_at        timestamptz,
  ended_at          timestamptz,
  peak_concurrent   integer,
  avg_concurrent    numeric,
  has_recording     boolean
);

-- ---------------------------------------------------------------------
-- 5. METRIC FACTS
-- ---------------------------------------------------------------------
CREATE TABLE account_metric_facts (
  fact_id       bigserial PRIMARY KEY,
  account_id    bigint  NOT NULL REFERENCES accounts ON DELETE CASCADE,
  metric_id     integer NOT NULL REFERENCES metric_definitions,
  period_kind   period_kind_t NOT NULL,
  period_start  date NOT NULL,
  period_end    date NOT NULL,
  value         numeric NOT NULL,
  captured_at   timestamptz NOT NULL DEFAULT now(),
  batch_id      bigint REFERENCES import_batches,
  UNIQUE (account_id, metric_id, period_kind, period_start, period_end, captured_at)
);
CREATE INDEX ON account_metric_facts (account_id, metric_id, period_start);

CREATE TABLE content_metric_facts (
  fact_id       bigserial PRIMARY KEY,
  content_id    bigint  NOT NULL REFERENCES content_items ON DELETE CASCADE,
  metric_id     integer NOT NULL REFERENCES metric_definitions,
  period_kind   period_kind_t NOT NULL,
  period_start  date,                         -- NULL for lifetime/snapshot
  period_end    date,
  value         numeric NOT NULL,
  captured_at   timestamptz NOT NULL DEFAULT now(),
  batch_id      bigint REFERENCES import_batches
);
CREATE UNIQUE INDEX content_metric_facts_uq ON content_metric_facts
  (content_id, metric_id, period_kind,
   COALESCE(period_start,'0001-01-01'), COALESCE(period_end,'0001-01-01'), captured_at);
CREATE INDEX ON content_metric_facts (content_id, metric_id, captured_at DESC);

-- Audience, demographics, traffic sources, search terms, professional breakdowns.
-- content_id NULL => account-level breakdown.
CREATE TABLE breakdown_facts (
  fact_id         bigserial PRIMARY KEY,
  account_id      bigint NOT NULL REFERENCES accounts ON DELETE CASCADE,
  content_id      bigint REFERENCES content_items ON DELETE CASCADE,
  dimension       dimension_t NOT NULL,
  dimension_value text NOT NULL,               -- '25-34', 'DZ', 'YouTube search', 'data engineer'
  metric_id       integer NOT NULL REFERENCES metric_definitions,
  period_kind     period_kind_t NOT NULL DEFAULT 'range',
  period_start    date,
  period_end      date,
  value           numeric NOT NULL,            -- count, or percent (see metric unit)
  captured_at     timestamptz NOT NULL DEFAULT now(),
  batch_id        bigint REFERENCES import_batches
);
CREATE INDEX ON breakdown_facts (account_id, dimension, captured_at DESC);
CREATE INDEX ON breakdown_facts (content_id, dimension) WHERE content_id IS NOT NULL;

-- Per-video retention curves (YouTube, TikTok) and story navigation curves.
CREATE TABLE retention_curve_points (
  content_id     bigint NOT NULL REFERENCES content_items ON DELETE CASCADE,
  captured_at    timestamptz NOT NULL,
  position_pct   numeric NOT NULL CHECK (position_pct BETWEEN 0 AND 100),
  position_sec   numeric,
  audience_pct   numeric NOT NULL,             -- share still watching
  batch_id       bigint REFERENCES import_batches,
  PRIMARY KEY (content_id, captured_at, position_pct)
);

-- Revenue / monetization (YPP, TikTok rewards, IG earnings)
CREATE TABLE revenue_facts (
  fact_id       bigserial PRIMARY KEY,
  account_id    bigint NOT NULL REFERENCES accounts ON DELETE CASCADE,
  content_id    bigint REFERENCES content_items ON DELETE CASCADE,
  revenue_source text NOT NULL,                -- ads, memberships, gifts/Diamonds, rewards...
  metric_id     integer NOT NULL REFERENCES metric_definitions, -- revenue, rpm, cpm
  currency      char(3),
  period_kind   period_kind_t NOT NULL,
  period_start  date NOT NULL,
  period_end    date NOT NULL,
  value         numeric NOT NULL,
  is_estimated  boolean NOT NULL DEFAULT true,
  captured_at   timestamptz NOT NULL DEFAULT now(),
  batch_id      bigint REFERENCES import_batches
);

-- ---------------------------------------------------------------------
-- 6. PEOPLE (identifiable individuals only)
-- ---------------------------------------------------------------------
CREATE TABLE people (
  person_id     bigserial PRIMARY KEY,
  platform      platform_t NOT NULL,
  external_id    text,
  handle         text,
  display_name   text,
  headline       text,                         -- LinkedIn headline
  profile_url    text,
  email          text,                         -- LinkedIn connection export, only if shared
  is_verified    boolean,
  first_seen_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (platform, handle)
);

ALTER TABLE content_tags
  ADD CONSTRAINT content_tags_person_fk FOREIGN KEY (person_id) REFERENCES people;

-- Follower / subscriber / connection lists. The dashboards give no history,
-- so you observe it by snapshotting: first/last batch lets you infer unfollows.
CREATE TABLE relationships (
  relationship_id     bigserial PRIMARY KEY,
  account_id          bigint NOT NULL REFERENCES accounts ON DELETE CASCADE,
  person_id           bigint NOT NULL REFERENCES people,
  relation            relation_t NOT NULL,
  relation_since      date,                    -- LinkedIn connection date; YT only within 28 days
  first_batch_id      bigint REFERENCES import_batches,
  last_batch_id       bigint REFERENCES import_batches,
  first_observed_at   timestamptz NOT NULL DEFAULT now(),
  last_observed_at    timestamptz NOT NULL DEFAULT now(),
  ended_inferred_at   timestamptz,             -- set when a later full snapshot no longer lists them
  UNIQUE (account_id, person_id, relation)
);

-- ---------------------------------------------------------------------
-- 7. COMMENTS & INTERACTIONS
-- ---------------------------------------------------------------------
CREATE TABLE comments (
  comment_id          bigserial PRIMARY KEY,
  content_id          bigint NOT NULL REFERENCES content_items ON DELETE CASCADE,
  platform            platform_t NOT NULL,
  external_id         text NOT NULL,
  parent_comment_id   bigint REFERENCES comments,    -- threading
  author_person_id    bigint REFERENCES people,      -- NULL if author is you? use is_owner_comment
  is_owner_comment    boolean NOT NULL DEFAULT false,-- replies posted by your account
  body                text,
  posted_at           timestamptz,
  like_count          integer,
  reply_count         integer,
  is_pinned           boolean NOT NULL DEFAULT false,
  is_hearted          boolean NOT NULL DEFAULT false, -- YouTube heart by creator
  status              comment_status_t NOT NULL DEFAULT 'published',
  status_reason       text,                           -- 'spam', 'keyword:<x>', 'held 60d'
  held_expires_at     timestamptz,                    -- YouTube held comments (60 days)
  first_captured_at   timestamptz NOT NULL DEFAULT now(),
  last_captured_at    timestamptz NOT NULL DEFAULT now(),
  deleted_observed_at timestamptz,                    -- comment vanished between captures
  batch_id            bigint REFERENCES import_batches,
  UNIQUE (platform, external_id)
);
CREATE INDEX ON comments (content_id, posted_at);
CREATE INDEX ON comments (author_person_id);
CREATE INDEX ON comments (parent_comment_id);

-- Reactions lists, reposts lists, mentions, tags, mutual viewers etc.
CREATE TABLE interactions (
  interaction_id   bigserial PRIMARY KEY,
  account_id       bigint NOT NULL REFERENCES accounts ON DELETE CASCADE,
  content_id       bigint REFERENCES content_items ON DELETE CASCADE,
  person_id        bigint REFERENCES people,
  interaction_type interaction_t NOT NULL,
  detail           text,                       -- LinkedIn reaction kind, story reply text...
  occurred_at      timestamptz,
  visible_window_days integer,                 -- TikTok profile views 30, post views 7, IG story 2...
  captured_at      timestamptz NOT NULL DEFAULT now(),
  batch_id         bigint REFERENCES import_batches
);
CREATE INDEX ON interactions (account_id, interaction_type, occurred_at DESC);
CREATE INDEX ON interactions (content_id, interaction_type);

-- Inbox (IG/LinkedIn DMs, TikTok inbox) – optional
CREATE TABLE conversations (
  conversation_id bigserial PRIMARY KEY,
  account_id      bigint NOT NULL REFERENCES accounts ON DELETE CASCADE,
  platform        platform_t NOT NULL,
  external_id     text,
  last_message_at timestamptz,
  UNIQUE (platform, external_id)
);
CREATE TABLE conversation_participants (
  conversation_id bigint REFERENCES conversations ON DELETE CASCADE,
  person_id       bigint REFERENCES people,
  PRIMARY KEY (conversation_id, person_id)
);
CREATE TABLE messages (
  message_id      bigserial PRIMARY KEY,
  conversation_id bigint NOT NULL REFERENCES conversations ON DELETE CASCADE,
  sender_person_id bigint REFERENCES people,
  is_from_owner   boolean NOT NULL DEFAULT false,
  body            text,
  sent_at         timestamptz
);

-- ---------------------------------------------------------------------
-- 8. VIEWS
-- ---------------------------------------------------------------------
-- Latest captured value per content metric
CREATE VIEW v_content_latest_metrics AS
SELECT DISTINCT ON (f.content_id, f.metric_id, f.period_kind, f.period_start, f.period_end)
       c.account_id, f.content_id, c.title, c.content_type, c.published_at,
       m.metric_key, m.label, f.period_kind, f.period_start, f.period_end,
       f.value, f.captured_at
FROM content_metric_facts f
JOIN metric_definitions m USING (metric_id)
JOIN content_items c USING (content_id)
ORDER BY f.content_id, f.metric_id, f.period_kind, f.period_start, f.period_end, f.captured_at DESC;

-- Wide per-post summary for the usual engagement metrics (lifetime)
CREATE VIEW v_content_summary AS
SELECT c.content_id, c.account_id, c.platform, c.content_type, c.title, c.published_at,
  MAX(f.value) FILTER (WHERE m.metric_key = 'views')       AS views,
  MAX(f.value) FILTER (WHERE m.metric_key = 'impressions') AS impressions,
  MAX(f.value) FILTER (WHERE m.metric_key = 'likes')       AS likes,
  MAX(f.value) FILTER (WHERE m.metric_key = 'comments')    AS comments,
  MAX(f.value) FILTER (WHERE m.metric_key = 'shares')      AS shares,
  MAX(f.value) FILTER (WHERE m.metric_key = 'saves')       AS saves
FROM content_items c
LEFT JOIN content_metric_facts f ON f.content_id = c.content_id AND f.period_kind = 'lifetime'
LEFT JOIN metric_definitions m ON m.metric_id = f.metric_id
GROUP BY c.content_id;

-- People you followed/connected that disappeared between snapshots
CREATE VIEW v_inferred_unfollows AS
SELECT r.account_id, p.platform, p.handle, p.display_name, r.relation,
       r.first_observed_at, r.ended_inferred_at
FROM relationships r JOIN people p USING (person_id)
WHERE r.ended_inferred_at IS NOT NULL;

-- Metrics that expire soon: where you must archive first
CREATE VIEW v_expiring_metrics AS
SELECT platform, label, retention_days, gui_path
FROM metric_definitions
WHERE retention_days IS NOT NULL
ORDER BY retention_days;

-- ---------------------------------------------------------------------
-- 9. SEED: METRIC CATALOGUE (from the dashboard research, Oct 2026)
--    cols: platform, scope, key, label, definition, unit, semantics,
--          requires, retention_days, gui_path, verification
-- ---------------------------------------------------------------------
INSERT INTO metric_definitions
(platform, scope, metric_key, label, definition, unit, semantics, requires, retention_days, gui_path, verification) VALUES
-- ===== YOUTUBE =====
('youtube','account','views','Views','Legitimate views in the selected range','count','period',NULL,NULL,'Studio > Analytics > Overview','verified_official'),
('youtube','account','watch_time_hours','Watch time (hours)','Total time viewers watched','hours','period',NULL,NULL,'Studio > Analytics > Overview','verified_official'),
('youtube','account','subscribers_net','Subscribers','Subscribers gained minus lost','count','period',NULL,NULL,'Studio > Analytics > Overview','verified_official'),
('youtube','account','subscribers_realtime','Realtime subscriber count','Current subscriber count','count','point_in_time',NULL,NULL,'Studio > Dashboard / Analytics > Overview > Realtime','verified_official'),
('youtube','account','impressions','Impressions','Times thumbnails were shown','count','period',NULL,NULL,'Studio > Analytics > Content','verified_official'),
('youtube','account','impressions_ctr','Impressions click-through rate','Clicks per impression','percent','rate',NULL,NULL,'Studio > Analytics > Content','verified_official'),
('youtube','account','unique_viewers','Unique viewers','Distinct viewers in range','count','period',NULL,NULL,'Studio > Analytics > Audience','verified_official'),
('youtube','account','new_viewers','New viewers','Viewers watching for the first time','count','period',NULL,NULL,'Studio > Analytics > Audience','verified_official'),
('youtube','account','returning_viewers','Returning viewers','Viewers who watched before','count','period',NULL,NULL,'Studio > Analytics > Audience','verified_official'),
('youtube','account','subscribers_lost','Subscribers lost','Count of unsubscribes (no identities)','count','period',NULL,NULL,'Studio > Analytics > Advanced mode','verified_official'),
('youtube','content','views','Views','Views of the video','count','lifetime',NULL,NULL,'Studio > Content > list / video Analytics','verified_official'),
('youtube','content','likes','Likes','Likes on the video','count','lifetime',NULL,NULL,'Studio > Content','verified_official'),
('youtube','content','comments','Comments','Comment count (Comments added in Analytics)','count','lifetime',NULL,NULL,'Studio > Content','verified_official'),
('youtube','content','shares','Shares','Shares of the video','count','period',NULL,NULL,'Studio > Content > video > Analytics > Engagement','verified_official'),
('youtube','content','watch_time_hours','Watch time (hours)','Total hours watched','hours','period',NULL,NULL,'Studio > Content > video > Analytics','verified_official'),
('youtube','content','avg_view_duration_sec','Average view duration','Watch time / views','seconds','period',NULL,NULL,'Studio > Content > video > Analytics','verified_official'),
('youtube','content','avg_pct_viewed','Average percentage viewed','Average share of the video watched','percent','rate',NULL,NULL,'Studio > Advanced mode','verified_official'),
('youtube','content','impressions','Impressions','Thumbnail impressions','count','period',NULL,NULL,'Studio > Content > video > Analytics > Reach','verified_official'),
('youtube','content','impressions_ctr','Impressions click-through rate','Clicks per impression','percent','rate',NULL,NULL,'Studio > Content > video > Analytics > Reach','verified_official'),
('youtube','content','subscribers_gained','Subscribers gained from video','Net subscribers from this video','count','period',NULL,NULL,'Studio > Content > video > Analytics > Audience','verified_official'),
('youtube','revenue','estimated_revenue','Estimated revenue','Estimated earnings','currency','period','YouTube Partner Program',NULL,'Studio > Analytics > Revenue','verified_official'),
('youtube','revenue','rpm','RPM','Revenue per 1,000 views','currency','rate','YouTube Partner Program',NULL,'Studio > Analytics > Revenue','verified_official'),
('youtube','revenue','cpm','CPM','Cost per 1,000 ad impressions','currency','rate','YouTube Partner Program',NULL,'Studio > Analytics > Revenue','verified_official'),
-- ===== TIKTOK =====
('tiktok','account','video_views','Video views','Post views in range','count','period',NULL,365,'TikTok Studio > Analytics > Overview','verified_official'),
('tiktok','account','profile_views','Profile views','Profile visits in range','count','period',NULL,365,'TikTok Studio > Analytics > Overview','verified_official'),
('tiktok','account','likes','Likes','Likes in range','count','period',NULL,365,'TikTok Studio > Analytics > Overview','verified_official'),
('tiktok','account','comments','Comments','Comments in range','count','period',NULL,365,'TikTok Studio > Analytics > Overview','verified_official'),
('tiktok','account','shares','Shares','Shares in range','count','period',NULL,365,'TikTok Studio > Analytics > Overview','verified_official'),
('tiktok','account','total_followers','Total followers','Follower count','count','point_in_time',NULL,365,'TikTok Studio > Analytics > Followers','verified_official'),
('tiktok','account','net_followers','Net followers','Followers gained minus lost','count','period',NULL,365,'TikTok Studio > Analytics > Followers','verified_official'),
('tiktok','account','total_viewers','Total viewers','Unique viewers','count','period',NULL,365,'TikTok Studio > Analytics > Viewers','verified_official'),
('tiktok','account','new_viewers','New viewers','First-time viewers (past year)','count','period',NULL,365,'TikTok Studio > Analytics > Viewers','verified_official'),
('tiktok','account','returning_viewers','Returning viewers','Viewers who watched before','count','period',NULL,365,'TikTok Studio > Analytics > Viewers','verified_official'),
('tiktok','content','views','Video views','Views of the post','count','lifetime',NULL,NULL,'TikTok Studio > Content > post > Analytics','verified_official'),
('tiktok','content','likes','Likes','Likes','count','lifetime',NULL,NULL,'TikTok Studio > Content > post > Analytics','verified_official'),
('tiktok','content','comments','Comments','Comment count','count','lifetime',NULL,NULL,'TikTok Studio > Content > post > Analytics','verified_official'),
('tiktok','content','shares','Shares','Shares','count','lifetime',NULL,NULL,'TikTok Studio > Content > post > Analytics','verified_official'),
('tiktok','content','saves','Saves','Saves / favorites','count','lifetime',NULL,NULL,'TikTok Studio > Content > post > Analytics','verified_official'),
('tiktok','content','total_play_time_sec','Total play time','Total time watched','seconds','lifetime',NULL,NULL,'TikTok Studio > Content > post > Analytics','verified_official'),
('tiktok','content','avg_watch_time_sec','Average watch time','Average time per view','seconds','rate',NULL,NULL,'TikTok Studio > Content > post > Analytics','verified_official'),
('tiktok','content','watched_full_pct','Watched full video','Share who watched to the end','percent','rate',NULL,NULL,'TikTok Studio > Content > post > Analytics','verified_official'),
('tiktok','content','new_followers','New followers','Followers gained from the post','count','lifetime',NULL,NULL,'TikTok Studio > Content > post > Analytics','verified_official'),
('tiktok','live','unique_viewers','Unique viewers','Distinct LIVE viewers','count','period','LIVE access',NULL,'TikTok Studio > Analytics > LIVE','verified_official'),
('tiktok','live','peak_concurrent','Peak concurrent viewers','Max simultaneous viewers','count','period','LIVE access',NULL,'TikTok Studio > LIVE Center','verified_official'),
('tiktok','live','diamonds','Diamonds','Gift currency received','count','period','LIVE access',NULL,'TikTok Studio > LIVE Center','verified_official'),
('tiktok','revenue','estimated_rewards','Estimated rewards','Estimated creator rewards','currency','period','Creator Rewards eligibility',NULL,'TikTok Studio > Analytics > Overview','verified_official'),
-- ===== INSTAGRAM =====
('instagram','account','views','Views','Plays/displays incl. repeats','count','period',NULL,90,'Professional dashboard > See all insights','verified_official'),
('instagram','account','accounts_reached','Viewers / Accounts reached','Unique accounts that saw content','count','period',NULL,90,'Professional dashboard > See all insights','verified_official'),
('instagram','account','interactions','Interactions','Likes, comments, saves, shares, reposts','count','period',NULL,90,'Professional dashboard > See all insights','verified_official'),
('instagram','account','accounts_engaged','Accounts engaged','Unique accounts that interacted','count','period',NULL,90,'Professional dashboard > See all insights','verified_official'),
('instagram','account','total_followers','Total followers','Follower count','count','point_in_time',NULL,90,'Professional dashboard','verified_official'),
('instagram','account','follows','Follows','New follows in range','count','period',NULL,90,'Professional dashboard','verified_official'),
('instagram','account','unfollows','Unfollows','Unfollows in range (count only)','count','period',NULL,90,'Professional dashboard','verified_official'),
('instagram','account','profile_visits','Profile visits','Profile visits','count','period',NULL,90,'Professional dashboard > Profile activity','verified_official'),
('instagram','account','link_taps','External link taps','Taps on profile links','count','period',NULL,90,'Professional dashboard > Profile activity','verified_official'),
('instagram','content','views','Views','Starts/replays or displays','count','lifetime',NULL,730,'Post > View insights','verified_official'),
('instagram','content','accounts_reached','Viewers','Unique accounts reached','count','lifetime',NULL,730,'Post > View insights','verified_official'),
('instagram','content','likes','Likes','Likes','count','lifetime',NULL,730,'Post > View insights','verified_official'),
('instagram','content','comments','Comments','Comments','count','lifetime',NULL,730,'Post > View insights','verified_official'),
('instagram','content','shares','Shares','Shares','count','lifetime',NULL,730,'Post > View insights','verified_official'),
('instagram','content','saves','Saves','Saves','count','lifetime',NULL,730,'Post > View insights','verified_official'),
('instagram','content','reposts','Reposts','Reposts','count','lifetime',NULL,730,'Post > View insights','verified_official'),
('instagram','content','watch_time_sec','Watch time','Total watch time incl. replays (Reels)','seconds','lifetime',NULL,730,'Reel > View insights','verified_official'),
('instagram','content','avg_watch_time_sec','Average watch time','Watch time / initial views (Reels)','seconds','rate',NULL,730,'Reel > View insights','verified_official'),
('instagram','content','skip_rate','Skip rate','Share who left early (Reels)','percent','rate',NULL,730,'Reel > View insights','secondary_only'),
('instagram','content','follows','Follows','Follows from the post','count','lifetime',NULL,730,'Post > View insights','verified_official'),
('instagram','content','story_exits','Exits','Story exits','count','lifetime',NULL,730,'Story > insights','verified_official'),
('instagram','content','story_forward','Forward taps','Story forward taps','count','lifetime',NULL,730,'Story > insights','verified_official'),
('instagram','content','story_back','Back taps','Story back taps','count','lifetime',NULL,730,'Story > insights','verified_official'),
('instagram','content','story_replies','Replies','Story replies','count','lifetime',NULL,730,'Story > insights','verified_official'),
('instagram','audience','demographics_min_reach','Demographics threshold','Needs 100+ accounts reached / 100+ followers','count','point_in_time','Public account',NULL,'Professional dashboard > Total followers','verified_official'),
-- ===== LINKEDIN (personal profile) =====
('linkedin','account','impressions','Impressions','Times posts displayed (incl. own views, reposts)','count','period',NULL,365,'Me > View profile > Analytics > Post impressions','verified_official'),
('linkedin','account','engagements','Engagements','Reactions, comments, reposts','count','period',NULL,365,'Analytics > Post impressions','verified_official'),
('linkedin','account','total_followers','Total followers','Current follower count','count','point_in_time',NULL,NULL,'Analytics > Followers','verified_official'),
('linkedin','account','new_followers','New followers','New followers per day','count','period',NULL,365,'Analytics > Followers','verified_official'),
('linkedin','account','profile_viewers','Profile viewers','Count of profile viewers','count','period',NULL,90,'Analytics > Profile viewers','verified_official'),
('linkedin','account','search_appearances','Search appearances','Times profile appeared in search','count','period',NULL,NULL,'Analytics > Search appearances','verified_official'),
('linkedin','content','impressions','Impressions','Times the post was shown','count','lifetime',NULL,1000,'Posts & Activity > post > View analytics','verified_official'),
('linkedin','content','members_reached','Members reached','Estimated distinct members/Pages','count','lifetime',NULL,400,'Post analytics > Discovery','secondary_only'),
('linkedin','content','reactions','Reactions','Reactions','count','lifetime',NULL,1000,'Post analytics > Engagement','verified_official'),
('linkedin','content','comments','Comments','Comments','count','lifetime',NULL,1000,'Post analytics > Engagement','verified_official'),
('linkedin','content','reposts','Reposts','Reposts','count','lifetime',NULL,1000,'Post analytics > Engagement','verified_official'),
('linkedin','content','saves','Saves','Saves','count','lifetime',NULL,1000,'Post analytics > Engagement','verified_official'),
('linkedin','content','sends','Sends','Sends','count','lifetime',NULL,1000,'Post analytics > Engagement','verified_official'),
('linkedin','content','profile_viewers_from_post','Profile viewers from this post','Profile views driven by the post','count','lifetime',NULL,1000,'Post analytics > Profile activity','verified_official'),
('linkedin','content','followers_gained','Followers gained from this post','Followers gained from the post','count','lifetime',NULL,1000,'Post analytics > Profile activity','verified_official'),
('linkedin','content','video_plays','Video plays','Video plays','count','lifetime',NULL,180,'Video post analytics','verified_official'),
('linkedin','content','video_watch_time_sec','Watch time','Video watch time','seconds','lifetime',NULL,180,'Video post analytics','verified_official'),
('linkedin','content','article_views','Article views','Newsletter / article views','count','lifetime',NULL,730,'Newsletter analytics','verified_official'),
('linkedin','audience','demographic_share','Viewer demographics','Top company/title/location/industry breakdown','percent','rate',NULL,180,'Post analytics > Demographics','verified_official')
;

-- Platform-neutral aliases used by v_content_summary ('shares' on LinkedIn = reposts etc.)
-- Add per-platform mappings as needed in your ETL.

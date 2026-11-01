"""initial schema

Revision ID: ad3132ff58f0
Revises: 
Create Date: 2026-10-29 12:44:47.236241

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'ad3132ff58f0'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Read-only views (models: app/creator/model/view.py). v_content_summary maps LinkedIn's
# reactions/reposts/video plays onto the platform-neutral likes/shares/views columns.
VIEWS = {
    'v_content_latest_metrics': '''
SELECT DISTINCT ON (f.content_id, f.metric_id, f.period_kind, f.period_start, f.period_end) c.account_id,
    f.content_id,
    c.title,
    c.content_type,
    c.published_at,
    m.metric_key,
    m.label,
    f.period_kind,
    f.period_start,
    f.period_end,
    f.value,
    f.captured_at
   FROM ((content_metric_facts f
     JOIN metric_definitions m USING (metric_id))
     JOIN content_items c USING (content_id))
  ORDER BY f.content_id, f.metric_id, f.period_kind, f.period_start, f.period_end, f.captured_at DESC
''',
    'v_expiring_metrics': '''
SELECT platform,
    label,
    retention_days,
    gui_path
   FROM metric_definitions
  WHERE (retention_days IS NOT NULL)
  ORDER BY retention_days
''',
    'v_inferred_unfollows': '''
SELECT r.account_id,
    p.platform,
    p.handle,
    p.display_name,
    r.relation,
    r.first_observed_at,
    r.ended_inferred_at
   FROM (relationships r
     JOIN people p USING (person_id))
  WHERE (r.ended_inferred_at IS NOT NULL)
''',
    'v_content_summary': '''
SELECT content_id,
    account_id,
    platform,
    content_type,
    title,
    published_at,
    views,
    impressions,
    likes,
    comments,
    shares,
    saves,
    (((COALESCE(likes, (0)::numeric) + COALESCE(comments, (0)::numeric)) + COALESCE(shares, (0)::numeric)) + COALESCE(saves, (0)::numeric)) AS engagements
   FROM ( SELECT c.content_id,
            c.account_id,
            c.platform,
            c.content_type,
            c.title,
            c.published_at,
            max(f.value) FILTER (WHERE ((m.metric_key = 'views'::text) OR ((c.platform = 'linkedin'::platform_t) AND (m.metric_key = ANY (ARRAY['video_plays'::text, 'article_views'::text]))))) AS views,
            max(f.value) FILTER (WHERE (m.metric_key = 'impressions'::text)) AS impressions,
            max(f.value) FILTER (WHERE ((m.metric_key = 'likes'::text) OR ((c.platform = 'linkedin'::platform_t) AND (m.metric_key = 'reactions'::text)))) AS likes,
            max(f.value) FILTER (WHERE (m.metric_key = 'comments'::text)) AS comments,
            max(f.value) FILTER (WHERE ((m.metric_key = 'shares'::text) OR ((c.platform = 'linkedin'::platform_t) AND (m.metric_key = 'reposts'::text)))) AS shares,
            max(f.value) FILTER (WHERE (m.metric_key = 'saves'::text)) AS saves
           FROM ((content_items c
             LEFT JOIN content_metric_facts f ON (((f.content_id = c.content_id) AND (f.period_kind = 'lifetime'::period_kind_t))))
             LEFT JOIN metric_definitions m ON ((m.metric_id = f.metric_id)))
          GROUP BY c.content_id) s
''',
}

# Metric catalogue: everything the four dashboards show (research, Oct 2026) + LinkedIn's .xlsx export metrics.
SEED_METRICS = """
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

INSERT INTO metric_definitions
(platform, scope, metric_key, label, definition, unit, semantics, requires, retention_days, gui_path, verification) VALUES
('linkedin','account','members_reached','Members reached','Distinct members who saw your posts','count','period',NULL,365,'Analytics > Content > Discovery','verified_official'),
('linkedin','account','reactions','Reactions','Reactions on your posts','count','period',NULL,365,'Analytics > Content > Engagement','verified_official'),
('linkedin','account','comments','Comments','Comments on your posts','count','period',NULL,365,'Analytics > Content > Engagement','verified_official'),
('linkedin','account','reposts','Reposts','Reposts of your posts','count','period',NULL,365,'Analytics > Content > Engagement','verified_official'),
('linkedin','account','saves','Saves','Saves of your posts','count','period',NULL,365,'Analytics > Content > Engagement','verified_official'),
('linkedin','account','sends','Sends on LinkedIn','Sends of your posts','count','period',NULL,365,'Analytics > Content > Engagement','verified_official'),
('linkedin','account','link_engagements','Link engagements','Visits to links in all posts','count','period',NULL,365,'Analytics > Content > Engagement','verified_official'),
('linkedin','account','in_network_impressions_pct','In-network (followers and connections)','Share of impressions from your network','percent','rate',NULL,365,'Analytics > Content > Discovery','verified_official'),
('linkedin','account','profile_appearances','All appearances','Times your profile appeared anywhere on LinkedIn','count','period',NULL,NULL,'Analytics > Search appearances','verified_official'),
('linkedin','audience','follower_demographic_share','Follower demographics','Top follower company/title/location/industry breakdown','percent','rate',NULL,NULL,'Analytics > Audience > Top demographics','verified_official')
ON CONFLICT (platform, scope, metric_key) DO NOTHING;
"""


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('accounts',
    sa.Column('account_id', sa.BigInteger(), nullable=False),
    sa.Column('platform', sa.Enum('youtube', 'tiktok', 'instagram', 'linkedin', name='platform_t', schema='creator'), nullable=False),
    sa.Column('account_type', sa.Enum('channel', 'personal', 'creator', 'business', 'company_page', name='account_type_t', schema='creator'), nullable=False),
    sa.Column('external_id', sa.Text(), nullable=True),
    sa.Column('handle', sa.Text(), nullable=False),
    sa.Column('display_name', sa.Text(), nullable=True),
    sa.Column('profile_url', sa.Text(), nullable=True),
    sa.Column('is_monetized', sa.Boolean(), server_default=sa.text('false'), nullable=False),
    sa.Column('is_public', sa.Boolean(), server_default=sa.text('true'), nullable=False),
    sa.Column('premium_tier', sa.Text(), nullable=True),
    sa.Column('region', sa.Text(), nullable=True),
    sa.Column('created_on', sa.Date(), nullable=True),
    sa.Column('notes', sa.Text(), nullable=True),
    sa.PrimaryKeyConstraint('account_id', name=op.f('accounts_pkey')),
    sa.UniqueConstraint('platform', 'handle', name=op.f('accounts_platform_handle_key')),
    schema='creator'
    )
    op.create_table('metric_definitions',
    sa.Column('metric_id', sa.Integer(), nullable=False),
    sa.Column('platform', sa.Enum('youtube', 'tiktok', 'instagram', 'linkedin', name='platform_t', schema='creator'), nullable=False),
    sa.Column('scope', sa.Enum('account', 'content', 'audience', 'live', 'revenue', name='metric_scope_t', schema='creator'), nullable=False),
    sa.Column('metric_key', sa.Text(), nullable=False),
    sa.Column('label', sa.Text(), nullable=False),
    sa.Column('definition', sa.Text(), nullable=True),
    sa.Column('unit', sa.Text(), server_default='count', nullable=False),
    sa.Column('semantics', sa.Enum('period', 'lifetime', 'point_in_time', 'rate', name='value_semantics_t', schema='creator'), server_default='period', nullable=False),
    sa.Column('applies_to', postgresql.ARRAY(sa.Enum('video', 'short', 'reel', 'story', 'image_post', 'carousel', 'text_post', 'article', 'newsletter', 'newsletter_edition', 'live', 'live_recording', 'repost', 'clip', 'playlist', 'poll', 'document', 'community_post', name='content_type_t', schema='creator')), nullable=True),
    sa.Column('requires', sa.Text(), nullable=True),
    sa.Column('retention_days', sa.Integer(), nullable=True),
    sa.Column('gui_path', sa.Text(), nullable=True),
    sa.Column('verification', sa.Enum('verified_official', 'secondary_only', 'unverified', name='verification_t', schema='creator'), server_default='verified_official', nullable=False),
    sa.PrimaryKeyConstraint('metric_id', name=op.f('metric_definitions_pkey')),
    sa.UniqueConstraint('platform', 'scope', 'metric_key', name=op.f('metric_definitions_platform_scope_metric_key_key')),
    schema='creator'
    )
    op.create_table('people',
    sa.Column('person_id', sa.BigInteger(), nullable=False),
    sa.Column('platform', sa.Enum('youtube', 'tiktok', 'instagram', 'linkedin', name='platform_t', schema='creator'), nullable=False),
    sa.Column('external_id', sa.Text(), nullable=True),
    sa.Column('handle', sa.Text(), nullable=True),
    sa.Column('display_name', sa.Text(), nullable=True),
    sa.Column('headline', sa.Text(), nullable=True),
    sa.Column('profile_url', sa.Text(), nullable=True),
    sa.Column('email', sa.Text(), nullable=True),
    sa.Column('is_verified', sa.Boolean(), nullable=True),
    sa.Column('first_seen_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('person_id', name=op.f('people_pkey')),
    sa.UniqueConstraint('platform', 'handle', name=op.f('people_platform_handle_key')),
    schema='creator'
    )
    op.create_table('account_profile_snapshots',
    sa.Column('snapshot_id', sa.BigInteger(), nullable=False),
    sa.Column('account_id', sa.BigInteger(), nullable=False),
    sa.Column('captured_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('bio', sa.Text(), nullable=True),
    sa.Column('headline', sa.Text(), nullable=True),
    sa.Column('links', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('contact_email', sa.Text(), nullable=True),
    sa.Column('follower_count', sa.BigInteger(), nullable=True),
    sa.Column('following_count', sa.BigInteger(), nullable=True),
    sa.Column('connection_count', sa.BigInteger(), nullable=True),
    sa.Column('content_count', sa.BigInteger(), nullable=True),
    sa.Column('extra', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.ForeignKeyConstraint(['account_id'], ['creator.accounts.account_id'], name=op.f('account_profile_snapshots_account_id_fkey'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('snapshot_id', name=op.f('account_profile_snapshots_pkey')),
    schema='creator'
    )
    op.create_index('account_profile_snapshots_account_id_captured_at_idx', 'account_profile_snapshots', ['account_id', sa.literal_column('captured_at DESC')], unique=False, schema='creator')
    op.create_table('content_items',
    sa.Column('content_id', sa.BigInteger(), nullable=False),
    sa.Column('account_id', sa.BigInteger(), nullable=False),
    sa.Column('platform', sa.Enum('youtube', 'tiktok', 'instagram', 'linkedin', name='platform_t', schema='creator'), nullable=False),
    sa.Column('external_id', sa.Text(), nullable=False),
    sa.Column('content_type', sa.Enum('video', 'short', 'reel', 'story', 'image_post', 'carousel', 'text_post', 'article', 'newsletter', 'newsletter_edition', 'live', 'live_recording', 'repost', 'clip', 'playlist', 'poll', 'document', 'community_post', name='content_type_t', schema='creator'), nullable=False),
    sa.Column('parent_content_id', sa.BigInteger(), nullable=True),
    sa.Column('original_author', sa.Text(), nullable=True),
    sa.Column('title', sa.Text(), nullable=True),
    sa.Column('caption', sa.Text(), nullable=True),
    sa.Column('url', sa.Text(), nullable=True),
    sa.Column('visibility', sa.Enum('public', 'unlisted', 'private', 'connections_only', 'followers_only', 'group_only', 'scheduled', 'draft', 'archived', 'removed', 'unknown', name='visibility_t', schema='creator'), server_default='unknown', nullable=False),
    sa.Column('status', sa.Text(), nullable=True),
    sa.Column('restrictions', sa.Text(), nullable=True),
    sa.Column('published_at', sa.TIMESTAMP(timezone=True), nullable=True),
    sa.Column('scheduled_for', sa.TIMESTAMP(timezone=True), nullable=True),
    sa.Column('duration_seconds', sa.Numeric(asdecimal=False), nullable=True),
    sa.Column('thumbnail_url', sa.Text(), nullable=True),
    sa.Column('language', sa.Text(), nullable=True),
    sa.Column('is_collab', sa.Boolean(), server_default=sa.text('false'), nullable=False),
    sa.Column('first_seen_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('last_seen_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('deleted_observed_at', sa.TIMESTAMP(timezone=True), nullable=True),
    sa.Column('extra', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.ForeignKeyConstraint(['account_id'], ['creator.accounts.account_id'], name=op.f('content_items_account_id_fkey'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['parent_content_id'], ['creator.content_items.content_id'], name=op.f('content_items_parent_content_id_fkey')),
    sa.PrimaryKeyConstraint('content_id', name=op.f('content_items_pkey')),
    sa.UniqueConstraint('platform', 'external_id', name=op.f('content_items_platform_external_id_key')),
    schema='creator'
    )
    op.create_index('content_items_account_id_content_type_idx', 'content_items', ['account_id', 'content_type'], unique=False, schema='creator')
    op.create_index('content_items_account_id_published_at_idx', 'content_items', ['account_id', sa.literal_column('published_at DESC')], unique=False, schema='creator')
    op.create_table('conversations',
    sa.Column('conversation_id', sa.BigInteger(), nullable=False),
    sa.Column('account_id', sa.BigInteger(), nullable=False),
    sa.Column('platform', sa.Enum('youtube', 'tiktok', 'instagram', 'linkedin', name='platform_t', schema='creator'), nullable=False),
    sa.Column('external_id', sa.Text(), nullable=True),
    sa.Column('last_message_at', sa.TIMESTAMP(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['account_id'], ['creator.accounts.account_id'], name=op.f('conversations_account_id_fkey'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('conversation_id', name=op.f('conversations_pkey')),
    sa.UniqueConstraint('platform', 'external_id', name=op.f('conversations_platform_external_id_key')),
    schema='creator'
    )
    op.create_table('import_batches',
    sa.Column('batch_id', sa.BigInteger(), nullable=False),
    sa.Column('account_id', sa.BigInteger(), nullable=True),
    sa.Column('source_kind', sa.Enum('gui_manual', 'csv_export', 'xlsx_export', 'sheets_export', 'takeout_archive', 'screenshot', 'copy_paste', name='source_kind_t', schema='creator'), nullable=False),
    sa.Column('source_label', sa.Text(), nullable=False),
    sa.Column('gui_path', sa.Text(), nullable=True),
    sa.Column('file_name', sa.Text(), nullable=True),
    sa.Column('file_sha256', sa.Text(), nullable=True),
    sa.Column('range_start', sa.Date(), nullable=True),
    sa.Column('range_end', sa.Date(), nullable=True),
    sa.Column('row_count', sa.Integer(), nullable=True),
    sa.Column('imported_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('notes', sa.Text(), nullable=True),
    sa.ForeignKeyConstraint(['account_id'], ['creator.accounts.account_id'], name=op.f('import_batches_account_id_fkey'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('batch_id', name=op.f('import_batches_pkey')),
    schema='creator'
    )
    op.create_table('account_metric_facts',
    sa.Column('fact_id', sa.BigInteger(), nullable=False),
    sa.Column('account_id', sa.BigInteger(), nullable=False),
    sa.Column('metric_id', sa.Integer(), nullable=False),
    sa.Column('period_kind', sa.Enum('lifetime', 'day', 'week', 'month', 'year', 'range', 'first_24h', 'realtime', 'snapshot', name='period_kind_t', schema='creator'), nullable=False),
    sa.Column('period_start', sa.Date(), nullable=False),
    sa.Column('period_end', sa.Date(), nullable=False),
    sa.Column('value', sa.Numeric(asdecimal=False), nullable=False),
    sa.Column('captured_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('batch_id', sa.BigInteger(), nullable=True),
    sa.ForeignKeyConstraint(['account_id'], ['creator.accounts.account_id'], name=op.f('account_metric_facts_account_id_fkey'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['batch_id'], ['creator.import_batches.batch_id'], name=op.f('account_metric_facts_batch_id_fkey'), initially='DEFERRED', deferrable=True),
    sa.ForeignKeyConstraint(['metric_id'], ['creator.metric_definitions.metric_id'], name=op.f('account_metric_facts_metric_id_fkey')),
    sa.PrimaryKeyConstraint('fact_id', name=op.f('account_metric_facts_pkey')),
    sa.UniqueConstraint('account_id', 'metric_id', 'period_kind', 'period_start', 'period_end', 'captured_at', name='account_metric_facts_account_id_metric_id_period_kind_perio_key'),
    schema='creator'
    )
    op.create_index('account_metric_facts_account_id_metric_id_period_start_idx', 'account_metric_facts', ['account_id', 'metric_id', 'period_start'], unique=False, schema='creator')
    op.create_table('breakdown_facts',
    sa.Column('fact_id', sa.BigInteger(), nullable=False),
    sa.Column('account_id', sa.BigInteger(), nullable=False),
    sa.Column('content_id', sa.BigInteger(), nullable=True),
    sa.Column('dimension', sa.Enum('age_range', 'gender', 'country', 'region', 'city', 'language', 'hour_of_day', 'day_of_week', 'traffic_source', 'search_term', 'external_source', 'suggested_video', 'discovery_surface', 'viewer_type', 'follower_status', 'subscription_status', 'device', 'job_title', 'industry', 'seniority', 'company', 'company_size', 'revenue_source', 'engagement_kind', 'audience_also_follows', 'audience_also_watches', 'keyword', name='dimension_t', schema='creator'), nullable=False),
    sa.Column('dimension_value', sa.Text(), nullable=False),
    sa.Column('metric_id', sa.Integer(), nullable=False),
    sa.Column('period_kind', sa.Enum('lifetime', 'day', 'week', 'month', 'year', 'range', 'first_24h', 'realtime', 'snapshot', name='period_kind_t', schema='creator'), server_default='range', nullable=False),
    sa.Column('period_start', sa.Date(), nullable=True),
    sa.Column('period_end', sa.Date(), nullable=True),
    sa.Column('value', sa.Numeric(asdecimal=False), nullable=False),
    sa.Column('captured_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('batch_id', sa.BigInteger(), nullable=True),
    sa.ForeignKeyConstraint(['account_id'], ['creator.accounts.account_id'], name=op.f('breakdown_facts_account_id_fkey'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['batch_id'], ['creator.import_batches.batch_id'], name=op.f('breakdown_facts_batch_id_fkey'), initially='DEFERRED', deferrable=True),
    sa.ForeignKeyConstraint(['content_id'], ['creator.content_items.content_id'], name=op.f('breakdown_facts_content_id_fkey'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['metric_id'], ['creator.metric_definitions.metric_id'], name=op.f('breakdown_facts_metric_id_fkey')),
    sa.PrimaryKeyConstraint('fact_id', name=op.f('breakdown_facts_pkey')),
    schema='creator'
    )
    op.create_index('breakdown_facts_account_id_dimension_captured_at_idx', 'breakdown_facts', ['account_id', 'dimension', sa.literal_column('captured_at DESC')], unique=False, schema='creator')
    op.create_index('breakdown_facts_content_id_dimension_idx', 'breakdown_facts', ['content_id', 'dimension'], unique=False, schema='creator', postgresql_where=sa.text('content_id IS NOT NULL'))
    op.create_table('comments',
    sa.Column('comment_id', sa.BigInteger(), nullable=False),
    sa.Column('content_id', sa.BigInteger(), nullable=False),
    sa.Column('platform', sa.Enum('youtube', 'tiktok', 'instagram', 'linkedin', name='platform_t', schema='creator'), nullable=False),
    sa.Column('external_id', sa.Text(), nullable=False),
    sa.Column('parent_comment_id', sa.BigInteger(), nullable=True),
    sa.Column('author_person_id', sa.BigInteger(), nullable=True),
    sa.Column('is_owner_comment', sa.Boolean(), server_default=sa.text('false'), nullable=False),
    sa.Column('body', sa.Text(), nullable=True),
    sa.Column('posted_at', sa.TIMESTAMP(timezone=True), nullable=True),
    sa.Column('like_count', sa.Integer(), nullable=True),
    sa.Column('reply_count', sa.Integer(), nullable=True),
    sa.Column('is_pinned', sa.Boolean(), server_default=sa.text('false'), nullable=False),
    sa.Column('is_hearted', sa.Boolean(), server_default=sa.text('false'), nullable=False),
    sa.Column('status', sa.Enum('published', 'held_for_review', 'filtered_spam', 'filtered_keyword', 'hidden', 'removed_by_owner', 'deleted_observed', name='comment_status_t', schema='creator'), server_default='published', nullable=False),
    sa.Column('status_reason', sa.Text(), nullable=True),
    sa.Column('held_expires_at', sa.TIMESTAMP(timezone=True), nullable=True),
    sa.Column('first_captured_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('last_captured_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('deleted_observed_at', sa.TIMESTAMP(timezone=True), nullable=True),
    sa.Column('batch_id', sa.BigInteger(), nullable=True),
    sa.ForeignKeyConstraint(['author_person_id'], ['creator.people.person_id'], name=op.f('comments_author_person_id_fkey')),
    sa.ForeignKeyConstraint(['batch_id'], ['creator.import_batches.batch_id'], name=op.f('comments_batch_id_fkey'), initially='DEFERRED', deferrable=True),
    sa.ForeignKeyConstraint(['content_id'], ['creator.content_items.content_id'], name=op.f('comments_content_id_fkey'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['parent_comment_id'], ['creator.comments.comment_id'], name=op.f('comments_parent_comment_id_fkey')),
    sa.PrimaryKeyConstraint('comment_id', name=op.f('comments_pkey')),
    sa.UniqueConstraint('platform', 'external_id', name=op.f('comments_platform_external_id_key')),
    schema='creator'
    )
    op.create_index('comments_author_person_id_idx', 'comments', ['author_person_id'], unique=False, schema='creator')
    op.create_index('comments_content_id_posted_at_idx', 'comments', ['content_id', 'posted_at'], unique=False, schema='creator')
    op.create_index('comments_parent_comment_id_idx', 'comments', ['parent_comment_id'], unique=False, schema='creator')
    op.create_table('content_metric_facts',
    sa.Column('fact_id', sa.BigInteger(), nullable=False),
    sa.Column('content_id', sa.BigInteger(), nullable=False),
    sa.Column('metric_id', sa.Integer(), nullable=False),
    sa.Column('period_kind', sa.Enum('lifetime', 'day', 'week', 'month', 'year', 'range', 'first_24h', 'realtime', 'snapshot', name='period_kind_t', schema='creator'), nullable=False),
    sa.Column('period_start', sa.Date(), nullable=True),
    sa.Column('period_end', sa.Date(), nullable=True),
    sa.Column('value', sa.Numeric(asdecimal=False), nullable=False),
    sa.Column('captured_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('batch_id', sa.BigInteger(), nullable=True),
    sa.ForeignKeyConstraint(['batch_id'], ['creator.import_batches.batch_id'], name=op.f('content_metric_facts_batch_id_fkey'), initially='DEFERRED', deferrable=True),
    sa.ForeignKeyConstraint(['content_id'], ['creator.content_items.content_id'], name=op.f('content_metric_facts_content_id_fkey'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['metric_id'], ['creator.metric_definitions.metric_id'], name=op.f('content_metric_facts_metric_id_fkey')),
    sa.PrimaryKeyConstraint('fact_id', name=op.f('content_metric_facts_pkey')),
    schema='creator'
    )
    op.create_index('content_metric_facts_content_id_metric_id_captured_at_idx', 'content_metric_facts', ['content_id', 'metric_id', sa.literal_column('captured_at DESC')], unique=False, schema='creator')
    op.create_index('content_metric_facts_uq', 'content_metric_facts', ['content_id', 'metric_id', 'period_kind', sa.literal_column("coalesce(period_start, '0001-01-01'::date)"), sa.literal_column("coalesce(period_end, '0001-01-01'::date)"), 'captured_at'], unique=True, schema='creator')
    op.create_table('content_tags',
    sa.Column('content_id', sa.BigInteger(), nullable=False),
    sa.Column('tag_type', sa.Text(), nullable=False),
    sa.Column('value', sa.Text(), nullable=False),
    sa.Column('person_id', sa.BigInteger(), nullable=True),
    sa.CheckConstraint("tag_type IN ('hashtag','mention','collaborator','location','product')", name=op.f('content_tags_tag_type_check')),
    sa.ForeignKeyConstraint(['content_id'], ['creator.content_items.content_id'], name=op.f('content_tags_content_id_fkey'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['person_id'], ['creator.people.person_id'], name='content_tags_person_fk'),
    sa.PrimaryKeyConstraint('content_id', 'tag_type', 'value', name=op.f('content_tags_pkey')),
    schema='creator'
    )
    op.create_table('conversation_participants',
    sa.Column('conversation_id', sa.BigInteger(), nullable=False),
    sa.Column('person_id', sa.BigInteger(), nullable=False),
    sa.ForeignKeyConstraint(['conversation_id'], ['creator.conversations.conversation_id'], name=op.f('conversation_participants_conversation_id_fkey'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['person_id'], ['creator.people.person_id'], name=op.f('conversation_participants_person_id_fkey')),
    sa.PrimaryKeyConstraint('conversation_id', 'person_id', name=op.f('conversation_participants_pkey')),
    schema='creator'
    )
    op.create_table('interactions',
    sa.Column('interaction_id', sa.BigInteger(), nullable=False),
    sa.Column('account_id', sa.BigInteger(), nullable=False),
    sa.Column('content_id', sa.BigInteger(), nullable=True),
    sa.Column('person_id', sa.BigInteger(), nullable=True),
    sa.Column('interaction_type', sa.Enum('reaction', 'repost', 'mention', 'tag', 'story_view', 'post_view', 'profile_view', 'share', 'save', 'send', 'collab_invite', name='interaction_t', schema='creator'), nullable=False),
    sa.Column('detail', sa.Text(), nullable=True),
    sa.Column('occurred_at', sa.TIMESTAMP(timezone=True), nullable=True),
    sa.Column('visible_window_days', sa.Integer(), nullable=True),
    sa.Column('captured_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('batch_id', sa.BigInteger(), nullable=True),
    sa.ForeignKeyConstraint(['account_id'], ['creator.accounts.account_id'], name=op.f('interactions_account_id_fkey'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['batch_id'], ['creator.import_batches.batch_id'], name=op.f('interactions_batch_id_fkey'), initially='DEFERRED', deferrable=True),
    sa.ForeignKeyConstraint(['content_id'], ['creator.content_items.content_id'], name=op.f('interactions_content_id_fkey'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['person_id'], ['creator.people.person_id'], name=op.f('interactions_person_id_fkey')),
    sa.PrimaryKeyConstraint('interaction_id', name=op.f('interactions_pkey')),
    schema='creator'
    )
    op.create_index('interactions_account_id_interaction_type_occurred_at_idx', 'interactions', ['account_id', 'interaction_type', sa.literal_column('occurred_at DESC')], unique=False, schema='creator')
    op.create_index('interactions_content_id_interaction_type_idx', 'interactions', ['content_id', 'interaction_type'], unique=False, schema='creator')
    op.create_table('live_sessions',
    sa.Column('content_id', sa.BigInteger(), autoincrement=False, nullable=False),
    sa.Column('started_at', sa.TIMESTAMP(timezone=True), nullable=True),
    sa.Column('ended_at', sa.TIMESTAMP(timezone=True), nullable=True),
    sa.Column('peak_concurrent', sa.Integer(), nullable=True),
    sa.Column('avg_concurrent', sa.Numeric(asdecimal=False), nullable=True),
    sa.Column('has_recording', sa.Boolean(), nullable=True),
    sa.ForeignKeyConstraint(['content_id'], ['creator.content_items.content_id'], name=op.f('live_sessions_content_id_fkey'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('content_id', name=op.f('live_sessions_pkey')),
    schema='creator'
    )
    op.create_table('messages',
    sa.Column('message_id', sa.BigInteger(), nullable=False),
    sa.Column('conversation_id', sa.BigInteger(), nullable=False),
    sa.Column('sender_person_id', sa.BigInteger(), nullable=True),
    sa.Column('is_from_owner', sa.Boolean(), server_default=sa.text('false'), nullable=False),
    sa.Column('body', sa.Text(), nullable=True),
    sa.Column('sent_at', sa.TIMESTAMP(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['conversation_id'], ['creator.conversations.conversation_id'], name=op.f('messages_conversation_id_fkey'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['sender_person_id'], ['creator.people.person_id'], name=op.f('messages_sender_person_id_fkey')),
    sa.PrimaryKeyConstraint('message_id', name=op.f('messages_pkey')),
    schema='creator'
    )
    op.create_table('relationships',
    sa.Column('relationship_id', sa.BigInteger(), nullable=False),
    sa.Column('account_id', sa.BigInteger(), nullable=False),
    sa.Column('person_id', sa.BigInteger(), nullable=False),
    sa.Column('relation', sa.Enum('follower', 'following', 'subscriber', 'connection', 'blocked', 'close_friend', name='relation_t', schema='creator'), nullable=False),
    sa.Column('relation_since', sa.Date(), nullable=True),
    sa.Column('first_batch_id', sa.BigInteger(), nullable=True),
    sa.Column('last_batch_id', sa.BigInteger(), nullable=True),
    sa.Column('first_observed_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('last_observed_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('ended_inferred_at', sa.TIMESTAMP(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['account_id'], ['creator.accounts.account_id'], name=op.f('relationships_account_id_fkey'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['first_batch_id'], ['creator.import_batches.batch_id'], name=op.f('relationships_first_batch_id_fkey'), initially='DEFERRED', deferrable=True),
    sa.ForeignKeyConstraint(['last_batch_id'], ['creator.import_batches.batch_id'], name=op.f('relationships_last_batch_id_fkey'), initially='DEFERRED', deferrable=True),
    sa.ForeignKeyConstraint(['person_id'], ['creator.people.person_id'], name=op.f('relationships_person_id_fkey')),
    sa.PrimaryKeyConstraint('relationship_id', name=op.f('relationships_pkey')),
    sa.UniqueConstraint('account_id', 'person_id', 'relation', name=op.f('relationships_account_id_person_id_relation_key')),
    schema='creator'
    )
    op.create_table('retention_curve_points',
    sa.Column('content_id', sa.BigInteger(), nullable=False),
    sa.Column('captured_at', sa.TIMESTAMP(timezone=True), nullable=False),
    sa.Column('position_pct', sa.Numeric(asdecimal=False), nullable=False),
    sa.Column('position_sec', sa.Numeric(asdecimal=False), nullable=True),
    sa.Column('audience_pct', sa.Numeric(asdecimal=False), nullable=False),
    sa.Column('batch_id', sa.BigInteger(), nullable=True),
    sa.CheckConstraint('position_pct BETWEEN 0 AND 100', name=op.f('retention_curve_points_position_pct_check')),
    sa.ForeignKeyConstraint(['batch_id'], ['creator.import_batches.batch_id'], name=op.f('retention_curve_points_batch_id_fkey'), initially='DEFERRED', deferrable=True),
    sa.ForeignKeyConstraint(['content_id'], ['creator.content_items.content_id'], name=op.f('retention_curve_points_content_id_fkey'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('content_id', 'captured_at', 'position_pct', name=op.f('retention_curve_points_pkey')),
    schema='creator'
    )
    op.create_table('revenue_facts',
    sa.Column('fact_id', sa.BigInteger(), nullable=False),
    sa.Column('account_id', sa.BigInteger(), nullable=False),
    sa.Column('content_id', sa.BigInteger(), nullable=True),
    sa.Column('revenue_source', sa.Text(), nullable=False),
    sa.Column('metric_id', sa.Integer(), nullable=False),
    sa.Column('currency', sa.CHAR(length=3), nullable=True),
    sa.Column('period_kind', sa.Enum('lifetime', 'day', 'week', 'month', 'year', 'range', 'first_24h', 'realtime', 'snapshot', name='period_kind_t', schema='creator'), nullable=False),
    sa.Column('period_start', sa.Date(), nullable=False),
    sa.Column('period_end', sa.Date(), nullable=False),
    sa.Column('value', sa.Numeric(asdecimal=False), nullable=False),
    sa.Column('is_estimated', sa.Boolean(), server_default=sa.text('true'), nullable=False),
    sa.Column('captured_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('batch_id', sa.BigInteger(), nullable=True),
    sa.ForeignKeyConstraint(['account_id'], ['creator.accounts.account_id'], name=op.f('revenue_facts_account_id_fkey'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['batch_id'], ['creator.import_batches.batch_id'], name=op.f('revenue_facts_batch_id_fkey'), initially='DEFERRED', deferrable=True),
    sa.ForeignKeyConstraint(['content_id'], ['creator.content_items.content_id'], name=op.f('revenue_facts_content_id_fkey'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['metric_id'], ['creator.metric_definitions.metric_id'], name=op.f('revenue_facts_metric_id_fkey')),
    sa.PrimaryKeyConstraint('fact_id', name=op.f('revenue_facts_pkey')),
    schema='creator'
    )
    # ### end Alembic commands ###
    op.execute('SET LOCAL search_path = creator, public')
    for name, definition in VIEWS.items():
        op.execute(f'CREATE VIEW {name} AS {definition}')
    op.execute(SEED_METRICS)


def downgrade() -> None:
    """Downgrade schema."""
    for name in reversed(VIEWS):
        op.execute(f'DROP VIEW creator.{name}')
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('revenue_facts', schema='creator')
    op.drop_table('retention_curve_points', schema='creator')
    op.drop_table('relationships', schema='creator')
    op.drop_table('messages', schema='creator')
    op.drop_table('live_sessions', schema='creator')
    op.drop_index('interactions_content_id_interaction_type_idx', table_name='interactions', schema='creator')
    op.drop_index('interactions_account_id_interaction_type_occurred_at_idx', table_name='interactions', schema='creator')
    op.drop_table('interactions', schema='creator')
    op.drop_table('conversation_participants', schema='creator')
    op.drop_table('content_tags', schema='creator')
    op.drop_index('content_metric_facts_uq', table_name='content_metric_facts', schema='creator')
    op.drop_index('content_metric_facts_content_id_metric_id_captured_at_idx', table_name='content_metric_facts', schema='creator')
    op.drop_table('content_metric_facts', schema='creator')
    op.drop_index('comments_parent_comment_id_idx', table_name='comments', schema='creator')
    op.drop_index('comments_content_id_posted_at_idx', table_name='comments', schema='creator')
    op.drop_index('comments_author_person_id_idx', table_name='comments', schema='creator')
    op.drop_table('comments', schema='creator')
    op.drop_index('breakdown_facts_content_id_dimension_idx', table_name='breakdown_facts', schema='creator', postgresql_where=sa.text('content_id IS NOT NULL'))
    op.drop_index('breakdown_facts_account_id_dimension_captured_at_idx', table_name='breakdown_facts', schema='creator')
    op.drop_table('breakdown_facts', schema='creator')
    op.drop_index('account_metric_facts_account_id_metric_id_period_start_idx', table_name='account_metric_facts', schema='creator')
    op.drop_table('account_metric_facts', schema='creator')
    op.drop_table('import_batches', schema='creator')
    op.drop_table('conversations', schema='creator')
    op.drop_index('content_items_account_id_published_at_idx', table_name='content_items', schema='creator')
    op.drop_index('content_items_account_id_content_type_idx', table_name='content_items', schema='creator')
    op.drop_table('content_items', schema='creator')
    op.drop_index('account_profile_snapshots_account_id_captured_at_idx', table_name='account_profile_snapshots', schema='creator')
    op.drop_table('account_profile_snapshots', schema='creator')
    op.drop_table('people', schema='creator')
    op.drop_table('metric_definitions', schema='creator')
    op.drop_table('accounts', schema='creator')
    # ### end Alembic commands ###
    for enum in ('platform_t', 'account_type_t', 'content_type_t', 'visibility_t', 'metric_scope_t',
                 'value_semantics_t', 'period_kind_t', 'verification_t', 'dimension_t', 'relation_t',
                 'comment_status_t', 'interaction_t', 'source_kind_t'):
        op.execute(f'DROP TYPE creator.{enum}')

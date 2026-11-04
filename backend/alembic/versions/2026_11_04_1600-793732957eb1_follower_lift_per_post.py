"""follower lift per post

Revision ID: 793732957eb1
Revises: a8c81933fec7
Create Date: 2026-11-04 16:00:56.003172

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '793732957eb1'
down_revision: Union[str, Sequence[str], None] = 'a8c81933fec7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Followers gained in the 3 days after a post (followers_3d), and how many posts shared that window.
VIEW = '''
CREATE OR REPLACE VIEW v_content_performance AS
WITH daily_follows AS (
    -- each platform's daily "followers gained" metric, latest capture per day
    SELECT DISTINCT ON (f.account_id, f.period_start) f.account_id, f.period_start, f.value
      FROM account_metric_facts f JOIN metric_definitions m USING (metric_id)
     WHERE f.period_kind = 'day' AND m.scope = 'account'
       AND (m.platform::text, m.metric_key) IN (('linkedin', 'new_followers'), ('youtube', 'subscribers_net'),
                                               ('tiktok', 'net_followers'), ('instagram', 'follows'))
     ORDER BY f.account_id, f.period_start, f.captured_at DESC
), lift AS (
    -- publish day + 2 days; NULL unless all 3 days are saved. Posts whose windows overlap (published within
    -- 2 days of each other) split those followers equally. ponytail: equal split, no baseline subtraction.
    SELECT c.content_id,
        (SELECT sum(d.value) FROM daily_follows d
          WHERE d.account_id = c.account_id
            AND d.period_start BETWEEN c.published_at::date AND c.published_at::date + 2
         HAVING count(*) = 3) AS gained,
        (SELECT count(*) FROM content_items o
          WHERE o.account_id = c.account_id AND o.published_at IS NOT NULL
            AND abs(o.published_at::date - c.published_at::date) <= 2)::integer AS posts_in_window
      FROM content_items c
     WHERE c.published_at IS NOT NULL
)
SELECT s.*,
    length(c.caption) AS caption_length,
    s.engagements / NULLIF(COALESCE(s.views, s.impressions), 0) AS engagement_rate,
    COALESCE(n.brief_count, 0)::integer AS brief_count,
    b.brief_id, b.label, b.active_from, b.topic, b.content_pillar, b.content_format, b.target_audience,
    b.audience_awareness, b.hook_text, b.hook_type, b.hook_duration_seconds, b.hook_visual, b.hook_audio,
    b.hook_technique, b.hook_promise, b.hook_pattern, b.script, b.narrative_structure, b.context, b.main_points,
    b.transitions, b.climax, b.cta, b.cta_placement, b.voiceover, b.audio_quality, b.accent, b.editing_style,
    b.editing_rhythm, b.pattern_interruptions, b.speed_changes, b.text_animation, b.intro_duration_seconds,
    b.outro_duration_seconds, b.opening_line, b.writing_style, b.writing_structure, b.main_message,
    b.storytelling, b.formatting, b.caption_cta, b.notes, b.updated_at,
    l.gained / l.posts_in_window AS followers_3d,
    l.posts_in_window AS followers_3d_posts
   FROM v_content_summary s
     JOIN content_items c USING (content_id)
     LEFT JOIN (SELECT DISTINCT ON (content_id) * FROM content_briefs ORDER BY content_id, brief_id DESC) b
       USING (content_id)
     LEFT JOIN (SELECT content_id, count(*) AS brief_count FROM content_briefs GROUP BY content_id) n
       USING (content_id)
     LEFT JOIN lift l USING (content_id)
'''

PREVIOUS = '''
CREATE OR REPLACE VIEW v_content_performance AS
SELECT s.*,
    length(c.caption) AS caption_length,
    s.engagements / NULLIF(COALESCE(s.views, s.impressions), 0) AS engagement_rate,
    COALESCE(n.brief_count, 0)::integer AS brief_count,
    b.brief_id, b.label, b.active_from, b.topic, b.content_pillar, b.content_format, b.target_audience,
    b.audience_awareness, b.hook_text, b.hook_type, b.hook_duration_seconds, b.hook_visual, b.hook_audio,
    b.hook_technique, b.hook_promise, b.hook_pattern, b.script, b.narrative_structure, b.context, b.main_points,
    b.transitions, b.climax, b.cta, b.cta_placement, b.voiceover, b.audio_quality, b.accent, b.editing_style,
    b.editing_rhythm, b.pattern_interruptions, b.speed_changes, b.text_animation, b.intro_duration_seconds,
    b.outro_duration_seconds, b.opening_line, b.writing_style, b.writing_structure, b.main_message,
    b.storytelling, b.formatting, b.caption_cta, b.notes, b.updated_at
   FROM v_content_summary s
     JOIN content_items c USING (content_id)
     LEFT JOIN (SELECT DISTINCT ON (content_id) * FROM content_briefs ORDER BY content_id, brief_id DESC) b
       USING (content_id)
     LEFT JOIN (SELECT content_id, count(*) AS brief_count FROM content_briefs GROUP BY content_id) n
       USING (content_id)
'''


def upgrade() -> None:
    """Upgrade schema."""
    op.execute('SET LOCAL search_path = creator, public')
    op.execute(VIEW)


def downgrade() -> None:
    """Downgrade schema."""
    op.execute('SET LOCAL search_path = creator, public')
    op.execute('DROP VIEW v_content_performance')  # OR REPLACE cannot drop the added columns
    op.execute(PREVIOUS.replace('CREATE OR REPLACE VIEW', 'CREATE VIEW'))

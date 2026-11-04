"""engagement rate falls back to impressions

Revision ID: a8c81933fec7
Revises: fe70d30f6ddd
Create Date: 2026-11-04 15:44:50.119278

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a8c81933fec7'
down_revision: Union[str, Sequence[str], None] = 'fe70d30f6ddd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# LinkedIn reports impressions, not views: engagement rate is per view, else per impression.
VIEW = '''
CREATE OR REPLACE VIEW v_content_performance AS
SELECT s.*,
    length(c.caption) AS caption_length,
    s.engagements / NULLIF(s.views, 0) AS engagement_rate,
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
OLD_RATE = 's.engagements / NULLIF(s.views, 0) AS engagement_rate'
NEW_RATE = 's.engagements / NULLIF(COALESCE(s.views, s.impressions), 0) AS engagement_rate'


def upgrade() -> None:
    """Upgrade schema."""
    op.execute('SET LOCAL search_path = creator, public')
    op.execute(VIEW.replace(OLD_RATE, NEW_RATE))


def downgrade() -> None:
    """Downgrade schema."""
    op.execute('SET LOCAL search_path = creator, public')
    op.execute(VIEW)

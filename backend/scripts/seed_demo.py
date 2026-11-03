"""Fills a demo database with four invented accounts, for judging the UI across platforms.

    docker compose exec db psql -U creator -d postgres -c 'create database creator_demo'
    cd backend
    export DATABASE_URL=postgresql://creator:creator@localhost:5433/creator_demo
    uv run alembic upgrade head && uv run python -m scripts.seed_demo

Refuses to run on any database not named creator_demo.
"""

import math
import random
from datetime import date, timedelta

from fastapi.testclient import TestClient

from core.conf import settings
from main import app

if not settings.DATABASE_URL.endswith('/creator_demo'):
    raise SystemExit('Refusing: DATABASE_URL must point at creator_demo.')

api = TestClient(app)
today = date.today()
random.seed(7)

# handle, platform, type, metrics, days of history, days since the last export
ACCOUNTS = [
    ('nadia.makes', 'youtube', 'channel', ['views', 'watch_time_hours', 'subscribers_net'], 500, 3),
    ('nadiamakes', 'tiktok', 'creator', ['video_views', 'likes', 'shares'], 500, 353),  # about to lose days
    ('nadia.makes.things', 'instagram', 'creator', ['views', 'interactions'], 60, 45),
    ('nadia-makes', 'linkedin', 'personal', ['impressions', 'engagements'], 700, 1),
]
TITLES = ['Why the first cut always fails', 'The bench tour', 'Three tools I stopped using', 'Sanding, slowly',
          'What a year of posting taught me', 'Reader questions, part 2', 'شكرا لكل من شارك هذا العمل']
TYPES = {'youtube': 'video', 'tiktok': 'short', 'instagram': 'reel', 'linkedin': 'text_post'}


def post(path, **body):
    r = api.post(f'/api/v1{path}', json=body)
    r.raise_for_status()
    return r.json()['data']


for handle, platform, kind, metrics, history, stale in ACCOUNTS:
    account = post('/tables/accounts', platform=platform, account_type=kind, handle=handle, display_name='Nadia Makes')
    days = [today - timedelta(days=stale + i) for i in range(history)]
    rows = []
    for d in days:
        base = 120 + 80 * math.sin(d.toordinal() / 40) + random.random() * 60
        spike = 900 * random.random() if random.random() < 0.03 else 0
        rows += [{'metric': m, 'value': round(max(base + spike, 0) / (i + 1)), 'period_start': str(d)} for i, m in enumerate(metrics)]
    post('/sync/account-metrics', account_id=account['account_id'], rows=rows, source_label='Demo data')
    items = [{'external_id': f'{handle}-{i}', 'title': t, 'content_type': TYPES[platform],
              'published_at': str(days[min(i * 12, len(days) - 1)]),
              'metrics': {'views' if platform != 'linkedin' else 'impressions': random.randint(800, 90000)}}
             for i, t in enumerate(TITLES)]
    post('/sync/content', account_id=account['account_id'], items=items, source_label='Demo data')
    content = api.get('/api/v1/tables/content_items', params={'account_id': account['account_id']}).json()['data']['rows']
    for c in content[:5]:  # leave a couple without a brief, like real life
        post('/tables/content_briefs', content_id=c['content_id'], topic=random.choice(['woodworking', 'tools', 'process']),
             content_format=random.choice(['tutorial', 'storytelling', 'vlog', 'listicle']),
             hook_type=random.choice(['question', 'bold claim', 'before/after', 'story']),
             audience_awareness=random.choice(['unaware', 'problem_aware', 'solution_aware']),
             cta_placement=random.choice(['end', 'caption_only', 'none']), voiceover=random.random() < 0.6)
    if platform == 'youtube':
        post('/sync/revenue', account_id=account['account_id'], rows=[
            {'metric': 'Estimated revenue', 'revenue_source': s, 'value': v, 'currency': 'USD', 'period_start': '2026-09-01', 'period_end': '2026-09-30'}
            for s, v in (('ads', 412.5), ('memberships', 96), ('super thanks', 18.25))])

print('Demo data ready.')

"""LinkedIn creator analytics export (Analytics > Content > Export, .xlsx)."""

import hashlib
import io
import re

from openpyxl import load_workbook
from sqlalchemy.ext.asyncio import AsyncSession

from app.creator.crud.crud_account import account_dao
from app.creator.crud.crud_content import content_dao
from app.creator.crud.crud_metric import metric_dao
from app.creator.service.sync_service import sync_service
from app.creator.utils.parse import num, us_date
from common.exception import errors

_TYPES = {'image': 'image_post', 'repost': 'repost', 'video': 'video', 'text': 'text_post',
          'article': 'article', 'document': 'document', 'poll': 'poll', 'carousel': 'carousel',
          'newsletter': 'newsletter_edition'}
_DIMS = {'company': 'company', 'job title': 'job_title', 'location': 'city', 'seniority': 'seniority',
         'industry': 'industry', 'company size': 'company_size'}
_POST_METRICS = {'impressions': 'impressions', 'members reached': 'members_reached',
                 'followers gained': 'followers_gained', 'profile viewers': 'profile_viewers_from_post',
                 'reactions': 'reactions', 'comments': 'comments', 'reposts': 'reposts',
                 'saves': 'saves', 'sends': 'sends'}


def _urn(url: str) -> str:
    m = re.search(r'(ugcPost|share|activity)-(\d+)', url)
    return f'urn:li:{m[1]}:{m[2]}' if m else url


class LinkedInService:
    @staticmethod
    async def import_xlsx(*, db: AsyncSession, account_id: int, data: bytes, file_name: str | None = None) -> dict:
        wb = load_workbook(io.BytesIO(data), read_only=True, data_only=True)
        sheets = {ws.title.upper(): [[('' if v is None else str(v)).strip() for v in r]
                                     for r in ws.iter_rows(values_only=True)] for ws in wb.worksheets}
        if not {'DISCOVERY', 'ENGAGEMENT'} & set(sheets):
            raise errors.RequestError(msg='not a LinkedIn analytics export (no DISCOVERY / ENGAGEMENT sheet)')
        if await account_dao.get_platform(db, account_id) != 'linkedin':
            raise errors.RequestError(msg='this is a LinkedIn export; choose a LinkedIn account')
        known = await content_dao.types_by_external_id(db, account_id)
        common = {'source_kind': 'xlsx_export', 'source_label': 'LinkedIn Analytics > Export',
                  'file_name': file_name, 'file_sha256': hashlib.sha256(data).hexdigest()}

        # account level: range totals, daily impressions/engagements, followers
        rows, rng = [], None
        for r in sheets.get('DISCOVERY', []):
            if r[0] == 'Overall Performance':
                start, end = (us_date(d) for d in r[1].split(' - '))
                rng = {'period_kind': 'range', 'period_start': start, 'period_end': end}
            elif rng and r[0] in ('Impressions', 'Members reached'):
                rows.append({'metric': r[0], 'value': num(r[1]), **rng})
        for r in sheets.get('ENGAGEMENT', [])[1:]:
            if r and r[0]:
                day = us_date(r[0])
                rows += [{'metric': 'impressions', 'value': num(r[1]), 'period_start': day},
                         {'metric': 'engagements', 'value': num(r[2]), 'period_start': day}]
        for r in sheets.get('FOLLOWERS', []):
            if r[0].startswith('Total followers on '):
                rows.append({'metric': 'total_followers', 'value': num(r[1]), 'period_kind': 'snapshot',
                             'period_start': us_date(r[0].removeprefix('Total followers on '))})
            elif re.fullmatch(r'\d+/\d+/\d{4}', r[0]):
                rows.append({'metric': 'new_followers', 'value': num(r[1]), 'period_start': us_date(r[0])})
        account = await sync_service.sync_account_metrics(
            db=db, account_id=account_id, rows=[r for r in rows if r['value'] is not None], **common)

        # posts: TOP POSTS has url/date/impressions (right-hand table); MOST RECENT POSTS has everything
        posts: dict[str, dict] = {}

        def post(url: str, date: str) -> dict:
            urn = _urn(url)
            return posts.setdefault(urn, {'external_id': urn, 'url': url, 'published_at': us_date(date),
                                          'metrics': {}})

        top = sheets.get('TOP POSTS', [])
        for r in top[next((i for i, r in enumerate(top) if r[:1] == ['Post URL']), len(top)) + 1:]:
            if len(r) > 6 and r[4]:
                post(r[4], r[5])['metrics']['impressions'] = num(r[6])
        recent = sheets.get('MOST RECENT POSTS', [])
        if recent:
            head = [h.lower() for h in recent[0]]
            for r in recent[1:]:
                if not r or not r[0]:
                    continue
                cells = dict(zip(head, r))
                p = post(cells['post url'], cells['post publish date'])
                p['content_type'] = _TYPES.get(cells.get('post type', '').lower(), 'text_post')
                p['metrics'].update({k: v for col, k in _POST_METRICS.items()
                                     if (v := num(cells.get(col, ''))) is not None})
        for urn, p in posts.items():
            p.setdefault('content_type', known.get(urn, 'text_post'))
            if rng and p['published_at'] < rng['period_start']:  # older post: numbers cover the window only
                p['period'] = rng
            if urn not in known:  # title from the URL slug only for posts we haven't seen
                m = re.search(r'/posts/[^_/]+_(.+?)-(?:ugcPost|share|activity)-\d+', p['url'])
                p['title'] = m[1].replace('-', ' ').capitalize() if m else None
        content = (await sync_service.sync_content(db=db, account_id=account_id, items=list(posts.values()), **common)
                   if posts else None)

        # demographics: followers vs. people who saw the content
        demo_rows = 0
        mids = await metric_dao.lookup(db, 'linkedin', 'audience')
        for sheet, metric in (('AUDIENCE DEMOGRAPHICS', 'follower_demographic_share'),
                              ('CONTENT DEMOGRAPHICS', 'demographic_share')):
            if metric not in mids:
                continue
            for r in sheets.get(sheet, [])[1:]:
                dim = _DIMS.get(r[0].lower()) if r and r[0] else None
                if dim is None:
                    continue
                # ponytail: LinkedIn shows "< 1%" without the exact value; stored as 0.5
                value = 0.5 if r[2].startswith('<') else num(r[2])
                await metric_dao.add_breakdown_fact(
                    db, account_id=account_id, dimension=dim, dimension_value=r[1], metric_id=mids[metric],
                    period_kind='range', period_start=rng and rng['period_start'],
                    period_end=rng and rng['period_end'], value=value, batch_id=account['batch_id'])
                demo_rows += 1
        await db.flush()
        return {'account_metrics': account, 'content': content, 'demographic_rows': demo_rows}


linkedin_service = LinkedInService()

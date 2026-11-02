from enum import StrEnum


class Platform(StrEnum):
    youtube = 'youtube'
    tiktok = 'tiktok'
    instagram = 'instagram'
    linkedin = 'linkedin'


class AccountType(StrEnum):
    channel = 'channel'  # YouTube channel
    personal = 'personal'  # TikTok general / Instagram personal / LinkedIn member
    creator = 'creator'  # Instagram/TikTok professional types
    business = 'business'
    company_page = 'company_page'  # out of scope, kept to avoid mixing it with personal


class ContentType(StrEnum):
    video = 'video'
    short = 'short'
    reel = 'reel'
    story = 'story'
    image_post = 'image_post'
    carousel = 'carousel'
    text_post = 'text_post'
    article = 'article'
    newsletter = 'newsletter'
    newsletter_edition = 'newsletter_edition'
    live = 'live'
    live_recording = 'live_recording'
    repost = 'repost'
    clip = 'clip'
    playlist = 'playlist'
    poll = 'poll'
    document = 'document'
    community_post = 'community_post'


class Visibility(StrEnum):
    public = 'public'
    unlisted = 'unlisted'
    private = 'private'
    connections_only = 'connections_only'
    followers_only = 'followers_only'
    group_only = 'group_only'
    scheduled = 'scheduled'
    draft = 'draft'
    archived = 'archived'
    removed = 'removed'
    unknown = 'unknown'


class MetricScope(StrEnum):
    account = 'account'
    content = 'content'
    audience = 'audience'
    live = 'live'
    revenue = 'revenue'


class ValueSemantics(StrEnum):
    period = 'period'  # value for a selected date range
    lifetime = 'lifetime'  # cumulative total
    point_in_time = 'point_in_time'  # e.g. realtime / current follower count
    rate = 'rate'  # percentage / ratio


class PeriodKind(StrEnum):
    lifetime = 'lifetime'
    day = 'day'
    week = 'week'
    month = 'month'
    year = 'year'
    range = 'range'
    first_24h = 'first_24h'
    realtime = 'realtime'
    snapshot = 'snapshot'


class Verification(StrEnum):
    verified_official = 'verified_official'
    secondary_only = 'secondary_only'
    unverified = 'unverified'


class Dimension(StrEnum):
    # demographics
    age_range = 'age_range'
    gender = 'gender'
    country = 'country'
    region = 'region'
    city = 'city'
    language = 'language'
    # activity
    hour_of_day = 'hour_of_day'
    day_of_week = 'day_of_week'
    # traffic / discovery
    traffic_source = 'traffic_source'
    search_term = 'search_term'
    external_source = 'external_source'
    suggested_video = 'suggested_video'
    discovery_surface = 'discovery_surface'
    # viewer type
    viewer_type = 'viewer_type'
    follower_status = 'follower_status'
    subscription_status = 'subscription_status'
    device = 'device'
    # professional (LinkedIn)
    job_title = 'job_title'
    industry = 'industry'
    seniority = 'seniority'
    company = 'company'
    company_size = 'company_size'
    # misc
    revenue_source = 'revenue_source'
    engagement_kind = 'engagement_kind'
    audience_also_follows = 'audience_also_follows'
    audience_also_watches = 'audience_also_watches'
    keyword = 'keyword'


class Relation(StrEnum):
    follower = 'follower'
    following = 'following'
    subscriber = 'subscriber'
    connection = 'connection'
    blocked = 'blocked'
    close_friend = 'close_friend'


class CommentStatus(StrEnum):
    published = 'published'
    held_for_review = 'held_for_review'
    filtered_spam = 'filtered_spam'
    filtered_keyword = 'filtered_keyword'
    hidden = 'hidden'
    removed_by_owner = 'removed_by_owner'
    deleted_observed = 'deleted_observed'


class Interaction(StrEnum):
    reaction = 'reaction'
    repost = 'repost'
    mention = 'mention'
    tag = 'tag'
    story_view = 'story_view'
    post_view = 'post_view'
    profile_view = 'profile_view'
    share = 'share'
    save = 'save'
    send = 'send'
    collab_invite = 'collab_invite'


class SourceKind(StrEnum):
    gui_manual = 'gui_manual'
    csv_export = 'csv_export'
    xlsx_export = 'xlsx_export'
    sheets_export = 'sheets_export'
    takeout_archive = 'takeout_archive'
    screenshot = 'screenshot'
    copy_paste = 'copy_paste'

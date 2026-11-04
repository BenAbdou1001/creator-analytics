// How the content_briefs columns are laid out on the post pages.

export const SECTIONS: [string, string[]][] = [
  ['Version', ['label', 'active_from']],
  ['Experiment', ['hypothesis', 'verdict', 'verdict_notes']],
  ['Attributes', ['topic', 'content_pillar', 'content_format', 'target_audience', 'audience_awareness']],
  ['Hook', ['hook_text', 'hook_type', 'hook_duration_seconds', 'hook_visual', 'hook_audio', 'hook_technique', 'hook_promise', 'hook_pattern']],
  ['Script', ['script', 'narrative_structure', 'context', 'main_points', 'transitions', 'climax', 'cta', 'cta_placement', 'voiceover', 'audio_quality', 'accent']],
  ['Editing & pacing', ['editing_style', 'editing_rhythm', 'pattern_interruptions', 'speed_changes', 'text_animation', 'intro_duration_seconds', 'outro_duration_seconds']],
  ['Written composition', ['opening_line', 'writing_style', 'writing_structure', 'main_message', 'storytelling', 'formatting', 'caption_cta']],
  ['Notes', ['notes']],
]

/** The content_items columns a person edits; the rest belong to sync/import. */
export const POST_FIELDS = ['account_id', 'external_id', 'content_type', 'title', 'caption', 'url', 'published_at', 'scheduled_for', 'visibility',
  'language', 'duration_seconds', 'thumbnail_url', 'is_collab']

/** Long prose: a textarea instead of a one-line input. */
export const LONG = new Set(['hypothesis', 'verdict_notes', 'caption', 'hook_text', 'script', 'context', 'main_message', 'notes'])

/** Free-text fields the breakdown groups on: suggest existing spellings so "Tech" and "tech" don't split. */
export const SUGGEST = ['topic', 'content_pillar', 'target_audience', 'hook_type', 'narrative_structure', 'editing_style', 'editing_rhythm', 'writing_style']

export const filled = (v: unknown) => v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)

export { AudiencePage } from './components/AudiencePage'

export interface AudienceSearch {
  account?: number
  metric?: number
}

export const validateAudienceSearch = (s: Record<string, unknown>): AudienceSearch => ({
  account: s.account ? Number(s.account) : undefined,
  metric: s.metric ? Number(s.metric) : undefined,
})

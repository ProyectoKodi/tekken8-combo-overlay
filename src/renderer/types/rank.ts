export interface RankData {
  playerName: string
  tekkenIdCode: string
  rank: string
  points: string
  glicko: string
  prowess: string
  region: string
  mainChar: string
  wins: number
  losses: number
  platform: string
  language: string
  message: string
  lastSeen: string
}

export const DEFAULT_PROFILE: RankData = {
  playerName: '',
  tekkenIdCode: '',
  rank: 'Beginner',
  points: '0',
  glicko: '',
  prowess: '',
  region: '',
  mainChar: 'Jin',
  wins: 0,
  losses: 0,
  platform: 'Steam',
  language: 'Spanish (Español)',
  message: '',
  lastSeen: '',
}

export function winRateOf(profile: Pick<RankData, 'wins' | 'losses'>): number {
  const wins = profile.wins ?? 0
  const losses = profile.losses ?? 0
  const total = wins + losses
  return total > 0 ? Math.round((wins / total) * 100) : 0
}

// Small, defensive helpers around the match shape coming from the socket
// backend: { id, competition, homeTeam, awayTeam, homeScore, awayScore,
// status, minute, stats: { possession: { home, away }, ... } }
//
// Every helper here assumes only `possession` is guaranteed and treats any
// other stat (shots, corners, cards, ...) as optional, so the UI degrades
// gracefully if the backend hasn't started sending it yet.

export function isLive(match) {
  return match?.status === 'LIVE'
}

export function isFinished(match) {
  return match?.status === 'FINISHED'
}

export function isUpcoming(match) {
  return match?.status === 'UPCOMING'
}

// The backend collapses everything into 3 top-level statuses (LIVE /
// FINISHED / UPCOMING), but the `minute` field still carries the *raw*
// football-data.org status string for anything that isn't live ("FINISHED",
// "SCHEDULED", "POSTPONED", "PAUSED", ...). This maps those raw values to
// short Turkish labels instead of leaking English API strings into the UI.
const RAW_MINUTE_LABELS = {
  CANLI: 'CANLI',
  FINISHED: 'MS',
  SCHEDULED: 'Planlandı',
  TIMED: 'Planlandı',
  POSTPONED: 'Ertelendi',
  SUSPENDED: 'Durduruldu',
  CANCELLED: 'İptal',
  AWARDED: 'Hükmen',
  PAUSED: 'Devre Arası',
}

export function getMinuteLabel(match) {
  const raw = match?.minute
  if (!raw) return '—'
  return RAW_MINUTE_LABELS[raw] ?? raw
}

// Fuller phrasing for the match-detail hero, where there's room for more
// than a compact badge label.
const RAW_HEADLINE_LABELS = {
  CANLI: 'CANLI',
  FINISHED: 'Maç Sona Erdi',
  SCHEDULED: 'Henüz Başlamadı',
  TIMED: 'Henüz Başlamadı',
  POSTPONED: 'Maç Ertelendi',
  SUSPENDED: 'Maç Durduruldu',
  CANCELLED: 'Maç İptal Edildi',
  AWARDED: 'Hükmen Sonuçlandı',
  PAUSED: 'Devre Arası',
}

export function getStatusHeadline(match) {
  const raw = match?.minute
  if (!raw) return 'Henüz Başlamadı'
  return RAW_HEADLINE_LABELS[raw] ?? raw
}

// football-data.org's free tier doesn't expose a live elapsed-minute count
// ("minute" is just the literal string "CANLI" for in-play matches), so
// there's no real number to drive a proportional match-clock fill. This
// only returns true if a genuine numeric minute ever shows up (e.g. after
// upgrading the API plan), so the header can fall back to a plain
// "something's live" indicator instead of a bar permanently stuck at 0%.
export function hasLiveClock(match) {
  if (!isLive(match)) return false
  return /\d/.test(String(match?.minute ?? ''))
}

export function getCompetitionList(matches) {
  return Array.from(new Set(matches.map((m) => m.competition).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, 'tr')
  )
}

export function groupByCompetition(matches) {
  const order = []
  const groups = new Map()

  for (const match of matches) {
    const key = match.competition || 'Diğer'
    if (!groups.has(key)) {
      groups.set(key, [])
      order.push(key)
    }
    groups.get(key).push(match)
  }

  return order.map((competition) => ({ competition, items: groups.get(competition) }))
}

// Turns a minute string like "67'" or "45+2'" into a 0-100 progress value
// for the header's live match-clock bar. Falls back to 0 for anything
// that isn't parseable (half-time, not-started, penalties, etc.)
export function minuteProgress(match) {
  const raw = match?.minute
  if (!raw) return 0
  const parsed = parseInt(String(raw).replace(/[^0-9]/g, ''), 10)
  if (Number.isNaN(parsed)) return 0
  return Math.min(100, Math.round((parsed / 90) * 100))
}

const STAT_DEFINITIONS = [
  { key: 'possession', label: 'Topla Oynama', unit: '%' },
  { key: 'shotsOnTarget', label: 'İsabetli Şut' },
  { key: 'shots', label: 'Toplam Şut' },
  { key: 'corners', label: 'Korner' },
  { key: 'fouls', label: 'Faul' },
  { key: 'yellowCards', label: 'Sarı Kart' },
  { key: 'redCards', label: 'Kırmızı Kart' },
]

// Only returns rows for stats that actually exist on this match, so the
// stats tab never shows an empty "0 - 0" row for data the backend doesn't
// send yet, and picks up new stat types automatically once it does.
export function buildStatRows(stats) {
  if (!stats) return []

  return STAT_DEFINITIONS.filter((row) => {
    const value = stats[row.key]
    return value && (value.home !== undefined || value.away !== undefined)
  }).map((row) => ({
    ...row,
    home: stats[row.key].home ?? 0,
    away: stats[row.key].away ?? 0,
  }))
}

export function isLive(match) {
  return match?.status === 'LIVE'
}

export function isFinished(match) {
  return match?.status === 'FINISHED'
}

export function isUpcoming(match) {
  return match?.status === 'UPCOMING'
}

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
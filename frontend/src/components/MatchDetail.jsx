import { Shield } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../lib/cn'
import { buildStatRows, getStatusHeadline, isFinished, isLive } from '../lib/matchUtils'
import EmptyState from './EmptyState'
import StatBar from './StatBar'

const TABS = [
  { key: 'overview', label: 'Genel Bakış' },
  { key: 'stats', label: 'İstatistikler' },
]

export default function MatchDetail({ match }) {
  const [tab, setTab] = useState('overview')

  if (!match) {
    return (
      <EmptyState
        title="Bir maç seçin"
        description="Canlı istatistikleri görmek için soldaki listeden bir maç seçin."
      />
    )
  }

  const live = isLive(match)
  const finished = isFinished(match)
  const statRows = buildStatRows(match.stats)

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-panel">
      <div className="border-b border-line bg-gradient-to-b from-panel-soft to-panel px-6 pb-5 pt-6 text-center">
        <span className="rounded-full border border-teal/20 bg-teal/10 px-3 py-1 font-display text-[11px] uppercase tracking-wider text-teal">
          {match.competition}
        </span>

        <div className="my-6 flex items-center justify-center gap-4 md:gap-10">
          <div className="flex-1 text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-ink md:h-16 md:w-16">
              <Shield className="h-6 w-6 text-gold md:h-7 md:w-7" />
            </div>
            <h3 className="font-display text-sm uppercase tracking-wide text-text md:text-base">
              {match.homeTeam}
            </h3>
          </div>

          <div className="shrink-0 text-center">
            <div className="font-mono text-4xl font-bold tracking-widest text-text md:text-5xl">
              {match.homeScore}
              <span className="mx-1 text-muted">:</span>
              {match.awayScore}
            </div>
            <span
              className={cn(
                'mt-3 inline-block rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold',
                live ? 'bg-away/15 text-away' : finished ? 'bg-line text-muted' : 'bg-teal/10 text-teal'
              )}
            >
              {live && <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-away" />}
              {getStatusHeadline(match)}
            </span>
          </div>

          <div className="flex-1 text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-ink md:h-16 md:w-16">
              <Shield className="h-6 w-6 text-away md:h-7 md:w-7" />
            </div>
            <h3 className="font-display text-sm uppercase tracking-wide text-text md:text-base">
              {match.awayTeam}
            </h3>
          </div>
        </div>
      </div>

      <div className="flex border-b border-line px-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'relative mr-6 py-3 font-display text-xs uppercase tracking-wider transition-colors focus-visible:outline-none',
              tab === t.key ? 'text-text' : 'text-muted hover:text-text'
            )}
          >
            {t.label}
            {tab === t.key && <span className="absolute -bottom-px left-0 right-0 h-[2px] rounded-full bg-gold" />}
          </button>
        ))}
      </div>

      <div className="p-6">
        {statRows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            Bu maç için henüz canlı istatistik gelmedi. Veri geldikçe burada görünecek.
          </p>
        ) : tab === 'overview' ? (
          <StatBar {...statRows[0]} />
        ) : (
          <div className="space-y-5">
            {statRows.map((row) => (
              <StatBar key={row.key} {...row} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

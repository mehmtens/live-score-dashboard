import { cn } from '../lib/cn'
import { getMinuteLabel, isFinished, isLive } from '../lib/matchUtils'

export default function MatchRow({ match, isSelected, onSelect }) {
  const live = isLive(match)
  const finished = isFinished(match)

  return (
    <button
      onClick={() => onSelect(match)}
      className={cn(
        'w-full rounded-xl border px-4 py-3.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40',
        isSelected
          ? 'border-gold/40 bg-panel shadow-[0_0_0_1px_rgba(245,185,66,0.15)]'
          : 'border-line bg-panel/60 hover:bg-panel'
      )}
    >
      <span
        className={cn(
          'mb-2 inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide',
          live ? 'bg-away/15 text-away' : finished ? 'bg-line text-muted' : 'bg-teal/10 text-teal'
        )}
      >
        {live && <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-away" />}
        {getMinuteLabel(match)}
      </span>

      <div className="flex items-center gap-3 text-sm">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-text">{match.homeTeam}</p>
          <p className="mt-1.5 truncate font-medium text-muted">{match.awayTeam}</p>
        </div>
        <div className="flex min-w-[2.75rem] flex-col items-center gap-1.5 rounded-lg border border-line bg-ink/60 px-2.5 py-1 font-mono text-base font-bold text-text">
          <span>{match.homeScore}</span>
          <span>{match.awayScore}</span>
        </div>
      </div>
    </button>
  )
}

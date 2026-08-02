import { Radio, Search } from 'lucide-react'
import { hasLiveClock, minuteProgress } from '../lib/matchUtils'

export default function Header({ isConnected, liveCount = 0, totalCount = 0, search, onSearchChange, liveMatch }) {
  const progress = liveMatch ? minuteProgress(liveMatch) : 0

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-ink/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:gap-6 md:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-panel">
            <Radio className="h-5 w-5 text-gold" />
          </div>
          <div>
            <h1 className="font-display text-2xl uppercase leading-none tracking-wide text-text">
              SAHA<span className="text-gold">.</span>
            </h1>
            <p className="font-sans text-[11px] tracking-wide text-muted">Canlı Skor Merkezi</p>
          </div>
        </div>

        <div className="flex flex-1 items-center gap-3 md:justify-end">
          <div className="relative flex-1 md:w-64 md:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Takım ara..."
              className="w-full rounded-full border border-line bg-panel py-2 pl-9 pr-3 text-sm text-text placeholder:text-muted focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/40"
            />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {isConnected ? (
              <>
                <div className="flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 font-mono text-xs font-bold text-red-500">
                  <span className="h-2 w-2 rounded-full animate-pulse bg-red-500" />
                  <span>CANLI · {liveCount}</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-line bg-panel px-3 py-1.5 font-mono text-xs text-muted">
                  <span>Toplam: {totalCount}</span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1.5 font-mono text-xs font-semibold text-away">
                <span className="h-2 w-2 rounded-full bg-away" />
                <span>BAĞLANTI YOK</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="h-[3px] w-full overflow-hidden bg-line/40">
        {liveMatch ? (
          hasLiveClock(liveMatch) ? (
            <div
              className="h-full bg-gradient-to-r from-gold/30 via-gold to-gold/30 transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          ) : (
            <div className="h-full w-2/5 animate-shimmer bg-gradient-to-r from-transparent via-gold to-transparent" />
          )
        ) : null}
      </div>
    </header>
  )
}
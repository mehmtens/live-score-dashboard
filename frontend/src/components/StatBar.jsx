export default function StatBar({ label, home, away, unit = '' }) {
  const total = home + away || 1
  const homePct = (home / total) * 100
  const awayPct = 100 - homePct

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between font-mono text-sm">
        <span className="font-semibold text-text">
          {home}
          {unit}
        </span>
        <span className="font-sans text-[11px] uppercase tracking-wider text-muted">{label}</span>
        <span className="font-semibold text-text">
          {away}
          {unit}
        </span>
      </div>
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-line">
        <div className="h-full bg-gold transition-all duration-500" style={{ width: `${homePct}%` }} />
        <div className="h-full bg-away/70 transition-all duration-500" style={{ width: `${awayPct}%` }} />
      </div>
    </div>
  )
}

import EmptyState from './EmptyState'
import MatchRow from './MatchRow'

export default function MatchList({ groups, selectedId, onSelect }) {
  if (groups.length === 0) {
    return <EmptyState title="Maç bulunamadı" description="Arama veya lig filtresini değiştirerek tekrar deneyin." />
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.competition}>
          <div className="mb-2.5 flex items-center justify-between px-1">
            <h2 className="font-display text-xs uppercase tracking-wider text-muted">{group.competition}</h2>
            <span className="font-mono text-[10px] text-muted/70">{group.items.length}</span>
          </div>
          <div className="space-y-2.5">
            {group.items.map((match) => (
              <MatchRow key={match.id} match={match} isSelected={selectedId === match.id} onSelect={onSelect} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

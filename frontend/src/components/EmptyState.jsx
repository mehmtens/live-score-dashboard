export default function EmptyState({ title, description }) {
  return (
    <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line px-6 text-center">
      <p className="font-display text-sm uppercase tracking-wide text-text">{title}</p>
      <p className="max-w-xs text-xs text-muted">{description}</p>
    </div>
  )
}

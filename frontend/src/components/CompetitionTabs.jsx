import { cn } from '../lib/cn'

export default function CompetitionTabs({ competitions, active, onChange }) {
  const tabs = ['TÜMÜ', ...competitions]

  return (
    <div className="no-scrollbar overflow-x-auto border-b border-line">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 md:px-8">
        {tabs.map((tab) => {
          const isActive = active === tab
          return (
            <button
              key={tab}
              onClick={() => onChange(tab)}
              className={cn(
                'relative whitespace-nowrap py-3 font-display text-xs uppercase tracking-wider transition-colors focus-visible:text-gold focus-visible:outline-none',
                isActive ? 'text-text' : 'text-muted hover:text-text'
              )}
            >
              {tab}
              {isActive && <span className="absolute -bottom-px left-0 right-0 h-[2px] rounded-full bg-gold" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

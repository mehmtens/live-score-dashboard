import { Shield } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../lib/cn'

const CONTAINER_SIZES = {
  sm: 'h-6 w-6 rounded-md',
  lg: 'h-14 w-14 rounded-2xl md:h-16 md:w-16',
}

const ICON_SIZES = {
  sm: 'h-3.5 w-3.5',
  lg: 'h-6 w-6 md:h-7 md:w-7',
}

// Real team crests come from the backend (football-data.org). Some teams
// don't have one, and image URLs can occasionally fail to load — either
// way we quietly fall back to a plain shield icon instead of a broken
// image icon.
export default function TeamCrest({ src, alt, accent = 'gold', size = 'lg', className }) {
  const [failed, setFailed] = useState(false)
  const showImage = Boolean(src) && !failed

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center border border-line bg-ink',
        CONTAINER_SIZES[size],
        className
      )}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-contain p-1.5"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <Shield className={cn(ICON_SIZES[size], accent === 'gold' ? 'text-gold' : 'text-away')} />
      )}
    </div>
  )
}

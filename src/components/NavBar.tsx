import { NavLink } from 'react-router-dom'
import { cn } from '../lib/utils'

interface NavBarProps {
  orgId?: string
  showLiveIndicator?: boolean
}

export function NavBar({ orgId, showLiveIndicator }: NavBarProps) {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'text-sm font-medium transition-colors',
      isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
    )

  return (
    <header className="flex items-center gap-6 px-6 py-4 border-b bg-background">
      <span className="text-sm font-semibold tracking-tight text-muted-foreground select-none">
        Azimut
      </span>
      <nav className="flex items-center gap-5">
        <NavLink to="/" end className={linkClass}>
          Transits
        </NavLink>
        <NavLink to="/vessels" className={linkClass}>
          Vessels
        </NavLink>
      </nav>
      <div className="ml-auto flex items-center gap-3">
        {orgId && (
          <span className="text-sm text-muted-foreground">{orgId}</span>
        )}
        {showLiveIndicator && (
          <span className="flex items-center gap-1.5 text-xs text-green-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            Live
          </span>
        )}
      </div>
    </header>
  )
}

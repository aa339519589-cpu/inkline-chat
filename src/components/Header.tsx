import { BatteryLow, BookOpen, Library, Route, Settings2, Sparkles } from 'lucide-react'

export type ViewName = 'learn' | 'library' | 'path' | 'grammar'

type HeaderProps = {
  view: ViewName
  onViewChange: (view: ViewName) => void
  onSettings: () => void
  gentleMode: boolean
  onGentleMode: () => void
}

const navItems = [
  { id: 'learn' as const, label: '学习', icon: BookOpen },
  { id: 'library' as const, label: '词库', icon: Library },
  { id: 'path' as const, label: '分组', icon: Route },
  { id: 'grammar' as const, label: '语法', icon: Sparkles },
]

export function Header({ view, onViewChange, onSettings, gentleMode, onGentleMode }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-row">
        <button className="brand" type="button" onClick={() => onViewChange('learn')} aria-label="返回学习">
          <span className="brand-mark">词</span>
          <span className="brand-copy">
            <strong>词境</strong>
            <small>3600</small>
          </span>
        </button>

        <div className="header-actions">
          <button
            className={gentleMode ? 'icon-button active' : 'icon-button'}
            type="button"
            onClick={onGentleMode}
            aria-label={gentleMode ? '标准节奏' : '轻量节奏'}
          >
            <BatteryLow size={18} strokeWidth={1.55} aria-hidden="true" />
          </button>
          <button className="icon-button" type="button" onClick={onSettings} aria-label="设置">
            <Settings2 size={18} strokeWidth={1.55} aria-hidden="true" />
          </button>
        </div>
      </div>

      <nav className="main-nav" aria-label="主导航">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            className={view === id ? 'nav-item active' : 'nav-item'}
            type="button"
            key={id}
            onClick={() => onViewChange(id)}
            aria-current={view === id ? 'page' : undefined}
          >
            <Icon size={17} strokeWidth={1.5} aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </header>
  )
}

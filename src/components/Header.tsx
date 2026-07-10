import { BatteryLow, BookOpenCheck, Library, Route, Settings2} from 'lucide-react'

export type ViewName = 'learn'| 'library' | 'path'

type HeaderProps = {
  view: ViewName
  onViewChange: (view: ViewName) => void
  onSettings: () => void
  gentleMode: boolean
  onGentleMode: () => void
}

const navItems = [
  { id: 'learn' as const, label: '\u5b66\u4e60', icon: BookOpenCheck },
  { id: 'library' as const, label: '\u8bcd\u5e93', icon: Library },
  { id: 'path' as const, label: '\u8def\u5f84', icon: Route },
]

export function Header({ view,onViewChange, onSettings, gentleMode, onGentleMode }: HeaderProps) {
  return (
    <header className="app-header">
      <button className="brand" type="button" onClick={() => onViewChange('learn')} aria-label="\u8fd4\u56de\u5b66\u4e60">
        <span className="brand-mark">\u8bcd</span>
        <span className="brand-copy">
          <strong>\u8bcd\u5883</strong>
          <small>3600</small>
        </span>
      </button>

      <nav className="main-nav" aria-label="\u4e3b\u5bfc\u822a">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            className={view === id ? 'nav-item active' : 'nav-item'}
            type="button"
            key={id}
            onClick={() => onViewChange(id)}
            aria-current={view=== id ? 'page' : undefined}
          >
            <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="header-actions">
        <button
          className={gentleMode ? 'icon-button active' : 'icon-button'}
          type="button"
          onClick={onGentleMode}
          title={gentleMode ? '\u6062\u590d\u6807\u51c6\u8282\u594f' : '\u8f7b\u4e00\u70b9'}
          aria-label={gentleMode ? '\u6062\u590d\u6807\u51c6\u8282\u594f' : '\u5207\u6362\u5230\u8f7b\u91cf\u5b66\u4e60'}
        >
          <BatteryLow size={19} strokeWidth={1.8} aria-hidden="true" />
        </button>
        <button className="icon-button" type="button" onClick={onSettings} title="\u8bbe\u7f6e" aria-label="\u6253\u5f00\u8bbe\u7f6e">
          <Settings2 size={19}strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>
    </header>
  )
}

import { useState } from 'react'
import { RotateCcw, X } from 'lucide-react'

type SettingsDrawerProps = {
  open: boolean
  gentleMode: boolean
  onClose: () => void
  onGentleMode: () => void
  onReset: () => void
}

export function SettingsDrawer({ open, gentleMode, onClose, onGentleMode, onReset }: SettingsDrawerProps) {
  const [confirmReset, setConfirmReset] = useState(false)
  if (!open) return null

  return (
    <div className="drawer-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="settings-drawer" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <div className="drawer-head">
          <div>
            <p className="eyebrow">\u8bbe\u7f6e</p>
            <h2 id="settings-title">\u8ba9\u8282\u594f\u9002\u5408\u4eca\u5929\u7684\u4f60</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="\u5173\u95ed\u8bbe\u7f6e">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="setting-row">
          <div>
            <strong>\u8f7b\u91cf\u8282\u594f</strong>
            <p>\u505c\u6b62\u5f15\u5165\u65b0\u8bcd\uff0c\u51cf\u5c11\u8f93\u5165\uff0c\u7528 3\u20135 \u5206\u949f\u5b8c\u6210\u4e00\u5c0f\u6bb5\u3002</p>
          </div>
          <button
            type="button"
            className={gentleMode ? 'toggle on' : 'toggle'}
            onClick={onGentleMode}
            role="switch"
            aria-checked={gentleMode}
            aria-label="\u8f7b\u91cf\u8282\u594f"
          ><span /></button>
        </div>

        <div className="setting-note">
          <strong>\u4e2d\u6587\u5982\u4f55\u51fa\u73b0</strong>
          <p>\u65b0\u8bcd\u3001\u7b54\u9519\u6216\u8bb0\u5fc6\u6a21\u7cca\u65f6\uff0c\u4e2d\u6587\u7528\u6765\u6821\u51c6\u3002\u7406\u89e3\u7a33\u5b9a\u540e\uff0c\u7cfb\u7edf\u4f1a\u8ba9\u82f1\u8bed\u81ea\u5df1\u5efa\u7acb\u8054\u7cfb\u3002</p>
        </div>

        <div className="reset-area">
          {!confirmReset ? (
            <button type="button" onClick={() => setConfirmReset(true)}>
              <RotateCcw size={17} aria-hidden="true" /> \u91cd\u7f6e\u672c\u673a\u5b66\u4e60\u8bb0\u5f55
            </button>
          ) : (
            <div className="reset-confirm">
              <p>\u6240\u6709\u8bb0\u5fc6\u8f68\u8ff9\u90fd\u4f1a\u4ece\u5934\u5f00\u59cb\u3002</p>
              <button type="button" onClick={onReset}>\u786e\u8ba4\u91cd\u7f6e</button>
              <button type="button" onClick={() => setConfirmReset(false)}>\u53d6\u6d88</button>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}

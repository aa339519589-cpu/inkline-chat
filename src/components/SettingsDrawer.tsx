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
            <p className="eyebrow">设置</p>
            <h2 id="settings-title">节奏</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭">
            <X size={19} aria-hidden="true" />
          </button>
        </div>

        <div className="setting-row">
          <strong>轻量</strong>
          <button
            type="button"
            className={gentleMode ? 'toggle on' : 'toggle'}
            onClick={onGentleMode}
            role="switch"
            aria-checked={gentleMode}
            aria-label="轻量节奏"
          ><span /></button>
        </div>

        <div className="reset-area">
          {!confirmReset ? (
            <button type="button" onClick={() => setConfirmReset(true)}>
              <RotateCcw size={16} aria-hidden="true" /> 重置记录
            </button>
          ) : (
            <div className="reset-confirm">
              <p>从头开始？</p>
              <button type="button" onClick={onReset}>重置</button>
              <button type="button" onClick={() => setConfirmReset(false)}>取消</button>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}

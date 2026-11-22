import { useEffect, useState } from 'react'
import { useOverlayStore } from '../store/overlayStore'
import { pushToast } from '../store/toastStore'
import { playDing } from '../utils/sound'

/** Acciones reasignables y sus descripciones (reutilizan help.hotkey_*). */
const ACTIONS: Array<{ id: string; descKey: string }> = [
  { id: 'toggleClickThrough', descKey: 'help.hotkey_f8' },
  { id: 'toggleOverlay', descKey: 'help.hotkey_f9' },
  { id: 'streamerMode', descKey: 'help.hotkey_f3' },
  { id: 'practicePrev', descKey: 'help.hotkey_f6' },
  { id: 'practiceNext', descKey: 'help.hotkey_f7' },
]

/** Convierte un KeyboardEvent en un acelerador de Electron ("Control+Shift+F8"). */
function accelFromEvent(e: KeyboardEvent): string {
  if (['Control', 'Alt', 'Shift', 'Meta', 'CapsLock'].includes(e.key)) return ''
  const parts: string[] = []
  if (e.ctrlKey) parts.push('Control')
  if (e.altKey) parts.push('Alt')
  if (e.shiftKey) parts.push('Shift')
  if (/^[a-z]$/i.test(e.key)) parts.push(e.key.toUpperCase())
  else if (/^F\d{1,2}$/.test(e.key) || /^[0-9]$/.test(e.key)) parts.push(e.key)
  else return ''
  return parts.join('+')
}

function HotkeyRow({ action, descKey }: { action: string; descKey: string }) {
  const t = useOverlayStore((s) => s.t)
  const [accel, setAccel] = useState('')
  const [capturing, setCapturing] = useState(false)

  useEffect(() => {
    window.electronAPI.getHotkeys().then((h) => setAccel(h[action] ?? ''))
  }, [action])

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (!capturing) return
    e.preventDefault()
    e.stopPropagation()
    const next = accelFromEvent(e.nativeEvent as KeyboardEvent)
    if (!next) return // solo modificador o tecla no soportada: seguimos esperando
    setCapturing(false)
    const res = await window.electronAPI.setHotkey(action, next)
    if (res.ok) {
      setAccel(next)
      pushToast(t('toasts.hotkey_updated'), 'ok')
    } else if (res.error === 'duplicate') {
      pushToast(t('toasts.hotkey_duplicate', { accel: next }), 'warn', 5000)
    } else {
      pushToast(t('toasts.hotkey_failed', { accel: next }), 'error', 5000)
    }
  }

  return (
    <li className="flex gap-2 items-center">
      <button
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onClick={() => setCapturing(true)}
        onBlur={() => setCapturing(false)}
        className={`min-w-[86px] text-center bg-white/10 px-1.5 py-0.5 rounded text-[10px] font-mono border cursor-pointer transition-colors ${
          capturing
            ? 'border-overlay-accent text-overlay-accent bg-overlay-accent/10 animate-pulse'
            : 'text-white border-white/20 hover:border-white/40'
        }`}
        title={capturing ? t('hotkeys.capturing') : t('hotkeys.hint')}
      >
        {capturing ? '…' : accel || '—'}
      </button>
      <span className="text-white/70 leading-snug">{t(descKey)}</span>
    </li>
  )
}

export default function HelpModal({ onClose }: { onClose: () => void }) {
  const t = useOverlayStore((s) => s.t)

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 no-drag backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div className="bg-[#12121a] border border-white/10 rounded-xl w-full max-w-md shadow-2xl max-h-[calc(100vh-2rem)] flex flex-col" onClick={(e) => e.stopPropagation()}>

        <div className="flex items-center justify-between border-b border-white/10 pb-2 px-5 pt-4 flex-shrink-0">
          <h2 className="text-sm font-hud font-bold text-overlay-accent uppercase tracking-wider">
            {t('help.title')}
          </h2>
          <button onClick={onClose} className="text-white/40 hover:text-white text-lg leading-none">✕</button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto custom-scroll px-5 py-4 space-y-4 text-xs font-hud text-white/80">

          {/* SECCIÓN ATAJOS (reasignables) */}
          <div>
            <h3 className="text-[11px] font-bold text-sky-400 mb-1.5">{t('help.hotkeys_title')}</h3>
            <ul className="space-y-1.5">
              {ACTIONS.map((a) => (
                <HotkeyRow key={a.id} action={a.id} descKey={a.descKey} />
              ))}
            </ul>
            <p className="mt-2 text-[9px] text-white/35 leading-snug">{t('hotkeys.hint')}</p>
          </div>

          {/* SECCIÓN INTERFAZ */}
          <div>
            <h3 className="text-[11px] font-bold text-sky-400 mb-1.5">{t('help.ui_title')}</h3>
            <ul className="space-y-1.5">
              <li className="flex gap-2 items-start"><span className="text-sm">🔒</span> <span>{t('help.ui_lock')}</span></li>
              <li className="flex gap-2 items-start"><span className="text-sm">👁️</span> <span>{t('help.ui_eye')}</span></li>
              <li className="flex gap-2 items-start"><span className="text-sm">🏆</span> <span>{t('help.ui_trophy')}</span></li>
              <li className="flex gap-2 items-start"><span className="text-sm">📏</span> <span>{t('help.ui_ruler')}</span></li>
              <li className="flex gap-2 items-start"><span className="text-sm">✏️</span> <span>{t('help.ui_note')}</span></li>
            </ul>
          </div>

          {/* SECCIÓN RESPALDOS */}
          <BackupsSection />

          {/* SECCIÓN AJUSTES */}
          <SettingsSection />

          {/* SECCIÓN DISCORD RICH PRESENCE */}
          <DiscordSection />

        </div>

        <div className="mt-2 flex justify-end px-5 pb-4 flex-shrink-0">
          <button onClick={onClose} className="text-xs font-bold px-4 py-1.5 rounded bg-overlay-accent text-black hover:opacity-90">
            {t('help.ui_close')}
          </button>
        </div>
      </div>
    </div>
  )
}

function DiscordSection() {
  const t = useOverlayStore((s) => s.t)
  const [clientId, setClientId] = useState('')
  const [status, setStatus] = useState<string>('disabled')

  useEffect(() => {
    window.electronAPI.getUserPrefs().then((p) => setClientId(p.discordClientId || ''))
    window.electronAPI.getDiscordStatus().then(setStatus)
  }, [])

  const save = async () => {
    const res = await window.electronAPI.setDiscordClientId(clientId)
    setStatus(res.status)
    pushToast(t('toasts.discord_saved'), 'ok')
  }

  const statusLabel = status === 'connected'
    ? '🟢 Conectado'
    : status === 'not-running'
      ? '⚪ Discord no está en ejecución'
      : '⚫ Sin Client ID'

  return (
    <div>
      <h3 className="text-[11px] font-bold text-sky-400 mb-1.5">🎮 Discord Rich Presence</h3>
      <p className="text-[10px] text-white/50 leading-snug mb-2">
        Ya está preconfigurado con la aplicación oficial del overlay: abre un combo en
        práctica y Discord mostrará personaje, rango y progreso automáticamente.
        Para la imagen del personaje y el emblema se usan los assets de la aplicación
        oficial. Solo si quieres probar con tu propia aplicación, pega aquí su Client ID
        (discord.com/developers → tu app → Application ID) y pulsa Guardar.
      </p>
      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        <input
          type="text"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          placeholder="Client ID de la aplicación…"
          className="flex-1 bg-black/40 border border-white/20 rounded px-2 py-1 text-[10px] font-mono text-white outline-none focus:border-overlay-accent"
        />
        <button onClick={save} className="text-[10px] px-2 py-1 bg-overlay-accent/20 text-overlay-accent rounded hover:bg-overlay-accent/30 font-bold">Guardar</button>
      </div>
      <p className="mt-1 text-[9px] text-white/40">{statusLabel}</p>
    </div>
  )
}

/** Respaldos automáticos: listar y restaurar con un clic. */
function BackupsSection() {
  const t = useOverlayStore((s) => s.t)
  const [backups, setBackups] = useState<Array<{ file: string; mtimeMs: number; size: number }>>([])
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    window.electronAPI.listBackups().then(setBackups).catch(() => {})
  }, [])

  const restore = async (file: string) => {
    setBusy(file)
    try {
      const res = await window.electronAPI.restoreBackup(file)
      if (res.ok) {
        pushToast(t('toasts.backup_restored'), 'ok')
        // Re-aplicar preferencias y favoritos sin reiniciar
        await useOverlayStore.getState().initPrefs()
        useOverlayStore.getState().loadFavorites()
      } else {
        pushToast(t('toasts.backup_failed'), 'warn')
      }
    } finally {
      setBusy(null)
    }
  }

  return (
    <div>
      <h3 className="text-[11px] font-bold text-sky-400 mb-1.5">📦 {t('help.backups')}</h3>
      {backups.length === 0 ? (
        <p className="text-[10px] text-white/40">{t('help.no_backups')}</p>
      ) : (
        <ul className="space-y-1">
          {backups.map((b) => (
            <li key={b.file} className="flex items-center gap-2 text-[10px]">
              <span className="text-white/60 font-mono truncate flex-1">
                {b.file.replace('perfil-', '').replace('.json', '')} · {(b.size / 1024).toFixed(0)} KB
              </span>
              <button
                onClick={() => restore(b.file)}
                disabled={busy === b.file}
                className="text-[9px] px-2 py-0.5 rounded bg-overlay-accent/20 text-overlay-accent hover:bg-overlay-accent/30 font-bold disabled:opacity-50 flex-shrink-0"
              >
                {busy === b.file ? '…' : t('help.restore')}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Ajustes de comportamiento: barra de acciones y vista inicial. */
function SettingsSection() {
  const t = useOverlayStore((s) => s.t)
  const alwaysShowActions = useOverlayStore((s) => s.alwaysShowActions)
  const setAlwaysShowActions = useOverlayStore((s) => s.setAlwaysShowActions)
  const restoreLastView = useOverlayStore((s) => s.restoreLastView)
  const setRestoreLastView = useOverlayStore((s) => s.setRestoreLastView)
  const oled = useOverlayStore((s) => s.oled)
  const setOled = useOverlayStore((s) => s.setOled)
  const soundFeedback = useOverlayStore((s) => s.soundFeedback)
  const setSoundFeedback = useOverlayStore((s) => s.setSoundFeedback)

  const row = 'flex items-center justify-between gap-2 py-1'
  const box = 'w-8 h-4 rounded-full transition-colors relative cursor-pointer flex-shrink-0'
  const dot = 'absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all'

  return (
    <div>
      <h3 className="text-[11px] font-bold text-sky-400 mb-1.5">⚙️ {t('settings.title')}</h3>
      <div className={row}>
        <span className="text-[10px] text-white/70">{t('settings.always_actions')}<br /><span className="text-white/40">{t('settings.always_actions_hint')}</span></span>
        <button onClick={() => setAlwaysShowActions(!alwaysShowActions)} className={`${box} ${alwaysShowActions ? 'bg-overlay-accent' : 'bg-white/15'}`} title={t('settings.always_actions')}>
          <span className={`${dot} ${alwaysShowActions ? 'left-[18px]' : 'left-0.5'}`} />
        </button>
      </div>
      <div className={row}>
        <span className="text-[10px] text-white/70">{t('settings.restore_last_view')}<br /><span className="text-white/40">{t('settings.restore_last_view_hint')}</span></span>
        <button onClick={() => setRestoreLastView(!restoreLastView)} className={`${box} ${restoreLastView ? 'bg-overlay-accent' : 'bg-white/15'}`} title={t('settings.restore_last_view')}>
          <span className={`${dot} ${restoreLastView ? 'left-[18px]' : 'left-0.5'}`} />
        </button>
      </div>
      <div className={row}>
        <span className="text-[10px] text-white/70">{t('settings.oled')}<br /><span className="text-white/40">{t('settings.oled_hint')}</span></span>
        <button onClick={() => setOled(!oled)} className={`${box} ${oled ? 'bg-overlay-accent' : 'bg-white/15'}`} title={t('settings.oled')}>
          <span className={`${dot} ${oled ? 'left-[18px]' : 'left-0.5'}`} />
        </button>
      </div>
      <div className={row}>
        <span className="text-[10px] text-white/70">{t('settings.sound_feedback')}<br /><span className="text-white/40">{t('settings.sound_feedback_hint')}</span></span>
        <button onClick={() => { if (!soundFeedback) playDing(); setSoundFeedback(!soundFeedback) }} className={`${box} ${soundFeedback ? 'bg-overlay-accent' : 'bg-white/15'}`} title={t('settings.sound_feedback')}>
          <span className={`${dot} ${soundFeedback ? 'left-[18px]' : 'left-0.5'}`} />
        </button>
      </div>
    </div>
  )
}

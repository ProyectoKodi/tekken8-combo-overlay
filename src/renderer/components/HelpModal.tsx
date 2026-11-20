import { useOverlayStore } from '../store/overlayStore'

export default function HelpModal({ onClose }: { onClose: () => void }) {
  const { t } = useOverlayStore()

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 no-drag backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div className="bg-[#12121a] border border-white/10 rounded-xl w-full max-w-md p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        
        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
          <h2 className="text-sm font-hud font-bold text-overlay-accent uppercase tracking-wider">
            {t('help.title')}
          </h2>
          <button onClick={onClose} className="text-white/40 hover:text-white text-lg leading-none">✕</button>
        </div>

        <div className="space-y-4 text-xs font-hud text-white/80">
          
          {/* SECCIÓN ATAJOS */}
          <div>
            <h3 className="text-[11px] font-bold text-sky-400 mb-1.5">{t('help.hotkeys_title')}</h3>
            <ul className="space-y-1.5">
              <li className="flex gap-2 items-start"><kbd className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] font-mono text-white border border-white/20">F8</kbd> <span>{t('help.hotkey_f8')}</span></li>
              <li className="flex gap-2 items-start"><kbd className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] font-mono text-white border border-white/20">F9</kbd> <span>{t('help.hotkey_f9')}</span></li>
              <li className="flex gap-2 items-start"><kbd className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] font-mono text-white border border-white/20">F1</kbd> <span>{t('help.hotkey_f1')}</span></li>
              <li className="flex gap-2 items-start"><kbd className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] font-mono text-white border border-white/20">F3</kbd> <span>{t('help.hotkey_f3')}</span></li>
            </ul>
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

        </div>

        <div className="mt-5 flex justify-end">
          <button onClick={onClose} className="text-xs font-bold px-4 py-1.5 rounded bg-overlay-accent text-black hover:opacity-90">
            {t('help.ui_close')}
          </button>
        </div>
      </div>
    </div>
  )
}
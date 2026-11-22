import { useToastStore, type ToastType } from '../store/toastStore'

const ICONS: Record<ToastType, string> = { ok: '✅', warn: '⚠️', error: '❌', info: 'ℹ️' }

const STYLE: Record<ToastType, string> = {
  ok: 'bg-emerald-950/90 border-emerald-500/30',
  warn: 'bg-amber-950/90 border-amber-500/40',
  error: 'bg-rose-950/90 border-rose-500/40',
  info: 'bg-zinc-900/95 border-white/15',
}

/**
 * Notificaciones unificadas (esquina inferior derecha). Reemplaza los
 * textos efímeros dispersos ("¡Copiado!", estado de sync, errores…).
 * Un clic descarta el toast manualmente.
 */
export default function Toasts() {
  const toasts = useToastStore((s) => s.toasts)
  const remove = useToastStore((s) => s.remove)

  return (
    <div className="fixed bottom-3 right-3 z-[100] flex flex-col items-end gap-2 pointer-events-none">
      {toasts.map((toast) => {
        const featured = !!toast.images?.length
        return (
          <button
            key={toast.id}
            onClick={() => { remove(toast.id); toast.action?.() }}
            className={`toast pointer-events-auto text-left font-hud rounded-xl border shadow-2xl flex items-center cursor-pointer hover:brightness-110 transition-all ${
              featured
                ? 'max-w-[360px] pl-2 pr-4 py-2 gap-3'
                : 'max-w-[280px] text-[10px] px-3 py-2 gap-2'
            } ${STYLE[toast.type]}`}
            title={toast.action ? 'Ver los combos nuevos' : 'Descartar'}
          >
            {featured ? (
              <>
                <div className="flex -space-x-3">
                  {toast.images!.map((img) => (
                    <img
                      key={img}
                      src={img}
                      alt=""
                      draggable={false}
                      className="w-14 h-14 rounded-xl object-cover object-top border-2 border-white/20 shadow-lg"
                    />
                  ))}
                </div>
                <span className="text-[11px] font-bold text-white/90 leading-snug">{toast.message}</span>
              </>
            ) : (
              <>
                <span className="flex-shrink-0">{ICONS[toast.type]}</span>
                <span className="text-white/85 leading-snug">{toast.message}</span>
              </>
            )}
          </button>
        )
      })}
    </div>
  )
}

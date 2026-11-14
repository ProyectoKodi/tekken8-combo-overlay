import { useRef, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useOverlayStore } from '../store/overlayStore'
import { isSeparator } from '../types/combo'
import ComboCard from './ComboCard'

// --- NUEVA ANIMACIÓN DE CARGA ---
function LoadingAnimation() {
  const { t } = useOverlayStore()
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full gap-4 animate-fadeIn cursor-crosshair">
      {/* Anillo exterior giratorio */}
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-white/5 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-overlay-accent rounded-full border-t-transparent animate-spin drop-shadow-[0_0_10px_rgba(255,200,0,0.5)]"></div>
        {/* Punto central que late */}
        <div className="absolute inset-0 m-auto w-4 h-4 bg-overlay-accent rounded-full animate-ping opacity-75"></div>
        <div className="absolute inset-0 m-auto w-3 h-3 bg-white rounded-full shadow-[0_0_15px_#fff]"></div>
      </div>
      
      {/* Texto parpadeante */}
      <div className="flex flex-col items-center gap-1 animate-pulse">
        <span className="text-sm font-hud font-bold text-overlay-accent tracking-widest uppercase">
          {t('labels.loading') || 'Cargando...'}
        </span>
        <span className="text-[10px] font-mono text-white/30">
          Tekken 8 Data Sync
        </span>
      </div>
    </div>
  )
}

export default function ComboList() {
  const { loading, error, filteredCombos, selectedCharacter, refreshCombos, t } = useOverlayStore()
  const parentRef = useRef<HTMLDivElement>(null)
  const items = filteredCombos()

  const estimateSize = useCallback(
    (index: number) => (isSeparator(items[index]) ? 28 : 130),
    [items]
  )

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan: 5,
  })

  if (loading) {
    return <LoadingAnimation />
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4 text-center cursor-crosshair">
        <span className="text-3xl">⚠️</span>
        <p className="text-sm text-white/60 font-hud">{t('labels.load_error')}</p>
        <p className="text-xs text-white/30 font-mono break-all">{error}</p>
        <button
          onClick={refreshCombos}
          className="mt-2 text-xs font-hud px-4 py-1.5 bg-overlay-accent/20 hover:bg-overlay-accent/40 border border-overlay-accent/30 text-overlay-accent rounded-lg transition-colors no-drag cursor-pointer"
        >
          {t('labels.retry')}
        </button>
      </div>
    )
  }

  if (!selectedCharacter) return null

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center cursor-crosshair">
        <span className="text-2xl">🥋</span>
        <p className="text-sm text-white/50 font-hud">{t('labels.no_combos')}</p>
        <p className="text-xs text-white/25">{t('labels.no_combos_hint')}</p>
      </div>
    )
  }

  return (
    <div ref={parentRef} className="flex-1 combo-scroll cursor-crosshair">
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }} className="pt-1">
        {virtualizer.getVirtualItems().map((vItem) => {
          const listItem = items[vItem.index]
          return (
            <div
              key={vItem.key}
              style={{
                position: 'absolute', top: 0, left: 0, width: '100%',
                transform: `translateY(${vItem.start}px)`,
              }}
            >
              {isSeparator(listItem) ? (
                <div className="mx-4 my-1 flex items-center gap-2">
                  <div className="h-px flex-1 bg-white/8" />
                  <span className="text-[9px] font-hud text-white/25 uppercase tracking-widest">
                    {t('labels.all_combos') || 'Todos los combos'}
                  </span>
                  <div className="h-px flex-1 bg-white/8" />
                </div>
              ) : (
                <ComboCard combo={listItem} index={vItem.index} style={{ marginBottom: 0 }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
import { useEffect, useMemo, useState } from 'react'
import type { RankData } from '../types/rank'
import { bannerBackground, bannerPortrait, bannerRankArt } from '../utils/bannerAssets'
import { useOverlayStore } from '../store/overlayStore'
import { pushToast } from '../store/toastStore'

interface Props {
  profile: RankData
  onEdit?: () => void
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/** Desvanece el borde inferior del retrato para que no corte en seco. */
const PORTRAIT_MASK = 'linear-gradient(to top, transparent 0%, #000 14%, #000 100%)'

export default function PlayerBanner({ profile, onEdit }: Props) {
  const t = useOverlayStore((s) => s.t)
  const customBannerUrl = useOverlayStore((s) => s.customBannerUrl)
  const [bgFailed, setBgFailed] = useState(false)
  const seed = profile.mainChar || profile.playerName || 'tekken'
  const customBg = useMemo(() => bannerBackground(profile.background, seed, customBannerUrl), [profile.background, seed, customBannerUrl])
  const autoBg = useMemo(() => bannerBackground(undefined, seed), [seed])
  // Si el fondo propio falla (archivo borrado/corrupto) se cae al automático:
  // nunca se queda en negro.
  const background = bgFailed || !customBg ? autoBg : customBg
  useEffect(() => { setBgFailed(false) }, [customBg, profile.background])
  const portrait = useMemo(() => bannerPortrait(profile.mainChar), [profile.mainChar])
  const rankArt = useMemo(() => bannerRankArt(profile.rank), [profile.rank])

  // Exportar/importar perfil (vive aquí, en el banner, como pidió el usuario)
  const handleExport = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const res = await window.electronAPI.exportProfile()
    if (res.ok) pushToast(t('toasts.exported'), 'ok')
  }
  const handleImport = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const res = await window.electronAPI.importProfile()
    if (res.ok) {
      // El perfil trae favoritos y preferencias (tema, idioma, ficha de rango)
      await useOverlayStore.getState().loadFavorites()
      await useOverlayStore.getState().initPrefs()
      pushToast(t('toasts.imported'), 'ok')
    } else if (res.error && res.error !== 'Cancelado') {
      pushToast(t('toasts.import_error'), 'error')
    }
  }

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-white/10 no-drag shadow-2xl" style={{ height: 118 }}>
      {background && (
        <img src={background} alt="" onError={() => setBgFailed(true)} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      )}

      {/* Luz cálida detrás del retrato y degradados suaves: el fondo respira */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[150px] bg-[radial-gradient(circle_at_30%_80%,rgba(251,191,36,0.16),transparent_68%)]" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-black/75" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

      <div className="relative flex h-full">
        {/* Retrato del personaje principal, fundido con el fondo. El alto del
            banner (118 px) va ligado a la altura del retrato (114 px): la cara
            manda sobre el tamaño de la ficha. */}
        <div className="relative w-[92px] shrink-0">
          {portrait ? (
            <img
              src={portrait}
              alt={profile.mainChar}
              draggable={false}
              className="absolute bottom-0 left-1/2 h-[114px] w-[92px] -translate-x-1/2 object-contain object-bottom drop-shadow-[0_6px_14px_rgba(0,0,0,0.85)]"
              style={{ maskImage: PORTRAIT_MASK, WebkitMaskImage: PORTRAIT_MASK }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-3xl font-black text-white/20">
              {initials(profile.mainChar || profile.playerName || '?')}
            </div>
          )}
        </div>

        {/* Datos del jugador */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-2 pr-2">
          <div className="flex items-center gap-1.5">
            <h2 className="truncate text-[19px] font-black leading-tight tracking-wide text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
              {profile.playerName || 'Jugador'}
            </h2>
            {onEdit && (
              <>
                <button
                  onClick={handleExport}
                  className="shrink-0 rounded border border-white/10 bg-white/5 px-1 py-0.5 text-[9px] text-white/50 transition-colors hover:border-white/30 hover:text-white"
                  title={t('tips.export_profile')}
                >
                  ⬇
                </button>
                <button
                  onClick={handleImport}
                  className="shrink-0 rounded border border-white/10 bg-white/5 px-1 py-0.5 text-[9px] text-white/50 transition-colors hover:border-white/30 hover:text-white"
                  title={t('tips.import_profile')}
                >
                  ⬆
                </button>
                <button
                  onClick={onEdit}
                  className="shrink-0 rounded border border-white/10 bg-white/5 px-1 py-0.5 text-[9px] text-white/50 transition-colors hover:border-white/30 hover:text-white"
                  title={t('tips.edit_profile')}
                >
                  ⚙️
                </button>
              </>
            )}
          </div>

          <button
            onClick={() => profile.tekkenIdCode && navigator.clipboard.writeText(profile.tekkenIdCode).catch(() => {})}
            className="block max-w-full truncate text-left font-mono text-[9px] text-cyan-300/70 hover:text-cyan-200"
            title={profile.tekkenIdCode ? t('tips.copy_id') : t('labels.no_tekken_id')}
          >
            {profile.tekkenIdCode
              ? `ID Tekken: ${profile.tekkenIdCode}${profile.platform ? ` · ${profile.platform}` : ''}`
              : 'Sin ID Tekken'}
          </button>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] text-white/60">
            {profile.region && <span className="truncate">🌐 {profile.region}</span>}
            {profile.prowess && <span className="text-amber-300/90">⚡ {profile.prowess}</span>}
          </div>

          {profile.message && (
            <p className="truncate text-[9px] italic text-white/45">“{profile.message}”</p>
          )}
        </div>

        {/* Rango */}
        <div className="flex w-[120px] shrink-0 flex-col items-center justify-center gap-0.5 pr-2">
          {rankArt ? (
            <img
              src={rankArt}
              alt={profile.rank}
              draggable={false}
              className="w-[104px] drop-shadow-[0_3px_10px_rgba(0,0,0,0.85)]"
            />
          ) : (
            <span className="text-center text-sm font-black uppercase leading-tight text-amber-300">{profile.rank || 'Sin rango'}</span>
          )}
          <span className="text-[8px] uppercase tracking-[0.18em] text-white/45 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">Rango actual</span>
        </div>
      </div>
    </div>
  )
}

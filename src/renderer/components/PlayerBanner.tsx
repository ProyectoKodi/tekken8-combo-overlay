import { useMemo } from 'react'
import type { RankData } from '../types/rank'
import { bannerBackground, bannerPortrait, bannerRankArt } from '../utils/bannerAssets'

interface Props {
  profile: RankData
  compact?: boolean
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

export default function PlayerBanner({ profile, compact, onEdit }: Props) {
  const seed = profile.mainChar || profile.playerName || 'tekken'
  const background = useMemo(() => bannerBackground(profile.background, seed), [profile.background, seed])
  const portrait = useMemo(() => bannerPortrait(profile.mainChar), [profile.mainChar])
  const rankArt = useMemo(() => bannerRankArt(profile.rank), [profile.rank])

  if (compact) {
    return (
      <div className="relative flex h-[44px] w-full min-w-0 items-center gap-2 overflow-hidden rounded-lg border border-white/10 no-drag">
        {background && (
          <img src={background} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/35 to-black/75" />

        {portrait ? (
          <img
            src={portrait}
            alt={profile.mainChar}
            draggable={false}
            className="relative ml-1 h-[40px] w-[34px] shrink-0 object-contain object-bottom"
          />
        ) : (
          <div className="relative ml-1 flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded bg-white/10 text-[10px] font-black text-white/50">
            {initials(profile.mainChar || '?')}
          </div>
        )}

        <div className="relative min-w-0 flex-1">
          <p className="truncate text-[11px] font-bold leading-tight text-white">{profile.playerName || 'Jugador'}</p>
          <p className="truncate text-[9px] leading-tight text-white/45">
            {profile.region || 'Sin región'}
            {profile.prowess ? ` · ⚡ ${profile.prowess}` : ''}
          </p>
        </div>

        {onEdit && (
          <button
            onClick={onEdit}
            className="relative shrink-0 rounded border border-white/10 bg-white/5 px-1 py-0.5 text-[9px] text-white/50 hover:text-white"
            title="Editar perfil"
          >
            ⚙️
          </button>
        )}

        <div className="relative mr-1 flex h-[36px] w-[80px] shrink-0 items-center justify-end">
          {rankArt ? (
            <img src={rankArt} alt={profile.rank} draggable={false} className="max-h-full w-auto drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]" />
          ) : (
            <span className="truncate text-[9px] font-black uppercase text-amber-300">{profile.rank}</span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-white/10 no-drag shadow-2xl" style={{ height: 188 }}>
      {background && (
        <img src={background} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      )}

      {/* Luz cálida detrás del retrato y degradados suaves: el fondo respira */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[220px] bg-[radial-gradient(circle_at_30%_80%,rgba(251,191,36,0.16),transparent_68%)]" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-black/75" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

      <div className="relative flex h-full">
        {/* Retrato del personaje principal, fundido con el fondo */}
        <div className="relative w-[132px] shrink-0">
          {portrait ? (
            <img
              src={portrait}
              alt={profile.mainChar}
              draggable={false}
              className="absolute bottom-0 left-1/2 h-[172px] w-[132px] -translate-x-1/2 object-contain object-bottom drop-shadow-[0_6px_14px_rgba(0,0,0,0.85)]"
              style={{ maskImage: PORTRAIT_MASK, WebkitMaskImage: PORTRAIT_MASK }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-3xl font-black text-white/20">
              {initials(profile.mainChar || profile.playerName || '?')}
            </div>
          )}
        </div>

        {/* Datos del jugador */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 py-3 pr-2">
          <div className="flex items-center gap-1.5">
            <h2 className="truncate text-[18px] font-black leading-tight tracking-wide text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
              {profile.playerName || 'Jugador'}
            </h2>
            {onEdit && (
              <button
                onClick={onEdit}
                className="shrink-0 rounded border border-white/10 bg-white/5 px-1 py-0.5 text-[9px] text-white/50 transition-colors hover:border-white/30 hover:text-white"
                title="Editar perfil"
              >
                ⚙️
              </button>
            )}
          </div>

          <button
            onClick={() => profile.tekkenIdCode && navigator.clipboard.writeText(profile.tekkenIdCode).catch(() => {})}
            className="block max-w-full truncate text-left font-mono text-[9px] text-cyan-300/70 hover:text-cyan-200"
            title={profile.tekkenIdCode ? 'Copiar Tekken ID' : 'Sin Tekken ID'}
          >
            {profile.tekkenIdCode || 'sin Tekken ID'} · {profile.platform || 'Steam'}
          </button>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] text-white/60">
            {profile.region && <span className="truncate">🌐 {profile.region}</span>}
            {profile.prowess && <span className="text-amber-300/90">⚡ {profile.prowess}</span>}
            {profile.glicko && <span className="text-emerald-300/80">{profile.glicko}</span>}
          </div>

          {profile.message && (
            <p className="truncate text-[9px] italic text-white/45">“{profile.message}”</p>
          )}
        </div>

        {/* Rango */}
        <div className="flex w-[176px] shrink-0 flex-col items-center justify-center gap-0.5 pr-2">
          {rankArt ? (
            <img
              src={rankArt}
              alt={profile.rank}
              draggable={false}
              className="w-[164px] drop-shadow-[0_3px_10px_rgba(0,0,0,0.85)]"
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

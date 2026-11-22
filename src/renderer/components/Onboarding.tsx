import { useState } from 'react'
import { useOverlayStore } from '../store/overlayStore'

/**
 * Recorrido inicial de 3 pasos para usuarios nuevos. Se muestra una sola
 * vez (persistido en user-prefs como `onboarded`) y se puede saltar.
 */
export default function Onboarding({ onDone }: { onDone: () => void }) {
  const t = useOverlayStore((s) => s.t)
  const [step, setStep] = useState(0)

  const steps = [
    { icon: '🥋', title: t('onboarding.s1_title'), desc: t('onboarding.s1_desc') },
    { icon: '🔄', title: t('onboarding.s2_title'), desc: t('onboarding.s2_desc') },
    { icon: '▶️', title: t('onboarding.s3_title'), desc: t('onboarding.s3_desc') },
  ]
  const last = step === steps.length - 1
  const finish = () => {
    window.electronAPI.setUserPref('onboarded', true).catch(() => {})
    onDone()
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center cursor-crosshair"
      onClick={finish}
    >
      <div
        className="w-72 rounded-xl bg-[#12121a] border border-white/10 shadow-2xl p-4 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-4xl block mb-2">{steps[step].icon}</span>
        <h2 className="text-xs font-bold uppercase tracking-widest text-overlay-accent mb-2">{steps[step].title}</h2>
        <p className="text-[11px] text-white/60 leading-relaxed mb-3">{steps[step].desc}</p>

        {/* Puntos de progreso */}
        <div className="flex justify-center gap-1.5 mb-3">
          {steps.map((_, i) => (
            <span key={i} className={`h-1.5 w-1.5 rounded-full transition-colors ${i === step ? 'bg-overlay-accent' : 'bg-white/20'}`} />
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={finish} className="text-[10px] text-white/40 hover:text-white/70 px-2 py-1.5">
            {t('onboarding.skip')}
          </button>
          <button
            onClick={() => (last ? finish() : setStep(step + 1))}
            className="flex-1 text-[10px] font-bold uppercase bg-overlay-accent text-black py-1.5 rounded hover:opacity-90"
          >
            {last ? t('onboarding.start') : t('onboarding.next')}
          </button>
        </div>
      </div>
    </div>
  )
}

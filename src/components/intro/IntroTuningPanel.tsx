import { useEffect } from 'react'
import type { MutableRefObject } from 'react'
import { Leva, useControls, folder } from 'leva'
import {
  INTRO_LAYOUT_DEFAULTS,
  INTRO_LAYOUT_FRAMES,
  INTRO_GUIAS,
  INTRO_TUNING_DEFAULTS,
  INTRO_PHASES,
  ORB_TUNING_DEFAULTS,
  type IntroLayout,
  type IntroLayoutFrame,
  type IntroTuning,
  type OrbTuning,
} from '../../lib/introTuning'
import type { IntroWordmarkController } from './IntroWordmark'

// Only ever mounted via a dynamic `import()` gated on `import.meta.env.DEV`
// (see Intro.tsx) — never a static import — so this file and the `leva`
// package it pulls in live in their own chunk and are never fetched in
// production. Two separate `useControls` calls on purpose: the first
// ("tempo") reports its values up to IntroWordmark as normal React state, so
// changing a slider rebuilds the timeline with the new numbers; the second
// ("transport") only ever calls methods on the *current* built timeline via
// `controllerRef` — those don't need to trigger a rebuild themselves, so
// every field there is `transient` (leva calls onChange but doesn't re-render
// this component for it).
export default function IntroTuningPanel({
  onChange,
  onOrbChange,
  onLayoutChange,
  controllerRef,
}: {
  onChange: (tuning: IntroTuning) => void
  onOrbChange: (tuning: OrbTuning) => void
  onLayoutChange: (layout: IntroLayout) => void
  controllerRef: MutableRefObject<IntroWordmarkController | null>
}) {
  // Separate `useControls` call from `tempo` below on purpose — the orb's
  // form/float/un-form cycle is fully independent from the wordmark's
  // timeline now (see OrbTuning in lib/introTuning.ts), so moving these
  // sliders must not rebuild/restart the wordmark's GSAP timeline.
  const orb = useControls('Intro — orb', {
    appearDelay: { value: ORB_TUNING_DEFAULTS.appearDelay, min: 0, max: 10, step: 0.1 },
    formStart: { value: ORB_TUNING_DEFAULTS.formStart, min: 0, max: 5, step: 0.1 },
    formDuration: { value: ORB_TUNING_DEFAULTS.formDuration, min: 0.5, max: 6, step: 0.1 },
    floatDuration: { value: ORB_TUNING_DEFAULTS.floatDuration, min: 2, max: 120, step: 0.5 },
  })
  useEffect(() => {
    onOrbChange(orb as OrbTuning)
  }, [orb, onOrbChange])

  // Posición y tamaño — arrancan en INTRO_LAYOUT_DEFAULTS. Cuando un
  // ajuste quede bien, copiar el valor a esos defaults para que llegue a
  // producción (este panel no existe allí).
  // Forma de función para obtener `setLayout`: elegir un frame guardado
  // carga sus valores en los sliders.
  const [layout, setLayout] = useControls('Intro — posición y tamaño', () => ({
    Logo: folder({
      logoAnchoVw: { value: INTRO_LAYOUT_DEFAULTS.logoAnchoVw, min: 20, max: 120, step: 1, label: 'ancho (vw)' },
      logoAnchoMaxRem: { value: INTRO_LAYOUT_DEFAULTS.logoAnchoMaxRem, min: 20, max: 120, step: 1, label: 'ancho máx (rem)' },
      logoX: { value: INTRO_LAYOUT_DEFAULTS.logoX, min: -50, max: 50, step: 0.5, label: 'X (vw)' },
      logoY: { value: INTRO_LAYOUT_DEFAULTS.logoY, min: -50, max: 50, step: 0.5, label: 'Y (vh)' },
    }),
    Orb: folder({
      orbTamano: { value: INTRO_LAYOUT_DEFAULTS.orbTamano, min: 0.3, max: 3, step: 0.01, label: 'tamaño' },
      orbX: { value: INTRO_LAYOUT_DEFAULTS.orbX, min: -150, max: 150, step: 1, label: 'X' },
      orbY: { value: INTRO_LAYOUT_DEFAULTS.orbY, min: -100, max: 100, step: 1, label: 'Y' },
    }),
    guia: { value: INTRO_LAYOUT_DEFAULTS.guia, options: INTRO_GUIAS, label: 'guía (puntos)' },
  }))
  useControls('Intro — posición y tamaño', {
    frame: {
      value: 'Frame 1',
      options: Object.keys(INTRO_LAYOUT_FRAMES),
      onChange: (frame: string) => setLayout(INTRO_LAYOUT_FRAMES[frame as IntroLayoutFrame]),
      transient: true,
    },
  })
  useEffect(() => {
    onLayoutChange(layout as IntroLayout)
  }, [layout, onLayoutChange])

  const tempo = useControls('Intro — tempo', {
    Holds: folder({
      hold: { value: INTRO_TUNING_DEFAULTS.hold, min: 1, max: 12, step: 0.1 },
      holdLong: { value: INTRO_TUNING_DEFAULTS.holdLong, min: 1, max: 16, step: 0.1 },
    }),
    'Draw / erase': folder({
      draw: { value: INTRO_TUNING_DEFAULTS.draw, min: 0.2, max: 3, step: 0.05 },
      erase: { value: INTRO_TUNING_DEFAULTS.erase, min: 0.2, max: 3, step: 0.05 },
      stagger: { value: INTRO_TUNING_DEFAULTS.stagger, min: 0, max: 0.4, step: 0.01 },
      handoff: { value: INTRO_TUNING_DEFAULTS.handoff, min: 0, max: 1, step: 0.01 },
    }),
    'PT ending (les → is)': folder({
      ptEndingErase: { value: INTRO_TUNING_DEFAULTS.ptEndingErase, min: 0.2, max: 3, step: 0.05 },
      ptEndingDraw: { value: INTRO_TUNING_DEFAULTS.ptEndingDraw, min: 0.2, max: 3, step: 0.05 },
      ptEndingStagger: {
        value: INTRO_TUNING_DEFAULTS.ptEndingStagger,
        min: 0,
        max: 0.4,
        step: 0.01,
      },
    }),
    'PT → EN': folder({
      ptToEnDraw: { value: INTRO_TUNING_DEFAULTS.ptToEnDraw, min: 0.2, max: 3, step: 0.05 },
      ptToEnErase: { value: INTRO_TUNING_DEFAULTS.ptToEnErase, min: 0.2, max: 3, step: 0.05 },
      ptToEnStagger: { value: INTRO_TUNING_DEFAULTS.ptToEnStagger, min: 0, max: 0.4, step: 0.01 },
    }),
    'EN → ES': folder({
      'top line (HERITAGE → Diásporas)': folder({
        enToEsTopDraw: { value: INTRO_TUNING_DEFAULTS.enToEsTopDraw, min: 0.2, max: 3, step: 0.05 },
        enToEsTopErase: {
          value: INTRO_TUNING_DEFAULTS.enToEsTopErase,
          min: 0.2,
          max: 3,
          step: 0.05,
        },
        enToEsTopStagger: {
          value: INTRO_TUNING_DEFAULTS.enToEsTopStagger,
          min: 0,
          max: 0.4,
          step: 0.01,
        },
      }),
      'bottom line (DIASPORAS → patrimoniales)': folder({
        enToEsBottomDraw: {
          value: INTRO_TUNING_DEFAULTS.enToEsBottomDraw,
          min: 0.2,
          max: 3,
          step: 0.05,
        },
        enToEsBottomErase: {
          value: INTRO_TUNING_DEFAULTS.enToEsBottomErase,
          min: 0.2,
          max: 3,
          step: 0.05,
        },
        enToEsBottomStagger: {
          value: INTRO_TUNING_DEFAULTS.enToEsBottomStagger,
          min: 0,
          max: 0.4,
          step: 0.01,
        },
      }),
    }),
    'Halo travel': folder({
      holdCoverage: { value: INTRO_TUNING_DEFAULTS.holdCoverage, min: 0.1, max: 1, step: 0.01 },
      holdLoopS: { value: INTRO_TUNING_DEFAULTS.holdLoopS, min: 2, max: 30, step: 0.5 },
      resolve: { value: INTRO_TUNING_DEFAULTS.resolve, min: 0.1, max: 3, step: 0.05 },
    }),
  })

  // Changing any tempo value rebuilds IntroWordmark's whole timeline (it's
  // passed in as a prop, and IntroWordmark's useGSAP depends on it) — the
  // piece playing restarts from ES. That's expected for a tuning tool: it's
  // cheap (a handful of tweens), unlike the animation itself.
  useEffect(() => {
    onChange(tempo as IntroTuning)
  }, [tempo, onChange])

  useControls('Intro — transport', {
    phase: {
      value: INTRO_PHASES[0].label,
      options: INTRO_PHASES.map((p) => p.label),
      transient: true,
      onChange: (label: string) => {
        const phase = INTRO_PHASES.find((p) => p.label === label)
        if (phase) controllerRef.current?.seek(phase.seek)
      },
    },
    playing: {
      value: true,
      transient: true,
      onChange: (isPlaying: boolean) => {
        if (isPlaying) controllerRef.current?.play()
        else controllerRef.current?.pause()
      },
    },
    timeScale: {
      value: 1,
      min: 0.1,
      max: 5,
      step: 0.1,
      transient: true,
      onChange: (value: number) => controllerRef.current?.setTimeScale(value),
    },
    scrub: {
      value: 0,
      min: 0,
      max: 1,
      step: 0.001,
      transient: true,
      onChange: (value: number) => {
        controllerRef.current?.pause()
        controllerRef.current?.setProgress(value)
      },
    },
  })

  // Para grabar la pantalla sin el panel, añadir `hidden` (los controles
  // siguen funcionando, solo se esconde la UI).
  return <Leva hidden collapsed titleBar={{ title: 'Intro tuning' }} />
}

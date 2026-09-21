# /intro: animación de transición de idiomas — estado del avance

**Estado:** en curso, **sin commitear**, branch `text-logo-animation` (1 commit ahead de `origin/text-logo-animation`). Compila limpio (`tsc --noEmit`) y se probó a mano en el dev server.

## Qué hace

El wordmark de `/intro` (`src/components/intro/IntroWordmark.tsx`) recorre en loop infinito:

```
ES  "Diásporas patrimoniales"        (hold)
 → FR  el acento se borra            "Diasporas patrimoniales"   (hold)
 → PT  "les" se borra, entra "is"    "Diásporas patrimoniais"    (hold largo)
 → EN  las dos líneas cambian juntas "HERITAGE / DIASPORAS"      (hold largo)
 → vuelta a ES, se repite
```

- Sin relleno de letra: cada glifo es solo su contorno brillante ("halo"), dibujado/borrado con `stroke-dashoffset` a lo largo del propio contorno (no hay fades ni pops).
- Durante cada hold no queda estático: un arco de luz viaja por el contorno.
- Todo corre sobre un timeline de GSAP con labels (`p1`, `p1e`, `p2`, `p2e`, `p3`, `p3e`, `p4`, `p4e`) para que el panel de tuning pueda saltar a cualquier fase.

## Piezas nuevas / tocadas

- `src/lib/introTuning.ts` — tipos + valores default de toda la coreografía (holds, draw/erase, stagger, etc.), sin importar `leva`, así producción nunca carga esa dependencia.
- `src/components/intro/IntroTuningPanel.tsx` — panel **dev-only** (`import.meta.env.DEV`, `lazy()` import) con sliders en vivo + transporte (saltar a fase, play/pause, `timeScale`, scrub).
- `src/components/intro/IntroWordmark.tsx` — reescrito para leer la coreografía desde `tuning` (prop) y exponer un `controllerRef` (`seek`/`play`/`pause`/`setTimeScale`/`setProgress`/`getDuration`).
- `src/components/intro/IntroParticleSwarm.tsx` (nuevo) — fork de `PointsToShapes`' `ParticleSwarm`; en vez de formarse una sola vez y quedarse así, entra en loop swirl→forma→flota→deshace sincronizado a la duración real del wordmark (`cycleDuration`, leída de `controllerRef.getDuration()`).
- `src/components/intro/IntroCanvas.tsx` — recibe y pasa `cycleDuration` al swarm.
- `src/pages/Intro.tsx` — arma el `controllerRef`, mide la duración del loop del wordmark después de montar (y cada vez que cambia el tuning), monta el panel solo en dev.

## Duración actual (valores default de `introTuning.ts`)

- Loop del wordmark completo (ES→FR→PT→EN→ES): **42.45 s** — confirmado leyendo `tl.duration()` real en el navegador, no solo calculado a mano.
- Loop completo del "orbe" (swirl libre → formándose → flotando → deshaciéndose): **48.25 s** = 1.2 s swirl (`FORM_START`) + 2.3 s formando (`FORM_DURATION`) + 42.45 s flotando + 2.3 s deshaciendo. `FORM_START`/`FORM_DURATION` viven en `src/lib/heroTiming.ts` (compartidas con el hero de Home).
- Cada transición individual entre idiomas (no el loop completo, solo el tramo de cambio) dura entre ~2 s y ~3.5 s.

## Verificado

- `tsc --noEmit` sin errores.
- Corrido en dev server y probado en Chrome: el wordmark dibuja/borra correctamente, el panel de tuning abre y sus controles (sliders, scrub, selector de fase) mueven el timeline como se espera — probado explícitamente con el scrub, saltó limpio al estado "HERITAGE / DIASPORAS" ya formado.
- Se eliminaron 3 `console.log` de depuración que quedaban de cuando se armó la sincronización partícula↔wordmark.
- La pantalla negra que se ve justo al cargar **no es un bug**: es la fase de swirl libre antes de que el orbe empiece a formarse. Se reproduce igual en el último commit (`f776446`), o sea que no lo introdujo este trabajo.

## Abierto / sin resolver

El usuario reportó ver el ciclo durar **~4 segundos** en vivo, no ~42 s. No se pudo reproducir vía automatización de navegador: la pestaña controlada queda en background (`document.hidden === true`) y Chrome pausa ahí el loop de `requestAnimationFrame`, así que cualquier medición de tiempo real hecha así no es confiable (se confirmó con un smoke test dedicado).

Hipótesis sin confirmar, a chequear con el usuario:
1. Está mirando una build/deploy distinta a este branch, corriendo una versión vieja con tiempos más cortos.
2. "4 segundos" se refiere a una transición individual (que sí dura ese orden de magnitud), no al loop completo con los holds.

**Pendiente:** confirmar con el usuario dónde y qué exactamente está cronometrando antes de tocar los tiempos.

## Si se retoma

- Los "knobs" principales de duración total son `hold` / `holdLong` en `src/lib/introTuning.ts` (o vía el panel en dev) — mueven wordmark y orbe juntos porque están enganchados por `cycleDuration`.
- Nada de esto está commiteado todavía — sigue como cambios locales en `text-logo-animation`.

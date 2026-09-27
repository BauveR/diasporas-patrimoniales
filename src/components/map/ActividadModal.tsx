import { useIsDesktop } from '../../hooks/useIsDesktop'
import { ActividadSheet } from '../actividades/ActividadSheet'

// Desktop/tablet (>= sm, useIsDesktop) nunca renderiza nada acá: tanto
// InscripcionSection ('actividades', el default de ActividadCard) como la
// grilla de Perfil ('perfil') muestran su propio panel inline
// (ActividadExpandido) dentro de la sección que los abrió — ver
// ActividadInlineContext. Esta ruta de modal existe solo para mobile, donde
// se muestra como una tarjeta que sube desde abajo (ActividadSheet) en vez
// de navegar a la página completa o abrir un modal centrado con la página
// completa adentro — el comportamiento que reemplaza.
export function ActividadModal() {
  const isDesktop = useIsDesktop()
  if (isDesktop) return null
  return <ActividadSheet />
}

import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'

// Expone "qué actividad está abierta ahora mismo" a quien la haya disparado
// (InscripcionSection en Home, la grilla de Perfil) sin que esos componentes
// tengan que leer la URL real ellos mismos — no pueden: están renderizados
// dentro de <Routes location={background}>, que los aísla deliberadamente de
// la navegación real para que Home no se entere de que "navegó". App.tsx sí
// tiene acceso a la ubicación real (fuera de ese árbol) y es quien calcula
// este valor. null = no hay ninguna actividad abierta inline en este momento.
const ActividadInlineContext = createContext<number | null>(null)

export function ActividadInlineProvider({ value, children }: { value: number | null; children: ReactNode }) {
  return <ActividadInlineContext.Provider value={value}>{children}</ActividadInlineContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useOpenActividadId() {
  return useContext(ActividadInlineContext)
}

export type Participante = {
  id: number
  nombre: string
  cargo: string
  bio: string
  tituloIntervencion: string
  foto?: string
}

// Placeholder: reemplazar cada entrada con los datos reales de la tabla de
// seguimiento (cargo confirmado por la propia persona, biografía y título de
// intervención) — no completar con datos de versiones antiguas del programa.
export const PARTICIPANTES: Participante[] = Array.from({ length: 24 }, (_, i) => ({
  id: i + 1,
  nombre: `Participante ${i + 1}`,
  cargo: 'Cargo por confirmar',
  bio: '',
  tituloIntervencion: '',
}))

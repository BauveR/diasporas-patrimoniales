import { describe, it, expect } from 'vitest'
import { getPlazasEstado } from './actividades'

describe('getPlazasEstado', () => {
  it('agotada cuando no quedan plazas', () => {
    expect(getPlazasEstado({ plazas: 150, plazasDisponibles: 0 })).toBe('agotada')
  })

  it('pocas por debajo del 20% de ocupación libre', () => {
    expect(getPlazasEstado({ plazas: 150, plazasDisponibles: 20 })).toBe('pocas')
  })

  it('algunas entre el 20% y el 50%', () => {
    expect(getPlazasEstado({ plazas: 150, plazasDisponibles: 60 })).toBe('algunas')
  })

  it('disponibles por encima del 50%', () => {
    expect(getPlazasEstado({ plazas: 150, plazasDisponibles: 150 })).toBe('disponibles')
  })
})

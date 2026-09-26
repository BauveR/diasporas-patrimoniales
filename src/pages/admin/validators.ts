import { isValidTelefono } from '../../utils/validators'

export function isValidUrl(v: string): boolean {
  try {
    const url = new URL(v)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch { return false }
}

export function isValidContacto(v: string): boolean {
  if (v.includes('@')) return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
  return isValidTelefono(v)
}

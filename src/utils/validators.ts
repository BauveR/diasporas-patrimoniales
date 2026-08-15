export function isValidTelefono(v: string): boolean {
  const clean = v.replace(/[\s.\-()]/g, '')
  return /^[6-9]\d{8}$/.test(clean) || /^\+\d{8,15}$/.test(clean)
}

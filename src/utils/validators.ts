// Igual que firestore.rules (telefonoValido): como mucho 24 caracteres y
// solo dígitos, +, espacios, puntos, guiones y paréntesis. Si la web
// aceptara algo que las reglas no, la inscripción fallaría con un error
// genérico sin explicar por qué.
export const TELEFONO_MAX = 24

// Antes de validar y de guardar: lo que se pega desde una web o un PDF trae
// a veces espacios "duros" (U+00A0) o guiones tipográficos (–, —) que a la
// vista son iguales; "00" al principio es otra forma de escribir "+".
export function normalizarTelefono(v: string): string {
  return v
    .normalize('NFKC')
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^00(?=\d)/, '+')
}

export function isValidTelefono(v: string): boolean {
  const n = normalizarTelefono(v)
  if (n.length > TELEFONO_MAX || !/^[+]?[0-9 ().-]+$/.test(n)) return false
  const clean = n.replace(/[\s.\-()]/g, '')
  return /^[6-9]\d{8}$/.test(clean) || /^\+\d{8,15}$/.test(clean)
}

// Structural check (local@domain.tld, real-looking TLD) plus a blocklist of
// disposable/throwaway providers — the two things worth catching client-side
// before the mock backend accepts any email as-is. Doesn't (and can't,
// without a real mail check) confirm the address actually receives mail.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,24}$/

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'yopmail.com',
  'guerrillamail.com',
  'guerrillamail.info',
  'temp-mail.org',
  'tempmail.com',
  'fakeinbox.com',
  '10minutemail.com',
  'trashmail.com',
  'throwawaymail.com',
  'sharklasers.com',
  'dispostable.com',
  'maildrop.cc',
  'getnada.com',
])

export function isValidEmail(v: string): boolean {
  const clean = v.trim().toLowerCase()
  if (!EMAIL_RE.test(clean)) return false
  const domain = clean.split('@')[1]
  return !DISPOSABLE_EMAIL_DOMAINS.has(domain)
}

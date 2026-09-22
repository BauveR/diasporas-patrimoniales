export function isValidTelefono(v: string): boolean {
  const clean = v.replace(/[\s.\-()]/g, '')
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

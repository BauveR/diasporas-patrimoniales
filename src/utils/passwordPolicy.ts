// Requisitos de contraseña al crear cuenta. Son una ayuda para quien se
// registra, no una barrera de seguridad: Firebase Auth solo exige 6
// caracteres en el servidor, así que quien se salte el formulario tampoco
// gana nada más que una contraseña peor para su propia cuenta.
//
// Mínimo 8 + una letra + un número (sin exigir mayúsculas ni símbolos, que
// según NIST 800-63B no mejoran la seguridad real y aumentan los
// abandonos), y además fuera las contraseñas más usadas y las que llevan el
// propio email dentro.

export const LONGITUD_MINIMA = 8
export const LONGITUD_MAXIMA = 128

export type Fuerza = 'debil' | 'aceptable' | 'fuerte'

export interface EvaluacionContrasena {
  requisitos: { longitud: boolean; letra: boolean; numero: boolean }
  comun: boolean
  contieneEmail: boolean
  valida: boolean
  fuerza: Fuerza
}

// Las más usadas (listas públicas de filtraciones) y las previsibles en
// este sitio. Se comparan en minúsculas y sin acentos; solo hace falta
// incluir las que pasan los requisitos (letra + número, 8+).
const COMUNES = new Set([
  'password1', 'password12', 'password123', 'password1234', 'passw0rd', 'p4ssw0rd',
  'qwerty123', 'qwerty1234', 'qwertyuiop1', 'abc12345', 'abcd1234', 'abc123456',
  'a1234567', 'a12345678', 'aa123456', 'iloveyou1', 'welcome1', 'welcome123',
  'admin123', 'admin1234', 'letmein1', 'monkey123', 'dragon123', 'football1',
  'baseball1', 'superman1', 'sunshine1', 'princess1', 'master123', 'changeme1',
  'test1234', 'test12345', '1q2w3e4r', '1q2w3e4r5t', 'q1w2e3r4', 'zaq12wsx',
  '1qaz2wsx', 'asdf1234', 'asdfgh123', 'contrasena1', 'contrasena123',
  'contrasena2024', 'contrasena2025', 'contrasena2026', 'micontrasena1',
  'clave123', 'clave1234', 'hola1234', 'hola12345', 'teamo123', 'teamo1234',
  'motdepasse1', 'motdepasse123', 'azerty123', 'azerty1234', 'senha123', 'senha1234',
  'diasporas1', 'diasporas123', 'diasporas2026', 'patrimonio1', 'patrimonio123',
  'simposio1', 'simposio123', 'simposio2026', 'tenerife1', 'tenerife123',
  'canarias1', 'canarias123',
])

function normalizar(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
}

function esComun(pass: string): boolean {
  const n = normalizar(pass)
  if (COMUNES.has(n)) return true
  // Un solo carácter repetido con un número (aaaaaaa1)…
  if (/^(.)\1+\d$/.test(n)) return true
  // …o una serie de números con una sola letra delante o detrás (a12345678,
  // 87654321x): pasan los requisitos pero son de las primeras en probarse.
  const m = /^\p{L}?(\d+)\p{L}?$/u.exec(n)
  if (m && n.length - m[1].length <= 1) {
    const d = m[1]
    if ('01234567890'.includes(d) || '09876543210'.includes(d) || /^(\d)\1+$/.test(d)) return true
  }
  return false
}

function contieneEmail(pass: string, email: string): boolean {
  const local = normalizar(email.trim()).split('@')[0] ?? ''
  // "ana@…" dentro de "banana2024" no es usar el email; por debajo de 4
  // letras saltaría con cualquier cosa.
  return local.length >= 4 && normalizar(pass).includes(local)
}

export function evaluarContrasena(pass: string, email = ''): EvaluacionContrasena {
  const requisitos = {
    longitud: pass.length >= LONGITUD_MINIMA,
    letra: /\p{L}/u.test(pass),
    numero: /\p{N}/u.test(pass),
  }
  const cumple = requisitos.longitud && requisitos.letra && requisitos.numero
  const comun = cumple && esComun(pass)
  const conEmail = cumple && contieneEmail(pass, email)
  const valida = cumple && !comun && !conEmail

  let fuerza: Fuerza = 'debil'
  if (valida) {
    const tipos = [/\p{Ll}/u, /\p{Lu}/u, /\p{N}/u, /[^\p{L}\p{N}]/u].filter(r => r.test(pass)).length
    fuerza = pass.length >= 14 || (pass.length >= 12 && tipos >= 3) ? 'fuerte' : 'aceptable'
  }

  return { requisitos, comun, contieneEmail: conEmail, valida, fuerza }
}

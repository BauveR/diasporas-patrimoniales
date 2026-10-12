// Firebase (plan gratuito) envía como mucho 150 correos de restablecer
// contraseña al día para TODO el proyecto. Sin freno, un doble clic, alguien
// impaciente o un abuso desde la pantalla gastaba ese cupo y ese día nadie
// más podía recuperar su contraseña. Por pestaña (sessionStorage): espera
// entre envíos y un máximo; contra un script que llame directo a Firebase
// protege la API key restringida a este dominio.
export const ESPERA_RESET_S = 60
export const MAX_ENVIOS_RESET = 3

const CLAVE = 'reset_envios'

type Registro = { n: number; ultimo: number }

function leer(): Registro {
  try {
    const r = JSON.parse(sessionStorage.getItem(CLAVE) ?? 'null') as Registro | null
    if (r && typeof r.n === 'number' && typeof r.ultimo === 'number') return r
  } catch { /* sin sessionStorage o valor corrupto */ }
  return { n: 0, ultimo: 0 }
}

export function estadoReset(ahora = Date.now()): { envios: number; esperaS: number; agotado: boolean } {
  const { n, ultimo } = leer()
  const esperaS = n > 0 ? Math.max(0, Math.ceil((ultimo + ESPERA_RESET_S * 1000 - ahora) / 1000)) : 0
  return { envios: n, esperaS, agotado: n >= MAX_ENVIOS_RESET }
}

export function registrarEnvioReset(ahora = Date.now()) {
  const { n } = leer()
  try { sessionStorage.setItem(CLAVE, JSON.stringify({ n: n + 1, ultimo: ahora })) } catch { /* nada */ }
}

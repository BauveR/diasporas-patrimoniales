// Firebase (~160 KB comprimidos) fuera de la carga inicial: todo lo que corre
// en el arranque (App, AuthProvider, DataProvider, InscripcionSection) lo
// pide con estos import() dinámicos en vez de un import estático, así el
// navegador pinta la página antes de descargar y ejecutar Firebase. Medido
// con Lighthouse (2026-10-06): en móvil el primer pintado esperaba a ese
// chunk. Los tipos sí se pueden seguir importando con `import type`.
export const loadDb = () => import('./db')
export const loadAuth = () => import('./auth')

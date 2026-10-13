import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { intentarAbrirEnChrome } from './salirDeApp'

const INSTAGRAM_ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 7; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/122.0 Mobile Safari/537.36 Instagram 321.0.0.39.106 Android'
const INSTAGRAM_IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 334.0'
const CHROME_ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36'
const WEBVIEW_GENERICO = 'Mozilla/5.0 (Linux; Android 13; SM-G991B; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0 Mobile Safari/537.36'

describe('intentarAbrirEnChrome', () => {
  const original = window.location
  let href = ''
  beforeEach(() => {
    sessionStorage.clear()
    href = ''
    Object.defineProperty(window, 'location', {
      value: { origin: 'https://www.diasporaspatrimoniales.com', set href(v: string) { href = v }, get href() { return href } },
      configurable: true, writable: true,
    })
  })
  afterEach(() => { Object.defineProperty(window, 'location', { value: original, configurable: true, writable: true }) })

  it('Instagram en Android: abre Chrome en la misma página (con el destino pedido)', () => {
    expect(intentarAbrirEnChrome('/en/actividades/1?inscribirme=1', INSTAGRAM_ANDROID)).toBe(true)
    expect(href).toMatch(/^intent:\/\/www\.diasporaspatrimoniales\.com\/en\/actividades\/1\?inscribirme=1#Intent;scheme=https;package=com\.android\.chrome;/)
  })

  it('solo una vez por visita (sin Chrome, Android vuelve aquí: sin bucle)', () => {
    expect(intentarAbrirEnChrome('/login', INSTAGRAM_ANDROID)).toBe(true)
    expect(intentarAbrirEnChrome('/login', INSTAGRAM_ANDROID)).toBe(false)
  })

  it.each([['iPhone (no hay forma automática)', INSTAGRAM_IOS], ['Chrome normal', CHROME_ANDROID], ['WebView sin app identificada', WEBVIEW_GENERICO]])(
    '%s: sigue el camino normal', (_n, ua) => {
      expect(intentarAbrirEnChrome('/login', ua)).toBe(false)
      expect(href).toBe('')
    },
  )
})

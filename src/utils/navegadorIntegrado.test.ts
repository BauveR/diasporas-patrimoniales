import { describe, it, expect } from 'vitest'
import { detectarNavegadorIntegrado, enlaceAbrirEnChrome, usaRedireccionParaGoogle } from './navegadorIntegrado'

// Agentes de usuario reales (recortados lo justo).
const UA = {
  instagramIos: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 334.0.4.32.98 (iPhone14,5; iOS 17_5; es_ES; es; scale=3.00; 1170x2532; 606276133)',
  instagramAndroid: 'Mozilla/5.0 (Linux; Android 14; Pixel 7 Build/UQ1A.240205.004; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/122.0.6261.105 Mobile Safari/537.36 Instagram 321.0.0.39.106 Android',
  facebookIos: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/456.0.0.38.109;FBBV/592421373;FBDV/iPhone15,2;FBMD/iPhone;FBSN/iOS;FBSV/17.4;FBSS/3;FBID/phone;FBLC/es_ES;FBOP/5]',
  messengerAndroid: 'Mozilla/5.0 (Linux; Android 13; SM-A536B Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/121.0.6167.178 Mobile Safari/537.36 [FB_IAB/Orca-Android;FBAV/447.0.0.37.106;]',
  linkedinIos: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [LinkedInApp]/9.29.1239',
  tiktokAndroid: 'Mozilla/5.0 (Linux; Android 12; M2101K6G Build/SKQ1.210908.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.6099.230 Mobile Safari/537.36 trill_330604 JsSdk/1.0 NetType/WIFI Channel/googleplay AppName/musical_ly app_version/33.6.4 ByteLocale/es BytedanceWebview/d8a21c6',
  webviewAndroid: 'Mozilla/5.0 (Linux; Android 13; SM-G991B Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.6099.144 Mobile Safari/537.36',
  wkwebviewIos: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
  // Navegadores normales: nunca deben detectarse.
  safariIos: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  chromeIos: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.54 Mobile/15E148 Safari/604.1',
  firefoxIos: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/127.0 Mobile/15E148 Safari/605.1.15',
  chromeAndroid: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.6478.71 Mobile Safari/537.36',
  samsungAndroid: 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36',
  chromeMac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  safariMac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
}

describe('detectarNavegadorIntegrado', () => {
  it.each([
    ['instagramIos', 'Instagram', true],
    ['instagramAndroid', 'Instagram', false],
    ['facebookIos', 'Facebook', true],
    ['messengerAndroid', 'Messenger', false],
    ['linkedinIos', 'LinkedIn', true],
    ['tiktokAndroid', 'TikTok', false],
  ] as const)('%s → %s (segura)', (clave, app, ios) => {
    const r = detectarNavegadorIntegrado(UA[clave])
    expect(r).toEqual({ app, segura: true, android: !ios, ios })
  })

  it('WebView genérico de Android: aviso sin nombre, no seguro', () => {
    expect(detectarNavegadorIntegrado(UA.webviewAndroid)).toEqual({ app: null, segura: false, android: true, ios: false })
  })

  it('WKWebView de iOS sin "Safari": aviso sin nombre, no seguro', () => {
    expect(detectarNavegadorIntegrado(UA.wkwebviewIos)).toEqual({ app: null, segura: false, android: false, ios: true })
  })

  it.each(['safariIos', 'chromeIos', 'firefoxIos', 'chromeAndroid', 'samsungAndroid', 'chromeMac', 'safariMac'] as const)(
    '%s es un navegador normal: no se detecta',
    clave => { expect(detectarNavegadorIntegrado(UA[clave])).toBeNull() },
  )
})

describe('enlaceAbrirEnChrome', () => {
  it('arma el intent con la misma página y vuelta a la URL si no hay Chrome', () => {
    const url = 'https://diasporaspatrimoniales.com/en/login?x=1'
    expect(enlaceAbrirEnChrome(url)).toBe(
      `intent://diasporaspatrimoniales.com/en/login?x=1#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(url)};end`,
    )
  })
})

describe('usaRedireccionParaGoogle', () => {
  it.each([
    ['Chrome iPhone', UA.chromeIos],
    ['Firefox iPhone', UA.firefoxIos],
    ['Edge iPhone', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 EdgiOS/126.2592.56 Mobile/15E148 Safari/605.1.15'],
    ['app de Google en iPhone', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/325.0.661642875 Mobile/15E148 Safari/604.1'],
    ['Chrome iPad (modo escritorio)', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.54 Mobile/15E148 Safari/604.1'],
  ])('%s → redirección', (_n, ua) => {
    expect(usaRedireccionParaGoogle(ua)).toBe(true)
  })

  it.each([
    ['Safari iPhone', UA.safariIos],
    ['Chrome Android', UA.chromeAndroid],
    ['Samsung Android', UA.samsungAndroid],
    ['Chrome Mac', UA.chromeMac],
    ['Safari Mac', UA.safariMac],
  ])('%s → ventana emergente (como ahora)', (_n, ua) => {
    expect(usaRedireccionParaGoogle(ua)).toBe(false)
  })
})

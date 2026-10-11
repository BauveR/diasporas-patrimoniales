// Navegadores dentro de apps (Instagram, Facebook, LinkedIn…): Google no
// permite iniciar sesión desde ellos (error 403 "disallowed_useragent" en su
// propia pantalla) y la persona quedaba atrapada en una página de error de
// Google. El login con email y contraseña sí funciona ahí.
//
// Dos niveles de certeza:
//  - `segura`: el agente de usuario nombra la app → se desactiva el botón de
//    Google y se explica cómo abrir la página en el navegador.
//  - heurística (WebView genérico de Android, o iOS sin "Safari" en el
//    agente): solo se avisa, sin desactivar Google — un falso positivo no
//    debe dejar sin Google a quien está en un navegador normal (p. ej. una
//    web añadida a la pantalla de inicio en iOS tampoco lleva "Safari").
//
// WhatsApp y Telegram suelen abrir los enlaces en el navegador del sistema
// (o en su vista de Safari/Chrome, que Google sí acepta), así que casi nunca
// salen aquí; se detectan igual por si alguna versión usa WebView propio.

export type NavegadorIntegrado = { app: string | null; segura: boolean; android: boolean; ios: boolean }

const APPS: [RegExp, string][] = [
  [/Instagram/i, 'Instagram'],
  [/\bFBAN\/Messenger|MessengerForiOS|\bOrca-Android/i, 'Messenger'],
  [/\bFBAN\b|\bFBAV\b|FB_IAB|FB4A|\bFBIOS\b/i, 'Facebook'],
  [/LinkedInApp/i, 'LinkedIn'],
  [/BytedanceWebview|musical_ly|TikTok/i, 'TikTok'],
  [/\bThreads\b|Barcelona/i, 'Threads'],
  [/Snapchat/i, 'Snapchat'],
  [/Pinterest/i, 'Pinterest'],
  [/\bLine\//i, 'LINE'],
  [/MicroMessenger/i, 'WeChat'],
  [/WhatsApp/i, 'WhatsApp'],
  [/Telegram/i, 'Telegram'],
  [/Twitter|TwitterAndroid/i, 'X'],
]

export function detectarNavegadorIntegrado(ua: string): NavegadorIntegrado | null {
  const android = /Android/i.test(ua)
  const ios = /iPhone|iPad|iPod/i.test(ua)
  for (const [re, app] of APPS) {
    if (re.test(ua)) return { app, segura: true, android, ios }
  }
  // WebView de Android: lleva "; wv)" (Chrome y las pestañas personalizadas
  // de Chrome no).
  if (android && /;\s*wv\)/i.test(ua)) return { app: null, segura: false, android, ios }
  // WKWebView de iOS: sin el token "Safari/" que sí llevan Safari, Chrome
  // (CriOS), Firefox (FxiOS) y Edge (EdgiOS) en iPhone.
  if (ios && /AppleWebKit/i.test(ua) && !/Safari\//i.test(ua)) return { app: null, segura: false, android, ios }
  return null
}

// Android: el esquema intent:// abre la página en Chrome desde la mayoría de
// WebViews de apps. En iOS no hay forma fiable — se dan instrucciones y el
// botón de copiar el enlace.
export function enlaceAbrirEnChrome(url: string): string {
  const u = new URL(url)
  return `intent://${u.host}${u.pathname}${u.search}#Intent;scheme=${u.protocol.replace(':', '')};package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(url)};end`
}

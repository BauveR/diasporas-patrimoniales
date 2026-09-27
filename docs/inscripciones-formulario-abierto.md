# Inscripciones: formulario abierto (alternativa evaluada, no implementada)

**Estado:** el flujo de inscripción se queda, por ahora, con **login previo** (email/contraseña vía `AuthPage.tsx`/`AuthModal.tsx`, ya existente). Este documento describe la alternativa de **formulario abierto sin login** que se evaluó y quedó descartada por el momento, para no tener que re-derivar el análisis si se retoma más adelante.

## Contexto

El proyecto reutiliza componentes de una plantilla previa de reservas multi-sede/multi-actividad (ver limpieza aplicada en `src/data/sedes.ts`, `src/pages/AdminPage.tsx`, `src/contexts/DataContext.tsx` — quedó reducido a 1 sede fija, 2 actividades fijas "Día 1"/"Día 2"). Lo único de esa plantilla que sigue haciendo falta: que el admin pueda **ver/descargar la lista de inscritos** (`ControlAsistentes` en `AdminPage.tsx`) y, más adelante, **enviarles un mail** (individual de confirmación y/o masivo a todos los registrados).

Hoy `inscribirse()` en `src/lib/db.ts` es un **mock en memoria** — no persiste nada real todavía. Migrar eso a Firestore es necesario en **cualquiera** de los dos caminos (login o formulario abierto); no es específico de esta alternativa.

## Por qué se consideró un formulario sin login

El usuario quería evitar depender de "iniciar sesión con Google" específicamente. Al revisar el flujo actual se confirmó que el login no exige Google — admite email/contraseña — pero igual exige *crear una cuenta* antes de poder inscribirse, lo cual sigue siendo fricción adicional para alguien que solo quiere anotarse a una charla.

## Cómo quedaría el flujo abierto

1. El usuario entra a la ficha de "Día 1" / "Día 2" y completa directo: **nombre, email, teléfono** — sin login.
2. El formulario incluye un **campo honeypot** (input oculto que un bot llena y una persona nunca ve) — gratis, sin cuenta externa.
3. Al enviar, pasa por **Cloudflare Turnstile** (widget anti-bot invisible/de un clic) antes de aceptarse.
4. El registro se guarda en Firestore como **pendiente**.
5. Se dispara un mail de **doble opt-in**: el registro solo pasa a **confirmado** cuando la persona hace clic en el link del mail — esto prueba que controla ese email, y de paso ES el mail de confirmación que ya se quería mandar (no es trabajo extra).
6. Reglas de seguridad de Firestore bloquean que el mismo email se registre dos veces para el mismo día (rate-limiting + guard de duplicados a nivel de servidor, no solo en el cliente).
7. El panel admin (`ControlAsistentes`) lee de Firestore igual que en el flujo con login, exporta CSV, y un botón dispara el envío masivo de mail a todos los confirmados.

## Comparación con el flujo actual (login previo)

| | Login previo (actual) | Formulario abierto |
|---|---|---|
| Fricción para el asistente | Crear cuenta antes de inscribirse | Ninguna — completa y listo |
| Bloqueo de duplicados | Por **UID** (robusto, no falsificable) | Por **email** de texto libre (hay que normalizar/validar contra variantes tipo `+alias@`) |
| Verificación "es una persona real" | Gran parte gratis vía Firebase Auth (rate-limiting propio de creación de cuentas, `sendEmailVerification()` nativo) | Hay que construirlo a mano: Turnstile + honeypot + doble opt-in |
| Cookies / consentimiento | Sin impacto — Firebase Auth guarda sesión en IndexedDB/localStorage, no cookies HTTP | Sin impacto — ni siquiera hay sesión que persistir |
| Dependencias externas nuevas | Ninguna | Cuenta de Cloudflare (Turnstile, gratis) |
| Mail individual de confirmación | Requiere Cloud Function + proveedor de email igual | Requiere Cloud Function + proveedor de email (puede reusarse como el paso de doble opt-in) |
| "Enviar mail a todos los registrados" (admin, masivo) | Cloud Function + proveedor de email | Cloud Function + proveedor de email — **igual en ambos caminos** |

## Dependencias externas que exige el camino masivo de mail (aplica a ambos flujos)

Estas las tiene que resolver el usuario/equipo, no se pueden crear desde el código:

- **Firebase plan Blaze** (pago por uso) para poder usar Cloud Functions — el volumen esperado cae dentro del nivel gratuito incluido en Blaze (2M invocaciones/mes), pero igual exige vincular una tarjeta a la cuenta de Firebase.
- **Cuenta de un proveedor de email transaccional** (p. ej. Resend, ya mencionado como procesador en `PrivacidadPage.tsx`) con el dominio de envío verificado, para que los mails no caigan en spam.
- Si se retoma el formulario abierto específicamente: **cuenta de Cloudflare** para generar un site key de Turnstile (gratis, sin límite).

## Dónde tocaría el código si se retoma esto más adelante

- `src/components/map/ActividadModal.tsx` / `src/pages/ActividadPage.tsx` (`BookingWidget`) — sacar el paso de auth obligatorio, agregar campos nombre/email/teléfono + honeypot + Turnstile.
- `src/lib/db.ts` (`inscribirse`, `getInscritos`) — migrar de mock en memoria a Firestore real; el guard de duplicados pasaría de "por UID" a "por email normalizado".
- Reglas de seguridad de Firestore (`firestore.rules`, no existe todavía en el repo) — duplicados + rate-limiting a nivel de servidor.
- Nueva Cloud Function — envío del mail de doble opt-in / confirmación individual, y el disparo masivo desde el botón del admin.
- `src/pages/AdminPage.tsx` (`ControlAsistentes`) — sin cambios estructurales, solo pasa a leer de Firestore en vez del mock.

# Seguridad — estado actual y pendientes antes de producción

Auditoría realizada el 2026-08-16, sobre el proyecto en su fase mockeada (sin
Firebase/Firestore real conectado todavía). Deliberadamente **diferida** por
decisión del usuario — este documento existe para no perder el contexto, no
porque algo esté roto sin más: los puntos críticos son consecuencia esperada
de que el backend siga siendo un mock en memoria.

## 🔴 Crítico — bloqueante para desplegar públicamente con datos reales

### El rol de usuario es falseable por cualquiera, sin necesitar herramientas especiales

`src/lib/mockAuth.ts`:
```ts
export async function mockSignIn(email: string, _password: string): Promise<MockUser> {
  // _password nunca se valida — cualquier contraseña sirve
}
export function getMockUserRole(email: string | null): UserRole {
  return email?.toLowerCase().startsWith('admin') ? 'admin' : 'user'
}
```
Registrarse con un email que empiece con "admin" (cualquier contraseña) da
rol admin al instante: acceso a `/admin` completo — crear/editar/borrar
sedes y actividades, ver nombre/email/teléfono de todos los inscritos de
todos los eventos, y acreditar/desacreditar asistentes a voluntad.

**Por qué está así:** es el placeholder documentado desde que se portó la
arquitectura — "el rol real vuelve cuando haya Firebase conectado" (ver
`mockAuth.ts`, comentario en `getMockUserRole`).

**Qué hace falta:** reglas de Firestore reales basadas en
`request.auth.token`/custom claims, nunca un chequeo derivado en el cliente
del string del email.

### Ninguna función de `db.ts` valida que quien llama sea realmente el dueño del uid

`liberarPlaza(actividadId, uid)`, `acreditar(token)`, etc. no verifican la
identidad de quien invoca — la UI siempre pasa el uid correcto del usuario
autenticado, pero nada a nivel de la función lo obliga. Se puede llamar
`liberarPlaza(7, 'uid-de-otra-persona')` desde la consola del navegador sin
ningún error.

**Qué hace falta:** este control tiene que vivir en las reglas de Firestore
(`request.auth.uid == uid`) del lado del servidor — no se puede resolver
dentro del mock en memoria, que no tiene concepto de "servidor".

## 🟡 Importante — resolver junto con conectar Firestore real

1. **`getInscritos()` devuelve el `token` de acreditación de cada inscrito**
   junto con el resto de sus datos. Hoy no se renderiza en ninguna tabla ni
   se exporta en el CSV, pero viaja en memoria del cliente igual — antes de
   producción, ese endpoint no debería traer el token salvo que haga falta
   específicamente para esa vista.

2. **La acreditación se valida y escribe 100% desde el cliente.** Cualquier
   cuenta con rol admin puede marcar a alguien como acreditado sin haber
   escaneado nada — llamando `acreditar(token)` directo. Para control de
   acceso serio en un evento real, conviene mover esa escritura a una Cloud
   Function que valide algo más allá de "el cliente lo pidió".

3. ~~El token de acreditación no se invalida tras el primer uso~~ — **resuelto
   con control humano en puerta**: `acreditar()` sigue sin invalidar el token
   (se puede volver a escanear indefinidamente a nivel de datos), pero el
   escáner (`AcreditarScanner.tsx`) ahora distingue claramente el reescaneo:
   pantalla roja "Denegado · QR ya usado" con la hora del primer escaneo
   (`acreditadoEn`), en vez del amarillo informativo de antes. Alcanza para
   que quien acredita en persona rechace visualmente una foto de QR
   compartida. Sigue siendo un control humano, no un bloqueo técnico — si se
   necesita evitar la entrada aunque nadie esté mirando la pantalla del
   escáner, hace falta invalidar el token server-side tras el primer uso
   (requiere Firestore real, ver checklist).

4. **No existe `firestore.rules` en el proyecto todavía** — hay que
   diseñarlas desde cero para el modelo nuevo (Sede/Actividad/inscripciones/
   acreditación), no asumir que alcanza con portar las del proyecto de
   referencia tal cual (ese modelo era Conjunto/Actividad, sin acreditación).

## 🟢 Menor — no bloquea, pero conviene resolver

- `npm audit`: 1 vulnerabilidad alta, `nanoid <3.3.18` (bucle infinito con
  `size=0`) — dependencia transitiva de `postcss`/Vite, solo se usa en build
  time, nunca se embebe en lo que se despliega, y el código del proyecto ni
  siquiera la importa. Riesgo real bajo. `npm audit fix` cuando se quiera.
- Node 22.11.0 corriendo un stack que pide `20.19+`/`22.12+` — no es una
  falla de seguridad, pero conviene resolverlo antes de desplegar para
  evitar comportamiento no soportado.
- `validateSede` (alta de sedes en el admin) sigue sin tests, a diferencia
  de `validateActividad` que sí los tiene.
- Sin rate limiting en ningún lado (inscripción, acreditación) — no urgente
  mientras sea mock, pero hay que pensarlo con Firestore real y tráfico
  público (App Check / reCAPTCHA).
- Sin headers de CSP configurados — no crítico dado que no hay
  `dangerouslySetInnerHTML`/`eval` en todo el proyecto, pero es un
  endurecimiento fácil de sumar más adelante.
- `.env*` está cubierto por `.gitignore` (vía `*.local`); no se encontró
  ninguna clave real hardcodeada en el código fuente.

## Checklist resumida para "listo para producción"

- [ ] Conectar Firebase/Firestore real, con reglas que reemplacen la
      confianza actual en el cliente (resuelve los dos puntos críticos y el
      #1–2 de "importante" de una sola vez).
- [ ] Escribir `firestore.rules` para el modelo Sede/Actividad/acreditación.
- [ ] Decidir si la acreditación necesita validación server-side (Cloud
      Function) o alcanza con reglas de Firestore bien escritas.
- [ ] Decidir si el QR debe invalidarse/marcarse tras el primer uso.
- [ ] `npm audit fix`, resolver versión de Node.
- [ ] Tests para `validateSede`.

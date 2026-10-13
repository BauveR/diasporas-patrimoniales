import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { loadDb } from '../lib/firebaseLoaders'
import { isValidTelefono, normalizarTelefono } from '../utils/validators'
import type { Actividad } from '../data/actividades'
import { getInscripcionPendiente, limpiarInscripcionPendiente, marcarInscripcionPendiente } from '../lib/inscripcionPendiente'
import { loginPath } from '../i18n/routing'
import { enviarCorreoConfirmacion } from '../lib/correoConfirmacion'
import { intentarAbrirEnChrome } from '../lib/salirDeApp'

// Misma forma que useActividadBooking, pero operando sobre las 2 jornadas a
// la vez (ver inscribirseAmbosDias/liberarAmbosDias en lib/db.ts) — un solo
// formulario/confirmación de teléfono cubre ambos registros.
export function useAmbosDiasBooking(actividades: Actividad[]) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, inscripcionIds } = useAuth()

  const ids = actividades.map(a => a.id)
  const inscritoEn = ids.filter(id => inscripcionIds.includes(id))
  const inscritoAmbos = ids.length > 0 && inscritoEn.length === ids.length
  const inscritoParcial = inscritoEn.length > 0 && inscritoEn.length < ids.length

  const [inscribiendo, setInscribiendo] = useState(false)
  // El correo de confirmación no salió (tope diario, fallo de Resend o de
  // red): la tarjeta de "inscripción confirmada" lo avisa.
  const [correoNoEnviado, setCorreoNoEnviado] = useState(false)
  // Claves de traducción (reserva.errores.*): BookingWidget las traduce al
  // pintarlas, así el mensaje sigue el idioma activo.
  const [inscripcionError, setInscripcionError] = useState('')
  const [confirmando, setConfirmando] = useState(false)
  const [liberando, setLiberando] = useState(false)
  const [mostrandoTelefono, setMostrandoTelefono] = useState(false)
  const [telefono, setTelefono] = useState('')
  const [telefonoError, setTelefonoError] = useState('')
  const [aceptoTerminos, setAceptoTerminos] = useState(false)

  // Volviendo del login lanzado desde "Inscribirme a ambos días": el
  // formulario se abre solo, igual que en useActividadBooking (ver ahí).
  const [descartado, setDescartado] = useState(false)
  const continuarTrasLogin = !!user && ids.length > 0 && !inscritoAmbos && !inscritoParcial && !descartado && getInscripcionPendiente() === 'ambos'

  // Igual que useActividadBooking: llegada desde una app con ?inscribirme=ambos.
  const pedidoEnUrl = new URLSearchParams(location.search).get('inscribirme') === 'ambos'
  useEffect(() => {
    if (!pedidoEnUrl) return
    marcarInscripcionPendiente('ambos')
    navigate({ pathname: location.pathname, search: '' }, { replace: true, state: location.state })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedidoEnUrl])

  useEffect(() => {
    if (!user) return
    const uid = user.uid
    let cancelled = false
    loadDb().then(db => db.getTelefonoForUser(uid)).then(guardado => {
      if (!cancelled && guardado) setTelefono(guardado)
    })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid])

  const handleLiberar = async () => {
    if (!user) return
    const db = await loadDb()
    setLiberando(true)
    try {
      await db.liberarAmbosDias(ids, user.uid)
      setConfirmando(false)
    } catch (err) {
      if (!(err instanceof db.YaLiberadaError)) throw err
    } finally {
      setLiberando(false)
    }
  }

  const handleRequestLogin = () => {
    if (intentarAbrirEnChrome(`${location.pathname}?inscribirme=ambos`)) return
    marcarInscripcionPendiente('ambos')
    navigate(loginPath(location.pathname), { state: { background: location } })
  }

  const handleCancelarTelefono = () => {
    limpiarInscripcionPendiente()
    setDescartado(true)
    setMostrandoTelefono(false)
    setTelefonoError('')
    setAceptoTerminos(false)
  }

  const handleConfirmarInscripcion = async () => {
    if (!user) return
    if (!isValidTelefono(telefono)) {
      setTelefonoError('reserva.errores.telefono')
      return
    }
    if (!aceptoTerminos) return
    const db = await loadDb()
    setInscribiendo(true)
    setInscripcionError('')
    setCorreoNoEnviado(false)
    setTelefonoError('')
    try {
      await db.inscribirseAmbosDias(ids, user.uid, user.email ?? '', user.displayName ?? '', normalizarTelefono(telefono))
      limpiarInscripcionPendiente()
      setMostrandoTelefono(false)
      enviarCorreoConfirmacion(user, ids).then(ok => setCorreoNoEnviado(!ok))
    } catch (err) {
      if (err instanceof db.SinPlazasError) {
        setInscripcionError('reserva.errores.sinPlazasAmbos')
      } else if (err instanceof db.EventoCanceladoError) {
        setInscripcionError('reserva.errores.canceladoAmbos')
      } else if (err instanceof db.InscripcionNoAbiertaError) {
        setInscripcionError('reserva.errores.noAbiertaAmbos')
      } else if (err instanceof db.ActividadNoEncontradaError) {
        console.error('inscribirseAmbosDias(): una actividad no existe en Firestore', ids)
        setInscripcionError('reserva.errores.noEncontrada')
      } else {
        console.error('inscribirseAmbosDias() falló:', err)
        setInscripcionError('reserva.errores.generico')
      }
    } finally {
      setInscribiendo(false)
    }
  }

  return {
    isLoggedIn: !!user,
    correoNoEnviado,
    inscrito: inscritoAmbos,
    inscritoParcial,
    diasInscritos: inscritoEn,
    inscribiendo, inscripcionError,
    confirmando, setConfirmando,
    liberando,
    mostrandoTelefono: mostrandoTelefono || continuarTrasLogin,
    setMostrandoTelefono,
    avisoSesionIniciada: continuarTrasLogin,
    telefono,
    onTelefonoChange: (v: string) => { setTelefono(v); setTelefonoError('') },
    telefonoError,
    aceptoTerminos, setAceptoTerminos,
    handleLiberar,
    handleRequestLogin,
    handleConfirmarInscripcion,
    handleCancelarTelefono,
  }
}

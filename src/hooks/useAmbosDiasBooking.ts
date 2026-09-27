import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  inscribirseAmbosDias, liberarAmbosDias, getTelefonoForUser,
  SinPlazasError, YaLiberadaError, EventoCanceladoError, InscripcionNoAbiertaError, ActividadNoEncontradaError,
} from '../lib/db'
import { isValidTelefono } from '../utils/validators'
import type { Actividad } from '../data/actividades'

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
  const [inscripcionError, setInscripcionError] = useState('')
  const [confirmando, setConfirmando] = useState(false)
  const [liberando, setLiberando] = useState(false)
  const [mostrandoTelefono, setMostrandoTelefono] = useState(false)
  const [telefono, setTelefono] = useState('')
  const [telefonoError, setTelefonoError] = useState('')
  const [aceptoTerminos, setAceptoTerminos] = useState(false)

  useEffect(() => {
    if (!user) return
    const uid = user.uid
    let cancelled = false
    getTelefonoForUser(uid).then(guardado => {
      if (!cancelled && guardado) setTelefono(guardado)
    })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid])

  const handleLiberar = async () => {
    if (!user) return
    setLiberando(true)
    try {
      await liberarAmbosDias(ids, user.uid)
      setConfirmando(false)
    } catch (err) {
      if (!(err instanceof YaLiberadaError)) throw err
    } finally {
      setLiberando(false)
    }
  }

  const handleRequestLogin = () => {
    navigate('/login', { state: { background: location } })
  }

  const handleCancelarTelefono = () => {
    setMostrandoTelefono(false)
    setTelefonoError('')
    setAceptoTerminos(false)
  }

  const handleConfirmarInscripcion = async () => {
    if (!user) return
    if (!isValidTelefono(telefono)) {
      setTelefonoError('Introduce un teléfono válido (España o formato internacional +XX...)')
      return
    }
    if (!aceptoTerminos) return
    setInscribiendo(true)
    setInscripcionError('')
    setTelefonoError('')
    try {
      await inscribirseAmbosDias(ids, user.uid, user.email ?? '', user.displayName ?? '', telefono)
      setMostrandoTelefono(false)
      user.getIdToken().then(idToken => {
        fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken, actividadIds: ids }),
        }).catch(() => { /* silencioso — inscripción ya completada */ })
      }).catch(() => { /* silencioso */ })
    } catch (err) {
      if (err instanceof SinPlazasError) {
        setInscripcionError('Ya no quedan plazas disponibles en una de las dos jornadas.')
      } else if (err instanceof EventoCanceladoError) {
        setInscripcionError('Una de las dos jornadas ha sido cancelada.')
      } else if (err instanceof InscripcionNoAbiertaError) {
        setInscripcionError('Las inscripciones todavía no están abiertas para una de las dos jornadas.')
      } else if (err instanceof ActividadNoEncontradaError) {
        console.error('inscribirseAmbosDias(): una actividad no existe en Firestore', ids)
        setInscripcionError('No pudimos procesar la inscripción. Por favor, contactanos.')
      } else {
        console.error('inscribirseAmbosDias() falló:', err)
        setInscripcionError('Error al procesar la inscripción. Inténtalo de nuevo.')
      }
    } finally {
      setInscribiendo(false)
    }
  }

  return {
    isLoggedIn: !!user,
    inscrito: inscritoAmbos,
    inscritoParcial,
    diasInscritos: inscritoEn,
    inscribiendo, inscripcionError,
    confirmando, setConfirmando,
    liberando,
    mostrandoTelefono, setMostrandoTelefono,
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

import { useEffect, useState } from 'react'
import { getTelemetriaConexion, type ConteoConexion } from '../../lib/db'
import { SectionCard } from './fields'
import { ultimosDias } from '../../lib/conexion'

const DIAS = 7

// Cuánta gente necesitó el modo compatible (redes institucionales que
// cortan la conexión de Firestore) y cuántos no pudieron conectar ni así —
// para decidir con datos si hace falta el formulario alternativo.
export function EstadoConexion() {
  const [conteo, setConteo] = useState<ConteoConexion | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelado = false
    getTelemetriaConexion(ultimosDias(DIAS))
      .then(c => { if (!cancelado) setConteo(c) })
      .catch(() => { if (!cancelado) setError(true) })
    return () => { cancelado = true }
  }, [])

  const filas: { label: string; valor: number | undefined; sub?: boolean; alerta?: boolean }[] = [
    { label: 'Visitas que necesitaron modo compatible', valor: conteo?.modo_compatible },
    { label: 'y luego cargaron bien', valor: conteo?.recuperado, sub: true },
    { label: 'Visitas que no pudieron conectar', valor: conteo?.sin_conexion, alerta: true },
  ]

  return (
    <SectionCard title={`Conexión · últimos ${DIAS} días`}>
      {error ? (
        <p className="text-[11px] text-red-400">No se pudieron cargar los datos de conexión.</p>
      ) : (
        <dl className="flex flex-col gap-2">
          {filas.map(f => (
            <div key={f.label} className="flex items-baseline justify-between gap-4">
              <dt className={`text-sm ${f.sub ? 'pl-4 text-stone-500' : 'text-stone-300'}`}>{f.sub ? '└ ' : ''}{f.label}</dt>
              <dd className={`text-sm tabular-nums ${f.alerta && (f.valor ?? 0) > 0 ? 'text-red-400' : 'text-white'}`}>
                {f.valor ?? '…'}
              </dd>
            </div>
          ))}
        </dl>
      )}
      <p className="mt-4 text-[10px] text-stone-500 leading-relaxed">
        Datos anónimos: solo se cuenta cuántas veces pasó, sin guardar quién.
      </p>
    </SectionCard>
  )
}

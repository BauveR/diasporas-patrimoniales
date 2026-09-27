import { describe, it, expect } from 'vitest'
import { renderConfirmacionEmail } from './emailTemplate.js'

const dia1 = {
  titulo: 'Día 1 — 12 de noviembre',
  fecha: 'jueves, 12 de noviembre de 2026',
  hora: '08:45',
  duracion: '8h',
  programa: [
    { hora: '08:45–09:30', titulo: 'Recepción y acreditaciones' },
    { hora: '10:45–12:00', titulo: 'Panel I', moderador: 'Jorge Onrubia' },
  ],
}

const dia2 = {
  titulo: 'Día 2 — 13 de noviembre',
  fecha: 'viernes, 13 de noviembre de 2026',
  hora: '09:30',
  duracion: '7h 30min',
  programa: [{ hora: '10:30–11:45', titulo: 'Panel IV' }],
}

const base = {
  nombre: 'Ana',
  contacto: 'diasporaspatrimoniales@gmail.com',
  sedeNombre: 'TEA',
  sedeIsla: 'Tenerife',
}

describe('renderConfirmacionEmail', () => {
  it('usa el título de la jornada en el asunto cuando es un solo día', () => {
    const { subject } = renderConfirmacionEmail({ ...base, dias: [dia1] })
    expect(subject).toBe('Confirmación de inscripción — Día 1 — 12 de noviembre')
  })

  it('usa un asunto genérico de "ambos días" cuando son 2 jornadas', () => {
    const { subject } = renderConfirmacionEmail({ ...base, dias: [dia1, dia2] })
    expect(subject).toBe('Confirmación de inscripción — Ambos días')
  })

  it('encabezado en negro con texto blanco', () => {
    const { html } = renderConfirmacionEmail({ ...base, dias: [dia1] })
    expect(html).toContain('background:#000000')
    expect(html).toContain('color:#ffffff')
  })

  it('cuerpo del mail sobre fondo blanco', () => {
    const { html } = renderConfirmacionEmail({ ...base, dias: [dia1] })
    expect(html).toContain('background:#ffffff')
  })

  it('detalles (horas de la agenda) en el rojo del proyecto', () => {
    const { html } = renderConfirmacionEmail({ ...base, dias: [dia1] })
    expect(html).toContain('#9b2923')
  })

  it('incluye el programa del día seleccionado', () => {
    const { html, text } = renderConfirmacionEmail({ ...base, dias: [dia1] })
    expect(html).toContain('Recepción y acreditaciones')
    expect(html).toContain('Modera Jorge Onrubia')
    expect(text).toContain('Recepción y acreditaciones')
  })

  it('incluye el programa de las dos jornadas cuando se inscribió a ambos días', () => {
    const { html } = renderConfirmacionEmail({ ...base, dias: [dia1, dia2] })
    expect(html).toContain('Recepción y acreditaciones')
    expect(html).toContain('Panel IV')
    expect(html).toContain('Día 1 — 12 de noviembre')
    expect(html).toContain('Día 2 — 13 de noviembre')
  })

  it('solo incluye sede y contacto en la logística (sin punto de encuentro ni organizador)', () => {
    const { html } = renderConfirmacionEmail({ ...base, dias: [dia1] })
    expect(html).toContain('Sede')
    expect(html).toContain('Contacto')
    expect(html).toContain('diasporaspatrimoniales@gmail.com')
    expect(html).not.toContain('Punto de encuentro')
    expect(html).not.toContain('Organiza')
  })

  it('declara Mattone y Gambetta vía @font-face con fallback', () => {
    const { html } = renderConfirmacionEmail({ ...base, dias: [dia1] })
    expect(html).toContain('@font-face')
    expect(html).toContain("font-family: 'Mattone'")
    expect(html).toContain('https://diasporaspatrimoniales.com/fonts/Mattone-Bold.woff2')
    expect(html).toContain("font-family: 'Gambetta'")
    expect(html).toContain('https://diasporaspatrimoniales.com/fonts/Gambetta-BoldItalic.woff2')
  })

  it('"Diásporas Patrimoniales" en Mattone y "Inscripción confirmada" en Gambetta bold italic, sobre fondo negro', () => {
    const { html } = renderConfirmacionEmail({ ...base, dias: [dia1] })
    expect(html).toContain("font-family:'Mattone','Arial Black',Arial,sans-serif")
    expect(html).toContain("font-family:'Gambetta',Georgia,'Times New Roman',serif")
    expect(html).toContain('font-style:italic')
    expect(html).toMatch(/background:#000000;padding:28px 32px;/)
  })

  it('resalta la fecha de cada jornada con fondo rojo y letra blanca, incluso en un solo día', () => {
    const { html } = renderConfirmacionEmail({ ...base, dias: [dia1] })
    expect(html).toMatch(/background:#9b2923;color:#ffffff;border-radius:8px;padding:10px 14px;/)
    expect(html).toContain('Día 1 — 12 de noviembre')
  })

  it('el contacto es un link mailto: cuando es un email', () => {
    const { html } = renderConfirmacionEmail({ ...base, dias: [dia1] })
    expect(html).toContain('href="mailto:diasporaspatrimoniales@gmail.com"')
  })

  it('el contacto es un link tel: cuando es un teléfono', () => {
    const { html } = renderConfirmacionEmail({ ...base, contacto: '612 345 678', dias: [dia1] })
    expect(html).toContain('href="tel:612345678"')
  })

  it('incluye un botón visible a "tu perfil"', () => {
    const { html, text } = renderConfirmacionEmail({ ...base, dias: [dia1] })
    expect(html).toContain('href="https://diasporaspatrimoniales.com/perfil"')
    expect(html).toContain('Ir a tu perfil')
    expect(text).toContain('https://diasporaspatrimoniales.com/perfil')
  })

  it('escapa HTML en campos variables', () => {
    const { html } = renderConfirmacionEmail({
      ...base,
      nombre: '<script>alert(1)</script>',
      dias: [dia1],
    })
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).toContain('&lt;script&gt;')
  })
})

import { useState } from 'react'
import { useDataContext } from '../contexts/DataContext'
import { labelStyle } from '../lib/styles'
import { NAV_ITEMS, type AdminSection } from './admin/navConfig'
import { Sidebar, MobileTabBar, ContentHeader } from './admin/AdminNav'
import { GestionSedes } from './admin/GestionSedes'
import { ControlAsistentes } from './admin/ControlAsistentes'

// Componente raíz — solo ensambla el nav (Sidebar/MobileTabBar) y la sección
// activa. El resto de lo que antes vivía en este archivo (validación y
// formularios de actividad/sede, tarjetas, tabla de inscritos, chrome de
// nav) se movió a src/pages/admin/ — cada pieza ya era de responsabilidad
// única, solo vivían todas en un solo archivo de 1400 líneas.
export function AdminPage() {
  const { actividades, sedes } = useDataContext()
  const [section, setSection] = useState<AdminSection>('sedes')

  const currentNav = NAV_ITEMS.find(n => n.key === section)!

  return (
    <div className="min-h-screen bg-black" style={labelStyle}>

      {/* Sidebar (sm+) */}
      <Sidebar section={section} setSection={setSection} />

      {/* Mobile bottom tab bar */}
      <MobileTabBar section={section} setSection={setSection} />

      {/* Content */}
      <div className="pt-navbar sm:pl-14 lg:pl-55 pb-[calc(4rem+env(safe-area-inset-bottom,0px))] sm:pb-0 min-h-screen flex flex-col">

        <ContentHeader item={currentNav} />

        <div className="flex-1 px-6 sm:px-8 py-8">

          {section === 'sedes'  && <GestionSedes sedes={sedes} />}
          {section === 'asistentes' && <ControlAsistentes actividades={actividades} sedes={sedes} />}

        </div>
      </div>
    </div>
  )
}

import type React from 'react'
import { IconBuilding, IconUsers } from './icons'

export type AdminSection = 'sedes' | 'asistentes'

export type NavItem = { key: AdminSection; label: string; sublabel: string; Icon: () => React.JSX.Element }

export const NAV_ITEMS: NavItem[] = [
  { key: 'sedes',  label: 'Sede',        sublabel: 'Ver y editar',   Icon: IconBuilding     },
  { key: 'asistentes', label: 'Eventos',             sublabel: 'Asistentes',     Icon: IconUsers        },
]

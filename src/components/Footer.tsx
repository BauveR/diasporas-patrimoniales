import { Link } from 'react-router-dom'
import logoDiasporasTea from '../assets/diásporas patrimoniales tea tenerife-12.png'
import logoGobCan from '../assets/Logo_GobCan_claim_blanco_mod1-01.png'
import logoCabildoTenerife from '../assets/cabildo-de-tenerife [Converted]-01.png'
import logoTEA from '../assets/tenerife-espacio-de-las-artes [Converted]-01.png'
import logoMuna from '../assets/15-Logo-MUNA-Museos-de-Tenerife-Naturaleza-y-Arqueologia-750x750.png'

const labelStyle = { fontFamily: "'Open Sans', sans-serif" }

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer style={{ backgroundColor: '#9b2923' }}>
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-12 sm:px-8 lg:px-10">

        {/* Marca propia + colaboradores, en una sola línea */}
        <div className="flex flex-wrap items-center gap-x-12 gap-y-6">
          <img
            src={logoDiasporasTea}
            alt="Diásporas Patrimoniales — TEA Tenerife"
            className="h-20 w-auto object-contain"
          />
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <img src={logoGobCan} alt="Gobierno de Canarias" className="h-10 w-auto object-contain" />
            <img src={logoCabildoTenerife} alt="Cabildo de Tenerife" className="h-8 w-auto object-contain" />
            <img src={logoTEA} alt="Tenerife Espacio de las Artes" className="h-8 w-auto object-contain" />
            <img src={logoMuna} alt="MUNA — Museo de la Naturaleza y el Hombre" className="h-9 w-auto object-contain" />
          </div>
        </div>

        <div className="h-px w-full bg-white/10" />

        {/* Legal */}
        <div
          className="flex flex-col gap-4 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between"
          style={labelStyle}
        >
          <div className="flex flex-col gap-1">
            <p>© {year} Diásporas Patrimoniales. Todos los derechos reservados.</p>
            <p>
              Sitio web sujeto a la legislación española y a la normativa específica de la
              Comunidad Autónoma de Canarias.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-white/70">
            <Link to="/privacidad" className="transition-colors hover:text-white">
              Política de privacidad y cookies
            </Link>
            <span className="text-white/40">[Aviso legal pendiente]</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

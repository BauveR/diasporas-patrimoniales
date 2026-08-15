const labelStyle = { fontFamily: "'Open Sans', sans-serif" }
const titleStyle = { fontFamily: "'Google Sans Flex', sans-serif", fontVariationSettings: "'wght' 100" }

const PASAPORTE_IMG = 'https://res.cloudinary.com/dvsldhnaa/image/upload/v1781609117/Pasaporte_Patrimonial_sedes_historicos_de_canarias_-01_qxaccy.png'
const SELLOS_IMG    = 'https://res.cloudinary.com/dvsldhnaa/image/upload/v1781609396/Untitled_design_2_vthzbh.png'

export function PasaportePage() {
  return (
    <main className="min-h-screen bg-[#f7f5f2] pt-16">

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 pt-16 pb-10 gap-4">
        <h1
          className="text-4xl sm:text-6xl uppercase tracking-tight text-stone-800 leading-tight whitespace-nowrap"
          style={titleStyle}
        >
          Pasaporte Patrimonial
        </h1>
        <div className="w-8 h-px bg-stone-300 mt-1" />
        <p className="text-sm text-stone-500 leading-relaxed max-w-xl" style={labelStyle}>
          Visita los sedes históricas de las 7 islas y colecciona tu sello.
          Una forma de explorar el patrimonio canario a tu ritmo.
        </p>
        <span
          className="mt-2 px-4 py-1.5 rounded-full border border-stone-300 text-[10px] tracking-[0.2em] uppercase text-stone-400"
          style={labelStyle}
        >
          Próximamente
        </span>
      </section>

      {/* Pasaporte imagen */}
      <section className="flex justify-center px-6 pb-10">
        <div className="w-full max-w-lg">
          <img
            src={PASAPORTE_IMG}
            alt="Pasaporte Patrimonial de los Sedes Históricas de Canarias"
            className="w-full h-auto drop-shadow-xl rounded-2xl"
          />
        </div>
      </section>

      {/* Sellos */}
      <section className="flex flex-col items-center px-6 pb-20 gap-6">
        <p className="text-[10px] tracking-[0.25em] uppercase text-stone-400" style={labelStyle}>
          Sellos de los sedes
        </p>
        <div className="w-full max-w-md">
          <img
            src={SELLOS_IMG}
            alt="Sellos de los sedes históricas"
            className="w-full h-auto opacity-80"
          />
        </div>
        <p className="text-xs text-stone-400 text-center max-w-xs leading-relaxed" style={labelStyle}>
          Cada sede tiene su propio sello. Las reglas del pasaporte se anunciarán próximamente.
        </p>
      </section>

    </main>
  )
}

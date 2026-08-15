const labelStyle = { fontFamily: "'Open Sans', sans-serif" }

export function ContactoPage() {
  return (
    <main className="min-h-screen bg-white pt-16 flex items-center justify-center" style={labelStyle}>
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-xs tracking-widest uppercase text-stone-400">Contacto</p>
        <p className="text-sm text-stone-500">Próximamente</p>
      </div>
    </main>
  )
}

import { Component, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null }

const labelStyle = { fontFamily: "'Open Sans', sans-serif" }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary]', error)
  }

  render() {
    if (this.state.error) {
      return (
        <main className="min-h-screen bg-white pt-16 flex items-center justify-center px-6">
          <div className="flex flex-col items-center gap-5 text-center max-w-sm" style={labelStyle}>
            <p className="text-xs tracking-widest uppercase text-stone-400">Algo ha salido mal</p>
            <p className="text-sm text-stone-500 leading-relaxed">
              Se ha producido un error inesperado. Recarga la página o vuelve al inicio.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-2.5 rounded-xl bg-stone-900 text-white text-[11px] tracking-widest uppercase hover:bg-stone-700 transition-colors cursor-pointer"
            >
              Volver al inicio
            </button>
            {import.meta.env.DEV && (
              <pre className="text-left text-[10px] text-red-400 bg-red-50 rounded-xl p-4 w-full overflow-auto max-h-48">
                {this.state.error.message}
              </pre>
            )}
          </div>
        </main>
      )
    }
    return this.props.children
  }
}

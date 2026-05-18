import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-64 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-red-900/40 flex items-center justify-center mb-4">
            <span className="text-red-400 text-xl">!</span>
          </div>
          <h2 className="text-white font-semibold mb-1">Algo salió mal</h2>
          <p className="text-slate-400 text-sm mb-4 max-w-sm">
            {this.state.error?.message ?? 'Error inesperado en esta sección.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm rounded-lg transition-colors"
          >
            Reintentar
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

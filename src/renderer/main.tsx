import React, { Component, ReactNode } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  state = { hasError: false, error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'white', background: 'rgba(20,0,0,0.95)', height: '100vh', overflow: 'auto', fontFamily: 'monospace', fontSize: 11, zIndex: 99999, position: 'relative' }}>
          <h2 style={{ color: '#ff6b6b', fontSize: 14, fontWeight: 'bold' }}>⚠️ Error en la UI del Overlay</h2>
          <p>{this.state.error?.message}</p>
          <pre style={{ whiteSpace: 'pre-wrap', marginTop: 10, color: '#ff8787' }}>{this.state.error?.stack}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)

import { Component } from 'react'

/**
 * Penangkap error saat render. Tanpa ini, satu exception React akan
 * membongkar seluruh tree → layar putih tanpa keterangan sama sekali.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Render error:', error, info)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleBack = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
            <p className="font-mono text-[11px] uppercase tracking-widest text-rose-600 font-bold">
              Gangguan tampilan
            </p>
            <h1 className="mt-2 text-xl font-extrabold text-slate-900">
              Halaman gagal dimuat
            </h1>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Terjadi kesalahan saat menampilkan data. Muat ulang halaman untuk
              mencoba lagi.
            </p>
            <pre className="mt-3 max-h-28 overflow-auto rounded-lg bg-white border border-rose-200 p-2 text-left text-[10px] font-mono text-rose-700 whitespace-pre-wrap break-all">
              {String(this.state.error?.message || this.state.error)}
            </pre>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="rounded-full bg-black px-5 py-2.5 text-xs font-mono font-medium text-white hover:bg-gray-800 transition"
              >
                Muat ulang
              </button>
              <button
                type="button"
                onClick={this.handleBack}
                className="rounded-full border border-gray-300 px-5 py-2.5 text-xs font-mono font-medium text-gray-700 hover:bg-gray-100 transition"
              >
                Ke Beranda
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

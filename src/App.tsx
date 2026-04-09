import Calculator from './components/Calculator';

export default function App() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--ink)' }}>
      {/* Header */}
      <header className="card" style={{ borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-10 rounded-full" style={{ backgroundColor: 'var(--brand)' }}></div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight" style={{ color: 'var(--ink)' }}>
                TORQUE & PRELOAD CALCULATOR
              </h1>
              <p className="text-xs font-medium tracking-wide uppercase" style={{ color: 'var(--muted)' }}>
                VDI 2230 &bull; Torx &bull; Soft Materials
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Calculator />
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--line)' }} className="mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <p className="text-xs text-center" style={{ color: 'var(--muted)' }}>
            VDI 2230 simplified calculation — for reference only. Verify critical bolted joints with a qualified engineer.
          </p>
        </div>
      </footer>
    </div>
  );
}

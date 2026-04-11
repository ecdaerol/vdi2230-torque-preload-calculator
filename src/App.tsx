import Calculator from './components/Calculator';
import ErrorBoundary from './components/ErrorBoundary';

function useEmbedMode() {
  if (typeof window === 'undefined') return { isEmbed: false, isDark: false };
  const params = new URLSearchParams(window.location.search);
  const embed = params.get('embed');
  return { isEmbed: !!embed, isDark: embed === 'dark' };
}

export default function App() {
  const appIcon = 'app-icon.png';
  const { isEmbed, isDark } = useEmbedMode();

  return (
    <div className={`min-h-screen ${isDark ? 'embed-dark' : ''}`} style={{ backgroundColor: 'var(--bg)', color: 'var(--ink)' }}>
      {/* Header — hidden in embed mode */}
      {!isEmbed && (
        <header className="card" style={{ borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center gap-3">
              <img src={appIcon} alt="" className="w-11 h-11 rounded-[12px] shadow-sm" />
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight" style={{ color: 'var(--ink)' }}>
                  Fastener Joint Calculator
                </h1>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  Made by <a href="https://ecdaerol.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-white transition-colors">Ecda Erol</a>
                </p>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <ErrorBoundary>
          <Calculator />
        </ErrorBoundary>
      </main>

      {/* Footer — hidden in embed mode */}
      {!isEmbed && (
        <footer style={{ borderTop: '1px solid var(--line)' }} className="mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <p className="text-xs text-center" style={{ color: 'var(--muted)' }}>
              Practical VDI-style fastener sizing — for reference only. Verify critical bolted joints with a qualified engineer and test program.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}

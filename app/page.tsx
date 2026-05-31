import WalletAnalyzer from "@/components/WalletAnalyzer";

function SoDEXLogo() {
  return (
    <div className="logo-3d-spin">
      <svg width="38" height="38" viewBox="0 0 100 100" fill="none" aria-label="SoDEX">
        <defs>
          <linearGradient id="cube-top" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e0e0e0" />
            <stop offset="100%" stopColor="#a0a0a0" />
          </linearGradient>
          <linearGradient id="cube-left" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#555" />
            <stop offset="100%" stopColor="#888" />
          </linearGradient>
          <linearGradient id="cube-right" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#777" />
            <stop offset="100%" stopColor="#444" />
          </linearGradient>
        </defs>
        {/* Top face */}
        <polygon points="50,10 85,30 50,50 15,30" fill="url(#cube-top)" />
        {/* Left face */}
        <polygon points="15,30 50,50 50,90 15,70" fill="url(#cube-left)" />
        {/* Right face */}
        <polygon points="85,30 50,50 50,90 85,70" fill="url(#cube-right)" />
        {/* Orange accent square on right face */}
        <polygon points="68,52 80,46 80,58 68,64" fill="#FF6B00" />
      </svg>
    </div>
  );
}

function Background() {
  return (
    <>
      {/* Scanner light sweep */}
      <div className="scanner" aria-hidden />

      {/* Tunnel grid */}
      <div className="bg-tunnel" aria-hidden>
        <div className="bg-tunnel-floor" />
        <div className="bg-tunnel-rings" />
        <div className="bg-tunnel-horizon" />
      </div>

      {/* Ambient orange blobs */}
      <div className="glow-spot glow-spot-1" aria-hidden />
      <div className="glow-spot glow-spot-2" aria-hidden />

      {/* Floating particles */}
      <div aria-hidden>
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="particle" />
        ))}
      </div>
    </>
  );
}

export default function Home() {
  return (
    <div className="relative min-h-screen bg-black">
      <Background />

      {/* ── Header ── */}
      <header className="relative z-10 sticky top-0 border-b border-[rgba(255,107,0,0.12)] bg-black/75 backdrop-blur-xl">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SoDEXLogo />

            <div className="flex items-baseline gap-1.5">
              {/* Glitch + shimmer title */}
              <span
                className="glitch-wrap shimmer-title font-orbitron font-black text-xl tracking-widest"
                data-text="SoDEX"
              >
                SoDEX
              </span>
              <span className="font-orbitron text-[10px] font-bold tracking-[0.3em] text-white/25 uppercase">
                Analyzer
              </span>
            </div>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(255,107,0,0.08)] border border-[rgba(255,107,0,0.22)] text-[#FF6B00] text-[10px] font-bold font-orbitron tracking-[0.2em]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] animate-pulse" />
            MAINNET
          </span>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="relative z-10 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <WalletAnalyzer />
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-[rgba(255,107,0,0.08)] mt-20 py-6">
        <p className="text-center text-[10px] font-orbitron tracking-widest uppercase text-white/15">
          SoDEX Wallet Analyzer &nbsp;·&nbsp;
          <span className="text-[rgba(255,107,0,0.4)]">mainnet-gw.sodex.dev</span>
        </p>
      </footer>
    </div>
  );
}

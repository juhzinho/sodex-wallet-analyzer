import WalletAnalyzer from "@/components/WalletAnalyzer";

function SoDEXLogo() {
  return (
    <div className="logo-3d-spin">
      <svg width="38" height="38" viewBox="0 0 38 38" fill="none" aria-label="SoDEX">
        <defs>
          <linearGradient id="hg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FF8A33" />
            <stop offset="100%" stopColor="#FF6B00" />
          </linearGradient>
          <filter id="logo-glow">
            <feGaussianBlur stdDeviation="1.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <path
          d="M19 2L34 10.5V27.5L19 36L4 27.5V10.5L19 2Z"
          fill="rgba(255,107,0,0.12)"
          stroke="url(#hg)"
          strokeWidth="1.5"
          filter="url(#logo-glow)"
        />
        <path
          d="M19 8.5L29 14V26L19 31.5L9 26V14L19 8.5Z"
          fill="rgba(255,107,0,0.07)"
          stroke="rgba(255,107,0,0.30)"
          strokeWidth="0.75"
        />
        <text
          x="19" y="24.5"
          textAnchor="middle"
          fill="url(#hg)"
          fontSize="15"
          fontWeight="900"
          fontFamily="Orbitron, sans-serif"
        >
          S
        </text>
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

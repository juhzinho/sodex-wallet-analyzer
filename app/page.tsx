import WalletAnalyzer from "@/components/WalletAnalyzer";
import LanguageSelector from "@/components/LanguageSelector";

function SoDEXLogo() {
  return (
    <div className="logo-3d-spin">
      <svg width="38" height="38" viewBox="0 0 100 100" fill="none" aria-label="SoDEX">
        {/* Cube — top face */}
        <polygon points="50,6 90,27 50,48 10,27" fill="#3a3a3a" />
        {/* Cube — left face */}
        <polygon points="10,27 50,48 50,94 10,73" fill="#2a2a2a" />
        {/* Cube — right face */}
        <polygon points="90,27 50,48 50,94 90,73" fill="#323232" />

        {/* White S shape — top bar */}
        <rect x="30" y="18" width="30" height="10" rx="1" fill="white" />
        {/* White S shape — top-left vertical */}
        <rect x="30" y="18" width="10" height="20" rx="1" fill="white" />
        {/* White S shape — middle bar */}
        <rect x="30" y="38" width="30" height="10" rx="1" fill="white" />
        {/* White S shape — bottom-right vertical */}
        <rect x="50" y="38" width="10" height="20" rx="1" fill="white" />
        {/* White S shape — bottom bar */}
        <rect x="30" y="48" width="30" height="10" rx="1" fill="white" />

        {/* Orange accent square */}
        <rect x="60" y="28" width="10" height="10" fill="#E84532" />
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

          <div className="flex items-center gap-3">
            <LanguageSelector />
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(255,107,0,0.08)] border border-[rgba(255,107,0,0.22)] text-[#FF6B00] text-[10px] font-bold font-orbitron tracking-[0.2em]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] animate-pulse" />
              MAINNET
            </span>
          </div>
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

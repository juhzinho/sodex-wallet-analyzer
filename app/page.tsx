import { Suspense } from "react";
import WalletAnalyzer from "@/components/WalletAnalyzer";
import SiteHeader from "@/components/SiteHeader";
import { AnalysisNavProvider } from "@/components/AnalysisNav";
import LoadingState from "@/components/LoadingState";

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
    <AnalysisNavProvider>
      <div className="relative min-h-screen bg-black">
        <Background />

        <SiteHeader />

        <main className="relative z-10 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Suspense fallback={<LoadingState progress={null} />}>
            <WalletAnalyzer />
          </Suspense>
        </main>

        <footer className="relative z-10 border-t border-[rgba(255,107,0,0.08)] mt-20 py-6">
          <p className="text-center text-[10px] font-orbitron tracking-widest uppercase text-white/15">
            SoDEX Wallet Analyzer &nbsp;·&nbsp;
            <span className="text-[rgba(255,107,0,0.4)]">mainnet-gw.sodex.dev</span>
          </p>
        </footer>
      </div>
    </AnalysisNavProvider>
  );
}

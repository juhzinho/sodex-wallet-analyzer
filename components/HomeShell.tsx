"use client";

import { Suspense, useCallback, useLayoutEffect, useState } from "react";
import WalletAnalyzer from "./WalletAnalyzer";
import SiteHeader from "./SiteHeader";
import LoadingState from "./LoadingState";

export default function HomeShell() {
  const [showHome, setShowHome] = useState(false);
  const [goHome, setGoHome] = useState<(() => void) | null>(null);

  const handleNavChange = useCallback(
    (active: boolean, handler: (() => void) | null) => {
      setShowHome(active);
      setGoHome(() => handler);
    },
    []
  );

  const handleHome = useCallback(() => {
    goHome?.();
  }, [goHome]);

  return (
    <>
      <SiteHeader showHome={showHome} onHome={handleHome} />

      <main className="relative z-10 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Suspense fallback={<LoadingState progress={null} />}>
          <WalletAnalyzer onNavChange={handleNavChange} />
        </Suspense>
      </main>
    </>
  );
}

/** Sync header Home button with analysis state without waiting for paint. */
export function useAnalysisNavSync(
  onNavChange: ((active: boolean, handler: (() => void) | null) => void) | undefined,
  active: boolean,
  handler: () => void
) {
  useLayoutEffect(() => {
    onNavChange?.(active, active ? handler : null);
    return () => onNavChange?.(false, null);
  }, [onNavChange, active, handler]);
}

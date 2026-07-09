"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import { useWalletAnalysis } from "@/hooks/useWalletAnalysis";
import { isValidAddress } from "@/lib/utils";
import { useI18n } from "./I18nProvider";
import { useAnalysisNavSync } from "./HomeShell";
import WalletInput from "./WalletInput";
import LoadingState from "./LoadingState";
import ErrorState from "./ErrorState";

const Dashboard = dynamic(() => import("./Dashboard"), {
  loading: () => <LoadingState progress={null} />,
});

interface Props {
  onNavChange?: (active: boolean, handler: (() => void) | null) => void;
}

export default function WalletAnalyzer({ onNavChange }: Props) {
  const { state, analyze, reset } = useWalletAnalysis();
  const { locale, t } = useI18n();
  const searchParams = useSearchParams();
  const router = useRouter();
  const autoStarted = useRef(false);
  const [inputKey, setInputKey] = useState(0);

  const handleAnalyze = useCallback(
    (address: string, options?: { refresh?: boolean }) => {
      const addr = address.toLowerCase();
      autoStarted.current = true;
      router.replace(`/?wallet=${encodeURIComponent(addr)}`, { scroll: false });
      analyze(addr, locale, options);
    },
    [analyze, locale, router]
  );

  const handleRefresh = useCallback(() => {
    const addr = state.data?.metrics.wallet;
    if (!addr) return;
    handleAnalyze(addr, { refresh: true });
  }, [state.data?.metrics.wallet, handleAnalyze]);

  const isRefreshing =
    state.status === "loading" || state.status === "enriching";

  const handleReset = useCallback(() => {
    // Block deep-link auto-start until ?wallet= is cleared from the URL.
    autoStarted.current = true;
    setInputKey((k) => k + 1);
    router.replace("/", { scroll: false });
    reset();
  }, [reset, router]);

  const analysisActive = state.status !== "idle";
  useAnalysisNavSync(onNavChange, analysisActive, handleReset);

  useEffect(() => {
    const wallet = searchParams.get("wallet")?.trim();

    if (!wallet || !isValidAddress(wallet)) {
      autoStarted.current = false;
      return;
    }

    if (autoStarted.current || state.status !== "idle") return;

    autoStarted.current = true;
    analyze(wallet.toLowerCase(), locale);
  }, [searchParams, locale, analyze, state.status]);

  return (
    <div>
      <div
        className={
          state.status !== "idle" &&
          state.status !== "loading" &&
          state.status !== "enriching"
            ? "opacity-60 pointer-events-none"
            : ""
        }
      >
        <WalletInput
          key={inputKey}
          onSubmit={(addr) => handleAnalyze(addr)}
          isLoading={state.status === "loading" || state.status === "enriching"}
        />
      </div>

      {state.status === "loading" && (
        <LoadingState progress={state.progress} />
      )}

      {state.status === "enriching" && state.data && (
        <>
          <div className="mb-4 px-4 py-2 rounded-lg text-center text-[11px] font-orbitron tracking-wider text-[#FF6B00] border border-[rgba(255,107,0,0.25)] bg-[rgba(255,107,0,0.06)]">
            {state.progress}
          </div>
          <Dashboard
            data={state.data}
            onReset={handleReset}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />
        </>
      )}

      {state.status === "error" && (
        <ErrorState
          message={state.error ?? t("error.unknown")}
          onRetry={handleReset}
        />
      )}

      {state.status === "success" && state.data && (
        <Dashboard
          data={state.data}
          onReset={handleReset}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />
      )}
    </div>
  );
}

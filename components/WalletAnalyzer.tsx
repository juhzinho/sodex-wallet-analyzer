"use client";

import { useWalletAnalysis } from "@/hooks/useWalletAnalysis";
import WalletInput from "./WalletInput";
import Dashboard from "./Dashboard";
import LoadingState from "./LoadingState";
import ErrorState from "./ErrorState";

export default function WalletAnalyzer() {
  const { state, analyze, reset } = useWalletAnalysis();

  return (
    <div>
      {/* Input always visible at top; dim it while loading */}
      <div
        className={
          state.status !== "idle" && state.status !== "loading"
            ? "opacity-60 pointer-events-none"
            : ""
        }
      >
        <WalletInput
          onSubmit={analyze}
          isLoading={state.status === "loading"}
        />
      </div>

      {state.status === "loading" && <LoadingState progress={state.progress} />}

      {state.status === "error" && (
        <ErrorState
          message={state.error ?? "Unknown error"}
          onRetry={reset}
        />
      )}

      {state.status === "success" && state.data && (
        <Dashboard data={state.data} onReset={reset} />
      )}
    </div>
  );
}

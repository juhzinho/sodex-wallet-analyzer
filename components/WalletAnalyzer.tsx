"use client";

import { useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import { useWalletAnalysis } from "@/hooks/useWalletAnalysis";
import { isValidAddress } from "@/lib/utils";
import { useI18n } from "./I18nProvider";
import WalletInput from "./WalletInput";
import LoadingState from "./LoadingState";
import ErrorState from "./ErrorState";

const Dashboard = dynamic(() => import("./Dashboard"), {
  loading: () => <LoadingState progress={null} />,
});

export default function WalletAnalyzer() {
  const { state, analyze, reset } = useWalletAnalysis();
  const { locale, t } = useI18n();
  const searchParams = useSearchParams();
  const router = useRouter();
  const autoStarted = useRef(false);

  const handleAnalyze = useCallback(
    (address: string) => {
      const addr = address.toLowerCase();
      router.replace(`/?wallet=${encodeURIComponent(addr)}`, { scroll: false });
      analyze(addr, locale);
    },
    [analyze, locale, router]
  );

  const handleReset = useCallback(() => {
    autoStarted.current = false;
    router.replace("/", { scroll: false });
    reset();
  }, [reset, router]);

  useEffect(() => {
    if (autoStarted.current || state.status !== "idle") return;

    const wallet = searchParams.get("wallet")?.trim();
    if (!wallet || !isValidAddress(wallet)) return;

    autoStarted.current = true;
    analyze(wallet.toLowerCase(), locale);
  }, [searchParams, locale, analyze, state.status]);

  return (
    <div>
      <div
        className={
          state.status !== "idle" && state.status !== "loading"
            ? "opacity-60 pointer-events-none"
            : ""
        }
      >
        <WalletInput
          onSubmit={handleAnalyze}
          isLoading={state.status === "loading"}
        />
      </div>

      {state.status === "loading" && <LoadingState progress={state.progress} />}

      {state.status === "error" && (
        <ErrorState
          message={state.error ?? t("error.unknown")}
          onRetry={handleReset}
        />
      )}

      {state.status === "success" && state.data && (
        <Dashboard data={state.data} onReset={handleReset} />
      )}
    </div>
  );
}

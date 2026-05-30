"use client";

import { useState, useCallback, useRef } from "react";
import { AnalysisState, ProgressEvent } from "@/types";

export function useWalletAnalysis() {
  const [state, setState] = useState<AnalysisState>({
    status: "idle",
    data: null,
    error: null,
    progress: null,
  });

  // Keep a ref to the active EventSource so we can close it on reset/new search
  const esRef = useRef<EventSource | null>(null);

  const analyze = useCallback((address: string) => {
    // Close any in-flight stream
    esRef.current?.close();
    esRef.current = null;

    setState({ status: "loading", data: null, error: null, progress: "Conectando..." });

    const es = new EventSource(`/api/analyze/${address}`);
    esRef.current = es;

    es.onmessage = (event: MessageEvent<string>) => {
      let msg: ProgressEvent;
      try {
        msg = JSON.parse(event.data) as ProgressEvent;
      } catch {
        return;
      }

      if (msg.type === "progress") {
        setState((prev) => ({ ...prev, progress: msg.message ?? null }));
      } else if (msg.type === "complete" && msg.data) {
        setState({ status: "success", data: msg.data, error: null, progress: null });
        es.close();
        esRef.current = null;
      } else if (msg.type === "error") {
        setState({ status: "error", data: null, error: msg.error ?? "Unknown error", progress: null });
        es.close();
        esRef.current = null;
      }
    };

    es.onerror = () => {
      // EventSource fires onerror on connection close too; only treat as error
      // if we haven't already received a complete/error event.
      setState((prev) => {
        if (prev.status !== "loading") return prev;
        return { status: "error", data: null, error: "Connection to analysis stream lost.", progress: null };
      });
      es.close();
      esRef.current = null;
    };
  }, []);

  const reset = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
    setState({ status: "idle", data: null, error: null, progress: null });
  }, []);

  return { state, analyze, reset };
}

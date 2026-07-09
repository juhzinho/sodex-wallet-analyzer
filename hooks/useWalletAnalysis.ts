"use client";

import { useState, useCallback, useRef } from "react";
import { AnalysisState, ProgressEvent } from "@/types";
import { Locale, tr } from "@/lib/i18n";

function parseSseBuffer(buffer: string): ProgressEvent[] {
  const events: ProgressEvent[] = [];

  for (const part of buffer.split("\n\n")) {
    if (!part.trim()) continue;
    for (const line of part.split("\n")) {
      if (!line.startsWith("data: ")) continue;
      try {
        events.push(JSON.parse(line.slice(6)) as ProgressEvent);
      } catch {
        // ignore malformed
      }
    }
  }

  return events;
}

export function useWalletAnalysis() {
  const [state, setState] = useState<AnalysisState>({
    status: "idle",
    data: null,
    error: null,
    progress: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const analyze = useCallback(async (address: string, locale: Locale = "en") => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setState({
      status: "loading",
      data: null,
      error: null,
      progress: tr(locale, "progress.connecting"),
    });

    const handleEvent = (msg: ProgressEvent) => {
      if (ac.signal.aborted) return;
      if (msg.type === "progress") {
        setState((prev) => ({
          ...prev,
          progress: msg.message ?? prev.progress,
        }));
      } else if (msg.type === "partial" && msg.data) {
        setState({
          status: "enriching",
          data: msg.data,
          error: null,
          progress: tr(locale, "progress.enriching"),
        });
      } else if (msg.type === "complete" && msg.data) {
        setState({
          status: "success",
          data: msg.data,
          error: null,
          progress: null,
        });
      } else if (msg.type === "error") {
        setState({
          status: "error",
          data: null,
          error: msg.error ?? tr(locale, "error.unknown"),
          progress: null,
        });
      }
    };

    try {
      const res = await fetch(
        `/api/analyze/${address}?lang=${encodeURIComponent(locale)}`,
        { signal: ac.signal, cache: "no-store" }
      );

      if (!res.body) {
        throw new Error(tr(locale, "error.connectionLost"));
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let gotComplete = false;
      let gotPartial = false;

      while (true) {
        const { done, value } = await reader.read();

        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";
          for (const part of parts) {
            for (const msg of parseSseBuffer(part + "\n\n")) {
              handleEvent(msg);
              if (msg.type === "complete") gotComplete = true;
              if (msg.type === "partial") gotPartial = true;
            }
          }
        }

        if (done) {
          // Flush remaining buffer (fixes lost "complete" on last chunk)
          if (buffer.trim()) {
            for (const msg of parseSseBuffer(buffer)) {
              handleEvent(msg);
              if (msg.type === "complete") gotComplete = true;
              if (msg.type === "partial") gotPartial = true;
            }
          }
          break;
        }
      }

      if (ac.signal.aborted) return;

      if (!gotComplete && !gotPartial) {
        setState((prev) =>
          prev.status === "loading" || prev.status === "enriching"
            ? {
                status: "error",
                data: null,
                error: tr(locale, "error.connectionLost"),
                progress: null,
              }
            : prev
        );
      } else if (gotPartial && !gotComplete) {
        // Partial arrived but stream ended — treat partial as success
        setState((prev) =>
          prev.data
            ? { ...prev, status: "success", progress: null }
            : prev
        );
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setState((prev) =>
        prev.status === "loading" || prev.status === "enriching"
          ? {
              status: "error",
              data: null,
              error:
                err instanceof Error
                  ? err.message
                  : tr(locale, "error.connectionLost"),
              progress: null,
            }
          : prev
      );
    } finally {
      if (abortRef.current === ac) abortRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState({ status: "idle", data: null, error: null, progress: null });
  }, []);

  return { state, analyze, reset };
}

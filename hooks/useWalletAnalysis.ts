"use client";

import { useState, useCallback, useRef } from "react";
import { AnalysisState, ProgressEvent } from "@/types";
import { Locale, tr } from "@/lib/i18n";

function parseSseChunk(buffer: string): {
  events: ProgressEvent[];
  rest: string;
} {
  const events: ProgressEvent[] = [];
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";

  for (const part of parts) {
    for (const line of part.split("\n")) {
      if (!line.startsWith("data: ")) continue;
      try {
        events.push(JSON.parse(line.slice(6)) as ProgressEvent);
      } catch {
        // ignore malformed chunks
      }
    }
  }

  return { events, rest };
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
      let finished = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const { events, rest } = parseSseChunk(buffer);
        buffer = rest;

        for (const msg of events) {
          if (msg.type === "progress") {
            setState((prev) => ({
              ...prev,
              progress: msg.message ?? null,
            }));
          } else if (msg.type === "complete" && msg.data) {
            finished = true;
            setState({
              status: "success",
              data: msg.data,
              error: null,
              progress: null,
            });
          } else if (msg.type === "error") {
            finished = true;
            setState({
              status: "error",
              data: null,
              error: msg.error ?? tr(locale, "error.unknown"),
              progress: null,
            });
          }
        }
      }

      if (!finished) {
        setState((prev) =>
          prev.status === "loading"
            ? {
                status: "error",
                data: null,
                error: tr(locale, "error.connectionLost"),
                progress: null,
              }
            : prev
        );
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setState((prev) =>
        prev.status === "loading"
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

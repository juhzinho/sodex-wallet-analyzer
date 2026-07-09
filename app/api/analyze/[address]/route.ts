import { NextRequest } from "next/server";
import { analyzeWallet } from "@/services/sodex/analyzer";
import { isValidAddress } from "@/lib/utils";
import { isLocale, Locale, tr } from "@/lib/i18n";
import { ProgressEvent } from "@/types";
import { getCachedAnalysis, setCachedAnalysis } from "@/lib/analysis-cache";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

// Heavy wallets (100k+ fills) need headroom — parallel fetch typically finishes in 2–4 min.
export const maxDuration = 300;

const KEEPALIVE_MS = 12_000;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;
  const langParam = req.nextUrl.searchParams.get("lang");
  const locale: Locale = isLocale(langParam) ? langParam : "en";
  const normalized = address?.toLowerCase();

  if (!normalized || !isValidAddress(normalized)) {
    return new Response(
      JSON.stringify({ error: "Invalid Ethereum address." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const rate = checkRateLimit(clientIp(req));
  const encoder = new TextEncoder();

  if (!rate.ok) {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", error: tr(locale, "error.rateLimit") })}\n\n`
          )
        );
        controller.close();
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Retry-After": String(rate.retryAfterSec),
      },
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: ProgressEvent) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        } catch {
          // client disconnected
        }
      };

      let lastProgress = tr(locale, "progress.connecting");
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
          send({ type: "progress", message: lastProgress });
        } catch {
          // stream closed
        }
      }, KEEPALIVE_MS);

      try {
        const cached = getCachedAnalysis(normalized);
        if (cached) {
          send({ type: "progress", message: tr(locale, "progress.cached") });
          send({
            type: "complete",
            data: { ...cached, fetchedAt: Date.now() },
          });
          return;
        }

        const analysis = await analyzeWallet(
          normalized,
          (message) => {
            lastProgress = message;
            send({ type: "progress", message });
          },
          locale
        );
        setCachedAnalysis(normalized, analysis);
        send({ type: "complete", data: analysis });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Analysis failed";
        const isNotFound =
          message.includes("404") ||
          message.toLowerCase().includes("not found");

        send({
          type: "error",
          error: isNotFound
            ? tr(locale, "error.notFound")
            : message,
        });
      } finally {
        clearInterval(keepalive);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

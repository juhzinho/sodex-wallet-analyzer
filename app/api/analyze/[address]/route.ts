import { NextRequest } from "next/server";
import { analyzeWallet } from "@/services/sodex/analyzer";
import { isValidAddress } from "@/lib/utils";
import { ProgressEvent } from "@/types";

export const maxDuration = 120;

// Streams Server-Sent Events so the client can show real-time progress.
// Event format (text/event-stream):  data: <JSON>\n\n
// Three event types:
//   { type: "progress", message: string }  — status update while fetching
//   { type: "complete", data: FullAnalysis } — done
//   { type: "error",    error: string }      — fatal error
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;

  if (!address || !isValidAddress(address)) {
    return new Response(
      JSON.stringify({ error: "Invalid Ethereum address." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: ProgressEvent) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        } catch {
          // client disconnected — swallow
        }
      };

      try {
        const analysis = await analyzeWallet(
          address.toLowerCase(),
          (message) => send({ type: "progress", message })
        );
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
            ? "Wallet not found or has no trading history on SoDEX."
            : message,
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",   // disable nginx buffering
    },
  });
}

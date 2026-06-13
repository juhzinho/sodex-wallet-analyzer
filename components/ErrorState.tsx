"use client";

import { useI18n } from "./I18nProvider";
import type { TranslationKey } from "@/lib/i18n";

interface Props {
  message: string;
  onRetry?: () => void;
}

// Map canonical English server/stream messages to translation keys so the
// displayed error follows the selected language. Unknown messages pass through.
function messageKey(message: string): TranslationKey | null {
  const m = message.toLowerCase();
  if (m.includes("not found") || m.includes("no trading history")) return "error.notFound";
  if (m.includes("invalid") && m.includes("address")) return "error.invalidAddress";
  if (m.includes("connection") && m.includes("lost")) return "error.connectionLost";
  if (m === "unknown error") return "error.unknown";
  return null;
}

export default function ErrorState({ message, onRetry }: Props) {
  const { t } = useI18n();
  const key = messageKey(message);
  const shown = key ? t(key) : message;

  return (
    <div className="mt-10 flex flex-col items-center justify-center text-center py-16">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
        style={{
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.25)",
          boxShadow: "0 0 20px rgba(239,68,68,0.10)",
        }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="text-red-400">
          <path
            d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      </div>

      <h3 className="font-orbitron font-bold text-base text-white mb-2 tracking-wider uppercase">
        {t("error.title")}
      </h3>
      <p className="text-white/40 text-sm max-w-md leading-relaxed mb-7 font-inter">
        {shown}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2.5 rounded-lg font-orbitron font-bold text-xs tracking-widest uppercase text-black transition-all hover:shadow-glow"
          style={{ background: "linear-gradient(135deg, #FF8A33, #FF6B00)" }}
        >
          {t("error.retry")}
        </button>
      )}
    </div>
  );
}

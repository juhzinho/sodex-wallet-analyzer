"use client";

import { useI18n } from "./I18nProvider";

interface Props {
  onClick: () => void;
  variant?: "header" | "prominent";
  className?: string;
}

const VARIANT_CLASS: Record<NonNullable<Props["variant"]>, string> = {
  header:
    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-orbitron font-bold text-[10px] tracking-widest uppercase text-[#FF6B00] transition-colors hover:bg-[rgba(255,107,0,0.12)] border border-[rgba(255,107,0,0.45)] bg-[rgba(255,107,0,0.08)]",
  prominent:
    "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-orbitron font-bold text-xs tracking-widest uppercase text-[#FF6B00] transition-all hover:bg-[rgba(255,107,0,0.18)] border border-[rgba(255,107,0,0.5)] bg-[rgba(255,107,0,0.1)] shadow-[0_0_24px_rgba(255,107,0,0.15)]",
};

export default function HomeButton({
  onClick,
  variant = "header",
  className,
}: Props) {
  const { t } = useI18n();

  return (
    <button
      type="button"
      onClick={onClick}
      title={t("nav.homeTitle")}
      aria-label={t("nav.homeTitle")}
      className={className ?? VARIANT_CLASS[variant]}
    >
      <svg width={variant === "prominent" ? 16 : 14} height={variant === "prominent" ? 16 : 14} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9.5z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
      {t("nav.home")}
    </button>
  );
}

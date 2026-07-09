"use client";

import { useI18n } from "./I18nProvider";

interface Props {
  onClick: () => void;
  className?: string;
}

export default function HomeButton({ onClick, className }: Props) {
  const { t } = useI18n();

  return (
    <button
      type="button"
      onClick={onClick}
      title={t("nav.homeTitle")}
      aria-label={t("nav.homeTitle")}
      className={
        className ??
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-orbitron font-bold text-[10px] tracking-widest uppercase text-white/50 transition-colors hover:text-[#FF6B00] hover:border-[rgba(255,107,0,0.45)]"
      }
      style={{ border: "1px solid rgba(255,107,0,0.22)" }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
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

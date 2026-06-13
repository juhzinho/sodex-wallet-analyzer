"use client";

import { motion } from "framer-motion";
import { useI18n } from "./I18nProvider";
import { LOCALES, LOCALE_META } from "@/lib/i18n";

export default function LanguageSelector() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      className="flex gap-0.5 p-0.5 rounded-lg"
      style={{ background: "rgba(255,107,0,0.05)", border: "1px solid rgba(255,107,0,0.18)" }}
      role="group"
      aria-label={t("lang.label")}
    >
      {LOCALES.map((l) => {
        const active = locale === l;
        return (
          <motion.button
            key={l}
            onClick={() => setLocale(l)}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            title={LOCALE_META[l].label}
            aria-pressed={active}
            className="px-2 py-1 rounded-md text-sm leading-none transition-colors"
            style={{
              background: active ? "rgba(255,107,0,0.18)" : "transparent",
              opacity: active ? 1 : 0.5,
              boxShadow: active ? "0 0 10px rgba(255,107,0,0.25)" : "none",
            }}
          >
            <span aria-hidden>{LOCALE_META[l].flag}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

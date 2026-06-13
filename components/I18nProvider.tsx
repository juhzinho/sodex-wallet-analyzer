"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import {
  Locale,
  TranslationKey,
  tr,
  numberLocale,
  readStoredLocale,
  storeLocale,
  detectBrowserLocale,
} from "@/lib/i18n";
import { setFormatterLocale } from "@/lib/formatters";

type TFn = (key: TranslationKey, params?: Record<string, string | number>) => string;

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: TFn;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Start with a deterministic "en" so SSR and the first client render match
  // (no hydration mismatch). The real locale is resolved in the effect below.
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const resolved = readStoredLocale() ?? detectBrowserLocale();
    setLocaleState(resolved);
    setFormatterLocale(numberLocale(resolved));
    if (typeof document !== "undefined") document.documentElement.lang = resolved;
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    storeLocale(l);
    setFormatterLocale(numberLocale(l));
    if (typeof document !== "undefined") document.documentElement.lang = l;
  }, []);

  const t = useCallback<TFn>((key, params) => tr(locale, key, params), [locale]);

  const value = useMemo<I18nContextValue>(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider");
  return ctx;
}

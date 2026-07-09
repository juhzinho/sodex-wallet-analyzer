"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  useEffect,
} from "react";

interface AnalysisNavContextValue {
  showHome: boolean;
  goHome: () => void;
  registerHomeHandler: (fn: (() => void) | null) => void;
}

const AnalysisNavContext = createContext<AnalysisNavContextValue | null>(null);

export function AnalysisNavProvider({ children }: { children: React.ReactNode }) {
  const [showHome, setShowHome] = useState(false);
  const handlerRef = useRef<(() => void) | null>(null);

  const registerHomeHandler = useCallback((fn: (() => void) | null) => {
    handlerRef.current = fn;
    setShowHome(fn != null);
  }, []);

  const goHome = useCallback(() => {
    handlerRef.current?.();
  }, []);

  return (
    <AnalysisNavContext.Provider value={{ showHome, goHome, registerHomeHandler }}>
      {children}
    </AnalysisNavContext.Provider>
  );
}

export function useAnalysisNav() {
  const ctx = useContext(AnalysisNavContext);
  if (!ctx) {
    throw new Error("useAnalysisNav must be used within AnalysisNavProvider");
  }
  return ctx;
}

/** Register a handler shown as the header Home button while `active` is true. */
export function useRegisterHome(onHome: () => void, active: boolean) {
  const { registerHomeHandler } = useAnalysisNav();

  useEffect(() => {
    registerHomeHandler(active ? onHome : null);
    return () => registerHomeHandler(null);
  }, [registerHomeHandler, onHome, active]);
}

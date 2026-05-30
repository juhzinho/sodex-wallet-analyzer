"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import { isValidAddress } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  onSubmit: (address: string) => void;
  isLoading: boolean;
}

const TYPED_ADDR = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";

export default function WalletInput({ onSubmit, isLoading }: Props) {
  const [value, setValue]         = useState("");
  const [error, setError]         = useState("");
  const [placeholder, setPlaceholder] = useState("0x");
  const btnRef = useRef<HTMLButtonElement>(null);

  /* ── Typing placeholder animation ── */
  useEffect(() => {
    if (value) { setPlaceholder("0x..."); return; }

    let i = 2;           // start after "0x"
    let erasing = false;
    let pauseTicks = 0;

    const tick = () => {
      if (pauseTicks > 0) { pauseTicks--; return; }

      if (!erasing) {
        i = Math.min(i + 1, TYPED_ADDR.length);
        setPlaceholder(TYPED_ADDR.slice(0, i) + (i < TYPED_ADDR.length ? "|" : "█"));
        if (i === TYPED_ADDR.length) { erasing = true; pauseTicks = 25; }
      } else {
        i = Math.max(i - 2, 2);
        setPlaceholder(i > 2 ? TYPED_ADDR.slice(0, i) : "0x...");
        if (i <= 2) { erasing = false; pauseTicks = 8; }
      }
    };

    const id = setInterval(tick, 70);
    return () => clearInterval(id);
  }, [value]);

  /* ── Ripple on button ── */
  const handleRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top  - size / 2;

    const el = document.createElement("span");
    el.className = "ripple";
    el.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px;`;
    btn.appendChild(el);
    setTimeout(() => el.remove(), 700);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const addr = value.trim();
    if (!addr) { setError("Enter a wallet address to analyse."); return; }
    if (!isValidAddress(addr)) {
      setError("Invalid address — must be a 42-character 0x… hex string.");
      return;
    }
    setError("");
    onSubmit(addr.toLowerCase());
  };

  const paste = () =>
    navigator.clipboard.readText()
      .then((t) => { setValue(t.trim()); setError(""); })
      .catch(() => {});

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="font-orbitron font-black text-4xl sm:text-5xl mb-4 leading-tight">
          <span className="text-white">WALLET </span>
          <span
            className="shimmer-title glitch-wrap"
            data-text="ANALYTICS"
          >
            ANALYTICS
          </span>
        </h1>
        <p className="text-white/35 text-sm max-w-md mx-auto leading-relaxed">
          Paste any SoDEX wallet address to instantly visualise complete trading history —
          PnL, volume, fees, win rate and more.
        </p>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit}>
        <div
          className={cn(
            "flex items-center rounded-xl border transition-all duration-300",
            error
              ? "border-red-500/50"
              : "border-[rgba(255,107,0,0.28)] focus-within:border-[rgba(255,107,0,0.65)] pulse-border"
          )}
          style={{ background: "rgba(255,107,0,0.03)" }}
        >
          {/* Wallet icon */}
          <div className="pl-4 pr-3 shrink-0 text-[rgba(255,107,0,0.45)]">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="1.6"/>
              <path d="M16 3H8L6 7h12l-2-4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
              <circle cx="16" cy="14" r="1.5" fill="currentColor"/>
            </svg>
          </div>

          <input
            type="text"
            value={value}
            onChange={(e) => { setValue(e.target.value); if (error) setError(""); }}
            placeholder={placeholder}
            spellCheck={false}
            autoComplete="off"
            className="flex-1 bg-transparent py-4 text-sm font-mono text-white outline-none"
            style={{ caretColor: "#FF6B00" }}
          />

          <button
            type="button"
            onClick={paste}
            className="px-3 text-[10px] font-orbitron font-bold tracking-wider text-white/20 hover:text-[#FF6B00] transition-colors"
          >
            PASTE
          </button>

          {value && (
            <button
              type="button"
              onClick={() => { setValue(""); setError(""); }}
              className="px-2 text-white/20 hover:text-red-400 transition-colors text-lg leading-none"
            >
              ×
            </button>
          )}

          {/* Analyse button with shine + ripple */}
          <button
            ref={btnRef}
            type="submit"
            disabled={isLoading}
            onClick={handleRipple}
            className={cn(
              "m-2 px-6 py-2.5 rounded-lg font-orbitron font-black text-xs tracking-widest uppercase transition-all duration-200 shrink-0 ripple-container btn-shine",
              isLoading
                ? "bg-[rgba(255,107,0,0.20)] text-[rgba(255,107,0,0.40)] cursor-not-allowed"
                : "text-black cursor-pointer"
            )}
            style={
              !isLoading
                ? {
                    background: "linear-gradient(135deg, #FF8A33 0%, #FF6B00 100%)",
                    boxShadow: "0 0 22px rgba(255,107,0,0.40), 0 2px 8px rgba(0,0,0,0.4)",
                  }
                : undefined
            }
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75"/>
                </svg>
                SCANNING
              </span>
            ) : (
              "ANALYSE"
            )}
          </button>
        </div>

        {error && <p className="mt-2 text-xs text-red-400 pl-1 font-inter">{error}</p>}
      </form>

      {/* Feature pills */}
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {["Volume", "PnL", "Win Rate", "Funding", "Fees", "Trades"].map((f) => (
          <span
            key={f}
            className="text-[10px] font-orbitron tracking-widest uppercase px-3 py-1 rounded-full border border-[rgba(255,107,0,0.15)] text-[rgba(255,107,0,0.50)] transition-colors hover:border-[rgba(255,107,0,0.35)] hover:text-[rgba(255,107,0,0.8)]"
          >
            {f}
          </span>
        ))}
      </div>
    </div>
  );
}

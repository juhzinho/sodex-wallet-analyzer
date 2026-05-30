"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCountUp } from "@/hooks/useCountUp";

interface Props {
  title: string;
  rawValue: number;
  displayValue: string;
  subValue?: string;
  trend?: "positive" | "negative" | "neutral";
  icon: ReactNode;
  className?: string;
  index?: number;  // for stagger delay
}

// No shared variants needed — each card uses inline animate props


export default function MetricsCard({
  title,
  rawValue,
  displayValue,
  subValue,
  trend,
  icon,
  className,
  index = 0,
}: Props) {
  useCountUp(rawValue, 1300); // runs in bg for visual effect hook

  const glowColor =
    trend === "positive" ? "rgba(34,197,94,0.18)"
    : trend === "negative" ? "rgba(239,68,68,0.14)"
    : "rgba(255,107,0,0.18)";

  const accentColor =
    trend === "positive" ? "#22c55e"
    : trend === "negative" ? "#ef4444"
    : "white";

  const lineColor =
    trend === "positive"
      ? "linear-gradient(90deg, transparent, rgba(34,197,94,0.45), transparent)"
      : trend === "negative"
      ? "linear-gradient(90deg, transparent, rgba(239,68,68,0.45), transparent)"
      : "linear-gradient(90deg, transparent, rgba(255,107,0,0.35), transparent)";

  return (
    <motion.div
      className={cn("group relative glass-card p-5 overflow-hidden cursor-default", className)}
      initial={{ opacity: 0, y: 26, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 280, damping: 22, delay: index * 0.07 }}
      whileHover={{
        y: -5,
        boxShadow: `0 14px 42px ${glowColor}, 0 0 0 1px rgba(255,107,0,0.32)`,
        transition: { type: "spring", stiffness: 400, damping: 20 },
      }}
    >
      {/* Corner radial accent */}
      <div
        className="absolute top-0 right-0 w-20 h-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `radial-gradient(circle at top right, ${glowColor}, transparent 70%)` }}
      />

      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <p className="text-[10px] font-orbitron font-bold tracking-[0.18em] uppercase text-white/35">
          {title}
        </p>
        <div
          className="icon-wrap w-9 h-9 rounded-lg flex items-center justify-center text-[#FF6B00] shrink-0"
          style={{
            background: "rgba(255,107,0,0.10)",
            border: "1px solid rgba(255,107,0,0.22)",
          }}
        >
          {icon}
        </div>
      </div>

      {/* Value */}
      <motion.p
        className="text-2xl font-bold font-mono tracking-tight"
        style={{ color: accentColor }}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.07 + 0.2, duration: 0.4 }}
      >
        {displayValue}
      </motion.p>

      {subValue && (
        <p className="mt-1 text-[11px] text-white/25 font-inter">{subValue}</p>
      )}

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: lineColor }}
      />
    </motion.div>
  );
}

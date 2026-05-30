import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // SoDEX brand
        orange:       "#FF6B00",
        "orange-dim": "#CC5500",
        "orange-lite": "#FF8A33",
        "orange-pale": "#FF6B0015",

        // Backgrounds
        black:    "#0A0A0A",
        surface:  "#111111",
        card:     "#141414",
        "card-2": "#1A1A1A",

        // Borders / UI
        border:       "rgba(255,107,0,0.18)",
        "border-dim": "rgba(255,107,0,0.08)",
        "border-hi":  "rgba(255,107,0,0.40)",

        // Status
        profit: "#22c55e",
        loss:   "#ef4444",

        // Text
        muted:      "#6B7280",
        secondary:  "#9CA3AF",
      },
      fontFamily: {
        orbitron: ["var(--font-orbitron)", "sans-serif"],
        inter:    ["var(--font-inter)",    "system-ui", "sans-serif"],
        mono:     ["JetBrains Mono", "Fira Code", "monospace"],
      },
      boxShadow: {
        glow:    "0 0 25px rgba(255,107,0,0.25), 0 0 60px rgba(255,107,0,0.08)",
        "glow-sm": "0 0 12px rgba(255,107,0,0.20)",
        "glow-lg": "0 0 40px rgba(255,107,0,0.30), 0 0 80px rgba(255,107,0,0.10)",
        card:    "0 1px 3px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,107,0,0.05)",
      },
      backgroundImage: {
        "orange-grad":   "linear-gradient(135deg, #FF6B00 0%, #FF8A33 100%)",
        "orange-radial": "radial-gradient(ellipse at center, rgba(255,107,0,0.15) 0%, transparent 70%)",
        "card-shine":    "linear-gradient(135deg, rgba(255,107,0,0.06) 0%, transparent 60%)",
      },
      keyframes: {
        "pulse-border": {
          "0%,100%": { boxShadow: "0 0 0 0 rgba(255,107,0,0.4)" },
          "50%":      { boxShadow: "0 0 0 6px rgba(255,107,0,0)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition:  "200% 0" },
        },
        "float-up": {
          "0%":   { transform: "translateY(0) scale(1)",    opacity: "0.7" },
          "100%": { transform: "translateY(-100vh) scale(0)", opacity: "0" },
        },
        "grid-scroll": {
          "0%":   { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "0 80px" },
        },
        "icon-tilt": {
          "0%,100%": { transform: "perspective(120px) rotateX(0deg)  rotateY(0deg)"  },
          "33%":     { transform: "perspective(120px) rotateX(12deg) rotateY(-8deg)" },
          "66%":     { transform: "perspective(120px) rotateX(-6deg) rotateY(10deg)" },
        },
        "count-in": {
          "0%":   { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)",   opacity: "1" },
        },
      },
      animation: {
        "pulse-border": "pulse-border 2s ease-in-out infinite",
        "float-up":     "float-up linear infinite",
        "grid-scroll":  "grid-scroll 8s linear infinite",
        "icon-tilt":    "icon-tilt 3s ease-in-out infinite",
        "count-in":     "count-in 0.4s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;

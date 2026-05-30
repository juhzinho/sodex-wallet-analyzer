import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SoDEX Wallet Analyzer",
  description:
    "Analyse any SoDEX wallet — volume, PnL, fees, funding, win rate and more.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}

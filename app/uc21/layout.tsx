import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Stock Market & Financial Globe — GDP, FX & Capital Flows — GRIP 3D",
  description:
    "Global financial data on a live WebGL globe — country GDP (World Bank), live FX exchange rates (Frankfurter), stock market indices (Alpha Vantage), and capital flow arcs. See where money moves in real time.",
  openGraph: {
    title: "Stock Market & Financial Globe — GRIP 3D",
    description:
      "GDP by country, live FX rates, stock market indices, and capital flow arcs — all on an interactive 3D WebGL globe.",
    siteName: "GRIP 3D",
    images: [{ url: "/img/tile-21.jpg", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
}

export default function UC21Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "World Job Market — Live City & Sector Map — GRIP 3D UC14",
  description:
    "Interactive MapLibre GL map of the world job market: 50+ cities, 10 industry sectors (Tech, Healthcare, Finance, Manufacturing and more), salary benchmarks, remote %, YoY growth — filterable by category in real time.",
  openGraph: {
    title: "World Job Market Map — GRIP 3D UC14",
    description:
      "50+ cities · 10 sectors · live job listings on an interactive map. Filter by Technology, Healthcare, Finance and more. Click any city for hiring trends and salary data.",
    siteName: "GRIP 3D",
  },
}

export default function UC14Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "FIFA World Cup 2026 — Live Globe Tracker — GRIP 3D",
  description:
    "Interactive 3D globe tracking the FIFA World Cup 2026 across US, Mexico, and Canada — 16 stadiums, 48 teams, fan travel corridors, live match scores, and real-time data visualization.",
  openGraph: {
    title: "FIFA World Cup 2026 Live Globe — GRIP 3D",
    description:
      "104 matches · 16 venues · 48 teams · 3 countries. Fan travel arcs, stadium capacities, match schedules, and team data on an interactive WebGL globe.",
    siteName: "GRIP 3D",
    images: [{ url: "/img/tile-31.jpg", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
}

export default function UC31Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

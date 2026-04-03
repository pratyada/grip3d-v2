import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "World Rail Networks — GRIP 3D",
  description:
    "Global railway infrastructure on a 3D globe — high-speed rail, conventional lines, freight corridors, and planned routes across 25+ countries. Passenger flow arcs, major station hubs, and the race to connect.",
  openGraph: {
    title: "World Rail Networks — GRIP 3D",
    description:
      "deck.gl 3D globe visualising global railway infrastructure — HSR lines, passenger flows, and major station hubs across Asia, Europe, Africa, and the Americas.",
    siteName: "GRIP 3D",
    images: [{ url: "/img/tile-24.jpg", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
}

export default function UC24Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

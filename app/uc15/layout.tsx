import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Starlinks Spacemap — GRIP 3D",
  description:
    "Real-time 3D tracking of the full Starlink constellation — 6,000+ satellites rendered on a WebGL globe using live TLE orbital data and SGP4 propagation. Filter by orbital shell, select any satellite for live telemetry.",
  openGraph: {
    title: "Starlinks Spacemap — Live Starlink Constellation Tracker",
    description:
      "Track every Starlink satellite in real time on a 3D WebGL globe. Filter by orbital shell, click any satellite for altitude, velocity, inclination, and ground track.",
    images: [{ url: "/img/tile-15.jpg", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
}

export default function UC15Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

import type { Metadata } from "next"
export const metadata: Metadata = {
  title: "Live Aircraft Traffic — GRIP 3D",
  description: "Real-time global aircraft tracking on a WebGL globe — 10,000+ flights from OpenSky Network, colour-coded by altitude band, with per-flight telemetry.",
  openGraph: {
    title: "Live Aircraft Traffic — Real-Time Flight Map",
    description: "Track every airborne plane in real time on a 3D WebGL globe. Filter by altitude band. Click any aircraft for callsign, speed, heading, and altitude.",
    images: [{ url: "/img/tile-17.jpg", width: 1200, height: 630 }],
  },
}
export default function UC17Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

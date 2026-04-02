import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Space Debris Tracker — GRIP 3D",
  description:
    "Real-time 3D tracking of 5,000+ space debris objects on a WebGL globe — live TLE orbital data from CelesTrak, SGP4 propagation, origin-event filters, and per-object orbital telemetry. Cosmos 2251, FenYun-1C, Iridium 33 debris clouds.",
  openGraph: {
    title: "Space Debris Tracker — Live Orbital Debris Map",
    description:
      "Track thousands of space debris pieces in real time on a 3D WebGL globe. Filter by origin event (Cosmos, FenYun, Iridium) and altitude band. Click any object for altitude, velocity, and orbital track.",
    images: [{ url: "/img/tile-16.jpg", width: 1200, height: 630 }],
  },
}

export default function UC16Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

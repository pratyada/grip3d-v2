import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Space Weather & Aurora — GRIP 3D",
  description: "Real-time aurora borealis/australis oval, Kp index, and solar wind on a WebGL globe — NOAA SWPC data, updated every 5 minutes.",
  openGraph: {
    title: "Space Weather & Aurora — Live Aurora Map",
    description: "Watch the live aurora oval on a 3D WebGL globe. Real-time Kp index, solar wind speed/density, and Bz from NOAA Space Weather Prediction Center.",
    images: [{ url: "/img/tile-20.jpg", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
}

export default function UC20Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

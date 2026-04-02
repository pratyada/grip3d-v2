import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Submarine Internet Cables — GRIP 3D",
  description: "Interactive globe of 500+ submarine internet cables and 1,200+ landing stations — TeleGeography public data, colour-coded cable routes, per-cable telemetry.",
  openGraph: {
    title: "Submarine Internet Cables — Global Cable Map",
    description: "Explore every submarine internet cable on a 3D WebGL globe. Click any cable for name, owners, length, and capacity. Filter by ocean region.",
    images: [{ url: "/img/tile-19.jpg", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
}

export default function UC19Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

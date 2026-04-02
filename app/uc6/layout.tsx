import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Cell Tower Density & Coverage — 2G/3G/LTE/5G — GRIP 3D",
  description:
    "Global cell tower density and coverage map: 40M+ towers from OpenCelliD — filter by 2G GSM, 3G UMTS, 4G LTE, 5G NR — see frequency bands, operator MCC/MNC, signal reach, and spectral allocation on a live WebGL globe.",
  openGraph: {
    title: "Cell Tower Density & Coverage Map — GRIP 3D",
    description:
      "40M+ geolocated cell towers by generation: 2G, 3G, LTE, 5G — frequency bands, operator codes, and coverage radii on an interactive WebGL globe.",
    siteName: "GRIP 3D",
    images: [{ url: "/img/tile-06.jpg", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
}

export default function UC06Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

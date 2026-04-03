import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Ocean Crisis Atlas — Plastic, Bleaching & Temperature — GRIP 3D",
  description:
    "Visualise ocean plastic pollution zones, the 2024 4th global mass coral bleaching event, and record-breaking sea surface temperature anomalies on an interactive 3D globe. Data from NOAA, ICRI, and Ocean Cleanup.",
  openGraph: {
    title: "Ocean Crisis Atlas — Plastic, Bleaching & Temperature — GRIP 3D",
    description:
      "5 ocean garbage patches, 40+ 2024 bleaching events (Great Barrier Reef 91% bleached), and 60+ record SST anomalies — all on a WebGL globe.",
    siteName: "GRIP 3D",
    images: [{ url: "/img/tile-25.jpg", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
}

export default function UC25Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

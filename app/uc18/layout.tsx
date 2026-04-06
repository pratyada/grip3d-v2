import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Global Natural Hazards Monitor | GRIP 3D",
  description:
    "Real-time 3D globe tracking active wildfires, severe storms, volcanic eruptions, earthquakes, floods, and icebergs worldwide. Data from NASA EONET + GDACS, updated every 15 minutes.",
  openGraph: {
    title: "Global Natural Hazards Monitor — GRIP 3D",
    description:
      "Live monitoring of 500+ natural hazard events worldwide — wildfires, tropical cyclones, earthquakes, volcanoes, floods on an interactive WebGL globe.",
    siteName: "GRIP 3D",
    images: [{ url: "/img/tile-18.jpg", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
}

export default function UC18Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

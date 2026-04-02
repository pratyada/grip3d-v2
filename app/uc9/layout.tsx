import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "EV Charging & Gas Stations — Global Map — GRIP 3D",
  description:
    "Global EV charging stations and gas/petrol stations on a live WebGL globe — Open Charge Map + NREL data, filter by connector type (CCS, CHAdeMO, Type 2, Tesla), charging speed, and fuel type. Track the energy transition in real time.",
  openGraph: {
    title: "EV Charging & Gas Stations Globe — GRIP 3D",
    description:
      "EV charging infrastructure vs gas stations worldwide — connector types, charging speed, operator, and live availability on an interactive WebGL globe.",
    siteName: "GRIP 3D",
    images: [{ url: "/img/tile-09.jpg", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
}

export default function UC09Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

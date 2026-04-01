import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Use Cases — Interactive Globe Demos — GRIP 3D",
  description:
    "Browse 12+ live interactive globe demos: NTN satellite service assurance, maritime AIS tracking, global AI inference grid, weather layers, demographics, earthquakes, energy, air quality, radio stations, and more.",
  openGraph: {
    title: "Globe Use Cases & Live Demos — GRIP 3D",
    description:
      "12+ live 3D globe demos across telecom, maritime, AI compute, environment, energy, and analytics. Filter by industry and explore interactive use cases.",
    siteName: "GRIP 3D",
  },
}

export default function UseCasesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

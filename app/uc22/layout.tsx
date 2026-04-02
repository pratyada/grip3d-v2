import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Global Crops & Agriculture — What Grows Where — GRIP 3D",
  description:
    "Explore global agricultural production on a live WebGL globe — FAO crop data for wheat, rice, maize, soybeans, coffee, cocoa, and 20+ crops. Country-level production, yield trends, arable land %, and food security indicators.",
  openGraph: {
    title: "Global Crops & Agriculture Globe — GRIP 3D",
    description:
      "FAO crop production data for 20+ crops across 200 countries — wheat, rice, maize, soybeans, coffee, cocoa — on an interactive 3D WebGL globe.",
    siteName: "GRIP 3D",
    images: [{ url: "/img/tile-22.jpg", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
}

export default function UC22Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

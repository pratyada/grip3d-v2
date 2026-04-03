import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Global Conflict Monitor 2025 — Armed Conflicts & Displacement — GRIP 3D",
  description:
    "Interactive 3D globe visualizing 24+ active armed conflicts, 25 major refugee displacement flows, and humanitarian crisis zones in 2024-2025. Data: ACLED, UNHCR, OCHA.",
  openGraph: {
    title: "Global Conflict Monitor 2025 — GRIP 3D",
    description:
      "117 million people forcibly displaced globally. Explore active armed conflicts, displacement corridors, and humanitarian crisis zones on an interactive 3D globe — data-driven, factual, 2024-2025.",
    siteName: "GRIP 3D",
    images: [{ url: "/img/tile-27.jpg", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
}

export default function UC27Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

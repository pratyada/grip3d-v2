import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "UNESCO World Heritage Atlas — 200+ Sites on a 3D Globe — GRIP 3D",
  description:
    "Explore 200+ UNESCO World Heritage Sites on an interactive 3D globe — cultural landmarks, natural wonders, and endangered sites across 168 countries since 1972. Filter by category, region, and endangerment status.",
  openGraph: {
    title: "UNESCO World Heritage Atlas — GRIP 3D",
    description:
      "200+ UNESCO World Heritage Sites on a 3D globe — cultural, natural, and mixed sites with tourism data, endangered status, and country-level statistics.",
    siteName: "GRIP 3D",
    images: [{ url: "/img/tile-30.jpg", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
}

export default function UC30Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

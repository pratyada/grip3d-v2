import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "AI Infrastructure Race — Global Data Centers & Undersea Cables — GRIP 3D",
  description:
    "Explore the global AI compute infrastructure on a live WebGL globe — hyperscale data centers, undersea cable connectivity, operator leaderboards, and the $500B Stargate investment. Microsoft, Google, Amazon, Meta, Alibaba, and more.",
  openGraph: {
    title: "AI Infrastructure Race — Global Data Centers Globe — GRIP 3D",
    description:
      "82 hyperscale data centers · ~15,000 MW tracked · ~8M H100-equivalent GPUs · 30 undersea cable routes on an interactive 3D WebGL globe.",
    siteName: "GRIP 3D",
    images: [{ url: "/img/tile-26.jpg", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
}

export default function UC26Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

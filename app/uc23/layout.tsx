import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Global Skyscraper Race | GRIP 3D",
  description:
    "World's tallest buildings — height, status & the race to 1000m on a 3D globe. Explore 60+ skyscrapers with deck.gl ColumnLayer on a GlobeView.",
  openGraph: {
    title: "Global Skyscraper Race — GRIP 3D",
    description:
      "Deck.gl 3D globe showing the world's tallest buildings — Burj Khalifa, Jeddah Tower, Shanghai Tower and 60+ more — by height, status, and the race to 1000m.",
    siteName: "GRIP 3D",
  },
  twitter: { card: "summary_large_image" },
}

export default function UC23Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

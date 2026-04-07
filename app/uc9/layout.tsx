import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "World History & Civilization Atlas — GRIP 3D",
  description:
    "2,500 years of human history on a 3D globe — empires, religions, migrations, and key events from 500 BC to 2025 AD. Interactive timeline with animated layers.",
  openGraph: {
    title: "World History & Civilization Atlas — GRIP 3D",
    description:
      "Explore the rise and fall of empires, spread of religions, mass migrations, and pivotal events across 13 historical eras on an interactive WebGL globe.",
    siteName: "GRIP 3D",
    images: [{ url: "/img/tile-09.jpg", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
}

export default function UC09Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

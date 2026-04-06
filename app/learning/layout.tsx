import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "GRIP3D Learning — Interactive Geography Quiz on a 3D Globe",
  description:
    "Learn geography, natural hazards, space, infrastructure, and world events through interactive 3D globe quiz cards. Perfect for kids and students.",
  openGraph: {
    title: "GRIP3D Learning — 3D Globe Quiz",
    description:
      "Swipe through 100+ geography quiz cards on an interactive 3D globe. Wildfires, earthquakes, satellites, skyscrapers, rail networks, and more.",
    siteName: "GRIP 3D",
  },
}

export default function LearningLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

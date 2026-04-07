import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Live Space Launches & Rocket Tracker | GRIP 3D",
  description:
    "Real-time 3D globe tracking 50+ upcoming rocket launches, launch pads worldwide, and space agencies including SpaceX, NASA, ISRO, CNSA, ESA, and Roscosmos with live countdowns.",
  openGraph: {
    title: "Live Space Launches & Rocket Tracker — GRIP 3D",
    description:
      "Track upcoming rocket launches from SpaceX, NASA, ISRO, and 20+ agencies on an interactive WebGL globe with live countdowns and launch pad markers.",
    siteName: "GRIP 3D",
    images: [{ url: "/img/tile-28.jpg", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
}

export default function UC28Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

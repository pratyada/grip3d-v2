import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Artemis II — Moon Mission Tracker — GRIP 3D",
  description:
    "Real-time 3D tracker for NASA's Artemis II crewed lunar mission — Orion spacecraft trajectory, live Earth-Moon geometry, crew profiles, mission timeline, and NASA imagery on an interactive WebGL visualization.",
  openGraph: {
    title: "Artemis II Moon Mission Tracker — GRIP 3D",
    description:
      "Follow NASA's first crewed lunar mission since Apollo in real time. Track the Orion spacecraft on a 3D Earth-Moon visualization with live trajectory, Kp data, crew profiles, and mission phase.",
    images: [{ url: "/img/tile-03.jpg", width: 1200, height: 630 }],
  },
}

export default function UC3Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

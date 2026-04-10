import type { Metadata } from "next"
import { headers } from "next/headers"

export async function generateMetadata(): Promise<Metadata> {
  const hdrs = await headers()
  const host = (hdrs.get("host") ?? "").toLowerCase()

  // White-label branding for artemis.yprateek.com — no GRIP 3D anywhere
  if (host === "artemis.yprateek.com") {
    // Use a build-time timestamp so og:updated_time changes on every deploy,
    // hinting to crawlers (Teams/Slack/etc.) that the preview should be re-fetched
    const updatedAt = new Date().toISOString()
    return {
      metadataBase: new URL("https://artemis.yprateek.com"),
      title: "Artemis II Live Tracker",
      description:
        "Real-time tracking of NASA's Artemis II crewed lunar mission — Orion spacecraft trajectory, splashdown countdown, NASA Live TV, parachute deployment, recovery sequence, and mission telemetry on an interactive 3D globe.",
      openGraph: {
        title: "Artemis II Live Tracker",
        description:
          "Follow NASA's first crewed lunar mission since Apollo in real time. Live splashdown countdown, NASA TV, recovery sequence, and 3D Orion trajectory tracking.",
        url: "https://artemis.yprateek.com",
        siteName: "Artemis II Live Tracker",
        type: "website",
        images: [
          {
            url: "/img/og-artemis.svg",
            width: 1200,
            height: 630,
            alt: "Artemis II Live Tracker — NASA Orion mission",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: "Artemis II Live Tracker",
        description:
          "Real-time NASA Artemis II mission tracker — splashdown countdown, NASA Live TV, recovery sequence, and 3D Orion trajectory.",
        images: ["/img/og-artemis.svg"],
      },
      icons: {
        icon: [{ url: "/img/favicon-artemis.svg", type: "image/svg+xml" }],
      },
      other: {
        "og:updated_time": updatedAt,
      },
    }
  }

  // Default GRIP 3D branding
  return {
    title: "Artemis II — Moon Mission Tracker — GRIP 3D",
    description:
      "Real-time 3D tracker for NASA's Artemis II crewed lunar mission — Orion spacecraft trajectory, live Earth-Moon geometry, crew profiles, mission timeline, and NASA imagery on an interactive WebGL visualization.",
    openGraph: {
      title: "Artemis II Moon Mission Tracker — GRIP 3D",
      description:
        "Follow NASA's first crewed lunar mission since Apollo in real time. Track the Orion spacecraft on a 3D Earth-Moon visualization with live trajectory, Kp data, crew profiles, and mission phase.",
      images: [{ url: "/img/tile-03.jpg", width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image" },
  }
}

export default function UC3Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

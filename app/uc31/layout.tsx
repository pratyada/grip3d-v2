import type { Metadata } from "next"
import { headers } from "next/headers"

export async function generateMetadata(): Promise<Metadata> {
  const hdrs = await headers()
  const host = (hdrs.get("host") ?? "").toLowerCase()

  if (host === "fifa2026.yprateek.com") {
    return {
      metadataBase: new URL("https://fifa2026.yprateek.com"),
      title: "FIFA World Cup 2026 Globe",
      description:
        "Interactive 3D globe tracking the FIFA World Cup 2026 across US, Mexico, and Canada — 16 stadiums, 48 teams, fan travel corridors, live match data, and countdown to kickoff June 11.",
      openGraph: {
        title: "FIFA World Cup 2026 Globe",
        description:
          "104 matches · 16 venues · 48 teams · 3 countries. Fan travel arcs, stadium capacities, match schedules on an interactive 3D globe.",
        url: "https://fifa2026.yprateek.com",
        siteName: "FIFA World Cup 2026 Globe",
        type: "website",
        images: [{ url: "/img/favicon-fifa.svg", width: 64, height: 64 }],
      },
      twitter: {
        card: "summary_large_image",
        title: "FIFA World Cup 2026 Globe",
        description: "16 stadiums · 48 teams · 3 countries. Live fan travel, match data, and countdown on a 3D globe.",
      },
      icons: {
        icon: [{ url: "/img/favicon-fifa.svg", type: "image/svg+xml" }],
      },
    }
  }

  return {
    title: "FIFA World Cup 2026 — Live Globe Tracker — GRIP 3D",
    description:
      "Interactive 3D globe tracking the FIFA World Cup 2026 across US, Mexico, and Canada — 16 stadiums, 48 teams, fan travel corridors, live match scores, and real-time data visualization.",
    openGraph: {
      title: "FIFA World Cup 2026 Live Globe — GRIP 3D",
      description:
        "104 matches · 16 venues · 48 teams · 3 countries. Fan travel arcs, stadium capacities, match schedules, and team data on an interactive WebGL globe.",
      siteName: "GRIP 3D",
      images: [{ url: "/img/tile-31.jpg", width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image" },
  }
}

export default function UC31Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

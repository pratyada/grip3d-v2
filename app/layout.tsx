import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { headers } from "next/headers"
import "./globals.css"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"

// Hosts that should render in "embed" mode — no GRIP navbar/footer.
// Add more here as you launch white-label subdomains.
const EMBED_HOSTS = new Set([
  "artemis.yprateek.com",
])

// Optional "back to home" link shown for embed-mode hosts.
const EMBED_HOME_LINKS: Record<string, { url: string; label: string }> = {
  "artemis.yprateek.com": { url: "https://yprateek.com", label: "yprateek.com" },
}

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

// Per-host branding overrides — favicon, title, description
const HOST_BRANDING: Record<string, { title: string; description: string; favicon: string }> = {
  "artemis.yprateek.com": {
    title: "Artemis II Live Tracker",
    description: "Real-time tracking of NASA's Artemis II crewed lunar mission — Orion spacecraft trajectory, splashdown countdown, NASA Live TV, recovery sequence.",
    favicon: "/img/favicon-artemis.svg",
  },
}

export async function generateMetadata(): Promise<Metadata> {
  const hdrs = await headers()
  const host = (hdrs.get("host") ?? "").toLowerCase()
  const branding = HOST_BRANDING[host]

  if (branding) {
    return {
      metadataBase: new URL(`https://${host}`),
      title: branding.title,
      description: branding.description,
      openGraph: {
        siteName: branding.title,
        type: "website",
        images: [{ url: branding.favicon, width: 64, height: 64 }],
      },
      icons: {
        icon: [
          { url: branding.favicon, type: "image/svg+xml" },
        ],
      },
    }
  }

  // Default GRIP 3D branding
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://test.grip3d.com"),
    title: "GRIP 3D — Interactive Globe Platform",
    description:
      "Layer-first interactive 3D globe platform: NTN satellite service assurance, maritime tracking, world job market, AI inference grid, weather, demographics, earthquakes, energy, radio and more — real-time 3D for enterprise teams.",
    openGraph: {
      siteName: "GRIP 3D",
      type: "website",
      images: [{ url: "/img/favicon-grip3d-64.png", width: 64, height: 64 }],
    },
    twitter: {
      card: "summary_large_image",
      site: "@grip3d",
    },
    icons: {
      icon: [
        { url: "/img/favicon-grip3d-16.png", sizes: "16x16" },
        { url: "/img/favicon-grip3d-32.png", sizes: "32x32" },
        { url: "/img/favicon-grip3d-64.png", sizes: "64x64" },
      ],
    },
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const hdrs = await headers()
  const host = (hdrs.get("host") ?? "").toLowerCase()
  const isEmbedMode = EMBED_HOSTS.has(host)
  // Watch party disabled — Artemis II splashed down successfully on 2026-04-11.
  // Files remain in /public/ as a historical record. Re-enable for Artemis III.
  const enableWatchParty = false

  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <head>
        {enableWatchParty && <link rel="stylesheet" href="/watch-party.css" />}
      </head>
      <body className="min-h-full flex flex-col" style={{ background: "var(--bg)", color: "var(--text)" }}>
        {!isEmbedMode && <Navbar />}
        <main className="flex-1">{children}</main>
        {!isEmbedMode && <Footer />}
        {enableWatchParty && (
          <>
            <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js" async />
            <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js" async />
            <script src="/watch-party.js" defer />
          </>
        )}
      </body>
    </html>
  )
}

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
  const homeLink = EMBED_HOME_LINKS[host]

  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col" style={{ background: "var(--bg)", color: "var(--text)" }}>
        {!isEmbedMode && <Navbar />}
        <main className="flex-1">{children}</main>
        {!isEmbedMode && <Footer />}

        {/* Floating "back to personal site" link for white-label hosts */}
        {isEmbedMode && homeLink && (
          <a
            href={homeLink.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              position: "fixed",
              top: 12,
              left: 12,
              zIndex: 100,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 999,
              background: "rgba(0,5,20,0.85)",
              border: "1px solid rgba(51,204,221,0.4)",
              color: "#67e8f9",
              fontSize: 12,
              fontWeight: 600,
              textDecoration: "none",
              backdropFilter: "blur(8px)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
              transition: "all 0.2s ease",
            }}
            title={`Visit ${homeLink.label}`}
          >
            <span>←</span>
            <span>{homeLink.label}</span>
          </a>
        )}
      </body>
    </html>
  )
}

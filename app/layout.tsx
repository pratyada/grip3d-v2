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

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  // NEXT_PUBLIC_SITE_URL must be set in Vercel env vars to your canonical domain.
  // e.g. https://test.grip3d.com  — this is what resolves relative OG image paths.
  // VERCEL_URL is the auto-generated domain and does NOT match custom domains.
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const hdrs = await headers()
  const host = (hdrs.get("host") ?? "").toLowerCase()
  const isEmbedMode = EMBED_HOSTS.has(host)

  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col" style={{ background: "var(--bg)", color: "var(--text)" }}>
        {!isEmbedMode && <Navbar />}
        <main className="flex-1">{children}</main>
        {!isEmbedMode && <Footer />}
      </body>
    </html>
  )
}

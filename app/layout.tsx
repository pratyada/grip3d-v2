import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://test.grip3d.com")
  ),
  title: "GRIP 3D — Interactive Globe Platform",
  description:
    "Layer-first interactive 3D globe platform: NTN satellite service assurance, maritime tracking, world job market, AI inference grid, weather, demographics, earthquakes, energy, radio and more — real-time 3D for enterprise teams.",
  openGraph: {
    siteName: "GRIP 3D",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/img/favicon-grip3d-16.png", sizes: "16x16" },
      { url: "/img/favicon-grip3d-32.png", sizes: "32x32" },
      { url: "/img/favicon-grip3d-64.png", sizes: "64x64" },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col" style={{ background: "var(--bg)", color: "var(--text)" }}>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}

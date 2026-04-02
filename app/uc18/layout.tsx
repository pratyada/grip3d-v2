import type { Metadata } from "next"
export const metadata: Metadata = {
  title: "Active Wildfires — GRIP 3D",
  description: "Real-time active wildfire tracking on a WebGL globe — NASA EONET satellite-detected fire events, colour-coded by region, updated every 15 minutes.",
  openGraph: {
    title: "Active Wildfires — Live Fire Map",
    description: "Track active wildfires globally on a 3D WebGL globe powered by NASA EONET. Filter by geographic region. Click any fire for event name, date, and source.",
    images: [{ url: "/img/tile-18.jpg", width: 1200, height: 630 }],
  },
}
export default function UC18Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "NTN End-to-End Service Assurance — GRIP 3D",
  description:
    "4-domain NTN E2E service assurance: Satellite → Ground Station → RAN → Core. 60 LEO passes across 5 Canadian ground sites, real-time 1-min micro KPI monitoring with eNB KPIs and Kuiper fleet data.",
  openGraph: {
    title: "NTN End-to-End Service Assurance — GRIP 3D",
    description:
      "Monitor 60 LEO satellite passes across 4 network domains — Satellite, Ground Station, RAN, and Core — with live KPI scoring and RTPM micro KPI charts.",
    siteName: "GRIP 3D",
  },
}

export default function UC10Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

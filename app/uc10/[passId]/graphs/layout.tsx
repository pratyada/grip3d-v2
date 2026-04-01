import type { Metadata } from "next"
import { getPass } from "@/lib/uc10-data"

export async function generateMetadata({ params }: { params: Promise<{ passId: string }> }): Promise<Metadata> {
  const { passId } = await params
  const pass = getPass(passId)

  if (!pass) {
    return {
      title: "KPI Graphs — GRIP 3D UC10",
      description: "Micro KPI charts and 3GPP PM counter analysis for NTN satellite pass.",
    }
  }

  return {
    title: `${passId} Micro KPI Graphs — ${pass.satellite} · ${pass.groundSite} — GRIP 3D`,
    description:
      `1-minute RTPM micro KPI charts for ${passId}: ${pass.satellite} LEO pass via ${pass.groundSite}. 19 NTN_5G counters, RRC/ERAB/HO KPIs, DL/UL throughput, RSRP heatmap, latency histogram — ${pass.ranVendor} eNB ${pass.eNB}.`,
    openGraph: {
      title: `${passId} KPI Graphs — ${pass.satellite} [${pass.overallStatus}]`,
      description:
        `Real-time micro KPI analysis: 19 3GPP NTN counters, DL ${pass.ranVendor} throughput, RSRP/SINR, handover rates, and E2E latency for ${passId} via ${pass.groundSite}.`,
      siteName: "GRIP 3D",
    },
  }
}

export default function GraphsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

import type { Metadata } from "next"
import { getPass } from "@/lib/uc10-data"

export async function generateMetadata({ params }: { params: Promise<{ passId: string }> }): Promise<Metadata> {
  const { passId } = await params
  const pass = getPass(passId)

  if (!pass) {
    return {
      title: "Pass Not Found — GRIP 3D UC10",
      description: "NTN satellite pass details for GRIP 3D UC10 service assurance.",
    }
  }

  const status = pass.overallStatus === "PASS" ? "✓ PASS" : "✗ FAIL"
  const domains = `Satellite: ${pass.domainStatus.satellite} · GS: ${pass.domainStatus.groundStation} · RAN: ${pass.domainStatus.ran} · Core: ${pass.domainStatus.core}`

  return {
    title: `${passId} — ${pass.satellite} via ${pass.groundSite} — GRIP 3D UC10`,
    description:
      `E2E ${status} | ${pass.satellite} LEO pass over ${pass.groundSite} · ${pass.durationMins} min · ${pass.ranVendor} eNB ${pass.eNB}. Domain scores: ${domains}. NTN 4-domain service assurance.`,
    openGraph: {
      title: `${passId}: ${pass.satellite} → ${pass.groundSite} [${pass.overallStatus}]`,
      description:
        `${pass.durationMins}-minute LEO pass · ${pass.ranVendor} RAN · ${domains}. View full KPI breakdown on GRIP 3D UC10 service assurance.`,
      siteName: "GRIP 3D",
    },
  }
}

export default function PassLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

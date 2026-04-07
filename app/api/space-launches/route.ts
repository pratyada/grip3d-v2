import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export interface LaunchEvent {
  id: string
  name: string
  status: string
  net: string
  rocket: string
  agency: string
  agencyCountry: string
  mission: string
  missionType: string
  orbit: string
  padName: string
  padLat: number
  padLng: number
  padCountry: string
  imageUrl: string
  wikiUrl: string
}

export async function GET() {
  try {
    const res = await fetch(
      "https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=50&mode=detailed",
      { next: { revalidate: 900 } },
    )
    if (!res.ok) throw new Error(`API ${res.status}`)
    const data = await res.json()

    const launches: LaunchEvent[] = (data.results ?? [])
      .map((l: any) => ({
        id: l.id ?? "",
        name: l.name ?? "Unknown Launch",
        status: l.status?.abbrev ?? "TBD",
        net: l.net ?? "",
        rocket:
          l.rocket?.configuration?.full_name ??
          l.rocket?.configuration?.name ??
          "Unknown",
        agency: l.launch_service_provider?.name ?? "Unknown",
        agencyCountry: l.launch_service_provider?.country_code ?? "",
        mission: l.mission?.name ?? "Unknown Mission",
        missionType: l.mission?.type ?? "Unknown",
        orbit: l.mission?.orbit?.abbrev ?? "Unknown",
        padName: l.pad?.name ?? "Unknown Pad",
        padLat: parseFloat(l.pad?.latitude) || 0,
        padLng: parseFloat(l.pad?.longitude) || 0,
        padCountry: l.pad?.country_code ?? "",
        imageUrl: l.image ?? "",
        wikiUrl:
          l.pad?.wiki_url ?? l.launch_service_provider?.wiki_url ?? "",
      }))
      .filter((l: LaunchEvent) => l.padLat !== 0 && l.padLng !== 0)

    return NextResponse.json(launches, {
      headers: {
        "Cache-Control":
          "public, max-age=900, stale-while-revalidate=1800",
      },
    })
  } catch {
    return NextResponse.json([], { status: 500 })
  }
}

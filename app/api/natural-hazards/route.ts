import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export interface HazardEvent {
  id: string
  title: string
  lat: number
  lng: number
  date: string
  category: "wildfire" | "storm" | "volcano" | "earthquake" | "flood" | "iceberg"
  severity: "critical" | "high" | "moderate" | "low"
  source: string
  sourceUrl: string
  magnitude?: string  // e.g. "5.4 Richter", "Category 3", "1500 acres"
  country?: string
  description?: string
}

export async function GET() {
  try {
    const [eonetRes, gdacsRes] = await Promise.allSettled([
      // NASA EONET — wildfires + severe storms + volcanoes + sea ice
      fetch("https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=300", {
        next: { revalidate: 900 }
      }),
      // GDACS — earthquakes, tropical cyclones, floods, volcanoes, droughts, wildfires
      fetch("https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventtype=EQ,TC,FL,VO,DR,WF&fromDate=2025-01-01", {
        next: { revalidate: 900 }
      }),
    ])

    const events: HazardEvent[] = []

    // Parse NASA EONET
    if (eonetRes.status === "fulfilled" && eonetRes.value.ok) {
      const eonet = await eonetRes.value.json()
      for (const ev of eonet.events ?? []) {
        const cat = ev.categories?.[0]?.id ?? ""
        let category: HazardEvent["category"] = "wildfire"
        if (cat === "severeStorms") category = "storm"
        else if (cat === "volcanoes") category = "volcano"
        else if (cat === "seaLakeIce") category = "iceberg"
        else if (cat === "earthquakes") category = "earthquake"
        else if (cat === "floods") category = "flood"
        else if (cat !== "wildfires") continue // skip other types

        // Get the most recent geometry point
        const geom = ev.geometry?.slice(-1)?.[0]
        if (!geom?.coordinates) continue
        const [lng, lat] = geom.coordinates
        if (!isFinite(lat) || !isFinite(lng)) continue

        events.push({
          id: ev.id ?? `eonet-${events.length}`,
          title: ev.title ?? "Unknown Event",
          lat, lng,
          date: geom.date?.substring(0, 10) ?? "",
          category,
          severity: geom.magnitudeValue > 80 ? "critical" : geom.magnitudeValue > 50 ? "high" : geom.magnitudeValue > 20 ? "moderate" : "low",
          source: ev.sources?.[0]?.id ?? "NASA EONET",
          sourceUrl: ev.sources?.[0]?.url ?? ev.link ?? "",
          magnitude: geom.magnitudeValue ? `${geom.magnitudeValue} ${geom.magnitudeUnit ?? ""}`.trim() : undefined,
        })
      }
    }

    // Parse GDACS GeoJSON
    if (gdacsRes.status === "fulfilled" && gdacsRes.value.ok) {
      const gdacs = await gdacsRes.value.json()
      for (const feat of gdacs.features ?? []) {
        const props = feat.properties ?? {}
        const coords = feat.geometry?.coordinates
        if (!coords || coords.length < 2) continue
        const [lng, lat] = coords
        if (!isFinite(lat) || !isFinite(lng)) continue

        const typeMap: Record<string, HazardEvent["category"]> = {
          EQ: "earthquake", TC: "storm", FL: "flood", VO: "volcano", DR: "wildfire", WF: "wildfire"
        }
        const category = typeMap[props.eventtype] ?? "wildfire"

        // Dedupe: skip if we already have an event very close in location
        const isDupe = events.some(e =>
          e.category === category &&
          Math.abs(e.lat - lat) < 0.5 &&
          Math.abs(e.lng - lng) < 0.5
        )
        if (isDupe) continue

        const alertMap: Record<string, HazardEvent["severity"]> = {
          Red: "critical", Orange: "high", Green: "moderate"
        }

        events.push({
          id: `gdacs-${props.eventid ?? events.length}`,
          title: props.name ?? props.eventname ?? "Unknown",
          lat, lng,
          date: props.fromdate?.substring(0, 10) ?? "",
          category,
          severity: alertMap[props.alertlevel] ?? "low",
          source: "GDACS",
          sourceUrl: props.url?.details ?? props.url?.report ?? "",
          magnitude: props.severitydata?.severitytext ?? undefined,
          country: props.country ?? undefined,
          description: props.description ?? undefined,
        })
      }
    }

    return NextResponse.json(events, {
      headers: { "Cache-Control": "public, max-age=900, stale-while-revalidate=1800" }
    })
  } catch (err) {
    return NextResponse.json([], { status: 500 })
  }
}

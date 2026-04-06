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
  magnitude?: string
  country?: string
  description?: string
}

export async function GET() {
  try {
    // Fetch 3 sources in parallel:
    // 1. EONET wildfires specifically (up to 500)
    // 2. EONET storms/volcanoes/ice (all non-wildfire open events)
    // 3. GDACS multi-hazard (earthquakes, cyclones, floods, volcanoes, droughts, wildfires)
    const [eonetFiresRes, eonetOtherRes, gdacsRes] = await Promise.allSettled([
      fetch("https://eonet.gsfc.nasa.gov/api/v3/events?status=open&category=wildfires&limit=500", {
        next: { revalidate: 900 },
      }),
      fetch("https://eonet.gsfc.nasa.gov/api/v3/events?status=open&category=severeStorms,volcanoes,seaLakeIce,earthquakes,floods&limit=100", {
        next: { revalidate: 900 },
      }),
      fetch("https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventtype=EQ,TC,FL,VO,DR,WF&fromDate=2025-01-01", {
        next: { revalidate: 900 },
      }),
    ])

    const events: HazardEvent[] = []
    const seen = new Set<string>() // track lat,lng keys for dedup

    function addKey(lat: number, lng: number): string {
      return `${lat.toFixed(2)},${lng.toFixed(2)}`
    }

    // ── Parse EONET wildfires ──────────────────────────────────────────────────
    function parseEonet(res: PromiseSettledResult<Response>) {
      if (res.status !== "fulfilled" || !res.value.ok) return Promise.resolve([])
      return res.value.json().then((data: any) => {
        for (const ev of data.events ?? []) {
          const cat = ev.categories?.[0]?.id ?? ""
          let category: HazardEvent["category"] = "wildfire"
          if (cat === "severeStorms") category = "storm"
          else if (cat === "volcanoes") category = "volcano"
          else if (cat === "seaLakeIce") category = "iceberg"
          else if (cat === "earthquakes") category = "earthquake"
          else if (cat === "floods") category = "flood"
          else if (cat !== "wildfires") continue

          // Use most recent geometry point
          const geom = ev.geometry?.slice(-1)?.[0]
          if (!geom?.coordinates) continue
          const [lng, lat] = geom.coordinates
          if (!isFinite(lat) || !isFinite(lng)) continue

          const key = addKey(lat, lng)
          if (seen.has(key)) continue
          seen.add(key)

          // Severity: use magnitude if available, else infer from title
          const mag = geom.magnitudeValue
          const title: string = ev.title ?? "Unknown Event"
          const isWild = title.toLowerCase().includes("wildfire")
          let severity: HazardEvent["severity"] = "low"
          if (mag != null && mag > 80) severity = "critical"
          else if (mag != null && mag > 50) severity = "high"
          else if (mag != null && mag > 20) severity = "moderate"
          else if (isWild) severity = "moderate" // actual wildfires are at least moderate
          // prescribed fires stay "low"

          events.push({
            id: ev.id ?? `eonet-${events.length}`,
            title,
            lat, lng,
            date: geom.date?.substring(0, 10) ?? "",
            category,
            severity,
            source: ev.sources?.[0]?.id ?? "NASA EONET",
            sourceUrl: ev.sources?.[0]?.url ?? ev.link ?? "",
            magnitude: mag ? `${mag} ${geom.magnitudeUnit ?? ""}`.trim() : undefined,
          })
        }
      })
    }

    await Promise.all([
      parseEonet(eonetFiresRes),
      parseEonet(eonetOtherRes),
    ])

    // ── Parse GDACS GeoJSON ──────────────────────────────────────────────────
    if (gdacsRes.status === "fulfilled" && gdacsRes.value.ok) {
      const gdacs = await gdacsRes.value.json()
      for (const feat of gdacs.features ?? []) {
        const props = feat.properties ?? {}
        const coords = feat.geometry?.coordinates
        if (!coords || coords.length < 2) continue
        const [lng, lat] = coords
        if (!isFinite(lat) || !isFinite(lng)) continue

        const typeMap: Record<string, HazardEvent["category"]> = {
          EQ: "earthquake", TC: "storm", FL: "flood", VO: "volcano", DR: "wildfire", WF: "wildfire",
        }
        const category = typeMap[props.eventtype] ?? "wildfire"

        // Dedupe by proximity
        const key = addKey(lat, lng)
        if (seen.has(key)) continue
        seen.add(key)

        const alertMap: Record<string, HazardEvent["severity"]> = {
          Red: "critical", Orange: "high", Green: "moderate",
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
      headers: { "Cache-Control": "public, max-age=900, stale-while-revalidate=1800" },
    })
  } catch {
    return NextResponse.json([], { status: 500 })
  }
}

// TeleGeography submarine cable + landing point data.
// Public GeoJSON, updated infrequently. Cache 24 hours.
export const revalidate = 86400

const CABLES_URL =
  "https://www.submarinecablemap.com/api/v3/cable/cable-geo.json"
const STATIONS_URL =
  "https://www.submarinecablemap.com/api/v3/landing-point/landing-point-geo.json"

export async function GET() {
  try {
    const [cablesRes, stationsRes] = await Promise.all([
      fetch(CABLES_URL, { next: { revalidate: 86400 } }),
      fetch(STATIONS_URL, { next: { revalidate: 86400 } }),
    ])

    const cablesGeo  = cablesRes.ok  ? await cablesRes.json()  : { features: [] }
    const stationsGeo= stationsRes.ok? await stationsRes.json(): { features: [] }

    // Flatten MultiLineString cables into segments, thin coordinates
    const segments: object[] = []
    for (const f of (cablesGeo.features ?? [])) {
      const p    = f.properties ?? {}
      const geom = f.geometry   ?? {}
      const rawSegments: number[][][] =
        geom.type === "LineString"      ? [geom.coordinates]
        : geom.type === "MultiLineString"? geom.coordinates
        : []

      const name   = p.name         ?? "Unknown"
      const color  = p.color        ?? "#33ccdd"
      const owners = Array.isArray(p.owners)
        ? p.owners.map((o: any) => o.name).join(", ")
        : ""
      const length = p.cable_length ?? ""
      const rfs    = p.rfs          ?? ""

      for (const seg of rawSegments) {
        if (!seg || seg.length < 2) continue
        // Thin: keep every 3rd point but always keep first and last
        const thin = seg.filter((_: any, i: number) =>
          i === 0 || i === seg.length - 1 || i % 3 === 0
        )
        segments.push({ name, color, owners, length, rfs, coords: thin })
      }
    }

    const stations = (stationsGeo.features ?? []).map((f: any) => ({
      name:    f.properties?.name    ?? "Unknown",
      country: f.properties?.country ?? "",
      lat:     f.geometry?.coordinates?.[1] ?? 0,
      lng:     f.geometry?.coordinates?.[0] ?? 0,
    }))

    return new Response(JSON.stringify({ segments, stations }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
      },
    })
  } catch {
    return new Response("Failed to fetch cable data", { status: 500 })
  }
}

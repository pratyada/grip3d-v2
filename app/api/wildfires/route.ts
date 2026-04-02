// NASA EONET v3 — active wildfire events. Free, no API key required.
// Updated continuously by NASA. Cache 15 minutes.
export const revalidate = 900

export async function GET() {
  try {
    const res = await fetch(
      "https://eonet.gsfc.nasa.gov/api/v3/events/geojson?category=wildfires&status=open&limit=500",
      {
        next: { revalidate: 900 },
        headers: { "User-Agent": "GRIP3D/1.7 contact@grip3d.com" },
      }
    )
    if (!res.ok) {
      return new Response(`EONET error ${res.status}`, { status: 502 })
    }
    const geojson = await res.json()
    return new Response(JSON.stringify(geojson), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=900, stale-while-revalidate=1800",
      },
    })
  } catch {
    return new Response("Failed to fetch wildfire data", { status: 500 })
  }
}

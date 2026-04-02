// OpenSky Network — real-time aircraft state vectors.
// Anonymous access: ~100 API credits/day. We cache aggressively.
export const revalidate = 60

export async function GET() {
  try {
    const res = await fetch("https://opensky-network.org/api/states/all", {
      next: { revalidate: 60 },
      headers: { "User-Agent": "GRIP3D/1.7 contact@grip3d.com" },
    })
    if (!res.ok) {
      return new Response(JSON.stringify({ error: `OpenSky ${res.status}`, states: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=60" },
      })
    }
    const data = await res.json()
    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60, stale-while-revalidate=120",
      },
    })
  } catch {
    return new Response(JSON.stringify({ error: "fetch_failed", states: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  }
}

// OpenSky Network — real-time aircraft state vectors.
// Server-side proxy avoids CORS (OpenSky restricts cross-origin browser requests).
export const revalidate = 60

export async function GET() {
  try {
    const res = await fetch("https://opensky-network.org/api/states/all", {
      next: { revalidate: 60 },
      headers: {
        "User-Agent": "GRIP3D/1.7 contact@grip3d.com",
        "Accept": "application/json",
      },
    })
    if (!res.ok) {
      return new Response(JSON.stringify({ error: `OpenSky ${res.status}`, states: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
      })
    }
    const data = await res.json()
    // OpenSky returns states:null when rate-limited (still HTTP 200)
    if (!data.states) {
      return new Response(JSON.stringify({ error: "rate_limited", states: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=30" },
      })
    }
    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    })
  } catch {
    return new Response(JSON.stringify({ error: "fetch_failed", states: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=30" },
    })
  }
}

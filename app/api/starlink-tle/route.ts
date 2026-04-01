// TLE text is updated by CelesTrak every 2 hours.
// We cache for 1 hour on Vercel edge; Next.js revalidates background.
export const revalidate = 3600

export async function GET() {
  try {
    const res = await fetch(
      "https://celestrak.org/NORAD/elements/supplemental/sup-gp.php?FILE=starlink&FORMAT=tle",
      {
        next: { revalidate: 3600 },
        headers: { "User-Agent": "GRIP3D/1.5 contact@grip3d.com" },
      }
    )
    if (!res.ok) {
      return new Response(`CelesTrak error ${res.status}`, { status: 502 })
    }
    const text = await res.text()
    if (!text || text.length < 100) {
      return new Response("Empty TLE response from CelesTrak", { status: 502 })
    }
    return new Response(text, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=1800",
      },
    })
  } catch (err) {
    return new Response("Failed to fetch TLE data", { status: 500 })
  }
}

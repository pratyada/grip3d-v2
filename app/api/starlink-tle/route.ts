import { NextResponse } from "next/server"

// Cache TLE data for 10 minutes — TLEs change slowly
export const revalidate = 600

export async function GET() {
  try {
    const res = await fetch(
      "https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=json",
      {
        next: { revalidate: 600 },
        headers: { "User-Agent": "GRIP3D/1.5 contact@grip3d.com" },
      }
    )
    if (!res.ok) {
      return NextResponse.json(
        { error: `CelesTrak returned ${res.status}` },
        { status: 502 }
      )
    }
    const data = await res.json()
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=600, stale-while-revalidate=300",
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch TLE data from CelesTrak" },
      { status: 500 }
    )
  }
}

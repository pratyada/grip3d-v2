// Space debris TLE data from CelesTrak.
// Fetches three major debris clouds: Cosmos-2251, FenYun-1C, Iridium-33.
// Deduplicates by NORAD ID and combines into a single TLE text response.
// CelesTrak refreshes every 2 hours; we cache 1 hour on the edge.
export const revalidate = 3600

const DEBRIS_GROUPS = [
  "cosmos-2251-debris",
  "fengyun-1c-debris",
  "iridium-33-debris",
]

export async function GET() {
  try {
    const fetches = DEBRIS_GROUPS.map((group) =>
      fetch(
        `https://celestrak.org/NORAD/elements/gp.php?GROUP=${group}&FORMAT=tle`,
        {
          next: { revalidate: 3600 },
          headers: { "User-Agent": "GRIP3D/1.6 contact@grip3d.com" },
        }
      )
        .then((r) => (r.ok ? r.text() : ""))
        .catch(() => "")
    )

    const texts = await Promise.all(fetches)

    // Deduplicate by NORAD ID across groups
    const seen = new Set<string>()
    const combined: string[] = []

    for (const text of texts) {
      if (!text || text.length < 50) continue
      const lines = text.split("\n").map((l) => l.trimEnd())
      let i = 0
      while (i < lines.length) {
        const l0 = lines[i]?.trim() ?? ""
        const l1 = lines[i + 1]
        const l2 = lines[i + 2]
        if (l1?.startsWith("1 ") && l2?.startsWith("2 ")) {
          const norad = l1.slice(2, 7).trim()
          if (norad && !seen.has(norad)) {
            seen.add(norad)
            combined.push(l0, l1, l2)
          }
          i += 3
        } else {
          i++
        }
      }
    }

    if (combined.length === 0) {
      return new Response("No debris TLE data available from CelesTrak", {
        status: 502,
      })
    }

    return new Response(combined.join("\n") + "\n", {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=1800",
      },
    })
  } catch {
    return new Response("Failed to fetch debris TLE data", { status: 500 })
  }
}

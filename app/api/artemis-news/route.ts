// NASA Image and Video Library — Artemis II news and imagery.
// No API key required. Public endpoint.
export const revalidate = 3600

export async function GET() {
  try {
    const res = await fetch(
      "https://images-api.nasa.gov/search?q=artemis+II&media_type=image&year_start=2024&page_size=12",
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) throw new Error(`NASA Images ${res.status}`)

    const data = await res.json()
    const items = (data.collection?.items ?? []).slice(0, 12).map((item: any) => ({
      title:       item.data?.[0]?.title       ?? "",
      description: item.data?.[0]?.description ?? "",
      date:        item.data?.[0]?.date_created?.slice(0, 10) ?? "",
      thumb:       item.links?.[0]?.href        ?? "",
      nasaId:      item.data?.[0]?.nasa_id      ?? "",
    }))

    return new Response(JSON.stringify({ items }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=600",
      },
    })
  } catch {
    return new Response(JSON.stringify({ items: [] }), {
      headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=120" },
    })
  }
}

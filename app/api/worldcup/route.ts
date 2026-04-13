import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// Fetch from FIFA API + format for our globe
export async function GET() {
  try {
    const res = await fetch(
      "https://api.fifa.com/api/v3/calendar/matches?idCompetition=17&idSeason=285023&count=104",
      { next: { revalidate: 300 } },
    )

    let matches: any[] = []
    if (res.ok) {
      const data = await res.json()
      matches = (data.Results ?? []).map((m: any) => ({
        id: m.IdMatch,
        date: m.Date,
        homeTeam:
          m.Home?.TeamName?.[0]?.Description ?? m.Home?.Abbreviation ?? "TBD",
        awayTeam:
          m.Away?.TeamName?.[0]?.Description ?? m.Away?.Abbreviation ?? "TBD",
        homeCode: m.Home?.Abbreviation ?? "",
        awayCode: m.Away?.Abbreviation ?? "",
        homeScore: m.Home?.Score ?? null,
        awayScore: m.Away?.Score ?? null,
        venue: m.Stadium?.Name?.[0]?.Description ?? "",
        city: m.Stadium?.CityName?.[0]?.Description ?? "",
        status: m.MatchStatus ?? 0, // 0=scheduled, 1=playing, 3=finished
        stage: m.StageName?.[0]?.Description ?? "",
        group: m.GroupName?.[0]?.Description ?? "",
      }))
    }

    return NextResponse.json(
      { matches },
      {
        headers: {
          "Cache-Control":
            "public, max-age=300, stale-while-revalidate=600",
        },
      },
    )
  } catch {
    return NextResponse.json({ matches: [] }, { status: 500 })
  }
}

// NOAA Space Weather Prediction Center — free, no API key.
// Fetches aurora oval, Kp index, and solar wind in one request.
// NOAA updates aurora data every ~5 minutes.
export const revalidate = 300

const NOAA = "https://services.swpc.noaa.gov"

export async function GET() {
  try {
    const [auroraRes, kpRes, plasmaRes, magRes] = await Promise.all([
      fetch(`${NOAA}/json/ovation_aurora_latest.json`,              { next: { revalidate: 300 } }),
      fetch(`${NOAA}/products/noaa-planetary-k-index.json`,         { next: { revalidate: 300 } }),
      fetch(`${NOAA}/json/solar-wind/plasma-1-day.json`,            { next: { revalidate: 300 } }),
      fetch(`${NOAA}/json/solar-wind/mag-1-day.json`,               { next: { revalidate: 300 } }),
    ])

    const aurora = auroraRes.ok  ? await auroraRes.json()  : {}
    const kpRaw  = kpRes.ok      ? await kpRes.json()      : []
    const plasma = plasmaRes.ok  ? await plasmaRes.json()  : []
    const mag    = magRes.ok     ? await magRes.json()     : []

    // Most recent Kp (kpRaw is [[time, Kp], ...])
    const latestKp = Array.isArray(kpRaw) && kpRaw.length > 0
      ? parseFloat(kpRaw[kpRaw.length - 1]?.[1] ?? "0")
      : 0

    // Most recent solar wind plasma
    const latestPlasma = Array.isArray(plasma) && plasma.length > 0
      ? plasma[plasma.length - 1]
      : {}
    const solarWindSpeed   = parseFloat(latestPlasma.speed   ?? "0")
    const solarWindDensity = parseFloat(latestPlasma.density  ?? "0")

    // Most recent Bz (negative Bz = geomagnetic storm driver)
    const latestMag = Array.isArray(mag) && mag.length > 0
      ? mag[mag.length - 1]
      : {}
    const bz = parseFloat(latestMag.bz ?? "0")

    return new Response(
      JSON.stringify({
        auroraCoords:   aurora.coordinates   ?? [],
        forecastTime:   aurora["Forecast Time"]     ?? "",
        observationTime:aurora["Observation Time"]  ?? "",
        currentKp:      isFinite(latestKp) ? latestKp : 0,
        solarWindSpeed: isFinite(solarWindSpeed) ? solarWindSpeed : 0,
        solarWindDensity: isFinite(solarWindDensity) ? solarWindDensity : 0,
        bz:             isFinite(bz) ? bz : 0,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
        },
      }
    )
  } catch {
    return new Response("Failed to fetch space weather data", { status: 500 })
  }
}

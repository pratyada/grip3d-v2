// NASA JPL Horizons API — real-time Moon position (J2000 ECI, km) relative to Earth center.
// No API key required. Cache 10 minutes (Moon moves ~0.04°/min).
export const revalidate = 600

export async function GET() {
  try {
    const now  = new Date()
    const stop = new Date(now.getTime() + 60 * 60 * 1000) // +1 h window
    const fmt  = (d: Date) => d.toISOString().slice(0, 16).replace("T", " ")

    const params = new URLSearchParams({
      format:      "json",
      COMMAND:     "'301'",        // Moon
      OBJ_DATA:    "'NO'",
      MAKE_EPHEM:  "'YES'",
      EPHEM_TYPE:  "'VECTORS'",
      CENTER:      "'500@399'",    // Geocenter
      START_TIME:  `'${fmt(now)}'`,
      STOP_TIME:   `'${fmt(stop)}'`,
      STEP_SIZE:   "'1h'",
      VEC_TABLE:   "'2'",          // x,y,z + vx,vy,vz
      VEC_CORR:    "'NONE'",
      OUT_UNITS:   "'KM-S'",
      REF_PLANE:   "'FRAME'",
      REF_SYSTEM:  "'J2000'",
      CSV_FORMAT:  "'YES'",
    })

    const res = await fetch(
      `https://ssd.jpl.nasa.gov/api/horizons.api?${params.toString()}`,
      { next: { revalidate: 600 } }
    )
    if (!res.ok) throw new Error(`Horizons ${res.status}`)

    const text = await res.text()
    const data = JSON.parse(text)
    const raw: string = data.result ?? ""

    // Find $$SOE ... $$EOE block
    const soe = raw.indexOf("$$SOE")
    const eoe = raw.indexOf("$$EOE")
    if (soe === -1 || eoe === -1) throw new Error("No ephemeris data in response")

    // CSV rows between markers; first data row after $$SOE
    const block = raw.slice(soe + 5, eoe).trim()
    const firstRow = block.split("\n").find(l => l.trim().length > 0)
    if (!firstRow) throw new Error("Empty ephemeris block")

    const cols = firstRow.split(",").map(s => s.trim())
    // Horizons CSV order: JDTDB, Calendar_Date, X, Y, Z, VX, VY, VZ, ...
    const x  = parseFloat(cols[2])
    const y  = parseFloat(cols[3])
    const z  = parseFloat(cols[4])
    const vx = parseFloat(cols[5])
    const vy = parseFloat(cols[6])
    const vz = parseFloat(cols[7])

    const distKm = Math.sqrt(x*x + y*y + z*z)

    return new Response(JSON.stringify({ x, y, z, vx, vy, vz, distKm, ts: now.toISOString() }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=600, stale-while-revalidate=120",
      },
    })
  } catch (err) {
    // Fallback: mean Moon position along +X axis at mean distance
    const distKm = 384400
    return new Response(JSON.stringify({ x: distKm, y: 0, z: 0, vx: 0, vy: 1.022, vz: 0, distKm, ts: new Date().toISOString(), fallback: true }), {
      headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=60" },
    })
  }
}

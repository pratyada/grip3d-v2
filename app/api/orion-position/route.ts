// NASA JPL Horizons — real Orion (Artemis II) position in Earth-centered J2000 frame.
// Horizons assigns spacecraft negative IDs. Artemis I Orion = -1031; Artemis II = -1032.
// Tries live Horizons first; falls back to physics-based MET interpolation if not yet catalogued.
export const revalidate = 120  // 2-min cache — spacecraft moves ~1,400 km/min at TLI

// Artemis II confirmed launch: 2026-04-01 18:00 UTC (update to exact T-0 when known)
export const LAUNCH_ISO = "2026-04-01T18:00:00Z"

// Known trajectory waypoints [hours from T-0, distFromEarth km, distFromMoon km]
// Based on published Artemis II mission profile (free-return, 10-day, 8,900 km closest approach)
const WAYPOINTS = [
  { h:   0,   distEarth:     6571, velKms: 9.8  },   // Launch: ~200 km LEO insertion
  { h:   1.5, distEarth:     6571, velKms: 9.8  },   // Parking orbit
  { h:   2.5, distEarth:    10000, velKms: 10.2 },   // TLI burn — accelerating
  { h:  24,   distEarth:   100000, velKms:  5.4 },   // Day 1 coast
  { h:  48,   distEarth:   205000, velKms:  3.1 },   // Day 2 coast
  { h:  72,   distEarth:   310000, velKms:  1.8 },   // Day 3 — approaching Moon
  { h:  96,   distEarth:   380000, velKms:  0.9 },   // Closest approach ~8,900 km from Moon surface
  { h: 120,   distEarth:   310000, velKms:  1.8 },   // Day 5 — returning
  { h: 168,   distEarth:   185000, velKms:  2.8 },   // Day 7
  { h: 216,   distEarth:    80000, velKms:  4.5 },   // Day 9
  { h: 240,   distEarth:     6571, velKms:  9.0 },   // Splashdown
]

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

function interpolateMet(elapsedH: number) {
  if (elapsedH <= 0) return { distEarth: 6371, velKms: 0, phase: "Pre-Launch" }
  if (elapsedH >= 240) return { distEarth: 6371, velKms: 0, phase: "Splashdown" }

  const idx = WAYPOINTS.findIndex(w => w.h > elapsedH)
  if (idx <= 0) return { distEarth: WAYPOINTS[0].distEarth, velKms: WAYPOINTS[0].velKms, phase: "Ascent" }

  const w0 = WAYPOINTS[idx - 1]
  const w1 = WAYPOINTS[idx]
  const t  = (elapsedH - w0.h) / (w1.h - w0.h)

  const PHASES = ["Launch", "Earth Orbit", "TLI Burn", "Outbound Coast", "Outbound Coast", "Approaching Moon", "Lunar Flyby", "Return Coast", "Return Coast", "Return Coast", "Splashdown"]
  return {
    distEarth: lerp(w0.distEarth, w1.distEarth, t),
    velKms:    lerp(w0.velKms,    w1.velKms,    t),
    phase:     PHASES[Math.min(idx, PHASES.length - 1)],
  }
}

async function queryHorizons(nowISO: string, stopISO: string) {
  const params = new URLSearchParams({
    format:     "json",
    COMMAND:    "'-1032'",       // Artemis II Orion (Horizons spacecraft ID)
    OBJ_DATA:   "'NO'",
    MAKE_EPHEM: "'YES'",
    EPHEM_TYPE: "'VECTORS'",
    CENTER:     "'500@399'",    // Earth geocenter
    START_TIME: `'${nowISO}'`,
    STOP_TIME:  `'${stopISO}'`,
    STEP_SIZE:  "'5m'",
    VEC_TABLE:  "'2'",
    VEC_CORR:   "'NONE'",
    OUT_UNITS:  "'KM-S'",
    REF_PLANE:  "'FRAME'",
    REF_SYSTEM: "'J2000'",
    CSV_FORMAT: "'YES'",
  })

  const res = await fetch(`https://ssd.jpl.nasa.gov/api/horizons.api?${params.toString()}`, {
    next: { revalidate: 120 },
  })
  if (!res.ok) return null
  const data = JSON.parse(await res.text())
  const raw: string = data.result ?? ""
  // Check for known error messages in the result text
  if (raw.includes("No ephemeris") || raw.includes("Cannot find") || raw.includes("does not exist")) return null
  const soe = raw.indexOf("$$SOE")
  const eoe = raw.indexOf("$$EOE")
  if (soe === -1 || eoe === -1) return null
  const block = raw.slice(soe + 5, eoe).trim()
  const firstRow = block.split("\n").find((l: string) => l.trim().length > 0)
  if (!firstRow) return null
  const cols = firstRow.split(",").map((s: string) => s.trim())
  const x  = parseFloat(cols[2])
  const y  = parseFloat(cols[3])
  const z  = parseFloat(cols[4])
  const vx = parseFloat(cols[5])
  const vy = parseFloat(cols[6])
  const vz = parseFloat(cols[7])
  if (isNaN(x)) return null

  // Sanity check: Orion must be within Earth-Moon system (< 700 000 km from Earth).
  // If Horizons matched a wrong catalogue entry (asteroid etc.) the distance will be
  // millions of km — we reject it and fall through to MET interpolation.
  const dist = Math.sqrt(x*x + y*y + z*z)
  if (dist > 700_000) return null

  return { x, y, z, vx, vy, vz }
}

export async function GET() {
  const now     = new Date()
  const stop    = new Date(now.getTime() + 30 * 60 * 1000) // +30 min window
  const fmt     = (d: Date) => d.toISOString().slice(0, 16).replace("T", " ")
  const launch  = new Date(LAUNCH_ISO)
  const elapsedH = (now.getTime() - launch.getTime()) / 3_600_000

  // ── Try live Horizons first ────────────────────────────────────────────────
  let horizons: Awaited<ReturnType<typeof queryHorizons>> = null
  if (elapsedH > 0) {
    try { horizons = await queryHorizons(fmt(now), fmt(stop)) } catch {}
  }

  if (horizons) {
    const { x, y, z, vx, vy, vz } = horizons
    const distEarth = Math.sqrt(x*x + y*y + z*z)
    const velKms    = Math.sqrt(vx*vx + vy*vy + vz*vz)
    return new Response(JSON.stringify({
      source: "horizons",
      x, y, z, vx, vy, vz,
      distEarth, velKms,
      elapsedH,
      launchIso: LAUNCH_ISO,
      ts: now.toISOString(),
    }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=120, stale-while-revalidate=60",
      },
    })
  }

  // ── Fallback: physics-based MET interpolation ──────────────────────────────
  // Do NOT return x/y/z here — the page will use the trajectory spline (which is
  // aligned to the real Moon position from Horizons) for visual placement.
  // We only supply distEarth + velKms for the telemetry panel.
  const { distEarth, velKms, phase } = interpolateMet(elapsedH)

  return new Response(JSON.stringify({
    source: "interpolated",
    x: null, y: null, z: null,
    distEarth, velKms,
    elapsedH,
    phase,
    launchIso: LAUNCH_ISO,
    ts: now.toISOString(),
  }), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=120, stale-while-revalidate=60",
    },
  })
}

// NASA JPL Horizons — real Orion (Artemis II) position in Earth-centered J2000 frame.
// Horizons assigns spacecraft negative IDs. Artemis I Orion = -1031; Artemis II = -1032.
// Tries live Horizons first; falls back to physics-based MET interpolation if not yet catalogued.
export const revalidate = 120  // 2-min cache — spacecraft moves ~1,400 km/min at TLI

// ── Mission constants (corrected) ────────────────────────────────────────────
// Liftoff: 2026-04-01 22:35:12 UTC  |  Splashdown: 2026-04-11 01:07:00 UTC
// Duration: 217.5 h (9 d 1 h 31 m)  |  Closest approach: ~6,540 km (4,067 mi)
// Peak Earth distance: 406,771 km (252,756 mi)
export const LAUNCH_ISO       = "2026-04-01T22:35:12Z"
export const SPLASHDOWN_ISO   = "2026-04-11T01:07:00Z"
export const DURATION_HOURS   = 217.5
export const CLOSEST_APPROACH_KM = 6540        // from lunar surface
export const PEAK_EARTH_KM       = 406771      // maximum distance from Earth center
export const TOTAL_DISTANCE_KM   = 1_118_800   // estimated full trajectory length

// Known trajectory waypoints matching the corrected mission profile.
// Each row: hours from T-0, distance from Earth center (km), velocity (km/s),
// and (for visual placement) a normalized direction toward the Moon used by the
// spline fallback in the page component.
const WAYPOINTS = [
  { h:    0.0, distEarth:   6371,  velKms:  0.00 },  // Liftoff — KSC surface
  { h:    0.1, distEarth:   6571,  velKms:  7.80 },  // LEO insertion ~200 km
  { h:    1.8, distEarth:   6571,  velKms: 10.40 },  // TLI burn complete
  { h:    8.5, distEarth:  40000,  velKms:  5.20 },  // Early outbound (MCC-1)
  { h:   24.0, distEarth: 120000,  velKms:  2.80 },  // T+24h — ~120 000 km
  { h:   48.0, distEarth: 195000,  velKms:  2.00 },  // Day 2
  { h:   72.0, distEarth: 250000,  velKms:  1.55 },  // T+72h — approaching Moon
  { h:   96.0, distEarth: 330000,  velKms:  1.25 },  // Final approach corridor
  { h:  120.45, distEarth: 390000, velKms:  1.35 },  // Lunar flyby — closest approach 6,540 km from surface
  { h:  130.0, distEarth: PEAK_EARTH_KM, velKms: 1.20 }, // Peak Earth distance
  { h:  144.0, distEarth: 360000,  velKms:  1.40 },  // Early return
  { h:  168.0, distEarth: 200000,  velKms:  2.10 },  // T+168h — returning
  { h:  192.0, distEarth: 110000,  velKms:  3.40 },  // Day 8
  { h:  200.0, distEarth:  50000,  velKms:  5.10 },  // T+200h
  { h:  210.0, distEarth:  15000,  velKms:  8.60 },  // Final approach
  { h:  217.0, distEarth:   6471,  velKms: 11.00 },  // Entry interface (EI)
  { h:  217.5, distEarth:   6371,  velKms:  0.00 },  // Splashdown — Pacific off San Diego
]

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

// Mission phases in order; we pick by elapsed hours
const PHASE_TABLE: { h: number; phase: string }[] = [
  { h:    0.0, phase: "Liftoff" },
  { h:    0.1, phase: "Ascent" },
  { h:    0.25, phase: "Earth Orbit" },
  { h:    1.8, phase: "Trans-Lunar Injection" },
  { h:    8.0, phase: "Outbound Coast" },
  { h:  115.0, phase: "Lunar Approach" },
  { h:  120.0, phase: "Lunar Flyby" },
  { h:  122.0, phase: "Return Coast" },
  { h:  216.5, phase: "Entry Interface" },
  { h:  217.5, phase: "Splashdown" },
]

function phaseForHours(h: number): string {
  if (h < 0) return "Pre-Launch"
  let best = PHASE_TABLE[0].phase
  for (const row of PHASE_TABLE) {
    if (h >= row.h) best = row.phase
  }
  return best
}

function interpolateMet(elapsedH: number) {
  if (elapsedH <= 0) {
    return { distEarth: 6371, velKms: 0, phase: "Pre-Launch" }
  }
  if (elapsedH >= DURATION_HOURS) {
    return { distEarth: 6371, velKms: 0, phase: "Splashdown" }
  }

  const idx = WAYPOINTS.findIndex(w => w.h > elapsedH)
  if (idx <= 0) {
    return {
      distEarth: WAYPOINTS[0].distEarth,
      velKms:    WAYPOINTS[0].velKms,
      phase:     phaseForHours(elapsedH),
    }
  }

  const w0 = WAYPOINTS[idx - 1]
  const w1 = WAYPOINTS[idx]
  const t  = (elapsedH - w0.h) / (w1.h - w0.h)

  return {
    distEarth: lerp(w0.distEarth, w1.distEarth, t),
    velKms:    lerp(w0.velKms,    w1.velKms,    t),
    phase:     phaseForHours(elapsedH),
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

  // Sanity check: Orion must stay within the Earth-Moon system (< 700 000 km).
  const dist = Math.sqrt(x*x + y*y + z*z)
  if (dist > 700_000) return null

  return { x, y, z, vx, vy, vz }
}

export async function GET() {
  const now      = new Date()
  const stop     = new Date(now.getTime() + 30 * 60 * 1000) // +30 min window
  const fmt      = (d: Date) => d.toISOString().slice(0, 16).replace("T", " ")
  const launch   = new Date(LAUNCH_ISO)
  const elapsedH = (now.getTime() - launch.getTime()) / 3_600_000

  // ── Try live Horizons first ────────────────────────────────────────────────
  let horizons: Awaited<ReturnType<typeof queryHorizons>> = null
  if (elapsedH > 0 && elapsedH < DURATION_HOURS + 1) {
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
      phase: phaseForHours(elapsedH),
      launchIso:     LAUNCH_ISO,
      splashdownIso: SPLASHDOWN_ISO,
      durationHours: DURATION_HOURS,
      ts: now.toISOString(),
    }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=120, stale-while-revalidate=60",
      },
    })
  }

  // ── Fallback: physics-based MET interpolation ──────────────────────────────
  const { distEarth, velKms, phase } = interpolateMet(elapsedH)

  return new Response(JSON.stringify({
    source: "interpolated",
    x: null, y: null, z: null,
    distEarth, velKms,
    elapsedH,
    phase,
    launchIso:     LAUNCH_ISO,
    splashdownIso: SPLASHDOWN_ISO,
    durationHours: DURATION_HOURS,
    ts: now.toISOString(),
  }), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=120, stale-while-revalidate=60",
    },
  })
}

import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Space Debris Tracker — Architecture · GRIP 3D",
  description:
    "Technical deep-dive into the Space Debris Tracker: CelesTrak multi-group TLE ingestion, SGP4 orbital propagation, Three.js WebGL particle rendering, and the story behind the three major debris-generating events.",
}

// ── Pipeline steps ────────────────────────────────────────────────────────────

const PIPELINE_STEPS = [
  {
    n:     "01",
    title: "CelesTrak Multi-Group Feed",
    icon:  "📡",
    color: "#ff4444",
    desc:
      "Three separate CelesTrak GP element-set groups are fetched in parallel: cosmos-2251-debris, fengyun-1c-debris, and iridium-33-debris. Each group contains NORAD-tracked TLEs for that specific debris cloud.",
    tech: ["CelesTrak GP API", "3 concurrent group fetches", "TLE text format", "NORAD catalogue"],
  },
  {
    n:     "02",
    title: "API Proxy & Deduplication",
    icon:  "🔁",
    color: "#ff6600",
    desc:
      "A Next.js Route Handler fetches all three groups, deduplicates by NORAD ID (the Cosmos 2251 / Iridium 33 groups overlap), and returns a single combined TLE text payload with 1-hour edge caching.",
    tech: [
      "Next.js Route Handler",
      "Promise.all parallel fetch",
      "NORAD ID deduplication",
      "1 h edge cache + SWR",
    ],
  },
  {
    n:     "03",
    title: "TLE Parsing & Classification",
    icon:  "🔬",
    color: "#ff8800",
    desc:
      "Each 3-line TLE block is parsed: NORAD ID from TLE line 1, inclination from TLE line 2. The satellite name is matched against known debris event keywords to classify origin (Cosmos, FenYun, Iridium, Other).",
    tech: [
      "3-line TLE parser",
      "Name-based origin classification",
      "Inclination extraction",
      "satrec error code validation",
    ],
  },
  {
    n:     "04",
    title: "SGP4 Orbital Propagation",
    icon:  "🧮",
    color: "#ffaa00",
    desc:
      "satellite.js `twoline2satrec()` converts TLE data into a numerical state vector (satrec). `propagate(satrec, now)` then applies the SGP4/SDP4 algorithm to compute ECI cartesian position and velocity at the current UTC time.",
    tech: ["satellite.js v5", "twoline2satrec()", "SGP4/SDP4 algorithm", "J2 + drag + solar pressure"],
  },
  {
    n:     "05",
    title: "Coordinate Transformation",
    icon:  "🌐",
    color: "#ffcc00",
    desc:
      "ECI coordinates are converted to geodetic (latitude, longitude, altitude above WGS-84 ellipsoid) using the Greenwich Mean Sidereal Time (GMST) rotation. Altitude band (LEO/MEO/GEO) is assigned from the computed height.",
    tech: [
      "ECI → ECEF → Geodetic",
      "gstime() GMST",
      "degreesLat / degreesLong",
      "Height above WGS-84",
    ],
  },
  {
    n:     "06",
    title: "WebGL Globe Rendering",
    icon:  "🖥",
    color: "#ff4444",
    desc:
      "All debris positions are loaded into a single Three.js BufferGeometry particle system (`THREE.Points`) with per-vertex colour coding by origin event. Particles pulse via a requestAnimationFrame opacity animation. Clicking any particle raycasts to show orbital telemetry and draws a full-orbit Three.js Line directly in the globe scene.",
    tech: [
      "globe.gl + Three.js",
      "BufferGeometry particle cloud",
      "Raycaster click detection",
      "THREE.Line orbit track (300 pts)",
    ],
  },
]

// ── Major events ──────────────────────────────────────────────────────────────

const EVENTS = [
  {
    year:  "2007",
    date:  "11 Jan 2007",
    title: "FenYun-1C ASAT Test",
    color: "#ff8800",
    pieces: "3,500+",
    alt:   "850 km",
    icon:  "🇨🇳",
    desc:
      "China conducted a direct-ascent kinetic-kill ASAT test against its own ageing FenYun-1C weather satellite. The hypervelocity impact at 850 km generated the largest single debris cloud in history — over 3,500 trackable pieces and an estimated 150,000 fragments larger than 1 cm. The cloud spans altitudes from 200 km to over 4,000 km and will persist for decades.",
  },
  {
    year:  "2009",
    date:  "10 Feb 2009",
    title: "Cosmos 2251 / Iridium 33 Collision",
    color: "#ff3333",
    pieces: "2,300+",
    alt:   "789 km",
    icon:  "💥",
    desc:
      "The first accidental hypervelocity collision between two intact satellites occurred over northern Siberia. The defunct Russian military satellite Cosmos 2251 struck the operational Iridium 33 commercial communications satellite at a closing speed of ~11.7 km/s. Both satellites were completely destroyed, producing two distinct debris clouds that together added more than 2,300 trackable objects to the NORAD catalogue.",
  },
  {
    year:  "2021",
    date:  "15 Nov 2021",
    title: "Kosmos 1408 ASAT Test",
    color: "#ff6644",
    pieces: "1,500+",
    alt:   "485 km",
    icon:  "🚀",
    desc:
      "Russia conducted a direct-ascent ASAT test against its own defunct Kosmos 1408 satellite, generating over 1,500 immediately trackable fragments. The debris cloud is at lower LEO altitudes (400–600 km) and decays faster than the FenYun cloud, but posed immediate conjunction risks to the ISS crew, who sheltered in their return vehicles for several hours.",
  },
]

// ── Debris classification table ───────────────────────────────────────────────

const DEBRIS_CLASSES = [
  {
    band:  "LEO",
    range: "200 – 2,000 km",
    color: "#ff4444",
    density: "Highest",
    concern: "Active satellites, ISS, crewed missions",
    decay: "Years to decades",
  },
  {
    band:  "MEO",
    range: "2,000 – 35,586 km",
    color: "#ff8800",
    density: "Moderate",
    concern: "GPS, GNSS, navigation constellations",
    decay: "Centuries",
  },
  {
    band:  "GEO",
    range: "~35,786 km",
    color: "#ffcc00",
    density: "Low but permanent",
    concern: "Communications, weather, broadcast satellites",
    decay: "Never — graveyard orbit required",
  },
  {
    band:  "HEO",
    range: "> 36,186 km",
    color: "#6688bb",
    density: "Very low",
    concern: "Molniya, scientific missions",
    decay: "Centuries to millennia",
  },
]

// ── Tech stack ────────────────────────────────────────────────────────────────

const TECH_STACK = [
  { label: "Orbital data",    value: "CelesTrak GP/TLE (3 groups)", icon: "📡" },
  { label: "Propagator",      value: "satellite.js v5 (SGP4)",       icon: "🧮" },
  { label: "Globe renderer",  value: "globe.gl + Three.js",          icon: "🌐" },
  { label: "Earth texture",   value: "NASA Blue Marble Night",       icon: "🌑" },
  { label: "Update rate",     value: "5 s position refresh",        icon: "⏱" },
  { label: "TLE cache",       value: "1 h edge cache",              icon: "🔁" },
  { label: "Framework",       value: "Next.js 16 App Router",       icon: "⚡" },
  { label: "Debris objects",  value: "5,000+ tracked pieces",       icon: "☄️" },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function UC16DetailsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

      {/* Hero */}
      <div className="mb-14">
        <Link
          href="/uc16"
          className="inline-flex items-center gap-1.5 text-xs mb-6 opacity-60 hover:opacity-100 transition-opacity"
          style={{ color: "var(--muted)" }}
        >
          ← Back to live globe
        </Link>

        <div className="flex items-center gap-3 mb-4">
          <span
            className="inline-flex items-center self-start text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full"
            style={{
              background: "rgba(255,50,50,0.12)",
              color:      "#ff5555",
              border:     "1px solid rgba(255,50,50,0.3)",
            }}
          >
            UC16 · Space Debris
          </span>
        </div>

        <h1 className="text-4xl font-bold mb-4" style={{ color: "var(--text)" }}>
          Space Debris Tracker
        </h1>
        <p className="text-lg max-w-3xl" style={{ color: "var(--muted)" }}>
          Real-time tracking of 5,000+ orbital debris objects using CelesTrak TLE feeds,
          SGP4 propagation, and WebGL globe rendering — colour-coded by origin event and
          altitude band.
        </p>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-14">
        {[
          { val: "5,000+",  label: "Tracked debris pieces" },
          { val: "3",       label: "Major origin events" },
          { val: "5 s",     label: "Position update rate" },
          { val: "1 h",     label: "TLE cache window" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-4 text-center"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <p className="text-2xl font-bold mb-1" style={{ color: "#ff5555" }}>
              {s.val}
            </p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Data pipeline */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-8" style={{ color: "var(--text)" }}>
          Data Pipeline
        </h2>
        <div className="flex flex-col gap-4">
          {PIPELINE_STEPS.map((step, idx) => (
            <div
              key={step.n}
              className="flex gap-5 rounded-xl p-5"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              {/* Step number */}
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
                  style={{
                    background: step.color + "18",
                    border:     `1px solid ${step.color}40`,
                    color:      step.color,
                  }}
                >
                  {step.icon}
                </div>
                {idx < PIPELINE_STEPS.length - 1 && (
                  <div
                    className="w-px flex-1 min-h-4"
                    style={{ background: "var(--border)" }}
                  />
                )}
              </div>

              {/* Content */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-xs font-mono opacity-50"
                    style={{ color: step.color }}
                  >
                    {step.n}
                  </span>
                  <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                    {step.title}
                  </h3>
                </div>
                <p className="text-sm mb-3 leading-relaxed" style={{ color: "var(--muted)" }}>
                  {step.desc}
                </p>
                <div className="flex flex-wrap gap-2">
                  {step.tech.map((t) => (
                    <span
                      key={t}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: step.color + "12",
                        border:     `1px solid ${step.color}28`,
                        color:      step.color,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Major events */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-8" style={{ color: "var(--text)" }}>
          Major Debris-Generating Events
        </h2>
        <div className="flex flex-col gap-5">
          {EVENTS.map((ev) => (
            <div
              key={ev.title}
              className="rounded-xl p-5"
              style={{
                background: "var(--surface)",
                border:     `1px solid ${ev.color}30`,
              }}
            >
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl">{ev.icon}</span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>
                      {ev.title}
                    </h3>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-mono"
                      style={{
                        background: ev.color + "18",
                        color:      ev.color,
                        border:     `1px solid ${ev.color}35`,
                      }}
                    >
                      {ev.date}
                    </span>
                  </div>
                  <div className="flex gap-4 mt-1">
                    <span className="text-xs" style={{ color: "var(--muted)" }}>
                      Trackable pieces: <strong style={{ color: ev.color }}>{ev.pieces}</strong>
                    </span>
                    <span className="text-xs" style={{ color: "var(--muted)" }}>
                      Altitude: <strong style={{ color: "var(--text)" }}>{ev.alt}</strong>
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                {ev.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Altitude band classification */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--text)" }}>
          Altitude Band Classification
        </h2>
        <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
          Orbital altitude determines debris lifetime, affected assets, and long-term risk.
          LEO is by far the most dangerous regime due to high orbital velocity and proximity
          to operational crewed missions.
        </p>
        <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                {["Band", "Altitude Range", "Debris Density", "Assets at Risk", "Orbital Decay"].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-semibold tracking-wider"
                      style={{ color: "var(--muted)" }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {DEBRIS_CLASSES.map((row, i) => (
                <tr
                  key={row.band}
                  style={{
                    background:   i % 2 === 0 ? "transparent" : "var(--surface)",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <td className="px-4 py-3 font-semibold" style={{ color: row.color }}>
                    {row.band}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text)" }}>
                    {row.range}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--muted)" }}>
                    {row.density}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--muted)" }}>
                    {row.concern}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--muted)" }}>
                    {row.decay}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Kessler Syndrome explainer */}
      <section className="mb-14">
        <div
          className="rounded-xl p-6"
          style={{
            background: "rgba(255,50,50,0.05)",
            border:     "1px solid rgba(255,50,50,0.2)",
          }}
        >
          <h2 className="text-xl font-bold mb-3" style={{ color: "#ff5555" }}>
            ⚠️ The Kessler Syndrome
          </h2>
          <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--muted)" }}>
            Proposed by NASA scientist Donald Kessler in 1978, the Kessler Syndrome describes
            a cascade scenario where orbital debris density in LEO becomes high enough that
            collisions generate more debris than natural decay removes — creating a self-sustaining
            chain reaction that renders entire orbital bands unusable.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            Many researchers believe low LEO (~500–800 km) has already reached a tipping point
            for some debris populations. Each collision, like the 2009 Cosmos–Iridium event and
            the 2007 FenYun ASAT test visualised here, meaningfully increases cascade risk for
            all operators in the affected altitude band.
          </p>
        </div>
      </section>

      {/* Tech stack */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--text)" }}>
          Tech Stack
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TECH_STACK.map((t) => (
            <div
              key={t.label}
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <span className="text-xl">{t.icon}</span>
              <div>
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  {t.label}
                </p>
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                  {t.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Data source */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--text)" }}>
          Data Source
        </h2>
        <div
          className="rounded-xl p-5"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">📡</span>
            <div>
              <h3 className="font-semibold mb-1" style={{ color: "var(--text)" }}>
                CelesTrak General Perturbations (GP) Catalogue
              </h3>
              <p className="text-sm leading-relaxed mb-2" style={{ color: "var(--muted)" }}>
                Maintained by Dr T.S. Kelso (AMSAT), CelesTrak provides free, public access to
                the US Space Force 18th Space Control Squadron orbital element sets derived from
                the NORAD/Space Track catalogue. TLE data conforms to CCSDS OMM v2.0 and is
                refreshed approximately every 2 hours. Three specific debris groups are fetched
                for this demo: <code className="text-xs px-1 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)" }}>cosmos-2251-debris</code>,{" "}
                <code className="text-xs px-1 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)" }}>fengyun-1c-debris</code>, and{" "}
                <code className="text-xs px-1 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)" }}>iridium-33-debris</code>.
              </p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                API endpoint:{" "}
                <span
                  className="font-mono"
                  style={{ color: "var(--text)" }}
                >
                  celestrak.org/NORAD/elements/gp.php?GROUP=&#123;group&#125;&FORMAT=tle
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="flex gap-3">
        <Link
          href="/uc16"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: "#ff4444", color: "#fff" }}
        >
          ← Back to live globe
        </Link>
        <Link
          href="/use-cases"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)" }}
        >
          All use cases
        </Link>
      </div>
    </div>
  )
}

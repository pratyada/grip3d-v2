import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Artemis II Moon Mission Tracker — Deep Dive · GRIP 3D",
  description:
    "Complete technical and mission brief on GRIP 3D's Artemis II tracker: NASA JPL Horizons ephemeris, Orion free-return trajectory, crew profiles, real-time telemetry, and the WebGL 3D Earth-Moon visualization architecture.",
}

const SECTIONS = [
  {
    n: "01",
    title: "The Mission",
    icon: "🚀",
    color: "#ff8822",
    body: `Artemis II is NASA's first crewed mission to the Moon since Apollo 17 in December 1972. Liftoff occurs 2026-04-01 22:35:12 UTC aboard the Space Launch System (SLS) Block 1 rocket from Launch Complex 39B at Kennedy Space Center. The mission lasts 217.5 hours (9 days 1 hour 31 minutes) and carries four astronauts on a free-return lunar flyby. The Orion Multi-Purpose Crew Vehicle (MPCV) will pass within ~6,540 km (4,067 mi) of the lunar surface — closer than any crewed spacecraft in 54 years — reach a peak distance of 406,771 km (252,756 mi) from Earth, then splash down in the Pacific Ocean off San Diego at 2026-04-11 01:07:00 UTC.

Unlike Apollo, Artemis II does not insert into lunar orbit. It uses a free-return trajectory: the Moon's gravity naturally redirects Orion back toward Earth without any additional engine burn, making the mission extremely robust to abort scenarios. This is the critical human-rating flight before Artemis III attempts the first crewed lunar landing since 1972.`,
  },
  {
    n: "02",
    title: "The Crew",
    icon: "👨‍🚀",
    color: "#33ccdd",
    body: `Four astronauts fly Artemis II — the most diverse crew ever sent to the Moon:

Reid Wiseman (Commander, NASA) — U.S. Navy test pilot, ISS Expedition 40/41 veteran, and selected as Artemis II commander in 2023. Wiseman will be the first Artemis commander to leave Earth orbit.

Victor Glover (Pilot, NASA) — U.S. Navy test pilot, SpaceX Crew-1 veteran, and the first Black astronaut to fly to the vicinity of the Moon. Glover completed a six-month ISS mission in 2021 and brings critical long-duration operations experience.

Christina Koch (Mission Specialist 1, NASA) — Holds the record for the longest single spaceflight by a woman (328 days on ISS). Koch will become the first woman to travel to lunar distance, extending her historic milestone from Earth orbit to cislunar space.

Jeremy Hansen (Mission Specialist 2, CSA) — Royal Canadian Air Force fighter pilot and astronomer, selected by the Canadian Space Agency. Hansen becomes the first non-American to fly to the Moon, representing Canada's historic seat on the Artemis crew under the Artemis Accords.`,
  },
  {
    n: "03",
    title: "Trajectory — Free Return to the Moon",
    icon: "🛸",
    color: "#cc44ff",
    body: `Artemis II follows a free-return trajectory around the Moon rather than a direct orbital insertion. The trajectory unfolds across the 217.5-hour mission:

T+0 — Liftoff (2026-04-01 22:35:12Z): SLS Block 1 lifts off from LC-39B with 8.8 million pounds of thrust. The core stage and twin solid rocket boosters burn for ~8 minutes, placing Orion's upper stage into a low Earth parking orbit.

T+0.25h — Orbit Insertion: Initial Earth orbit achieved. The crew performs full systems checks.

T+1.8h — Trans-Lunar Injection: The Interim Cryogenic Propulsion Stage (ICPS) fires, accelerating Orion to ~10.4 km/s and placing it on a trajectory to the Moon. ICPS separation follows shortly after.

T+8.5h / T+28h — MCC-1 and MCC-2: First and second mid-course corrections refine the outbound path.

T+24h — ~120,000 km from Earth. T+72h — ~250,000 km from Earth, approaching the Moon.

T+120.45h — Lunar Flyby (2026-04-06 22:02Z): Orion swings to a closest approach of ~6,540 km (4,067 mi) from the lunar surface. The Moon's gravity redirects Orion back toward Earth — no engine burn needed.

T+130h — Maximum Distance: Peak distance from Earth of 406,771 km (252,756 mi).

T+168h / T+192h — MCC-R1 and MCC-R2: Return mid-course corrections.

T+217h — Entry Interface: Orion re-enters at ~11 km/s, protected by its Avcoat ablative heat shield (the largest ever flown).

T+217.5h — Splashdown (2026-04-11 01:07Z): Parachutes deploy and Orion splashes down in the Pacific Ocean off San Diego.`,
  },
  {
    n: "04",
    title: "Real-Time Data Sources",
    icon: "📡",
    color: "#44ff88",
    body: `The GRIP 3D Artemis II tracker integrates three live data pipelines:

NASA JPL Horizons (Primary — Orion position): JPL's Solar System Dynamics group maintains the Horizons Web API, which provides precise ephemeris data for every tracked solar system body and spacecraft. Orion Artemis II is catalogued as spacecraft ID -1032 in the J2000 Earth-centered inertial (ECI) reference frame. The GRIP 3D server queries this at /api/orion-position every 2 minutes, returning X/Y/Z position in kilometres and velocity components in km/s. The 2-minute cache reflects Horizons' own update cadence.

NASA JPL Horizons (Moon position): The Moon (body ID 301) is queried separately from the Earth geocenter (500@399) in the same J2000 ECI frame. This gives the precise Earth-Moon geometry rather than using mean orbital elements. Updated every 10 minutes — the Moon moves ~1.4 km/s.

NASA Image and Video Library (News feed): NASA's public multimedia API is queried for recent "Artemis II" imagery without authentication. The gallery drawer shows the latest 12 items returned, updated hourly.

NASA Live TV (YouTube embed): A prominent "NASA LIVE TV" button opens an inline YouTube live-stream panel tuned to NASA's official channel for Artemis II mission coverage. Users can mute/unmute the audio directly from the panel header — the stream auto-reloads with the updated mute state when toggled.

Mission-Elapsed-Time Fallback: If Horizons has not yet catalogued the Orion spacecraft (typical within the first 12–24 hours after launch), the API falls back to a physics-interpolated position derived from the corrected mission waypoints (LEO insertion at T+0.1h, TLI at T+1.8h, 120,000 km at T+24h, lunar flyby at T+120.45h, peak distance 406,771 km at T+130h, splashdown at T+217.5h) using linear interpolation between known distance and velocity at each milestone. A banner on the visualisation indicates which data source is active.`,
  },
  {
    n: "05",
    title: "3D Visualisation Architecture",
    icon: "🌐",
    color: "#5588ff",
    body: `Unlike the Earth-surface use cases (UC15 Starlink, UC17 Aircraft) which use globe.gl, Artemis II required a custom Three.js scene to represent the full Earth-Moon system in 3D space.

Scale: 1 Three.js unit = 5,000 km. At this scale, Earth has a radius of ~1.27 units, the Moon is ~0.35 units, and the Moon sits ~77 units from Earth (real average 384,400 km). The vast scale difference is why the Moon appears small but far away.

Earth: SphereGeometry with a Phong material, a translucent atmosphere shell, and a subtle wireframe grid overlay. The KSC launch site is marked with an orange dot at 28.6°N, 80.6°W, computed from lat/lng using the corrected polar2Cartesian formula (theta = (90 - lng) * π/180, positive X component).

Moon: SphereGeometry positioned at real-time coordinates from NASA JPL Horizons. A TorusGeometry ring provides a visual locator ring around the Moon, and the approximate lunar orbital path (inclined ~23.4° to match the ecliptic tilt approximation) is drawn as a closed LineLoop.

Orion Spacecraft: A compound Three.js Group built from primitives to approximate the real Orion MPCV: a truncated CylinderGeometry crew module, flat heat shield disc, service module cylinder, engine bell nozzle, and four BoxGeometry solar panel wings with CylinderGeometry struts — matching the real European Service Module layout. A PointLight child of the group illuminates surrounding geometry as the spacecraft moves.

Trajectory Arc: A CatmullRomCurve3 spline through mission waypoints (launch → LEO → TLI boost → outbound coast → lunar flyby → return coast → splashdown) sampled at 240 points and rendered as a Line primitive.

Camera: Spherical orbit controls via mouse drag and scroll wheel, starting at r=110 (550,000 km equivalent) to show both Earth and the outbound trajectory clearly.`,
  },
  {
    n: "06",
    title: "Why It Matters — The Artemis Program",
    icon: "🌕",
    color: "#fde68a",
    body: `Artemis is NASA's programme to establish a sustained human presence at and around the Moon for the first time since Apollo. It represents a fundamental shift from flags-and-footprints exploration to long-term cislunar infrastructure.

Artemis I (November 2022) was the uncrewed shakeout flight. Orion flew 40,000 km beyond the Moon — farther from Earth than any human-rated spacecraft — for 25.5 days, validating heat shield performance, life support, and deep-space communications at full system scale.

Artemis II (April 2026) proves that humans can survive the transit, perform the flyby, and return safely. No new orbital hardware is tested; the mission is entirely about validating crew operations and Orion's human-rating.

Artemis III (NET 2027) will land two astronauts on the lunar South Pole — the first lunar surface landing since Apollo 17. The SpaceX Starship Human Landing System will serve as the descent vehicle, refuelled in low Earth orbit by SpaceX Starship tankers.

Artemis IV and beyond will assemble the Lunar Gateway station in near-rectilinear halo orbit (NRHO), providing a permanent staging point for Moon operations and eventual Mars preparation missions.

The Artemis Accords, signed by 50+ nations, establish the diplomatic and operational framework for this multi-decade return to the Moon — one of the largest coordinated human endeavours since the International Space Station.`,
  },
]

const STATS = [
  { label: "Launch Vehicle", value: "SLS Block 1", sub: "8.8M lbf thrust" },
  { label: "Spacecraft", value: "Orion MPCV", sub: "European Service Module" },
  { label: "Launch Pad", value: "LC-39B", sub: "Kennedy Space Center" },
  { label: "Launch Date", value: "1 Apr 2026", sub: "22:35:12 UTC" },
  { label: "Splashdown", value: "11 Apr 2026", sub: "01:07:00 UTC" },
  { label: "Duration", value: "217.5 hours", sub: "9 d 1 h 31 m" },
  { label: "Closest Moon", value: "6,540 km", sub: "4,067 mi from surface" },
  { label: "Peak Earth Distance", value: "406,771 km", sub: "252,756 mi" },
  { label: "Total Trajectory", value: "~1.12 M km", sub: "Full flight distance" },
  { label: "Crew Size", value: "4 astronauts", sub: "CDR / PLT / MS1 / MS2" },
  { label: "Recovery", value: "Pacific Ocean", sub: "Off San Diego" },
  { label: "Max Speed", value: "~11 km/s", sub: "Re-entry Mach 32" },
  { label: "Heat Shield", value: "5.03 m dia", sub: "Avcoat ablative, largest ever" },
  { label: "Trajectory", value: "Free-return", sub: "No lunar orbit insertion" },
  { label: "Previous Crewed Moon", value: "Apollo 17", sub: "December 1972" },
]

const LIVE_TELEMETRY_FIELDS = [
  ["Distance from Earth",       "km (and miles via UI toggle)"],
  ["Distance from Moon",        "computed against JPL Horizons lunar ephemeris"],
  ["Altitude above Earth",      "distance minus 6,371 km Earth radius"],
  ["Speed",                     "km/s, km/h, and Mach number"],
  ["Light-time delay",          "one-way latency to/from Earth"],
  ["g-force",                   "gravity from Earth + Moon"],
  ["Mission progress",          "percentage of 217.5-hour duration"],
  ["Total distance travelled",  "~1,118,800 km cumulative"],
  ["Hull sunlit / shadow",      "+120°C / −150°C estimates"],
  ["Cabin temperature",         "~22°C constant"],
  ["Heatshield temperature",    "cruise ~22°C, re-entry ~2,700°C"],
]

const MISSION_EVENT_TABLE = [
  { t: "T+0",       utc: "2026-04-01 22:35:12Z", title: "Liftoff",               type: "Milestone" },
  { t: "T+0.13h",   utc: "2026-04-01 22:43:00Z", title: "Stage Separation",      type: "Milestone" },
  { t: "T+0.25h",   utc: "2026-04-01 22:50:00Z", title: "Orbit Insertion",       type: "Milestone" },
  { t: "T+1.8h",    utc: "2026-04-02 00:23:00Z", title: "Trans-Lunar Injection", type: "Burn" },
  { t: "T+2.0h",    utc: "2026-04-02 00:35:00Z", title: "ICPS Separation",       type: "Milestone" },
  { t: "T+8.5h",    utc: "2026-04-02 07:05:00Z", title: "MCC-1",                 type: "Burn" },
  { t: "T+28h",     utc: "2026-04-03 02:35:00Z", title: "MCC-2",                 type: "Burn" },
  { t: "T+48h",     utc: "2026-04-03 22:35:00Z", title: "Outbound Day 2",        type: "Phase" },
  { t: "T+72h",     utc: "2026-04-04 22:35:00Z", title: "Outbound Day 3",        type: "Phase" },
  { t: "T+96h",     utc: "2026-04-05 22:35:00Z", title: "MCC-3",                 type: "Burn" },
  { t: "T+120.45h", utc: "2026-04-06 22:02:00Z", title: "Lunar Flyby (6,540 km)",type: "Milestone" },
  { t: "T+130h",    utc: "2026-04-07 08:35:00Z", title: "Peak Earth Distance",   type: "Milestone" },
  { t: "T+144h",    utc: "2026-04-07 22:35:00Z", title: "Return Trajectory",     type: "Phase" },
  { t: "T+168h",    utc: "2026-04-08 22:35:00Z", title: "MCC-R1",                type: "Burn" },
  { t: "T+192h",    utc: "2026-04-09 22:35:00Z", title: "MCC-R2",                type: "Burn" },
  { t: "T+217h",    utc: "2026-04-11 00:35:00Z", title: "Entry Interface",       type: "Milestone" },
  { t: "T+217.5h",  utc: "2026-04-11 01:07:00Z", title: "Splashdown",            type: "Milestone" },
]

export default function UC3DetailsPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #000008 0%, #0a0520 50%, #001430 100%)" }}>
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(ellipse at 30% 50%, #ff6600 0%, transparent 60%), radial-gradient(ellipse at 70% 30%, #0055ff 0%, transparent 50%)" }} />
        <div className="relative max-w-5xl mx-auto px-6 py-20">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/uc3" className="text-sm text-orange-400 hover:text-orange-300 transition-colors">
              ← Live Tracker
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-sm text-gray-400">Mission Brief</span>
          </div>
          <div className="flex items-start gap-6">
            <div className="text-6xl">🚀</div>
            <div>
              <div className="text-xs font-mono text-orange-400 tracking-widest mb-2">UC03 · MISSION BRIEF</div>
              <h1 className="text-4xl font-bold text-white mb-3 leading-tight">
                Artemis II<br />
                <span style={{ color: "#ff8822" }}>Moon Mission Tracker</span>
              </h1>
              <p className="text-lg text-gray-300 max-w-2xl leading-relaxed">
                Humanity's return to the Moon — tracked in real-time on a 3D WebGL Earth-Moon system.
                NASA's first crewed lunar mission since Apollo 17, visualised with live JPL Horizons
                ephemeris data, free-return trajectory simulation, and crew telemetry.
              </p>
            </div>
          </div>

          {/* Quick stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-10">
            {STATS.map(s => (
              <div key={s.label} className="rounded-lg p-3"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="text-xs text-gray-500 mb-0.5">{s.label}</div>
                <div className="text-sm font-bold text-white">{s.value}</div>
                <div className="text-xs text-gray-500">{s.sub}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex gap-3">
            <Link href="/uc3"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{ background: "#ff6600", color: "#fff" }}>
              Open Live Tracker →
            </Link>
            <a href="https://www.nasa.gov/artemis/" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold border border-gray-600 text-gray-300 hover:border-gray-400 transition-all">
              NASA Artemis ↗
            </a>
          </div>
        </div>
      </div>

      {/* Mission timeline visual */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="text-xl font-bold text-white mb-6">Mission Timeline</h2>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px" style={{ background: "rgba(255,136,34,0.3)" }} />
          <div className="space-y-6 pl-12">
            {[
              { t: "T+0",        label: "Liftoff",         detail: "SLS Block 1 lifts off from LC-39B with 8.8M lbf thrust at 22:35:12 UTC.", color: "#ff6600" },
              { t: "T+0.25h",    label: "Orbit Insertion", detail: "Initial Earth orbit achieved. Crew checks all systems.", color: "#ff8822" },
              { t: "T+1.8h",     label: "TLI Burn",        detail: "ICPS fires, accelerating Orion to ~10.4 km/s toward the Moon.", color: "#ffaa44" },
              { t: "T+24h",      label: "~120,000 km",     detail: "Day 1 outbound coast.", color: "#ffcc66" },
              { t: "T+72h",      label: "~250,000 km",     detail: "Day 3 outbound, approaching Moon.", color: "#ffcc66" },
              { t: "T+120.45h",  label: "Lunar Flyby",     detail: "Closest approach 6,540 km (4,067 mi) from lunar surface. Free-return redirect.", color: "#33ccdd" },
              { t: "T+130h",     label: "Peak Distance",   detail: "Farthest from Earth: 406,771 km (252,756 mi) — new human record.", color: "#a855f7" },
              { t: "T+168h",     label: "Return Coast",    detail: "Return trajectory, ~200,000 km from Earth.", color: "#5588ff" },
              { t: "T+217h",     label: "Entry Interface", detail: "Re-entry at 11 km/s (Mach 32). Avcoat heat shield absorbs ~2,700°C.", color: "#ef4444" },
              { t: "T+217.5h",   label: "Splashdown",      detail: "Pacific Ocean off San Diego at 01:07 UTC. Welcome home!", color: "#44ff88" },
            ].map((step, i) => (
              <div key={i} className="relative flex gap-4">
                <div className="absolute -left-8 w-4 h-4 rounded-full border-2 flex-shrink-0"
                  style={{ background: step.color, borderColor: step.color, boxShadow: `0 0 8px ${step.color}` }} />
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-mono" style={{ color: step.color }}>{step.t}</span>
                    <span className="text-sm font-bold text-white">{step.label}</span>
                  </div>
                  <p className="text-sm text-gray-400 leading-snug">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main article sections */}
      <div className="max-w-5xl mx-auto px-6 pb-20 space-y-10">
        {SECTIONS.map((s) => (
          <section key={s.n} className="rounded-2xl overflow-hidden"
            style={{ border: `1px solid ${s.color}22`, background: "rgba(255,255,255,0.015)" }}>
            <div className="flex items-center gap-4 px-6 py-4"
              style={{ borderBottom: `1px solid ${s.color}22`, background: `${s.color}08` }}>
              <span className="text-2xl">{s.icon}</span>
              <div>
                <div className="text-xs font-mono" style={{ color: s.color }}>SECTION {s.n}</div>
                <h2 className="text-lg font-bold text-white">{s.title}</h2>
              </div>
            </div>
            <div className="px-6 py-5">
              {s.body.split("\n\n").map((para, i) => (
                <p key={i} className="text-sm text-gray-300 leading-relaxed mb-4 last:mb-0">{para}</p>
              ))}
            </div>
          </section>
        ))}

        {/* Live telemetry fields */}
        <section className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(59,130,246,0.18)", background: "rgba(255,255,255,0.015)" }}>
          <div className="flex items-center gap-4 px-6 py-4"
            style={{ borderBottom: "1px solid rgba(59,130,246,0.18)", background: "rgba(59,130,246,0.05)" }}>
            <span className="text-2xl">📡</span>
            <div>
              <div className="text-xs font-mono text-blue-400">LIVE TELEMETRY</div>
              <h2 className="text-lg font-bold text-white">Orion Telemetry Fields</h2>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {LIVE_TELEMETRY_FIELDS.map(([k, v]) => (
              <div key={k} className="rounded-lg p-3"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="text-sm font-semibold text-white">{k}</div>
                <div className="text-xs text-gray-400 mt-0.5">{v}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Mission events table */}
        <section className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(168,85,247,0.18)", background: "rgba(255,255,255,0.015)" }}>
          <div className="flex items-center gap-4 px-6 py-4"
            style={{ borderBottom: "1px solid rgba(168,85,247,0.18)", background: "rgba(168,85,247,0.05)" }}>
            <span className="text-2xl">📅</span>
            <div>
              <div className="text-xs font-mono text-purple-400">COVERAGE EVENTS</div>
              <h2 className="text-lg font-bold text-white">Mission Event Schedule</h2>
            </div>
          </div>
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 uppercase tracking-wider">
                  <th className="text-left px-3 py-2">MET</th>
                  <th className="text-left px-3 py-2">UTC</th>
                  <th className="text-left px-3 py-2">Event</th>
                  <th className="text-left px-3 py-2">Type</th>
                </tr>
              </thead>
              <tbody>
                {MISSION_EVENT_TABLE.map((e, i) => (
                  <tr key={i} className="border-t" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                    <td className="px-3 py-2 font-mono text-orange-300 tabular-nums">{e.t}</td>
                    <td className="px-3 py-2 font-mono text-gray-400 tabular-nums">{e.utc}</td>
                    <td className="px-3 py-2 text-white">{e.title}</td>
                    <td className="px-3 py-2">
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: e.type === "Burn" ? "rgba(251,146,60,0.15)" : e.type === "Milestone" ? "rgba(168,85,247,0.15)" : "rgba(96,165,250,0.15)",
                          color: e.type === "Burn" ? "#fb923c" : e.type === "Milestone" ? "#a855f7" : "#60a5fa",
                        }}>
                        {e.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Crew cards */}
        <section className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(100,200,100,0.15)", background: "rgba(255,255,255,0.015)" }}>
          <div className="flex items-center gap-4 px-6 py-4"
            style={{ borderBottom: "1px solid rgba(100,200,100,0.15)", background: "rgba(100,200,100,0.04)" }}>
            <span className="text-2xl">👨‍🚀</span>
            <div>
              <div className="text-xs font-mono text-green-400">CREW MANIFEST</div>
              <h2 className="text-lg font-bold text-white">4 Astronauts — Mission Roster</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
            {[
              {
                name: "Reid Wiseman", role: "Commander", agency: "NASA", flag: "🇺🇸",
                color: "#ff8822",
                facts: ["U.S. Navy test pilot", "ISS Exp 40/41 veteran", "165+ hrs EVA", "First Artemis Commander"],
                bio: "Wiseman was selected as Artemis II commander in 2023. A Naval Aviator with 2,500+ flight hours in 25+ aircraft types and a Masters in Systems Engineering from Johns Hopkins, he brings operational precision to NASA's most ambitious crewed mission since Apollo.",
              },
              {
                name: "Victor Glover", role: "Pilot", agency: "NASA", flag: "🇺🇸",
                color: "#33ccdd",
                facts: ["U.S. Navy test pilot", "SpaceX Crew-1 (ISS)", "6-month ISS mission", "First Black lunar-vicinity astronaut"],
                bio: "Glover's 2020 Crew-1 mission included critical ISS maintenance. His pilot role on Artemis II positions him to be the first African-American to travel to the Moon — a historic milestone 54 years after Apollo 17.",
              },
              {
                name: "Christina Koch", role: "Mission Specialist 1", agency: "NASA", flag: "🇺🇸",
                color: "#cc44ff",
                facts: ["328-day ISS record", "Record female EVA hours", "Electrical engineer", "First woman to lunar vicinity"],
                bio: "Koch's 328-day ISS mission (2019–2020) set the record for the longest single spaceflight by a woman. Artemis II extends that record from LEO to cislunar space — making her the first woman to travel to the vicinity of the Moon.",
              },
              {
                name: "Jeremy Hansen", role: "Mission Specialist 2", agency: "CSA", flag: "🇨🇦",
                color: "#fde68a",
                facts: ["Royal Canadian Air Force", "Fighter pilot & astronomer", "CSA class of 2009", "First non-American to Moon"],
                bio: "Hansen represents Canada's historic Artemis seat secured under the Artemis Accords — Canada contributed the Canadarm3 robotic system to the Lunar Gateway in exchange for a Moon-bound crew seat. He will be the first non-American to travel to the Moon.",
              },
            ].map(c => (
              <div key={c.name} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${c.color}30` }}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{c.flag}</span>
                  <div>
                    <div className="text-sm font-bold text-white">{c.name}</div>
                    <div className="text-xs" style={{ color: c.color }}>{c.role} · {c.agency}</div>
                  </div>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed mb-3">{c.bio}</p>
                <div className="flex flex-wrap gap-1.5">
                  {c.facts.map(f => (
                    <span key={f} className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: `${c.color}15`, color: c.color, border: `1px solid ${c.color}30` }}>
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <div className="text-center pt-4">
          <Link href="/uc3"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-base font-semibold transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, #ff6600, #ff3300)", color: "#fff", boxShadow: "0 0 30px #ff660040" }}>
            🚀 Open Live Tracker
          </Link>
          <div className="mt-4 text-xs text-gray-600">
            Data: NASA JPL Horizons · NASA Image and Video Library · Mission-Elapsed-Time interpolation
          </div>
        </div>
      </div>
    </div>
  )
}

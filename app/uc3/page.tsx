"use client"

import { useEffect, useRef, useState, useMemo, useCallback } from "react"
import Link from "next/link"
import { disposeGlobe } from "@/lib/globe-cleanup"

// ── Mission constants (corrected) ─────────────────────────────────────────────
// Artemis II — first crewed Artemis lunar flyby
// Crew: Reid Wiseman (CDR), Victor Glover (PLT), Christina Koch (MS1), Jeremy Hansen (MS2)
// Liftoff:  2026-04-01 22:35:12 UTC from LC-39B, KSC
// Splashdown: 2026-04-11 01:07:00 UTC (Pacific, off San Diego)
// Duration: 217.5 h (9 d 1 h 31 m)
// Closest approach: ~6,540 km (4,067 mi) from lunar surface
// Peak Earth distance: 406,771 km (252,756 mi)
const LAUNCH_DATE        = new Date("2026-04-01T22:35:12Z")
const SPLASHDOWN_DATE    = new Date("2026-04-11T01:07:00Z")
const DURATION_HOURS     = 217.5
const CLOSEST_APPROACH_KM = 6540
const CLOSEST_APPROACH_MI = 4067
const PEAK_EARTH_KM      = 406771
const PEAK_EARTH_MI      = 252756
const TOTAL_DISTANCE_KM  = 1_118_800

// Earth radius (km) — used for km→globe-unit conversion for Orion position
const EARTH_R_KM   = 6371

// Approximate Moon distance (not rendered, but g-force calc uses it)
const APPROX_MOON_DIST = 384400 // km

// ── Crew ──────────────────────────────────────────────────────────────────────
const CREW = [
  {
    name: "Reid Wiseman",    role: "Commander",          flag: "🇺🇸", agency: "NASA",
    bio: "USN test pilot, ISS Exp 40/41 veteran, 165 EVA days.",
    portrait: "https://www.nasa.gov/wp-content/uploads/2023/04/wiseman-reid-1.jpg",
  },
  {
    name: "Victor Glover",   role: "Pilot",              flag: "🇺🇸", agency: "NASA",
    bio: "USN test pilot, SpaceX Crew-1, first Black astronaut beyond LEO.",
    portrait: "https://www.nasa.gov/wp-content/uploads/2023/04/glover-victor-1.jpg",
  },
  {
    name: "Christina Koch",  role: "Mission Specialist", flag: "🇺🇸", agency: "NASA",
    bio: "328-day ISS record, first woman to travel beyond LEO.",
    portrait: "https://www.nasa.gov/wp-content/uploads/2023/04/koch-christina-1.jpg",
  },
  {
    name: "Jeremy Hansen",   role: "Mission Specialist", flag: "🇨🇦", agency: "CSA",
    bio: "First Canadian to travel to the Moon. RCAF fighter pilot, astronomer.",
    portrait: "https://www.nasa.gov/wp-content/uploads/2023/04/hansen-jeremy-1.jpg",
  },
]

// ── Mission events / coverage ────────────────────────────────────────────────
interface MissionEvent {
  id: string
  metHours: number
  utc: string
  title: string
  type: "burn" | "milestone" | "coverage" | "phase"
  description: string
}

const MISSION_EVENTS: MissionEvent[] = [
  { id: "launch",     metHours:   0,     utc: "2026-04-01T22:35:12Z", title: "Liftoff",              type: "milestone", description: "SLS Block 1 launches from KSC LC-39B" },
  { id: "ascent",     metHours:   0.13,  utc: "2026-04-01T22:43:00Z", title: "Stage Separation",     type: "milestone", description: "SRB jettison and core stage separation" },
  { id: "orbit",      metHours:   0.25,  utc: "2026-04-01T22:50:00Z", title: "Orbit Insertion",      type: "milestone", description: "Initial Earth orbit achieved" },
  { id: "tli",        metHours:   1.8,   utc: "2026-04-02T00:23:00Z", title: "Trans-Lunar Injection",type: "burn",      description: "ICPS burn boosts Orion toward the Moon" },
  { id: "icps-sep",   metHours:   2.0,   utc: "2026-04-02T00:35:00Z", title: "ICPS Separation",      type: "milestone", description: "Orion separates from ICPS upper stage" },
  { id: "mcc1",       metHours:   8.5,   utc: "2026-04-02T07:05:00Z", title: "MCC-1 Burn",           type: "burn",      description: "First mid-course correction" },
  { id: "mcc2",       metHours:  28,     utc: "2026-04-03T02:35:00Z", title: "MCC-2 Burn",           type: "burn",      description: "Second mid-course correction" },
  { id: "outbound1",  metHours:  48,     utc: "2026-04-03T22:35:00Z", title: "Outbound Day 2",       type: "phase",     description: "Outbound coast, ~190,000 km from Earth" },
  { id: "outbound2",  metHours:  72,     utc: "2026-04-04T22:35:00Z", title: "Outbound Day 3",       type: "phase",     description: "Approaching Moon, ~250,000 km from Earth" },
  { id: "mcc3",       metHours:  96,     utc: "2026-04-05T22:35:00Z", title: "MCC-3 Burn",           type: "burn",      description: "Final approach correction" },
  { id: "flyby",      metHours: 120.45,  utc: "2026-04-06T22:02:00Z", title: "🌙 Lunar Flyby",        type: "milestone", description: "Closest approach ~6,540 km from lunar surface (4,067 mi)" },
  { id: "peak",       metHours: 130,     utc: "2026-04-07T08:35:00Z", title: "Maximum Distance",     type: "milestone", description: "Peak distance from Earth: 406,771 km" },
  { id: "return1",    metHours: 144,     utc: "2026-04-07T22:35:00Z", title: "Return Trajectory",    type: "phase",     description: "Return cruise begins" },
  { id: "mccr1",      metHours: 168,     utc: "2026-04-08T22:35:00Z", title: "MCC-R1 Burn",          type: "burn",      description: "First return correction" },
  { id: "mccr2",      metHours: 192,     utc: "2026-04-09T22:35:00Z", title: "MCC-R2 Burn",          type: "burn",      description: "Second return correction" },
  { id: "ei",         metHours: 217,     utc: "2026-04-11T00:35:00Z", title: "Entry Interface",      type: "milestone", description: "Spacecraft enters atmosphere at 11 km/s" },
  { id: "splashdown", metHours: 217.5,   utc: "2026-04-11T01:07:00Z", title: "🎉 Splashdown",         type: "milestone", description: "Pacific Ocean off San Diego — Welcome home!" },
]

// Recovery & re-entry sequence (final ~30 minutes before & 2 hours after splashdown)
interface RecoveryStep {
  id: string
  metHoursOffset: number  // offset from splashdown (negative = before)
  altitudeFt: number      // approximate altitude in feet (0 = water level)
  speedMph: number        // approximate speed
  title: string
  emoji: string
  desc: string
  phase: "entry" | "descent" | "splash" | "recovery"
}

const RECOVERY_STEPS: RecoveryStep[] = [
  { id: "sm-sep",      metHoursOffset: -0.50, altitudeFt: 5000000, speedMph: 24500, title: "Service Module Separation", emoji: "🛰️",  desc: "Crew Module separates from European Service Module", phase: "entry" },
  { id: "ei",          metHoursOffset: -0.32, altitudeFt: 400000,  speedMph: 24500, title: "Entry Interface (EI)",      emoji: "🔥",  desc: "Capsule enters atmosphere at 122 km altitude, heatshield forward", phase: "entry" },
  { id: "peak-heat",   metHoursOffset: -0.30, altitudeFt: 280000,  speedMph: 24000, title: "Peak Heating",              emoji: "🌡️",  desc: "Heatshield reaches ~2,760°C — half the temperature of the Sun", phase: "entry" },
  { id: "skip",        metHoursOffset: -0.28, altitudeFt: 260000,  speedMph: 21000, title: "Skip Entry Maneuver",       emoji: "↗️",  desc: "Capsule skips off the atmosphere, then re-enters — lowers G-load on crew", phase: "entry" },
  { id: "blackout",    metHoursOffset: -0.25, altitudeFt: 200000,  speedMph: 18000, title: "Communications Blackout",   emoji: "📡",  desc: "Plasma sheath blocks radio signals for ~3-4 minutes", phase: "entry" },
  { id: "second-entry",metHoursOffset: -0.20, altitudeFt: 130000,  speedMph: 12000, title: "Second Entry",              emoji: "🔥",  desc: "Capsule re-enters denser atmosphere after the skip", phase: "entry" },
  { id: "drogue",      metHoursOffset: -0.07, altitudeFt: 25000,   speedMph: 290,   title: "Drogue Chutes Deploy",      emoji: "🪂",  desc: "Two drogue parachutes stabilize and slow the capsule", phase: "descent" },
  { id: "main-chute",  metHoursOffset: -0.04, altitudeFt: 9500,    speedMph: 100,   title: "Main Parachutes Deploy",    emoji: "🪂",  desc: "Three large main parachutes (116 ft diameter each) fully open", phase: "descent" },
  { id: "splashdown",  metHoursOffset:  0,    altitudeFt: 0,       speedMph: 17,    title: "🎉 SPLASHDOWN",             emoji: "🌊",  desc: "Capsule touches down in the Pacific at ~17 mph (~7.6 m/s)", phase: "splash" },
  { id: "stabilize",   metHoursOffset:  0.05, altitudeFt: 0,       speedMph: 0,     title: "Capsule Stabilization",     emoji: "⚖️",  desc: "Crew Module Uprighting System (CMUS) airbags inflate to keep capsule upright", phase: "recovery" },
  { id: "comms",       metHoursOffset: 0.10,  altitudeFt: 0,       speedMph: 0,     title: "Crew Comms Restored",       emoji: "📞",  desc: "First voice contact with crew after splashdown — 'Crew is GO'", phase: "recovery" },
  { id: "divers",      metHoursOffset: 0.30,  altitudeFt: 0,       speedMph: 0,     title: "Recovery Divers Deployed",  emoji: "🤿",  desc: "Navy divers from USS San Diego attach the collar and tow lines", phase: "recovery" },
  { id: "tow",         metHoursOffset: 0.75,  altitudeFt: 0,       speedMph: 0,     title: "Capsule Tow to Ship",       emoji: "🚢",  desc: "Capsule winched into the well deck of USS San Diego (LPD-22)", phase: "recovery" },
  { id: "extraction",  metHoursOffset: 1.50,  altitudeFt: 0,       speedMph: 0,     title: "Crew Extraction",           emoji: "👨‍🚀", desc: "Hatch opens — Wiseman, Glover, Koch, and Hansen step out", phase: "recovery" },
  { id: "medical",     metHoursOffset: 2.00,  altitudeFt: 0,       speedMph: 0,     title: "Medical Evaluation",        emoji: "🏥",  desc: "Initial medical checks aboard USS San Diego", phase: "recovery" },
]

// System status list
const SYSTEMS: { id: string; label: string; status: "nominal" | "caution" | "alert" }[] = [
  { id: "comms",   label: "Communications",              status: "nominal" },
  { id: "power",   label: "Power",                       status: "nominal" },
  { id: "gnc",     label: "Guidance, Navigation & Ctrl", status: "nominal" },
  { id: "eclss",   label: "Life Support (ECLSS)",        status: "nominal" },
  { id: "thermal", label: "Thermal Control",             status: "nominal" },
  { id: "nav",     label: "Navigation",                  status: "nominal" },
]

// Historic records
const RECORDS: string[] = [
  "First crewed lunar mission in 54 years (since Apollo 17, 1972)",
  "Farthest human travel from Earth: 406,771 km",
  "First Black astronaut beyond LEO: Victor Glover",
  "First Canadian to travel to the Moon: Jeremy Hansen",
  "First woman to travel beyond LEO: Christina Koch",
  "Crew of 4 — largest beyond Earth orbit since Apollo era",
]

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrionPos  {
  x: number | null; y: number | null; z: number | null
  distEarth: number; velKms: number; elapsedH: number; source: string; phase?: string
}
interface NewsItem  { title: string; description: string; date: string; thumb: string }

// ── Component ─────────────────────────────────────────────────────────────────

export default function UC3Page() {
  const mountRef    = useRef<HTMLDivElement>(null)
  const globeInst   = useRef<any>(null)
  const orionRef    = useRef<any>(null)
  const trailRef    = useRef<any>(null)
  const trailPositionsRef = useRef<any[]>([])
  const threeRef    = useRef<any>(null)
  const cameraModeRef = useRef<"orbit" | "orion">("orbit")

  const [orionData, setOrionData] = useState<OrionPos | null>(null)
  const [news,      setNews]      = useState<NewsItem[]>([])
  const [missionT,  setMissionT]  = useState(0)          // hours since launch
  const [launched,  setLaunched]  = useState(false)
  const [countdown, setCountdown] = useState("")
  const [selected,  setSelected]  = useState<string | null>(null)
  const [distEarth, setDistEarth] = useState<number | null>(null)
  const [velKms,    setVelKms]    = useState<number | null>(null)
  const [dataSource,  setDataSource]  = useState("interpolated")
  const [activePanels, setActivePanels] = useState<Set<string>>(() => new Set(["recovery", "systems"]))

  // Detect white-label host (artemis.yprateek.com) — adds a link back to personal site
  const [isWhiteLabelHost, setIsWhiteLabelHost] = useState(false)
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsWhiteLabelHost(window.location.hostname === "artemis.yprateek.com")
    }
  }, [])

  // NASA TV panel state — open + sound ON by default
  const [showNasaTv, setShowNasaTv] = useState(true)
  // Must start muted for browsers to allow autoplay (then user can unmute)
  const [nasaTvMuted, setNasaTvMuted] = useState(true)
  // NASA TV draggable position (null = use default centered position)
  const [nasaTvPos, setNasaTvPos] = useState<{ x: number; y: number } | null>(null)
  const dragStateRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)

  const onNasaTvDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect()
    dragStateRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: rect.left,
      origY: rect.top,
    }
    const onMove = (ev: MouseEvent) => {
      if (!dragStateRef.current) return
      const dx = ev.clientX - dragStateRef.current.startX
      const dy = ev.clientY - dragStateRef.current.startY
      const newX = Math.max(0, Math.min(window.innerWidth - 380, dragStateRef.current.origX + dx))
      const newY = Math.max(0, Math.min(window.innerHeight - 250, dragStateRef.current.origY + dy))
      setNasaTvPos({ x: newX, y: newY })
    }
    const onUp = () => {
      dragStateRef.current = null
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }, [])

  // Units toggle (km vs mi), persisted to localStorage
  const [units, setUnits] = useState<"km" | "mi">("km")
  useEffect(() => {
    try {
      const stored = localStorage.getItem("uc3-units")
      if (stored === "km" || stored === "mi") setUnits(stored)
    } catch {}
  }, [])
  const toggleUnits = useCallback(() => {
    setUnits(u => {
      const next = u === "km" ? "mi" : "km"
      try { localStorage.setItem("uc3-units", next) } catch {}
      return next
    })
  }, [])

  const togglePanel = (id: string) => setActivePanels(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })

  // ── Fetch Orion real-time position ────────────────────────────────────────
  useEffect(() => {
    const load = () => {
      fetch("/api/orion-position")
        .then(r => r.json())
        .then((d: OrionPos) => {
          setOrionData(d)
          setDataSource(d.source)
          setDistEarth(d.distEarth)
          setVelKms(parseFloat(d.velKms.toFixed(2)))
        })
        .catch(() => {})
    }
    load()
    const id = setInterval(load, 120_000)
    return () => clearInterval(id)
  }, [])

  // ── Fetch news ────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/artemis-news")
      .then(r => r.json())
      .then(d => setNews(d.items ?? []))
      .catch(() => {})
  }, [])

  // ── Mission clock ─────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => {
      const now    = Date.now()
      const diffMs = now - LAUNCH_DATE.getTime()
      const diffH  = diffMs / 3_600_000
      setMissionT(diffH)
      setLaunched(diffH >= 0)

      if (diffH < 0) {
        const absMs = Math.abs(diffMs)
        const d = Math.floor(absMs / 86400000)
        const h = Math.floor((absMs % 86400000) / 3600000)
        const m = Math.floor((absMs % 3600000)  / 60000)
        const s = Math.floor((absMs % 60000)    / 1000)
        setCountdown(`T−${d}d ${String(h).padStart(2,"0")}h ${String(m).padStart(2,"0")}m ${String(s).padStart(2,"0")}s`)
      } else {
        setCountdown("")
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // ── Derived telemetry ─────────────────────────────────────────────────────
  const telemetry = useMemo(() => {
    const speed = velKms ?? 0
    const de    = distEarth ?? 0
    const dm    = APPROX_MOON_DIST

    const altitudeAboveEarth = Math.max(0, de - EARTH_R_KM)
    const speedKmh           = speed * 3600
    const speedMach          = speed / 0.343   // relative to sea-level sound speed

    // Light-time delay (one-way) in seconds
    const lightTimeDelay = de / 299_792.458

    // g-force from gravity of Earth + Moon
    const muEarth = 398600.4418   // km^3/s^2
    const muMoon  =   4902.800066 // km^3/s^2
    const gEarthMs2 = (muEarth / Math.max(de * de, 1)) * 1e9 / 1e6 // km->m: simplified
    // Simpler: g = mu / r^2 with r in km, g in km/s^2. Convert to g (9.80665 m/s^2 = 9.80665e-3 km/s^2)
    const gE = muEarth / Math.max(de * de, 1)
    const gM = dm > 0 ? muMoon / (dm * dm) : 0
    const gTotal = (gE + gM) / 9.80665e-3

    // Mission progress
    const missionProgress = Math.max(0, Math.min(100, (missionT / DURATION_HOURS) * 100))

    // Return phase detection
    const isReturn = missionT > 130
    const distanceBackToEarth = isReturn ? de : null

    // Hull / thermal estimates
    const hullSunlit    = 120
    const hullShadow    = -150
    const cabinTemp     = 22
    // Re-entry spike only in final hour
    const inReentry     = missionT > 217 && missionT < 217.6
    const heatshieldTemp = inReentry ? 2700 : 22

    return {
      distEarth: de,
      speed,
      altitudeAboveEarth,
      speedKmh,
      speedMach,
      lightTimeDelay,
      gForce: gTotal,
      missionProgress,
      totalDistanceTravelled: TOTAL_DISTANCE_KM,
      distanceBackToEarth,
      hullSunlit,
      hullShadow,
      cabinTemp,
      heatshieldTemp,
    }
  }, [velKms, distEarth, missionT])

  // ── Current phase / next event ────────────────────────────────────────────
  const currentEventIndex = useMemo(() => {
    let best = 0
    for (let i = 0; i < MISSION_EVENTS.length; i++) {
      if (missionT >= MISSION_EVENTS[i].metHours) best = i
    }
    return best
  }, [missionT])
  const currentEvent = MISSION_EVENTS[currentEventIndex]
  const nextEvent    = MISSION_EVENTS[currentEventIndex + 1] ?? null

  // Countdown to next significant milestone (flyby or splashdown)
  const nextMilestone = useMemo(() => {
    if (missionT < 120.45) return MISSION_EVENTS.find(e => e.id === "flyby")!
    return MISSION_EVENTS.find(e => e.id === "splashdown")!
  }, [missionT])

  const nextMilestoneCountdown = useMemo(() => {
    const dtH = nextMilestone.metHours - missionT
    if (dtH <= 0) return "—"
    const totalSec = Math.floor(dtH * 3600)
    const d = Math.floor(totalSec / 86400)
    const h = Math.floor((totalSec % 86400) / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = totalSec % 60
    return `${d}d ${String(h).padStart(2,"0")}h ${String(m).padStart(2,"0")}m ${String(s).padStart(2,"0")}s`
  }, [nextMilestone, missionT])

  // Splashdown countdown — broken into parts for big visual display
  const splashdownParts = useMemo(() => {
    const splashEvent = MISSION_EVENTS.find(e => e.id === "splashdown")!
    const dtH = splashEvent.metHours - missionT
    if (dtH <= 0) return { d: "00", h: "00", m: "00", s: "00", complete: true }
    const totalSec = Math.floor(dtH * 3600)
    return {
      d: String(Math.floor(totalSec / 86400)).padStart(2, "0"),
      h: String(Math.floor((totalSec % 86400) / 3600)).padStart(2, "0"),
      m: String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0"),
      s: String(totalSec % 60).padStart(2, "0"),
      complete: false,
    }
  }, [missionT])

  // ── Globe.gl scene ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mountRef.current || globeInst.current) return

    Promise.all([import("globe.gl"), import("three")]).then(([globeMod, THREE]) => {
      if (!mountRef.current) return
      threeRef.current = THREE

      const GlobeGL = (globeMod.default ?? globeMod) as any
      const globe = new GlobeGL()
      globe(mountRef.current)
        .width(mountRef.current.clientWidth)
        .height(mountRef.current.clientHeight)
        .globeImageUrl("//unpkg.com/three-globe/example/img/earth-night.jpg")
        .bumpImageUrl("//unpkg.com/three-globe/example/img/earth-topology.png")
        .backgroundImageUrl("//unpkg.com/three-globe/example/img/night-sky.png")
        .atmosphereColor("#3b82f6")
        .atmosphereAltitude(0.18)
        .pointOfView({ lat: 0, lng: -80, altitude: 2.8 })

      const ctrl = globe.controls()
      ctrl.autoRotate = false
      ctrl.enableDamping = true
      ctrl.dampingFactor = 0.1
      globeInst.current = globe

      const scene = globe.scene()
      const GLOBE_R = 100

      // ── Orion craft group ──────────────────────────────────────────────
      const orionGroup = new THREE.Group()

      // Capsule body (cone — pointing up)
      const capsuleGeo = new THREE.ConeGeometry(2, 4, 12)
      const capsuleMat = new THREE.MeshPhongMaterial({ color: 0xcccccc, emissive: 0x444444 })
      const capsule = new THREE.Mesh(capsuleGeo, capsuleMat)
      orionGroup.add(capsule)

      // Service module
      const smGeo = new THREE.CylinderGeometry(1.5, 1.5, 3, 12)
      const smMat = new THREE.MeshPhongMaterial({ color: 0x888888 })
      const sm = new THREE.Mesh(smGeo, smMat)
      sm.position.y = -3.5
      orionGroup.add(sm)

      // Solar panels (4 wings)
      for (let i = 0; i < 4; i++) {
        const panelGeo = new THREE.BoxGeometry(6, 0.1, 1.5)
        const panelMat = new THREE.MeshPhongMaterial({ color: 0x1e3a8a, emissive: 0x0f1e50 })
        const panel = new THREE.Mesh(panelGeo, panelMat)
        const angle = (i * Math.PI / 2)
        panel.position.x = Math.cos(angle) * 4
        panel.position.z = Math.sin(angle) * 4
        panel.position.y = -3.5
        panel.rotation.y = angle
        orionGroup.add(panel)
      }

      // Glow sphere for visibility
      const glowGeo = new THREE.SphereGeometry(3, 16, 16)
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.4,
      })
      const glow = new THREE.Mesh(glowGeo, glowMat)
      orionGroup.add(glow)

      scene.add(orionGroup)
      orionRef.current = orionGroup

      // ── KSC + Splashdown markers via globe.gl htmlElementsData ──
      // pointer-events: none on wrapper so mouse wheel passes through to globe
      globe
        .htmlElementsData([
          { lat: 28.5, lng: -80.6, label: "KSC", color: "#ff8800", desc: "Kennedy Space Center · Launch Site" },
          { lat: 32.7, lng: -117.2, label: "SPLASH", color: "#00ff88", desc: "Splashdown · Pacific Ocean off San Diego" },
        ])
        .htmlElement((d: any) => {
          const el = document.createElement("div")
          el.style.cssText = `
            display: flex; flex-direction: column; align-items: center; gap: 4px;
            transform: translate(-50%, -100%); pointer-events: none;
          `
          el.innerHTML = `
            <div style="
              width: 18px; height: 18px; border-radius: 50%;
              background: ${d.color};
              box-shadow: 0 0 12px ${d.color}, 0 0 24px ${d.color}aa, 0 0 6px #fff inset;
              border: 2px solid #fff;
              animation: pulse 2s ease-in-out infinite;
              pointer-events: none;
            "></div>
            <div style="
              padding: 2px 8px; border-radius: 6px; font-family: ui-monospace, monospace;
              font-size: 10px; font-weight: 700; color: #fff;
              background: rgba(0,0,0,0.85); border: 1px solid ${d.color}88;
              white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.5);
              pointer-events: none;
            ">${d.label}</div>
          `
          return el
        })
        .htmlAltitude(0.01)

      // Explicitly enable zoom on OrbitControls
      ctrl.enableZoom = true
      ctrl.minDistance = 110
      ctrl.maxDistance = 1500
      ctrl.zoomSpeed = 1.2

      // ── Trail line for Orion's flown path ─────────────────────────────
      const trailGeo = new THREE.BufferGeometry()
      const trailMat = new THREE.LineBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.7,
      })
      const trailLine = new THREE.Line(trailGeo, trailMat)
      scene.add(trailLine)
      trailRef.current = trailLine
      trailPositionsRef.current = []
    })

    return () => {
      disposeGlobe(globeInst, mountRef as any)
      orionRef.current = null
      trailRef.current = null
      trailPositionsRef.current = []
    }
  }, [])

  // ── Orion position update ─────────────────────────────────────────────────
  useEffect(() => {
    if (!orionRef.current || !threeRef.current) return
    const THREE = threeRef.current
    const GLOBE_R_UNITS = 100
    const KM_PER_UNIT = EARTH_R_KM / GLOBE_R_UNITS  // 63.71

    const liveOrion = orionData
    const useRealPos = liveOrion?.source === "horizons" && liveOrion.x != null && liveOrion.y != null && liveOrion.z != null
    if (!useRealPos) return

    const x = (liveOrion!.x as number) / KM_PER_UNIT
    const y = (liveOrion!.y as number) / KM_PER_UNIT
    const z = (liveOrion!.z as number) / KM_PER_UNIT

    orionRef.current.position.set(x, y, z)

    // Append to trail
    const trail = trailPositionsRef.current
    trail.push(new THREE.Vector3(x, y, z))
    if (trail.length > 4000) trail.shift()

    if (trailRef.current && trail.length > 1) {
      const geo = new THREE.BufferGeometry().setFromPoints(trail)
      trailRef.current.geometry.dispose()
      trailRef.current.geometry = geo
    }

    // Camera follow mode
    const mode = cameraModeRef.current
    if (mode === "orion" && globeInst.current) {
      const dist = Math.sqrt(x * x + y * y + z * z)
      if (dist > 0.01) {
        const lat = Math.asin(y / dist) * 180 / Math.PI
        const lng = Math.atan2(z, -x) * 180 / Math.PI - 180
        globeInst.current.pointOfView({ lat, lng, altitude: dist / 100 + 1 }, 1000)
      }
    }
  }, [orionData])

  // ── Resize handler ────────────────────────────────────────────────────────
  useEffect(() => {
    function onResize() {
      if (globeInst.current && mountRef.current) {
        globeInst.current
          .width(mountRef.current.clientWidth)
          .height(mountRef.current.clientHeight)
      }
    }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  // ── Formatting helpers ────────────────────────────────────────────────────
  const kmToDisp = useCallback((km: number | null): string => {
    if (km == null) return "—"
    if (units === "km") return `${Math.round(km).toLocaleString("en-US")} km`
    return `${Math.round(km * 0.621371).toLocaleString("en-US")} mi`
  }, [units])

  // ── Icon button helper ────────────────────────────────────────────────────
  const iconBtn = (id: string, icon: string, label: string, activeColor: string) => (
    <button
      key={id}
      onClick={() => togglePanel(id)}
      title={label}
      className="flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all select-none"
      style={{
        width: 44, height: 44,
        background:  activePanels.has(id) ? `${activeColor}30` : "rgba(0,5,20,0.85)",
        border:      activePanels.has(id) ? `1.5px solid ${activeColor}` : "1px solid rgba(255,255,255,0.14)",
        backdropFilter: "blur(10px)",
        boxShadow: activePanels.has(id) ? `0 0 10px ${activeColor}40` : "none",
      }}
    >
      <span style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>
    </button>
  )

  const statusColor = (s: string) => s === "nominal" ? "#22c55e" : s === "caution" ? "#eab308" : "#ef4444"

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full" style={{ height: "calc(100vh - 64px)", background: "#000008" }}>

      {/* Three.js canvas */}
      <div ref={mountRef} className="absolute inset-0" />

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-3 py-2"
        style={{ background: "rgba(0,0,10,0.80)", borderBottom: "1px solid rgba(255,150,50,0.25)" }}>
        <div className="flex items-center gap-2">
          <span className="text-xl">🚀</span>
          <div>
            <div className="text-xs font-bold tracking-widest text-orange-300">ARTEMIS II</div>
            <div className="text-xs text-gray-500 hidden sm:block">NASA Lunar Flyby · Orion MPCV</div>
          </div>
        </div>

        {!launched ? (
          <div className="flex flex-col items-center gap-0.5">
            <div className="text-xs font-mono text-orange-400 bg-orange-900/30 border border-orange-600/40 px-2 py-0.5 rounded">
              PRE-LAUNCH
            </div>
            <div className="text-xs font-mono text-yellow-300 tabular-nums hidden sm:block">{countdown}</div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-0.5">
            <div className="text-xs font-mono text-green-400 bg-green-900/30 border border-green-600/40 px-2 py-0.5 rounded">
              MISSION ACTIVE
            </div>
            <div className="text-xs text-gray-400 tabular-nums">
              MET {Math.floor(missionT)}h {Math.floor((missionT % 1) * 60)}m
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={toggleUnits}
            className="text-xs px-2 py-1 rounded border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors"
            title="Toggle km/mi"
          >
            {units.toUpperCase()}
          </button>
          <Link href="/uc3/details"
            className="text-xs px-2 py-1 rounded border border-gray-700 text-gray-400 hover:bg-gray-800 transition-colors hidden sm:block">
            Details →
          </Link>
          {/* Show "back to home" link only on the artemis.yprateek.com white-label host */}
          {isWhiteLabelHost && (
            <a
              href="https://yprateek.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-2 py-1 rounded border transition-colors hidden sm:flex items-center gap-1"
              style={{ borderColor: "rgba(51,204,221,0.5)", color: "#67e8f9", background: "rgba(51,204,221,0.08)" }}
              title="Visit yprateek.com"
            >
              <span>←</span>
              <span>yprateek.com</span>
            </a>
          )}
        </div>
      </div>

      {/* ── Data source pill ──────────────────────────────────────────────── */}
      {launched && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full text-xs font-semibold tracking-wide whitespace-nowrap"
          style={{
            background: dataSource === "horizons" ? "rgba(0,80,0,0.85)" : "rgba(80,60,0,0.85)",
            border: `1px solid ${dataSource === "horizons" ? "rgba(0,255,100,0.35)" : "rgba(255,200,0,0.35)"}`,
            color: dataSource === "horizons" ? "#86efac" : "#fde68a",
          }}>
          {dataSource === "horizons" ? "✓ JPL Horizons — Live" : "~ MET interpolation"}
        </div>
      )}

      {/* ── BIG SPLASHDOWN COUNTDOWN (top-center hero) ─────────────────────── */}
      {launched && !splashdownParts.complete && (
        <div className="absolute z-20 pointer-events-none" style={{ top: 60, left: "50%", transform: "translateX(-50%)" }}>
          <div className="flex flex-col items-center" style={{
            background: "linear-gradient(180deg, rgba(0,0,15,0.85) 0%, rgba(0,0,30,0.6) 100%)",
            border: "1px solid rgba(0,200,255,0.35)",
            borderRadius: 16,
            padding: "12px 24px",
            backdropFilter: "blur(10px)",
            boxShadow: "0 0 40px rgba(0,200,255,0.18), 0 0 80px rgba(0,200,255,0.08)",
          }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold tracking-[0.25em]" style={{
                color: "#67e8f9",
                textShadow: "0 0 12px rgba(0,200,255,0.6)",
              }}>
                🌊 SPLASHDOWN IN
              </span>
            </div>
            <div className="flex items-end gap-2 sm:gap-3 font-mono">
              {[
                { v: splashdownParts.d, l: "DAYS" },
                { v: splashdownParts.h, l: "HRS" },
                { v: splashdownParts.m, l: "MIN" },
                { v: splashdownParts.s, l: "SEC" },
              ].map((seg, i) => (
                <div key={seg.l} className="flex items-end gap-2 sm:gap-3">
                  <div className="flex flex-col items-center">
                    <span className="tabular-nums leading-none" style={{
                      fontSize: "clamp(36px, 6vw, 64px)",
                      fontWeight: 900,
                      color: "#fff",
                      textShadow: "0 0 16px rgba(0,200,255,0.85), 0 0 32px rgba(0,200,255,0.45)",
                      letterSpacing: "-0.02em",
                    }}>{seg.v}</span>
                    <span className="text-[9px] sm:text-[10px] font-bold tracking-[0.2em] mt-1" style={{ color: "#94a3b8" }}>
                      {seg.l}
                    </span>
                  </div>
                  {i < 3 && (
                    <span className="text-cyan-400/40 leading-none pb-3 sm:pb-4" style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 200 }}>:</span>
                  )}
                </div>
              ))}
            </div>
            <div className="text-[10px] mt-1 tracking-wide" style={{ color: "#64748b" }}>
              Pacific Ocean · 11 Apr 2026 · 01:07 UTC
            </div>
          </div>
        </div>
      )}

      {/* ── NASA LIVE TV launch button (prominent, top-right floating) ────── */}
      <button
        onClick={() => setShowNasaTv(v => !v)}
        className="absolute z-30 flex items-center gap-2 px-3 py-2 rounded-xl transition-all"
        style={{
          top: 64,
          right: 12,
          background: "linear-gradient(135deg, rgba(220,38,38,0.95), rgba(190,20,20,0.92))",
          border: "1.5px solid rgba(255,100,100,0.75)",
          boxShadow: "0 0 18px rgba(255,40,40,0.55), 0 0 34px rgba(255,40,40,0.3)",
          color: "#fff",
          fontWeight: 700,
          animation: "nasaPulse 2.4s ease-in-out infinite",
        }}
        title="Open NASA Live TV"
      >
        <span className="relative flex items-center justify-center" style={{ width: 10, height: 10 }}>
          <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-70 animate-ping" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
        </span>
        <span className="text-xs tracking-widest">📺 NASA LIVE TV</span>
      </button>

      <style jsx global>{`
        @keyframes nasaPulse {
          0%, 100% { box-shadow: 0 0 18px rgba(255,40,40,0.55), 0 0 34px rgba(255,40,40,0.3); }
          50%      { box-shadow: 0 0 28px rgba(255,80,80,0.85), 0 0 52px rgba(255,40,40,0.55); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(1.15); opacity: 0.85; }
        }
      `}</style>

      {/* ── NASA TV panel (floating middle-right, vertically centered) ───── */}
      {showNasaTv && (
        <div
          className="fixed z-50 bg-black rounded-2xl overflow-hidden shadow-2xl border border-cyan-500/40"
          style={
            nasaTvPos
              ? { width: 380, height: 250, left: nasaTvPos.x, top: nasaTvPos.y, boxShadow: "0 0 60px rgba(0,200,255,0.25)" }
              : { width: 380, height: 250, left: 16, bottom: 56, boxShadow: "0 0 60px rgba(0,200,255,0.25)" }
          }
        >
          <div
            onMouseDown={onNasaTvDragStart}
            className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-red-900/60 to-cyan-900/60"
            style={{ cursor: dragStateRef.current ? "grabbing" : "grab", userSelect: "none" }}
            title="Drag to move"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-bold text-white tracking-widest">NASA LIVE TV</span>
              <span className="text-xs text-white/40">⠿</span>
            </div>
            <div className="flex items-center gap-2" onMouseDown={e => e.stopPropagation()}>
              <button
                onClick={() => setNasaTvMuted(m => !m)}
                className="text-white/80 hover:text-white text-xs px-2 py-0.5 rounded border border-white/20"
                title={nasaTvMuted ? "Unmute" : "Mute"}
              >
                {nasaTvMuted ? "🔇" : "🔊"}
              </button>
              <button onClick={() => setShowNasaTv(false)} className="text-white/70 hover:text-white">✕</button>
            </div>
          </div>
          <iframe
            key={nasaTvMuted ? "muted" : "unmuted"}
            src={`https://www.youtube.com/embed/m3kR2KK8TEs?si=i8sUw9uyCmeQZNRQ&autoplay=1&mute=${nasaTvMuted ? 1 : 0}&playsinline=1&rel=0`}
            width="380"
            height="218"
            frameBorder={0}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            title="NASA Live TV — Artemis II"
          />
        </div>
      )}

      {/* ── LEFT icon toolbar ─────────────────────────────────────────────── */}
      <div className="absolute left-3 z-20 flex flex-col gap-2" style={{ top: launched ? 72 : 56 }}>
        {iconBtn("phase",     "🎯", "Mission Phase",   "#f97316")}
        {iconBtn("telemetry", "📡", "Orion Telemetry", "#3b82f6")}
        {iconBtn("crew",      "👨‍🚀", "Crew",            "#22c55e")}
        {iconBtn("systems",   "🛰️", "Systems",         "#14b8a6")}
        {iconBtn("records",   "🏆", "Historic Records","#fbbf24")}
      </div>

      {/* ── RIGHT icon toolbar ────────────────────────────────────────────── */}
      <div className="absolute right-3 z-20 flex flex-col gap-2" style={{ top: launched ? 120 : 104 }}>
        {iconBtn("events",   "📅", "Mission Events",   "#a855f7")}
        {iconBtn("recovery", "🪂", "Recovery Sequence","#22c55e")}
        {iconBtn("facts",    "ℹ️",  "Mission Facts",    "#eab308")}
        {iconBtn("news",     "📰", "NASA News",        "#60a5fa")}
        {iconBtn("camera",   "🎥", "Camera",           "#06b6d4")}
      </div>

      {/* ── T-minus to next milestone + progress (bottom center) ──────────── */}
      <div className="absolute left-1/2 -translate-x-1/2 z-20 rounded-xl px-4 py-2"
        style={{ bottom: 56, background: "rgba(0,5,20,0.88)", border: "1px solid rgba(255,255,255,0.10)", backdropFilter: "blur(10px)", minWidth: 320 }}>
        <div className="flex items-center justify-between gap-4 mb-1.5">
          <div>
            <div className="text-xs text-gray-500 tracking-widest">NEXT</div>
            <div className="text-xs font-semibold text-white">{nextMilestone.title}</div>
          </div>
          <div className="text-sm font-mono tabular-nums text-cyan-300">{nextMilestoneCountdown}</div>
        </div>
        <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div className="absolute inset-y-0 left-0 rounded-full"
            style={{ width: `${telemetry.missionProgress}%`, background: "linear-gradient(90deg, #f97316, #eab308, #06b6d4)" }} />
          {/* Maneuver tick marks */}
          {MISSION_EVENTS.filter(e => e.type === "burn" || e.id === "flyby" || e.id === "splashdown").map(e => (
            <div key={e.id}
              title={e.title}
              className="absolute top-0 bottom-0 w-0.5"
              style={{
                left: `${Math.min(100, (e.metHours / DURATION_HOURS) * 100)}%`,
                background: e.id === "flyby" || e.id === "splashdown" ? "#fff" : "rgba(255,255,255,0.45)",
              }} />
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-0.5 tabular-nums">
          <span>{telemetry.missionProgress.toFixed(1)}%</span>
          <span>{Math.round(DURATION_HOURS)}h total</span>
        </div>
      </div>

      {/* ── PANELS ────────────────────────────────────────────────────────── */}

      {/* Mission Phase panel */}
      {activePanels.has("phase") && (
        <div className="absolute left-14 z-10 w-64 rounded-xl p-3"
          style={{ top: launched ? 72 : 56, background: "rgba(0,5,20,0.92)", border: "1px solid rgba(255,140,0,0.35)", backdropFilter: "blur(14px)" }}>
          <div className="flex justify-between items-center mb-2">
            <div className="text-xs text-orange-400 font-semibold tracking-widest">MISSION PHASE</div>
            <button onClick={() => togglePanel("phase")} className="text-gray-500 hover:text-white text-sm leading-none">✕</button>
          </div>
          <div className="text-sm font-bold text-white mb-1">{currentEvent.title}</div>
          <div className="text-xs text-gray-400 leading-snug mb-2">{currentEvent.description}</div>
          {nextEvent && (
            <div className="mt-2 pt-2 border-t border-white/10">
              <div className="text-xs text-gray-500">Next: {nextEvent.title}</div>
              <div className="text-xs text-orange-300 tabular-nums">
                T+{nextEvent.metHours.toFixed(2)}h
              </div>
            </div>
          )}
        </div>
      )}

      {/* Telemetry panel */}
      {activePanels.has("telemetry") && (
        <div className="absolute left-14 z-10 w-72 rounded-xl p-3"
          style={{ top: launched ? 118 : 102, background: "rgba(0,5,20,0.92)", border: "1px solid rgba(50,150,255,0.35)", backdropFilter: "blur(14px)", maxHeight: "70vh", overflowY: "auto" }}>
          <div className="flex justify-between items-center mb-2">
            <div className="text-xs text-blue-400 font-semibold tracking-widest">ORION TELEMETRY</div>
            <button onClick={() => togglePanel("telemetry")} className="text-gray-500 hover:text-white text-sm leading-none">✕</button>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {[
              { label: "Dist. Earth",   val: kmToDisp(telemetry.distEarth),        color: "#60a5fa" },
              { label: "Altitude",      val: kmToDisp(telemetry.altitudeAboveEarth), color: "#7dd3fc" },
              { label: "Speed km/s",    val: `${telemetry.speed.toFixed(2)} km/s`, color: "#fbbf24" },
              { label: "Speed km/h",    val: `${Math.round(telemetry.speedKmh).toLocaleString()} km/h`, color: "#fbbf24" },
              { label: "Mach",          val: `M ${telemetry.speedMach.toFixed(1)}`, color: "#f97316" },
              { label: "Light delay",   val: `${telemetry.lightTimeDelay.toFixed(2)} s`, color: "#c4b5fd" },
              { label: "g-force",       val: `${telemetry.gForce.toExponential(2)} g`, color: "#f472b6" },
              { label: "Mission prog.", val: `${telemetry.missionProgress.toFixed(1)}%`, color: "#34d399" },
              { label: "Total dist",    val: kmToDisp(telemetry.totalDistanceTravelled), color: "#34d399" },
              { label: "Hull sunlit",   val: `+${telemetry.hullSunlit}°C`, color: "#fb923c" },
              { label: "Hull shadow",   val: `${telemetry.hullShadow}°C`, color: "#60a5fa" },
              { label: "Cabin",         val: `${telemetry.cabinTemp}°C`, color: "#86efac" },
              { label: "Heatshield",    val: `${telemetry.heatshieldTemp}°C`, color: telemetry.heatshieldTemp > 1000 ? "#ef4444" : "#86efac" },
            ].map(m => (
              <div key={m.label} className="rounded px-2 py-1.5"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="text-gray-500 text-xs">{m.label}</div>
                <div className="font-mono tabular-nums text-xs" style={{ color: m.color }}>{m.val}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Crew panel */}
      {activePanels.has("crew") && (
        <div className="absolute left-14 z-10 w-72 rounded-xl p-3"
          style={{ top: launched ? 164 : 148, background: "rgba(0,5,20,0.92)", border: "1px solid rgba(100,200,100,0.3)", backdropFilter: "blur(14px)", maxHeight: "70vh", overflowY: "auto" }}>
          <div className="flex justify-between items-center mb-2">
            <div className="text-xs text-green-400 font-semibold tracking-widest">CREW — 4 ASTRONAUTS</div>
            <button onClick={() => togglePanel("crew")} className="text-gray-500 hover:text-white text-sm leading-none">✕</button>
          </div>
          <div className="space-y-1.5">
            {CREW.map(c => (
              <div key={c.name}
                className="cursor-pointer rounded-lg p-2 transition-colors"
                style={{ background: selected === c.name ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                onClick={() => setSelected(selected === c.name ? null : c.name)}
              >
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.portrait} alt={c.name} className="w-10 h-10 rounded-full object-cover border border-white/10"
                    onError={(e) => { (e.target as HTMLImageElement).style.visibility = "hidden" }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-sm leading-none">{c.flag}</span>
                      <span className="text-xs font-semibold text-white truncate">{c.name}</span>
                    </div>
                    <div className="text-xs text-gray-500">{c.role} · {c.agency}</div>
                  </div>
                </div>
                {selected === c.name && (
                  <div className="mt-1.5 text-xs text-gray-300 leading-snug">{c.bio}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Systems panel */}
      {activePanels.has("systems") && (
        <div className="absolute left-14 z-10 w-64 rounded-xl p-3"
          style={{ top: launched ? 210 : 194, background: "rgba(0,5,20,0.92)", border: "1px solid rgba(20,184,166,0.35)", backdropFilter: "blur(14px)" }}>
          <div className="flex justify-between items-center mb-2">
            <div className="text-xs text-teal-400 font-semibold tracking-widest">SYSTEMS STATUS</div>
            <button onClick={() => togglePanel("systems")} className="text-gray-500 hover:text-white text-sm leading-none">✕</button>
          </div>
          <div className="space-y-1.5">
            {SYSTEMS.map(s => (
              <div key={s.id} className="flex items-center justify-between text-xs rounded px-2 py-1.5"
                style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: statusColor(s.status), boxShadow: `0 0 6px ${statusColor(s.status)}` }} />
                  <span className="text-gray-300">{s.label}</span>
                </div>
                <span className="uppercase text-xs tracking-wider" style={{ color: statusColor(s.status) }}>{s.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Records panel */}
      {activePanels.has("records") && (
        <div className="absolute left-14 z-10 w-72 rounded-xl p-3"
          style={{ top: launched ? 256 : 240, background: "rgba(0,5,20,0.92)", border: "1px solid rgba(251,191,36,0.35)", backdropFilter: "blur(14px)" }}>
          <div className="flex justify-between items-center mb-2">
            <div className="text-xs text-yellow-300 font-semibold tracking-widest">HISTORIC RECORDS</div>
            <button onClick={() => togglePanel("records")} className="text-gray-500 hover:text-white text-sm leading-none">✕</button>
          </div>
          <ul className="space-y-1.5">
            {RECORDS.map((r, i) => (
              <li key={i} className="text-xs text-gray-300 flex gap-2">
                <span className="text-yellow-400 flex-shrink-0">★</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Mission Events timeline panel */}
      {/* Recovery & Splashdown Sequence panel */}
      {activePanels.has("recovery") && (
        <div className="absolute right-14 z-10 w-80 rounded-xl overflow-hidden"
          style={{ top: launched ? 120 : 104, maxHeight: "78vh", background: "rgba(0,5,20,0.94)", border: "1px solid rgba(34,197,94,0.4)", backdropFilter: "blur(14px)" }}>
          <div className="p-3 flex justify-between items-center" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div>
              <div className="text-xs text-green-400 font-semibold tracking-widest">RECOVERY SEQUENCE</div>
              <div className="text-[10px] text-gray-500 mt-0.5">Final 30 min · Splashdown to Crew Out</div>
            </div>
            <button onClick={() => togglePanel("recovery")} className="text-gray-500 hover:text-white text-sm leading-none">✕</button>
          </div>
          <div className="overflow-y-auto p-3 space-y-2" style={{ maxHeight: "calc(78vh - 56px)" }}>
            {(() => {
              const splashdownEvent = MISSION_EVENTS.find(e => e.id === "splashdown")!
              const splashdownMet = splashdownEvent.metHours
              return RECOVERY_STEPS.map((step) => {
                const stepMet = splashdownMet + step.metHoursOffset
                const isPast = missionT >= stepMet
                const isCurrent = !isPast && Math.abs(missionT - stepMet) < 0.05
                const phaseColor = step.phase === "entry" ? "#ef4444" : step.phase === "descent" ? "#f97316" : step.phase === "splash" ? "#06b6d4" : "#22c55e"
                const dtH = stepMet - missionT
                let etaLabel: string
                if (isPast) etaLabel = "✓ Complete"
                else if (Math.abs(dtH) < 1) {
                  const totalSec = Math.floor(Math.abs(dtH) * 3600)
                  const m = Math.floor(totalSec / 60)
                  const s = totalSec % 60
                  etaLabel = `T-${m}m ${String(s).padStart(2, "0")}s`
                } else etaLabel = `T-${Math.floor(dtH)}h ${Math.floor((dtH % 1) * 60)}m`
                return (
                  <div key={step.id} className="rounded-lg p-2"
                    style={{
                      background: isCurrent ? `${phaseColor}25` : isPast ? "rgba(255,255,255,0.02)" : "transparent",
                      border: isCurrent ? `1px solid ${phaseColor}80` : `1px solid ${phaseColor}15`,
                    }}>
                    <div className="flex items-start gap-2">
                      <div className="text-xl flex-shrink-0">{step.emoji}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <div className="text-xs font-bold leading-tight" style={{ color: isPast ? "#fff" : isCurrent ? phaseColor : "#94a3b8" }}>
                            {step.title}
                          </div>
                          <div className="text-[10px] font-mono tabular-nums" style={{ color: isCurrent ? phaseColor : "#64748b" }}>
                            {etaLabel}
                          </div>
                        </div>
                        <div className="text-[10px] text-gray-400 leading-snug mt-1">{step.desc}</div>
                        {(step.altitudeFt > 0 || step.speedMph > 0) && (
                          <div className="flex gap-3 mt-1.5 text-[10px] font-mono tabular-nums" style={{ color: phaseColor }}>
                            {step.altitudeFt > 0 && <span>📏 {step.altitudeFt.toLocaleString()} ft</span>}
                            {step.speedMph > 0 && <span>⚡ {step.speedMph.toLocaleString()} mph</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            })()}
            <div className="mt-3 p-2.5 rounded-lg" style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.25)" }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-bold text-red-400 tracking-widest">LIVE COVERAGE</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-snug">
                NASA Live TV streams parachute deploy, splashdown, capsule orientation,
                and crew extraction. Live cameras typically show the capsule within 1–2
                hours of splashdown as recovery divers reach the Crew Module.
              </p>
              <button
                onClick={() => setShowNasaTv(true)}
                className="mt-2 w-full text-[10px] font-bold py-1.5 rounded transition-colors"
                style={{ background: "rgba(220,38,38,0.18)", border: "1px solid rgba(220,38,38,0.4)", color: "#fca5a5" }}
              >
                📺 OPEN NASA LIVE TV
              </button>
            </div>
          </div>
        </div>
      )}

      {activePanels.has("events") && (
        <div className="absolute right-14 z-10 w-72 rounded-xl overflow-hidden"
          style={{ top: launched ? 120 : 104, maxHeight: "70vh", background: "rgba(0,5,20,0.94)", border: "1px solid rgba(180,100,255,0.35)", backdropFilter: "blur(14px)" }}>
          <div className="p-3 flex justify-between items-center" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="text-xs text-purple-400 font-semibold tracking-widest">MISSION EVENTS</div>
            <button onClick={() => togglePanel("events")} className="text-gray-500 hover:text-white text-sm leading-none">✕</button>
          </div>
          <div className="overflow-y-auto p-3 space-y-2" style={{ maxHeight: "calc(70vh - 46px)" }}>
            {MISSION_EVENTS.map((e, i) => {
              const isPast    = missionT >= e.metHours
              const isCurrent = i === currentEventIndex
              const typeColor = e.type === "burn" ? "#fb923c" : e.type === "milestone" ? "#a855f7" : e.type === "phase" ? "#60a5fa" : "#14b8a6"
              return (
                <div key={e.id} className="flex gap-2 items-start rounded-lg p-1.5"
                  style={{
                    background: isCurrent ? `${typeColor}20` : "transparent",
                    border: isCurrent ? `1px solid ${typeColor}60` : "1px solid transparent",
                  }}>
                  <div className="mt-1 w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: isPast ? typeColor : "#334", boxShadow: isCurrent ? `0 0 6px ${typeColor}` : "none" }} />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold" style={{ color: isPast ? "#fff" : "#666" }}>
                      {e.title}
                    </div>
                    <div className="text-xs text-gray-500 tabular-nums">
                      T+{e.metHours.toFixed(2)}h · {e.utc.slice(5, 16).replace("T", " ")}Z
                    </div>
                    <div className="text-xs text-gray-400 leading-snug mt-0.5">{e.description}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Mission Facts panel */}
      {activePanels.has("facts") && (
        <div className="absolute right-14 z-10 w-60 rounded-xl p-3"
          style={{ top: launched ? 166 : 150, background: "rgba(0,5,20,0.92)", border: "1px solid rgba(255,200,50,0.3)", backdropFilter: "blur(14px)" }}>
          <div className="flex justify-between items-center mb-2">
            <div className="text-xs text-yellow-400 font-semibold tracking-widest">MISSION FACTS</div>
            <button onClick={() => togglePanel("facts")} className="text-gray-500 hover:text-white text-sm leading-none">✕</button>
          </div>
          <div className="space-y-1.5 text-xs">
            {[
              ["Vehicle",       "SLS Block 1"],
              ["Spacecraft",    "Orion MPCV"],
              ["Launch pad",    "LC-39B, KSC"],
              ["Launch",        "2026-04-01 22:35:12Z"],
              ["Splashdown",    "2026-04-11 01:07:00Z"],
              ["Duration",      "217.5h (9d 1h 31m)"],
              ["Closest Moon",  units === "km" ? `${CLOSEST_APPROACH_KM.toLocaleString()} km` : `${CLOSEST_APPROACH_MI.toLocaleString()} mi`],
              ["Peak Earth",    units === "km" ? `${PEAK_EARTH_KM.toLocaleString()} km` : `${PEAK_EARTH_MI.toLocaleString()} mi`],
              ["Trajectory",    "Free-return"],
              ["Recovery",      "Pacific — San Diego"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between rounded px-2 py-1"
                style={{ background: "rgba(255,255,255,0.03)" }}>
                <span className="text-gray-400">{k}</span>
                <span className="text-white font-medium">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NASA News drawer */}
      {activePanels.has("news") && (
        <div className="absolute right-14 z-10 w-72 rounded-xl overflow-hidden"
          style={{ top: launched ? 212 : 196, maxHeight: "calc(100vh - 260px)", background: "rgba(0,5,25,0.96)", border: "1px solid rgba(100,150,255,0.25)", backdropFilter: "blur(14px)" }}>
          <div className="p-3 flex justify-between items-center" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="text-xs font-bold text-blue-300 tracking-wide">NASA ARTEMIS II — LATEST</div>
            <button onClick={() => togglePanel("news")} className="text-gray-500 hover:text-white text-sm leading-none">✕</button>
          </div>
          <div className="overflow-y-auto p-3 space-y-3" style={{ maxHeight: "calc(100vh - 320px)" }}>
            {news.length === 0 && (
              <div className="text-xs text-gray-500">Loading NASA imagery…</div>
            )}
            {news.map((item, i) => (
              <div key={i} className="rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
                {item.thumb && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.thumb} alt={item.title} className="w-full h-28 object-cover" loading="lazy" />
                )}
                <div className="p-2">
                  <div className="text-xs font-semibold text-white leading-snug mb-0.5">{item.title}</div>
                  {item.date && <div className="text-xs text-gray-600 mb-1">{item.date}</div>}
                  <div className="text-xs text-gray-400 leading-snug line-clamp-3">
                    {item.description?.slice(0, 140)}{item.description?.length > 140 ? "…" : ""}
                  </div>
                </div>
              </div>
            ))}
            <div className="text-xs text-gray-600 text-center pt-1">NASA Image and Video Library</div>
          </div>
        </div>
      )}

      {/* Camera panel */}
      {activePanels.has("camera") && (
        <div className="absolute right-14 z-10 w-56 rounded-xl p-3"
          style={{ top: launched ? 258 : 242, background: "rgba(0,5,20,0.92)", border: "1px solid rgba(6,182,212,0.35)", backdropFilter: "blur(14px)" }}>
          <div className="flex justify-between items-center mb-2">
            <div className="text-xs text-cyan-400 font-semibold tracking-widest">CAMERA</div>
            <button onClick={() => togglePanel("camera")} className="text-gray-500 hover:text-white text-sm leading-none">✕</button>
          </div>
          <div className="space-y-1.5">
            {[
              { id: "orbit", label: "Earth View" },
              { id: "orion", label: "Lock on Orion" },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => { cameraModeRef.current = opt.id as any }}
                className="w-full text-left text-xs px-2 py-1.5 rounded transition-colors"
                style={{
                  background: cameraModeRef.current === opt.id ? "rgba(6,182,212,0.15)" : "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "#fff",
                }}
              >
                {opt.label}
              </button>
            ))}
            <div className="text-[10px] text-gray-500 mt-2 pt-2 border-t border-white/5">FLY TO</div>
            <button
              onClick={() => {
                cameraModeRef.current = "orbit"
                globeInst.current?.pointOfView({ lat: 32.7, lng: -117.2, altitude: 0.6 }, 1500)
              }}
              className="w-full text-left text-xs px-2 py-1.5 rounded transition-colors flex items-center gap-2"
              style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e" }}
            >
              <span className="w-2 h-2 rounded-full bg-green-400" />
              🌊 Splashdown Zone
            </button>
            <button
              onClick={() => {
                cameraModeRef.current = "orbit"
                globeInst.current?.pointOfView({ lat: 28.5, lng: -80.6, altitude: 0.6 }, 1500)
              }}
              className="w-full text-left text-xs px-2 py-1.5 rounded transition-colors flex items-center gap-2"
              style={{ background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.3)", color: "#f97316" }}
            >
              <span className="w-2 h-2 rounded-full bg-orange-400" />
              🚀 Kennedy Space Center
            </button>
            <button
              onClick={() => {
                cameraModeRef.current = "orbit"
                globeInst.current?.pointOfView({ lat: 0, lng: -80, altitude: 2.8 }, 1500)
              }}
              className="w-full text-left text-xs px-2 py-1.5 rounded transition-colors flex items-center gap-2"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8" }}
            >
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              🌍 Reset Globe View
            </button>
          </div>
        </div>
      )}

      {/* ── Bottom legend bar ─────────────────────────────────────────────── */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-gray-400 px-4 py-2 rounded-lg"
        style={{ background: "rgba(0,5,20,0.75)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-400 opacity-70 inline-block" /> Earth</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400 opacity-70 inline-block" /> Orion</span>
        <span className="flex items-center gap-1"><span className="inline-block h-0.5 bg-cyan-400 opacity-90" style={{ width: 12 }} /> Flown</span>
        <span className="text-gray-600 hidden sm:inline">|</span>
        <span className="hidden sm:inline">Drag · Scroll to zoom</span>
      </div>

      {/* Attribution */}
      <div className="absolute bottom-3 right-3 z-10 text-xs text-gray-700 hidden sm:block">
        {dataSource === "horizons" ? "JPL Horizons -1032" : "MET interp."} · News: NASA
      </div>
    </div>
  )
}

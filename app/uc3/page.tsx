"use client"

import { useEffect, useRef, useState, useMemo, useCallback } from "react"
import Link from "next/link"

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

// Scale: 1 Three.js unit = 5 000 km
const KM_PER_UNIT  = 5000
const EARTH_R_KM   = 6371
const MOON_R_KM    = 1737
const EARTH_R      = EARTH_R_KM / KM_PER_UNIT
const MOON_R       = MOON_R_KM  / KM_PER_UNIT
const CRAFT_RADIUS = 1.8

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

interface MoonPos   { x: number; y: number; z: number; distKm: number; fallback?: boolean }
interface OrionPos  {
  x: number | null; y: number | null; z: number | null
  distEarth: number; velKms: number; elapsedH: number; source: string; phase?: string
}
interface NewsItem  { title: string; description: string; date: string; thumb: string }

// ── Component ─────────────────────────────────────────────────────────────────

export default function UC3Page() {
  const mountRef    = useRef<HTMLDivElement>(null)
  const sceneRef    = useRef<any>(null)
  const cameraModeRef = useRef<"orbit" | "orion" | "moon">("orbit")

  const [moonData,  setMoonData]  = useState<MoonPos | null>(null)
  const [orionData, setOrionData] = useState<OrionPos | null>(null)
  const [news,      setNews]      = useState<NewsItem[]>([])
  const [missionT,  setMissionT]  = useState(0)          // hours since launch
  const [launched,  setLaunched]  = useState(false)
  const [countdown, setCountdown] = useState("")
  const [selected,  setSelected]  = useState<string | null>(null)
  const [distEarth, setDistEarth] = useState<number | null>(null)
  const [distMoon,  setDistMoon]  = useState<number | null>(null)
  const [velKms,    setVelKms]    = useState<number | null>(null)
  const [dataSource,  setDataSource]  = useState("interpolated")
  const [activePanel, setActivePanel] = useState<string | null>(null)

  // NASA TV panel state — open + sound ON by default
  const [showNasaTv, setShowNasaTv] = useState(true)
  const [nasaTvMuted, setNasaTvMuted] = useState(false)

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

  const togglePanel = (id: string) => setActivePanel(p => p === id ? null : id)

  // ── Fetch moon position ───────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/moon-position")
      .then(r => r.json())
      .then(setMoonData)
      .catch(() => setMoonData({ x: 384400, y: 0, z: 0, distKm: 384400 }))
  }, [])

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
          if (sceneRef.current) sceneRef.current.orionPos = d
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
    const dm    = distMoon  ?? 0

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
      distMoon:  dm,
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
  }, [velKms, distEarth, distMoon, missionT])

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

  // ── Three.js scene ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mountRef.current || !moonData) return

    let THREE: any
    let renderer: any, scene: any, camera: any
    let earthMesh: any, moonMesh: any, craftMesh: any
    let flownLine: any, upcomingLine: any, moonOrbitLine: any
    let trailPositions: any[] = []
    let trailLine: any
    let starField: any
    let animId = 0
    let isDragging = false, prevMouse = { x: 0, y: 0 }
    const spherical = { theta: 0.4, phi: 1.1, r: 110 }
    // Smooth camera focus target
    const camFocus = { x: 0, y: 0, z: 0 }

    async function init() {
      const mod = await import("three")
      THREE = mod
      ;(window as any).__THREE__ = THREE

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(mountRef.current!.clientWidth, mountRef.current!.clientHeight)
      renderer.setClearColor(0x000005)
      mountRef.current!.appendChild(renderer.domElement)

      scene  = new THREE.Scene()
      camera = new THREE.PerspectiveCamera(45, mountRef.current!.clientWidth / mountRef.current!.clientHeight, 0.1, 5000)
      camera.position.set(60, 40, 60)
      camera.lookAt(0, 0, 0)

      // ── Lighting — explicit sun direction so the terminator looks right ───
      scene.add(new THREE.AmbientLight(0x1a2233, 0.8))
      const sunLight = new THREE.DirectionalLight(0xffffff, 2.6)
      // Sun in roughly +X+Y direction of ECI frame (chosen for aesthetics)
      sunLight.position.set(1200, 400, 600)
      scene.add(sunLight)
      // Subtle fill from the opposite side
      const fill = new THREE.DirectionalLight(0x4466aa, 0.35)
      fill.position.set(-1000, -200, -500)
      scene.add(fill)

      // ── Stars ──────────────────────────────────────────────────────────
      const starGeo = new THREE.BufferGeometry()
      const starCount = 3000
      const starPos = new Float32Array(starCount * 3)
      for (let i = 0; i < starCount; i++) {
        const r = 2000 + Math.random() * 1000
        const th = Math.random() * Math.PI * 2
        const ph = Math.acos(2 * Math.random() - 1)
        starPos[i*3]   = r * Math.sin(ph) * Math.cos(th)
        starPos[i*3+1] = r * Math.cos(ph)
        starPos[i*3+2] = r * Math.sin(ph) * Math.sin(th)
      }
      starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3))
      starField = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.2, sizeAttenuation: true }))
      scene.add(starField)

      // ── Earth ──────────────────────────────────────────────────────────
      const earthGeo = new THREE.SphereGeometry(EARTH_R, 64, 64)
      const earthMat = new THREE.MeshPhongMaterial({ color: 0x1a6ba0, emissive: 0x0a2030, shininess: 60 })
      earthMesh = new THREE.Mesh(earthGeo, earthMat)
      scene.add(earthMesh)

      const atmGeo = new THREE.SphereGeometry(EARTH_R * 1.04, 32, 32)
      const atmMat = new THREE.MeshPhongMaterial({ color: 0x4488cc, transparent: true, opacity: 0.12, side: THREE.FrontSide })
      scene.add(new THREE.Mesh(atmGeo, atmMat))

      const wireGeo = new THREE.SphereGeometry(EARTH_R * 1.001, 18, 12)
      const wireMat = new THREE.MeshBasicMaterial({ color: 0x336699, wireframe: true, transparent: true, opacity: 0.08 })
      scene.add(new THREE.Mesh(wireGeo, wireMat))

      // KSC marker
      const kscPhi   = (90 - 28.6)  * Math.PI / 180
      const kscTheta = (90 - (-80.6)) * Math.PI / 180
      const kscPos   = new THREE.Vector3(
        EARTH_R * Math.sin(kscPhi) * Math.cos(kscTheta),
        EARTH_R * Math.cos(kscPhi),
        EARTH_R * Math.sin(kscPhi) * Math.sin(kscTheta),
      )
      const kscDot = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xff6600 }),
      )
      kscDot.position.copy(kscPos)
      scene.add(kscDot)

      // Splashdown marker (Pacific off San Diego — 32.7°N, -117.2°W)
      const splashPhi   = (90 - 32.7) * Math.PI / 180
      const splashTheta = (90 - (-117.2)) * Math.PI / 180
      const splashPos = new THREE.Vector3(
        EARTH_R * Math.sin(splashPhi) * Math.cos(splashTheta),
        EARTH_R * Math.cos(splashPhi),
        EARTH_R * Math.sin(splashPhi) * Math.sin(splashTheta),
      )
      const splashDot = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x00ccff }),
      )
      splashDot.position.copy(splashPos)
      scene.add(splashDot)

      // ── Moon ──────────────────────────────────────────────────────────
      const md = moonData!
      const moonScenePos = new THREE.Vector3(
        md.x / KM_PER_UNIT,
        md.y / KM_PER_UNIT,
        md.z / KM_PER_UNIT,
      )
      const moonGeo = new THREE.SphereGeometry(MOON_R, 32, 32)
      const moonMat = new THREE.MeshPhongMaterial({ color: 0xaaaaaa, emissive: 0x111111, shininess: 5 })
      moonMesh = new THREE.Mesh(moonGeo, moonMat)
      moonMesh.position.copy(moonScenePos)
      scene.add(moonMesh)

      const ringGeo = new THREE.TorusGeometry(MOON_R * 1.5, 0.04, 8, 32)
      const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0x8888ff, transparent: true, opacity: 0.4 }))
      ring.position.copy(moonScenePos)
      scene.add(ring)

      // Moon orbit path
      const orbitPts: any[] = []
      const orbitDist = md.distKm / KM_PER_UNIT
      for (let i = 0; i <= 128; i++) {
        const a = (i / 128) * Math.PI * 2
        const inc = 23.4 * Math.PI / 180
        const x = orbitDist * Math.cos(a)
        const y = orbitDist * Math.sin(a) * Math.sin(inc)
        const z = orbitDist * Math.sin(a) * Math.cos(inc)
        orbitPts.push(new THREE.Vector3(x, y, z))
      }
      moonOrbitLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(orbitPts),
        new THREE.LineBasicMaterial({ color: 0x334466, transparent: true, opacity: 0.35 }),
      )
      scene.add(moonOrbitLine)

      // ── Orion spacecraft ───────────────────────────────────────────────
      craftMesh = new THREE.Group()
      craftMesh.position.copy(kscPos)

      const CR = CRAFT_RADIUS
      const cmMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(CR * 0.55, CR, CR * 1.1, 16),
        new THREE.MeshPhongMaterial({ color: 0xd4a843, emissive: 0x443300, shininess: 80 }),
      )
      cmMesh.position.y = CR * 0.8
      craftMesh.add(cmMesh)

      const hsMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(CR, CR * 1.02, CR * 0.12, 16),
        new THREE.MeshPhongMaterial({ color: 0x222222, emissive: 0x110000, shininess: 10 }),
      )
      hsMesh.position.y = CR * 0.18
      craftMesh.add(hsMesh)

      const smMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(CR * 0.75, CR * 0.75, CR * 1.4, 16),
        new THREE.MeshPhongMaterial({ color: 0x888899, emissive: 0x111122, shininess: 120 }),
      )
      smMesh.position.y = -CR * 0.58
      craftMesh.add(smMesh)

      const nozzleMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(CR * 0.18, CR * 0.3, CR * 0.4, 12),
        new THREE.MeshPhongMaterial({ color: 0xaaaaaa, shininess: 160 }),
      )
      nozzleMesh.position.y = -CR * 1.5
      craftMesh.add(nozzleMesh)

      const panelMat = new THREE.MeshPhongMaterial({ color: 0x1144cc, emissive: 0x001133, shininess: 200, side: THREE.DoubleSide })
      const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]
      for (const angle of angles) {
        const panel = new THREE.Mesh(
          new THREE.BoxGeometry(CR * 2.8, CR * 0.06, CR * 1.0),
          panelMat,
        )
        panel.position.set(Math.cos(angle) * CR * 2.0, -CR * 0.55, Math.sin(angle) * CR * 2.0)
        panel.rotation.y = angle
        craftMesh.add(panel)

        const strut = new THREE.Mesh(
          new THREE.CylinderGeometry(CR * 0.04, CR * 0.04, CR * 2.0, 6),
          new THREE.MeshPhongMaterial({ color: 0xaaaaaa }),
        )
        strut.position.set(Math.cos(angle) * CR * 1.0, -CR * 0.55, Math.sin(angle) * CR * 1.0)
        strut.rotation.z = angle + Math.PI / 2
        strut.rotation.x = Math.PI / 2
        craftMesh.add(strut)
      }

      const craftLight = new THREE.PointLight(0xff9922, 10, 30)
      craftMesh.add(craftLight)
      scene.add(craftMesh)

      // ── Trajectory: flown (cyan solid) + upcoming (amber dashed) ───────
      const earthToMoon = moonScenePos.clone().normalize()
      const flybyPt = moonScenePos.clone().sub(earthToMoon.clone().multiplyScalar(CLOSEST_APPROACH_KM / KM_PER_UNIT))

      const outbound = new THREE.CatmullRomCurve3([
        kscPos.clone(),
        kscPos.clone().add(earthToMoon.clone().multiplyScalar(20)).add(new THREE.Vector3(0, 8, 0)),
        moonScenePos.clone().sub(earthToMoon.clone().multiplyScalar(30)).add(new THREE.Vector3(0, 4, 0)),
        flybyPt,
      ])
      const returnPath = new THREE.CatmullRomCurve3([
        flybyPt,
        flybyPt.clone().add(new THREE.Vector3(-10, 5, -10)),
        splashPos.clone().add(new THREE.Vector3(-15, 10, 5)),
        splashPos.clone(),
      ])
      const outPts = outbound.getPoints(120)
      const retPts = returnPath.getPoints(120)
      const allPts: any[] = [...outPts, ...retPts]

      const flownGeo = new THREE.BufferGeometry().setFromPoints([allPts[0]])
      flownLine = new THREE.Line(
        flownGeo,
        new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.9 }),
      )
      scene.add(flownLine)

      const upcomingGeo = new THREE.BufferGeometry().setFromPoints(allPts)
      upcomingLine = new THREE.Line(
        upcomingGeo,
        new THREE.LineDashedMaterial({ color: 0xffaa33, transparent: true, opacity: 0.7, dashSize: 2, gapSize: 1 }),
      )
      ;(upcomingLine as any).computeLineDistances?.()
      scene.add(upcomingLine)

      // Fading trail behind craft
      const trailGeo = new THREE.BufferGeometry()
      const trailArr = new Float32Array(200 * 3)
      trailGeo.setAttribute("position", new THREE.BufferAttribute(trailArr, 3))
      trailLine = new THREE.Line(
        trailGeo,
        new THREE.LineBasicMaterial({ color: 0xffcc66, transparent: true, opacity: 0.55 }),
      )
      scene.add(trailLine)

      sceneRef.current = { trajPts: allPts, orionPos: null, flownLine, upcomingLine, trailArr }

      // ── Controls ───────────────────────────────────────────────────────
      const el = renderer.domElement
      const onDown = (e: MouseEvent) => { isDragging = true; prevMouse = { x: e.clientX, y: e.clientY } }
      const onUp   = () => { isDragging = false }
      const onMove = (e: MouseEvent) => {
        if (!isDragging) return
        const dx = e.clientX - prevMouse.x
        const dy = e.clientY - prevMouse.y
        prevMouse = { x: e.clientX, y: e.clientY }
        spherical.theta -= dx * 0.005
        spherical.phi    = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi + dy * 0.005))
      }
      const onWheel = (e: WheelEvent) => {
        spherical.r = Math.max(15, Math.min(500, spherical.r + e.deltaY * 0.1))
      }
      el.addEventListener("mousedown", onDown)
      window.addEventListener("mouseup",   onUp)
      window.addEventListener("mousemove", onMove)
      el.addEventListener("wheel", onWheel, { passive: true })

      let lastTouch: Touch | null = null
      el.addEventListener("touchstart", (e: TouchEvent) => { lastTouch = e.touches[0]; isDragging = true })
      el.addEventListener("touchend",   () => { isDragging = false; lastTouch = null })
      el.addEventListener("touchmove",  (e: TouchEvent) => {
        if (!isDragging || !lastTouch) return
        const t = e.touches[0]
        const dx = t.clientX - lastTouch.clientX
        const dy = t.clientY - lastTouch.clientY
        lastTouch = t
        spherical.theta -= dx * 0.005
        spherical.phi    = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi + dy * 0.005))
      })

      const onResize = () => {
        if (!mountRef.current) return
        const w = mountRef.current.clientWidth
        const h = mountRef.current.clientHeight
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        renderer.setSize(w, h)
      }
      window.addEventListener("resize", onResize)

      // ── Animate ──────────────────────────────────────────────────────
      let frame = 0
      const animate = () => {
        animId = requestAnimationFrame(animate)
        frame++

        earthMesh.rotation.y += 0.001
        craftMesh.rotation.y += 0.008

        const liveOrion = sceneRef.current?.orionPos
        const trajPts2  = sceneRef.current?.trajPts
        const useRealPos = liveOrion?.source === "horizons" && liveOrion.x != null && liveOrion.y != null

        if (useRealPos) {
          craftMesh.position.set(
            liveOrion.x / KM_PER_UNIT,
            liveOrion.y / KM_PER_UNIT,
            liveOrion.z / KM_PER_UNIT,
          )
          const dM = craftMesh.position.distanceTo(moonMesh.position) * KM_PER_UNIT
          setDistMoon(dM)
        } else if (trajPts2 && trajPts2.length > 0) {
          const elapsedH = (Date.now() - LAUNCH_DATE.getTime()) / 3_600_000
          let t: number
          if (elapsedH < 0) {
            t = (frame % 600) / 600
          } else {
            t = Math.min(1, elapsedH / DURATION_HOURS)
          }
          const idx = Math.min(trajPts2.length - 1, Math.floor(t * (trajPts2.length - 1)))
          craftMesh.position.copy(trajPts2[idx])

          const p = craftMesh.position
          setDistEarth(Math.sqrt(p.x*p.x + p.y*p.y + p.z*p.z) * KM_PER_UNIT)
          setDistMoon(p.distanceTo(moonMesh.position) * KM_PER_UNIT)

          // Update flown vs upcoming geometry
          if (sceneRef.current?.flownLine && sceneRef.current?.upcomingLine) {
            const flownPts = trajPts2.slice(0, idx + 1)
            const upPts    = trajPts2.slice(idx)
            sceneRef.current.flownLine.geometry.dispose()
            sceneRef.current.flownLine.geometry = new THREE.BufferGeometry().setFromPoints(flownPts)
            sceneRef.current.upcomingLine.geometry.dispose()
            sceneRef.current.upcomingLine.geometry = new THREE.BufferGeometry().setFromPoints(upPts)
            sceneRef.current.upcomingLine.computeLineDistances?.()
          }
        }

        // Update trail
        if (trailLine && frame % 3 === 0) {
          trailPositions.push(craftMesh.position.clone())
          if (trailPositions.length > 200) trailPositions.shift()
          const arr = trailLine.geometry.attributes.position.array as Float32Array
          for (let i = 0; i < trailPositions.length; i++) {
            arr[i*3]   = trailPositions[i].x
            arr[i*3+1] = trailPositions[i].y
            arr[i*3+2] = trailPositions[i].z
          }
          trailLine.geometry.setDrawRange(0, trailPositions.length)
          trailLine.geometry.attributes.position.needsUpdate = true
        }

        // Camera focus smoothing
        const mode = cameraModeRef.current
        let targetX = 0, targetY = 0, targetZ = 0
        if (mode === "orion") {
          targetX = craftMesh.position.x
          targetY = craftMesh.position.y
          targetZ = craftMesh.position.z
        } else if (mode === "moon") {
          targetX = moonMesh.position.x
          targetY = moonMesh.position.y
          targetZ = moonMesh.position.z
        }
        camFocus.x += (targetX - camFocus.x) * 0.06
        camFocus.y += (targetY - camFocus.y) * 0.06
        camFocus.z += (targetZ - camFocus.z) * 0.06

        camera.position.x = camFocus.x + spherical.r * Math.sin(spherical.phi) * Math.sin(spherical.theta)
        camera.position.y = camFocus.y + spherical.r * Math.cos(spherical.phi)
        camera.position.z = camFocus.z + spherical.r * Math.sin(spherical.phi) * Math.cos(spherical.theta)
        camera.lookAt(camFocus.x, camFocus.y, camFocus.z)

        renderer.render(scene, camera)
      }
      animate()

      return () => {
        cancelAnimationFrame(animId)
        window.removeEventListener("resize", onResize)
        window.removeEventListener("mousemove", onMove)
        window.removeEventListener("mouseup", onUp)
        renderer.dispose()
        if (mountRef.current) {
          try { mountRef.current.removeChild(renderer.domElement) } catch {}
        }
      }
    }

    let cleanup: (() => void) | undefined
    init().then(fn => { cleanup = fn })
    return () => { cleanup?.() }
  }, [moonData])

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
        background:  activePanel === id ? `${activeColor}30` : "rgba(0,5,20,0.85)",
        border:      activePanel === id ? `1.5px solid ${activeColor}` : "1px solid rgba(255,255,255,0.14)",
        backdropFilter: "blur(10px)",
        boxShadow: activePanel === id ? `0 0 10px ${activeColor}40` : "none",
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

      <style jsx>{`
        @keyframes nasaPulse {
          0%, 100% { box-shadow: 0 0 18px rgba(255,40,40,0.55), 0 0 34px rgba(255,40,40,0.3); }
          50%      { box-shadow: 0 0 28px rgba(255,80,80,0.85), 0 0 52px rgba(255,40,40,0.55); }
        }
      `}</style>

      {/* ── NASA TV panel (floating middle-right, vertically centered) ───── */}
      {showNasaTv && (
        <div
          className="fixed right-4 z-50 bg-black rounded-2xl overflow-hidden shadow-2xl border border-cyan-500/40"
          style={{ width: 440, height: 290, top: "50%", transform: "translateY(-50%)", boxShadow: "0 0 60px rgba(0,200,255,0.25)" }}
        >
          <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-red-900/60 to-cyan-900/60">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-bold text-white tracking-widest">NASA LIVE TV</span>
            </div>
            <div className="flex items-center gap-2">
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
            src={`https://www.youtube.com/embed/m3kR2KK8TEs?si=i8sUw9uyCmeQZNRQ&autoplay=1&mute=${nasaTvMuted ? 1 : 0}`}
            width="440"
            height="258"
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
        {iconBtn("events",   "📅", "Mission Events",  "#a855f7")}
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
      {activePanel === "phase" && (
        <div className="absolute left-14 z-10 w-64 rounded-xl p-3"
          style={{ top: launched ? 72 : 56, background: "rgba(0,5,20,0.92)", border: "1px solid rgba(255,140,0,0.35)", backdropFilter: "blur(14px)" }}>
          <div className="flex justify-between items-center mb-2">
            <div className="text-xs text-orange-400 font-semibold tracking-widest">MISSION PHASE</div>
            <button onClick={() => setActivePanel(null)} className="text-gray-500 hover:text-white text-sm leading-none">✕</button>
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
      {activePanel === "telemetry" && (
        <div className="absolute left-14 z-10 w-72 rounded-xl p-3"
          style={{ top: launched ? 118 : 102, background: "rgba(0,5,20,0.92)", border: "1px solid rgba(50,150,255,0.35)", backdropFilter: "blur(14px)", maxHeight: "70vh", overflowY: "auto" }}>
          <div className="flex justify-between items-center mb-2">
            <div className="text-xs text-blue-400 font-semibold tracking-widest">ORION TELEMETRY</div>
            <button onClick={() => setActivePanel(null)} className="text-gray-500 hover:text-white text-sm leading-none">✕</button>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {[
              { label: "Dist. Earth",   val: kmToDisp(telemetry.distEarth),        color: "#60a5fa" },
              { label: "Dist. Moon",    val: kmToDisp(telemetry.distMoon),         color: "#a5b4fc" },
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
      {activePanel === "crew" && (
        <div className="absolute left-14 z-10 w-72 rounded-xl p-3"
          style={{ top: launched ? 164 : 148, background: "rgba(0,5,20,0.92)", border: "1px solid rgba(100,200,100,0.3)", backdropFilter: "blur(14px)", maxHeight: "70vh", overflowY: "auto" }}>
          <div className="flex justify-between items-center mb-2">
            <div className="text-xs text-green-400 font-semibold tracking-widest">CREW — 4 ASTRONAUTS</div>
            <button onClick={() => setActivePanel(null)} className="text-gray-500 hover:text-white text-sm leading-none">✕</button>
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
      {activePanel === "systems" && (
        <div className="absolute left-14 z-10 w-64 rounded-xl p-3"
          style={{ top: launched ? 210 : 194, background: "rgba(0,5,20,0.92)", border: "1px solid rgba(20,184,166,0.35)", backdropFilter: "blur(14px)" }}>
          <div className="flex justify-between items-center mb-2">
            <div className="text-xs text-teal-400 font-semibold tracking-widest">SYSTEMS STATUS</div>
            <button onClick={() => setActivePanel(null)} className="text-gray-500 hover:text-white text-sm leading-none">✕</button>
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
      {activePanel === "records" && (
        <div className="absolute left-14 z-10 w-72 rounded-xl p-3"
          style={{ top: launched ? 256 : 240, background: "rgba(0,5,20,0.92)", border: "1px solid rgba(251,191,36,0.35)", backdropFilter: "blur(14px)" }}>
          <div className="flex justify-between items-center mb-2">
            <div className="text-xs text-yellow-300 font-semibold tracking-widest">HISTORIC RECORDS</div>
            <button onClick={() => setActivePanel(null)} className="text-gray-500 hover:text-white text-sm leading-none">✕</button>
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
      {activePanel === "events" && (
        <div className="absolute right-14 z-10 w-72 rounded-xl overflow-hidden"
          style={{ top: launched ? 120 : 104, maxHeight: "70vh", background: "rgba(0,5,20,0.94)", border: "1px solid rgba(180,100,255,0.35)", backdropFilter: "blur(14px)" }}>
          <div className="p-3 flex justify-between items-center" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="text-xs text-purple-400 font-semibold tracking-widest">MISSION EVENTS</div>
            <button onClick={() => setActivePanel(null)} className="text-gray-500 hover:text-white text-sm leading-none">✕</button>
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
      {activePanel === "facts" && (
        <div className="absolute right-14 z-10 w-60 rounded-xl p-3"
          style={{ top: launched ? 166 : 150, background: "rgba(0,5,20,0.92)", border: "1px solid rgba(255,200,50,0.3)", backdropFilter: "blur(14px)" }}>
          <div className="flex justify-between items-center mb-2">
            <div className="text-xs text-yellow-400 font-semibold tracking-widest">MISSION FACTS</div>
            <button onClick={() => setActivePanel(null)} className="text-gray-500 hover:text-white text-sm leading-none">✕</button>
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
      {activePanel === "news" && (
        <div className="absolute right-14 z-10 w-72 rounded-xl overflow-hidden"
          style={{ top: launched ? 212 : 196, maxHeight: "calc(100vh - 260px)", background: "rgba(0,5,25,0.96)", border: "1px solid rgba(100,150,255,0.25)", backdropFilter: "blur(14px)" }}>
          <div className="p-3 flex justify-between items-center" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="text-xs font-bold text-blue-300 tracking-wide">NASA ARTEMIS II — LATEST</div>
            <button onClick={() => setActivePanel(null)} className="text-gray-500 hover:text-white text-sm leading-none">✕</button>
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
      {activePanel === "camera" && (
        <div className="absolute right-14 z-10 w-56 rounded-xl p-3"
          style={{ top: launched ? 258 : 242, background: "rgba(0,5,20,0.92)", border: "1px solid rgba(6,182,212,0.35)", backdropFilter: "blur(14px)" }}>
          <div className="flex justify-between items-center mb-2">
            <div className="text-xs text-cyan-400 font-semibold tracking-widest">CAMERA</div>
            <button onClick={() => setActivePanel(null)} className="text-gray-500 hover:text-white text-sm leading-none">✕</button>
          </div>
          <div className="space-y-1.5">
            {[
              { id: "orbit", label: "Earth View" },
              { id: "orion", label: "Lock on Orion" },
              { id: "moon",  label: "Follow Moon" },
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
          </div>
        </div>
      )}

      {/* ── Bottom legend bar ─────────────────────────────────────────────── */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-gray-400 px-4 py-2 rounded-lg"
        style={{ background: "rgba(0,5,20,0.75)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-400 opacity-70 inline-block" /> Earth</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-gray-400 opacity-70 inline-block" /> Moon</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400 opacity-70 inline-block" /> Orion</span>
        <span className="flex items-center gap-1"><span className="inline-block h-0.5 bg-cyan-400 opacity-90" style={{ width: 12 }} /> Flown</span>
        <span className="flex items-center gap-1"><span className="inline-block h-0.5 bg-orange-400 opacity-80" style={{ width: 12 }} /> Upcoming</span>
        <span className="text-gray-600 hidden sm:inline">|</span>
        <span className="hidden sm:inline">Drag · Scroll to zoom</span>
      </div>

      {/* Attribution */}
      <div className="absolute bottom-3 right-3 z-10 text-xs text-gray-700 hidden sm:block">
        {dataSource === "horizons" ? "JPL Horizons -1032" : "MET interp."} · Moon: JPL · News: NASA
      </div>
    </div>
  )
}

"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Link from "next/link"

// ── Mission constants ─────────────────────────────────────────────────────────

// Artemis II: first crewed Artemis lunar flyby
// Crew: Reid Wiseman (CDR), Victor Glover (PLT), Christina Koch (MS1), Jeremy Hansen (MS2)
// Launch: NET April 2026, LC-39B, KSC  |  Duration: ~10 days  |  Closest approach: ~8 900 km
const LAUNCH_DATE = new Date("2026-04-07T18:00:00Z") // NET — will be updated when confirmed

const CREW = [
  { name: "Reid Wiseman",    role: "Commander",          flag: "🇺🇸", agency: "NASA", bio: "USN test pilot, ISS Exp 40/41 veteran, 165 EVA days." },
  { name: "Victor Glover",   role: "Pilot",              flag: "🇺🇸", agency: "NASA", bio: "USN test pilot, SpaceX Crew-1, first Black pilot on lunar mission." },
  { name: "Christina Koch",  role: "Mission Specialist", flag: "🇺🇸", agency: "NASA", bio: "328-day ISS record, record female EVA hours, first woman to lunar vicinity." },
  { name: "Jeremy Hansen",   role: "Mission Specialist", flag: "🇨🇦", agency: "CSA",  bio: "First Canadian to fly to the Moon. Fighter pilot, astronomer." },
]

// Mission phases with offset in hours from launch and description
const PHASES = [
  { label: "Launch",             hoursFromL:   0, desc: "SLS Block 1 lifts off from LC-39B, Kennedy Space Center." },
  { label: "Earth Orbit",        hoursFromL:   1.5, desc: "Orion reaches parking orbit, crew checks all systems." },
  { label: "TLI Burn",           hoursFromL:   2.5, desc: "Trans-Lunar Injection — Orion's engine fires, setting course for the Moon." },
  { label: "Outbound Coast",     hoursFromL:  72, desc: "Three-day coast to the Moon at ~2,200 km/h average." },
  { label: "Lunar Flyby",        hoursFromL:  96, desc: "Closest approach ~8 900 km from lunar surface — free-return trajectory." },
  { label: "Return Coast",       hoursFromL: 120, desc: "Return coast to Earth spanning five days." },
  { label: "Splashdown",         hoursFromL: 240, desc: "Orion re-enters atmosphere at 40,000 km/h — Pacific Ocean recovery." },
]

// Scale: 1 Three.js unit = 5 000 km
const KM_PER_UNIT  = 5000
const EARTH_R_KM   = 6371
const MOON_R_KM    = 1737
const EARTH_R      = EARTH_R_KM  / KM_PER_UNIT     // ~1.27
const MOON_R       = MOON_R_KM   / KM_PER_UNIT     // ~0.35
const MEAN_DIST    = 384400      / KM_PER_UNIT     // ~76.9 units
const CRAFT_RADIUS = 0.25                           // visual size in scene

// ── Types ─────────────────────────────────────────────────────────────────────

interface MoonPos { x: number; y: number; z: number; distKm: number; fallback?: boolean }
interface NewsItem { title: string; description: string; date: string; thumb: string }

// ── Trajectory helpers ────────────────────────────────────────────────────────

// Build a simplified free-return trajectory in 3D space (ECI frame approximation).
// We animate the craft position along this path based on mission elapsed time.
function buildTrajectoryPoints(moonPos: MoonPos, segments = 120): any[] {
  // Import THREE lazily inside — this file is "use client"
  const THREE = (window as any).__THREE__
  if (!THREE) return []

  // Earth at origin
  const earthPos = new THREE.Vector3(0, 0, 0)

  // Moon position in scene units
  const moonVec = new THREE.Vector3(
    moonPos.x / KM_PER_UNIT,
    moonPos.y / KM_PER_UNIT,
    moonPos.z / KM_PER_UNIT,
  )

  // Closest approach point: 8900 km from Moon center, on the Earth-facing side
  const earthToMoon = moonVec.clone().normalize()
  const flybyPt = moonVec.clone().sub(earthToMoon.clone().multiplyScalar(8900 / KM_PER_UNIT))

  // Splashdown: ~Pacific, opposite side of Earth from Moon approach
  // Approximate: shift Earth position by 5000 km in XZ
  const splashPt = new THREE.Vector3(-EARTH_R * 0.4, -EARTH_R * 0.3, EARTH_R * 0.5)

  // KSC launch point on Earth surface (~28.6°N, 80.6°W)
  const launchPhi   = (90 - 28.6)  * Math.PI / 180
  const launchTheta = (90 - (-80.6)) * Math.PI / 180
  const launchPt = new THREE.Vector3(
    EARTH_R * Math.sin(launchPhi) * Math.cos(launchTheta),
    EARTH_R * Math.cos(launchPhi),
    EARTH_R * Math.sin(launchPhi) * Math.sin(launchTheta),
  )

  // Build a smooth CatmullRom spline through key waypoints
  const outbound = new THREE.CatmullRomCurve3([
    launchPt,
    launchPt.clone().add(earthToMoon.clone().multiplyScalar(20)).add(new THREE.Vector3(0, 8, 0)),
    moonVec.clone().sub(earthToMoon.clone().multiplyScalar(30)).add(new THREE.Vector3(0, 4, 0)),
    flybyPt,
  ])

  const returnPath = new THREE.CatmullRomCurve3([
    flybyPt,
    flybyPt.clone().add(new THREE.Vector3(-10, 5, -10)),
    splashPt.clone().add(new THREE.Vector3(-15, 10, 5)),
    splashPt,
  ])

  const outPts  = outbound.getPoints(segments)
  const retPts  = returnPath.getPoints(segments)
  return [...outPts, ...retPts]
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function UC3Page() {
  const mountRef    = useRef<HTMLDivElement>(null)
  const sceneRef    = useRef<any>(null)
  const animRef     = useRef<number>(0)

  const [moonData,  setMoonData]  = useState<MoonPos | null>(null)
  const [news,      setNews]      = useState<NewsItem[]>([])
  const [phase,     setPhase]     = useState(0)          // index into PHASES
  const [missionT,  setMissionT]  = useState(0)          // hours since launch (negative = pre-launch)
  const [launched,  setLaunched]  = useState(false)
  const [countdown, setCountdown] = useState("")
  const [selected,  setSelected]  = useState<string | null>(null)
  const [distEarth, setDistEarth] = useState<number | null>(null)
  const [distMoon,  setDistMoon]  = useState<number | null>(null)
  const [velKms,    setVelKms]    = useState<number | null>(null)
  const [showNews,  setShowNews]  = useState(false)

  // ── Fetch moon position ───────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/moon-position")
      .then(r => r.json())
      .then(setMoonData)
      .catch(() => setMoonData({ x: 384400, y: 0, z: 0, distKm: 384400 }))
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
      const now     = Date.now()
      const diffMs  = now - LAUNCH_DATE.getTime()
      const diffH   = diffMs / 3_600_000
      setMissionT(diffH)
      setLaunched(diffH >= 0)

      if (diffH < 0) {
        // Countdown
        const absMs = Math.abs(diffMs)
        const d = Math.floor(absMs / 86400000)
        const h = Math.floor((absMs % 86400000) / 3600000)
        const m = Math.floor((absMs % 3600000)  / 60000)
        const s = Math.floor((absMs % 60000)    / 1000)
        setCountdown(`T−${d}d ${String(h).padStart(2,"0")}h ${String(m).padStart(2,"0")}m ${String(s).padStart(2,"0")}s`)
      } else {
        setCountdown("")
      }

      // Determine phase
      const phaseIdx = PHASES.reduce((best, p, i) => diffH >= p.hoursFromL ? i : best, 0)
      setPhase(phaseIdx)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // ── Three.js scene ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mountRef.current || !moonData) return

    let THREE: any
    let renderer: any, scene: any, camera: any
    let earthMesh: any, moonMesh: any, craftMesh: any
    let trajectoryLine: any, moonOrbitLine: any
    let starField: any
    let animId = 0
    let isDragging = false, prevMouse = { x: 0, y: 0 }
    let spherical = { theta: 0.4, phi: 1.1, r: 180 }

    async function init() {
      const mod = await import("three")
      THREE = mod;
      (window as any).__THREE__ = THREE

      // ── Renderer ───────────────────────────────────────────────────────
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(mountRef.current!.clientWidth, mountRef.current!.clientHeight)
      renderer.setClearColor(0x000005)
      mountRef.current!.appendChild(renderer.domElement)

      // ── Scene / Camera ─────────────────────────────────────────────────
      scene  = new THREE.Scene()
      camera = new THREE.PerspectiveCamera(45, mountRef.current!.clientWidth / mountRef.current!.clientHeight, 0.1, 5000)
      camera.position.set(60, 40, 60)
      camera.lookAt(0, 0, 0)

      // ── Lighting ───────────────────────────────────────────────────────
      scene.add(new THREE.AmbientLight(0x223344, 1.2))
      const sunLight = new THREE.DirectionalLight(0xffffff, 2.5)
      sunLight.position.set(500, 200, 300)
      scene.add(sunLight)

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

      // Earth atmosphere glow
      const atmGeo = new THREE.SphereGeometry(EARTH_R * 1.04, 32, 32)
      const atmMat = new THREE.MeshPhongMaterial({ color: 0x4488cc, transparent: true, opacity: 0.12, side: THREE.FrontSide })
      scene.add(new THREE.Mesh(atmGeo, atmMat))

      // Earth grid overlay
      const wireGeo = new THREE.SphereGeometry(EARTH_R * 1.001, 18, 12)
      const wireMat = new THREE.MeshBasicMaterial({ color: 0x336699, wireframe: true, transparent: true, opacity: 0.08 })
      scene.add(new THREE.Mesh(wireGeo, wireMat))

      // KSC launch site marker
      const kscPhi   = (90 - 28.6)  * Math.PI / 180
      const kscTheta = (90 - (-80.6)) * Math.PI / 180
      const kscPos   = new THREE.Vector3(
        EARTH_R * Math.sin(kscPhi) * Math.cos(kscTheta),
        EARTH_R * Math.cos(kscPhi),
        EARTH_R * Math.sin(kscPhi) * Math.sin(kscTheta),
      )
      const kscGeo = new THREE.SphereGeometry(0.08, 8, 8)
      const kscMat = new THREE.MeshBasicMaterial({ color: 0xff6600 })
      const kscDot = new THREE.Mesh(kscGeo, kscMat)
      kscDot.position.copy(kscPos)
      scene.add(kscDot)

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

      // Moon label ring
      const ringGeo = new THREE.TorusGeometry(MOON_R * 1.5, 0.04, 8, 32)
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x8888ff, transparent: true, opacity: 0.4 })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.position.copy(moonScenePos)
      scene.add(ring)

      // Moon orbit path (dashed circle in orbital plane)
      const orbitPts: any[] = []
      const orbitDist = md.distKm / KM_PER_UNIT
      for (let i = 0; i <= 128; i++) {
        const a = (i / 128) * Math.PI * 2
        // Approximate lunar orbital plane (inclined ~5.1° to ecliptic, ~18.3°–28.6° to equator)
        const inc = 23.4 * Math.PI / 180  // use ecliptic tilt as approximation
        const x = orbitDist * Math.cos(a)
        const y = orbitDist * Math.sin(a) * Math.sin(inc)
        const z = orbitDist * Math.sin(a) * Math.cos(inc)
        orbitPts.push(new THREE.Vector3(x, y, z))
      }
      const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPts)
      moonOrbitLine = new THREE.Line(orbitGeo, new THREE.LineBasicMaterial({ color: 0x334466, transparent: true, opacity: 0.35 }))
      scene.add(moonOrbitLine)

      // ── Orion spacecraft ─────────────────────────────────────────────
      const craftGeo = new THREE.OctahedronGeometry(CRAFT_RADIUS, 0)
      const craftMat = new THREE.MeshPhongMaterial({ color: 0xffdd44, emissive: 0x884400, shininess: 120 })
      craftMesh = new THREE.Mesh(craftGeo, craftMat)
      // Start at KSC
      craftMesh.position.copy(kscPos)
      scene.add(craftMesh)

      // ── Trajectory ──────────────────────────────────────────────────
      const trajPts = buildTrajectoryPoints(md)
      if (trajPts.length > 0) {
        const trajGeo = new THREE.BufferGeometry().setFromPoints(trajPts)
        trajectoryLine = new THREE.Line(
          trajGeo,
          new THREE.LineBasicMaterial({ color: 0xff8822, transparent: true, opacity: 0.6 })
        )
        scene.add(trajectoryLine)
        sceneRef.current = { trajPts }
      }

      // ── Mouse controls ───────────────────────────────────────────────
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
        spherical.r = Math.max(30, Math.min(500, spherical.r + e.deltaY * 0.1))
      }
      el.addEventListener("mousedown", onDown)
      window.addEventListener("mouseup",   onUp)
      window.addEventListener("mousemove", onMove)
      el.addEventListener("wheel", onWheel, { passive: true })

      // Touch
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

      // ── Resize ───────────────────────────────────────────────────────
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

        // Rotate Earth slowly
        earthMesh.rotation.y += 0.001

        // Pulse craft
        const pulse = 1 + 0.15 * Math.sin(frame * 0.08)
        craftMesh.scale.setScalar(pulse)
        craftMesh.rotation.y += 0.02

        // Move craft along trajectory
        const trajPts2 = sceneRef.current?.trajPts
        if (trajPts2 && trajPts2.length > 0) {
          const totalH = PHASES[PHASES.length - 1].hoursFromL
          const now2 = Date.now()
          const elapsedH = (now2 - LAUNCH_DATE.getTime()) / 3_600_000
          let t: number
          if (elapsedH < 0) {
            // Pre-launch: animate slowly back and forth along outbound half for preview
            t = 0.5 * Math.abs(Math.sin(frame * 0.002))
          } else {
            t = Math.min(1, elapsedH / totalH)
          }
          const idx = Math.min(trajPts2.length - 1, Math.floor(t * (trajPts2.length - 1)))
          craftMesh.position.copy(trajPts2[idx])

          // Update telemetry state
          const p = craftMesh.position
          const dE = Math.sqrt(p.x*p.x + p.y*p.y + p.z*p.z) * KM_PER_UNIT
          const moonScPos = moonMesh.position
          const dM = p.distanceTo(moonScPos) * KM_PER_UNIT
          setDistEarth(dE)
          setDistMoon(dM)

          // Approximate velocity from trajectory tangent
          if (idx < trajPts2.length - 1) {
            const p2 = trajPts2[idx + 1]
            const segKm = p2.distanceTo(craftMesh.position) * KM_PER_UNIT
            const dtSec = (totalH * 3600) / trajPts2.length
            setVelKms(parseFloat((segKm / dtSec).toFixed(2)))
          }
        }

        // Camera orbit
        camera.position.x = spherical.r * Math.sin(spherical.phi) * Math.sin(spherical.theta)
        camera.position.y = spherical.r * Math.cos(spherical.phi)
        camera.position.z = spherical.r * Math.sin(spherical.phi) * Math.cos(spherical.theta)
        camera.lookAt(0, 0, 0)

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

  // ── UI helpers ────────────────────────────────────────────────────────────
  const fmt = (n: number | null, unit: string) =>
    n == null ? "—" : `${n.toLocaleString("en-US", { maximumFractionDigits: 0 })} ${unit}`

  const currentPhase = PHASES[phase]

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full" style={{ height: "calc(100vh - 64px)", background: "#000008" }}>

      {/* Three.js canvas mount */}
      <div ref={mountRef} className="absolute inset-0" />

      {/* Top header bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2"
        style={{ background: "rgba(0,0,10,0.75)", borderBottom: "1px solid rgba(255,150,50,0.3)" }}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚀</span>
          <div>
            <div className="text-sm font-bold tracking-widest text-orange-300">ARTEMIS II</div>
            <div className="text-xs text-gray-400">NASA Lunar Flyby Mission · Orion MPCV</div>
          </div>
        </div>

        {/* Mission status badge */}
        {!launched ? (
          <div className="flex flex-col items-end gap-0.5">
            <div className="text-xs font-mono text-orange-400 bg-orange-900/30 border border-orange-600/40 px-2 py-0.5 rounded">
              PRE-LAUNCH
            </div>
            <div className="text-xs font-mono text-yellow-300 tabular-nums">{countdown}</div>
          </div>
        ) : (
          <div className="flex flex-col items-end gap-0.5">
            <div className="text-xs font-mono text-green-400 bg-green-900/30 border border-green-600/40 px-2 py-0.5 rounded">
              MISSION ACTIVE
            </div>
            <div className="text-xs text-gray-400">MET: {Math.floor(missionT)}h {Math.floor((missionT % 1) * 60)}m</div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setShowNews(v => !v)}
            className="text-xs px-3 py-1 rounded border border-blue-500/50 text-blue-300 hover:bg-blue-900/30 transition-colors"
          >
            {showNews ? "Hide News" : "NASA News"}
          </button>
          <Link href="/" className="text-xs px-3 py-1 rounded border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors">
            ← Home
          </Link>
        </div>
      </div>

      {/* Left panel — crew + mission info */}
      <div className="absolute left-3 top-16 z-10 flex flex-col gap-2" style={{ width: 230 }}>

        {/* Current phase */}
        <div className="rounded-lg p-3" style={{ background: "rgba(0,5,20,0.85)", border: "1px solid rgba(255,140,0,0.3)" }}>
          <div className="text-xs text-orange-400 font-semibold mb-1 tracking-widest">MISSION PHASE</div>
          <div className="text-sm font-bold text-white mb-1">{currentPhase.label}</div>
          <div className="text-xs text-gray-400 leading-snug">{currentPhase.desc}</div>
          {/* Phase progress dots */}
          <div className="flex gap-1 mt-2 flex-wrap">
            {PHASES.map((p, i) => (
              <div key={i} className="w-2 h-2 rounded-full transition-colors"
                style={{ background: i <= phase ? "#f97316" : "#334" }} title={p.label} />
            ))}
          </div>
        </div>

        {/* Telemetry */}
        <div className="rounded-lg p-3" style={{ background: "rgba(0,5,20,0.85)", border: "1px solid rgba(50,150,255,0.3)" }}>
          <div className="text-xs text-blue-400 font-semibold mb-2 tracking-widest">ORION TELEMETRY</div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Dist. Earth</span>
              <span className="text-white font-mono tabular-nums">{fmt(distEarth, "km")}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Dist. Moon</span>
              <span className="text-white font-mono tabular-nums">{fmt(distMoon, "km")}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Velocity</span>
              <span className="text-white font-mono tabular-nums">{velKms != null ? `${velKms} km/s` : "—"}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Moon dist.</span>
              <span className="text-white font-mono tabular-nums">{moonData ? `${Math.round(moonData.distKm).toLocaleString()} km` : "—"}</span>
            </div>
          </div>
        </div>

        {/* Crew */}
        <div className="rounded-lg p-3" style={{ background: "rgba(0,5,20,0.85)", border: "1px solid rgba(100,200,100,0.25)" }}>
          <div className="text-xs text-green-400 font-semibold mb-2 tracking-widest">CREW — 4 ASTRONAUTS</div>
          <div className="space-y-2">
            {CREW.map(c => (
              <div key={c.name}
                className="cursor-pointer rounded p-1.5 transition-colors hover:bg-white/5"
                onClick={() => setSelected(selected === c.name ? null : c.name)}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{c.flag}</span>
                  <div>
                    <div className="text-xs font-semibold text-white">{c.name}</div>
                    <div className="text-xs text-gray-400">{c.role} · {c.agency}</div>
                  </div>
                </div>
                {selected === c.name && (
                  <div className="mt-1.5 text-xs text-gray-300 leading-snug">{c.bio}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — timeline */}
      <div className="absolute right-3 top-16 z-10" style={{ width: 210 }}>
        <div className="rounded-lg p-3" style={{ background: "rgba(0,5,20,0.85)", border: "1px solid rgba(180,100,255,0.3)" }}>
          <div className="text-xs text-purple-400 font-semibold mb-2 tracking-widest">MISSION TIMELINE</div>
          <div className="space-y-2">
            {PHASES.map((p, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="mt-0.5 w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: i < phase ? "#86efac" : i === phase ? "#fb923c" : "#334" }} />
                <div>
                  <div className="text-xs font-semibold" style={{ color: i === phase ? "#fb923c" : i < phase ? "#86efac" : "#888" }}>
                    {p.label}
                  </div>
                  <div className="text-xs text-gray-500">L+{p.hoursFromL < 1 ? `${p.hoursFromL * 60}min` : `${p.hoursFromL}h`}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mission facts */}
        <div className="rounded-lg p-3 mt-2" style={{ background: "rgba(0,5,20,0.85)", border: "1px solid rgba(255,200,50,0.25)" }}>
          <div className="text-xs text-yellow-400 font-semibold mb-2 tracking-widest">MISSION FACTS</div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Vehicle</span>
              <span className="text-white">SLS Block 1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Spacecraft</span>
              <span className="text-white">Orion MPCV</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Launch pad</span>
              <span className="text-white">LC-39B, KSC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Duration</span>
              <span className="text-white">~10 days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Closest Moon</span>
              <span className="text-white">~8,900 km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Trajectory</span>
              <span className="text-white">Free-return</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Splashdown</span>
              <span className="text-white">Pacific Ocean</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom legend */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-4 text-xs text-gray-400 px-4 py-2 rounded-lg"
        style={{ background: "rgba(0,5,20,0.7)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-400 opacity-70" /> Earth
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-gray-400 opacity-70" /> Moon
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-yellow-400 opacity-70" /> Orion
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-0.5 bg-orange-400 opacity-70" style={{ width: 12 }} /> Trajectory
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-orange-600" /> KSC
        </div>
        <span className="text-gray-600">|</span>
        <span>Drag to rotate · Scroll to zoom</span>
      </div>

      {/* NASA News drawer */}
      {showNews && (
        <div className="absolute inset-y-14 right-0 z-20 overflow-y-auto"
          style={{ width: 340, background: "rgba(0,5,25,0.97)", borderLeft: "1px solid rgba(100,150,255,0.2)" }}>
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm font-bold text-blue-300">NASA Artemis II — Latest</div>
              <button onClick={() => setShowNews(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            {news.length === 0 && (
              <div className="text-xs text-gray-500">Loading NASA imagery…</div>
            )}
            <div className="space-y-4">
              {news.map((item, i) => (
                <div key={i} className="rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
                  {item.thumb && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.thumb} alt={item.title} className="w-full h-32 object-cover" loading="lazy" />
                  )}
                  <div className="p-2">
                    <div className="text-xs font-semibold text-white leading-snug mb-1">{item.title}</div>
                    {item.date && <div className="text-xs text-gray-500 mb-1">{item.date}</div>}
                    <div className="text-xs text-gray-400 leading-snug line-clamp-3">
                      {item.description?.slice(0, 160)}{item.description?.length > 160 ? "…" : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-xs text-gray-600 text-center">
              Source: NASA Image and Video Library
            </div>
          </div>
        </div>
      )}

      {/* Data source attribution */}
      <div className="absolute bottom-3 right-3 z-10 text-xs text-gray-600">
        Moon position: NASA JPL Horizons · News: NASA Images API
      </div>
    </div>
  )
}

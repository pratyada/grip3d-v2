"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Link from "next/link"

// ── Mission constants ─────────────────────────────────────────────────────────

// Artemis II: first crewed Artemis lunar flyby
// Crew: Reid Wiseman (CDR), Victor Glover (PLT), Christina Koch (MS1), Jeremy Hansen (MS2)
// Launch: April 1 2026, LC-39B, KSC  |  Duration: ~10 days  |  Closest approach: ~8 900 km
const LAUNCH_DATE = new Date("2026-04-01T18:00:00Z") // Confirmed launch date — update exact T-0 if known

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
const CRAFT_RADIUS = 1.8                            // visual size in scene (intentionally large — craft is tiny IRL but must be visible)

// ── Types ─────────────────────────────────────────────────────────────────────

interface MoonPos   { x: number; y: number; z: number; distKm: number; fallback?: boolean }
interface OrionPos  { x: number | null; y: number | null; z: number | null; distEarth: number; velKms: number; elapsedH: number; source: string; phase?: string }
interface NewsItem  { title: string; description: string; date: string; thumb: string }

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
  const [orionData, setOrionData] = useState<OrionPos | null>(null)
  const [news,      setNews]      = useState<NewsItem[]>([])
  const [phase,     setPhase]     = useState(0)          // index into PHASES
  const [missionT,  setMissionT]  = useState(0)          // hours since launch (negative = pre-launch)
  const [launched,  setLaunched]  = useState(false)
  const [countdown, setCountdown] = useState("")
  const [selected,  setSelected]  = useState<string | null>(null)
  const [distEarth, setDistEarth] = useState<number | null>(null)
  const [distMoon,  setDistMoon]  = useState<number | null>(null)
  const [velKms,    setVelKms]    = useState<number | null>(null)
  const [dataSource,   setDataSource]   = useState("interpolated")
  const [showNews,     setShowNews]     = useState(false)
  const [activePanel,  setActivePanel]  = useState<string | null>(null)

  const togglePanel = (id: string) => setActivePanel(p => p === id ? null : id)

  // ── Fetch moon position ───────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/moon-position")
      .then(r => r.json())
      .then(setMoonData)
      .catch(() => setMoonData({ x: 384400, y: 0, z: 0, distKm: 384400 }))
  }, [])

  // ── Fetch Orion real-time position (polls every 2 min) ───────────────────
  useEffect(() => {
    const load = () => {
      fetch("/api/orion-position")
        .then(r => r.json())
        .then((d: OrionPos) => {
          setOrionData(d)
          setDataSource(d.source)
          setDistEarth(d.distEarth)
          setVelKms(parseFloat(d.velKms.toFixed(2)))
          // Push into sceneRef so the animation loop picks it up immediately
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
    let spherical = { theta: 0.4, phi: 1.1, r: 110 }

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

      // ── Orion spacecraft — built from primitives to resemble the real vehicle ──
      // Orion consists of: Crew Module (cone) + Service Module (cylinder) + 4 solar panels
      craftMesh = new THREE.Group()
      craftMesh.position.copy(kscPos)

      const CR = CRAFT_RADIUS  // base radius reference

      // Crew Module: truncated cone (wider base, narrow top — heat-shield down)
      const cmGeo = new THREE.CylinderGeometry(CR * 0.55, CR, CR * 1.1, 16)
      const cmMat = new THREE.MeshPhongMaterial({ color: 0xd4a843, emissive: 0x443300, shininess: 80 })
      const cmMesh = new THREE.Mesh(cmGeo, cmMat)
      cmMesh.position.y = CR * 0.8
      craftMesh.add(cmMesh)

      // Heat shield: flat dark disc at base of crew module
      const hsGeo = new THREE.CylinderGeometry(CR, CR * 1.02, CR * 0.12, 16)
      const hsMat = new THREE.MeshPhongMaterial({ color: 0x222222, emissive: 0x110000, shininess: 10 })
      const hsMesh = new THREE.Mesh(hsGeo, hsMat)
      hsMesh.position.y = CR * 0.18
      craftMesh.add(hsMesh)

      // Service Module: cylinder below crew module
      const smGeo = new THREE.CylinderGeometry(CR * 0.75, CR * 0.75, CR * 1.4, 16)
      const smMat = new THREE.MeshPhongMaterial({ color: 0x888899, emissive: 0x111122, shininess: 120 })
      const smMesh = new THREE.Mesh(smGeo, smMat)
      smMesh.position.y = -CR * 0.58
      craftMesh.add(smMesh)

      // Service Module engine nozzle
      const nozzleGeo = new THREE.CylinderGeometry(CR * 0.18, CR * 0.3, CR * 0.4, 12)
      const nozzleMat = new THREE.MeshPhongMaterial({ color: 0xaaaaaa, shininess: 160 })
      const nozzleMesh = new THREE.Mesh(nozzleGeo, nozzleMat)
      nozzleMesh.position.y = -CR * 1.5
      craftMesh.add(nozzleMesh)

      // 4 solar panels — two pairs extending left/right and front/back from SM
      const panelMat = new THREE.MeshPhongMaterial({ color: 0x1144cc, emissive: 0x001133, shininess: 200, side: THREE.DoubleSide })
      const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]
      for (const angle of angles) {
        const panelGeo = new THREE.BoxGeometry(CR * 2.8, CR * 0.06, CR * 1.0)
        const panel = new THREE.Mesh(panelGeo, panelMat)
        // Position panels radially outward from SM
        panel.position.set(
          Math.cos(angle) * CR * 2.0,
          -CR * 0.55,
          Math.sin(angle) * CR * 2.0,
        )
        panel.rotation.y = angle
        craftMesh.add(panel)

        // Panel strut
        const strutGeo = new THREE.CylinderGeometry(CR * 0.04, CR * 0.04, CR * 2.0, 6)
        const strut = new THREE.Mesh(strutGeo, new THREE.MeshPhongMaterial({ color: 0xaaaaaa }))
        strut.position.set(
          Math.cos(angle) * CR * 1.0,
          -CR * 0.55,
          Math.sin(angle) * CR * 1.0,
        )
        strut.rotation.z = angle + Math.PI / 2
        strut.rotation.x = Math.PI / 2
        craftMesh.add(strut)
      }

      // Glow point light travelling with craft
      const craftLight = new THREE.PointLight(0xff9922, 10, 30)
      craftMesh.add(craftLight)

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
        sceneRef.current = { trajPts, orionPos: null }
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

        // Rotate craft slowly so solar panels are visible from all angles
        craftMesh.rotation.y += 0.008

        // Move craft: prefer live Orion position from API, fallback to trajectory animation
        const liveOrion = sceneRef.current?.orionPos
        const trajPts2  = sceneRef.current?.trajPts

        // Use real Horizons x/y/z ONLY when source is "horizons" and coordinates are present.
        // Interpolated data omits x/y/z (null) so the trajectory spline is used instead —
        // spline IS aligned to the real Moon position so the craft stays in the correct corridor.
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
          // Trajectory spline: for MET interpolation use distEarth to pick the spline index,
          // for pre-launch loop the full path for preview
          const totalH   = PHASES[PHASES.length - 1].hoursFromL
          const elapsedH = (Date.now() - LAUNCH_DATE.getTime()) / 3_600_000
          let t: number
          if (elapsedH < 0) {
            t = (frame % 600) / 600  // preview loop
          } else if (liveOrion?.distEarth) {
            // Pin to trajectory point whose Earth distance matches MET estimate
            const moonDistKm = moonMesh.position.length() * KM_PER_UNIT
            // Outbound: t in [0, 0.5], return: [0.5, 1]
            const isReturn = elapsedH > 96
            const halfPts  = Math.floor(trajPts2.length / 2)
            if (!isReturn) {
              // Find outbound point closest in Earth distance
              let best = 0, bestDiff = Infinity
              for (let i = 0; i < halfPts; i++) {
                const p = trajPts2[i]
                const d = Math.sqrt(p.x*p.x + p.y*p.y + p.z*p.z) * KM_PER_UNIT
                const diff = Math.abs(d - liveOrion.distEarth)
                if (diff < bestDiff) { bestDiff = diff; best = i }
              }
              t = best / (trajPts2.length - 1)
            } else {
              // Return half
              let best = halfPts, bestDiff = Infinity
              for (let i = halfPts; i < trajPts2.length; i++) {
                const p = trajPts2[i]
                const d = Math.sqrt(p.x*p.x + p.y*p.y + p.z*p.z) * KM_PER_UNIT
                const diff = Math.abs(d - liveOrion.distEarth)
                if (diff < bestDiff) { bestDiff = diff; best = i }
              }
              t = best / (trajPts2.length - 1)
            }
          } else {
            t = Math.min(1, elapsedH / totalH)
          }

          const idx = Math.min(trajPts2.length - 1, Math.floor(t * (trajPts2.length - 1)))
          craftMesh.position.copy(trajPts2[idx])

          const p = craftMesh.position
          setDistEarth(Math.sqrt(p.x*p.x + p.y*p.y + p.z*p.z) * KM_PER_UNIT)
          setDistMoon(p.distanceTo(moonMesh.position) * KM_PER_UNIT)
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

  // ── Icon button helper ─────────────────────────────────────────────────────
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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full" style={{ height: "calc(100vh - 64px)", background: "#000008" }}>

      {/* Three.js canvas mount */}
      <div ref={mountRef} className="absolute inset-0" />

      {/* ── Compact top bar ────────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-3 py-2"
        style={{ background: "rgba(0,0,10,0.80)", borderBottom: "1px solid rgba(255,150,50,0.25)" }}>
        <div className="flex items-center gap-2">
          <span className="text-xl">🚀</span>
          <div>
            <div className="text-xs font-bold tracking-widest text-orange-300">ARTEMIS II</div>
            <div className="text-xs text-gray-500 hidden sm:block">NASA Lunar Flyby · Orion MPCV</div>
          </div>
        </div>

        {/* Mission status — compact */}
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
            <div className="text-xs text-gray-400 tabular-nums">MET {Math.floor(missionT)}h {Math.floor((missionT % 1) * 60)}m</div>
          </div>
        )}

        <Link href="/uc3/details"
          className="text-xs px-2 py-1 rounded border border-gray-700 text-gray-400 hover:bg-gray-800 transition-colors hidden sm:block">
          Details →
        </Link>
      </div>

      {/* ── Data source pill (only when live) ─────────────────────────────── */}
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

      {/* ── LEFT icon toolbar ─────────────────────────────────────────────── */}
      <div className="absolute left-3 z-20 flex flex-col gap-2" style={{ top: launched ? 72 : 56 }}>
        {iconBtn("phase",     "🎯", "Mission Phase",   "#f97316")}
        {iconBtn("telemetry", "📡", "Orion Telemetry", "#3b82f6")}
        {iconBtn("crew",      "👨‍🚀", "Crew",            "#22c55e")}
      </div>

      {/* ── RIGHT icon toolbar ────────────────────────────────────────────── */}
      <div className="absolute right-3 z-20 flex flex-col gap-2" style={{ top: launched ? 72 : 56 }}>
        {iconBtn("timeline", "📅", "Mission Timeline", "#a855f7")}
        {iconBtn("facts",    "ℹ️",  "Mission Facts",    "#eab308")}
        {iconBtn("news",     "📰", "NASA News",        "#60a5fa")}
      </div>

      {/* ── PANELS — shown only when their icon is active ─────────────────── */}

      {/* Mission Phase panel */}
      {activePanel === "phase" && (
        <div className="absolute left-14 z-10 w-64 rounded-xl p-3"
          style={{ top: launched ? 72 : 56, background: "rgba(0,5,20,0.92)", border: "1px solid rgba(255,140,0,0.35)", backdropFilter: "blur(14px)" }}>
          <div className="flex justify-between items-center mb-2">
            <div className="text-xs text-orange-400 font-semibold tracking-widest">MISSION PHASE</div>
            <button onClick={() => setActivePanel(null)} className="text-gray-500 hover:text-white text-sm leading-none">✕</button>
          </div>
          <div className="text-sm font-bold text-white mb-1">{currentPhase.label}</div>
          <div className="text-xs text-gray-400 leading-snug mb-2">{currentPhase.desc}</div>
          <div className="flex gap-1 flex-wrap">
            {PHASES.map((p, i) => (
              <div key={i} className="w-2 h-2 rounded-full transition-colors"
                style={{ background: i <= phase ? "#f97316" : "#334" }} title={p.label} />
            ))}
          </div>
        </div>
      )}

      {/* Telemetry panel */}
      {activePanel === "telemetry" && (
        <div className="absolute left-14 z-10 w-64 rounded-xl p-3"
          style={{ top: launched ? 118 : 102, background: "rgba(0,5,20,0.92)", border: "1px solid rgba(50,150,255,0.35)", backdropFilter: "blur(14px)" }}>
          <div className="flex justify-between items-center mb-2">
            <div className="text-xs text-blue-400 font-semibold tracking-widest">ORION TELEMETRY</div>
            <button onClick={() => setActivePanel(null)} className="text-gray-500 hover:text-white text-sm leading-none">✕</button>
          </div>
          <div className="space-y-2">
            {[
              { label: "Dist. Earth", val: fmt(distEarth, "km") },
              { label: "Dist. Moon",  val: fmt(distMoon, "km") },
              { label: "Velocity",    val: velKms != null ? `${velKms} km/s` : "—" },
              { label: "Moon–Earth",  val: moonData ? `${Math.round(moonData.distKm).toLocaleString()} km` : "—" },
            ].map(m => (
              <div key={m.label} className="flex justify-between items-center text-xs rounded px-2 py-1.5"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <span className="text-gray-400">{m.label}</span>
                <span className="text-white font-mono tabular-nums">{m.val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Crew panel */}
      {activePanel === "crew" && (
        <div className="absolute left-14 z-10 w-64 rounded-xl p-3"
          style={{ top: launched ? 164 : 148, background: "rgba(0,5,20,0.92)", border: "1px solid rgba(100,200,100,0.3)", backdropFilter: "blur(14px)" }}>
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
                <div className="flex items-center gap-1.5">
                  <span className="text-base leading-none">{c.flag}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white truncate">{c.name}</div>
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

      {/* Mission Timeline panel */}
      {activePanel === "timeline" && (
        <div className="absolute right-14 z-10 w-60 rounded-xl p-3"
          style={{ top: launched ? 72 : 56, background: "rgba(0,5,20,0.92)", border: "1px solid rgba(180,100,255,0.35)", backdropFilter: "blur(14px)" }}>
          <div className="flex justify-between items-center mb-2">
            <div className="text-xs text-purple-400 font-semibold tracking-widest">TIMELINE</div>
            <button onClick={() => setActivePanel(null)} className="text-gray-500 hover:text-white text-sm leading-none">✕</button>
          </div>
          <div className="space-y-2">
            {PHASES.map((p, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="mt-0.5 w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: i < phase ? "#86efac" : i === phase ? "#fb923c" : "#334" }} />
                <div>
                  <div className="text-xs font-semibold" style={{ color: i === phase ? "#fb923c" : i < phase ? "#86efac" : "#666" }}>
                    {p.label}
                  </div>
                  <div className="text-xs text-gray-600">L+{p.hoursFromL < 1 ? `${p.hoursFromL * 60}min` : `${p.hoursFromL}h`}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mission Facts panel */}
      {activePanel === "facts" && (
        <div className="absolute right-14 z-10 w-60 rounded-xl p-3"
          style={{ top: launched ? 118 : 102, background: "rgba(0,5,20,0.92)", border: "1px solid rgba(255,200,50,0.3)", backdropFilter: "blur(14px)" }}>
          <div className="flex justify-between items-center mb-2">
            <div className="text-xs text-yellow-400 font-semibold tracking-widest">MISSION FACTS</div>
            <button onClick={() => setActivePanel(null)} className="text-gray-500 hover:text-white text-sm leading-none">✕</button>
          </div>
          <div className="space-y-1.5 text-xs">
            {[
              ["Vehicle",       "SLS Block 1"],
              ["Spacecraft",    "Orion MPCV"],
              ["Launch pad",    "LC-39B, KSC"],
              ["Duration",      "~10 days"],
              ["Closest Moon",  "~8,900 km"],
              ["Trajectory",    "Free-return"],
              ["Splashdown",    "Pacific Ocean"],
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
          style={{ top: launched ? 164 : 148, maxHeight: "calc(100vh - 220px)", background: "rgba(0,5,25,0.96)", border: "1px solid rgba(100,150,255,0.25)", backdropFilter: "blur(14px)" }}>
          <div className="p-3 flex justify-between items-center" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="text-xs font-bold text-blue-300 tracking-wide">NASA ARTEMIS II — LATEST</div>
            <button onClick={() => setActivePanel(null)} className="text-gray-500 hover:text-white text-sm leading-none">✕</button>
          </div>
          <div className="overflow-y-auto p-3 space-y-3" style={{ maxHeight: "calc(100vh - 280px)" }}>
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

      {/* ── Bottom legend bar ─────────────────────────────────────────────── */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-gray-400 px-4 py-2 rounded-lg"
        style={{ background: "rgba(0,5,20,0.75)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-400 opacity-70 inline-block" /> Earth</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-gray-400 opacity-70 inline-block" /> Moon</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400 opacity-70 inline-block" /> Orion</span>
        <span className="flex items-center gap-1"><span className="inline-block h-0.5 bg-orange-400 opacity-70" style={{ width: 12 }} /> Trajectory</span>
        <span className="text-gray-600 hidden sm:inline">|</span>
        <span className="hidden sm:inline">Drag · Scroll to zoom</span>
      </div>

      {/* ── Attribution ───────────────────────────────────────────────────── */}
      <div className="absolute bottom-3 right-3 z-10 text-xs text-gray-700 hidden sm:block">
        {dataSource === "horizons" ? "JPL Horizons -1032" : "MET interp."} · Moon: JPL · News: NASA
      </div>
    </div>
  )
}

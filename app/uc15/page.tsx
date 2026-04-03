"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import Link from "next/link"

// ── Types ─────────────────────────────────────────────────────────────────────

interface TLEEntry {
  name: string
  noradId: string
  inclination: number
  tle1: string
  tle2: string
}

interface ParsedSat {
  name: string
  noradId: string
  inclination: number
  shell: ShellKey
  generation: GenKey
  satrec: any
}

interface SatPoint {
  id: string
  name: string
  noradId: string
  lat: number
  lng: number
  alt: number     // km above surface
  vel: number     // km/s
  inclination: number
  period: number  // minutes
  shell: ShellKey
  generation: GenKey
  color: string
  satrec: any
}

interface CountryFeature {
  type: "Feature"
  id: string
  properties: { name: string }
  geometry: any
}

// ── Shell / Generation definitions ───────────────────────────────────────────

type ShellKey = "53.0" | "53.2" | "70" | "97.6" | "43" | "other"
type GenKey   = "gen1" | "gen1v5" | "gen2mini" | "gen2"

const SHELLS: Record<ShellKey, { label: string; color: string; desc: string }> = {
  "53.0":  { label: "Shell 1 · 53°",   color: "#33ccdd", desc: "Original 550 km operational shell" },
  "53.2":  { label: "Shell 2 · 53.2°", color: "#5588ff", desc: "Second 540 km shell" },
  "70":    { label: "Shell 3 · 70°",   color: "#ff8844", desc: "Polar high-latitude shell" },
  "97.6":  { label: "Shell 4 · 97.6°", color: "#cc44ff", desc: "Sun-synchronous orbit" },
  "43":    { label: "Shell 5 · 43°",   color: "#44ff88", desc: "Gen 2 mid-inclination shell" },
  "other": { label: "Other",            color: "#888888", desc: "Miscellaneous / transitional" },
}

const GENERATIONS: Record<GenKey, { label: string; noradMax: number }> = {
  "gen1":    { label: "Gen 1 (v1.0)",    noradMax: 49135 },
  "gen1v5":  { label: "Gen 1.5 (v1.5)",  noradMax: 55742 },
  "gen2mini":{ label: "Gen 2 Mini",       noradMax: 999999 },
  "gen2":    { label: "Gen 2",            noradMax: 999999 },
}

// ── Parse 3-line TLE text block ───────────────────────────────────────────────
// TLE format: name / TLE1 (starts "1 ") / TLE2 (starts "2 ") per satellite
function parseTLEText(text: string): TLEEntry[] {
  const lines = text.split("\n").map(l => l.trimEnd()).filter(l => l.trim().length > 0)
  const entries: TLEEntry[] = []
  let i = 0
  while (i < lines.length) {
    const l0 = lines[i]
    const l1 = lines[i + 1]
    const l2 = lines[i + 2]
    if (l1?.startsWith("1 ") && l2?.startsWith("2 ")) {
      // NORAD ID: chars 2-6 of TLE line 1
      const noradId = l1.slice(2, 7).trim()
      // Inclination (degrees): chars 8-16 of TLE line 2
      const inclination = parseFloat(l2.slice(8, 16))
      entries.push({
        name: l0.trim(),
        noradId,
        inclination: isFinite(inclination) ? inclination : 53,
        tle1: l1,
        tle2: l2,
      })
      i += 3
    } else {
      i++
    }
  }
  return entries
}

// ── Helper: classify satellite ────────────────────────────────────────────────

function getShell(inc: number): ShellKey {
  if (inc >= 52.0 && inc <= 53.15) return "53.0"
  if (inc > 53.15 && inc <= 54.0)  return "53.2"
  if (inc >= 68.0 && inc <= 72.0)  return "70"
  if (inc >= 96.0 && inc <= 99.0)  return "97.6"
  if (inc >= 41.0 && inc <= 45.0)  return "43"
  return "other"
}

function getGeneration(noradId: number): GenKey {
  if (noradId <= 49135) return "gen1"
  if (noradId <= 55742) return "gen1v5"
  return "gen2mini"
}

// Compute satellite position using SGP4 (satellite.js)
function propagateSat(satrec: any, satLib: any, now: Date): { lat: number; lng: number; alt: number; vel: number } | null {
  try {
    const pv = satLib.propagate(satrec, now)
    // satellite.js v5: position is `false` on decay; v7 returns null
    if (!pv || typeof pv !== "object") return null
    const posEci = pv.position
    if (!posEci || typeof posEci !== "object") return null
    const gmst = satLib.gstime(now)
    const geo = satLib.eciToGeodetic(posEci, gmst)
    const lat = satLib.degreesLat(geo.latitude)
    const lng = satLib.degreesLong(geo.longitude)
    const alt = geo.height // km
    if (!isFinite(lat) || !isFinite(lng) || !isFinite(alt)) return null
    if (alt < 100 || alt > 2000) return null // decayed or invalid
    const v = pv.velocity as any
    const vel = v && typeof v === "object" ? Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2) : 7.5
    return { lat, lng, alt, vel }
  } catch {
    return null
  }
}


// ── Country geometry helpers ──────────────────────────────────────────────

function featureCentroid(geometry: any): { lat: number; lng: number } {
  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180
  function walk(c: any) {
    if (!Array.isArray(c)) return
    if (typeof c[0] === "number") {
      const [lng, lat] = c as [number, number]
      if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat
      if (lng < minLng) minLng = lng; if (lng > maxLng) maxLng = lng
    } else for (const sub of c) walk(sub)
  }
  walk(geometry?.coordinates)
  return { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 }
}

function featureBbox(geometry: any) {
  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180
  function walk(c: any) {
    if (!Array.isArray(c)) return
    if (typeof c[0] === "number") {
      const [lng, lat] = c as [number, number]
      if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat
      if (lng < minLng) minLng = lng; if (lng > maxLng) maxLng = lng
    } else for (const sub of c) walk(sub)
  }
  walk(geometry?.coordinates)
  return { minLat, maxLat, minLng, maxLng }
}

// ── Three.js satellite particle helpers ──────────────────────────────────────

// Draw a 2D satellite icon on a canvas — body + solar wings + glow
function makeSatTexture(THREE: any): any {
  const sz = 64
  const cv = document.createElement("canvas")
  cv.width = cv.height = sz
  const ctx = cv.getContext("2d")!
  const cx = sz / 2
  // outer glow
  const grd = ctx.createRadialGradient(cx, cx, 0, cx, cx, sz / 2)
  grd.addColorStop(0,   "rgba(255,255,255,0.9)")
  grd.addColorStop(0.25,"rgba(255,255,255,0.6)")
  grd.addColorStop(0.55,"rgba(255,255,255,0.15)")
  grd.addColorStop(1,   "rgba(255,255,255,0)")
  ctx.fillStyle = grd
  ctx.fillRect(0, 0, sz, sz)
  // satellite body
  ctx.fillStyle = "rgba(255,255,255,1)"
  ctx.fillRect(cx - 3, cx - 3, 6, 6)
  // solar panels (left & right wings)
  ctx.fillStyle = "rgba(255,255,255,0.85)"
  ctx.fillRect(cx - 16, cx - 1.5, 11, 3)  // left
  ctx.fillRect(cx + 5,  cx - 1.5, 11, 3)  // right
  // antenna stub (top)
  ctx.fillRect(cx - 0.5, cx - 8, 1, 5)
  return new THREE.CanvasTexture(cv)
}

// Globe radius in Three.js space (three-globe constant)
const GLOBE_R = 100

function latLngAltToXYZ(lat: number, lng: number, altKm: number): [number, number, number] {
  const r   = GLOBE_R * (1 + altKm / 6371)
  const phi = (90 - lat)  * (Math.PI / 180)
  const theta = (90 - lng) * (Math.PI / 180)
  return [
     r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta),
  ]
}

function updateSatBuffer(data: SatPoint[], THREE: any, points: any) {
  if (!points) return
  const n = data.length
  const pos  = new Float32Array(n * 3)
  const cols = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const d = data[i]
    const [x, y, z] = latLngAltToXYZ(d.lat, d.lng, d.alt)
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z
    const c = new THREE.Color(d.color)
    cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b
  }
  const geo = points.geometry
  geo.setAttribute("position", new THREE.BufferAttribute(pos,  3))
  geo.setAttribute("color",    new THREE.BufferAttribute(cols, 3))
  geo.setDrawRange(0, n)
  geo.computeBoundingSphere()
}

// ── Main component ────────────────────────────────────────────────────────────

type StatusT = "loading" | "propagating" | "ready" | "error"

export default function UC15Page() {
  const globeRef    = useRef<HTMLDivElement>(null)
  const globeInst   = useRef<any>(null)
  const satLib      = useRef<any>(null)
  const parsedSats  = useRef<ParsedSat[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const filteredRef = useRef<SatPoint[]>([])
  const satPointsRef= useRef<any>(null)   // THREE.Points particle system
  const orbitLineRef= useRef<any>(null)   // THREE.Line for orbit track
  const threeRef    = useRef<any>(null)   // THREE module
  const blinkRef    = useRef<number>(0)   // blink animation frame

  const [status,     setStatus]     = useState<StatusT>("loading")
  const [errorMsg,   setErrorMsg]   = useState("")
  const [points,     setPoints]     = useState<SatPoint[]>([])
  const [selected,   setSelected]   = useState<SatPoint | null>(null)
  const [isSpinning, setIsSpinning] = useState(true)
  const [shellFilter,setShellFilter]= useState<ShellKey | "all">("all")
  const [genFilter,  setGenFilter]  = useState<GenKey | "all">("all")
  const [showTrack,  setShowTrack]  = useState(true)
  const [tleEpoch,   setTleEpoch]   = useState("")
  const [liveTime,   setLiveTime]   = useState(new Date())
  const [loadPct,    setLoadPct]    = useState(0)
  const [countries,       setCountries]       = useState<CountryFeature[]>([])
  const [hoveredCountry,  setHoveredCountry]  = useState<CountryFeature | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<CountryFeature | null>(null)
  // ref to hold latest propagated points for country stats (doesn't need to trigger re-render)
  const allPointsRef = useRef<Array<{ lat: number; lng: number; [key: string]: any }>>([])

  // ── Live clock ───────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setLiveTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // ── Filtered set ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return points.filter(p => {
      if (shellFilter !== "all" && p.shell !== shellFilter) return false
      if (genFilter   !== "all" && p.generation !== genFilter) return false
      return true
    })
  }, [points, shellFilter, genFilter])

  // ── Propagate all satellite positions ────────────────────────────────────
  const propagateAll = useCallback(() => {
    if (!satLib.current || parsedSats.current.length === 0) return
    const now = new Date()
    const pts: SatPoint[] = []
    for (const s of parsedSats.current) {
      const pos = propagateSat(s.satrec, satLib.current, now)
      if (!pos) continue
      const period = 1440 / s.satrec.no   // minutes (no = mean motion rad/min, 1440 min/day)
      pts.push({
        id:          s.noradId,
        name:        s.name,
        noradId:     s.noradId,
        lat:         pos.lat,
        lng:         pos.lng,
        alt:         pos.alt,
        vel:         pos.vel,
        inclination: s.inclination,
        period,
        shell:       s.shell,
        generation:  s.generation,
        color:       SHELLS[s.shell].color,
        satrec:      s.satrec,
      })
    }
    allPointsRef.current = pts  // store for country filtering
    setPoints(pts)
    setLiveTime(now)
  }, [])

  // ── Fetch TLE + init ─────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        // 1. Load satellite.js
        setLoadPct(10)
        const sLib = await import("satellite.js")
        if (cancelled) return
        satLib.current = sLib
        setLoadPct(25)

        // 2. Fetch TLE text from our API proxy (+ GeoJSON in parallel)
        const [res, geoRes] = await Promise.all([
          fetch("/api/starlink-tle"),
          fetch("/countries-110m.geojson"),
        ])
        if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`)
        const tleText = await res.text()
        if (geoRes.ok) {
          const geo = await geoRes.json()
          setCountries(geo.features as CountryFeature[])
        }
        if (cancelled) return
        setLoadPct(55)
        if (!tleText || tleText.length < 100) {
          throw new Error("Empty TLE response from server")
        }

        // 3. Parse TLE text → satrecs
        setStatus("propagating")
        const entries = parseTLEText(tleText)
        if (entries.length === 0) throw new Error("No valid TLE entries parsed")
        setTleEpoch(new Date().toISOString().split("T")[0])
        const parsed: ParsedSat[] = []
        for (let i = 0; i < entries.length; i++) {
          const rec = entries[i]
          try {
            const satrec = sLib.twoline2satrec(rec.tle1, rec.tle2)
            if (!satrec || satrec.error !== 0) continue
            const shell = getShell(rec.inclination)
            const gen   = getGeneration(Number(rec.noradId))
            parsed.push({
              name:        rec.name,
              noradId:     rec.noradId,
              inclination: rec.inclination,
              shell,
              generation:  gen,
              satrec,
            })
          } catch { /* skip bad TLE */ }
          if (i % 500 === 0) setLoadPct(55 + Math.round((i / entries.length) * 30))
        }
        parsedSats.current = parsed
        setLoadPct(90)

        // 4. First propagation
        propagateAll()
        if (cancelled) return
        setStatus("ready")
        setLoadPct(100)
      } catch (err: any) {
        if (!cancelled) {
          setErrorMsg(err?.message ?? "Unknown error")
          setStatus("error")
        }
      }
    }

    init()
    return () => { cancelled = true }
  }, [propagateAll])

  // ── Recurring propagation (every 5s) ─────────────────────────────────────
  useEffect(() => {
    if (status !== "ready") return
    intervalRef.current = setInterval(propagateAll, 5000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [status, propagateAll])

  // ── Country polygon helpers ───────────────────────────────────────────────
  function applyCountries(
    globe: any,
    features: CountryFeature[],
    hovered: CountryFeature | null,
    selected: CountryFeature | null,
  ) {
    if (!features.length) return
    globe
      .polygonsData(features)
      .polygonCapColor((d: any) => {
        if (selected?.properties.name === d.properties.name) return "rgba(255,255,255,0.07)"
        if (hovered?.properties.name === d.properties.name)  return "rgba(255,255,255,0.04)"
        return "rgba(0,0,0,0)"
      })
      .polygonSideColor(() => "rgba(0,0,0,0)")
      .polygonStrokeColor((d: any) => {
        if (selected?.properties.name === d.properties.name) return "rgba(255,255,255,0.90)"
        if (hovered?.properties.name === d.properties.name)  return "rgba(255,255,255,0.60)"
        return "rgba(255,255,255,0.18)"
      })
      .polygonAltitude(0.004)
      .onPolygonHover((d: any) => setHoveredCountry(d as CountryFeature | null))
      .onPolygonClick((d: any) => {
        const f = d as CountryFeature
        setSelectedCountry(prev => prev?.properties.name === f.properties.name ? null : f)
        const { lat, lng } = featureCentroid(f.geometry)
        if (globeInst.current) globeInst.current.pointOfView({ lat, lng, altitude: 2.0 }, 800)
        setIsSpinning(false)
      })
  }

  // ── Sync country polygons when hover/select/countries change ─────────────
  useEffect(() => {
    if (!globeInst.current || !countries.length) return
    applyCountries(globeInst.current, countries, hoveredCountry, selectedCountry)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoveredCountry, selectedCountry, countries])

  // ── Init globe.gl + Three.js satellite particle system ────────────────────
  useEffect(() => {
    if (status !== "ready" || !globeRef.current || globeInst.current) return
    let globe: any
    let animId: number

    Promise.all([import("globe.gl"), import("three")]).then(([globeMod, THREE]) => {
      if (!globeRef.current) return
      threeRef.current = THREE

      const GlobeGL = (globeMod.default ?? globeMod) as any
      globe = new GlobeGL()

      globe(globeRef.current)
        .width(globeRef.current.clientWidth)
        .height(globeRef.current.clientHeight)
        .globeImageUrl("//unpkg.com/three-globe/example/img/earth-night.jpg")
        .bumpImageUrl("//unpkg.com/three-globe/example/img/earth-topology.png")
        .backgroundImageUrl("//unpkg.com/three-globe/example/img/night-sky.png")
        .atmosphereColor("#33ccdd")
        .atmosphereAltitude(0.15)
        .pointOfView({ lat: 20, lng: 0, altitude: 2.0 })
        // No globe.gl paths — orbit track drawn directly in Three.js scene

      const ctrl = globe.controls()
      ctrl.autoRotate = true
      ctrl.autoRotateSpeed = 0.3
      ctrl.enableDamping = true
      ctrl.dampingFactor = 0.1

      globeInst.current = globe
      applyCountries(globe, countries, null, null)

      // ── Build satellite particle system ────────────────────────────────────
      const satTexture = makeSatTexture(THREE)
      const geo = new THREE.BufferGeometry()
      const mat = new THREE.PointsMaterial({
        size: 5,
        map: satTexture,
        vertexColors: true,
        transparent: true,
        alphaTest: 0.01,
        sizeAttenuation: false,
        depthWrite: false,
      })
      const satPoints = new THREE.Points(geo, mat)
      satPoints.renderOrder = 999
      globe.scene().add(satPoints)
      satPointsRef.current = satPoints

      // Populate with current data
      updateSatBuffer(filteredRef.current, THREE, satPoints)

      // ── Blinking animation — pulse the opacity ─────────────────────────────
      let t = 0
      const blink = () => {
        animId = requestAnimationFrame(blink)
        t += 0.05
        mat.opacity = 0.65 + 0.35 * Math.abs(Math.sin(t))
        mat.needsUpdate = true
      }
      animId = requestAnimationFrame(blink)
      blinkRef.current = animId

      // ── Click → raycast into particle system ──────────────────────────────
      const canvas = globeRef.current!
      const onCanvasClick = (e: MouseEvent) => {
        if (!satPointsRef.current) return
        const rect = canvas.getBoundingClientRect()
        const mouse = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width)  *  2 - 1,
          -((e.clientY - rect.top)  / rect.height) *  2 + 1
        )
        const raycaster = new THREE.Raycaster()
        raycaster.params.Points = { threshold: 2.5 }
        raycaster.setFromCamera(mouse, globe.camera())
        const hits = raycaster.intersectObject(satPointsRef.current)
        if (hits.length > 0 && hits[0].index != null) {
          const sat = filteredRef.current[hits[0].index]
          if (sat) {
            setSelected(sat)
            setIsSpinning(false)
            globe.pointOfView({ lat: sat.lat, lng: sat.lng, altitude: 1.8 }, 700)
          }
        }
      }
      canvas.addEventListener("click", onCanvasClick)
      // store cleanup ref on element
      ;(canvas as any)._satClick = onCanvasClick
    })

    return () => {
      cancelAnimationFrame(animId)
      const canvas = globeRef.current
      if (canvas && (canvas as any)._satClick) {
        canvas.removeEventListener("click", (canvas as any)._satClick)
      }
      if (satPointsRef.current) {
        satPointsRef.current.geometry?.dispose?.()
        satPointsRef.current.material?.dispose?.()
        satPointsRef.current = null
      }
      if (orbitLineRef.current) {
        globeInst.current?.scene?.().remove(orbitLineRef.current)
        orbitLineRef.current.traverse?.((c: any) => {
          c.geometry?.dispose?.(); c.material?.dispose?.()
        })
        orbitLineRef.current = null
      }
      globe?.controls()?.dispose?.()
      globeInst.current = null
    }
  }, [status])

  // ── Keep filteredRef current & update Three.js buffer ─────────────────────
  useEffect(() => {
    filteredRef.current = filtered
    if (satPointsRef.current && threeRef.current) {
      updateSatBuffer(filtered, threeRef.current, satPointsRef.current)
    }
  }, [filtered])

  // ── Draw orbit track as Three.js Line directly in the scene ──────────────
  useEffect(() => {
    const THREE = threeRef.current
    const globe  = globeInst.current
    if (!THREE || !globe) return

    // Clear previous orbit line
    if (orbitLineRef.current) {
      globe.scene().remove(orbitLineRef.current)
      orbitLineRef.current.traverse?.((c: any) => {
        c.geometry?.dispose?.(); c.material?.dispose?.()
      })
      orbitLineRef.current = null
    }

    if (!selected || !showTrack || !satLib.current) return

    // Build 3D XYZ positions for one full orbit (~100 min, 300 points)
    const positions: number[] = []
    const now = new Date()
    for (let i = 0; i <= 300; i++) {
      const t   = new Date(now.getTime() + i * 20_000) // every 20 s
      const pos = propagateSat(selected.satrec, satLib.current, t)
      if (!pos) continue
      const [x, y, z] = latLngAltToXYZ(pos.lat, pos.lng, pos.alt)
      positions.push(x, y, z)
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))

    // Two overlapping lines: bright core + wide glow
    const core = new THREE.Line(geo,
      new THREE.LineBasicMaterial({ color: selected.color, transparent: true, opacity: 1, depthWrite: false })
    )
    core.renderOrder = 998

    // Glow layer — slightly brighter/white tinted
    const glow = new THREE.Line(geo,
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, depthWrite: false })
    )
    glow.renderOrder = 997

    const group = new THREE.Group()
    group.add(glow)
    group.add(core)
    globe.scene().add(group)
    orbitLineRef.current = group
  }, [selected, showTrack])

  // ── Spin toggle ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!globeInst.current) return
    globeInst.current.controls().autoRotate = isSpinning
  }, [isSpinning])

  // ── Shell / gen filter change → deselect ─────────────────────────────────
  const handleShellFilter = (key: ShellKey | "all") => {
    setShellFilter(key)
    setSelected(null)
  }
  const handleGenFilter = (key: GenKey | "all") => {
    setGenFilter(key)
    setSelected(null)
  }

  // ── Shell count breakdown ─────────────────────────────────────────────────
  const shellCounts = useMemo(() => {
    const counts: Partial<Record<ShellKey | "all", number>> = { all: points.length }
    for (const p of points) counts[p.shell] = (counts[p.shell] ?? 0) + 1
    return counts
  }, [points])

  const genCounts = useMemo(() => {
    const counts: Partial<Record<GenKey | "all", number>> = { all: points.length }
    for (const p of points) counts[p.generation] = (counts[p.generation] ?? 0) + 1
    return counts
  }, [points])

  const countryStats = useMemo(() => {
    if (!selectedCountry) return null
    const name = selectedCountry.properties.name
    const bbox = featureBbox(selectedCountry.geometry)
    const overhead = allPointsRef.current.filter((p: any) =>
      p.lat >= bbox.minLat && p.lat <= bbox.maxLat &&
      p.lng >= bbox.minLng && p.lng <= bbox.maxLng
    )
    const byShell: Record<string, number> = {}
    for (const p of overhead as any[]) {
      byShell[p.shell] = (byShell[p.shell] ?? 0) + 1
    }
    return { name, count: overhead.length, byShell }
  }, [selectedCountry])

  const fmtTime = (d: Date) =>
    d.toUTCString().replace("GMT", "UTC").slice(5, 25)

  // ── Loading / error screens ───────────────────────────────────────────────
  if (status === "loading" || status === "propagating") {
    return (
      <div className="flex flex-col items-center justify-center" style={{ minHeight: "calc(100vh - 64px)", background: "var(--bg)" }}>
        <div className="text-center max-w-sm">
          <div className="mb-6 relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
              style={{ borderTopColor: "var(--accent)", borderRightColor: "var(--accent)" }} />
            <div className="absolute inset-3 rounded-full" style={{ background: "var(--accent-dim)" }}>
              <span className="absolute inset-0 flex items-center justify-center text-xl">🛰️</span>
            </div>
          </div>
          <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--text)" }}>
            {status === "propagating" ? "Computing orbital positions…" : "Fetching live TLE data…"}
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
            {status === "propagating"
              ? "Running SGP4 propagation on all Starlink satellites"
              : "Loading TLE data from CelesTrak · NORAD catalogue"}
          </p>
          <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${loadPct}%`, background: "var(--accent)" }} />
          </div>
          <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>{loadPct}%</p>
        </div>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center gap-4" style={{ minHeight: "calc(100vh - 64px)", background: "var(--bg)" }}>
        <span className="text-4xl">⚠️</span>
        <p className="text-lg font-semibold" style={{ color: "var(--text)" }}>Failed to load satellite data</p>
        <p className="text-sm" style={{ color: "var(--muted)" }}>{errorMsg}</p>
        <button onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: "var(--accent)", color: "#000" }}>
          Retry
        </button>
      </div>
    )
  }

  // ── Main globe view ───────────────────────────────────────────────────────
  return (
    <div className="relative" style={{ minHeight: "calc(100vh - 64px)", background: "#000" }}>

      {/* ── Globe canvas ───────────────────────────────────────────────── */}
      <div ref={globeRef} className="absolute inset-0" />

      {/* ── Top bar — stats ───────────────────────────────────────────── */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-4 pointer-events-none">
        {/* Left: title + stats */}
        <div className="pointer-events-auto">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-lg font-bold tracking-wide" style={{ color: "var(--text)" }}>
              🛰️ Starlinks Spacemap
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ background: "rgba(51,255,100,0.15)", border: "1px solid rgba(51,255,100,0.4)", color: "#44ff88" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
              LIVE
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Total tracked", value: points.length.toLocaleString() },
              { label: "Displayed", value: filtered.length.toLocaleString() },
              { label: "TLE epoch", value: tleEpoch },
              { label: "UTC", value: fmtTime(liveTime) },
            ].map(s => (
              <div key={s.label} className="px-3 py-1.5 rounded-lg text-xs"
                style={{ background: "rgba(0,0,0,0.7)", border: "1px solid var(--border)", backdropFilter: "blur(8px)" }}>
                <span style={{ color: "var(--muted)" }}>{s.label}·</span>{" "}
                <span className="font-mono font-semibold" style={{ color: "var(--accent)" }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: spin + track controls */}
        <div className="pointer-events-auto flex flex-col gap-2 items-end">
          <button
            onClick={() => setIsSpinning(s => !s)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all"
            style={{
              background: isSpinning ? "var(--accent)" : "rgba(0,0,0,0.7)",
              border: "1px solid var(--accent)",
              color: isSpinning ? "#000" : "var(--accent)",
            }}
            title={isSpinning ? "Stop rotation" : "Start rotation"}
          >
            {isSpinning ? "⏸" : "▶"}
          </button>
          <button
            onClick={() => setShowTrack(t => !t)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background: showTrack ? "rgba(51,204,221,0.2)" : "rgba(0,0,0,0.6)",
              border: `1px solid ${showTrack ? "var(--accent)" : "var(--border)"}`,
              color: showTrack ? "var(--accent)" : "var(--muted)",
            }}
            title="Toggle ground track"
          >
            🛤 Track
          </button>
          <Link href="/uc15/details"
            className="px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: "rgba(0,0,0,0.6)", border: "1px solid var(--border)", color: "var(--muted)" }}>
            Architecture →
          </Link>
        </div>
      </div>

      {/* ── Shell filter chips ─────────────────────────────────────────── */}
      <div className="absolute bottom-24 left-0 right-0 flex justify-center px-4 pointer-events-none">
        <div className="pointer-events-auto flex flex-wrap gap-1.5 justify-center">
          {/* Shell filters */}
          <button
            onClick={() => handleShellFilter("all")}
            className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
            style={{
              background: shellFilter === "all" ? "var(--accent)" : "rgba(0,0,0,0.7)",
              border: "1px solid var(--accent)",
              color: shellFilter === "all" ? "#000" : "var(--accent)",
            }}>
            All shells ({shellCounts.all?.toLocaleString()})
          </button>
          {(Object.keys(SHELLS) as ShellKey[]).filter(k => k !== "other").map(key => (
            <button key={key}
              onClick={() => handleShellFilter(key)}
              className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
              style={{
                background: shellFilter === key ? SHELLS[key].color + "33" : "rgba(0,0,0,0.7)",
                border: `1px solid ${SHELLS[key].color}`,
                color: SHELLS[key].color,
              }}>
              {SHELLS[key].label.split("·")[1]?.trim()} ({shellCounts[key]?.toLocaleString() ?? 0})
            </button>
          ))}
        </div>
      </div>

      {/* ── Generation filter ──────────────────────────────────────────── */}
      <div className="absolute bottom-12 left-0 right-0 flex justify-center px-4 pointer-events-none">
        <div className="pointer-events-auto flex flex-wrap gap-1.5 justify-center">
          {([
            ["all",      "All Gen"],
            ["gen1",     "Gen 1 (v1.0)"],
            ["gen1v5",   "Gen 1.5 (v1.5)"],
            ["gen2mini", "Gen 2 Mini"],
          ] as const).map(([key, label]) => (
            <button key={key}
              onClick={() => handleGenFilter(key as GenKey | "all")}
              className="px-3 py-1 rounded-full text-xs font-medium transition-all"
              style={{
                background: genFilter === key ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.6)",
                border: `1px solid ${genFilter === key ? "#ffffff88" : "var(--border)"}`,
                color: genFilter === key ? "var(--text)" : "var(--muted)",
              }}>
              {label} {key !== "all" ? `(${genCounts[key as GenKey]?.toLocaleString() ?? 0})` : ""}
            </button>
          ))}
        </div>
      </div>

      {/* ── Legend (bottom-left) ───────────────────────────────────────── */}
      <div className="absolute bottom-4 left-4 pointer-events-none">
        <div className="px-3 py-2 rounded-lg text-xs"
          style={{ background: "rgba(0,0,0,0.75)", border: "1px solid var(--border)", backdropFilter: "blur(8px)" }}>
          <p className="mb-1.5 font-semibold" style={{ color: "var(--muted)" }}>Orbital Shells</p>
          {(Object.entries(SHELLS) as [ShellKey, typeof SHELLS[ShellKey]][]).map(([key, s]) => (
            <div key={key} className="flex items-center gap-1.5 mb-0.5">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
              <span style={{ color: "var(--muted)" }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Selected satellite panel ───────────────────────────────────── */}
      {selected && (
        <div className="absolute top-24 right-4 w-72 rounded-xl overflow-hidden"
          style={{ background: "rgba(8,8,8,0.92)", border: "1px solid var(--border)", backdropFilter: "blur(12px)" }}>
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between"
            style={{ borderBottom: "1px solid var(--border)", background: "rgba(51,204,221,0.06)" }}>
            <div>
              <p className="font-mono font-bold text-sm" style={{ color: "var(--accent)" }}>
                {selected.name}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                NORAD {selected.noradId} · {SHELLS[selected.shell].label}
              </p>
            </div>
            <button onClick={() => setSelected(null)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs"
              style={{ background: "var(--surface-2)", color: "var(--muted)" }}>
              ✕
            </button>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-px" style={{ background: "var(--border)" }}>
            {[
              { label: "Altitude",   value: `${selected.alt.toFixed(1)} km`,         icon: "⬆" },
              { label: "Velocity",   value: `${selected.vel.toFixed(2)} km/s`,        icon: "⚡" },
              { label: "Inclination",value: `${selected.inclination.toFixed(2)}°`,    icon: "📐" },
              { label: "Period",     value: `${selected.period.toFixed(1)} min`,       icon: "🔁" },
              { label: "Latitude",   value: `${selected.lat.toFixed(3)}°`,            icon: "🌐" },
              { label: "Longitude",  value: `${selected.lng.toFixed(3)}°`,            icon: "🌐" },
            ].map(row => (
              <div key={row.label} className="px-3 py-2" style={{ background: "var(--surface)" }}>
                <p className="text-xs mb-0.5" style={{ color: "var(--muted)" }}>{row.icon} {row.label}</p>
                <p className="font-mono text-sm font-semibold" style={{ color: "var(--text)" }}>{row.value}</p>
              </div>
            ))}
          </div>

          {/* Generation */}
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-xs" style={{ color: "var(--muted)" }}>Generation</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>
              {GENERATIONS[selected.generation].label}
            </span>
          </div>

          {/* Shell desc */}
          <div className="px-4 pb-3">
            <div className="rounded-lg px-3 py-2 text-xs" style={{ background: "var(--surface-2)" }}>
              <span style={{ color: selected.color }}>●</span>{" "}
              <span style={{ color: "var(--muted)" }}>{SHELLS[selected.shell].desc}</span>
            </div>
          </div>

          {/* Ground track toggle */}
          <div className="px-4 pb-3">
            <button
              onClick={() => setShowTrack(t => !t)}
              className="w-full py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: showTrack ? "rgba(51,204,221,0.15)" : "var(--surface-2)",
                border: `1px solid ${showTrack ? "var(--accent)" : "var(--border)"}`,
                color: showTrack ? "var(--accent)" : "var(--muted)",
              }}>
              {showTrack ? "🛤 Ground track ON" : "🛤 Ground track OFF"}
            </button>
          </div>
        </div>
      )}

      {/* ── Country stats panel ───────────────────────────────────────── */}
      {selectedCountry && countryStats && !selected && (
        <div className="absolute bottom-4 right-4 pointer-events-auto w-64" style={{ zIndex: 10 }}>
          <div className="rounded-xl p-4" style={{
            background: "rgba(0,0,0,0.88)",
            border: "1px solid rgba(51,204,221,0.3)",
            backdropFilter: "blur(14px)",
          }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--text)" }}>{countryStats.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  {countryStats.count} Starlinks overhead (snapshot)
                </p>
              </div>
              <button onClick={() => setSelectedCountry(null)} className="opacity-40 hover:opacity-80" style={{ color: "var(--muted)" }}>✕</button>
            </div>
            {countryStats.count > 0 ? (
              <div className="flex flex-col gap-1">
                {Object.entries(countryStats.byShell).map(([shell, cnt]) => (
                  <div key={shell} className="flex items-center justify-between px-2 py-1 rounded text-xs"
                    style={{ background: "rgba(51,204,221,0.06)" }}>
                    <span style={{ color: "var(--muted)" }}>{shell}° shell</span>
                    <span className="font-mono" style={{ color: "#33ccdd" }}>{cnt}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs" style={{ color: "var(--muted)" }}>No satellites overhead right now</p>
            )}
          </div>
        </div>
      )}
      {hoveredCountry && !selectedCountry && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none" style={{ zIndex: 10 }}>
          <div className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "rgba(0,0,0,0.75)", border: "1px solid rgba(255,255,255,0.15)", color: "var(--text)", backdropFilter: "blur(8px)" }}>
            {hoveredCountry.properties.name}
          </div>
        </div>
      )}

      {/* ── Click hint ────────────────────────────────────────────────── */}
      {!selected && status === "ready" && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <p className="text-xs text-center animate-pulse"
            style={{ color: "rgba(255,255,255,0.2)" }}>
            Click any satellite to inspect
          </p>
        </div>
      )}
    </div>
  )
}

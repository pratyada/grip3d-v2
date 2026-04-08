"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import Link from "next/link"
import { disposeGlobe } from "@/lib/globe-cleanup"

// ── Types ─────────────────────────────────────────────────────────────────────

interface TLEEntry {
  name: string
  noradId: string
  inclination: number
  tle1: string
  tle2: string
}

interface ParsedDebris {
  name: string
  noradId: string
  inclination: number
  origin: OriginKey
  satrec: any
}

interface DebrisPoint {
  id: string
  name: string
  noradId: string
  lat: number
  lng: number
  alt: number     // km
  vel: number     // km/s
  inclination: number
  period: number  // minutes
  altBand: AltBandKey
  origin: OriginKey
  color: string
  satrec: any
}

interface CountryFeature {
  type: "Feature"
  id: string
  properties: { name: string }
  geometry: any
}

// ── Origin / altitude-band definitions ───────────────────────────────────────

type OriginKey  = "cosmos" | "fengyun" | "iridium" | "other"
type AltBandKey = "leo" | "meo" | "geo" | "deep"

const ORIGINS: Record<
  OriginKey,
  { label: string; color: string; event: string; year: number | null; desc: string }
> = {
  cosmos:  {
    label: "Cosmos 2251",
    color: "#ff3333",
    event: "Cosmos–Iridium Collision",
    year: 2009,
    desc:  "Feb 2009 — first accidental hypervelocity collision in LEO. Largest single debris-generating event in history.",
  },
  fengyun: {
    label: "FenYun-1C",
    color: "#ff8800",
    event: "Chinese ASAT Test",
    year: 2007,
    desc:  "Jan 2007 — deliberate ASAT destruction at 850 km. Produced 3,500+ trackable fragments and millions of smaller pieces.",
  },
  iridium: {
    label: "Iridium 33",
    color: "#ffcc44",
    event: "Cosmos–Iridium Collision",
    year: 2009,
    desc:  "Commercial Iridium satellite destroyed in the same 2009 collision. Debris cloud merging with Cosmos 2251 fragments.",
  },
  other: {
    label: "Other Debris",
    color: "#6688bb",
    event: "Various sources",
    year:  null,
    desc:  "Rocket bodies, mission-related debris, aging spacecraft, and fragmentation events from untracked sources.",
  },
}

const ALT_BANDS: Record<
  AltBandKey,
  { label: string; min: number; max: number; color: string; desc: string }
> = {
  leo:  { label: "LEO",  min: 200,   max: 2000,   color: "#ff4444", desc: "200 – 2,000 km · most concentrated" },
  meo:  { label: "MEO",  min: 2000,  max: 35586,  color: "#ff8800", desc: "2,000 – 35,586 km" },
  geo:  { label: "GEO",  min: 35586, max: 36186,  color: "#ffcc00", desc: "~35,786 km geostationary belt" },
  deep: { label: "Deep", min: 36186, max: 999999, color: "#6688bb", desc: "> 36,186 km graveyard orbits" },
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

// ── Parse 3-line TLE text block ───────────────────────────────────────────────

function parseTLEText(text: string): TLEEntry[] {
  const lines = text.split("\n").map((l) => l.trimEnd()).filter((l) => l.trim().length > 0)
  const entries: TLEEntry[] = []
  let i = 0
  while (i < lines.length) {
    const l0 = lines[i]
    const l1 = lines[i + 1]
    const l2 = lines[i + 2]
    if (l1?.startsWith("1 ") && l2?.startsWith("2 ")) {
      const noradId     = l1.slice(2, 7).trim()
      const inclination = parseFloat(l2.slice(8, 16))
      entries.push({
        name: l0.trim(),
        noradId,
        inclination: isFinite(inclination) ? inclination : 0,
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

// ── Classify helpers ──────────────────────────────────────────────────────────

function getOrigin(name: string): OriginKey {
  const n = name.toUpperCase()
  if (n.includes("FENGYUN") || n.includes("FY1C") || n.includes("FY-1C")) return "fengyun"
  if (n.includes("COSMOS 2251") || n.includes("COSMOS2251"))               return "cosmos"
  if (n.includes("IRIDIUM 33")  || n.includes("IRIDIUM33"))                return "iridium"
  return "other"
}

function getAltBand(altKm: number): AltBandKey {
  if (altKm < 2000)  return "leo"
  if (altKm < 35586) return "meo"
  if (altKm < 36186) return "geo"
  return "deep"
}

// ── SGP4 propagation ──────────────────────────────────────────────────────────

function propagateSat(
  satrec: any,
  satLib: any,
  now: Date
): { lat: number; lng: number; alt: number; vel: number } | null {
  try {
    const pv = satLib.propagate(satrec, now)
    if (!pv || typeof pv !== "object") return null
    const posEci = pv.position
    if (!posEci || typeof posEci !== "object") return null
    const gmst = satLib.gstime(now)
    const geo   = satLib.eciToGeodetic(posEci, gmst)
    const lat   = satLib.degreesLat(geo.latitude)
    const lng   = satLib.degreesLong(geo.longitude)
    const alt   = geo.height
    if (!isFinite(lat) || !isFinite(lng) || !isFinite(alt)) return null
    if (alt < 100 || alt > 100000) return null
    const v   = pv.velocity as any
    const vel = v && typeof v === "object"
      ? Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2)
      : 7.0
    return { lat, lng, alt, vel }
  } catch {
    return null
  }
}

// ── Three.js particle helpers ─────────────────────────────────────────────────

// Debris sprite — small hot-core glow, danger palette
function makeDebrisTexture(THREE: any): any {
  const sz = 32
  const cv  = document.createElement("canvas")
  cv.width  = cv.height = sz
  const ctx = cv.getContext("2d")!
  const cx  = sz / 2
  const grd = ctx.createRadialGradient(cx, cx, 0, cx, cx, sz / 2)
  grd.addColorStop(0,    "rgba(255,255,255,1.0)")
  grd.addColorStop(0.18, "rgba(255,140,60,0.85)")
  grd.addColorStop(0.45, "rgba(255,50,50,0.35)")
  grd.addColorStop(1,    "rgba(200,20,20,0)")
  ctx.fillStyle = grd
  ctx.fillRect(0, 0, sz, sz)
  // sharp centre dot
  ctx.fillStyle = "#ffffff"
  ctx.beginPath()
  ctx.arc(cx, cx, 1.5, 0, Math.PI * 2)
  ctx.fill()
  return new THREE.CanvasTexture(cv)
}

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

// Pixel size per altitude band — LEO is closest & most dangerous so largest
const BAND_PX: Record<AltBandKey, number> = { leo: 6, meo: 4, geo: 3, deep: 2 }

function updateDebrisBuffer(data: DebrisPoint[], THREE: any, points: any) {
  if (!points) return
  const n     = data.length
  const pos   = new Float32Array(n * 3)
  const cols  = new Float32Array(n * 3)
  const sizes = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const d        = data[i]
    const [x, y, z] = latLngAltToXYZ(d.lat, d.lng, d.alt)
    pos[i * 3]     = x
    pos[i * 3 + 1] = y
    pos[i * 3 + 2] = z
    const c        = new THREE.Color(d.color)
    cols[i * 3]     = c.r
    cols[i * 3 + 1] = c.g
    cols[i * 3 + 2] = c.b
    sizes[i]        = BAND_PX[d.altBand]
  }
  const geo = points.geometry
  geo.setAttribute("position", new THREE.BufferAttribute(pos,   3))
  geo.setAttribute("color",    new THREE.BufferAttribute(cols,  3))
  geo.setAttribute("aSize",    new THREE.BufferAttribute(sizes, 1))
  geo.setDrawRange(0, n)
  geo.computeBoundingSphere()
}

// ── Main component ────────────────────────────────────────────────────────────

type StatusT = "loading" | "propagating" | "ready" | "error"

export default function UC16Page() {
  const globeRef       = useRef<HTMLDivElement>(null)
  const globeInst      = useRef<any>(null)
  const satLib         = useRef<any>(null)
  const parsedRef      = useRef<ParsedDebris[]>([])
  const intervalRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const filteredRef    = useRef<DebrisPoint[]>([])
  const debrisPointsRef= useRef<any>(null)
  const orbitLineRef   = useRef<any>(null)
  const threeRef       = useRef<any>(null)

  const [status,       setStatus]       = useState<StatusT>("loading")
  const [errorMsg,     setErrorMsg]     = useState("")
  const [points,       setPoints]       = useState<DebrisPoint[]>([])
  const [selected,     setSelected]     = useState<DebrisPoint | null>(null)
  const [isSpinning,   setIsSpinning]   = useState(true)
  const [originFilter, setOriginFilter] = useState<OriginKey | "all">("all")
  const [altFilter,    setAltFilter]    = useState<AltBandKey | "all">("all")
  const [showTrack,    setShowTrack]    = useState(true)
  const [tleEpoch,     setTleEpoch]     = useState("")
  const [liveTime,     setLiveTime]     = useState(new Date())
  const [loadPct,      setLoadPct]      = useState(0)
  const [countries,       setCountries]       = useState<CountryFeature[]>([])
  const [hoveredCountry,  setHoveredCountry]  = useState<CountryFeature | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<CountryFeature | null>(null)
  // ref to hold latest propagated points for country stats (doesn't need to trigger re-render)
  const allPointsRef = useRef<Array<{ lat: number; lng: number; [key: string]: any }>>([])

  // ── Live clock ────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setLiveTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // ── Filtered set ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return points.filter((p) => {
      if (originFilter !== "all" && p.origin  !== originFilter) return false
      if (altFilter    !== "all" && p.altBand !== altFilter)    return false
      return true
    })
  }, [points, originFilter, altFilter])

  // ── Propagate all debris positions ────────────────────────────────────────
  const propagateAll = useCallback(() => {
    if (!satLib.current || parsedRef.current.length === 0) return
    const now = new Date()
    const pts: DebrisPoint[] = []
    for (const s of parsedRef.current) {
      const pos = propagateSat(s.satrec, satLib.current, now)
      if (!pos) continue
      const altBand = getAltBand(pos.alt)
      const period  = (2 * Math.PI) / s.satrec.no   // rad/min → minutes
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
        altBand,
        origin:      s.origin,
        color:       ORIGINS[s.origin].color,
        satrec:      s.satrec,
      })
    }
    allPointsRef.current = pts  // store for country filtering
    setPoints(pts)
    setLiveTime(now)
  }, [])

  // ── Fetch TLE + initialise ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        setLoadPct(10)
        const sLib = await import("satellite.js")
        if (cancelled) return
        satLib.current = sLib
        setLoadPct(25)

        const [res, geoRes] = await Promise.all([
          fetch("/api/debris-tle"),
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
        if (!tleText || tleText.length < 100) throw new Error("Empty TLE response")

        setStatus("propagating")
        const entries = parseTLEText(tleText)
        if (entries.length === 0) throw new Error("No valid TLE entries parsed")
        setTleEpoch(new Date().toISOString().split("T")[0])

        const parsed: ParsedDebris[] = []
        for (let i = 0; i < entries.length; i++) {
          const rec = entries[i]
          try {
            const satrec = sLib.twoline2satrec(rec.tle1, rec.tle2)
            if (!satrec || satrec.error !== 0) continue
            parsed.push({
              name:        rec.name,
              noradId:     rec.noradId,
              inclination: rec.inclination,
              origin:      getOrigin(rec.name),
              satrec,
            })
          } catch { /* skip bad TLE */ }
          if (i % 200 === 0) setLoadPct(55 + Math.round((i / entries.length) * 30))
        }
        parsedRef.current = parsed
        setLoadPct(90)

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

  // ── Recurring propagation every 5 s ──────────────────────────────────────
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

  // ── Init globe.gl + Three.js particle system ──────────────────────────────
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
        .atmosphereColor("#ff4444")
        .atmosphereAltitude(0.12)
        .pointOfView({ lat: 20, lng: 0, altitude: 2.4 })

      const ctrl = globe.controls()
      ctrl.autoRotate      = true
      ctrl.autoRotateSpeed = 0.2
      ctrl.enableDamping   = true
      ctrl.dampingFactor   = 0.1

      globeInst.current = globe
      applyCountries(globe, countries, null, null)

      // ── Particle system (ShaderMaterial for per-point size) ──────────────
      const debrisTexture = makeDebrisTexture(THREE)
      const geo = new THREE.BufferGeometry()
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uTexture: { value: debrisTexture },
          uOpacity: { value: 1.0 },
        },
        vertexShader: `
          attribute vec3 color;
          attribute float aSize;
          varying vec3 vColor;
          void main() {
            vColor = color;
            gl_PointSize = aSize;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D uTexture;
          uniform float uOpacity;
          varying vec3 vColor;
          void main() {
            vec4 tex = texture2D(uTexture, gl_PointCoord);
            if (tex.a < 0.01) discard;
            gl_FragColor = vec4(vColor * tex.rgb, tex.a * uOpacity);
          }
        `,
        transparent: true,
        depthWrite:  false,
      })
      const debrisPoints = new THREE.Points(geo, mat)
      debrisPoints.renderOrder = 999
      globe.scene().add(debrisPoints)
      debrisPointsRef.current = debrisPoints

      // Populate immediately with already-propagated data
      updateDebrisBuffer(filteredRef.current, THREE, debrisPoints)

      // ── Pulse animation ───────────────────────────────────────────────────
      let t = 0
      const pulse = () => {
        animId = requestAnimationFrame(pulse)
        t += 0.04
        mat.uniforms.uOpacity.value = 0.45 + 0.55 * Math.abs(Math.sin(t))
      }
      animId = requestAnimationFrame(pulse)

      // ── Click → raycast into particle cloud ───────────────────────────────
      const canvas = globeRef.current!
      const onCanvasClick = (e: MouseEvent) => {
        if (!debrisPointsRef.current) return
        const rect  = canvas.getBoundingClientRect()
        const mouse = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width)  *  2 - 1,
          -((e.clientY - rect.top) / rect.height) *  2 + 1
        )
        const raycaster = new THREE.Raycaster()
        raycaster.params.Points = { threshold: 2.5 }
        raycaster.setFromCamera(mouse, globe.camera())
        const hits = raycaster.intersectObject(debrisPointsRef.current)
        if (hits.length > 0 && hits[0].index != null) {
          const d = filteredRef.current[hits[0].index]
          if (d) {
            setSelected(d)
            setIsSpinning(false)
            globe.pointOfView({ lat: d.lat, lng: d.lng, altitude: 1.8 }, 700)
          }
        }
      }
      canvas.addEventListener("click", onCanvasClick)
      ;(canvas as any)._debrisClick = onCanvasClick
    })

    return () => {
      cancelAnimationFrame(animId)
      const canvas = globeRef.current
      if (canvas && (canvas as any)._debrisClick) {
        canvas.removeEventListener("click", (canvas as any)._debrisClick)
      }
      if (debrisPointsRef.current) {
        debrisPointsRef.current.geometry?.dispose?.()
        const m = debrisPointsRef.current.material
        m?.uniforms?.uTexture?.value?.dispose?.()
        m?.dispose?.()
        debrisPointsRef.current = null
      }
      if (orbitLineRef.current) {
        globeInst.current?.scene?.().remove(orbitLineRef.current)
        orbitLineRef.current.traverse?.((c: any) => {
          c.geometry?.dispose?.()
          c.material?.dispose?.()
        })
        orbitLineRef.current = null
      }
      disposeGlobe(globeInst, globeRef)
    }
  }, [status])

  // ── Keep filteredRef current & update Three.js buffer ─────────────────────
  useEffect(() => {
    filteredRef.current = filtered
    if (debrisPointsRef.current && threeRef.current) {
      updateDebrisBuffer(filtered, threeRef.current, debrisPointsRef.current)
    }
  }, [filtered])

  // ── Draw orbit track as Three.js Line in scene ────────────────────────────
  useEffect(() => {
    const THREE = threeRef.current
    const globe  = globeInst.current
    if (!THREE || !globe) return

    // Remove previous track
    if (orbitLineRef.current) {
      globe.scene().remove(orbitLineRef.current)
      orbitLineRef.current.traverse?.((c: any) => {
        c.geometry?.dispose?.()
        c.material?.dispose?.()
      })
      orbitLineRef.current = null
    }

    if (!selected || !showTrack || !satLib.current) return

    // Build 300-point orbit (one full orbit at ~20 s intervals)
    const positions: number[] = []
    const now = new Date()
    for (let i = 0; i <= 300; i++) {
      const t   = new Date(now.getTime() + i * 20_000)
      const pos = propagateSat(selected.satrec, satLib.current, t)
      if (!pos) continue
      const [x, y, z] = latLngAltToXYZ(pos.lat, pos.lng, pos.alt)
      positions.push(x, y, z)
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))

    const core = new THREE.Line(
      geo,
      new THREE.LineBasicMaterial({
        color:       selected.color,
        transparent: true,
        opacity:     0.9,
        depthWrite:  false,
      })
    )
    core.renderOrder = 998

    const glow = new THREE.Line(
      geo,
      new THREE.LineBasicMaterial({
        color:       0xffffff,
        transparent: true,
        opacity:     0.12,
        depthWrite:  false,
      })
    )
    glow.renderOrder = 997

    const group = new THREE.Group()
    group.add(glow)
    group.add(core)
    globe.scene().add(group)
    orbitLineRef.current = group
  }, [selected, showTrack])

  // ── Spin toggle ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!globeInst.current) return
    globeInst.current.controls().autoRotate = isSpinning
  }, [isSpinning])

  // ── Counts ────────────────────────────────────────────────────────────────
  const originCounts = useMemo(() => {
    const c: Partial<Record<OriginKey | "all", number>> = { all: points.length }
    for (const p of points) c[p.origin] = (c[p.origin] ?? 0) + 1
    return c
  }, [points])

  const altCounts = useMemo(() => {
    const c: Partial<Record<AltBandKey | "all", number>> = { all: points.length }
    for (const p of points) c[p.altBand] = (c[p.altBand] ?? 0) + 1
    return c
  }, [points])

  const countryStats = useMemo(() => {
    if (!selectedCountry) return null
    const name = selectedCountry.properties.name
    const bbox = featureBbox(selectedCountry.geometry)
    const overhead = allPointsRef.current.filter((p: any) =>
      p.lat >= bbox.minLat && p.lat <= bbox.maxLat &&
      p.lng >= bbox.minLng && p.lng <= bbox.maxLng
    )
    const byOrigin: Record<string, number> = {}
    for (const p of overhead as any[]) {
      byOrigin[p.origin] = (byOrigin[p.origin] ?? 0) + 1
    }
    return { name, count: overhead.length, byOrigin }
  }, [selectedCountry])

  const fmtTime = (d: Date) => d.toUTCString().replace("GMT", "UTC").slice(5, 25)

  // ── Loading screen ────────────────────────────────────────────────────────
  if (status === "loading" || status === "propagating") {
    return (
      <div
        className="flex flex-col items-center justify-center"
        style={{ minHeight: "calc(100vh - 64px)", background: "var(--bg)" }}
      >
        <div className="text-center max-w-sm">
          <div className="mb-6 relative w-20 h-20 mx-auto">
            <div
              className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
              style={{ borderTopColor: "#ff4444", borderRightColor: "#ff8800" }}
            />
            <div
              className="absolute inset-3 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,50,50,0.15)" }}
            >
              <span className="text-xl">☄️</span>
            </div>
          </div>
          <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--text)" }}>
            {status === "propagating"
              ? "Computing debris orbits…"
              : "Fetching debris TLE data…"}
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
            {status === "propagating"
              ? "Running SGP4 propagation across all tracked debris objects"
              : "Loading orbital data from CelesTrak · NORAD catalogue"}
          </p>
          <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width:      `${loadPct}%`,
                background: "linear-gradient(to right, #ff3333, #ff8800)",
              }}
            />
          </div>
          <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>{loadPct}%</p>
        </div>
      </div>
    )
  }

  // ── Error screen ──────────────────────────────────────────────────────────
  if (status === "error") {
    return (
      <div
        className="flex flex-col items-center justify-center gap-4"
        style={{ minHeight: "calc(100vh - 64px)", background: "var(--bg)" }}
      >
        <span className="text-4xl">⚠️</span>
        <p className="text-lg font-semibold" style={{ color: "var(--text)" }}>
          Failed to load debris data
        </p>
        <p className="text-sm" style={{ color: "var(--muted)" }}>{errorMsg}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: "#ff4444", color: "#fff" }}
        >
          Retry
        </button>
      </div>
    )
  }

  // ── Main globe view ───────────────────────────────────────────────────────
  return (
    <div
      className="relative"
      style={{ minHeight: "calc(100vh - 64px)", background: "#000" }}
    >
      {/* Globe canvas */}
      <div ref={globeRef} className="absolute inset-0" />

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-4 pointer-events-none">

        {/* Title + stats */}
        <div className="pointer-events-auto">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-lg font-bold tracking-wide" style={{ color: "var(--text)" }}>
              ☄️ Space Debris Tracker
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{
                background: "rgba(255,50,50,0.2)",
                color:      "#ff5555",
                border:     "1px solid rgba(255,50,50,0.35)",
              }}
            >
              LIVE
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { label: "Tracked",  val: filtered.length.toLocaleString() },
              { label: "LEO",      val: (altCounts.leo  ?? 0).toLocaleString() },
              { label: "TLE Date", val: tleEpoch },
              { label: "UTC",      val: fmtTime(liveTime) },
            ].map((s) => (
              <div
                key={s.label}
                className="px-3 py-1.5 rounded-lg text-xs"
                style={{
                  background:    "rgba(0,0,0,0.6)",
                  border:        "1px solid rgba(255,255,255,0.1)",
                  backdropFilter:"blur(8px)",
                  color:         "var(--text)",
                }}
              >
                <span style={{ color: "var(--muted)" }}>{s.label} </span>
                <span className="font-semibold">{s.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setIsSpinning((s) => !s)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{
              background:    "rgba(0,0,0,0.6)",
              border:        "1px solid rgba(255,255,255,0.15)",
              color:         "var(--muted)",
              backdropFilter:"blur(8px)",
            }}
          >
            {isSpinning ? "⏸ Pause" : "▶ Spin"}
          </button>
          <Link
            href="/uc16/details"
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{
              background:    "rgba(255,50,50,0.12)",
              border:        "1px solid rgba(255,50,50,0.3)",
              color:         "#ff6666",
              backdropFilter:"blur(8px)",
            }}
          >
            Architecture →
          </Link>
        </div>
      </div>

      {/* ── Filter panel — bottom left ─────────────────────────────────────── */}
      <div
        className="absolute bottom-4 left-4 pointer-events-auto w-64"
        style={{ maxHeight: "65vh", overflowY: "auto" }}
      >
        <div
          className="rounded-xl p-3"
          style={{
            background:    "rgba(0,0,0,0.78)",
            border:        "1px solid rgba(255,255,255,0.1)",
            backdropFilter:"blur(14px)",
          }}
        >
          {/* Origin filter */}
          <p className="text-xs font-semibold tracking-wider mb-2" style={{ color: "var(--muted)" }}>
            ORIGIN EVENT
          </p>
          <div className="flex flex-col gap-1 mb-4">
            {(["all", "cosmos", "fengyun", "iridium", "other"] as const).map((key) => {
              const active = originFilter === key
              const info   = key === "all" ? null : ORIGINS[key]
              const count  = key === "all"
                ? (originCounts.all ?? 0)
                : (originCounts[key] ?? 0)
              return (
                <button
                  key={key}
                  onClick={() => { setOriginFilter(key); setSelected(null) }}
                  className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-left transition-colors"
                  style={{
                    background: active
                      ? (info ? info.color + "22" : "rgba(255,255,255,0.1)")
                      : "transparent",
                    border: active
                      ? `1px solid ${info?.color ?? "rgba(255,255,255,0.3)"}`
                      : "1px solid transparent",
                    color: active ? (info?.color ?? "var(--text)") : "var(--muted)",
                  }}
                >
                  <span className="flex items-center gap-2">
                    {info && (
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: info.color }}
                      />
                    )}
                    {key === "all" ? "All Origins" : info!.label}
                  </span>
                  <span className="font-mono opacity-60">{count.toLocaleString()}</span>
                </button>
              )
            })}
          </div>

          {/* Altitude band filter */}
          <p className="text-xs font-semibold tracking-wider mb-2" style={{ color: "var(--muted)" }}>
            ALTITUDE BAND
          </p>
          <div className="flex flex-col gap-1">
            {(["all", "leo", "meo", "geo", "deep"] as const).map((key) => {
              const active = altFilter === key
              const info   = key === "all" ? null : ALT_BANDS[key]
              const count  = key === "all"
                ? (altCounts.all ?? 0)
                : (altCounts[key] ?? 0)
              return (
                <button
                  key={key}
                  onClick={() => { setAltFilter(key); setSelected(null) }}
                  className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-left transition-colors"
                  style={{
                    background: active
                      ? (info ? info.color + "22" : "rgba(255,255,255,0.1)")
                      : "transparent",
                    border: active
                      ? `1px solid ${info?.color ?? "rgba(255,255,255,0.3)"}`
                      : "1px solid transparent",
                    color: active ? (info?.color ?? "var(--text)") : "var(--muted)",
                  }}
                >
                  <span className="flex items-center gap-2">
                    {info && (
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: info.color }}
                      />
                    )}
                    {key === "all" ? "All Altitudes" : `${info!.label} · ${info!.desc}`}
                  </span>
                  <span className="font-mono opacity-60">{count.toLocaleString()}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Selected debris panel — bottom right ──────────────────────────── */}
      {selected && (
        <div className="absolute bottom-4 right-4 pointer-events-auto w-72">
          <div
            className="rounded-xl p-4"
            style={{
              background:    "rgba(0,0,0,0.88)",
              border:        `1px solid ${ORIGINS[selected.origin].color}44`,
              backdropFilter:"blur(14px)",
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="min-w-0 pr-2">
                <p
                  className="text-sm font-bold leading-tight truncate"
                  style={{ color: "var(--text)" }}
                >
                  {selected.name}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  NORAD #{selected.noradId}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-base flex-shrink-0 opacity-40 hover:opacity-80 transition-opacity"
                style={{ color: "var(--muted)" }}
              >
                ✕
              </button>
            </div>

            {/* Origin badge */}
            <div
              className="flex items-start gap-2 mb-3 px-3 py-2 rounded-lg"
              style={{
                background: ORIGINS[selected.origin].color + "14",
                border:     `1px solid ${ORIGINS[selected.origin].color}30`,
              }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full mt-0.5 flex-shrink-0"
                style={{ background: ORIGINS[selected.origin].color }}
              />
              <div>
                <p
                  className="text-xs font-semibold"
                  style={{ color: ORIGINS[selected.origin].color }}
                >
                  {ORIGINS[selected.origin].event}
                  {ORIGINS[selected.origin].year && (
                    <span className="font-normal opacity-70 ml-1">
                      ({ORIGINS[selected.origin].year})
                    </span>
                  )}
                </p>
                <p className="text-xs mt-0.5 leading-snug" style={{ color: "var(--muted)" }}>
                  {ORIGINS[selected.origin].desc}
                </p>
              </div>
            </div>

            {/* Orbital metrics */}
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {[
                { label: "Altitude",    val: `${Math.round(selected.alt).toLocaleString()} km` },
                { label: "Velocity",    val: `${selected.vel.toFixed(2)} km/s` },
                { label: "Inclination", val: `${selected.inclination.toFixed(2)}°` },
                { label: "Period",      val: `${selected.period.toFixed(1)} min` },
                { label: "Alt Band",    val: ALT_BANDS[selected.altBand].label },
                {
                  label: "Position",
                  val:   `${selected.lat.toFixed(1)}°, ${selected.lng.toFixed(1)}°`,
                },
              ].map((m) => (
                <div
                  key={m.label}
                  className="rounded-lg px-2 py-1.5"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border:     "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    {m.label}
                  </p>
                  <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                    {m.val}
                  </p>
                </div>
              ))}
            </div>

            {/* Orbit track toggle */}
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: "var(--muted)" }}>
                Orbit track
              </span>
              <button
                onClick={() => setShowTrack((s) => !s)}
                className="px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                style={{
                  background: showTrack
                    ? ORIGINS[selected.origin].color + "20"
                    : "rgba(255,255,255,0.05)",
                  border: showTrack
                    ? `1px solid ${ORIGINS[selected.origin].color}50`
                    : "1px solid rgba(255,255,255,0.1)",
                  color: showTrack ? ORIGINS[selected.origin].color : "var(--muted)",
                }}
              >
                {showTrack ? "On" : "Off"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Country stats panel ───────────────────────────────────────────── */}
      {selectedCountry && countryStats && !selected && (
        <div className="absolute bottom-4 right-4 pointer-events-auto w-64" style={{ zIndex: 10 }}>
          <div className="rounded-xl p-4" style={{
            background: "rgba(0,0,0,0.88)",
            border: "1px solid rgba(255,100,50,0.3)",
            backdropFilter: "blur(14px)",
          }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--text)" }}>{countryStats.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  {countryStats.count} debris objects overhead
                </p>
              </div>
              <button onClick={() => setSelectedCountry(null)} className="opacity-40 hover:opacity-80" style={{ color: "var(--muted)" }}>✕</button>
            </div>
            {countryStats.count > 0 ? (
              <div className="flex flex-col gap-1">
                {Object.entries(countryStats.byOrigin).map(([origin, cnt]) => (
                  <div key={origin} className="flex items-center justify-between px-2 py-1 rounded text-xs"
                    style={{ background: "rgba(255,100,50,0.06)" }}>
                    <span style={{ color: "var(--muted)" }}>{origin}</span>
                    <span className="font-mono" style={{ color: "#ff6432" }}>{cnt}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs" style={{ color: "var(--muted)" }}>No debris tracked overhead</p>
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

      {/* ── Risk legend (top right, hidden when debris selected) ──────────── */}
      {!selected && (
        <div
          className="absolute top-20 right-4 pointer-events-none"
          style={{
            background:    "rgba(0,0,0,0.65)",
            border:        "1px solid rgba(255,255,255,0.1)",
            backdropFilter:"blur(10px)",
            borderRadius:  "12px",
            padding:       "10px 14px",
          }}
        >
          <p className="text-xs font-semibold mb-2 tracking-wider" style={{ color: "var(--muted)" }}>
            ORIGIN
          </p>
          {(["cosmos", "fengyun", "iridium", "other"] as OriginKey[]).map((key) => (
            <div key={key} className="flex items-center gap-2 mb-1">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: ORIGINS[key].color }}
              />
              <span className="text-xs" style={{ color: "var(--muted)" }}>
                {ORIGINS[key].label}
              </span>
            </div>
          ))}
          <p className="text-xs mt-2 mb-1 font-semibold tracking-wider" style={{ color: "var(--muted)" }}>
            ALTITUDE
          </p>
          {(["leo", "meo", "geo"] as AltBandKey[]).map((key) => (
            <div key={key} className="flex items-center gap-2 mb-1">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: ALT_BANDS[key].color }}
              />
              <span className="text-xs" style={{ color: "var(--muted)" }}>
                {ALT_BANDS[key].label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

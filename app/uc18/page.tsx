"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import Link from "next/link"

// ── Types ─────────────────────────────────────────────────────────────────────

type RegionKey = "northamerica" | "southamerica" | "europe" | "africa" | "asia" | "oceania" | "other"

interface WildfirePoint {
  id: string
  title: string
  lat: number
  lng: number
  date: string
  sourceUrl: string
  region: RegionKey
  color: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const REGIONS: Record<RegionKey, { label: string; color: string }> = {
  northamerica: { label: "North America", color: "#ff4444" },
  southamerica: { label: "South America", color: "#ff8800" },
  europe:       { label: "Europe",        color: "#ffcc44" },
  africa:       { label: "Africa",        color: "#ff6600" },
  asia:         { label: "Asia",          color: "#ff44aa" },
  oceania:      { label: "Oceania/AUS",   color: "#44ffcc" },
  other:        { label: "Other",         color: "#aaaaaa" },
}

function getRegion(lat: number, lng: number): RegionKey {
  if (lng >= -170 && lng <= -50 && lat >=  15) return "northamerica"
  if (lng >= -85  && lng <= -30 && lat <   15) return "southamerica"
  if (lng >= -50  && lng <  -30 && lat <   15) return "southamerica"
  if (lng >= -15  && lng <=  45 && lat >=  35) return "europe"
  if (lng >= -20  && lng <=  55 && lat <   35 && lat > -35) return "africa"
  if (lng > 100   && lng <= 180 && lat <  -10) return "oceania"
  if (lng > 25    && lng <= 180 && lat >= -10) return "asia"
  return "other"
}

// ── Three.js helpers ──────────────────────────────────────────────────────────

function makeFireTexture(THREE: any): any {
  const sz = 48
  const cv  = document.createElement("canvas")
  cv.width  = cv.height = sz
  const ctx = cv.getContext("2d")!
  const cx  = sz / 2
  const grd = ctx.createRadialGradient(cx, cx, 0, cx, cx, sz / 2)
  grd.addColorStop(0,    "rgba(255,255,200,1)")
  grd.addColorStop(0.15, "rgba(255,200,0,0.9)")
  grd.addColorStop(0.35, "rgba(255,80,0,0.7)")
  grd.addColorStop(0.6,  "rgba(200,20,0,0.3)")
  grd.addColorStop(1,    "rgba(100,0,0,0)")
  ctx.fillStyle = grd
  ctx.fillRect(0, 0, sz, sz)
  ctx.fillStyle = "#ffffc0"
  ctx.beginPath(); ctx.arc(cx, cx, 2, 0, Math.PI * 2); ctx.fill()
  return new THREE.CanvasTexture(cv)
}

const GLOBE_R = 100

function latLngToXYZ(lat: number, lng: number): [number, number, number] {
  const r   = GLOBE_R * 1.003
  const phi = (90 - lat)  * (Math.PI / 180)
  const theta = (90 - lng) * (Math.PI / 180)
  return [r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta)]
}

function updateFireBuffer(data: WildfirePoint[], THREE: any, points: any) {
  if (!points) return
  const n    = data.length
  const pos  = new Float32Array(n * 3)
  const cols = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const d = data[i]
    const [x, y, z] = latLngToXYZ(d.lat, d.lng)
    pos[i*3]=x; pos[i*3+1]=y; pos[i*3+2]=z
    const c = new THREE.Color(d.color)
    cols[i*3]=c.r; cols[i*3+1]=c.g; cols[i*3+2]=c.b
  }
  const geo = points.geometry
  geo.setAttribute("position", new THREE.BufferAttribute(pos,  3))
  geo.setAttribute("color",    new THREE.BufferAttribute(cols, 3))
  geo.setDrawRange(0, n)
  geo.computeBoundingSphere()
}

// ── Main component ────────────────────────────────────────────────────────────

type StatusT = "loading" | "ready" | "error"

export default function UC18Page() {
  const globeRef    = useRef<HTMLDivElement>(null)
  const globeInst   = useRef<any>(null)
  const filteredRef = useRef<WildfirePoint[]>([])
  const pointsRef   = useRef<any>(null)
  const threeRef    = useRef<any>(null)

  const [status,       setStatus]       = useState<StatusT>("loading")
  const [errorMsg,     setErrorMsg]     = useState("")
  const [fires,        setFires]        = useState<WildfirePoint[]>([])
  const [selected,     setSelected]     = useState<WildfirePoint | null>(null)
  const [isSpinning,   setIsSpinning]   = useState(true)
  const [regionFilter, setRegionFilter] = useState<RegionKey | "all">("all")
  const [liveTime,     setLiveTime]     = useState(new Date())
  const [lastUpdate,   setLastUpdate]   = useState<Date | null>(null)

  useEffect(() => {
    const t = setInterval(() => setLiveTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const filtered = useMemo(() => {
    return fires.filter(f => regionFilter === "all" || f.region === regionFilter)
  }, [fires, regionFilter])

  const fetchFires = useCallback(async () => {
    try {
      const res  = await fetch("/api/wildfires")
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const geojson = await res.json()
      const features: any[] = geojson.features ?? []
      const pts: WildfirePoint[] = []
      for (const f of features) {
        const geom = f.geometry
        if (!geom) continue
        let lat: number, lng: number
        if (geom.type === "Point") {
          lng = geom.coordinates[0]; lat = geom.coordinates[1]
        } else if (geom.type === "Polygon") {
          // centroid of first ring
          const ring = geom.coordinates[0] as number[][]
          lng = ring.reduce((s: number, c: number[]) => s + c[0], 0) / ring.length
          lat = ring.reduce((s: number, c: number[]) => s + c[1], 0) / ring.length
        } else continue
        if (!isFinite(lat) || !isFinite(lng)) continue
        const region = getRegion(lat, lng)
        const sources: any[] = f.properties?.sources ?? []
        pts.push({
          id:        f.id ?? f.properties?.id ?? "",
          title:     f.properties?.title ?? "Active Wildfire",
          lat, lng,
          date:      (f.properties?.date ?? "").slice(0, 10),
          sourceUrl: sources[0]?.url ?? "",
          region,
          color:     REGIONS[region].color,
        })
      }
      setFires(pts)
      setLastUpdate(new Date())
    } catch (err: any) {
      if (fires.length === 0) { setErrorMsg(err?.message ?? "Unknown error"); setStatus("error") }
    }
  }, [fires.length])

  useEffect(() => {
    fetchFires().then(() => setStatus("ready"))
  }, [fetchFires])

  useEffect(() => {
    if (status !== "ready") return
    const t = setInterval(fetchFires, 900_000)  // 15 min
    return () => clearInterval(t)
  }, [status, fetchFires])

  // Globe init
  useEffect(() => {
    if (status !== "ready" || !globeRef.current || globeInst.current) return
    let globe: any, animId: number

    Promise.all([import("globe.gl"), import("three")]).then(([globeMod, THREE]) => {
      if (!globeRef.current) return
      threeRef.current = THREE
      const GlobeGL = (globeMod.default ?? globeMod) as any
      globe = new GlobeGL()
      globe(globeRef.current)
        .width(globeRef.current.clientWidth)
        .height(globeRef.current.clientHeight)
        .globeImageUrl("//unpkg.com/three-globe/example/img/earth-day.jpg")
        .bumpImageUrl("//unpkg.com/three-globe/example/img/earth-topology.png")
        .backgroundImageUrl("//unpkg.com/three-globe/example/img/night-sky.png")
        .atmosphereColor("#ff6600")
        .atmosphereAltitude(0.12)
        .pointOfView({ lat: 42, lng: -100, altitude: 2.2 })

      const ctrl = globe.controls()
      ctrl.autoRotate = true; ctrl.autoRotateSpeed = 0.2
      ctrl.enableDamping = true; ctrl.dampingFactor = 0.1
      globeInst.current = globe

      const geo = new THREE.BufferGeometry()
      const mat = new THREE.PointsMaterial({
        size: 10, map: makeFireTexture(THREE), vertexColors: true,
        transparent: true, alphaTest: 0.01, sizeAttenuation: false, depthWrite: false,
      })
      const pts = new THREE.Points(geo, mat)
      pts.renderOrder = 999
      globe.scene().add(pts)
      pointsRef.current = pts
      updateFireBuffer(filteredRef.current, THREE, pts)

      let t = 0
      const blink = () => { animId = requestAnimationFrame(blink); t += 0.06; mat.opacity = 0.55 + 0.45 * Math.abs(Math.sin(t)); mat.needsUpdate = true }
      animId = requestAnimationFrame(blink)

      const canvas = globeRef.current!
      const onClick = (e: MouseEvent) => {
        if (!pointsRef.current) return
        const rect = canvas.getBoundingClientRect()
        const mouse = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1
        )
        const rc = new THREE.Raycaster(); rc.params.Points = { threshold: 3 }
        rc.setFromCamera(mouse, globe.camera())
        const hits = rc.intersectObject(pointsRef.current)
        if (hits.length > 0 && hits[0].index != null) {
          const f = filteredRef.current[hits[0].index]
          if (f) { setSelected(f); setIsSpinning(false); globe.pointOfView({ lat: f.lat, lng: f.lng, altitude: 1.5 }, 700) }
        }
      }
      canvas.addEventListener("click", onClick)
      ;(canvas as any)._fireClick = onClick
    })

    return () => {
      cancelAnimationFrame(animId)
      const canvas = globeRef.current
      if (canvas && (canvas as any)._fireClick) canvas.removeEventListener("click", (canvas as any)._fireClick)
      if (pointsRef.current) { pointsRef.current.geometry?.dispose?.(); pointsRef.current.material?.dispose?.(); pointsRef.current = null }
      globe?.controls()?.dispose?.()
      globeInst.current = null
    }
  }, [status])

  useEffect(() => {
    filteredRef.current = filtered
    if (pointsRef.current && threeRef.current) updateFireBuffer(filtered, threeRef.current, pointsRef.current)
  }, [filtered])

  useEffect(() => {
    if (!globeInst.current) return
    globeInst.current.controls().autoRotate = isSpinning
  }, [isSpinning])

  const regionCounts = useMemo(() => {
    const c: Partial<Record<RegionKey | "all", number>> = { all: fires.length }
    for (const f of fires) c[f.region] = (c[f.region] ?? 0) + 1
    return c
  }, [fires])

  const fmtTime = (d: Date) => d.toUTCString().replace("GMT", "UTC").slice(5, 25)

  if (status === "loading") return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: "calc(100vh - 64px)", background: "var(--bg)" }}>
      <div className="text-center max-w-sm">
        <div className="mb-6 relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: "#ff4444", borderRightColor: "#ff8800" }} />
          <div className="absolute inset-3 rounded-full flex items-center justify-center" style={{ background: "rgba(255,80,0,0.15)" }}>
            <span className="text-xl">🔥</span>
          </div>
        </div>
        <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--text)" }}>Fetching active wildfires…</h2>
        <p className="text-sm" style={{ color: "var(--muted)" }}>Loading NASA EONET satellite fire event data</p>
      </div>
    </div>
  )

  if (status === "error") return (
    <div className="flex flex-col items-center justify-center gap-4" style={{ minHeight: "calc(100vh - 64px)", background: "var(--bg)" }}>
      <span className="text-4xl">⚠️</span>
      <p className="text-lg font-semibold" style={{ color: "var(--text)" }}>Failed to load wildfire data</p>
      <p className="text-sm" style={{ color: "var(--muted)" }}>{errorMsg}</p>
      <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "#ff4444", color: "#fff" }}>Retry</button>
    </div>
  )

  return (
    <div className="relative" style={{ minHeight: "calc(100vh - 64px)", background: "#000" }}>
      <div ref={globeRef} className="absolute inset-0" />

      {/* Top bar */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-4 pointer-events-none">
        <div className="pointer-events-auto">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-lg font-bold" style={{ color: "var(--text)" }}>🔥 Active Wildfires</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(255,80,0,0.2)", color: "#ff6600", border: "1px solid rgba(255,80,0,0.35)" }}>LIVE</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Active Fires",  val: (regionCounts.all ?? 0).toString() },
              { label: "Showing",       val: filtered.length.toString() },
              { label: "Updated",       val: lastUpdate ? fmtTime(lastUpdate) : "—" },
              { label: "UTC",           val: fmtTime(liveTime) },
            ].map(s => (
              <div key={s.label} className="px-3 py-1.5 rounded-lg text-xs" style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", color: "var(--text)" }}>
                <span style={{ color: "var(--muted)" }}>{s.label} </span><span className="font-semibold">{s.val}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 pointer-events-auto">
          <button onClick={() => setIsSpinning(s => !s)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)", color: "var(--muted)", backdropFilter: "blur(8px)" }}>
            {isSpinning ? "⏸ Pause" : "▶ Spin"}
          </button>
          <Link href="/uc18/details" className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "rgba(255,80,0,0.12)", border: "1px solid rgba(255,80,0,0.3)", color: "#ff8844", backdropFilter: "blur(8px)" }}>Architecture →</Link>
        </div>
      </div>

      {/* Filter */}
      <div className="absolute bottom-4 left-4 pointer-events-auto w-56">
        <div className="rounded-xl p-3" style={{ background: "rgba(0,0,0,0.78)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(14px)" }}>
          <p className="text-xs font-semibold tracking-wider mb-2" style={{ color: "var(--muted)" }}>REGION</p>
          <div className="flex flex-col gap-1">
            {(["all", "northamerica", "southamerica", "europe", "africa", "asia", "oceania"] as const).map(key => {
              const active = regionFilter === key
              const info   = key === "all" ? null : REGIONS[key]
              const count  = key === "all" ? (regionCounts.all ?? 0) : (regionCounts[key] ?? 0)
              return (
                <button key={key} onClick={() => { setRegionFilter(key); setSelected(null) }}
                  className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-left"
                  style={{ background: active ? (info?.color ?? "rgba(255,255,255,0.1)") + "22" : "transparent", border: active ? `1px solid ${info?.color ?? "rgba(255,255,255,0.3)"}` : "1px solid transparent", color: active ? (info?.color ?? "var(--text)") : "var(--muted)" }}>
                  <span className="flex items-center gap-2">
                    {info && <span className="w-2 h-2 rounded-full" style={{ background: info.color }} />}
                    {key === "all" ? "All Regions" : info!.label}
                  </span>
                  <span className="font-mono opacity-60">{count}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Selected fire panel */}
      {selected && (
        <div className="absolute bottom-4 right-4 pointer-events-auto w-72">
          <div className="rounded-xl p-4" style={{ background: "rgba(0,0,0,0.88)", border: `1px solid ${REGIONS[selected.region].color}44`, backdropFilter: "blur(14px)" }}>
            <div className="flex items-start justify-between mb-3">
              <div className="min-w-0 pr-2">
                <p className="text-sm font-bold leading-tight" style={{ color: "var(--text)" }}>{selected.title}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{REGIONS[selected.region].label}</p>
              </div>
              <button onClick={() => setSelected(null)} className="opacity-40 hover:opacity-80 text-base flex-shrink-0" style={{ color: "var(--muted)" }}>✕</button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {[
                { label: "Detected",   val: selected.date || "—" },
                { label: "Region",     val: REGIONS[selected.region].label },
                { label: "Latitude",   val: `${selected.lat.toFixed(3)}°` },
                { label: "Longitude",  val: `${selected.lng.toFixed(3)}°` },
              ].map(m => (
                <div key={m.label} className="rounded-lg px-2 py-1.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{m.label}</p>
                  <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{m.val}</p>
                </div>
              ))}
            </div>
            {selected.sourceUrl && (
              <a href={selected.sourceUrl} target="_blank" rel="noopener noreferrer"
                className="block text-xs text-center py-1.5 rounded-lg"
                style={{ background: REGIONS[selected.region].color + "20", color: REGIONS[selected.region].color, border: `1px solid ${REGIONS[selected.region].color}40` }}>
                View source →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

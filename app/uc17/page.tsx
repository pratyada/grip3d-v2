"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import Link from "next/link"

// ── Types ─────────────────────────────────────────────────────────────────────

type AltBandKey = "ground" | "low" | "medium" | "cruise"

interface AircraftPoint {
  icao24: string
  callsign: string
  country: string
  lat: number
  lng: number
  altM: number
  velocityMs: number
  heading: number
  vertRateMs: number
  onGround: boolean
  altBand: AltBandKey
  color: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ALT_BANDS: Record<AltBandKey, { label: string; color: string; desc: string }> = {
  ground: { label: "On Ground",     color: "#555566", desc: "Taxiing or parked" },
  low:    { label: "Low < 3,000 m", color: "#4488ff", desc: "Takeoff / approach" },
  medium: { label: "Medium < 8 km", color: "#33ccdd", desc: "Climb / descent" },
  cruise: { label: "Cruise > 8 km", color: "#ffffff",  desc: "Cruise altitude" },
}

function getAltBand(altM: number, onGround: boolean): AltBandKey {
  if (onGround || altM <= 10) return "ground"
  if (altM < 3000)  return "low"
  if (altM < 8000)  return "medium"
  return "cruise"
}

// ── Three.js helpers ──────────────────────────────────────────────────────────

function makeAircraftTexture(THREE: any): any {
  const sz = 32
  const cv  = document.createElement("canvas")
  cv.width  = cv.height = sz
  const ctx = cv.getContext("2d")!
  const cx  = sz / 2
  const grd = ctx.createRadialGradient(cx, cx, 0, cx, cx, sz / 2)
  grd.addColorStop(0,    "rgba(255,255,255,1)")
  grd.addColorStop(0.22, "rgba(200,230,255,0.85)")
  grd.addColorStop(0.5,  "rgba(100,160,255,0.3)")
  grd.addColorStop(1,    "rgba(50,100,255,0)")
  ctx.fillStyle = grd
  ctx.fillRect(0, 0, sz, sz)
  ctx.fillStyle = "#ffffff"
  ctx.beginPath(); ctx.arc(cx, cx, 1.5, 0, Math.PI * 2); ctx.fill()
  return new THREE.CanvasTexture(cv)
}

const GLOBE_R = 100

function latLngToXYZ(lat: number, lng: number): [number, number, number] {
  const r   = GLOBE_R * 1.002          // slightly above surface
  const phi = (90 - lat)  * (Math.PI / 180)
  const theta = (90 - lng) * (Math.PI / 180)
  return [r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta)]
}

function updateAircraftBuffer(data: AircraftPoint[], THREE: any, points: any) {
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

// ── Helpers ───────────────────────────────────────────────────────────────────

const mToFt   = (m: number)  => Math.round(m * 3.28084)
const msToKts = (ms: number) => (ms * 1.94384).toFixed(0)
const fpmStr  = (ms: number) => {
  const fpm = Math.round(ms * 196.85)
  return fpm > 0 ? `+${fpm}` : `${fpm}`
}
function headingCompass(deg: number): string {
  const dirs = ["N","NE","E","SE","S","SW","W","NW"]
  return dirs[Math.round(deg / 45) % 8]
}

// ── Main component ────────────────────────────────────────────────────────────

type StatusT = "loading" | "ready" | "error"

export default function UC17Page() {
  const globeRef      = useRef<HTMLDivElement>(null)
  const globeInst     = useRef<any>(null)
  const filteredRef   = useRef<AircraftPoint[]>([])
  const pointsRef     = useRef<any>(null)
  const threeRef      = useRef<any>(null)

  const [status,      setStatus]      = useState<StatusT>("loading")
  const [errorMsg,    setErrorMsg]    = useState("")
  const [points,      setPoints]      = useState<AircraftPoint[]>([])
  const [selected,    setSelected]    = useState<AircraftPoint | null>(null)
  const [isSpinning,  setIsSpinning]  = useState(true)
  const [altFilter,   setAltFilter]   = useState<AltBandKey | "all">("all")
  const [liveTime,    setLiveTime]    = useState(new Date())
  const [lastUpdate,  setLastUpdate]  = useState<Date | null>(null)
  const [apiNote,     setApiNote]     = useState("")

  useEffect(() => {
    const t = setInterval(() => setLiveTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const filtered = useMemo(() => {
    return points.filter(p => altFilter === "all" || p.altBand === altFilter)
  }, [points, altFilter])

  const fetchAircraft = useCallback(async () => {
    try {
      // Server proxy handles OpenSky fetch — avoids CORS restriction (OpenSky blocks cross-origin browser requests)
      const res  = await fetch("/api/aircraft")
      if (!res.ok) { setApiNote(`Aircraft API error ${res.status} — retrying in 60 s`); return }
      const data = await res.json()
      if (data.error) { setApiNote("OpenSky rate limited — retrying in 60 s"); return }
      setApiNote("")
      const states: any[] = data.states ?? []
      const pts: AircraftPoint[] = []
      for (const s of states) {
        const lng    = s[5]
        const lat    = s[6]
        if (lat == null || lng == null) continue
        if (!isFinite(lat) || !isFinite(lng)) continue
        const altM   = s[7]  ?? 0
        const onGnd  = s[8]  ?? false
        const vel    = s[9]  ?? 0
        const hdg    = s[10] ?? 0
        const vrate  = s[11] ?? 0
        const band   = getAltBand(altM, onGnd)
        pts.push({
          icao24:     s[0] ?? "",
          callsign:   ((s[1] ?? "").trim() || s[0]) ?? "",
          country:    s[2] ?? "",
          lat, lng, altM,
          velocityMs: vel,
          heading:    hdg,
          vertRateMs: vrate,
          onGround:   onGnd,
          altBand:    band,
          color:      ALT_BANDS[band].color,
        })
      }
      setPoints(pts)
      setLastUpdate(new Date())
    } catch (err: any) {
      setApiNote("Could not reach OpenSky — retrying…")
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchAircraft().then(() => setStatus("ready"))
  }, [fetchAircraft])

  // Poll every 60 s
  useEffect(() => {
    if (status !== "ready") return
    const t = setInterval(fetchAircraft, 60_000)
    return () => clearInterval(t)
  }, [status, fetchAircraft])

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
        .globeImageUrl("//unpkg.com/three-globe/example/img/earth-night.jpg")
        .bumpImageUrl("//unpkg.com/three-globe/example/img/earth-topology.png")
        .backgroundImageUrl("//unpkg.com/three-globe/example/img/night-sky.png")
        .atmosphereColor("#4488ff")
        .atmosphereAltitude(0.12)
        .pointOfView({ lat: 30, lng: 10, altitude: 2.0 })

      const ctrl = globe.controls()
      ctrl.autoRotate = true; ctrl.autoRotateSpeed = 0.2
      ctrl.enableDamping = true; ctrl.dampingFactor = 0.1
      globeInst.current = globe

      // Particle system
      const geo = new THREE.BufferGeometry()
      const mat = new THREE.PointsMaterial({
        size: 4, map: makeAircraftTexture(THREE), vertexColors: true,
        transparent: true, alphaTest: 0.01, sizeAttenuation: false, depthWrite: false,
      })
      const pts = new THREE.Points(geo, mat)
      pts.renderOrder = 999
      globe.scene().add(pts)
      pointsRef.current = pts
      updateAircraftBuffer(filteredRef.current, THREE, pts)

      // Blink
      let t = 0
      const blink = () => { animId = requestAnimationFrame(blink); t += 0.04; mat.opacity = 0.5 + 0.5 * Math.abs(Math.sin(t)); mat.needsUpdate = true }
      animId = requestAnimationFrame(blink)

      // Click
      const canvas = globeRef.current!
      const onClick = (e: MouseEvent) => {
        if (!pointsRef.current) return
        const rect = canvas.getBoundingClientRect()
        const mouse = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1
        )
        const rc = new THREE.Raycaster(); rc.params.Points = { threshold: 2.5 }
        rc.setFromCamera(mouse, globe.camera())
        const hits = rc.intersectObject(pointsRef.current)
        if (hits.length > 0 && hits[0].index != null) {
          const a = filteredRef.current[hits[0].index]
          if (a) { setSelected(a); setIsSpinning(false); globe.pointOfView({ lat: a.lat, lng: a.lng, altitude: 1.8 }, 700) }
        }
      }
      canvas.addEventListener("click", onClick)
      ;(canvas as any)._acClick = onClick
    })

    return () => {
      cancelAnimationFrame(animId)
      const canvas = globeRef.current
      if (canvas && (canvas as any)._acClick) canvas.removeEventListener("click", (canvas as any)._acClick)
      if (pointsRef.current) { pointsRef.current.geometry?.dispose?.(); pointsRef.current.material?.dispose?.(); pointsRef.current = null }
      globe?.controls()?.dispose?.()
      globeInst.current = null
    }
  }, [status])

  // Update buffer when filtered changes
  useEffect(() => {
    filteredRef.current = filtered
    if (pointsRef.current && threeRef.current) updateAircraftBuffer(filtered, threeRef.current, pointsRef.current)
  }, [filtered])

  useEffect(() => {
    if (!globeInst.current) return
    globeInst.current.controls().autoRotate = isSpinning
  }, [isSpinning])

  const altCounts = useMemo(() => {
    const c: Partial<Record<AltBandKey | "all", number>> = { all: points.length }
    for (const p of points) c[p.altBand] = (c[p.altBand] ?? 0) + 1
    return c
  }, [points])

  const fmtTime = (d: Date) => d.toUTCString().replace("GMT", "UTC").slice(5, 25)

  if (status === "loading") return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: "calc(100vh - 64px)", background: "var(--bg)" }}>
      <div className="text-center max-w-sm">
        <div className="mb-6 relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: "#4488ff", borderRightColor: "#33ccdd" }} />
          <div className="absolute inset-3 rounded-full flex items-center justify-center" style={{ background: "rgba(68,136,255,0.15)" }}>
            <span className="text-xl">✈️</span>
          </div>
        </div>
        <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--text)" }}>Loading live flight data…</h2>
        <p className="text-sm" style={{ color: "var(--muted)" }}>Fetching aircraft positions from OpenSky Network</p>
      </div>
    </div>
  )

  if (status === "error") return (
    <div className="flex flex-col items-center justify-center gap-4" style={{ minHeight: "calc(100vh - 64px)", background: "var(--bg)" }}>
      <span className="text-4xl">⚠️</span>
      <p className="text-lg font-semibold" style={{ color: "var(--text)" }}>Failed to load flight data</p>
      <p className="text-sm" style={{ color: "var(--muted)" }}>{errorMsg}</p>
      <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "#4488ff", color: "#fff" }}>Retry</button>
    </div>
  )

  return (
    <div className="relative" style={{ minHeight: "calc(100vh - 64px)", background: "#000" }}>
      <div ref={globeRef} className="absolute inset-0" />

      {/* Top bar */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-4 pointer-events-none">
        <div className="pointer-events-auto">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-lg font-bold" style={{ color: "var(--text)" }}>✈️ Live Aircraft Traffic</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(68,136,255,0.2)", color: "#4488ff", border: "1px solid rgba(68,136,255,0.35)" }}>LIVE</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Airborne", val: ((altCounts.low ?? 0) + (altCounts.medium ?? 0) + (altCounts.cruise ?? 0)).toLocaleString() },
              { label: "Total",    val: (altCounts.all ?? 0).toLocaleString() },
              { label: "Updated",  val: lastUpdate ? fmtTime(lastUpdate) : "—" },
              { label: "UTC",      val: fmtTime(liveTime) },
            ].map(s => (
              <div key={s.label} className="px-3 py-1.5 rounded-lg text-xs" style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", color: "var(--text)" }}>
                <span style={{ color: "var(--muted)" }}>{s.label} </span><span className="font-semibold">{s.val}</span>
              </div>
            ))}
          </div>
          {apiNote && <p className="text-xs mt-1" style={{ color: "#ff8800" }}>⚠ {apiNote}</p>}
        </div>
        <div className="flex items-center gap-2 pointer-events-auto">
          <button onClick={() => setIsSpinning(s => !s)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)", color: "var(--muted)", backdropFilter: "blur(8px)" }}>
            {isSpinning ? "⏸ Pause" : "▶ Spin"}
          </button>
          <Link href="/uc17/details" className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "rgba(68,136,255,0.12)", border: "1px solid rgba(68,136,255,0.3)", color: "#66aaff", backdropFilter: "blur(8px)" }}>Architecture →</Link>
        </div>
      </div>

      {/* Filter panel */}
      <div className="absolute bottom-4 left-4 pointer-events-auto w-56">
        <div className="rounded-xl p-3" style={{ background: "rgba(0,0,0,0.78)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(14px)" }}>
          <p className="text-xs font-semibold tracking-wider mb-2" style={{ color: "var(--muted)" }}>ALTITUDE BAND</p>
          <div className="flex flex-col gap-1">
            {(["all", "cruise", "medium", "low", "ground"] as const).map(key => {
              const active = altFilter === key
              const info   = key === "all" ? null : ALT_BANDS[key]
              const count  = key === "all" ? (altCounts.all ?? 0) : (altCounts[key] ?? 0)
              return (
                <button key={key} onClick={() => { setAltFilter(key); setSelected(null) }}
                  className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-left transition-colors"
                  style={{ background: active ? (info?.color ?? "rgba(255,255,255,0.1)") + "22" : "transparent", border: active ? `1px solid ${info?.color ?? "rgba(255,255,255,0.3)"}` : "1px solid transparent", color: active ? (info?.color ?? "var(--text)") : "var(--muted)" }}>
                  <span className="flex items-center gap-2">
                    {info && <span className="w-2 h-2 rounded-full" style={{ background: info.color }} />}
                    {key === "all" ? "All Aircraft" : info!.label}
                  </span>
                  <span className="font-mono opacity-60">{count.toLocaleString()}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Selected panel */}
      {selected && (
        <div className="absolute bottom-4 right-4 pointer-events-auto w-72">
          <div className="rounded-xl p-4" style={{ background: "rgba(0,0,0,0.88)", border: `1px solid ${ALT_BANDS[selected.altBand].color}44`, backdropFilter: "blur(14px)" }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-base font-bold" style={{ color: "var(--text)" }}>{selected.callsign || selected.icao24}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{selected.country} · ICAO {selected.icao24.toUpperCase()}</p>
              </div>
              <button onClick={() => setSelected(null)} className="opacity-40 hover:opacity-80 text-base" style={{ color: "var(--muted)" }}>✕</button>
            </div>
            <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg" style={{ background: ALT_BANDS[selected.altBand].color + "14", border: `1px solid ${ALT_BANDS[selected.altBand].color}30` }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: ALT_BANDS[selected.altBand].color }} />
              <p className="text-xs font-semibold" style={{ color: ALT_BANDS[selected.altBand].color }}>
                {selected.onGround ? "ON GROUND" : ALT_BANDS[selected.altBand].label}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: "Altitude",   val: selected.onGround ? "Ground" : `${mToFt(selected.altM).toLocaleString()} ft` },
                { label: "Speed",      val: `${msToKts(selected.velocityMs)} kts` },
                { label: "Heading",    val: `${Math.round(selected.heading)}° ${headingCompass(selected.heading)}` },
                { label: "Vert. Rate", val: selected.onGround ? "—" : `${fpmStr(selected.vertRateMs)} fpm` },
                { label: "Position",   val: `${selected.lat.toFixed(1)}°, ${selected.lng.toFixed(1)}°` },
                { label: "Alt Band",   val: ALT_BANDS[selected.altBand].label },
              ].map(m => (
                <div key={m.label} className="rounded-lg px-2 py-1.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{m.label}</p>
                  <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{m.val}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      {!selected && (
        <div className="absolute top-20 right-4 pointer-events-none rounded-xl p-3" style={{ background: "rgba(0,0,0,0.65)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(10px)" }}>
          <p className="text-xs font-semibold mb-2 tracking-wider" style={{ color: "var(--muted)" }}>ALTITUDE</p>
          {(["cruise","medium","low","ground"] as AltBandKey[]).map(k => (
            <div key={k} className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full" style={{ background: ALT_BANDS[k].color }} />
              <span className="text-xs" style={{ color: "var(--muted)" }}>{ALT_BANDS[k].label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

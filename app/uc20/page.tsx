"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import Link from "next/link"

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuroraPoint {
  lat: number
  lng: number
  prob: number
  color: string
}

interface SpaceWeather {
  auroraCoords:     number[][]  // [lng(0-359), lat, prob]
  forecastTime:     string
  observationTime:  string
  currentKp:        number
  solarWindSpeed:   number
  solarWindDensity: number
  bz:               number
}

// ── Constants ─────────────────────────────────────────────────────────────────

function auroraColor(prob: number): string {
  if (prob >= 90) return "#ccffee"
  if (prob >= 70) return "#00ffaa"
  if (prob >= 50) return "#00ee66"
  if (prob >= 30) return "#00aa44"
  if (prob >= 10) return "#007733"
  return "#004422"
}

function kpLabel(kp: number): { text: string; color: string } {
  if (kp < 1)  return { text: "Quiet",                color: "#44ff88" }
  if (kp < 2)  return { text: "Unsettled",            color: "#88ff44" }
  if (kp < 4)  return { text: "Active",               color: "#ffcc44" }
  if (kp < 5)  return { text: "Minor Storm (G1)",     color: "#ff8800" }
  if (kp < 6)  return { text: "Moderate Storm (G2)",  color: "#ff4400" }
  if (kp < 7)  return { text: "Strong Storm (G3)",    color: "#ff2200" }
  if (kp < 8)  return { text: "Severe Storm (G4)",    color: "#cc0000" }
  return        { text: "Extreme Storm (G5)",          color: "#ff00ff" }
}

type HemiFilter = "both" | "north" | "south"

// ── Three.js helpers ──────────────────────────────────────────────────────────

function makeAuroraTexture(THREE: any): any {
  const sz = 32
  const cv  = document.createElement("canvas")
  cv.width  = cv.height = sz
  const ctx = cv.getContext("2d")!
  const cx  = sz / 2
  const grd = ctx.createRadialGradient(cx, cx, 0, cx, cx, sz / 2)
  grd.addColorStop(0,    "rgba(180,255,200,1)")
  grd.addColorStop(0.3,  "rgba(0,200,100,0.7)")
  grd.addColorStop(0.65, "rgba(0,100,60,0.25)")
  grd.addColorStop(1,    "rgba(0,50,30,0)")
  ctx.fillStyle = grd
  ctx.fillRect(0, 0, sz, sz)
  return new THREE.CanvasTexture(cv)
}

// Aurora at ~120 km altitude — floats just above globe surface
const GLOBE_R    = 100
const AURORA_ALT = 120  // km

function latLngAltToXYZ(lat: number, lng: number, altKm: number): [number, number, number] {
  const r   = GLOBE_R * (1 + altKm / 6371)
  const phi = (90 - lat)  * (Math.PI / 180)
  const th  = (lng + 180) * (Math.PI / 180)
  return [-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th)]
}

function updateAuroraBuffer(data: AuroraPoint[], THREE: any, points: any) {
  if (!points) return
  const n    = data.length
  const pos  = new Float32Array(n * 3)
  const cols = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const d = data[i]
    const [x, y, z] = latLngAltToXYZ(d.lat, d.lng, AURORA_ALT)
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

export default function UC20Page() {
  const globeRef    = useRef<HTMLDivElement>(null)
  const globeInst   = useRef<any>(null)
  const filteredRef = useRef<AuroraPoint[]>([])
  const pointsRef   = useRef<any>(null)
  const threeRef    = useRef<any>(null)

  const [status,      setStatus]      = useState<StatusT>("loading")
  const [errorMsg,    setErrorMsg]    = useState("")
  const [weather,     setWeather]     = useState<SpaceWeather | null>(null)
  const [isSpinning,  setIsSpinning]  = useState(true)
  const [hemiFilter,  setHemiFilter]  = useState<HemiFilter>("both")
  const [minProb,     setMinProb]     = useState(10)
  const [liveTime,    setLiveTime]    = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setLiveTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Parse aurora points from raw NOAA coords
  const allAuroraPoints = useMemo((): AuroraPoint[] => {
    if (!weather) return []
    return weather.auroraCoords
      .filter(c => Array.isArray(c) && c[2] > 0)
      .map(c => {
        const lng  = c[0] > 180 ? c[0] - 360 : c[0]
        const lat  = c[1]
        const prob = c[2]
        return { lat, lng, prob, color: auroraColor(prob) }
      })
  }, [weather])

  const filtered = useMemo(() => {
    return allAuroraPoints.filter(p => {
      if (p.prob < minProb) return false
      if (hemiFilter === "north" && p.lat < 0) return false
      if (hemiFilter === "south" && p.lat > 0) return false
      return true
    })
  }, [allAuroraPoints, hemiFilter, minProb])

  const fetchWeather = useCallback(async () => {
    try {
      const res = await fetch("/api/space-weather")
      if (!res.ok) throw new Error(`API ${res.status}`)
      const d: SpaceWeather = await res.json()
      setWeather(d)
    } catch (err: any) {
      if (!weather) { setErrorMsg(err?.message ?? "Unknown"); setStatus("error") }
    }
  }, [weather])

  useEffect(() => {
    fetchWeather().then(() => setStatus("ready"))
  }, [fetchWeather])

  useEffect(() => {
    if (status !== "ready") return
    const t = setInterval(fetchWeather, 300_000)  // 5 min
    return () => clearInterval(t)
  }, [status, fetchWeather])

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
        .atmosphereColor("#00ff88")
        .atmosphereAltitude(0.15)
        .pointOfView({ lat: 75, lng: 0, altitude: 1.8 })  // polar view for aurora

      const ctrl = globe.controls()
      ctrl.autoRotate = true; ctrl.autoRotateSpeed = 0.3
      ctrl.enableDamping = true; ctrl.dampingFactor = 0.1
      globeInst.current = globe

      const geo = new THREE.BufferGeometry()
      const mat = new THREE.PointsMaterial({
        size: 5, map: makeAuroraTexture(THREE), vertexColors: true,
        transparent: true, alphaTest: 0.01, sizeAttenuation: false, depthWrite: false,
      })
      const pts = new THREE.Points(geo, mat)
      pts.renderOrder = 999
      globe.scene().add(pts)
      pointsRef.current = pts
      updateAuroraBuffer(filteredRef.current, THREE, pts)

      let t = 0
      const blink = () => {
        animId = requestAnimationFrame(blink)
        t += 0.025
        mat.opacity = 0.4 + 0.6 * Math.abs(Math.sin(t))
        mat.needsUpdate = true
      }
      animId = requestAnimationFrame(blink)
    })

    return () => {
      cancelAnimationFrame(animId)
      if (pointsRef.current) { pointsRef.current.geometry?.dispose?.(); pointsRef.current.material?.dispose?.(); pointsRef.current = null }
      globe?.controls()?.dispose?.()
      globeInst.current = null
    }
  }, [status])

  useEffect(() => {
    filteredRef.current = filtered
    if (pointsRef.current && threeRef.current) updateAuroraBuffer(filtered, threeRef.current, pointsRef.current)
  }, [filtered])

  useEffect(() => {
    if (!globeInst.current) return
    globeInst.current.controls().autoRotate = isSpinning
  }, [isSpinning])

  const kp = weather ? kpLabel(weather.currentKp) : { text: "—", color: "var(--muted)" }
  const fmtTime = (d: Date) => d.toUTCString().replace("GMT", "UTC").slice(5, 25)

  if (status === "loading") return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: "calc(100vh - 64px)", background: "var(--bg)" }}>
      <div className="text-center max-w-sm">
        <div className="mb-6 relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: "#00ff88", borderRightColor: "#44ffcc" }} />
          <div className="absolute inset-3 rounded-full flex items-center justify-center" style={{ background: "rgba(0,255,136,0.1)" }}>
            <span className="text-xl">🌌</span>
          </div>
        </div>
        <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--text)" }}>Loading space weather…</h2>
        <p className="text-sm" style={{ color: "var(--muted)" }}>Fetching NOAA aurora oval and solar wind data</p>
      </div>
    </div>
  )

  if (status === "error") return (
    <div className="flex flex-col items-center justify-center gap-4" style={{ minHeight: "calc(100vh - 64px)", background: "var(--bg)" }}>
      <span className="text-4xl">⚠️</span>
      <p className="text-lg font-semibold" style={{ color: "var(--text)" }}>Failed to load space weather</p>
      <p className="text-sm" style={{ color: "var(--muted)" }}>{errorMsg}</p>
      <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "#00aa44", color: "#fff" }}>Retry</button>
    </div>
  )

  return (
    <div className="relative" style={{ minHeight: "calc(100vh - 64px)", background: "#000" }}>
      <div ref={globeRef} className="absolute inset-0" />

      {/* Top bar */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-4 pointer-events-none">
        <div className="pointer-events-auto">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-lg font-bold" style={{ color: "var(--text)" }}>🌌 Space Weather & Aurora</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(0,255,136,0.15)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.3)" }}>LIVE</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Aurora pts",  val: filtered.length.toLocaleString() },
              { label: "Kp Index",    val: weather ? weather.currentKp.toFixed(1) : "—" },
              { label: "Solar Wind",  val: weather ? `${Math.round(weather.solarWindSpeed)} km/s` : "—" },
              { label: "UTC",         val: fmtTime(liveTime) },
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
          <Link href="/uc20/details" className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.25)", color: "#00ff88", backdropFilter: "blur(8px)" }}>Architecture →</Link>
        </div>
      </div>

      {/* Filter panel */}
      <div className="absolute bottom-4 left-4 pointer-events-auto w-56">
        <div className="rounded-xl p-3" style={{ background: "rgba(0,0,0,0.78)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(14px)" }}>
          <p className="text-xs font-semibold tracking-wider mb-2" style={{ color: "var(--muted)" }}>HEMISPHERE</p>
          <div className="flex gap-1 mb-4">
            {(["both","north","south"] as HemiFilter[]).map(h => (
              <button key={h} onClick={() => setHemiFilter(h)}
                className="flex-1 py-1.5 rounded-lg text-xs font-medium capitalize"
                style={{ background: hemiFilter === h ? "rgba(0,255,136,0.2)" : "transparent", border: hemiFilter === h ? "1px solid rgba(0,255,136,0.4)" : "1px solid rgba(255,255,255,0.1)", color: hemiFilter === h ? "#00ff88" : "var(--muted)" }}>
                {h}
              </button>
            ))}
          </div>
          <p className="text-xs font-semibold tracking-wider mb-2" style={{ color: "var(--muted)" }}>MIN PROBABILITY</p>
          <div className="flex gap-1">
            {[5, 10, 30, 50].map(p => (
              <button key={p} onClick={() => setMinProb(p)}
                className="flex-1 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: minProb === p ? "rgba(0,255,136,0.2)" : "transparent", border: minProb === p ? "1px solid rgba(0,255,136,0.4)" : "1px solid rgba(255,255,255,0.1)", color: minProb === p ? "#00ff88" : "var(--muted)" }}>
                {p}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Space weather stats panel */}
      {weather && (
        <div className="absolute bottom-4 right-4 pointer-events-auto w-72">
          <div className="rounded-xl p-4" style={{ background: "rgba(0,0,0,0.88)", border: "1px solid rgba(0,255,136,0.2)", backdropFilter: "blur(14px)" }}>
            <p className="text-xs font-semibold tracking-wider mb-3" style={{ color: "var(--muted)" }}>SPACE WEATHER CONDITIONS</p>

            {/* Kp gauge */}
            <div className="mb-3 p-3 rounded-lg" style={{ background: kp.color + "12", border: `1px solid ${kp.color}30` }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs" style={{ color: "var(--muted)" }}>Kp Index</span>
                <span className="text-xs font-semibold" style={{ color: kp.color }}>{kp.text}</span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold" style={{ color: kp.color }}>{weather.currentKp.toFixed(1)}</span>
                <span className="text-xs mb-1" style={{ color: "var(--muted)" }}>/ 9.0</span>
              </div>
              <div className="w-full rounded-full h-1.5 mt-2" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, (weather.currentKp / 9) * 100)}%`, background: kp.color }} />
              </div>
            </div>

            {/* Solar wind metrics */}
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: "Solar Wind", val: `${Math.round(weather.solarWindSpeed)} km/s`, sub: "speed" },
                { label: "Density",    val: `${weather.solarWindDensity.toFixed(1)}`, sub: "p/cm³" },
                { label: "Bz (IMF)",   val: `${weather.bz.toFixed(1)} nT`, sub: weather.bz < -5 ? "storm driver" : "stable" },
              ].map(m => (
                <div key={m.label} className="rounded-lg px-2 py-1.5 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-xs mb-0.5" style={{ color: "var(--muted)" }}>{m.label}</p>
                  <p className="text-xs font-bold" style={{ color: m.label === "Bz (IMF)" && weather.bz < -5 ? "#ff4444" : "var(--text)" }}>{m.val}</p>
                  <p className="text-xs opacity-50" style={{ color: "var(--muted)" }}>{m.sub}</p>
                </div>
              ))}
            </div>

            {weather.forecastTime && (
              <p className="text-xs mt-2 text-center" style={{ color: "var(--muted)" }}>
                Forecast: {weather.forecastTime.replace("T", " ").slice(0, 16)} UTC
              </p>
            )}
          </div>
        </div>
      )}

      {/* Aurora scale legend */}
      {!weather?.currentKp || weather.currentKp < 4 ? null : (
        <div className="absolute top-20 right-4 pointer-events-none px-3 py-2 rounded-xl" style={{ background: "rgba(0,0,0,0.65)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(10px)" }}>
          <p className="text-xs font-semibold mb-1" style={{ color: "#ff4444" }}>⚠ Geomagnetic Storm Active</p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>Aurora may be visible at lower latitudes</p>
        </div>
      )}
    </div>
  )
}

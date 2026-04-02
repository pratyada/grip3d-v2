"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import Link from "next/link"

// ── Types ──────────────────────────────────────────────────────────────────────

type StationType = "ev" | "gas"
type ConnectorType = "CCS" | "CHAdeMO" | "Type 2" | "Tesla" | "Other"
type GasFuelType = "petrol" | "diesel" | "lpg" | "cng"
type FilterTab = "all" | "ev" | "gas"
type ConnectorFilter = "all" | ConnectorType

interface Station {
  id: string
  name: string
  lat: number
  lng: number
  type: StationType
  color: string
  // EV fields
  connectors?: ConnectorType[]
  powerKw?: number
  operator?: string
  // Gas fields
  fuelTypes?: GasFuelType[]
  brand?: string
  // Common
  address?: string
  country?: string
}

// ── Constants ──────────────────────────────────────────────────────────────────

const CONNECTOR_COLORS: Record<ConnectorType, string> = {
  CCS:      "#44ff88",
  CHAdeMO:  "#44ffcc",
  "Type 2": "#88ff44",
  Tesla:    "#cc44ff",
  Other:    "#88ffee",
}

const GAS_COLORS: Record<GasFuelType | "default", string> = {
  petrol:  "#ff4444",
  diesel:  "#ff6622",
  lpg:     "#ff8844",
  cng:     "#ffaa44",
  default: "#ff4444",
}

function stationColor(s: Station): string {
  if (s.type === "ev") {
    const primary = s.connectors?.[0]
    return primary ? CONNECTOR_COLORS[primary] : CONNECTOR_COLORS.Other
  }
  const primary = s.fuelTypes?.[0]
  return primary ? GAS_COLORS[primary] : GAS_COLORS.default
}

type StatusT = "loading" | "ready" | "error"

// ── Globe helpers ──────────────────────────────────────────────────────────────

const GLOBE_R = 100

function latLngToXYZ(lat: number, lng: number): [number, number, number] {
  const r     = GLOBE_R * 1.003
  const phi   = (90 - lat) * (Math.PI / 180)
  const theta = (90 - lng) * (Math.PI / 180)
  return [
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  ]
}

function makeStationTexture(THREE: any): any {
  const sz  = 32
  const cv  = document.createElement("canvas")
  cv.width  = cv.height = sz
  const ctx = cv.getContext("2d")!
  const cx  = sz / 2
  const grd = ctx.createRadialGradient(cx, cx, 0, cx, cx, sz / 2)
  grd.addColorStop(0,   "rgba(255,255,255,1)")
  grd.addColorStop(0.2, "rgba(255,255,255,0.8)")
  grd.addColorStop(0.5, "rgba(255,255,255,0.3)")
  grd.addColorStop(1,   "rgba(255,255,255,0)")
  ctx.fillStyle = grd
  ctx.fillRect(0, 0, sz, sz)
  return new THREE.CanvasTexture(cv)
}

function updateStationBuffer(data: Station[], THREE: any, points: any) {
  if (!points) return
  const n    = data.length
  const pos  = new Float32Array(n * 3)
  const cols = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const d        = data[i]
    const [x, y, z] = latLngToXYZ(d.lat, d.lng)
    pos[i * 3]     = x
    pos[i * 3 + 1] = y
    pos[i * 3 + 2] = z
    const c        = new THREE.Color(d.color)
    cols[i * 3]    = c.r
    cols[i * 3 + 1]= c.g
    cols[i * 3 + 2]= c.b
  }
  const geo = points.geometry
  geo.setAttribute("position", new THREE.BufferAttribute(pos,  3))
  geo.setAttribute("color",    new THREE.BufferAttribute(cols, 3))
  geo.setDrawRange(0, n)
  geo.computeBoundingSphere()
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function UC09Page() {
  const globeRef    = useRef<HTMLDivElement>(null)
  const globeInst   = useRef<any>(null)
  const filteredRef = useRef<Station[]>([])
  const pointsRef   = useRef<any>(null)
  const threeRef    = useRef<any>(null)

  const [status,          setStatus]         = useState<StatusT>("loading")
  const [errorMsg,        setErrorMsg]       = useState("")
  const [stations,        setStations]       = useState<Station[]>([])
  const [selected,        setSelected]       = useState<Station | null>(null)
  const [isSpinning,      setIsSpinning]     = useState(true)
  const [tabFilter,       setTabFilter]      = useState<FilterTab>("all")
  const [connFilter,      setConnFilter]     = useState<ConnectorFilter>("all")

  // ── Fetch stations ───────────────────────────────────────────────────────────

  const fetchStations = useCallback(async () => {
    try {
      const res = await fetch("/api/ev-stations")
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const data: Station[] = await res.json()
      // Assign colors based on type/connector
      const coloured = data.map(s => ({ ...s, color: stationColor(s) }))
      setStations(coloured)
    } catch (err: any) {
      if (stations.length === 0) {
        setErrorMsg(err?.message ?? "Unknown error")
        setStatus("error")
      }
    }
  }, [stations.length])

  useEffect(() => {
    fetchStations().then(() => setStatus("ready"))
  }, [fetchStations])

  // ── Filtered set ─────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return stations.filter(s => {
      if (tabFilter === "ev"  && s.type !== "ev")  return false
      if (tabFilter === "gas" && s.type !== "gas") return false
      if (tabFilter === "ev" && connFilter !== "all") {
        if (!s.connectors?.includes(connFilter as ConnectorType)) return false
      }
      return true
    })
  }, [stations, tabFilter, connFilter])

  // ── Stats ─────────────────────────────────────────────────────────────────────

  const evTotal   = useMemo(() => stations.filter(s => s.type === "ev").length,  [stations])
  const gasTotal  = useMemo(() => stations.filter(s => s.type === "gas").length, [stations])
  const evRatio   = useMemo(() => {
    const total = evTotal + gasTotal
    return total > 0 ? ((evTotal / total) * 100).toFixed(1) : "0.0"
  }, [evTotal, gasTotal])

  // Energy Transition Index: EV % of visible filtered set
  const transitionPct = useMemo(() => {
    const evCount  = filtered.filter(s => s.type === "ev").length
    return filtered.length > 0 ? ((evCount / filtered.length) * 100).toFixed(1) : "0.0"
  }, [filtered])

  // ── Globe init ───────────────────────────────────────────────────────────────

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
        .atmosphereColor("#44ff88")
        .atmosphereAltitude(0.1)
        .pointOfView({ lat: 30, lng: 10, altitude: 2.4 })

      const ctrl = globe.controls()
      ctrl.autoRotate      = true
      ctrl.autoRotateSpeed = 0.15
      ctrl.enableDamping   = true
      ctrl.dampingFactor   = 0.1
      globeInst.current = globe

      // Points layer
      const geo = new THREE.BufferGeometry()
      const mat = new THREE.PointsMaterial({
        size: 7,
        map: makeStationTexture(THREE),
        vertexColors: true,
        transparent: true,
        alphaTest: 0.01,
        sizeAttenuation: false,
        depthWrite: false,
      })
      const pts = new THREE.Points(geo, mat)
      pts.renderOrder = 999
      globe.scene().add(pts)
      pointsRef.current = pts
      updateStationBuffer(filteredRef.current, THREE, pts)

      // Gentle pulse
      let t = 0
      const pulse = () => {
        animId = requestAnimationFrame(pulse)
        t += 0.04
        mat.opacity = 0.65 + 0.35 * Math.abs(Math.sin(t))
        mat.needsUpdate = true
      }
      animId = requestAnimationFrame(pulse)

      // Click handler
      const canvas = globeRef.current!
      const onClick = (e: MouseEvent) => {
        if (!pointsRef.current) return
        const rect  = canvas.getBoundingClientRect()
        const mouse = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width)  * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1,
        )
        const rc = new THREE.Raycaster()
        rc.params.Points = { threshold: 3 }
        rc.setFromCamera(mouse, globe.camera())
        const hits = rc.intersectObject(pointsRef.current)
        if (hits.length > 0 && hits[0].index != null) {
          const s = filteredRef.current[hits[0].index]
          if (s) {
            setSelected(s)
            setIsSpinning(false)
            globe.pointOfView({ lat: s.lat, lng: s.lng, altitude: 1.6 }, 700)
          }
        }
      }
      canvas.addEventListener("click", onClick)
      ;(canvas as any)._stationClick = onClick
    })

    return () => {
      cancelAnimationFrame(animId)
      const canvas = globeRef.current
      if (canvas && (canvas as any)._stationClick)
        canvas.removeEventListener("click", (canvas as any)._stationClick)
      if (pointsRef.current) {
        pointsRef.current.geometry?.dispose?.()
        pointsRef.current.material?.dispose?.()
        pointsRef.current = null
      }
      globe?.controls()?.dispose?.()
      globeInst.current = null
    }
  }, [status])

  // Sync filtered → buffer
  useEffect(() => {
    filteredRef.current = filtered
    if (pointsRef.current && threeRef.current)
      updateStationBuffer(filtered, threeRef.current, pointsRef.current)
  }, [filtered])

  // Sync spinning
  useEffect(() => {
    if (!globeInst.current) return
    globeInst.current.controls().autoRotate = isSpinning
  }, [isSpinning])

  // ── Loading / Error screens ───────────────────────────────────────────────────

  if (status === "loading") return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: "calc(100vh - 64px)", background: "var(--bg)" }}>
      <div className="text-center max-w-sm">
        <div className="mb-6 relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
            style={{ borderTopColor: "#44ff88", borderRightColor: "#ff4444" }} />
          <div className="absolute inset-3 rounded-full flex items-center justify-center"
            style={{ background: "rgba(68,255,136,0.12)" }}>
            <span className="text-xl">⚡</span>
          </div>
        </div>
        <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--text)" }}>Loading station data…</h2>
        <p className="text-sm" style={{ color: "var(--muted)" }}>Fetching EV charging and gas station locations worldwide</p>
      </div>
    </div>
  )

  if (status === "error") return (
    <div className="flex flex-col items-center justify-center gap-4" style={{ minHeight: "calc(100vh - 64px)", background: "var(--bg)" }}>
      <span className="text-4xl">⚠️</span>
      <p className="text-lg font-semibold" style={{ color: "var(--text)" }}>Failed to load station data</p>
      <p className="text-sm" style={{ color: "var(--muted)" }}>{errorMsg}</p>
      <button onClick={() => window.location.reload()}
        className="px-4 py-2 rounded-lg text-sm font-medium"
        style={{ background: "#44ff88", color: "#000" }}>
        Retry
      </button>
    </div>
  )

  // ── Main render ───────────────────────────────────────────────────────────────

  return (
    <div className="relative" style={{ minHeight: "calc(100vh - 64px)", background: "#000" }}>
      <div ref={globeRef} className="absolute inset-0" />

      {/* Top bar */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-4 pointer-events-none">
        <div className="pointer-events-auto">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-lg font-bold" style={{ color: "var(--text)" }}>⚡ EV &amp; Fuel Stations</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: "rgba(68,255,136,0.15)", color: "#44ff88", border: "1px solid rgba(68,255,136,0.3)" }}>
              GLOBAL
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "EV Stations",  val: evTotal.toString(),    color: "#44ff88" },
              { label: "Gas Stations", val: gasTotal.toString(),   color: "#ff4444" },
              { label: "EV/Gas Ratio", val: `${evRatio}% EV`,     color: "#88ffcc" },
              { label: "Showing",      val: filtered.length.toString(), color: "var(--text)" },
            ].map(s => (
              <div key={s.label} className="px-3 py-1.5 rounded-lg text-xs"
                style={{ background: "rgba(0,0,0,0.65)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", color: s.color }}>
                <span style={{ color: "var(--muted)" }}>{s.label} </span>
                <span className="font-semibold">{s.val}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 pointer-events-auto">
          <button onClick={() => setIsSpinning(s => !s)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "rgba(0,0,0,0.65)", border: "1px solid rgba(255,255,255,0.15)", color: "var(--muted)", backdropFilter: "blur(8px)" }}>
            {isSpinning ? "⏸ Pause" : "▶ Spin"}
          </button>
          <Link href="/uc9/details"
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "rgba(68,255,136,0.1)", border: "1px solid rgba(68,255,136,0.3)", color: "#44ff88", backdropFilter: "blur(8px)" }}>
            Architecture →
          </Link>
        </div>
      </div>

      {/* Sidebar */}
      <div className="absolute top-24 left-4 pointer-events-auto w-60">
        <div className="rounded-xl p-3" style={{ background: "rgba(0,0,0,0.78)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(14px)" }}>
          {/* Tab filter */}
          <p className="text-xs font-semibold tracking-wider mb-2" style={{ color: "var(--muted)" }}>TYPE FILTER</p>
          <div className="flex gap-1 mb-3">
            {(["all", "ev", "gas"] as FilterTab[]).map(tab => {
              const active = tabFilter === tab
              const colors: Record<FilterTab, string> = { all: "#88ffcc", ev: "#44ff88", gas: "#ff4444" }
              const labels: Record<FilterTab, string> = { all: "All", ev: "EV Charging", gas: "Gas Stations" }
              return (
                <button key={tab}
                  onClick={() => { setTabFilter(tab); setSelected(null) }}
                  className="flex-1 py-1 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: active ? colors[tab] + "22" : "transparent",
                    border: active ? `1px solid ${colors[tab]}` : "1px solid transparent",
                    color: active ? colors[tab] : "var(--muted)",
                  }}>
                  {labels[tab]}
                </button>
              )
            })}
          </div>

          {/* Connector sub-filter (EV only) */}
          {tabFilter === "ev" && (
            <>
              <p className="text-xs font-semibold tracking-wider mb-2" style={{ color: "var(--muted)" }}>CONNECTOR</p>
              <div className="flex flex-col gap-1 mb-3">
                {(["all", "CCS", "CHAdeMO", "Type 2", "Tesla"] as (ConnectorFilter)[]).map(c => {
                  const active = connFilter === c
                  const col    = c === "all" ? "#88ffcc" : CONNECTOR_COLORS[c as ConnectorType]
                  const count  = c === "all"
                    ? stations.filter(s => s.type === "ev").length
                    : stations.filter(s => s.type === "ev" && s.connectors?.includes(c as ConnectorType)).length
                  return (
                    <button key={c}
                      onClick={() => setConnFilter(c)}
                      className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-left"
                      style={{
                        background: active ? col + "20" : "transparent",
                        border: active ? `1px solid ${col}` : "1px solid transparent",
                        color: active ? col : "var(--muted)",
                      }}>
                      <span className="flex items-center gap-2">
                        {c !== "all" && <span className="w-2 h-2 rounded-full" style={{ background: col }} />}
                        {c === "all" ? "All Connectors" : c}
                      </span>
                      <span className="font-mono opacity-60">{count}</span>
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* Energy Transition Index */}
          <div className="rounded-lg p-3 mb-1" style={{ background: "rgba(68,255,136,0.05)", border: "1px solid rgba(68,255,136,0.15)" }}>
            <p className="text-xs font-semibold tracking-wider mb-2" style={{ color: "#44ff88" }}>ENERGY TRANSITION INDEX</p>
            <div className="flex items-end gap-2 mb-1.5">
              <span className="text-2xl font-bold" style={{ color: "#44ff88" }}>{transitionPct}%</span>
              <span className="text-xs pb-1" style={{ color: "var(--muted)" }}>EV in view</span>
            </div>
            <div className="w-full rounded-full h-2" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${transitionPct}%`,
                  background: `linear-gradient(90deg, #44ff88, #88ffcc)`,
                }} />
            </div>
            <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
              {parseFloat(transitionPct) >= 50
                ? "EV infrastructure leads in this view"
                : "Gas stations still outnumber EV chargers"}
            </p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 pointer-events-auto w-56">
        <div className="rounded-xl p-3" style={{ background: "rgba(0,0,0,0.78)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(14px)" }}>
          <p className="text-xs font-semibold tracking-wider mb-2" style={{ color: "var(--muted)" }}>LEGEND</p>
          <div className="flex flex-col gap-1.5">
            {[
              { color: "#44ff88", label: "EV — CCS" },
              { color: "#44ffcc", label: "EV — CHAdeMO" },
              { color: "#88ff44", label: "EV — Type 2" },
              { color: "#cc44ff", label: "EV — Tesla" },
              { color: "#ff4444", label: "Gas Station" },
              { color: "#ff8844", label: "Gas — LPG / CNG" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                <span className="text-xs" style={{ color: "var(--muted)" }}>{item.label}</span>
              </div>
            ))}
          </div>
          <p className="text-xs mt-3 pt-2" style={{ color: "rgba(255,255,255,0.25)", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            EV data: Open Charge Map · Gas data: NREL / OSM
          </p>
        </div>
      </div>

      {/* Selected station panel */}
      {selected && (
        <div className="absolute bottom-4 right-4 pointer-events-auto w-72">
          <div className="rounded-xl p-4"
            style={{
              background: "rgba(0,0,0,0.88)",
              border: `1px solid ${selected.color}44`,
              backdropFilter: "blur(14px)",
            }}>
            <div className="flex items-start justify-between mb-3">
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: selected.color }} />
                  <p className="text-sm font-bold leading-tight" style={{ color: "var(--text)" }}>{selected.name}</p>
                </div>
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  {selected.type === "ev" ? "EV Charging Station" : "Gas Station"}
                  {selected.country ? ` · ${selected.country}` : ""}
                </p>
              </div>
              <button onClick={() => setSelected(null)}
                className="opacity-40 hover:opacity-80 text-base flex-shrink-0"
                style={{ color: "var(--muted)" }}>
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {selected.type === "ev" ? (
                <>
                  {[
                    { label: "Connectors",   val: selected.connectors?.join(", ") ?? "—" },
                    { label: "Max Power",    val: selected.powerKw ? `${selected.powerKw} kW` : "—" },
                    { label: "Operator",     val: selected.operator ?? "—" },
                    { label: "Address",      val: selected.address ?? "—" },
                    { label: "Latitude",     val: `${selected.lat.toFixed(3)}°` },
                    { label: "Longitude",    val: `${selected.lng.toFixed(3)}°` },
                  ].map(m => (
                    <div key={m.label} className="rounded-lg px-2 py-1.5"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>{m.label}</p>
                      <p className="text-xs font-semibold truncate" style={{ color: "var(--text)" }}>{m.val}</p>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {[
                    { label: "Brand",      val: selected.brand ?? "—" },
                    { label: "Fuel Types", val: selected.fuelTypes?.join(", ") ?? "—" },
                    { label: "Address",    val: selected.address ?? "—" },
                    { label: "Latitude",   val: `${selected.lat.toFixed(3)}°` },
                    { label: "Longitude",  val: `${selected.lng.toFixed(3)}°` },
                    { label: "Country",    val: selected.country ?? "—" },
                  ].map(m => (
                    <div key={m.label} className="rounded-lg px-2 py-1.5"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>{m.label}</p>
                      <p className="text-xs font-semibold truncate" style={{ color: "var(--text)" }}>{m.val}</p>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Charging speed badge for EV */}
            {selected.type === "ev" && selected.powerKw && (
              <div className="text-xs text-center py-1.5 rounded-lg"
                style={{
                  background: selected.color + "18",
                  color: selected.color,
                  border: `1px solid ${selected.color}40`,
                }}>
                {selected.powerKw >= 100
                  ? `DC Ultra-Fast · ${selected.powerKw} kW`
                  : selected.powerKw >= 50
                  ? `DC Fast Charge · ${selected.powerKw} kW`
                  : selected.powerKw >= 7
                  ? `AC Level 2 · ${selected.powerKw} kW`
                  : `AC Level 1 · ${selected.powerKw} kW`}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

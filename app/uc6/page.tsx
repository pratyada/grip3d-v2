"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import Link from "next/link"

// ── Types ─────────────────────────────────────────────────────────────────────

type RadioKey = "GSM" | "UMTS" | "LTE" | "NR"
type FilterKey = "all" | RadioKey

interface TowerPoint {
  id: string
  lat: number
  lng: number
  radio: RadioKey
  mcc: number
  mnc: number
  range: number
  color: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const RADIO_COLORS: Record<RadioKey, string> = {
  GSM:  "#44ff88",
  UMTS: "#ffcc44",
  LTE:  "#44aaff",
  NR:   "#ff44aa",
}

const RADIO_LABELS: Record<RadioKey, string> = {
  GSM:  "2G GSM",
  UMTS: "3G UMTS",
  LTE:  "4G LTE",
  NR:   "5G NR",
}

const FILTER_KEYS: FilterKey[] = ["all", "GSM", "UMTS", "LTE", "NR"]

const GLOBE_R = 100

// ── Coordinate helper ─────────────────────────────────────────────────────────

function latLngToXYZ(lat: number, lng: number): [number, number, number] {
  const r     = GLOBE_R * 1.003
  const phi   = (90 - lat)  * (Math.PI / 180)
  const theta = (90 - lng) * (Math.PI / 180)
  return [r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta)]
}

// ── Buffer update ─────────────────────────────────────────────────────────────

function updateTowerBuffer(data: TowerPoint[], THREE: any, points: any) {
  if (!points) return
  const n    = data.length
  const pos  = new Float32Array(n * 3)
  const cols = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const d = data[i]
    const [x, y, z] = latLngToXYZ(d.lat, d.lng)
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z
    const c = new THREE.Color(d.color)
    cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b
  }
  const geo = points.geometry
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3))
  geo.setAttribute("color",    new THREE.BufferAttribute(cols, 3))
  geo.setDrawRange(0, n)
  geo.computeBoundingSphere()
}

// ── Signal range helper ───────────────────────────────────────────────────────

function rangeLabel(radio: RadioKey, range: number): string {
  if (range > 0) {
    if (range >= 1000) return `${(range / 1000).toFixed(1)} km`
    return `${range} m`
  }
  // fallback estimates
  const defaults: Record<RadioKey, string> = {
    GSM:  "~1–35 km",
    UMTS: "~0.5–10 km",
    LTE:  "~0.5–15 km",
    NR:   "~0.1–5 km",
  }
  return defaults[radio]
}

// ── Operator name helper ──────────────────────────────────────────────────────

function mccCountry(mcc: number): string {
  const MAP: Record<number, string> = {
    310: "USA", 311: "USA", 312: "USA", 313: "USA", 314: "USA", 315: "USA",
    302: "Canada", 334: "Mexico", 724: "Brazil", 722: "Argentina",
    234: "UK", 208: "France", 262: "Germany", 222: "Italy", 214: "Spain",
    404: "India", 405: "India", 460: "China", 440: "Japan", 450: "South Korea",
    505: "Australia", 520: "Thailand", 510: "Indonesia", 515: "Philippines",
    605: "Morocco", 621: "Nigeria", 655: "South Africa", 639: "Kenya",
    250: "Russia", 255: "Ukraine", 228: "Switzerland", 232: "Austria",
    204: "Netherlands", 206: "Belgium", 238: "Denmark", 240: "Sweden",
    244: "Finland", 242: "Norway",
  }
  return MAP[mcc] ?? `MCC ${mcc}`
}

// ── Status type ───────────────────────────────────────────────────────────────

type StatusT = "loading" | "ready" | "error"

// ── Main component ────────────────────────────────────────────────────────────

export default function UC06Page() {
  const globeRef    = useRef<HTMLDivElement>(null)
  const globeInst   = useRef<any>(null)
  const filteredRef = useRef<TowerPoint[]>([])
  const pointsRef   = useRef<any>(null)
  const threeRef    = useRef<any>(null)

  const [status,      setStatus]      = useState<StatusT>("loading")
  const [errorMsg,    setErrorMsg]    = useState("")
  const [towers,      setTowers]      = useState<TowerPoint[]>([])
  const [selected,    setSelected]    = useState<TowerPoint | null>(null)
  const [isSpinning,  setIsSpinning]  = useState(true)
  const [radioFilter, setRadioFilter] = useState<FilterKey>("all")

  // ── Fetch towers ──────────────────────────────────────────────────────────

  const fetchTowers = useCallback(async () => {
    try {
      const res = await fetch("/api/cell-towers")
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const data: Omit<TowerPoint, "color">[] = await res.json()
      const pts: TowerPoint[] = data.map(t => ({
        ...t,
        color: RADIO_COLORS[t.radio] ?? "#ffffff",
      }))
      setTowers(pts)
    } catch (err: any) {
      if (towers.length === 0) {
        setErrorMsg(err?.message ?? "Unknown error")
        setStatus("error")
      }
    }
  }, [towers.length])

  useEffect(() => {
    fetchTowers().then(() => setStatus("ready"))
  }, [fetchTowers])

  // ── Derived filtered list ─────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return radioFilter === "all" ? towers : towers.filter(t => t.radio === radioFilter)
  }, [towers, radioFilter])

  // ── Counts ────────────────────────────────────────────────────────────────

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = { all: towers.length, GSM: 0, UMTS: 0, LTE: 0, NR: 0 }
    for (const t of towers) c[t.radio] = (c[t.radio] ?? 0) + 1
    return c
  }, [towers])

  // ── Globe init ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (status !== "ready" || !globeRef.current || globeInst.current) return
    let globe: any

    Promise.all([import("globe.gl"), import("three")]).then(([globeMod, THREE]) => {
      if (!globeRef.current) return
      threeRef.current = THREE
      const GlobeGL = (globeMod.default ?? globeMod) as any
      globe = new GlobeGL()
      globe(globeRef.current)
        .width(globeRef.current.clientWidth)
        .height(globeRef.current.clientHeight)
        .globeImageUrl("//unpkg.com/three-globe/example/img/earth-dark.jpg")
        .bumpImageUrl("//unpkg.com/three-globe/example/img/earth-topology.png")
        .backgroundImageUrl("//unpkg.com/three-globe/example/img/night-sky.png")
        .atmosphereColor("#1a6fff")
        .atmosphereAltitude(0.1)
        .pointOfView({ lat: 30, lng: 10, altitude: 2.4 })

      const ctrl = globe.controls()
      ctrl.autoRotate      = true
      ctrl.autoRotateSpeed = 0.18
      ctrl.enableDamping   = true
      ctrl.dampingFactor   = 0.1
      globeInst.current = globe

      // Build Three.js point cloud
      const geo = new THREE.BufferGeometry()
      const mat = new THREE.PointsMaterial({
        size:           3.5,
        vertexColors:   true,
        sizeAttenuation: false,
        transparent:    true,
        opacity:        0.85,
        depthWrite:     false,
      })
      const pts = new THREE.Points(geo, mat)
      pts.renderOrder = 999
      globe.scene().add(pts)
      pointsRef.current = pts
      updateTowerBuffer(filteredRef.current, THREE, pts)

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
        rc.params.Points = { threshold: 2 }
        rc.setFromCamera(mouse, globe.camera())
        const hits = rc.intersectObject(pointsRef.current)
        if (hits.length > 0 && hits[0].index != null) {
          const tower = filteredRef.current[hits[0].index]
          if (tower) {
            setSelected(tower)
            setIsSpinning(false)
            globe.pointOfView({ lat: tower.lat, lng: tower.lng, altitude: 1.6 }, 700)
          }
        }
      }
      canvas.addEventListener("click", onClick)
      ;(canvas as any)._towerClick = onClick
    })

    return () => {
      const canvas = globeRef.current
      if (canvas && (canvas as any)._towerClick) {
        canvas.removeEventListener("click", (canvas as any)._towerClick)
      }
      if (pointsRef.current) {
        pointsRef.current.geometry?.dispose?.()
        pointsRef.current.material?.dispose?.()
        pointsRef.current = null
      }
      globe?.controls()?.dispose?.()
      globeInst.current = null
    }
  }, [status])

  // ── Sync filtered data to globe ───────────────────────────────────────────

  useEffect(() => {
    filteredRef.current = filtered
    if (pointsRef.current && threeRef.current) {
      updateTowerBuffer(filtered, threeRef.current, pointsRef.current)
    }
  }, [filtered])

  // ── Spin control ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!globeInst.current) return
    globeInst.current.controls().autoRotate = isSpinning
  }, [isSpinning])

  // ── Resize handler ────────────────────────────────────────────────────────

  useEffect(() => {
    const onResize = () => {
      if (globeInst.current && globeRef.current) {
        globeInst.current
          .width(globeRef.current.clientWidth)
          .height(globeRef.current.clientHeight)
      }
    }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  // ── Loading / error screens ───────────────────────────────────────────────

  if (status === "loading") return (
    <div className="flex flex-col items-center justify-center"
      style={{ minHeight: "calc(100vh - 64px)", background: "var(--bg)" }}>
      <div className="text-center max-w-sm">
        <div className="mb-6 relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
            style={{ borderTopColor: "#44aaff", borderRightColor: "#44ff88" }} />
          <div className="absolute inset-3 rounded-full flex items-center justify-center"
            style={{ background: "rgba(68,170,255,0.15)" }}>
            <span className="text-xl">📡</span>
          </div>
        </div>
        <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--text)" }}>
          Loading cell tower data…
        </h2>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Fetching global 2G/3G/LTE/5G tower locations
        </p>
      </div>
    </div>
  )

  if (status === "error") return (
    <div className="flex flex-col items-center justify-center gap-4"
      style={{ minHeight: "calc(100vh - 64px)", background: "var(--bg)" }}>
      <span className="text-4xl">⚠️</span>
      <p className="text-lg font-semibold" style={{ color: "var(--text)" }}>
        Failed to load tower data
      </p>
      <p className="text-sm" style={{ color: "var(--muted)" }}>{errorMsg}</p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 rounded-lg text-sm font-medium"
        style={{ background: "#44aaff", color: "#000" }}>
        Retry
      </button>
    </div>
  )

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <div className="relative" style={{ minHeight: "calc(100vh - 64px)", background: "#000" }}>
      {/* Globe canvas */}
      <div ref={globeRef} className="absolute inset-0" />

      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-4 pointer-events-none">
        <div className="pointer-events-auto">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-lg font-bold" style={{ color: "var(--text)" }}>
              📡 Cell Tower Density
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: "rgba(68,170,255,0.2)", color: "#44aaff", border: "1px solid rgba(68,170,255,0.35)" }}>
              OpenCelliD
            </span>
          </div>
          <p className="text-xs mb-2" style={{ color: "var(--muted)" }}>
            Global 2G/3G/LTE/5G Coverage
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Total towers", val: counts.all.toLocaleString() },
              { label: "Showing",      val: filtered.length.toLocaleString() },
              { label: "Filter",       val: radioFilter === "all" ? "All types" : RADIO_LABELS[radioFilter as RadioKey] },
            ].map(s => (
              <div key={s.label} className="px-3 py-1.5 rounded-lg text-xs"
                style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", color: "var(--text)" }}>
                <span style={{ color: "var(--muted)" }}>{s.label} </span>
                <span className="font-semibold">{s.val}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setIsSpinning(s => !s)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)", color: "var(--muted)", backdropFilter: "blur(8px)" }}>
            {isSpinning ? "⏸ Pause" : "▶ Spin"}
          </button>
          <Link href="/uc6/details"
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "rgba(68,170,255,0.12)", border: "1px solid rgba(68,170,255,0.3)", color: "#44aaff", backdropFilter: "blur(8px)" }}>
            About this data →
          </Link>
        </div>
      </div>

      {/* ── Radio type filter panel ─────────────────────────────────────────── */}
      <div className="absolute bottom-4 left-4 pointer-events-auto w-52">
        <div className="rounded-xl p-3"
          style={{ background: "rgba(0,0,0,0.78)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(14px)" }}>
          <p className="text-xs font-semibold tracking-wider mb-2" style={{ color: "var(--muted)" }}>
            RADIO TYPE
          </p>
          <div className="flex flex-col gap-1">
            {FILTER_KEYS.map(key => {
              const active = radioFilter === key
              const color  = key === "all" ? "rgba(255,255,255,0.7)" : RADIO_COLORS[key as RadioKey]
              const label  = key === "all" ? "All Types" : RADIO_LABELS[key as RadioKey]
              const count  = counts[key]
              return (
                <button
                  key={key}
                  onClick={() => { setRadioFilter(key); setSelected(null) }}
                  className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-left transition-all"
                  style={{
                    background: active ? color + "22" : "transparent",
                    border:     active ? `1px solid ${color}` : "1px solid transparent",
                    color:      active ? color : "var(--muted)",
                  }}>
                  <span className="flex items-center gap-2">
                    {key !== "all" && (
                      <span className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: RADIO_COLORS[key as RadioKey] }} />
                    )}
                    {label}
                  </span>
                  <span className="font-mono opacity-60">{count.toLocaleString()}</span>
                </button>
              )
            })}
          </div>

          {/* Legend dots */}
          <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-xs mb-1.5" style={{ color: "var(--muted)" }}>Signal reach (typ.)</p>
            {(["GSM", "UMTS", "LTE", "NR"] as RadioKey[]).map(r => (
              <div key={r} className="flex items-center justify-between text-xs mb-0.5">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: RADIO_COLORS[r] }} />
                  <span style={{ color: "var(--muted)" }}>{RADIO_LABELS[r]}</span>
                </span>
                <span style={{ color: RADIO_COLORS[r] }} className="font-mono text-xs opacity-80">
                  {r === "GSM" ? "35 km" : r === "UMTS" ? "10 km" : r === "LTE" ? "15 km" : "5 km"}
                </span>
              </div>
            ))}
          </div>

          {/* Attribution */}
          <p className="mt-3 text-xs text-center" style={{ color: "var(--muted)", opacity: 0.6 }}>
            Powered by OpenCelliD
          </p>
        </div>
      </div>

      {/* ── Selected tower panel ───────────────────────────────────────────── */}
      {selected && (
        <div className="absolute bottom-4 right-4 pointer-events-auto w-72">
          <div className="rounded-xl p-4"
            style={{
              background:    "rgba(0,0,0,0.88)",
              border:        `1px solid ${RADIO_COLORS[selected.radio]}44`,
              backdropFilter: "blur(14px)",
            }}>
            <div className="flex items-start justify-between mb-3">
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: RADIO_COLORS[selected.radio] }} />
                  <p className="text-sm font-bold" style={{ color: RADIO_COLORS[selected.radio] }}>
                    {RADIO_LABELS[selected.radio]}
                  </p>
                </div>
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  {mccCountry(selected.mcc)}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="opacity-40 hover:opacity-80 text-base flex-shrink-0"
                style={{ color: "var(--muted)" }}>
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: "Radio",      val: RADIO_LABELS[selected.radio] },
                { label: "Country",    val: mccCountry(selected.mcc) },
                { label: "MCC",        val: selected.mcc.toString() },
                { label: "MNC",        val: selected.mnc.toString().padStart(2, "0") },
                { label: "Latitude",   val: `${selected.lat.toFixed(4)}°` },
                { label: "Longitude",  val: `${selected.lng.toFixed(4)}°` },
                { label: "Signal Range", val: rangeLabel(selected.radio, selected.range), },
                { label: "Tower ID",   val: selected.id },
              ].map(m => (
                <div key={m.label} className="rounded-lg px-2 py-1.5"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{m.label}</p>
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>{m.val}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                Operator: MCC {selected.mcc} / MNC {selected.mnc.toString().padStart(2, "0")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Empty state overlay ────────────────────────────────────────────── */}
      {towers.length === 0 && status === "ready" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center p-8 rounded-2xl"
            style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <span className="text-3xl block mb-3">📡</span>
            <p className="text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>
              No tower data available
            </p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Check API configuration or try refreshing
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import Link from "next/link"

// ── Types ─────────────────────────────────────────────────────────────────────

type RadioKey  = "GSM" | "UMTS" | "LTE" | "NR"
type FilterKey = "all" | RadioKey
type ViewMode  = "heatmap" | "towers"

interface TowerPoint {
  id: string
  lat: number
  lng: number
  radio: RadioKey
  mcc: number
  mnc: number
  range: number
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

// ── Heatmap colour scale ───────────────────────────────────────────────────────
// Low density → deep blue, high density → hot orange/white

function hexBinColor(weight: number, maxWeight: number): string {
  const t = Math.min(weight / maxWeight, 1)
  if (t < 0.2)  return `rgba(30, 100, 255, ${0.5 + t * 2})`
  if (t < 0.4)  return `rgba(0, 180, 255, ${0.7 + t})`
  if (t < 0.6)  return `rgba(0, 255, 180, 0.9)`
  if (t < 0.8)  return `rgba(255, 220, 0, 0.95)`
  return `rgba(255, ${Math.floor(80 - t * 80)}, 0, 1.0)`
}

function hexBinAlt(weight: number, maxWeight: number): number {
  return Math.max(0.005, Math.min((weight / maxWeight) * 0.35, 0.35))
}

// ── MCC → country helper ──────────────────────────────────────────────────────

function mccCountry(mcc: number): string {
  const MAP: Record<number, string> = {
    310: "USA", 311: "USA", 312: "USA", 313: "USA", 314: "USA", 315: "USA",
    302: "Canada", 334: "Mexico", 724: "Brazil", 722: "Argentina",
    732: "Colombia", 716: "Peru", 730: "Chile",
    234: "UK", 208: "France", 262: "Germany", 222: "Italy", 214: "Spain",
    204: "Netherlands", 206: "Belgium", 238: "Denmark", 240: "Sweden",
    244: "Finland", 242: "Norway", 228: "Switzerland", 232: "Austria",
    260: "Poland", 226: "Romania", 230: "Czech Republic", 286: "Turkey",
    404: "India", 405: "India", 460: "China", 440: "Japan", 450: "South Korea",
    454: "Hong Kong", 466: "Taiwan", 525: "Singapore", 502: "Malaysia",
    505: "Australia", 530: "New Zealand", 515: "Philippines",
    510: "Indonesia", 520: "Thailand", 452: "Vietnam", 414: "Myanmar",
    413: "Sri Lanka", 470: "Bangladesh", 410: "Pakistan",
    605: "Morocco", 602: "Egypt", 604: "Morocco", 608: "Senegal",
    621: "Nigeria", 655: "South Africa", 639: "Kenya", 640: "Tanzania",
    636: "Ethiopia", 630: "DR Congo", 620: "Ghana",
    250: "Russia", 255: "Ukraine", 401: "Kazakhstan", 434: "Uzbekistan",
    424: "UAE", 420: "Saudi Arabia", 425: "Israel", 432: "Iran",
  }
  return MAP[mcc] ?? `MCC ${mcc}`
}

function rangeLabel(radio: RadioKey, range: number): string {
  if (range > 0) {
    if (range >= 1000) return `${(range / 1000).toFixed(1)} km`
    return `${range} m`
  }
  const defaults: Record<RadioKey, string> = {
    GSM: "~1–35 km", UMTS: "~0.5–10 km", LTE: "~0.5–15 km", NR: "~0.1–5 km",
  }
  return defaults[radio]
}

// ── Status ────────────────────────────────────────────────────────────────────

type StatusT = "loading" | "ready" | "error"

// ── Component ─────────────────────────────────────────────────────────────────

export default function UC06Page() {
  const globeRef  = useRef<HTMLDivElement>(null)
  const globeInst = useRef<any>(null)

  const [status,      setStatus]      = useState<StatusT>("loading")
  const [errorMsg,    setErrorMsg]    = useState("")
  const [towers,      setTowers]      = useState<TowerPoint[]>([])
  const [selected,    setSelected]    = useState<TowerPoint | null>(null)
  const [hoveredHex,  setHoveredHex]  = useState<{ count: number; lat: number; lng: number } | null>(null)
  const [isSpinning,  setIsSpinning]  = useState(true)
  const [radioFilter, setRadioFilter] = useState<FilterKey>("all")
  const [viewMode,    setViewMode]    = useState<ViewMode>("heatmap")

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchTowers = useCallback(async () => {
    try {
      const res = await fetch("/api/cell-towers")
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const data: TowerPoint[] = await res.json()
      setTowers(data)
      setStatus("ready")
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Unknown error")
      setStatus("error")
    }
  }, [])

  useEffect(() => { fetchTowers() }, [fetchTowers])

  // ── Derived ────────────────────────────────────────────────────────────────

  const filtered = useMemo(() =>
    radioFilter === "all" ? towers : towers.filter(t => t.radio === radioFilter),
    [towers, radioFilter])

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = { all: towers.length, GSM: 0, UMTS: 0, LTE: 0, NR: 0 }
    for (const t of towers) c[t.radio] = (c[t.radio] ?? 0) + 1
    return c
  }, [towers])

  // ── Globe init ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (status !== "ready" || !globeRef.current || globeInst.current) return

    import("globe.gl").then(mod => {
      if (!globeRef.current) return
      const GlobeGL = (mod.default ?? mod) as any

      const globe = new GlobeGL()
      globe(globeRef.current)
        .width(globeRef.current.clientWidth)
        .height(globeRef.current.clientHeight)
        .globeImageUrl("//unpkg.com/three-globe/example/img/earth-night.jpg")
        .bumpImageUrl("//unpkg.com/three-globe/example/img/earth-topology.png")
        .backgroundImageUrl("//unpkg.com/three-globe/example/img/night-sky.png")
        .atmosphereColor("#1a6fff")
        .atmosphereAltitude(0.12)
        .pointOfView({ lat: 25, lng: 15, altitude: 2.2 })

      globe.controls().autoRotate      = true
      globe.controls().autoRotateSpeed = 0.15
      globe.controls().enableDamping   = true
      globe.controls().dampingFactor   = 0.1

      globeInst.current = globe

      // Initial heatmap render
      applyHeatmap(globe, towers, "all")
    })

    return () => {
      globeInst.current?.controls()?.dispose?.()
      globeInst.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  // ── Apply heatmap mode ─────────────────────────────────────────────────────

  function applyHeatmap(globe: any, data: TowerPoint[], filter: FilterKey) {
    const pts = filter === "all" ? data : data.filter(t => t.radio === filter)
    if (!pts.length) return

    // Compute max bin weight by pre-binning with resolution 3
    // We use resolution=3 (hex side ~300 km) for global overview
    let maxW = 1
    const binMap: Record<string, number> = {}
    for (const t of pts) {
      const key = `${Math.round(t.lat / 3)},${Math.round(t.lng / 3)}`
      binMap[key] = (binMap[key] ?? 0) + 1
      if (binMap[key] > maxW) maxW = binMap[key]
    }

    globe
      .pointsData([])
      .hexBinPointsData(pts)
      .hexBinPointLat((d: any) => d.lat)
      .hexBinPointLng((d: any) => d.lng)
      .hexBinPointWeight(() => 1)
      .hexBinResolution(3)
      .hexMargin(0.15)
      .hexTopColor((d: any) => hexBinColor(d.sumWeight, maxW))
      .hexSideColor((d: any) => hexBinColor(d.sumWeight, maxW).replace("rgb", "rgba").replace(")", ", 0.6)").replace("rgba(", "rgba("))
      .hexAltitude((d: any) => hexBinAlt(d.sumWeight, maxW))
      .onHexBinHover((bin: any) => {
        if (bin) setHoveredHex({ count: bin.sumWeight, lat: bin.points[0]?.lat ?? 0, lng: bin.points[0]?.lng ?? 0 })
        else setHoveredHex(null)
      })
      .onHexBinClick((bin: any) => {
        if (bin?.points?.length) {
          const t = bin.points[0] as TowerPoint
          setSelected(t)
          globe.pointOfView({ lat: t.lat, lng: t.lng, altitude: 1.4 }, 700)
          setIsSpinning(false)
        }
      })
  }

  // ── Apply tower mode ───────────────────────────────────────────────────────

  function applyTowers(globe: any, data: TowerPoint[], filter: FilterKey) {
    const pts = filter === "all" ? data : data.filter(t => t.radio === filter)

    globe
      .hexBinPointsData([])
      .pointsData(pts)
      .pointLat((d: any) => d.lat)
      .pointLng((d: any) => d.lng)
      .pointColor((d: any) => RADIO_COLORS[d.radio as RadioKey] ?? "#ffffff")
      .pointAltitude(0.002)
      .pointRadius(0.08)
      .pointResolution(4)
      .onPointHover((pt: any) => {
        if (globeRef.current) {
          globeRef.current.style.cursor = pt ? "pointer" : "default"
        }
      })
      .onPointClick((pt: any) => {
        if (pt) {
          setSelected(pt as TowerPoint)
          globe.pointOfView({ lat: pt.lat, lng: pt.lng, altitude: 1.4 }, 700)
          setIsSpinning(false)
        }
      })
  }

  // ── Sync view mode + filter to globe ─────────────────────────────────────

  useEffect(() => {
    if (!globeInst.current || status !== "ready") return
    setSelected(null)
    if (viewMode === "heatmap") {
      applyHeatmap(globeInst.current, towers, radioFilter)
    } else {
      applyTowers(globeInst.current, towers, radioFilter)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, radioFilter, towers, status])

  // ── Spin control ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!globeInst.current) return
    globeInst.current.controls().autoRotate = isSpinning
  }, [isSpinning])

  // ── Resize ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const onResize = () => {
      if (globeInst.current && globeRef.current) {
        globeInst.current.width(globeRef.current.clientWidth).height(globeRef.current.clientHeight)
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
          Fetching global 2G/3G/LTE/5G tower locations from OSM
        </p>
      </div>
    </div>
  )

  if (status === "error") return (
    <div className="flex flex-col items-center justify-center gap-4"
      style={{ minHeight: "calc(100vh - 64px)", background: "var(--bg)" }}>
      <span className="text-4xl">⚠️</span>
      <p className="text-lg font-semibold" style={{ color: "var(--text)" }}>Failed to load tower data</p>
      <p className="text-sm" style={{ color: "var(--muted)" }}>{errorMsg}</p>
      <button onClick={() => { setStatus("loading"); fetchTowers() }}
        className="px-4 py-2 rounded-lg text-sm font-medium"
        style={{ background: "#44aaff", color: "#000" }}>
        Retry
      </button>
    </div>
  )

  // ── Heatmap legend gradient bar ───────────────────────────────────────────

  const legendGradient = "linear-gradient(to right, rgba(30,100,255,0.8), rgba(0,255,180,0.9), rgba(255,220,0,1), rgba(255,80,0,1))"

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <div className="relative" style={{ minHeight: "calc(100vh - 64px)", background: "#000" }}>
      <div ref={globeRef} className="absolute inset-0" />

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-4 pointer-events-none">
        <div className="pointer-events-auto">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base font-bold" style={{ color: "var(--text)" }}>
              📡 Cell Tower Density
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: "rgba(68,170,255,0.2)", color: "#44aaff", border: "1px solid rgba(68,170,255,0.35)" }}>
              {towers.length.toLocaleString()} towers
            </span>
          </div>
          <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>
            Global 2G/3G/LTE/5G Coverage — OSM + OpenCelliD
          </p>

          {/* View mode toggle */}
          <div className="flex gap-1.5">
            {(["heatmap", "towers"] as ViewMode[]).map(m => (
              <button key={m} onClick={() => setViewMode(m)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: viewMode === m ? "rgba(68,170,255,0.25)" : "rgba(0,0,0,0.6)",
                  border:     viewMode === m ? "1px solid rgba(68,170,255,0.6)" : "1px solid rgba(255,255,255,0.12)",
                  color:      viewMode === m ? "#44aaff" : "var(--muted)",
                  backdropFilter: "blur(8px)",
                }}>
                {m === "heatmap" ? "🌡 Density Heatmap" : "📍 Individual Towers"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button onClick={() => setIsSpinning(s => !s)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)", color: "var(--muted)", backdropFilter: "blur(8px)" }}>
            {isSpinning ? "⏸ Pause" : "▶ Spin"}
          </button>
          <Link href="/uc6/details"
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "rgba(68,170,255,0.12)", border: "1px solid rgba(68,170,255,0.3)", color: "#44aaff", backdropFilter: "blur(8px)" }}>
            About →
          </Link>
        </div>
      </div>

      {/* ── Left panel: radio filter + legend ───────────────────────────────── */}
      <div className="absolute bottom-4 left-4 pointer-events-auto w-52">
        <div className="rounded-xl p-3"
          style={{ background: "rgba(0,0,0,0.78)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(14px)" }}>

          {/* Radio filter */}
          <p className="text-xs font-semibold tracking-wider mb-2" style={{ color: "var(--muted)" }}>
            RADIO TYPE FILTER
          </p>
          <div className="flex flex-col gap-1">
            {FILTER_KEYS.map(key => {
              const active = radioFilter === key
              const color  = key === "all" ? "rgba(255,255,255,0.7)" : RADIO_COLORS[key as RadioKey]
              const label  = key === "all" ? "All Types" : RADIO_LABELS[key as RadioKey]
              return (
                <button key={key}
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
                  <span className="font-mono opacity-60">{counts[key].toLocaleString()}</span>
                </button>
              )
            })}
          </div>

          {/* Heatmap legend */}
          {viewMode === "heatmap" && (
            <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-xs mb-1.5" style={{ color: "var(--muted)" }}>Tower density</p>
              <div className="h-2.5 rounded-full mb-1" style={{ background: legendGradient }} />
              <div className="flex justify-between text-xs" style={{ color: "var(--muted)" }}>
                <span>Low</span><span>Medium</span><span>High</span>
              </div>
              <p className="mt-1.5 text-xs" style={{ color: "var(--muted)", opacity: 0.7 }}>
                Column height = density
              </p>
            </div>
          )}

          {/* Tower mode legend */}
          {viewMode === "towers" && (
            <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-xs mb-1.5" style={{ color: "var(--muted)" }}>Signal reach</p>
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
          )}

          <p className="mt-3 text-xs text-center" style={{ color: "var(--muted)", opacity: 0.5 }}>
            OSM · OpenCelliD
          </p>
        </div>
      </div>

      {/* ── Hex hover tooltip ────────────────────────────────────────────────── */}
      {viewMode === "heatmap" && hoveredHex && !selected && (
        <div className="absolute bottom-4 right-4 pointer-events-none">
          <div className="rounded-xl p-3 text-sm"
            style={{ background: "rgba(0,0,0,0.85)", border: "1px solid rgba(68,170,255,0.3)", backdropFilter: "blur(12px)" }}>
            <p className="font-semibold" style={{ color: "#44aaff" }}>
              {hoveredHex.count.toLocaleString()} tower{hoveredHex.count !== 1 ? "s" : ""}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>in this hex cell</p>
          </div>
        </div>
      )}

      {/* ── Selected tower panel ─────────────────────────────────────────────── */}
      {selected && (
        <div className="absolute bottom-4 right-4 pointer-events-auto w-72">
          <div className="rounded-xl p-4"
            style={{
              background: "rgba(0,0,0,0.88)",
              border: `1px solid ${RADIO_COLORS[selected.radio]}44`,
              backdropFilter: "blur(14px)",
            }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: RADIO_COLORS[selected.radio] }} />
                  <p className="text-sm font-bold" style={{ color: RADIO_COLORS[selected.radio] }}>
                    {RADIO_LABELS[selected.radio]}
                  </p>
                </div>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{mccCountry(selected.mcc)}</p>
              </div>
              <button onClick={() => setSelected(null)}
                className="opacity-40 hover:opacity-80 text-base"
                style={{ color: "var(--muted)" }}>✕</button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: "Radio",        val: RADIO_LABELS[selected.radio] },
                { label: "Country",      val: mccCountry(selected.mcc) },
                { label: "MCC",          val: selected.mcc.toString() },
                { label: "MNC",          val: selected.mnc.toString().padStart(2, "0") },
                { label: "Latitude",     val: `${selected.lat.toFixed(4)}°` },
                { label: "Longitude",    val: `${selected.lng.toFixed(4)}°` },
                { label: "Signal Range", val: rangeLabel(selected.radio, selected.range) },
                { label: "Tower ID",     val: selected.id },
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
    </div>
  )
}

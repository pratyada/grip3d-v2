"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import Link from "next/link"

// ── Types ─────────────────────────────────────────────────────────────────────

type RadioKey  = "GSM" | "UMTS" | "LTE" | "NR"
type FilterKey = "all" | RadioKey
type ViewMode  = "heatmap" | "towers"

interface DensityPoint {
  lat: number
  lng: number
  towers: number
  radio: RadioKey
  mcc: number
}

interface SampleTower {
  lat: number
  lng: number
  radio: RadioKey
  mcc: number
  towers: number
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

// ── Plasma colour scale ────────────────────────────────────────────────────────

function hexBinColor(t: number): string {
  if (t < 0.15) return `rgba(13, 8, 135, ${0.5 + t * 2})`
  if (t < 0.30) return `rgba(84, 2, 163, ${0.65 + t})`
  if (t < 0.45) return `rgba(139, 10, 165, 0.85)`
  if (t < 0.60) return `rgba(185, 50, 137, 0.90)`
  if (t < 0.75) return `rgba(219, 92, 104, 0.92)`
  if (t < 0.88) return `rgba(245, 144, 60, 0.95)`
  return `rgba(253, 231, 37, 1.0)`
}

function hexBinAlt(t: number): number {
  return Math.max(0.003, t * t * 0.4)
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
    272: "Ireland", 268: "Portugal", 216: "Hungary", 202: "Greece",
    404: "India", 405: "India", 460: "China", 440: "Japan", 450: "South Korea",
    454: "Hong Kong", 466: "Taiwan", 525: "Singapore", 502: "Malaysia",
    505: "Australia", 530: "New Zealand", 515: "Philippines",
    510: "Indonesia", 520: "Thailand", 452: "Vietnam", 414: "Myanmar",
    413: "Sri Lanka", 470: "Bangladesh", 410: "Pakistan",
    604: "Morocco", 602: "Egypt", 608: "Senegal",
    621: "Nigeria", 655: "South Africa", 639: "Kenya", 640: "Tanzania",
    636: "Ethiopia", 630: "DR Congo", 620: "Ghana", 612: "Ivory Coast",
    250: "Russia", 255: "Ukraine", 401: "Kazakhstan", 434: "Uzbekistan",
    424: "UAE", 420: "Saudi Arabia", 425: "Israel", 432: "Iran",
    282: "Georgia", 400: "Azerbaijan",
  }
  return MAP[mcc] ?? `MCC ${mcc}`
}

// ── Format helpers ────────────────────────────────────────────────────────────

function formatTowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `${(n / 1000).toFixed(0)}K`
  return n.toString()
}

// ── Sample tower generator ────────────────────────────────────────────────────

function generateSampleTowers(cells: DensityPoint[], filter: FilterKey): SampleTower[] {
  const samples: SampleTower[] = []
  for (const cell of cells) {
    if (filter !== "all" && cell.radio !== filter) continue
    const n = Math.min(8, Math.max(1, Math.floor(Math.log10(cell.towers + 1))))
    for (let i = 0; i < n; i++) {
      samples.push({
        lat:    cell.lat + (Math.random() - 0.5) * 2.5,
        lng:    cell.lng + (Math.random() - 0.5) * 2.5,
        radio:  cell.radio,
        mcc:    cell.mcc,
        towers: cell.towers,
      })
    }
  }
  return samples
}

// ── Status ────────────────────────────────────────────────────────────────────

type StatusT = "loading" | "ready" | "error"

// ── Component ─────────────────────────────────────────────────────────────────

export default function UC06Page() {
  const globeRef  = useRef<HTMLDivElement>(null)
  const globeInst = useRef<any>(null)

  const [status,      setStatus]      = useState<StatusT>("loading")
  const [errorMsg,    setErrorMsg]    = useState("")
  const [cells,       setCells]       = useState<DensityPoint[]>([])
  const [selectedHex, setSelectedHex] = useState<{ sumWeight: number; lat: number; lng: number; radio: RadioKey; mcc: number } | null>(null)
  const [hoveredHex,  setHoveredHex]  = useState<{ sumWeight: number; lat: number; lng: number } | null>(null)
  const [isSpinning,  setIsSpinning]  = useState(true)
  const [radioFilter, setRadioFilter] = useState<FilterKey>("all")
  const [viewMode,    setViewMode]    = useState<ViewMode>("heatmap")

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchCells = useCallback(async () => {
    try {
      const res = await fetch("/api/cell-towers", { cache: "no-store" })
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const data: DensityPoint[] = await res.json()
      setCells(data)
      setStatus("ready")
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Unknown error")
      setStatus("error")
    }
  }, [])

  useEffect(() => { fetchCells() }, [fetchCells])

  // ── Derived ────────────────────────────────────────────────────────────────

  const totalTowers = useMemo(
    () => cells.reduce((s, d) => s + d.towers, 0),
    [cells],
  )

  const countsPerRadio = useMemo(() => {
    const c: Record<FilterKey, number> = { all: 0, GSM: 0, UMTS: 0, LTE: 0, NR: 0 }
    for (const d of cells) {
      c.all       += d.towers
      c[d.radio]  = (c[d.radio] ?? 0) + d.towers
    }
    return c
  }, [cells])

  const filteredCells = useMemo(
    () => radioFilter === "all" ? cells : cells.filter(d => d.radio === radioFilter),
    [cells, radioFilter],
  )

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
        .atmosphereColor("#1a3fff")
        .atmosphereAltitude(0.14)
        .pointOfView({ lat: 22, lng: 80, altitude: 2.4 })

      globe.controls().autoRotate      = true
      globe.controls().autoRotateSpeed = 0.18
      globe.controls().enableDamping   = true
      globe.controls().dampingFactor   = 0.1

      globeInst.current = globe
      applyHeatmap(globe, cells, "all")
    })

    return () => {
      globeInst.current?.controls()?.dispose?.()
      globeInst.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  // ── Apply heatmap mode ─────────────────────────────────────────────────────

  function applyHeatmap(globe: any, data: DensityPoint[], filter: FilterKey) {
    const pts = filter === "all" ? data : data.filter(d => d.radio === filter)
    if (!pts.length) return

    // Compute max sumWeight to normalise colour
    let maxW = 1
    const binMap: Record<string, number> = {}
    for (const d of pts) {
      const key = `${Math.round(d.lat / 5)},${Math.round(d.lng / 5)}`
      binMap[key] = (binMap[key] ?? 0) + Math.pow(d.towers, 0.45)
      if (binMap[key] > maxW) maxW = binMap[key]
    }

    globe
      .pointsData([])
      .hexBinPointsData(pts)
      .hexBinPointLat((d: any) => d.lat)
      .hexBinPointLng((d: any) => d.lng)
      .hexBinPointWeight((d: any) => Math.pow(d.towers, 0.45))
      .hexBinResolution(3)
      .hexMargin(0.12)
      .hexTopColor((d: any) => {
        const t = Math.min(d.sumWeight / maxW, 1)
        return hexBinColor(t)
      })
      .hexSideColor((d: any) => {
        const t = Math.min(d.sumWeight / maxW, 1)
        const base = hexBinColor(t)
        // darken side slightly by replacing last alpha value
        return base.replace(/[\d.]+\)$/, "0.55)")
      })
      .hexAltitude((d: any) => {
        const t = Math.min(d.sumWeight / maxW, 1)
        return hexBinAlt(t)
      })
      .onHexHover((bin: any) => {
        if (bin) {
          const pt = bin.points?.[0] as DensityPoint | undefined
          setHoveredHex({
            sumWeight: bin.sumWeight,
            lat: pt?.lat ?? 0,
            lng: pt?.lng ?? 0,
          })
        } else {
          setHoveredHex(null)
        }
      })
      .onHexClick((bin: any) => {
        if (bin?.points?.length) {
          const pt = bin.points[0] as DensityPoint
          setSelectedHex({
            sumWeight: bin.sumWeight,
            lat: pt.lat,
            lng: pt.lng,
            radio: pt.radio,
            mcc: pt.mcc,
          })
          globe.pointOfView({ lat: pt.lat, lng: pt.lng, altitude: 1.5 }, 700)
          setIsSpinning(false)
        }
      })
  }

  // ── Apply tower mode ───────────────────────────────────────────────────────

  function applyTowers(globe: any, data: DensityPoint[], filter: FilterKey) {
    const samples = generateSampleTowers(data, filter)

    globe
      .hexBinPointsData([])
      .pointsData(samples)
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
          const s = pt as SampleTower
          setSelectedHex({
            sumWeight: s.towers,
            lat: s.lat,
            lng: s.lng,
            radio: s.radio,
            mcc: s.mcc,
          })
          globe.pointOfView({ lat: s.lat, lng: s.lng, altitude: 1.5 }, 700)
          setIsSpinning(false)
        }
      })
  }

  // ── Sync view mode + filter to globe ─────────────────────────────────────

  useEffect(() => {
    if (!globeInst.current || status !== "ready") return
    setSelectedHex(null)
    setHoveredHex(null)
    if (viewMode === "heatmap") {
      applyHeatmap(globeInst.current, cells, radioFilter)
    } else {
      applyTowers(globeInst.current, cells, radioFilter)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, radioFilter, cells, status])

  // ── Spin control ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!globeInst.current) return
    globeInst.current.controls().autoRotate = isSpinning
  }, [isSpinning])

  // ── Resize ────────────────────────────────────────────────────────────────

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
            style={{ borderTopColor: "#ff44aa", borderRightColor: "#fde725" }} />
          <div className="absolute inset-3 rounded-full flex items-center justify-center"
            style={{ background: "rgba(84,2,163,0.25)" }}>
            <span className="text-xl">📡</span>
          </div>
        </div>
        <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--text)" }}>
          Loading tower density data…
        </h2>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Building global 2G / 3G / LTE / 5G heatmap (8M+ towers)
        </p>
      </div>
    </div>
  )

  if (status === "error") return (
    <div className="flex flex-col items-center justify-center gap-4"
      style={{ minHeight: "calc(100vh - 64px)", background: "var(--bg)" }}>
      <span className="text-4xl">⚠️</span>
      <p className="text-lg font-semibold" style={{ color: "var(--text)" }}>Failed to load density data</p>
      <p className="text-sm" style={{ color: "var(--muted)" }}>{errorMsg}</p>
      <button
        onClick={() => { setStatus("loading"); fetchCells() }}
        className="px-4 py-2 rounded-lg text-sm font-medium"
        style={{ background: "#541ec7", color: "#fff" }}>
        Retry
      </button>
    </div>
  )

  // ── Legend gradient (plasma) ──────────────────────────────────────────────

  const legendGradient =
    "linear-gradient(to right, #0d0887, #541ec7, #8b0aa5, #b93289, #db5c68, #f5903c, #fde725)"

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <div className="relative" style={{ minHeight: "calc(100vh - 64px)", background: "#000" }}>
      <div ref={globeRef} className="absolute inset-0" />

      {/* ── Top-left: title + badge + view toggle ────────────────────────── */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-4 pointer-events-none">
        <div className="pointer-events-auto">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base font-bold" style={{ color: "var(--text)" }}>
              Tower Pulse
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{
                background: "rgba(253,231,37,0.15)",
                color: "#fde725",
                border: "1px solid rgba(253,231,37,0.35)",
              }}>
              {formatTowers(totalTowers)} towers
            </span>
          </div>
          <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>
            Global 2G / 3G / LTE / 5G Density — TRAI 2024 · Plasma scale
          </p>

          {/* View mode toggle */}
          <div className="flex gap-1.5">
            {(["heatmap", "towers"] as ViewMode[]).map(m => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background:     viewMode === m ? "rgba(84,2,163,0.35)" : "rgba(0,0,0,0.6)",
                  border:         viewMode === m ? "1px solid rgba(139,10,165,0.7)" : "1px solid rgba(255,255,255,0.12)",
                  color:          viewMode === m ? "#fde725" : "var(--muted)",
                  backdropFilter: "blur(8px)",
                }}>
                {m === "heatmap" ? "Density Heatmap" : "Individual Towers"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setIsSpinning(s => !s)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{
              background:     "rgba(0,0,0,0.6)",
              border:         "1px solid rgba(255,255,255,0.15)",
              color:          "var(--muted)",
              backdropFilter: "blur(8px)",
            }}>
            {isSpinning ? "Pause" : "Spin"}
          </button>
          <Link
            href="/uc6/details"
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{
              background:     "rgba(84,2,163,0.18)",
              border:         "1px solid rgba(139,10,165,0.4)",
              color:          "#b93289",
              backdropFilter: "blur(8px)",
            }}>
            About →
          </Link>
        </div>
      </div>

      {/* ── Bottom-left: radio filter + legend ───────────────────────────── */}
      <div className="absolute bottom-4 left-4 pointer-events-auto w-56">
        <div
          className="rounded-xl p-3"
          style={{
            background:     "rgba(0,0,0,0.80)",
            border:         "1px solid rgba(255,255,255,0.10)",
            backdropFilter: "blur(14px)",
          }}>

          <p className="text-xs font-semibold tracking-wider mb-2" style={{ color: "var(--muted)" }}>
            RADIO TYPE
          </p>

          <div className="flex flex-col gap-1">
            {FILTER_KEYS.map(key => {
              const active = radioFilter === key
              const color  = key === "all" ? "rgba(255,255,255,0.7)" : RADIO_COLORS[key as RadioKey]
              const label  = key === "all" ? "All Types" : RADIO_LABELS[key as RadioKey]
              const count  = countsPerRadio[key]
              return (
                <button
                  key={key}
                  onClick={() => { setRadioFilter(key); setSelectedHex(null) }}
                  className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-left transition-all"
                  style={{
                    background: active ? color + "22" : "transparent",
                    border:     active ? `1px solid ${color}` : "1px solid transparent",
                    color:      active ? color : "var(--muted)",
                  }}>
                  <span className="flex items-center gap-2">
                    {key !== "all" && (
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: RADIO_COLORS[key as RadioKey] }}
                      />
                    )}
                    {label}
                  </span>
                  <span className="font-mono opacity-60">{formatTowers(count)}</span>
                </button>
              )
            })}
          </div>

          {/* Heatmap legend */}
          {viewMode === "heatmap" && (
            <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-xs mb-1.5" style={{ color: "var(--muted)" }}>Plasma scale</p>
              <div className="h-2.5 rounded-full mb-1" style={{ background: legendGradient }} />
              <div className="flex justify-between text-xs" style={{ color: "var(--muted)" }}>
                <span>Low</span><span>High</span>
              </div>
              <p className="mt-1 text-xs" style={{ color: "var(--muted)", opacity: 0.6 }}>
                Low density → High density (Plasma scale)
              </p>
            </div>
          )}

          {/* Tower mode legend */}
          {viewMode === "towers" && (
            <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-xs mb-1.5" style={{ color: "var(--muted)" }}>Generation</p>
              {(["GSM", "UMTS", "LTE", "NR"] as RadioKey[]).map(r => (
                <div key={r} className="flex items-center justify-between text-xs mb-0.5">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: RADIO_COLORS[r] }} />
                    <span style={{ color: "var(--muted)" }}>{RADIO_LABELS[r]}</span>
                  </span>
                  <span style={{ color: RADIO_COLORS[r] }} className="font-mono text-xs opacity-80">
                    {r === "GSM" ? "2G" : r === "UMTS" ? "3G" : r === "LTE" ? "4G" : "5G"}
                  </span>
                </div>
              ))}
            </div>
          )}

          <p className="mt-3 text-xs text-center" style={{ color: "var(--muted)", opacity: 0.45 }}>
            TRAI 2024 · Estimated BTS counts
          </p>
        </div>
      </div>

      {/* ── Bottom-right: hover tooltip ───────────────────────────────────── */}
      {viewMode === "heatmap" && hoveredHex && !selectedHex && (
        <div className="absolute bottom-4 right-4 pointer-events-none">
          <div
            className="rounded-xl p-3 text-sm"
            style={{
              background:     "rgba(0,0,0,0.88)",
              border:         "1px solid rgba(139,10,165,0.45)",
              backdropFilter: "blur(12px)",
            }}>
            <p className="font-semibold" style={{ color: "#fde725" }}>
              Hex towers: {Math.round(hoveredHex.sumWeight).toLocaleString()}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
              {hoveredHex.lat.toFixed(1)}°, {hoveredHex.lng.toFixed(1)}°
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)", opacity: 0.6 }}>
              Weighted density (power 0.45 scale)
            </p>
          </div>
        </div>
      )}

      {/* ── Bottom-right: selected hex / point details ────────────────────── */}
      {selectedHex && (
        <div className="absolute bottom-4 right-4 pointer-events-auto w-72">
          <div
            className="rounded-xl p-4"
            style={{
              background:     "rgba(0,0,0,0.90)",
              border:         `1px solid ${RADIO_COLORS[selectedHex.radio]}44`,
              backdropFilter: "blur(14px)",
            }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: RADIO_COLORS[selectedHex.radio] }}
                  />
                  <p className="text-sm font-bold" style={{ color: RADIO_COLORS[selectedHex.radio] }}>
                    {RADIO_LABELS[selectedHex.radio]}
                  </p>
                </div>
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  {mccCountry(selectedHex.mcc)}
                </p>
              </div>
              <button
                onClick={() => setSelectedHex(null)}
                className="opacity-40 hover:opacity-80 text-base"
                style={{ color: "var(--muted)" }}>
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: "Radio",        val: RADIO_LABELS[selectedHex.radio] },
                { label: "Country",      val: mccCountry(selectedHex.mcc) },
                { label: "MCC",          val: selectedHex.mcc.toString() },
                { label: "Towers (est)", val: formatTowers(selectedHex.sumWeight) },
                { label: "Latitude",     val: `${selectedHex.lat.toFixed(3)}°` },
                { label: "Longitude",    val: `${selectedHex.lng.toFixed(3)}°` },
              ].map(m => (
                <div
                  key={m.label}
                  className="rounded-lg px-2 py-1.5"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border:     "1px solid rgba(255,255,255,0.06)",
                  }}>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{m.label}</p>
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
                    {m.val}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                Density estimate · MCC {selectedHex.mcc}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

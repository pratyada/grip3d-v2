"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import Link from "next/link"

// ── Types ──────────────────────────────────────────────────────────────────────

interface GdpEntry {
  iso2: string
  iso3: string
  country: string
  gdpUsd: number
  year: number
}

interface FxRates {
  base: string
  date: string
  rates: Record<string, number>
}

interface StockExchange {
  id: string
  name: string
  city: string
  country: string
  iso2: string
  lat: number
  lng: number
  indexName: string
  indexValue: number
  marketCapUsdT: number
  color: string
}

interface CapitalFlow {
  label: string
  srcLat: number
  srcLng: number
  dstLat: number
  dstLng: number
  valueBn: number
  color: string
}

interface FinancialData {
  gdp: GdpEntry[]
  fx: FxRates
  exchanges: StockExchange[]
  flows: CapitalFlow[]
  fetchedAt: string
}

type ViewMode = "gdp" | "exchanges" | "flows"
type StatusT = "loading" | "ready" | "error"

// ── GDP colour scale ───────────────────────────────────────────────────────────
// low GDP → dark gray (#222222), high GDP → gold (#ffcc00)
function gdpToColor(gdpUsd: number, maxGdp: number): string {
  if (!gdpUsd || !maxGdp) return "#222222"
  // Use log scale for better distribution
  const logVal = Math.log10(Math.max(gdpUsd, 1e8))
  const logMax = Math.log10(maxGdp)
  const logMin = Math.log10(1e8)
  const t = Math.max(0, Math.min(1, (logVal - logMin) / (logMax - logMin)))

  // Lerp from dark gray to gold
  const r = Math.round(34  + t * (255 - 34))
  const g = Math.round(34  + t * (204 - 34))
  const b = Math.round(34  + t * (0   - 34))
  return `rgb(${r},${g},${b})`
}

function gdpToColorOpacity(gdpUsd: number, maxGdp: number): number {
  if (!gdpUsd || !maxGdp) return 0.25
  const logVal = Math.log10(Math.max(gdpUsd, 1e8))
  const logMax = Math.log10(maxGdp)
  const logMin = Math.log10(1e8)
  const t = Math.max(0, Math.min(1, (logVal - logMin) / (logMax - logMin)))
  return 0.3 + t * 0.65
}

// ── Formatters ────────────────────────────────────────────────────────────────

function fmtGdp(usd: number): string {
  if (usd >= 1e12) return `$${(usd / 1e12).toFixed(2)}T`
  if (usd >= 1e9)  return `$${(usd / 1e9).toFixed(1)}B`
  if (usd >= 1e6)  return `$${(usd / 1e6).toFixed(1)}M`
  return `$${usd.toFixed(0)}`
}

function fmtFx(val: number | undefined): string {
  if (val == null) return "—"
  return val.toFixed(4)
}

function fmtIndex(val: number): string {
  return val.toLocaleString("en-US", { maximumFractionDigits: 0 })
}

// ── FX display pairs ──────────────────────────────────────────────────────────
// Rates from Frankfurter are USD-based (1 USD = X foreign)
// We display common quote conventions:
const FX_PAIRS: { label: string; key: string; invert: boolean; flag: string }[] = [
  { label: "EUR/USD", key: "EUR", invert: true,  flag: "🇪🇺" },
  { label: "GBP/USD", key: "GBP", invert: true,  flag: "🇬🇧" },
  { label: "USD/JPY", key: "JPY", invert: false, flag: "🇯🇵" },
  { label: "USD/CNY", key: "CNY", invert: false, flag: "🇨🇳" },
  { label: "USD/CAD", key: "CAD", invert: false, flag: "🇨🇦" },
  { label: "AUD/USD", key: "AUD", invert: true,  flag: "🇦🇺" },
]

// ── Static indices display ────────────────────────────────────────────────────
const INDICES = [
  { label: "S&P 500",       region: "🇺🇸", value: 5_780, change: +0.82 },
  { label: "FTSE 100",      region: "🇬🇧", value: 8_260, change: +0.31 },
  { label: "Nikkei 225",    region: "🇯🇵", value: 39_850, change: -0.44 },
  { label: "Shanghai Comp", region: "🇨🇳", value: 3_310, change: +1.12 },
  { label: "Sensex",        region: "🇮🇳", value: 77_200, change: +0.65 },
]

// ── GDP legend scale ──────────────────────────────────────────────────────────
const GDP_LEGEND_STEPS = [
  { label: "<$10B",  color: "#222" },
  { label: "$50B",   color: "rgb(60,55,22)" },
  { label: "$200B",  color: "rgb(100,88,10)" },
  { label: "$500B",  color: "rgb(160,128,0)" },
  { label: "$1T",    color: "rgb(200,160,0)" },
  { label: "$5T+",   color: "#ffcc00" },
]

// ── Main component ────────────────────────────────────────────────────────────

export default function UC21Page() {
  const globeRef     = useRef<HTMLDivElement>(null)
  const globeInst    = useRef<any>(null)
  const dataRef      = useRef<FinancialData | null>(null)

  const [status,          setStatus]          = useState<StatusT>("loading")
  const [errorMsg,        setErrorMsg]        = useState("")
  const [data,            setData]            = useState<FinancialData | null>(null)
  const [viewMode,        setViewMode]        = useState<ViewMode>("gdp")
  const [isSpinning,      setIsSpinning]      = useState(true)
  const [selectedCountry, setSelectedCountry] = useState<GdpEntry | null>(null)
  const [selectedExch,    setSelectedExch]    = useState<StockExchange | null>(null)
  const [globeReady,      setGlobeReady]      = useState(false)

  // ── Fetch financial data ────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/financial-data")
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const json: FinancialData = await res.json()
      setData(json)
      dataRef.current = json
      setStatus("ready")
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Unknown error")
      setStatus("error")
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Derived: GDP map ────────────────────────────────────────────────────────
  const gdpMap = useMemo<Map<string, GdpEntry>>(() => {
    const m = new Map<string, GdpEntry>()
    if (!data) return m
    for (const e of data.gdp) {
      if (e.iso2) m.set(e.iso2.toUpperCase(), e)
      if (e.iso3) m.set(e.iso3.toUpperCase(), e)
    }
    return m
  }, [data])

  const maxGdp = useMemo(() => {
    if (!data) return 1
    return Math.max(...data.gdp.map(e => e.gdpUsd), 1)
  }, [data])

  // ── Globe init ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (status !== "ready" || !globeRef.current || globeInst.current) return
    let globe: any

    import("globe.gl").then(mod => {
      if (!globeRef.current) return
      const GlobeGL = (mod.default ?? mod) as any
      globe = new GlobeGL()

      const d = dataRef.current!
      const gdpMapLocal = new Map<string, GdpEntry>()
      for (const e of d.gdp) {
        if (e.iso2) gdpMapLocal.set(e.iso2.toUpperCase(), e)
        if (e.iso3) gdpMapLocal.set(e.iso3.toUpperCase(), e)
      }
      const localMaxGdp = Math.max(...d.gdp.map(e => e.gdpUsd), 1)

      globe(globeRef.current)
        .width(globeRef.current.clientWidth)
        .height(globeRef.current.clientHeight)
        .globeImageUrl("//unpkg.com/three-globe/example/img/earth-night.jpg")
        .bumpImageUrl("//unpkg.com/three-globe/example/img/earth-topology.png")
        .backgroundImageUrl("//unpkg.com/three-globe/example/img/night-sky.png")
        .atmosphereColor("#ffcc44")
        .atmosphereAltitude(0.15)
        .pointOfView({ lat: 25, lng: 15, altitude: 2.0 })
        // ── GDP choropleth polygons ──────────────────────────────────────────
        .polygonsData(d.gdp.length > 0 ? [] : []) // populated after countries load
        .polygonAltitude(0.005)
        .polygonCapColor((feat: any) => {
          const props = feat?.properties ?? {}
          const iso2  = (props.ISO_A2 ?? props.iso_a2 ?? "").toUpperCase()
          const iso3  = (props.ISO_A3 ?? props.iso_a3 ?? props.ADM0_A3 ?? "").toUpperCase()
          const entry = gdpMapLocal.get(iso2) || gdpMapLocal.get(iso3)
          return entry ? gdpToColor(entry.gdpUsd, localMaxGdp) : "#1a1a1a"
        })
        .polygonSideColor(() => "rgba(50,40,0,0.15)")
        .polygonStrokeColor(() => "rgba(255,200,50,0.12)")
        .polygonLabel((feat: any) => {
          const props = feat?.properties ?? {}
          const iso2  = (props.ISO_A2 ?? props.iso_a2 ?? "").toUpperCase()
          const iso3  = (props.ISO_A3 ?? props.iso_a3 ?? props.ADM0_A3 ?? "").toUpperCase()
          const entry = gdpMapLocal.get(iso2) || gdpMapLocal.get(iso3)
          const name  = props.ADMIN ?? props.NAME ?? props.name ?? "Unknown"
          if (entry) {
            return `<div style="font-family:sans-serif;padding:6px 10px;background:rgba(0,0,0,0.85);border-radius:8px;border:1px solid rgba(255,200,50,0.3);color:#fff;font-size:12px;">
              <b style="color:#ffcc00">${name}</b><br/>
              GDP: ${fmtGdp(entry.gdpUsd)}<br/>
              <span style="color:#aaa">Year: ${entry.year}</span>
            </div>`
          }
          return `<div style="font-family:sans-serif;padding:4px 8px;background:rgba(0,0,0,0.7);border-radius:6px;color:#aaa;font-size:11px;">${name}</div>`
        })
        .onPolygonClick((feat: any) => {
          const props = feat?.properties ?? {}
          const iso2  = (props.ISO_A2 ?? props.iso_a2 ?? "").toUpperCase()
          const iso3  = (props.ISO_A3 ?? props.iso_a3 ?? props.ADM0_A3 ?? "").toUpperCase()
          const entry = gdpMapLocal.get(iso2) || gdpMapLocal.get(iso3)
          if (entry) {
            setSelectedCountry(entry)
            setSelectedExch(null)
          }
        })
        // ── Stock exchange points ────────────────────────────────────────────
        .pointsData(d.exchanges)
        .pointLat("lat")
        .pointLng("lng")
        .pointAltitude(0.015)
        .pointRadius(0.5)
        .pointColor("color")
        .pointsMerge(false)
        .pointLabel((ex: any) => `<div style="font-family:sans-serif;padding:6px 10px;background:rgba(0,0,0,0.85);border-radius:8px;border:1px solid ${ex.color}44;color:#fff;font-size:12px;"><b style="color:${ex.color}">${ex.name}</b><br/>${ex.indexName}: ${fmtIndex(ex.indexValue)}<br/><span style="color:#aaa">Market cap: $${ex.marketCapUsdT.toFixed(1)}T</span></div>`)
        .onPointClick((ex: any) => {
          setSelectedExch(ex)
          setSelectedCountry(null)
          globe.pointOfView({ lat: ex.lat, lng: ex.lng, altitude: 1.5 }, 700)
        })
        // ── Capital flow arcs ────────────────────────────────────────────────
        .arcsData(d.flows)
        .arcStartLat("srcLat")
        .arcStartLng("srcLng")
        .arcEndLat("dstLat")
        .arcEndLng("dstLng")
        .arcColor("color")
        .arcAltitude(0.3)
        .arcStroke(0.4)
        .arcDashLength(0.4)
        .arcDashGap(0.2)
        .arcDashAnimateTime(2500)
        .arcLabel((fl: any) => `<div style="font-family:sans-serif;padding:4px 8px;background:rgba(0,0,0,0.8);border-radius:6px;color:#ffcc00;font-size:11px;">${fl.label} · $${fl.valueBn}B</div>`)

      // Fetch and load country GeoJSON for polygon choropleth.
      // We use the three-globe bundled countries GeoJSON which globe.gl itself ships.
      // This avoids a topojson-client dependency — three-globe exposes a pre-parsed file.
      fetch("//unpkg.com/world-atlas@2.0.2/countries-110m.json")
        .then(r => r.json())
        .then(world => {
          // Inline minimal TopoJSON → GeoJSON arc expansion
          // (avoids requiring topojson-client as an npm dep)
          const topoToGeo = (topology: any, object: any) => {
            const arcs: number[][][] = topology.arcs
            const scale  = topology.transform?.scale  ?? [1, 1]
            const transl = topology.transform?.translate ?? [0, 0]

            function decodeArc(arcIdx: number): number[][] {
              const raw  = arcIdx < 0 ? [...arcs[~arcIdx]].reverse() : arcs[arcIdx]
              const pts: number[][] = []
              let x = 0, y = 0
              for (const [dx, dy] of raw) {
                x += dx; y += dy
                pts.push([x * scale[0] + transl[0], y * scale[1] + transl[1]])
              }
              return pts
            }

            const features = object.geometries.map((geom: any) => {
              const toRings = (arcsArr: number[][]): number[][][] =>
                arcsArr.map(ring => ring.flatMap(ai => decodeArc(ai)))

              let geometry: any
              if (geom.type === "Polygon") {
                geometry = { type: "Polygon", coordinates: toRings(geom.arcs) }
              } else if (geom.type === "MultiPolygon") {
                geometry = { type: "MultiPolygon", coordinates: geom.arcs.map(toRings) }
              } else {
                return null
              }
              return { type: "Feature", id: geom.id, properties: geom.properties ?? {}, geometry }
            }).filter(Boolean)

            return { type: "FeatureCollection", features }
          }

          try {
            const geoJson = topoToGeo(world, world.objects.countries)
            globe.polygonsData(geoJson.features)
          } catch {
            // choropleth unavailable
          }
        })
        .catch(() => { /* choropleth unavailable */ })

      const ctrl = globe.controls()
      ctrl.autoRotate      = true
      ctrl.autoRotateSpeed = 0.1
      ctrl.enableDamping   = true
      ctrl.dampingFactor   = 0.1

      globeInst.current = globe
      setGlobeReady(true)

      // Resize handler
      const onResize = () => {
        if (globe && globeRef.current) {
          globe.width(globeRef.current.clientWidth)
          globe.height(globeRef.current.clientHeight)
        }
      }
      window.addEventListener("resize", onResize)
      ;(globeRef.current as any)._resizeHandler = onResize
    })

    return () => {
      const canvas = globeRef.current
      if (canvas && (canvas as any)._resizeHandler) {
        window.removeEventListener("resize", (canvas as any)._resizeHandler)
      }
      globe?._destructor?.()
      globe?.controls()?.dispose?.()
      globeInst.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  // ── View mode: show/hide layers ─────────────────────────────────────────────
  useEffect(() => {
    if (!globeInst.current || !globeReady) return
    const g = globeInst.current
    const d = dataRef.current
    if (!d) return

    if (viewMode === "gdp") {
      // Keep polygons visible, hide exchange labels emphasis, keep arcs subtle
      g.pointsData(d.exchanges)
        .pointAltitude(0.015)
        .pointRadius(0.3)
      g.arcsData([])
    } else if (viewMode === "exchanges") {
      g.pointsData(d.exchanges)
        .pointAltitude(0.04)
        .pointRadius(0.8)
      g.arcsData([])
    } else {
      // flows
      g.pointsData(d.exchanges)
        .pointAltitude(0.015)
        .pointRadius(0.4)
      g.arcsData(d.flows)
    }
  }, [viewMode, globeReady])

  // ── Spin toggle ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!globeInst.current) return
    globeInst.current.controls().autoRotate = isSpinning
  }, [isSpinning])

  // ── FX helpers ──────────────────────────────────────────────────────────────
  const fxVal = useCallback((key: string, invert: boolean): string => {
    if (!data?.fx?.rates) return "—"
    const rate = data.fx.rates[key]
    if (rate == null) return "—"
    const val = invert ? 1 / rate : rate
    return fmtFx(val)
  }, [data])

  // ── Loading / error states ──────────────────────────────────────────────────
  if (status === "loading") return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: "calc(100vh - 64px)", background: "var(--bg)" }}>
      <div className="text-center max-w-sm">
        <div className="mb-6 relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
            style={{ borderTopColor: "#ffcc00", borderRightColor: "#ff8800" }} />
          <div className="absolute inset-3 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,200,0,0.15)" }}>
            <span className="text-2xl">$</span>
          </div>
        </div>
        <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--text)" }}>Loading financial data…</h2>
        <p className="text-sm" style={{ color: "var(--muted)" }}>Fetching GDP (World Bank) and FX rates (Frankfurter)</p>
      </div>
    </div>
  )

  if (status === "error") return (
    <div className="flex flex-col items-center justify-center gap-4"
      style={{ minHeight: "calc(100vh - 64px)", background: "var(--bg)" }}>
      <span className="text-4xl">⚠️</span>
      <p className="text-lg font-semibold" style={{ color: "var(--text)" }}>Failed to load financial data</p>
      <p className="text-sm" style={{ color: "var(--muted)" }}>{errorMsg}</p>
      <button onClick={() => { setStatus("loading"); fetchData() }}
        className="px-4 py-2 rounded-lg text-sm font-medium"
        style={{ background: "#ffcc00", color: "#000" }}>
        Retry
      </button>
    </div>
  )

  return (
    <div className="relative" style={{ minHeight: "calc(100vh - 64px)", background: "#000" }}>
      {/* Globe canvas */}
      <div ref={globeRef} className="absolute inset-0" />

      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <div className="absolute top-4 left-4 bottom-4 w-72 flex flex-col gap-3 pointer-events-none">

        {/* Title */}
        <div className="rounded-xl p-4 pointer-events-auto"
          style={{ background: "rgba(0,0,0,0.78)", border: "1px solid rgba(255,200,50,0.2)", backdropFilter: "blur(14px)" }}>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-base font-bold" style={{ color: "#ffcc00" }}>Financial Globe</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: "rgba(255,200,0,0.15)", color: "#ffcc00", border: "1px solid rgba(255,200,0,0.3)" }}>
              LIVE
            </span>
          </div>
          <p className="text-xs" style={{ color: "var(--muted)" }}>GDP · Markets · Capital Flows</p>
        </div>

        {/* View toggle */}
        <div className="rounded-xl p-3 pointer-events-auto"
          style={{ background: "rgba(0,0,0,0.78)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(14px)" }}>
          <p className="text-xs font-semibold tracking-wider mb-2" style={{ color: "var(--muted)" }}>VIEW</p>
          <div className="flex flex-col gap-1">
            {([
              { id: "gdp"       as ViewMode, label: "GDP Choropleth",  icon: "🌍" },
              { id: "exchanges" as ViewMode, label: "Stock Exchanges",  icon: "📈" },
              { id: "flows"     as ViewMode, label: "Capital Flows",    icon: "⚡" },
            ]).map(v => (
              <button key={v.id} onClick={() => setViewMode(v.id)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-all"
                style={{
                  background: viewMode === v.id ? "rgba(255,200,0,0.12)" : "transparent",
                  border:     viewMode === v.id ? "1px solid rgba(255,200,0,0.35)" : "1px solid transparent",
                  color:      viewMode === v.id ? "#ffcc00" : "var(--muted)",
                }}>
                <span>{v.icon}</span>
                <span>{v.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* FX Rates */}
        <div className="rounded-xl p-3 pointer-events-auto"
          style={{ background: "rgba(0,0,0,0.78)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(14px)" }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold tracking-wider" style={{ color: "var(--muted)" }}>FX RATES</p>
            <span className="text-xs" style={{ color: "rgba(255,200,0,0.5)" }}>
              {data?.fx?.date ?? ""}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            {FX_PAIRS.map(pair => (
              <div key={pair.label} className="flex items-center justify-between px-2 py-1 rounded-lg"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <span className="text-xs flex items-center gap-1.5">
                  <span>{pair.flag}</span>
                  <span style={{ color: "var(--muted)" }}>{pair.label}</span>
                </span>
                <span className="text-xs font-mono font-semibold" style={{ color: "#ffdd88" }}>
                  {fxVal(pair.key, pair.invert)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Stock Indices */}
        <div className="rounded-xl p-3 pointer-events-auto"
          style={{ background: "rgba(0,0,0,0.78)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(14px)" }}>
          <p className="text-xs font-semibold tracking-wider mb-2" style={{ color: "var(--muted)" }}>INDICES
            <span className="ml-1.5 text-xs font-normal opacity-50">(indicative)</span>
          </p>
          <div className="flex flex-col gap-1">
            {INDICES.map(idx => (
              <div key={idx.label} className="flex items-center justify-between px-2 py-1 rounded-lg"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <span className="text-xs flex items-center gap-1.5">
                  <span>{idx.region}</span>
                  <span style={{ color: "var(--muted)" }}>{idx.label}</span>
                </span>
                <span className="text-xs font-mono font-semibold flex items-center gap-1">
                  <span style={{ color: "#ffdd88" }}>{fmtIndex(idx.value)}</span>
                  <span style={{ color: idx.change >= 0 ? "#44ff88" : "#ff5555", fontSize: "10px" }}>
                    {idx.change >= 0 ? "▲" : "▼"}{Math.abs(idx.change).toFixed(2)}%
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* GDP Legend */}
        <div className="rounded-xl p-3 pointer-events-auto"
          style={{ background: "rgba(0,0,0,0.78)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(14px)" }}>
          <p className="text-xs font-semibold tracking-wider mb-2" style={{ color: "var(--muted)" }}>GDP SCALE</p>
          <div className="flex items-center gap-0.5 mb-1.5">
            {GDP_LEGEND_STEPS.map(step => (
              <div key={step.label} className="flex-1 h-3 rounded-sm" style={{ background: step.color }} />
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: "var(--muted)" }}>Low</span>
            <span className="text-xs" style={{ color: "#ffcc00" }}>High</span>
          </div>
        </div>

        {/* Attribution */}
        <div className="rounded-xl px-3 py-2 pointer-events-auto mt-auto"
          style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(8px)" }}>
          <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.3)" }}>
            GDP: World Bank · FX: Frankfurter · Indices: indicative
          </p>
        </div>
      </div>

      {/* ── Top-right controls ────────────────────────────────────────────────── */}
      <div className="absolute top-4 right-4 flex items-center gap-2 pointer-events-auto">
        <button onClick={() => setIsSpinning(s => !s)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)", color: "var(--muted)", backdropFilter: "blur(8px)" }}>
          {isSpinning ? "⏸ Pause" : "▶ Spin"}
        </button>
        <Link href="/uc21/details"
          className="px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: "rgba(255,200,0,0.1)", border: "1px solid rgba(255,200,0,0.3)", color: "#ffcc00", backdropFilter: "blur(8px)" }}>
          Architecture →
        </Link>
      </div>

      {/* ── Selected country panel ────────────────────────────────────────────── */}
      {selectedCountry && (
        <div className="absolute bottom-4 right-4 pointer-events-auto w-72">
          <div className="rounded-xl p-4"
            style={{ background: "rgba(0,0,0,0.88)", border: "1px solid rgba(255,200,50,0.3)", backdropFilter: "blur(14px)" }}>
            <div className="flex items-start justify-between mb-3">
              <div className="min-w-0 pr-2">
                <p className="text-sm font-bold leading-tight" style={{ color: "var(--text)" }}>
                  {selectedCountry.country}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  {selectedCountry.iso3} · {selectedCountry.year}
                </p>
              </div>
              <button onClick={() => setSelectedCountry(null)}
                className="opacity-40 hover:opacity-80 text-base flex-shrink-0"
                style={{ color: "var(--muted)" }}>✕</button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              {[
                { label: "GDP (Total)",  val: fmtGdp(selectedCountry.gdpUsd) },
                { label: "ISO Code",     val: selectedCountry.iso3 || selectedCountry.iso2 },
                { label: "Data Year",    val: String(selectedCountry.year) },
                { label: "Rank",         val: `#${data ? [...data.gdp].sort((a, b) => b.gdpUsd - a.gdpUsd).findIndex(e => e.iso3 === selectedCountry.iso3) + 1 : "—"}` },
              ].map(m => (
                <div key={m.label} className="rounded-lg px-2 py-1.5"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{m.label}</p>
                  <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{m.val}</p>
                </div>
              ))}
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="h-full rounded-full"
                style={{
                  width: `${Math.round(gdpToColorOpacity(selectedCountry.gdpUsd, maxGdp) * 100)}%`,
                  background: "linear-gradient(90deg, #553300, #ffcc00)",
                }} />
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Relative GDP scale</p>
          </div>
        </div>
      )}

      {/* ── Selected exchange panel ───────────────────────────────────────────── */}
      {selectedExch && (
        <div className="absolute bottom-4 right-4 pointer-events-auto w-72">
          <div className="rounded-xl p-4"
            style={{ background: "rgba(0,0,0,0.88)", border: `1px solid ${selectedExch.color}44`, backdropFilter: "blur(14px)" }}>
            <div className="flex items-start justify-between mb-3">
              <div className="min-w-0 pr-2">
                <p className="text-sm font-bold leading-tight" style={{ color: selectedExch.color }}>
                  {selectedExch.id}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  {selectedExch.name}
                </p>
              </div>
              <button onClick={() => setSelectedExch(null)}
                className="opacity-40 hover:opacity-80 text-base flex-shrink-0"
                style={{ color: "var(--muted)" }}>✕</button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: "City",       val: selectedExch.city },
                { label: "Country",    val: selectedExch.country },
                { label: "Index",      val: selectedExch.indexName },
                { label: "Value",      val: fmtIndex(selectedExch.indexValue) },
                { label: "Market Cap", val: `$${selectedExch.marketCapUsdT.toFixed(1)}T` },
                { label: "ISO",        val: selectedExch.iso2 },
              ].map(m => (
                <div key={m.label} className="rounded-lg px-2 py-1.5"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{m.label}</p>
                  <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{m.val}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

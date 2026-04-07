"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import Link from "next/link"

// ── Types ─────────────────────────────────────────────────────────────────────

export type CropKey = "wheat" | "rice" | "maize" | "soybeans" | "coffee" | "cocoa" | "sugarcane" | "cotton"
export type ViewMode = "production" | "yield" | "arable"

interface CropRecord {
  iso3:       string
  country:    string
  lat:        number
  lng:        number
  production: number   // thousand tonnes
  yield:      number   // tonnes / ha
  area:       number   // thousand ha
}

interface ArableRecord {
  iso3:    string
  country: string
  lat:     number
  lng:     number
  pct:     number      // % of land area that is arable
}

interface AgricultureData {
  crops:  Record<CropKey, CropRecord[]>
  arable: ArableRecord[]
}

interface PointDatum {
  iso3:       string
  country:    string
  lat:        number
  lng:        number
  value:      number   // normalised display value
  rawLabel:   string   // human-readable raw value
  production: number
  yield:      number
  area:       number
  worldPct:   number
}

interface CountryFeature {
  type: "Feature"
  id: string
  properties: { name: string }
  geometry: any
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CROPS: { key: CropKey; label: string; icon: string }[] = [
  { key: "wheat",     label: "Wheat",     icon: "🌾" },
  { key: "rice",      label: "Rice",      icon: "🍚" },
  { key: "maize",     label: "Maize",     icon: "🌽" },
  { key: "soybeans",  label: "Soybeans",  icon: "🫘" },
  { key: "coffee",    label: "Coffee",    icon: "☕" },
  { key: "cocoa",     label: "Cocoa",     icon: "🍫" },
  { key: "sugarcane", label: "Sugarcane", icon: "🎋" },
  { key: "cotton",    label: "Cotton",    icon: "🌿" },
]

// Dark-to-bright blue gradient — highlights against green earth
const COLOR_SCALE = [
  { t: 0.00, r: 10,  g: 10,  b: 30  },  // #0a0a1e – near black (minimal)
  { t: 0.15, r: 15,  g: 30,  b: 80  },  // #0f1e50 – deep navy
  { t: 0.40, r: 30,  g: 60,  b: 160 },  // #1e3ca0 – royal blue
  { t: 0.70, r: 50,  g: 120, b: 220 },  // #3278dc – bright blue
  { t: 1.00, r: 80,  g: 180, b: 255 },  // #50b4ff – vivid sky blue
]

function lerpColor(t: number): string {
  const clamped = Math.max(0, Math.min(1, t))
  let i = COLOR_SCALE.length - 2
  for (let j = 0; j < COLOR_SCALE.length - 1; j++) {
    if (clamped <= COLOR_SCALE[j + 1].t) { i = j; break }
  }
  const lo = COLOR_SCALE[i]
  const hi = COLOR_SCALE[i + 1]
  const f  = (clamped - lo.t) / (hi.t - lo.t)
  const r  = Math.round(lo.r + f * (hi.r - lo.r))
  const g  = Math.round(lo.g + f * (hi.g - lo.g))
  const b  = Math.round(lo.b + f * (hi.b - lo.b))
  return `rgb(${r},${g},${b})`
}

function fmtNum(n: number, decimals = 0): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: decimals })
}

function fmtProduction(kt: number): string {
  if (kt >= 1_000_000) return `${(kt / 1_000_000).toFixed(2)}B t`
  if (kt >= 1_000)     return `${(kt / 1_000).toFixed(1)}M t`
  return `${fmtNum(kt)}K t`
}

// Compute bounding-box centroid from any GeoJSON geometry (coords are [lng, lat])
function featureCentroid(geometry: any): { lat: number; lng: number } {
  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180
  function walk(c: any) {
    if (!Array.isArray(c)) return
    if (typeof c[0] === "number") {
      const [lng, lat] = c
      if (lat < minLat) minLat = lat
      if (lat > maxLat) maxLat = lat
      if (lng < minLng) minLng = lng
      if (lng > maxLng) maxLng = lng
    } else {
      for (const sub of c) walk(sub)
    }
  }
  walk(geometry?.coordinates)
  return { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 }
}

type StatusT = "loading" | "ready" | "error"

// ── Main Component ─────────────────────────────────────────────────────────────

export default function UC22Page() {
  const globeRef    = useRef<HTMLDivElement>(null)
  const globeInst   = useRef<any>(null)

  const [status,          setStatus]          = useState<StatusT>("loading")
  const [errorMsg,        setErrorMsg]        = useState("")
  const [agData,          setAgData]          = useState<AgricultureData | null>(null)
  const [selectedCrop,    setSelectedCrop]    = useState<CropKey>("wheat")
  const [viewMode,        setViewMode]        = useState<ViewMode>("production")
  const [selectedPt,      setSelectedPt]      = useState<PointDatum | null>(null)
  const [isSpinning,      setIsSpinning]      = useState(true)
  const [countries,       setCountries]       = useState<CountryFeature[]>([])
  const [hoveredCountry,  setHoveredCountry]  = useState<CountryFeature | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<CountryFeature | null>(null)

  // ── Fetch data ──────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      const [res, geoRes] = await Promise.all([
        fetch("/api/agriculture-data"),
        fetch("/countries-110m.geojson"),
      ])
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const json: AgricultureData = await res.json()
      const geo = await geoRes.json()
      setAgData(json)
      setCountries(geo.features as CountryFeature[])
      setStatus("ready")
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Unknown error")
      setStatus("error")
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Compute display points ──────────────────────────────────────────────────

  const displayPoints = useMemo((): PointDatum[] => {
    if (!agData) return []

    if (viewMode === "arable") {
      const max = Math.max(...agData.arable.map(r => r.pct), 1)
      return agData.arable.map(r => ({
        iso3:       r.iso3,
        country:    r.country,
        lat:        r.lat,
        lng:        r.lng,
        value:      r.pct / max,
        rawLabel:   `${r.pct.toFixed(1)}% arable`,
        production: 0,
        yield:      0,
        area:       0,
        worldPct:   0,
      }))
    }

    const rows = agData.crops[selectedCrop] ?? []
    if (rows.length === 0) return []

    const totalProd = rows.reduce((s, r) => s + r.production, 0)
    let maxVal = 0
    if (viewMode === "production") maxVal = Math.max(...rows.map(r => r.production), 1)
    if (viewMode === "yield")      maxVal = Math.max(...rows.map(r => r.yield), 1)

    return rows.map(r => {
      const rawVal  = viewMode === "production" ? r.production : r.yield
      const normVal = rawVal / maxVal
      const raw     = viewMode === "production"
        ? fmtProduction(r.production)
        : `${r.yield.toFixed(2)} t/ha`
      return {
        iso3:       r.iso3,
        country:    r.country,
        lat:        r.lat,
        lng:        r.lng,
        value:      normVal,
        rawLabel:   raw,
        production: r.production,
        yield:      r.yield,
        area:       r.area,
        worldPct:   totalProd > 0 ? (r.production / totalProd) * 100 : 0,
      }
    })
  }, [agData, selectedCrop, viewMode])

  // ── Apply points via globe.gl native pointsData ─────────────────────────────

  useEffect(() => {
    if (!globeInst.current || !displayPoints.length) return
    const g = globeInst.current
    const maxRadius = viewMode === "arable" ? 0.8 : 1.2

    g.pointsData(displayPoints)
      .pointLat("lat")
      .pointLng("lng")
      .pointAltitude(0.005)  // ON the surface, not floating
      .pointRadius((d: PointDatum) => 0.08 + d.value * maxRadius)  // SIZE = value
      .pointColor((d: PointDatum) => lerpColor(d.value > 0 ? 0.1 + d.value * 0.9 : 0))
      .pointsMerge(false)
      .pointLabel((d: PointDatum) => `
        <div style="font-family:sans-serif;padding:8px 12px;background:rgba(0,0,0,0.9);border-radius:8px;border:1px solid rgba(76,175,80,0.4);color:#fff;font-size:12px;max-width:220px;">
          <b style="color:#8bc34a">${d.country}</b><br/>
          ${d.rawLabel}<br/>
          ${d.worldPct > 0 ? `<span style="color:#aaa;font-size:11px">${d.worldPct.toFixed(1)}% of world</span>` : ""}
        </div>
      `)
      .onPointClick((d: PointDatum) => {
        setSelectedPt(d)
        setIsSpinning(false)
        g.pointOfView({ lat: d.lat, lng: d.lng, altitude: 1.6 }, 700)
      })
      .onPointHover((d: PointDatum | null) => {
        if (globeRef.current) globeRef.current.style.cursor = d ? "pointer" : "default"
      })
  }, [displayPoints, viewMode])

  // ── Apply country polygons ─────────────────────────────────────────────────

  function applyCountries(
    globe: any,
    features: CountryFeature[],
    hovered: CountryFeature | null,
    selected: CountryFeature | null,
    points?: PointDatum[],
  ) {
    // Build a country→value lookup for choropleth fill
    const countryValue: Record<string, number> = {}
    if (points && points.length > 0) {
      for (const p of points) {
        if (p.value > (countryValue[p.country] ?? 0)) countryValue[p.country] = p.value
      }
    }

    globe
      .polygonsData(features)
      .polygonCapColor((d: any) => {
        const name = d.properties.name
        if (selected && name === selected.properties.name)
          return "rgba(253,231,37,0.15)"
        if (hovered && name === hovered.properties.name)
          return "rgba(255,255,255,0.08)"
        // Choropleth: color countries with data based on production scale
        const v = countryValue[name]
        if (v != null && v > 0) {
          const intensity = Math.round(v * 180)
          return `rgba(30,${60 + intensity},255,${(0.08 + v * 0.18).toFixed(2)})`
        }
        return "rgba(0,0,0,0)"
      })
      .polygonSideColor(() => "rgba(0,0,0,0)")
      .polygonStrokeColor((d: any) => {
        const name = d.properties.name
        if (selected && name === selected.properties.name)
          return "rgba(253,231,37,0.9)"
        if (hovered && name === hovered.properties.name)
          return "rgba(255,255,255,0.6)"
        // Highlight countries with data
        if (countryValue[name] != null && countryValue[name] > 0)
          return "rgba(80,180,255,0.35)"
        return "rgba(255,255,255,0.12)"
      })
      .polygonAltitude(0.005)
      .onPolygonHover((d: any) => {
        setHoveredCountry(d as CountryFeature | null)
      })
      .onPolygonClick((d: any) => {
        const f = d as CountryFeature
        setSelectedCountry(prev =>
          prev?.properties.name === f.properties.name ? null : f
        )
        if (globeInst.current) {
          const { lat, lng } = featureCentroid(f.geometry)
          globeInst.current.pointOfView({ lat, lng, altitude: 2.0 }, 800)
        }
        setIsSpinning(false)
      })
  }

  // ── Sync country polygons when hover/selection changes ─────────────────────

  useEffect(() => {
    if (!globeInst.current || !countries.length) return
    applyCountries(globeInst.current, countries, hoveredCountry, selectedCountry, displayPoints)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoveredCountry, selectedCountry, countries, displayPoints])

  // ── Country stats ─────────────────────────────────────────────────────────

  const countryStats = useMemo(() => {
    if (!selectedCountry || !agData) return null
    const name = selectedCountry.properties.name
    // Find matching point for the selected country
    const pt = displayPoints.find(p => p.country === name)
    if (!pt) return null
    return { name, pt }
  }, [selectedCountry, agData, displayPoints])

  // ── Globe init ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (status !== "ready" || !globeRef.current || globeInst.current) return

    import("globe.gl").then((mod) => {
      if (!globeRef.current) return
      const GlobeGL = (mod.default ?? mod) as any
      const globe = new GlobeGL()
      globe(globeRef.current)
        .width(globeRef.current.clientWidth)
        .height(globeRef.current.clientHeight)
        .globeImageUrl("//unpkg.com/three-globe/example/img/earth-day.jpg")  // GREEN day texture
        .bumpImageUrl("//unpkg.com/three-globe/example/img/earth-topology.png")
        .backgroundImageUrl("//unpkg.com/three-globe/example/img/night-sky.png")
        .atmosphereColor("#4caf50")  // green atmosphere
        .atmosphereAltitude(0.12)
        .pointOfView({ lat: 20, lng: 10, altitude: 2.0 })

      globe.controls().autoRotate = true
      globe.controls().autoRotateSpeed = 0.15
      globe.controls().enableDamping = true
      globe.controls().dampingFactor = 0.1

      globeInst.current = globe
      applyCountries(globe, countries, null, null, displayPoints)

      // Apply initial wheat data immediately so markers show on first load
      if (displayPoints.length) {
        const maxR = viewMode === "arable" ? 0.8 : 1.2
        globe.pointsData(displayPoints)
          .pointLat("lat").pointLng("lng")
          .pointAltitude(0.005)
          .pointRadius((d: PointDatum) => 0.08 + d.value * maxR)
          .pointColor((d: PointDatum) => lerpColor(d.value > 0 ? 0.1 + d.value * 0.9 : 0))
          .pointsMerge(false)
          .pointLabel((d: PointDatum) => `
            <div style="font-family:sans-serif;padding:8px 12px;background:rgba(0,0,0,0.9);border-radius:8px;border:1px solid rgba(76,175,80,0.4);color:#fff;font-size:12px;max-width:220px;">
              <b style="color:#8bc34a">${d.country}</b><br/>
              ${d.rawLabel}<br/>
              ${d.worldPct > 0 ? `<span style="color:#aaa;font-size:11px">${d.worldPct.toFixed(1)}% of world</span>` : ""}
            </div>
          `)
          .onPointClick((d: PointDatum) => {
            setSelectedPt(d)
            setIsSpinning(false)
            globe.pointOfView({ lat: d.lat, lng: d.lng, altitude: 1.6 }, 700)
          })
          .onPointHover((d: PointDatum | null) => {
            if (globeRef.current) globeRef.current.style.cursor = d ? "pointer" : "default"
          })
      }
    })

    return () => {
      globeInst.current?.controls()?.dispose?.()
      globeInst.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  // Sync autoRotate
  useEffect(() => {
    if (!globeInst.current) return
    globeInst.current.controls().autoRotate = isSpinning
  }, [isSpinning])

  // ── Derived display data ────────────────────────────────────────────────────

  const topProducers = useMemo(() => {
    if (viewMode === "arable") {
      return [...displayPoints].sort((a, b) => b.value - a.value).slice(0, 10)
    }
    return [...displayPoints].sort((a, b) => b.production - a.production).slice(0, 10)
  }, [displayPoints, viewMode])

  const worldTotal = useMemo(() => {
    if (!agData || viewMode === "arable") return 0
    return (agData.crops[selectedCrop] ?? []).reduce((s, r) => s + r.production, 0)
  }, [agData, selectedCrop, viewMode])

  const cropInfo = CROPS.find(c => c.key === selectedCrop)!

  // ── Loading / error states ──────────────────────────────────────────────────

  if (status === "loading") return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: "calc(100vh - 64px)", background: "var(--bg)" }}>
      <div className="text-center max-w-sm">
        <div className="mb-6 relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
               style={{ borderTopColor: "#4caf50", borderRightColor: "#8bc34a" }} />
          <div className="absolute inset-3 rounded-full flex items-center justify-center"
               style={{ background: "rgba(76,175,80,0.15)" }}>
            <span className="text-xl">🌾</span>
          </div>
        </div>
        <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--text)" }}>Loading agricultural data…</h2>
        <p className="text-sm" style={{ color: "var(--muted)" }}>FAO STAT 2022 crop production dataset</p>
      </div>
    </div>
  )

  if (status === "error") return (
    <div className="flex flex-col items-center justify-center gap-4" style={{ minHeight: "calc(100vh - 64px)", background: "var(--bg)" }}>
      <span className="text-4xl">⚠️</span>
      <p className="text-lg font-semibold" style={{ color: "var(--text)" }}>Failed to load agriculture data</p>
      <p className="text-sm" style={{ color: "var(--muted)" }}>{errorMsg}</p>
      <button onClick={() => { setStatus("loading"); fetchData() }}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: "#4caf50", color: "#fff" }}>
        Retry
      </button>
    </div>
  )

  // ── Main render ─────────────────────────────────────────────────────────────

  return (
    <div className="relative" style={{ minHeight: "calc(100vh - 64px)", background: "#000" }}>
      {/* Globe canvas */}
      <div ref={globeRef} className="absolute inset-0" />

      {/* Top bar */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-4 pointer-events-none">
        <div className="pointer-events-auto">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-lg font-bold" style={{ color: "var(--text)" }}>
              {cropInfo.icon} Global Agriculture
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: "rgba(76,175,80,0.2)", color: "#7ec850", border: "1px solid rgba(76,175,80,0.35)" }}>
              FAO 2022
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Crop",     val: cropInfo.label },
              { label: "Countries", val: displayPoints.length.toString() },
              { label: "World Total", val: viewMode !== "arable" ? fmtProduction(worldTotal) : "—" },
              { label: "View",     val: viewMode === "production" ? "Production" : viewMode === "yield" ? "Yield" : "Arable Land" },
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
          <button onClick={() => setIsSpinning(s => !s)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)", color: "var(--muted)", backdropFilter: "blur(8px)" }}>
            {isSpinning ? "⏸ Pause" : "▶ Spin"}
          </button>
          <Link href="/uc22/details"
                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: "rgba(76,175,80,0.12)", border: "1px solid rgba(76,175,80,0.3)", color: "#7ec850", backdropFilter: "blur(8px)" }}>
            Details →
          </Link>
        </div>
      </div>

      {/* Sidebar */}
      <div className="absolute top-20 left-4 bottom-4 pointer-events-auto flex flex-col gap-3"
           style={{ width: 240 }}>

        {/* Crop selector */}
        <div className="rounded-xl p-3"
             style={{ background: "rgba(0,0,0,0.78)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(14px)" }}>
          <p className="text-xs font-semibold tracking-wider mb-2" style={{ color: "var(--muted)" }}>CROP</p>
          <div className="flex flex-col gap-1">
            {CROPS.map(c => {
              const active = selectedCrop === c.key
              return (
                <button key={c.key}
                        onClick={() => { setSelectedCrop(c.key); setSelectedPt(null) }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-left"
                        style={{
                          background: active ? "rgba(76,175,80,0.18)" : "transparent",
                          border:     active ? "1px solid rgba(76,175,80,0.45)" : "1px solid transparent",
                          color:      active ? "#7ec850" : "var(--muted)",
                        }}>
                  <span>{c.icon}</span>
                  <span>{c.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* View toggle */}
        <div className="rounded-xl p-3"
             style={{ background: "rgba(0,0,0,0.78)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(14px)" }}>
          <p className="text-xs font-semibold tracking-wider mb-2" style={{ color: "var(--muted)" }}>VIEW</p>
          <div className="flex flex-col gap-1">
            {([
              { key: "production", label: "Production Volume" },
              { key: "yield",      label: "Yield (t/ha)"      },
              { key: "arable",     label: "Arable Land %"     },
            ] as { key: ViewMode; label: string }[]).map(v => {
              const active = viewMode === v.key
              return (
                <button key={v.key}
                        onClick={() => { setViewMode(v.key); setSelectedPt(null) }}
                        className="px-3 py-1.5 rounded-lg text-xs text-left"
                        style={{
                          background: active ? "rgba(76,175,80,0.18)" : "transparent",
                          border:     active ? "1px solid rgba(76,175,80,0.45)" : "1px solid transparent",
                          color:      active ? "#7ec850" : "var(--muted)",
                        }}>
                  {v.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Color legend */}
        <div className="rounded-xl p-3"
             style={{ background: "rgba(0,0,0,0.78)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(14px)" }}>
          <p className="text-xs font-semibold tracking-wider mb-2" style={{ color: "var(--muted)" }}>SCALE</p>
          <div className="rounded-lg h-3 mb-1"
               style={{ background: "linear-gradient(to right, #1a5f2a, #3d9142, #7ec850, #c8f070)" }} />
          <div className="flex justify-between text-xs" style={{ color: "var(--muted)" }}>
            <span>Low</span><span>High</span>
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
            {viewMode === "production" ? "Thousand tonnes" : viewMode === "yield" ? "Tonnes / hectare" : "% of land area"}
          </p>
          <p className="text-xs mt-2 opacity-50" style={{ color: "var(--muted)" }}>Data: FAO STAT 2022</p>
        </div>
      </div>

      {/* Top producers leaderboard */}
      <div className="absolute top-20 right-4 pointer-events-auto"
           style={{ width: 236 }}>
        <div className="rounded-xl p-3"
             style={{ background: "rgba(0,0,0,0.78)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(14px)" }}>
          <p className="text-xs font-semibold tracking-wider mb-2" style={{ color: "var(--muted)" }}>
            TOP PRODUCERS — {CROPS.find(c => c.key === selectedCrop)?.label.toUpperCase()}
          </p>
          <div className="flex flex-col gap-1">
            {topProducers.map((pt, idx) => (
              <button key={pt.iso3}
                      onClick={() => {
                        setSelectedPt(pt)
                        setIsSpinning(false)
                        globeInst.current?.pointOfView({ lat: pt.lat, lng: pt.lng, altitude: 1.6 }, 700)
                      }}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-left hover:opacity-80"
                      style={{
                        background: selectedPt?.iso3 === pt.iso3 ? "rgba(76,175,80,0.15)" : "transparent",
                        border:     selectedPt?.iso3 === pt.iso3 ? "1px solid rgba(76,175,80,0.35)" : "1px solid transparent",
                        color:      "var(--text)",
                      }}>
                <span className="font-mono text-xs w-4 flex-shrink-0"
                      style={{ color: idx < 3 ? "#c8f070" : "var(--muted)" }}>
                  {idx + 1}
                </span>
                <span className="flex-1 truncate">{pt.country}</span>
                <span className="flex-shrink-0 font-semibold" style={{ color: "#7ec850" }}>
                  {pt.rawLabel}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Country stats panel */}
      {countryStats && (
        <div className="absolute bottom-4 left-4 pointer-events-auto"
             style={{ width: 250 }}>
          <div className="rounded-xl p-4"
               style={{ background: "rgba(0,0,0,0.88)", border: "1px solid rgba(253,231,37,0.35)", backdropFilter: "blur(14px)" }}>
            <div className="flex items-start justify-between mb-3">
              <div className="min-w-0 pr-2">
                <p className="text-sm font-bold leading-tight" style={{ color: "#fde725" }}>{countryStats.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{cropInfo.label} stats</p>
              </div>
              <button onClick={() => setSelectedCountry(null)}
                      className="opacity-40 hover:opacity-80 text-base flex-shrink-0"
                      style={{ color: "var(--muted)" }}>✕</button>
            </div>
            {viewMode !== "arable" ? (
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: "Production",    val: fmtProduction(countryStats.pt.production) },
                  { label: "Yield",         val: `${countryStats.pt.yield.toFixed(2)} t/ha` },
                  { label: "Harvested Area",val: `${fmtNum(countryStats.pt.area)}K ha` },
                  { label: "% World Total", val: `${countryStats.pt.worldPct.toFixed(1)}%` },
                ].map(m => (
                  <div key={m.label} className="rounded-lg px-2 py-1.5"
                       style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>{m.label}</p>
                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{m.val}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg px-3 py-2"
                   style={{ background: "rgba(76,175,80,0.08)", border: "1px solid rgba(76,175,80,0.2)" }}>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Arable Land</p>
                <p className="text-xl font-bold" style={{ color: "#7ec850" }}>{countryStats.pt.rawLabel}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected point detail panel */}
      {selectedPt && (
        <div className="absolute bottom-4 right-4 pointer-events-auto"
             style={{ width: 250 }}>
          <div className="rounded-xl p-4"
               style={{ background: "rgba(0,0,0,0.88)", border: "1px solid rgba(76,175,80,0.35)", backdropFilter: "blur(14px)" }}>
            <div className="flex items-start justify-between mb-3">
              <div className="min-w-0 pr-2">
                <p className="text-sm font-bold leading-tight" style={{ color: "var(--text)" }}>{selectedPt.country}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{selectedPt.iso3} · {cropInfo.label}</p>
              </div>
              <button onClick={() => setSelectedPt(null)}
                      className="opacity-40 hover:opacity-80 text-base flex-shrink-0"
                      style={{ color: "var(--muted)" }}>✕</button>
            </div>

            {viewMode !== "arable" ? (
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: "Production",    val: fmtProduction(selectedPt.production) },
                  { label: "Yield",         val: `${selectedPt.yield.toFixed(2)} t/ha` },
                  { label: "Harvested Area",val: `${fmtNum(selectedPt.area)}K ha` },
                  { label: "% World Total", val: `${selectedPt.worldPct.toFixed(1)}%` },
                ].map(m => (
                  <div key={m.label} className="rounded-lg px-2 py-1.5"
                       style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>{m.label}</p>
                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{m.val}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg px-3 py-2"
                   style={{ background: "rgba(76,175,80,0.08)", border: "1px solid rgba(76,175,80,0.2)" }}>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Arable Land</p>
                <p className="text-xl font-bold" style={{ color: "#7ec850" }}>{selectedPt.rawLabel}</p>
              </div>
            )}

            {/* Mini progress bar for world share */}
            {viewMode === "production" && selectedPt.worldPct > 0 && (
              <div className="mt-3">
                <div className="h-1.5 rounded-full overflow-hidden"
                     style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div className="h-full rounded-full"
                       style={{ width: `${Math.min(100, selectedPt.worldPct * 3)}%`, background: "linear-gradient(to right, #4caf50, #c8f070)" }} />
                </div>
                <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                  {selectedPt.worldPct.toFixed(1)}% of world {cropInfo.label.toLowerCase()} production
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

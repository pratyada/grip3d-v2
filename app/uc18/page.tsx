"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import Link from "next/link"

// ── Types ─────────────────────────────────────────────────────────────────────

type HazardCategory = "wildfire" | "storm" | "volcano" | "earthquake" | "flood" | "iceberg"
type FilterCategory = "all" | HazardCategory

interface HazardEvent {
  id: string
  title: string
  lat: number
  lng: number
  date: string
  category: HazardCategory
  severity: "critical" | "high" | "moderate" | "low"
  source: string
  sourceUrl: string
  magnitude?: string
  country?: string
  description?: string
}

interface CountryFeature {
  type: "Feature"
  id: string
  properties: { name: string }
  geometry: any
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<HazardCategory, { label: string; color: string; icon: string }> = {
  wildfire:   { label: "Wildfires",          color: "#ff4422", icon: "\u{1F525}" },
  storm:      { label: "Severe Storms",      color: "#4488ff", icon: "\u{1F300}" },
  volcano:    { label: "Volcanic Activity",  color: "#ff6600", icon: "\u{1F30B}" },
  earthquake: { label: "Earthquakes",        color: "#ffcc00", icon: "\u26A1"    },
  flood:      { label: "Floods",             color: "#00aaff", icon: "\u{1F30A}" },
  iceberg:    { label: "Icebergs & Sea Ice", color: "#88ddff", icon: "\u{1F9CA}" },
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ff0033",
  high:     "#ff6600",
  moderate: "#ffaa00",
  low:      "#66cc66",
}

const CATEGORIES: HazardCategory[] = ["wildfire", "storm", "volcano", "earthquake", "flood", "iceberg"]

// ── Geometry helpers ──────────────────────────────────────────────────────────

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

// ── Main component ────────────────────────────────────────────────────────────

type StatusT = "loading" | "ready" | "error"

export default function UC18Page() {
  const globeRef  = useRef<HTMLDivElement>(null)
  const globeInst = useRef<any>(null)

  const [status,          setStatus]          = useState<StatusT>("loading")
  const [errorMsg,        setErrorMsg]        = useState("")
  const [events,          setEvents]          = useState<HazardEvent[]>([])
  const [selectedEvent,   setSelectedEvent]   = useState<HazardEvent | null>(null)
  const [isSpinning,      setIsSpinning]      = useState(true)
  const [categoryFilter,  setCategoryFilter]  = useState<FilterCategory>("all")
  const [severityFilter,  setSeverityFilter]  = useState<"all" | "critical" | "high" | "moderate" | "low">("all")
  const [liveTime,        setLiveTime]        = useState(new Date())
  const [lastUpdated,     setLastUpdated]     = useState<Date | null>(null)
  const [globeReady,      setGlobeReady]      = useState(false)

  const [countries,       setCountries]       = useState<CountryFeature[]>([])
  const [hoveredCountry,  setHoveredCountry]  = useState<CountryFeature | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<CountryFeature | null>(null)

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setLiveTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // ── Filtering ───────────────────────────────────────────────────────────────

  const filteredEvents = useMemo(() => {
    let f = events
    if (categoryFilter !== "all") f = f.filter(e => e.category === categoryFilter)
    if (severityFilter !== "all") f = f.filter(e => e.severity === severityFilter)
    return f
  }, [events, categoryFilter, severityFilter])

  const categoryCounts = useMemo(() => {
    const c: Record<FilterCategory, number> = { all: events.length, wildfire: 0, storm: 0, volcano: 0, earthquake: 0, flood: 0, iceberg: 0 }
    for (const e of events) c[e.category] = (c[e.category] ?? 0) + 1
    return c
  }, [events])

  // ── Country stats ───────────────────────────────────────────────────────────

  const countryStats = useMemo(() => {
    if (!selectedCountry || !events.length) return null
    const name = selectedCountry.properties.name
    const bbox = featureBbox(selectedCountry.geometry)
    const matching = events.filter(e =>
      e.lat >= bbox.minLat && e.lat <= bbox.maxLat &&
      e.lng >= bbox.minLng && e.lng <= bbox.maxLng
    )
    const byCategory: Partial<Record<HazardCategory, number>> = {}
    for (const e of matching) byCategory[e.category] = (byCategory[e.category] ?? 0) + 1
    const sorted = [...matching].sort((a, b) => {
      const order = { critical: 0, high: 1, moderate: 2, low: 3 }
      return order[a.severity] - order[b.severity]
    })
    return { name, count: matching.length, byCategory, topEvents: sorted.slice(0, 3) }
  }, [selectedCountry, events])

  // ── Country polygons ────────────────────────────────────────────────────────

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
        setSelectedEvent(null)
        const { lat, lng } = featureCentroid(f.geometry)
        if (globeInst.current) globeInst.current.pointOfView({ lat, lng, altitude: 2.0 }, 800)
        setIsSpinning(false)
      })
  }

  // ── Data fetching ───────────────────────────────────────────────────────────

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/natural-hazards", { cache: "no-store" })
      if (!res.ok) throw new Error(`API ${res.status}`)
      const data: HazardEvent[] = await res.json()
      setEvents(data)
      setLastUpdated(new Date())
      setStatus("ready")
    } catch (err: any) {
      if (events.length === 0) {
        setErrorMsg(err?.message ?? "Unknown")
        setStatus("error")
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch countries
  const fetchCountries = useCallback(async () => {
    try {
      const geoRes = await fetch("/countries-110m.geojson")
      const geo = await geoRes.json()
      setCountries(geo.features as CountryFeature[])
    } catch {
      // Country borders are optional
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchEvents()
    fetchCountries()
  }, [fetchEvents, fetchCountries])

  // 15-min polling
  useEffect(() => {
    if (status !== "ready") return
    const id = setInterval(fetchEvents, 900_000)
    return () => clearInterval(id)
  }, [status, fetchEvents])

  // ── Globe init ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (status !== "ready" || !globeRef.current || globeInst.current) return

    import("globe.gl").then(mod => {
      if (!globeRef.current) return
      const GlobeGL = (mod.default ?? mod) as any
      const globe = new GlobeGL()
      globe(globeRef.current)
        .width(globeRef.current.clientWidth)
        .height(globeRef.current.clientHeight)
        .globeImageUrl("//unpkg.com/three-globe/example/img/earth-day.jpg")
        .bumpImageUrl("//unpkg.com/three-globe/example/img/earth-topology.png")
        .backgroundImageUrl("//unpkg.com/three-globe/example/img/night-sky.png")
        .atmosphereColor("#ff6600")
        .atmosphereAltitude(0.12)
        .pointOfView({ lat: 20, lng: 0, altitude: 2.2 })

      globe.controls().autoRotate = true
      globe.controls().autoRotateSpeed = 0.2
      globe.controls().enableDamping = true
      globe.controls().dampingFactor = 0.1

      globeInst.current = globe
      setGlobeReady(true)
    })

    return () => {
      globeInst.current?.controls()?.dispose?.()
      globeInst.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  // ── Apply points data ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!globeInst.current || !globeReady) return
    const globe = globeInst.current

    globe
      .pointsData(filteredEvents)
      .pointLat("lat")
      .pointLng("lng")
      .pointAltitude(0.005)
      .pointRadius((d: HazardEvent) =>
        d.severity === "critical" ? 0.55 : d.severity === "high" ? 0.4 : d.severity === "moderate" ? 0.28 : 0.18
      )
      .pointColor((d: HazardEvent) => CATEGORY_CONFIG[d.category].color)
      .pointResolution(24)
      .pointsMerge(false)
      .pointLabel((d: HazardEvent) => `
        <div style="font-family:sans-serif;padding:8px 12px;background:rgba(0,0,0,0.9);border-radius:8px;border:1px solid ${CATEGORY_CONFIG[d.category].color}40;color:#fff;font-size:12px;max-width:260px;">
          <b style="color:${CATEGORY_CONFIG[d.category].color}">${CATEGORY_CONFIG[d.category].icon} ${d.title}</b><br/>
          Category: ${CATEGORY_CONFIG[d.category].label}<br/>
          Severity: <b style="color:${SEVERITY_COLORS[d.severity]}">${d.severity.toUpperCase()}</b><br/>
          ${d.magnitude ? `Magnitude: ${d.magnitude}<br/>` : ""}
          ${d.country ? `Country: ${d.country}<br/>` : ""}
          <span style="color:#aaa;font-size:11px">${d.date} &middot; ${d.source}</span>
        </div>
      `)
      .onPointClick((d: HazardEvent) => {
        setSelectedEvent(d)
        setSelectedCountry(null)
        globeInst.current?.pointOfView({ lat: d.lat, lng: d.lng, altitude: 1.5 }, 700)
        setIsSpinning(false)
      })
      .onPointHover((d: HazardEvent | null) => {
        if (globeRef.current) globeRef.current.style.cursor = d ? "pointer" : "default"
      })
  }, [filteredEvents, globeReady])

  // ── Apply country borders ───────────────────────────────────────────────────

  useEffect(() => {
    if (!globeInst.current || !globeReady || !countries.length) return
    applyCountries(globeInst.current, countries, hoveredCountry, selectedCountry)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoveredCountry, selectedCountry, countries, globeReady])

  // ── Spin toggle ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!globeInst.current) return
    globeInst.current.controls().autoRotate = isSpinning
  }, [isSpinning])

  // ── Resize ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!globeInst.current || !globeRef.current) return
    const ro = new ResizeObserver(() => {
      if (globeRef.current && globeInst.current) {
        globeInst.current.width(globeRef.current.clientWidth)
        globeInst.current.height(globeRef.current.clientHeight)
      }
    })
    ro.observe(globeRef.current)
    return () => ro.disconnect()
  }, [globeReady])

  // ── Pulse animation ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!globeInst.current || !globeReady) return
    let frame = 0
    const id = setInterval(() => {
      frame++
      const pulse = 1 + 0.15 * Math.sin(frame * 0.12)
      globeInst.current
        ?.pointRadius((d: HazardEvent) => {
          const base = d.severity === "critical" ? 0.55 : d.severity === "high" ? 0.4 : d.severity === "moderate" ? 0.28 : 0.18
          return base * pulse
        })
    }, 80)
    return () => clearInterval(id)
  }, [globeReady])

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const fmtTime = (d: Date) => d.toUTCString().replace("GMT", "UTC").slice(5, 25)

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (status === "loading") return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: "calc(100vh - 64px)", background: "var(--bg)" }}>
      <div className="text-center max-w-sm">
        <div className="mb-6 relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: "#ff4444", borderRightColor: "#4488ff" }} />
          <div className="absolute inset-3 rounded-full flex items-center justify-center" style={{ background: "rgba(255,80,0,0.15)" }}>
            <span className="text-xl">{"\u{1F30D}"}</span>
          </div>
        </div>
        <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--text)" }}>Loading natural hazards...</h2>
        <p className="text-sm" style={{ color: "var(--muted)" }}>Fetching data from NASA EONET + GDACS</p>
      </div>
    </div>
  )

  if (status === "error") return (
    <div className="flex flex-col items-center justify-center gap-4" style={{ minHeight: "calc(100vh - 64px)", background: "var(--bg)" }}>
      <span className="text-4xl">{"\u26A0\uFE0F"}</span>
      <p className="text-lg font-semibold" style={{ color: "var(--text)" }}>Failed to load hazard data</p>
      <p className="text-sm" style={{ color: "var(--muted)" }}>{errorMsg}</p>
      <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "#ff4444", color: "#fff" }}>Retry</button>
    </div>
  )

  return (
    <div className="relative" style={{ minHeight: "calc(100vh - 64px)", background: "#000" }}>
      <div ref={globeRef} className="absolute inset-0" />

      {/* ── Top-left: Title + stats ──────────────────────────────────────────── */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-4 pointer-events-none">
        <div className="pointer-events-auto">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-lg font-bold" style={{ color: "var(--text)" }}>{"\u{1F30D}"} Global Natural Hazards</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold animate-pulse" style={{ background: "rgba(255,0,50,0.2)", color: "#ff0033", border: "1px solid rgba(255,0,50,0.35)" }}>LIVE</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Active Events", val: events.length.toString() },
              { label: "Wildfires",     val: (categoryCounts.wildfire ?? 0).toString() },
              { label: "Storms",        val: (categoryCounts.storm ?? 0).toString() },
              { label: "Earthquakes",   val: (categoryCounts.earthquake ?? 0).toString() },
              { label: "Updated",       val: lastUpdated ? fmtTime(lastUpdated) : "\u2014" },
              { label: "UTC",           val: fmtTime(liveTime) },
            ].map(s => (
              <div key={s.label} className="px-3 py-1.5 rounded-lg text-xs" style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", color: "var(--text)" }}>
                <span style={{ color: "var(--muted)" }}>{s.label} </span><span className="font-semibold">{s.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Top-right: Controls ──────────────────────────────────────────── */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button onClick={() => setIsSpinning(s => !s)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)", color: "var(--muted)", backdropFilter: "blur(8px)" }}>
            {isSpinning ? "\u23F8 Pause" : "\u25B6 Spin"}
          </button>
          <Link href="/uc18/details" className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "rgba(255,80,0,0.12)", border: "1px solid rgba(255,80,0,0.3)", color: "#ff8844", backdropFilter: "blur(8px)" }}>Architecture {"\u2192"}</Link>
        </div>
      </div>

      {/* ── Bottom-left: Category + Severity filters ─────────────────────── */}
      <div className="absolute bottom-4 left-4 pointer-events-auto w-60">
        <div className="rounded-xl p-3" style={{ background: "rgba(0,0,0,0.78)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(14px)" }}>
          <p className="text-xs font-semibold tracking-wider mb-2" style={{ color: "var(--muted)" }}>HAZARD TYPE</p>
          <div className="flex flex-col gap-1 mb-3">
            {/* All Hazards */}
            <button
              onClick={() => { setCategoryFilter("all"); setSelectedEvent(null) }}
              className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-left"
              style={{
                background: categoryFilter === "all" ? "rgba(255,255,255,0.1)" : "transparent",
                border: categoryFilter === "all" ? "1px solid rgba(255,255,255,0.3)" : "1px solid transparent",
                color: categoryFilter === "all" ? "var(--text)" : "var(--muted)",
              }}
            >
              <span>All Hazards</span>
              <span className="font-mono opacity-60">{categoryCounts.all}</span>
            </button>
            {CATEGORIES.map(cat => {
              const cfg = CATEGORY_CONFIG[cat]
              const active = categoryFilter === cat
              return (
                <button key={cat} onClick={() => { setCategoryFilter(cat); setSelectedEvent(null) }}
                  className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-left"
                  style={{
                    background: active ? cfg.color + "22" : "transparent",
                    border: active ? `1px solid ${cfg.color}` : "1px solid transparent",
                    color: active ? cfg.color : "var(--muted)",
                  }}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                    {cfg.icon} {cfg.label}
                  </span>
                  <span className="font-mono opacity-60">{categoryCounts[cat] ?? 0}</span>
                </button>
              )
            })}
          </div>

          <p className="text-xs font-semibold tracking-wider mb-2" style={{ color: "var(--muted)" }}>SEVERITY</p>
          <div className="flex gap-1 flex-wrap">
            {(["all", "critical", "high", "moderate", "low"] as const).map(sev => {
              const active = severityFilter === sev
              const sevColor = sev === "all" ? "#888" : SEVERITY_COLORS[sev]
              return (
                <button key={sev} onClick={() => setSeverityFilter(sev)}
                  className="px-2 py-1 rounded text-xs capitalize"
                  style={{
                    background: active ? sevColor + "22" : "transparent",
                    border: active ? `1px solid ${sevColor}` : "1px solid transparent",
                    color: active ? sevColor : "var(--muted)",
                  }}
                >
                  {sev}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Country hover tooltip ──────────────────────────────────────────── */}
      {hoveredCountry && !selectedCountry && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none" style={{ zIndex: 10 }}>
          <div className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "rgba(0,0,0,0.75)", border: "1px solid rgba(255,255,255,0.15)", color: "var(--text)", backdropFilter: "blur(8px)" }}>
            {hoveredCountry.properties.name}
          </div>
        </div>
      )}

      {/* ── Bottom-right: Country stats panel ──────────────────────────────── */}
      {selectedCountry && countryStats && !selectedEvent && (
        <div className="absolute bottom-4 right-4 pointer-events-auto w-72" style={{ zIndex: 10 }}>
          <div className="rounded-xl p-4" style={{
            background: "rgba(0,0,0,0.88)",
            border: "1px solid rgba(255,100,0,0.3)",
            backdropFilter: "blur(14px)",
          }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--text)" }}>{countryStats.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  {countryStats.count} active hazard{countryStats.count !== 1 ? "s" : ""} detected
                </p>
              </div>
              <button onClick={() => setSelectedCountry(null)} className="opacity-40 hover:opacity-80" style={{ color: "var(--muted)" }}>{"\u2715"}</button>
            </div>

            {/* Breakdown by category */}
            {countryStats.count > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {CATEGORIES.filter(cat => (countryStats.byCategory[cat] ?? 0) > 0).map(cat => (
                  <span key={cat} className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                    style={{ background: CATEGORY_CONFIG[cat].color + "18", color: CATEGORY_CONFIG[cat].color, border: `1px solid ${CATEGORY_CONFIG[cat].color}40` }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: CATEGORY_CONFIG[cat].color }} />
                    {CATEGORY_CONFIG[cat].label}: {countryStats.byCategory[cat]}
                  </span>
                ))}
              </div>
            )}

            {/* Top events */}
            {countryStats.topEvents.length > 0 ? (
              <div className="flex flex-col gap-0.5">
                <p className="text-xs font-semibold mb-1" style={{ color: "var(--muted)" }}>Most severe events:</p>
                {countryStats.topEvents.map(ev => (
                  <div key={ev.id} className="px-2 py-1 rounded text-xs truncate flex items-center gap-2"
                    style={{ background: "rgba(255,100,0,0.08)", color: "var(--muted)" }}>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: SEVERITY_COLORS[ev.severity] }} />
                    <span className="truncate">{ev.title}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs" style={{ color: "var(--muted)" }}>No active hazards in bounding area</p>
            )}
          </div>
        </div>
      )}

      {/* ── Bottom-right: Event detail panel ───────────────────────────────── */}
      {selectedEvent && (
        <div className="absolute bottom-4 right-4 pointer-events-auto w-72" style={{ zIndex: 10 }}>
          <div className="rounded-xl p-4" style={{
            background: "rgba(0,0,0,0.88)",
            border: `1px solid ${CATEGORY_CONFIG[selectedEvent.category].color}44`,
            backdropFilter: "blur(14px)",
          }}>
            <div className="flex items-start justify-between mb-3">
              <div className="min-w-0 pr-2">
                <p className="text-sm font-bold leading-tight" style={{ color: "var(--text)" }}>
                  {CATEGORY_CONFIG[selectedEvent.category].icon} {selectedEvent.title}
                </p>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="opacity-40 hover:opacity-80 text-base flex-shrink-0" style={{ color: "var(--muted)" }}>{"\u2715"}</button>
            </div>

            {/* Badges */}
            <div className="flex gap-2 mb-3">
              <span className="text-xs px-2 py-0.5 rounded-full" style={{
                background: CATEGORY_CONFIG[selectedEvent.category].color + "18",
                color: CATEGORY_CONFIG[selectedEvent.category].color,
                border: `1px solid ${CATEGORY_CONFIG[selectedEvent.category].color}40`,
              }}>
                {CATEGORY_CONFIG[selectedEvent.category].label}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{
                background: SEVERITY_COLORS[selectedEvent.severity] + "18",
                color: SEVERITY_COLORS[selectedEvent.severity],
                border: `1px solid ${SEVERITY_COLORS[selectedEvent.severity]}40`,
              }}>
                {selectedEvent.severity.toUpperCase()}
              </span>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {[
                { label: "Date", val: selectedEvent.date || "\u2014" },
                { label: "Source", val: selectedEvent.source || "\u2014" },
                ...(selectedEvent.magnitude ? [{ label: "Magnitude", val: selectedEvent.magnitude }] : []),
                ...(selectedEvent.country ? [{ label: "Country", val: selectedEvent.country }] : []),
                { label: "Latitude", val: `${selectedEvent.lat.toFixed(3)}\u00B0` },
                { label: "Longitude", val: `${selectedEvent.lng.toFixed(3)}\u00B0` },
              ].map(m => (
                <div key={m.label} className="rounded-lg px-2 py-1.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{m.label}</p>
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>{m.val}</p>
                </div>
              ))}
            </div>

            {selectedEvent.sourceUrl && (
              <a href={selectedEvent.sourceUrl} target="_blank" rel="noopener noreferrer"
                className="block text-xs text-center py-1.5 rounded-lg"
                style={{
                  background: CATEGORY_CONFIG[selectedEvent.category].color + "20",
                  color: CATEGORY_CONFIG[selectedEvent.category].color,
                  border: `1px solid ${CATEGORY_CONFIG[selectedEvent.category].color}40`,
                }}>
                View source {"\u2192"}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

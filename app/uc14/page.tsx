"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import Link from "next/link"
import {
  getCities,
  getGlobalStats,
  getMonthlyTrend,
  getTopCitiesByCategory,
  JOB_CATEGORIES,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  type JobCategory,
  type CityJobData,
} from "@/lib/uc14-data"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, CartesianGrid,
} from "recharts"

// ── Types ─────────────────────────────────────────────────────────────────────
interface CountryFeature {
  type: "Feature"
  id: string
  properties: { name: string }
  geometry: any
}

// ── helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : String(n)
const salaryFmt = (n: number) => `$${(n / 1000).toFixed(0)}K`

// Max jobs across all cities — used for point size normalisation
const MAX_JOBS = Math.max(...getCities().map(c => c.totalJobs))

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

// ── Globe config helpers ──────────────────────────────────────────────────────
function cityToPoint(city: CityJobData, filterCat: JobCategory | null) {
  const jobs = filterCat ? city.jobsByCategory[filterCat] : city.totalJobs
  const color = CATEGORY_COLORS[filterCat ?? city.topCategory]
  return {
    lat: city.lat,
    lng: city.lng,
    altitude: 0.01 + (jobs / MAX_JOBS) * 0.14,
    radius: 0.3 + (jobs / MAX_JOBS) * 1.8,
    color,
    city,
    label: `${city.city} · ${fmt(jobs)} jobs`,
  }
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function UC14Page() {
  const globeRef = useRef<HTMLDivElement>(null)
  const globeInstance = useRef<any>(null)

  const [selectedCategory, setSelectedCategory] = useState<JobCategory | null>(null)
  const [selectedCity, setSelectedCity] = useState<CityJobData | null>(null)
  const [activeTab, setActiveTab] = useState<"breakdown" | "trend">("breakdown")
  const [globeReady, setGlobeReady] = useState(false)
  const [isSpinning, setIsSpinning] = useState(true)
  const [countries,        setCountries]        = useState<CountryFeature[]>([])
  const [hoveredCountry,   setHoveredCountry]   = useState<CountryFeature | null>(null)
  const [selectedCountry,  setSelectedCountry]  = useState<CountryFeature | null>(null)

  const stats = getGlobalStats()
  const cityData = getCities()

  // ── Build point data ──────────────────────────────────────────────────────
  const points = cityData.map(c => cityToPoint(c, selectedCategory))

  // ── Country polygon helpers ───────────────────────────────────────────────
  function applyCountries(
    globe: any,
    features: CountryFeature[],
    hovered: CountryFeature | null,
    selected: CountryFeature | null,
  ) {
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
        const { lat, lng } = featureCentroid(f.geometry)
        if (globeInstance.current) globeInstance.current.pointOfView({ lat, lng, altitude: 2.0 }, 800)
        setIsSpinning(false)
      })
  }

  // ── Country stats ─────────────────────────────────────────────────────────
  const countryStats = useMemo(() => {
    if (!selectedCountry || !cityData) return null
    const name = selectedCountry.properties.name
    const citiesInCountry = cityData.filter(c => c.country === name || c.country.includes(name))
    if (!citiesInCountry.length) return null
    const totalJobs = citiesInCountry.reduce((s, c) => s + c.totalJobs, 0)
    const avgSalary = Math.round(citiesInCountry.reduce((s, c) => s + c.avgSalaryUSD, 0) / citiesInCountry.length)
    const topCat = citiesInCountry.reduce((best, c) => c.totalJobs > best.totalJobs ? c : best).topCategory
    return { name, cities: citiesInCountry, totalJobs, avgSalary, topCat }
  }, [selectedCountry, cityData])

  // ── Fetch GeoJSON countries ───────────────────────────────────────────────
  useEffect(() => {
    fetch("/countries-110m.geojson")
      .then(r => r.json())
      .then(geo => setCountries(geo.features))
      .catch(() => {/* silently ignore if not available */})
  }, [])

  // ── Re-apply countries on hover/selection change ──────────────────────────
  useEffect(() => {
    if (!globeInstance.current || !countries.length) return
    applyCountries(globeInstance.current, countries, hoveredCountry, selectedCountry)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoveredCountry, selectedCountry, countries])

  // ── Init globe.gl ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!globeRef.current || globeInstance.current) return
    let globe: any

    import("globe.gl").then(mod => {
      const GlobeGL = (mod.default ?? mod) as any
      globe = new GlobeGL()

      globe(globeRef.current)
        .width(globeRef.current!.clientWidth)
        .height(globeRef.current!.clientHeight)
        // ── Earth style (dark night Earth from unpkg CDN) ──
        .globeImageUrl("//unpkg.com/three-globe/example/img/earth-night.jpg")
        .bumpImageUrl("//unpkg.com/three-globe/example/img/earth-topology.png")
        .backgroundImageUrl("//unpkg.com/three-globe/example/img/night-sky.png")
        .atmosphereColor("#33ccdd")
        .atmosphereAltitude(0.18)
        // ── Initial view (altitude ~1.5 ≈ zoom 8-9, fills the viewport) ──
        .pointOfView({ lat: 25, lng: 10, altitude: 1.5 })
        // ── Ring glow for emphasis ──
        .ringsData(getCities().slice(0, 8).map(c => ({
          lat: c.lat, lng: c.lng,
          maxR: 3, propagationSpeed: 1.5, repeatPeriod: 1200,
          color: () => CATEGORY_COLORS[c.topCategory],
        })))
        .ringColor("color")
        .ringMaxRadius("maxR")
        .ringPropagationSpeed("propagationSpeed")
        .ringRepeatPeriod("repeatPeriod")
        // ── City points ──
        .pointsData(points)
        .pointLat("lat")
        .pointLng("lng")
        .pointAltitude("altitude")
        .pointRadius("radius")
        .pointColor("color")
        .pointsMerge(false)
        .pointLabel("label")
        // ── Interactivity ──
        .onPointClick((pt: any) => {
          setSelectedCity(pt.city)
        })

      // ── Country borders ──
      applyCountries(globe, countries, null, null)

      // Auto-rotate
      const ctrl = globe.controls()
      ctrl.autoRotate = true
      ctrl.autoRotateSpeed = 0.4
      ctrl.enableDamping = true

      globeInstance.current = globe
      setGlobeReady(true)
    })

    // Resize handler
    const onResize = () => {
      if (globe && globeRef.current) {
        globe.width(globeRef.current.clientWidth)
        globe.height(globeRef.current.clientHeight)
      }
    }
    window.addEventListener("resize", onResize)
    return () => {
      window.removeEventListener("resize", onResize)
      globe?._destructor?.()
      globeInstance.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Update points when category filter changes ────────────────────────────
  useEffect(() => {
    if (!globeReady || !globeInstance.current) return
    const newPoints = cityData.map(c => cityToPoint(c, selectedCategory))
    globeInstance.current
      .pointsData(newPoints)
      .pointAltitude("altitude")
      .pointRadius("radius")
      .pointColor("color")
  }, [selectedCategory, globeReady])

  // ── Spin toggle ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!globeInstance.current) return
    globeInstance.current.controls().autoRotate = isSpinning && !selectedCity
  }, [isSpinning, selectedCity])

  // ── Stop auto-rotate when city is selected ────────────────────────────────
  useEffect(() => {
    if (!globeInstance.current) return
    const ctrl = globeInstance.current.controls()
    if (selectedCity) {
      ctrl.autoRotate = false
      globeInstance.current.pointOfView(
        { lat: selectedCity.lat, lng: selectedCity.lng, altitude: 1.4 },
        800
      )
    } else {
      ctrl.autoRotate = isSpinning
    }
  }, [selectedCity, isSpinning])

  const catBreakdown = selectedCity
    ? JOB_CATEGORIES.map(cat => ({
        name: cat.split(" ")[0],
        full: cat,
        jobs: selectedCity.jobsByCategory[cat],
        color: CATEGORY_COLORS[cat],
      })).sort((a, b) => b.jobs - a.jobs)
    : []

  const trend = selectedCity ? getMonthlyTrend(selectedCity.id) : []

  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "var(--text)" }}>
      {/* ── Top bar ── */}
      <div style={{
        position: "relative", zIndex: 10,
        padding: "clamp(12px,2vw,20px) clamp(16px,4vw,48px)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 10,
        background: "linear-gradient(to bottom, rgba(5,5,8,0.98) 0%, rgba(5,5,8,0.7) 100%)",
      }}>
        <div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
            <Link href="/use-cases" style={{ fontSize: 12, color: "var(--muted)", textDecoration: "none" }}>← Use Cases</Link>
            <span style={{ color: "var(--border)" }}>·</span>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>UC14</span>
          </div>
          <h1 style={{ fontSize: "clamp(18px,2.5vw,26px)", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
            🌍 World Job Market
          </h1>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: "3px 0 0" }}>
            {fmt(stats.totalJobs)}+ listings · {stats.totalCities} cities · rotate &amp; click to explore
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Spin toggle */}
          <button
            onClick={() => setIsSpinning(v => !v)}
            title={isSpinning ? "Stop rotation" : "Start rotation"}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              cursor: "pointer",
              background: isSpinning ? "rgba(51,204,221,0.12)" : "var(--surface)",
              color: isSpinning ? "var(--accent)" : "var(--muted)",
              border: `1px solid ${isSpinning ? "var(--accent)" : "var(--border)"}`,
              transition: "all 0.2s",
            }}
          >
            <span style={{ fontSize: 14 }}>{isSpinning ? "⏸" : "▶"}</span>
            {isSpinning ? "Stop" : "Spin"}
          </button>
          <Link href="/uc14/details" style={{
            fontSize: 12, fontWeight: 600, color: "var(--accent)",
            border: "1px solid var(--accent)", borderRadius: 8,
            padding: "6px 14px", textDecoration: "none",
          }}>Details →</Link>
        </div>
      </div>

      {/* ── Category chips (overlaid on globe) ── */}
      <div style={{
        position: "relative", zIndex: 10,
        padding: "0 clamp(16px,4vw,48px) 12px",
        display: "flex", gap: 6, flexWrap: "wrap",
      }}>
        <button
          onClick={() => setSelectedCategory(null)}
          style={{
            padding: "5px 12px", borderRadius: 100, fontSize: 11, fontWeight: 700, cursor: "pointer",
            background: !selectedCategory ? "var(--accent)" : "rgba(20,20,24,0.85)",
            color: !selectedCategory ? "#000" : "var(--muted)",
            border: `1px solid ${!selectedCategory ? "var(--accent)" : "rgba(255,255,255,0.1)"}`,
            backdropFilter: "blur(8px)",
          }}
        >All</button>
        {JOB_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
            style={{
              padding: "5px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700, cursor: "pointer",
              background: selectedCategory === cat ? CATEGORY_COLORS[cat] + "28" : "rgba(20,20,24,0.85)",
              color: selectedCategory === cat ? CATEGORY_COLORS[cat] : "var(--muted)",
              border: `1px solid ${selectedCategory === cat ? CATEGORY_COLORS[cat] + "88" : "rgba(255,255,255,0.1)"}`,
              backdropFilter: "blur(8px)",
            }}
          >
            {CATEGORY_ICONS[cat]} {cat}
          </button>
        ))}
      </div>

      {/* ── Globe + detail panel ── */}
      <div style={{ position: "relative", display: "flex" }}>
        {/* Globe container */}
        <div
          ref={globeRef}
          style={{
            flex: 1,
            height: "clamp(420px,65vh,720px)",
            background: "#050508",
            cursor: "grab",
          }}
        />

        {/* ── Country hover tooltip ── */}
        {hoveredCountry && !selectedCountry && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none" style={{ zIndex: 10 }}>
            <div className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: "rgba(0,0,0,0.75)", border: "1px solid rgba(255,255,255,0.15)", color: "var(--text)", backdropFilter: "blur(8px)" }}>
              {hoveredCountry.properties.name}
            </div>
          </div>
        )}

        {/* ── Country stats panel ── */}
        {selectedCountry && countryStats && (
          <div className="absolute bottom-4 right-4 pointer-events-auto w-68"
            style={{ zIndex: 10 }}>
            <div className="rounded-xl p-4" style={{
              background: "rgba(0,0,0,0.88)",
              border: "1px solid rgba(255,255,255,0.2)",
              backdropFilter: "blur(14px)",
            }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-bold" style={{ color: "var(--text)" }}>{countryStats.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                    {countryStats.cities.length} cit{countryStats.cities.length === 1 ? "y" : "ies"} tracked
                  </p>
                </div>
                <button onClick={() => setSelectedCountry(null)}
                  className="opacity-40 hover:opacity-80" style={{ color: "var(--muted)" }}>✕</button>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[
                  { label: "Total Jobs",   val: countryStats.totalJobs.toLocaleString() },
                  { label: "Avg Salary",   val: `$${(countryStats.avgSalary / 1000).toFixed(0)}K` },
                  { label: "Top Sector",   val: countryStats.topCat },
                  { label: "Cities",       val: countryStats.cities.length.toString() },
                ].map(m => (
                  <div key={m.label} className="rounded-lg px-2 py-1.5"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>{m.label}</p>
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>{m.val}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-0.5 max-h-28 overflow-y-auto">
                {countryStats.cities.map(c => (
                  <div key={c.id} className="flex items-center justify-between px-2 py-1 rounded text-xs"
                    style={{ background: "rgba(255,255,255,0.03)" }}>
                    <span style={{ color: "var(--text)" }}>{c.city}</span>
                    <span style={{ color: "var(--muted)" }}>{c.totalJobs.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* City detail panel */}
        {selectedCity && (
          <div style={{
            width: "clamp(280px,28vw,340px)",
            height: "clamp(420px,65vh,720px)",
            background: "rgba(8,8,12,0.97)",
            borderLeft: "1px solid rgba(51,204,221,0.15)",
            display: "flex", flexDirection: "column",
            overflowY: "auto",
            flexShrink: 0,
          }}>
            {/* City header */}
            <div style={{ padding: "20px 18px 14px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>{selectedCity.city}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                    {selectedCity.country} · {selectedCity.region}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCity(null)}
                  style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 18, cursor: "pointer", padding: 4, lineHeight: 1 }}
                >✕</button>
              </div>

              {/* KPIs */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 14 }}>
                {[
                  { label: "Total Jobs",  value: fmt(selectedCity.totalJobs) },
                  { label: "Avg Salary",  value: salaryFmt(selectedCity.avgSalaryUSD) },
                  { label: "Remote",      value: `${selectedCity.remotePercent}%` },
                  { label: "YoY Growth",  value: `${selectedCity.growthRate > 0 ? "+" : ""}${selectedCity.growthRate}%`,
                    color: selectedCity.growthRate >= 0 ? "#22c55e" : "#ef4444" },
                ].map(kpi => (
                  <div key={kpi.label} style={{
                    padding: "10px 12px", borderRadius: 10,
                    background: "var(--surface)", border: "1px solid var(--border)",
                  }}>
                    <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 2 }}>{kpi.label}</div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: kpi.color ?? "var(--accent)" }}>{kpi.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
              {(["breakdown", "trend"] as const).map(t => (
                <button key={t} onClick={() => setActiveTab(t)} style={{
                  flex: 1, padding: "10px 6px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                  background: "none", border: "none",
                  borderBottom: activeTab === t ? `2px solid var(--accent)` : "2px solid transparent",
                  color: activeTab === t ? "var(--accent)" : "var(--muted)",
                  textTransform: "capitalize",
                }}>{t === "breakdown" ? "By Sector" : "Monthly Trend"}</button>
              ))}
            </div>

            {/* Chart */}
            <div style={{ padding: "14px 10px", flex: 1 }}>
              {activeTab === "breakdown" ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={catBreakdown} layout="vertical" margin={{ left: 6, right: 8 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" tick={{ fill: "var(--muted)", fontSize: 10 }} width={66} />
                    <Tooltip
                      formatter={(v) => [fmt(Number(v)), "Jobs"]}
                      contentStyle={{ background: "#111", border: "1px solid var(--border)", fontSize: 11 }}
                    />
                    <Bar dataKey="jobs" radius={[0, 4, 4, 0]}>
                      {catBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={trend} margin={{ left: 0, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" tick={{ fill: "var(--muted)", fontSize: 10 }} />
                    <YAxis tickFormatter={fmt} tick={{ fill: "var(--muted)", fontSize: 10 }} />
                    <Tooltip
                      formatter={(v) => [fmt(Number(v)), "Listings"]}
                      contentStyle={{ background: "#111", border: "1px solid var(--border)", fontSize: 11 }}
                    />
                    <Line type="monotone" dataKey="jobs" stroke="var(--accent)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Top sector badge */}
            <div style={{ padding: "0 14px 14px", flexShrink: 0 }}>
              <div style={{
                padding: "10px 14px", borderRadius: 10,
                background: CATEGORY_COLORS[selectedCity.topCategory] + "18",
                border: `1px solid ${CATEGORY_COLORS[selectedCity.topCategory]}44`,
                fontSize: 12,
              }}>
                <span style={{ color: "var(--muted)" }}>Top sector: </span>
                <span style={{ fontWeight: 700, color: CATEGORY_COLORS[selectedCity.topCategory] }}>
                  {CATEGORY_ICONS[selectedCity.topCategory]} {selectedCity.topCategory}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Legend strip ── */}
      <div style={{
        background: "rgba(8,8,12,0.95)", borderTop: "1px solid rgba(51,204,221,0.1)",
        padding: "10px clamp(16px,4vw,48px)",
        display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center",
      }}>
        <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Sector colours:</span>
        {JOB_CATEGORIES.map(cat => (
          <div key={cat} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: CATEGORY_COLORS[cat] }} />
            <span style={{ fontSize: 11, color: "var(--muted)" }}>{cat}</span>
          </div>
        ))}
      </div>

      {/* ── Stats strip ── */}
      <div style={{ borderTop: "1px solid var(--border)", background: "var(--surface)" }}>
        <div style={{
          maxWidth: 1280, margin: "0 auto",
          padding: "clamp(20px,3vw,36px) clamp(16px,4vw,48px)",
          display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 24,
        }}>
          {[
            { label: "Total Listings",  value: fmt(stats.totalJobs),       sub: "across all cities" },
            { label: "Cities on Globe", value: String(stats.totalCities),  sub: "worldwide" },
            { label: "Fastest Growing", value: stats.fastestGrowing,       sub: "YoY listing growth" },
            { label: "Most Listings",   value: stats.topCity,              sub: "by volume" },
            { label: "Remote Average",  value: `${stats.remoteAvg}%`,      sub: "of roles listed" },
            { label: "Highest Remote",  value: stats.highestRemote,        sub: "most remote-friendly" },
          ].map(({ label, value, sub }) => (
            <div key={label}>
              <div style={{ fontSize: "clamp(18px,2vw,26px)", fontWeight: 900, color: "var(--accent)", lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginTop: 3 }}>{label}</div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Top cities table ── */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "clamp(32px,4vw,56px) clamp(16px,4vw,48px)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
          <h2 style={{ fontSize: "clamp(18px,2.5vw,26px)", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
            {selectedCategory ? `Top Cities — ${CATEGORY_ICONS[selectedCategory]} ${selectedCategory}` : "Top Cities by Total Jobs"}
          </h2>
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              style={{
                padding: "4px 12px", borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: "pointer",
                background: "var(--surface)", color: "var(--muted)",
                border: "1px solid var(--border)",
              }}
            >Clear filter ✕</button>
          )}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["#", "City", "Country", "Jobs", "Avg Salary", "Remote %", "YoY Growth", "Top Sector"].map(h => (
                  <th key={h} style={{
                    textAlign: "left", padding: "8px 12px", fontSize: 11, fontWeight: 700,
                    color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(selectedCategory
                ? getTopCitiesByCategory(selectedCategory)
                : [...getCities()].sort((a, b) => b.totalJobs - a.totalJobs).slice(0, 10)
              ).map((city, i) => (
                <tr
                  key={city.id}
                  onClick={() => { setSelectedCity(city); }}
                  style={{
                    borderBottom: "1px solid var(--border)", cursor: "pointer",
                    background: selectedCity?.id === city.id ? "var(--surface)" : "transparent",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--surface)")}
                  onMouseLeave={e => (e.currentTarget.style.background = selectedCity?.id === city.id ? "var(--surface)" : "transparent")}
                >
                  <td style={{ padding: "12px 12px", fontSize: 12, color: "var(--muted)", fontWeight: 700 }}>{i + 1}</td>
                  <td style={{ padding: "12px 12px", fontWeight: 700 }}>{city.city}</td>
                  <td style={{ padding: "12px 12px", fontSize: 13, color: "var(--muted)" }}>{city.country}</td>
                  <td style={{ padding: "12px 12px", fontWeight: 700, color: "var(--accent)" }}>
                    {fmt(selectedCategory ? city.jobsByCategory[selectedCategory] : city.totalJobs)}
                  </td>
                  <td style={{ padding: "12px 12px", fontSize: 13 }}>{salaryFmt(city.avgSalaryUSD)}</td>
                  <td style={{ padding: "12px 12px", fontSize: 13 }}>{city.remotePercent}%</td>
                  <td style={{ padding: "12px 12px", fontSize: 13, fontWeight: 700, color: city.growthRate >= 0 ? "#22c55e" : "#ef4444" }}>
                    {city.growthRate > 0 ? "+" : ""}{city.growthRate}%
                  </td>
                  <td style={{ padding: "12px 12px" }}>
                    <span style={{
                      padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                      background: CATEGORY_COLORS[city.topCategory] + "22",
                      color: CATEGORY_COLORS[city.topCategory],
                    }}>
                      {CATEGORY_ICONS[city.topCategory]} {city.topCategory}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Global sector breakdown ── */}
      <div style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", padding: "clamp(32px,4vw,56px) 0" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 clamp(16px,4vw,48px)" }}>
          <h2 style={{ fontSize: "clamp(18px,2.5vw,26px)", fontWeight: 800, margin: "0 0 24px", letterSpacing: "-0.02em" }}>
            Global Job Distribution by Sector
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
            {JOB_CATEGORIES.map(cat => {
              const count = stats.categoryBreakdown[cat]
              const pct = ((count / stats.totalJobs) * 100).toFixed(1)
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                  style={{
                    padding: "14px 16px", borderRadius: 12, textAlign: "left", cursor: "pointer",
                    background: selectedCategory === cat ? CATEGORY_COLORS[cat] + "22" : "var(--bg)",
                    border: `1px solid ${selectedCategory === cat ? CATEGORY_COLORS[cat] : "var(--border)"}`,
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{CATEGORY_ICONS[cat]}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text)", lineHeight: 1.3, marginBottom: 6 }}>{cat}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: CATEGORY_COLORS[cat] }}>{fmt(count)}</div>
                  <div style={{ fontSize: 10, color: "var(--muted)" }}>{pct}% of total</div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

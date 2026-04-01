"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Link from "next/link"
import {
  getCities,
  getCitiesGeoJSON,
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
  LineChart, Line, CartesianGrid, Legend,
} from "recharts"

// ── helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : String(n)

const salaryFmt = (n: number) =>
  `$${(n / 1000).toFixed(0)}K`

// ── Map tile style (CARTO dark matter — free, no API key) ─────────────────────
const MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"

// ── Main page ─────────────────────────────────────────────────────────────────
export default function UC14Page() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const popupRef = useRef<any>(null)

  const [selectedCategory, setSelectedCategory] = useState<JobCategory | null>(null)
  const [selectedCity, setSelectedCity] = useState<CityJobData | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [activeTab, setActiveTab] = useState<"trend" | "breakdown">("breakdown")

  const stats = getGlobalStats()

  // ── Init MapLibre GL ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    let map: any
    import("maplibre-gl").then(({ Map, NavigationControl, Popup }) => {
      map = new Map({
        container: mapContainerRef.current!,
        style: MAP_STYLE,
        center: [15, 25],
        zoom: 2,
        minZoom: 1.5,
        maxZoom: 10,
        attributionControl: false,
      })
      mapRef.current = map

      map.addControl(new NavigationControl({ showCompass: false }), "bottom-right")

      map.on("load", () => {
        // ── GeoJSON source ──
        map.addSource("cities", {
          type: "geojson",
          data: getCitiesGeoJSON(),
        })

        // ── Glow halo ──
        map.addLayer({
          id: "city-glow",
          type: "circle",
          source: "cities",
          paint: {
            "circle-radius": [
              "interpolate", ["linear"], ["get", "displayJobs"],
              0, 12, 20000, 28, 50000, 48,
            ],
            "circle-color": ["get", "color"],
            "circle-opacity": 0.15,
            "circle-blur": 1,
          },
        })

        // ── Main circles ──
        map.addLayer({
          id: "city-circles",
          type: "circle",
          source: "cities",
          paint: {
            "circle-radius": [
              "interpolate", ["linear"], ["get", "displayJobs"],
              0, 5, 20000, 14, 50000, 24,
            ],
            "circle-color": ["get", "color"],
            "circle-opacity": 0.85,
            "circle-stroke-width": 1.5,
            "circle-stroke-color": "#fff",
            "circle-stroke-opacity": 0.25,
          },
        })

        // ── City labels ──
        map.addLayer({
          id: "city-labels",
          type: "symbol",
          source: "cities",
          minzoom: 3,
          layout: {
            "text-field": ["get", "city"],
            "text-font": ["Noto Sans Regular"],
            "text-size": 11,
            "text-offset": [0, 1.6],
            "text-anchor": "top",
          },
          paint: {
            "text-color": "#e2e8f0",
            "text-halo-color": "#000",
            "text-halo-width": 1,
          },
        })

        setMapReady(true)
      })

      // ── Hover cursor ──
      map.on("mouseenter", "city-circles", () => { map.getCanvas().style.cursor = "pointer" })
      map.on("mouseleave", "city-circles", () => { map.getCanvas().style.cursor = "" })

      // ── Click → select city ──
      map.on("click", "city-circles", (e: any) => {
        const props = e.features?.[0]?.properties
        if (!props) return
        const city = getCities().find(c => c.id === props.id)
        if (city) setSelectedCity(city)
      })

      // ── Click empty → deselect ──
      map.on("click", (e: any) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ["city-circles"] })
        if (!features.length) setSelectedCity(null)
      })
    })

    return () => {
      map?.remove()
      mapRef.current = null
    }
  }, [])

  // ── Update map data when category filter changes ──────────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current) return
    const map = mapRef.current
    const src = map.getSource("cities") as any
    if (src) src.setData(getCitiesGeoJSON(selectedCategory ?? undefined))
  }, [selectedCategory, mapReady])

  // ── Fly to selected city ─────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedCity || !mapRef.current) return
    mapRef.current.flyTo({
      center: [selectedCity.lng, selectedCity.lat],
      zoom: Math.max(mapRef.current.getZoom(), 4),
      duration: 800,
    })
  }, [selectedCity])

  const catBreakdown = selectedCity
    ? JOB_CATEGORIES.map(cat => ({
        name: cat.split(" ")[0],
        jobs: selectedCity.jobsByCategory[cat],
        color: CATEGORY_COLORS[cat],
      })).sort((a, b) => b.jobs - a.jobs)
    : []

  const trend = selectedCity ? getMonthlyTrend(selectedCity.id) : []

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
      {/* ── Header ── */}
      <div style={{
        padding: "clamp(16px,3vw,24px) clamp(16px,4vw,48px) 0",
        display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
      }}>
        <div>
          <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:6 }}>
            <Link href="/use-cases" style={{ fontSize:12, color:"var(--muted)", textDecoration:"none" }}>← Use Cases</Link>
            <span style={{ color:"var(--border)" }}>·</span>
            <span style={{ fontSize:12, color:"var(--muted)" }}>UC14</span>
          </div>
          <h1 style={{ fontSize:"clamp(20px,3vw,28px)", fontWeight:800, margin:0, letterSpacing:"-0.02em" }}>
            🌍 World Job Market
          </h1>
          <p style={{ fontSize:13, color:"var(--muted)", margin:"4px 0 0" }}>
            {fmt(stats.totalJobs)}+ active listings · {stats.totalCities} cities · {stats.remoteAvg}% remote avg
          </p>
        </div>
        <Link href="/uc14/details" style={{
          fontSize:13, fontWeight:600, color:"var(--accent)",
          border:"1px solid var(--accent)", borderRadius:10,
          padding:"8px 16px", textDecoration:"none",
        }}>View Details →</Link>
      </div>

      {/* ── Category filter chips ── */}
      <div style={{
        padding: "14px clamp(16px,4vw,48px)",
        display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center",
      }}>
        <button
          onClick={() => setSelectedCategory(null)}
          style={{
            padding: "6px 14px", borderRadius: 100, fontSize: 12, fontWeight: 600,
            background: !selectedCategory ? "var(--accent)" : "var(--surface)",
            color: !selectedCategory ? "#000" : "var(--muted)",
            border: `1px solid ${!selectedCategory ? "var(--accent)" : "var(--border)"}`,
            cursor: "pointer",
          }}
        >All Jobs</button>
        {JOB_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
            style={{
              padding: "6px 12px", borderRadius: 100, fontSize: 12, fontWeight: 600,
              background: selectedCategory === cat ? CATEGORY_COLORS[cat] + "22" : "var(--surface)",
              color: selectedCategory === cat ? CATEGORY_COLORS[cat] : "var(--muted)",
              border: `1px solid ${selectedCategory === cat ? CATEGORY_COLORS[cat] : "var(--border)"}`,
              cursor: "pointer",
            }}
          >
            {CATEGORY_ICONS[cat]} {cat}
          </button>
        ))}
      </div>

      {/* ── Map + Panel ── */}
      <div style={{ display: "flex", gap: 0, height: "clamp(420px,58vh,680px)", position: "relative" }}>
        {/* Map */}
        <div ref={mapContainerRef} style={{ flex: 1, minWidth: 0 }} />

        {/* City detail panel */}
        {selectedCity && (
          <div style={{
            width: "clamp(280px,30vw,360px)",
            background: "rgba(10,10,10,0.97)",
            borderLeft: "1px solid var(--border)",
            display: "flex", flexDirection: "column",
            overflowY: "auto",
          }}>
            {/* City header */}
            <div style={{ padding: "20px 20px 12px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div style={{ fontSize:18, fontWeight:800 }}>{selectedCity.city}</div>
                  <div style={{ fontSize:12, color:"var(--muted)" }}>{selectedCity.country} · {selectedCity.region}</div>
                </div>
                <button onClick={() => setSelectedCity(null)} style={{
                  background:"none", border:"none", color:"var(--muted)",
                  fontSize:18, cursor:"pointer", padding:4,
                }}>✕</button>
              </div>
              {/* KPI row */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:14 }}>
                {[
                  { label:"Total Jobs",    value: fmt(selectedCity.totalJobs) },
                  { label:"Avg Salary",    value: salaryFmt(selectedCity.avgSalaryUSD) },
                  { label:"Remote",        value: `${selectedCity.remotePercent}%` },
                  { label:"YoY Growth",    value: `${selectedCity.growthRate > 0 ? "+" : ""}${selectedCity.growthRate}%`,
                    accent: selectedCity.growthRate >= 0 ? "#22c55e" : "#ef4444" },
                ].map(kpi => (
                  <div key={kpi.label} style={{
                    padding:"10px 12px", borderRadius:10,
                    background:"var(--surface)", border:"1px solid var(--border)",
                  }}>
                    <div style={{ fontSize:10, color:"var(--muted)", marginBottom:2 }}>{kpi.label}</div>
                    <div style={{ fontSize:16, fontWeight:800, color: kpi.accent ?? "var(--accent)" }}>{kpi.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display:"flex", borderBottom:"1px solid var(--border)" }}>
              {(["breakdown","trend"] as const).map(t => (
                <button key={t} onClick={() => setActiveTab(t)} style={{
                  flex:1, padding:"10px 8px", fontSize:12, fontWeight:600,
                  background:"none", border:"none", cursor:"pointer",
                  borderBottom: activeTab===t ? `2px solid var(--accent)` : "2px solid transparent",
                  color: activeTab===t ? "var(--accent)" : "var(--muted)",
                  textTransform:"capitalize",
                }}>{t === "breakdown" ? "By Category" : "Monthly Trend"}</button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ padding:"16px 12px", flex:1 }}>
              {activeTab === "breakdown" ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={catBreakdown} layout="vertical" margin={{ left:8, right:8 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" tick={{ fill:"var(--muted)", fontSize:11 }} width={70} />
                    <Tooltip
                      formatter={(v) => [fmt(Number(v)), "Jobs"]}
                      contentStyle={{ background:"#111", border:"1px solid var(--border)", fontSize:12 }}
                    />
                    <Bar dataKey="jobs" radius={[0,4,4,0]}>
                      {catBreakdown.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={trend} margin={{ left:0, right:8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" tick={{ fill:"var(--muted)", fontSize:10 }} />
                    <YAxis tickFormatter={fmt} tick={{ fill:"var(--muted)", fontSize:10 }} />
                    <Tooltip
                      formatter={(v) => [fmt(Number(v)), "Listings"]}
                      contentStyle={{ background:"#111", border:"1px solid var(--border)", fontSize:12 }}
                    />
                    <Line type="monotone" dataKey="jobs" stroke="var(--accent)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Top category badge */}
            <div style={{ padding:"0 16px 16px" }}>
              <div style={{
                padding:"10px 14px", borderRadius:10,
                background: CATEGORY_COLORS[selectedCity.topCategory] + "18",
                border: `1px solid ${CATEGORY_COLORS[selectedCity.topCategory]}44`,
                fontSize:12,
              }}>
                <span style={{ color:"var(--muted)" }}>Top category: </span>
                <span style={{ fontWeight:700, color: CATEGORY_COLORS[selectedCity.topCategory] }}>
                  {CATEGORY_ICONS[selectedCity.topCategory]} {selectedCity.topCategory}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Global stats strip ── */}
      <div style={{
        borderTop:"1px solid var(--border)", borderBottom:"1px solid var(--border)",
        background:"var(--surface)",
      }}>
        <div style={{
          maxWidth:1280, margin:"0 auto",
          padding:"clamp(20px,3vw,32px) clamp(16px,4vw,48px)",
          display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:24,
        }}>
          {[
            { label:"Total Listings",     value: fmt(stats.totalJobs),       sub:"across all cities" },
            { label:"Cities Tracked",     value: String(stats.totalCities),   sub:"on the live map" },
            { label:"Fastest Growing",    value: stats.fastestGrowing,        sub:"city by YoY %" },
            { label:"Most Listings",      value: stats.topCity,               sub:"by total volume" },
            { label:"Remote Average",     value: `${stats.remoteAvg}%`,       sub:"of listed roles" },
            { label:"Highest Remote",     value: stats.highestRemote,         sub:"city for remote" },
          ].map(({ label, value, sub }) => (
            <div key={label}>
              <div style={{ fontSize:"clamp(18px,2vw,26px)", fontWeight:900, color:"var(--accent)", lineHeight:1 }}>{value}</div>
              <div style={{ fontSize:13, fontWeight:600, color:"var(--text)", marginTop:3 }}>{label}</div>
              <div style={{ fontSize:11, color:"var(--muted)" }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Top cities by selected category ── */}
      <div style={{ maxWidth:1280, margin:"0 auto", padding:"clamp(32px,4vw,56px) clamp(16px,4vw,48px)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:8 }}>
          <h2 style={{ fontSize:"clamp(18px,2.5vw,26px)", fontWeight:800, margin:0, letterSpacing:"-0.02em" }}>
            {selectedCategory ? `Top Cities — ${selectedCategory}` : "Top Cities by Total Jobs"}
          </h2>
          {selectedCategory && (
            <div style={{
              padding:"4px 12px", borderRadius:100, fontSize:12, fontWeight:600,
              background: CATEGORY_COLORS[selectedCategory] + "22",
              color: CATEGORY_COLORS[selectedCategory],
              border: `1px solid ${CATEGORY_COLORS[selectedCategory]}44`,
            }}>
              {CATEGORY_ICONS[selectedCategory]} {selectedCategory}
            </div>
          )}
        </div>

        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth:600 }}>
            <thead>
              <tr style={{ borderBottom:"1px solid var(--border)" }}>
                {["#","City","Country","Jobs","Avg Salary","Remote %","YoY Growth","Top Category"].map(h => (
                  <th key={h} style={{
                    textAlign:"left", padding:"8px 12px", fontSize:11, fontWeight:700,
                    color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.05em",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(selectedCategory
                ? getTopCitiesByCategory(selectedCategory)
                : [...getCities()].sort((a, b) => b.totalJobs - a.totalJobs).slice(0, 8)
              ).map((city, i) => (
                <tr
                  key={city.id}
                  onClick={() => setSelectedCity(city)}
                  style={{
                    borderBottom:"1px solid var(--border)",
                    cursor:"pointer",
                    background: selectedCity?.id === city.id ? "var(--surface)" : "transparent",
                    transition:"background 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--surface)")}
                  onMouseLeave={e => (e.currentTarget.style.background = selectedCity?.id === city.id ? "var(--surface)" : "transparent")}
                >
                  <td style={{ padding:"12px 12px", fontSize:12, color:"var(--muted)", fontWeight:700 }}>{i+1}</td>
                  <td style={{ padding:"12px 12px", fontWeight:700 }}>{city.city}</td>
                  <td style={{ padding:"12px 12px", fontSize:13, color:"var(--muted)" }}>{city.country}</td>
                  <td style={{ padding:"12px 12px", fontWeight:700, color:"var(--accent)" }}>
                    {fmt(selectedCategory ? city.jobsByCategory[selectedCategory] : city.totalJobs)}
                  </td>
                  <td style={{ padding:"12px 12px", fontSize:13 }}>{salaryFmt(city.avgSalaryUSD)}</td>
                  <td style={{ padding:"12px 12px", fontSize:13 }}>{city.remotePercent}%</td>
                  <td style={{ padding:"12px 12px", fontSize:13, fontWeight:700,
                    color: city.growthRate >= 0 ? "#22c55e" : "#ef4444" }}>
                    {city.growthRate > 0 ? "+" : ""}{city.growthRate}%
                  </td>
                  <td style={{ padding:"12px 12px" }}>
                    <span style={{
                      padding:"3px 8px", borderRadius:6, fontSize:11, fontWeight:600,
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

      {/* ── Global category breakdown ── */}
      <div style={{ background:"var(--surface)", borderTop:"1px solid var(--border)", padding:"clamp(32px,4vw,56px) 0" }}>
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"0 clamp(16px,4vw,48px)" }}>
          <h2 style={{ fontSize:"clamp(18px,2.5vw,26px)", fontWeight:800, margin:"0 0 24px", letterSpacing:"-0.02em" }}>
            Global Job Distribution by Sector
          </h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:24 }}>
            {/* Bar chart */}
            <div style={{ background:"var(--bg)", borderRadius:16, border:"1px solid var(--border)", padding:20 }}>
              <div style={{ fontSize:13, fontWeight:700, marginBottom:16, color:"var(--muted)" }}>Jobs by Sector (all cities)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={JOB_CATEGORIES.map(cat => ({
                    name: cat.replace(" & "," &\n"),
                    jobs: stats.categoryBreakdown[cat],
                    color: CATEGORY_COLORS[cat],
                  })).sort((a,b) => b.jobs - a.jobs)}
                  layout="vertical"
                  margin={{ left:12, right:16 }}
                >
                  <XAxis type="number" tickFormatter={fmt} tick={{ fill:"var(--muted)", fontSize:10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill:"var(--muted)", fontSize:10 }} width={100} />
                  <Tooltip
                    formatter={(v) => [fmt(Number(v)), "Jobs"]}
                    contentStyle={{ background:"#111", border:"1px solid var(--border)", fontSize:12 }}
                  />
                  <Bar dataKey="jobs" radius={[0,4,4,0]}>
                    {JOB_CATEGORIES.map((cat, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[cat]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Category cards */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, alignContent:"start" }}>
              {JOB_CATEGORIES.map(cat => {
                const count = stats.categoryBreakdown[cat]
                const pct = ((count / stats.totalJobs) * 100).toFixed(1)
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                    style={{
                      padding:"12px 14px", borderRadius:12,
                      background: selectedCategory === cat ? CATEGORY_COLORS[cat] + "22" : "var(--bg)",
                      border:`1px solid ${selectedCategory === cat ? CATEGORY_COLORS[cat] : "var(--border)"}`,
                      textAlign:"left", cursor:"pointer",
                    }}
                  >
                    <div style={{ fontSize:18, marginBottom:4 }}>{CATEGORY_ICONS[cat]}</div>
                    <div style={{ fontSize:11, fontWeight:700, color:"var(--text)", lineHeight:1.3 }}>{cat}</div>
                    <div style={{ fontSize:12, fontWeight:800, color:CATEGORY_COLORS[cat], marginTop:4 }}>{fmt(count)}</div>
                    <div style={{ fontSize:10, color:"var(--muted)" }}>{pct}% of total</div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* maplibre-gl CSS */}
      <style>{`
        .maplibregl-canvas { display: block; }
        .maplibregl-ctrl-bottom-right { bottom: 12px; right: 12px; }
        .maplibregl-ctrl-group { background: rgba(20,20,20,0.9) !important; border: 1px solid var(--border) !important; }
        .maplibregl-ctrl-group button { background: transparent !important; color: var(--muted) !important; }
        .maplibregl-ctrl-group button:hover { background: var(--surface) !important; }
      `}</style>
    </div>
  )
}

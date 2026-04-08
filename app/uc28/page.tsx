"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import Link from "next/link"
import { disposeGlobe } from "@/lib/globe-cleanup"

// ── Types ─────────────────────────────────────────────────────────────────────

interface LaunchEvent {
  id: string
  name: string
  status: string
  net: string
  rocket: string
  agency: string
  agencyCountry: string
  mission: string
  missionType: string
  orbit: string
  padName: string
  padLat: number
  padLng: number
  padCountry: string
  imageUrl: string
  wikiUrl: string
}

interface CountryFeature {
  type: "Feature"
  id: string
  properties: { name: string }
  geometry: any
}

// ── Constants ─────────────────────────────────────────────────────────────────

const AGENCY_COLORS: Record<string, string> = {
  "SpaceX": "#3b82f6",
  "China Aerospace Science and Technology Corporation": "#ef4444",
  "Indian Space Research Organization": "#f59e0b",
  "Russian Federal Space Agency (ROSCOSMOS)": "#22c55e",
  "Arianespace": "#a78bfa",
  "Rocket Lab": "#06b6d4",
  "United Launch Alliance": "#64748b",
  "Japan Aerospace Exploration Agency": "#f472b6",
  "National Aeronautics and Space Administration": "#60a5fa",
  "Korea Aerospace Research Institute": "#fbbf24",
  "Israel Aerospace Industries": "#a3e635",
  "Mitsubishi Heavy Industries": "#fb923c",
  "Northrop Grumman Innovation Systems": "#94a3b8",
  "Blue Origin": "#2563eb",
  "Relativity Space": "#e879f9",
}

const AGENCY_SHORT: Record<string, string> = {
  "SpaceX": "SpaceX",
  "China Aerospace Science and Technology Corporation": "CASC",
  "Indian Space Research Organization": "ISRO",
  "Russian Federal Space Agency (ROSCOSMOS)": "Roscosmos",
  "Arianespace": "Arianespace",
  "Rocket Lab": "Rocket Lab",
  "United Launch Alliance": "ULA",
  "Japan Aerospace Exploration Agency": "JAXA",
  "National Aeronautics and Space Administration": "NASA",
  "Korea Aerospace Research Institute": "KARI",
  "Israel Aerospace Industries": "IAI",
  "Mitsubishi Heavy Industries": "MHI",
  "Northrop Grumman Innovation Systems": "NGIS",
  "Blue Origin": "Blue Origin",
  "Relativity Space": "Relativity",
}

const DEFAULT_AGENCY_COLOR = "#94a3b8"

function agencyColor(agency: string): string {
  return AGENCY_COLORS[agency] ?? DEFAULT_AGENCY_COLOR
}

function agencyShort(agency: string): string {
  return AGENCY_SHORT[agency] ?? agency.split(" ").slice(0, 2).join(" ")
}

const STATUS_COLORS: Record<string, string> = {
  "Go": "#22c55e",
  "TBD": "#f59e0b",
  "TBC": "#f59e0b",
  "Success": "#22c55e",
  "Failure": "#ef4444",
}

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

// ── Main component ────────────────────────────────────────────────────────────

type StatusT = "loading" | "ready" | "error"

export default function UC28Page() {
  const globeRef  = useRef<HTMLDivElement>(null)
  const globeInst = useRef<any>(null)

  const [status,          setStatus]          = useState<StatusT>("loading")
  const [errorMsg,        setErrorMsg]        = useState("")
  const [launches,        setLaunches]        = useState<LaunchEvent[]>([])
  const [selectedLaunch,  setSelectedLaunch]  = useState<LaunchEvent | null>(null)
  const [isSpinning,      setIsSpinning]      = useState(true)
  const [agencyFilter,    setAgencyFilter]    = useState<string>("all")
  const [countdown,       setCountdown]       = useState("")
  const [lastUpdated,     setLastUpdated]     = useState<Date | null>(null)
  const [globeReady,      setGlobeReady]      = useState(false)

  const [countries,       setCountries]       = useState<CountryFeature[]>([])
  const [hoveredCountry,  setHoveredCountry]  = useState<CountryFeature | null>(null)

  // ── Filtering ───────────────────────────────────────────────────────────────

  const agencies = useMemo(() => {
    const map = new Map<string, number>()
    for (const l of launches) map.set(l.agency, (map.get(l.agency) ?? 0) + 1)
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [launches])

  const filteredLaunches = useMemo(() => {
    if (agencyFilter === "all") return launches
    return launches.filter(l => l.agency === agencyFilter)
  }, [launches, agencyFilter])

  // ── Stats ──────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const pads = new Set(launches.map(l => l.padName))
    const agencySet = new Set(launches.map(l => l.agency))
    const countrySet = new Set(launches.map(l => l.padCountry))
    return {
      launches: launches.length,
      agencies: agencySet.size,
      pads: pads.size,
      countries: countrySet.size,
    }
  }, [launches])

  // ── Countdown timer ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!launches.length) return
    const nextLaunch = launches.find(l => new Date(l.net) > new Date())
    if (!nextLaunch) { setCountdown("No upcoming"); return }
    const id = setInterval(() => {
      const diff = new Date(nextLaunch.net).getTime() - Date.now()
      if (diff <= 0) { setCountdown("LAUNCHED!"); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setCountdown(`${d}d ${h}h ${m}m ${s}s`)
    }, 1000)
    return () => clearInterval(id)
  }, [launches])

  // ── Country polygons ──────────────────────────────────────────────────────

  function applyCountries(
    globe: any,
    features: CountryFeature[],
    hovered: CountryFeature | null,
  ) {
    if (!features.length) return
    globe
      .polygonsData(features)
      .polygonCapColor((d: any) => {
        if (hovered?.properties.name === d.properties.name) return "rgba(255,255,255,0.04)"
        return "rgba(0,0,0,0)"
      })
      .polygonSideColor(() => "rgba(0,0,0,0)")
      .polygonStrokeColor((d: any) => {
        if (hovered?.properties.name === d.properties.name) return "rgba(255,255,255,0.55)"
        return "rgba(255,255,255,0.12)"
      })
      .polygonAltitude(0.004)
      .onPolygonHover((d: any) => setHoveredCountry(d as CountryFeature | null))
      .onPolygonClick((d: any) => {
        const f = d as CountryFeature
        const { lat, lng } = featureCentroid(f.geometry)
        if (globeInst.current) globeInst.current.pointOfView({ lat, lng, altitude: 1.8 }, 800)
        setIsSpinning(false)
      })
  }

  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchLaunches = useCallback(async () => {
    try {
      const res = await fetch("/api/space-launches", { cache: "no-store" })
      if (!res.ok) throw new Error(`API ${res.status}`)
      const data: LaunchEvent[] = await res.json()
      setLaunches(data)
      setLastUpdated(new Date())
      setStatus("ready")
    } catch (err: any) {
      if (launches.length === 0) {
        setErrorMsg(err?.message ?? "Unknown error")
        setStatus("error")
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    fetchLaunches()
    fetchCountries()
  }, [fetchLaunches, fetchCountries])

  // 15-min polling
  useEffect(() => {
    if (status !== "ready") return
    const id = setInterval(fetchLaunches, 900_000)
    return () => clearInterval(id)
  }, [status, fetchLaunches])

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
        .atmosphereColor("#6366f1")
        .atmosphereAltitude(0.14)
        .pointOfView({ lat: 28.5, lng: -80.6, altitude: 2.2 })

      globe.controls().autoRotate = true
      globe.controls().autoRotateSpeed = 0.12
      globe.controls().enableDamping = true
      globe.controls().dampingFactor = 0.1

      globeInst.current = globe
      setGlobeReady(true)
    })

    return () => {
      disposeGlobe(globeInst, globeRef)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  // ── Apply points (launch pads) ────────────────────────────────────────────

  useEffect(() => {
    if (!globeInst.current || !globeReady) return
    const globe = globeInst.current

    // Deduplicate pads and count launches per pad
    const padMap = new Map<string, { lat: number; lng: number; agency: string; count: number; launches: string[] }>()
    for (const l of filteredLaunches) {
      const key = `${l.padLat.toFixed(3)},${l.padLng.toFixed(3)}`
      const existing = padMap.get(key)
      if (existing) {
        existing.count++
        existing.launches.push(l.name)
      } else {
        padMap.set(key, { lat: l.padLat, lng: l.padLng, agency: l.agency, count: 1, launches: [l.name] })
      }
    }
    const pads = [...padMap.values()]

    globe
      .pointsData(pads)
      .pointLat((d: any) => d.lat)
      .pointLng((d: any) => d.lng)
      .pointAltitude(0.008)
      .pointRadius((d: any) => 0.25 + Math.min(d.count * 0.12, 0.6))
      .pointColor((d: any) => agencyColor(d.agency))
      .pointResolution(24)
      .pointsMerge(false)
      .pointLabel((d: any) => `
        <div style="font-family:sans-serif;padding:8px 12px;background:rgba(0,0,0,0.92);border-radius:8px;border:1px solid ${agencyColor(d.agency)}50;color:#fff;font-size:12px;max-width:280px;">
          <b style="color:${agencyColor(d.agency)}">${d.launches.length} upcoming launch${d.launches.length > 1 ? "es" : ""}</b><br/>
          <span style="color:#aaa">${d.launches.slice(0, 3).join("<br/>")}</span>
          ${d.launches.length > 3 ? `<br/><span style="color:#666">+${d.launches.length - 3} more</span>` : ""}
        </div>
      `)
      .onPointClick((d: any) => {
        const launch = filteredLaunches.find(l => l.padLat === d.lat && l.padLng === d.lng)
        if (launch) {
          setSelectedLaunch(launch)
          globeInst.current?.pointOfView({ lat: d.lat, lng: d.lng, altitude: 1.4 }, 700)
          setIsSpinning(false)
        }
      })
      .onPointHover((d: any) => {
        if (globeRef.current) globeRef.current.style.cursor = d ? "pointer" : "default"
      })
  }, [filteredLaunches, globeReady])

  // ── Apply arcs (launch trajectories) ──────────────────────────────────────

  useEffect(() => {
    if (!globeInst.current || !globeReady) return
    const globe = globeInst.current

    // Create arcs from pad to approximate orbit destination
    const arcs = filteredLaunches.map(l => {
      const orbitAlt = l.orbit === "GEO" || l.orbit === "GTO" ? 0.6
        : l.orbit === "SSO" ? 0.25
        : l.orbit === "ISS" ? 0.15
        : 0.18 // LEO default
      // Arc goes roughly east or to inclination
      const destLat = l.orbit === "SSO" ? l.padLat + 25 : l.padLat + (Math.random() - 0.5) * 10
      const destLng = l.padLng + 40 + Math.random() * 20
      return {
        startLat: l.padLat,
        startLng: l.padLng,
        endLat: destLat,
        endLng: destLng,
        color: agencyColor(l.agency),
        altitude: orbitAlt,
        name: l.name,
      }
    })

    globe
      .arcsData(arcs)
      .arcStartLat((d: any) => d.startLat)
      .arcStartLng((d: any) => d.startLng)
      .arcEndLat((d: any) => d.endLat)
      .arcEndLng((d: any) => d.endLng)
      .arcColor((d: any) => [d.color + "cc", d.color + "44"])
      .arcAltitude((d: any) => d.altitude)
      .arcStroke(0.4)
      .arcDashLength(0.4)
      .arcDashGap(0.2)
      .arcDashAnimateTime(3000)
      .arcLabel((d: any) => `
        <div style="font-family:sans-serif;padding:6px 10px;background:rgba(0,0,0,0.88);border-radius:6px;color:#fff;font-size:11px;border:1px solid ${d.color}40;">
          ${d.name}
        </div>
      `)
  }, [filteredLaunches, globeReady])

  // ── Apply country borders ─────────────────────────────────────────────────

  useEffect(() => {
    if (!globeInst.current || !globeReady || !countries.length) return
    applyCountries(globeInst.current, countries, hoveredCountry)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoveredCountry, countries, globeReady])

  // ── Spin toggle ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!globeInst.current) return
    globeInst.current.controls().autoRotate = isSpinning
  }, [isSpinning])

  // ── Resize ────────────────────────────────────────────────────────────────

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

  // ── Pulse animation ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!globeInst.current || !globeReady) return
    let frame = 0
    const id = setInterval(() => {
      frame++
      const pulse = 1 + 0.12 * Math.sin(frame * 0.1)
      globeInst.current?.pointRadius((d: any) => {
        const base = 0.25 + Math.min((d.count ?? 1) * 0.12, 0.6)
        return base * pulse
      })
    }, 80)
    return () => clearInterval(id)
  }, [globeReady])

  // ── Helpers ───────────────────────────────────────────────────────────────

  const fmtDate = (iso: string) => {
    try {
      const d = new Date(iso)
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " UTC"
    } catch { return iso }
  }

  const fmtTime = (d: Date) => d.toUTCString().replace("GMT", "UTC").slice(5, 25)

  // ── Loading / Error ───────────────────────────────────────────────────────

  if (status === "loading") return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: "calc(100vh - 64px)", background: "var(--bg)" }}>
      <div className="text-center max-w-sm">
        <div className="mb-6 relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: "#6366f1", borderRightColor: "#3b82f6" }} />
          <div className="absolute inset-3 rounded-full flex items-center justify-center" style={{ background: "rgba(99,102,241,0.15)" }}>
            <span className="text-xl">{"\uD83D\uDE80"}</span>
          </div>
        </div>
        <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--text)" }}>Loading space launches...</h2>
        <p className="text-sm" style={{ color: "var(--muted)" }}>Fetching data from Launch Library 2 API</p>
      </div>
    </div>
  )

  if (status === "error") return (
    <div className="flex flex-col items-center justify-center gap-4" style={{ minHeight: "calc(100vh - 64px)", background: "var(--bg)" }}>
      <span className="text-4xl">{"\u26A0\uFE0F"}</span>
      <p className="text-lg font-semibold" style={{ color: "var(--text)" }}>Failed to load launch data</p>
      <p className="text-sm" style={{ color: "var(--muted)" }}>{errorMsg}</p>
      <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "#6366f1", color: "#fff" }}>Retry</button>
    </div>
  )

  return (
    <div className="relative" style={{ minHeight: "calc(100vh - 64px)", background: "#000" }}>
      <div ref={globeRef} className="absolute inset-0" />

      {/* ── Top-left: Title + countdown + stats ─────────────────────────────── */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-4 pointer-events-none">
        <div className="pointer-events-auto">
          <div className="mb-2 flex items-center gap-2 flex-wrap">
            <span className="text-lg font-bold" style={{ color: "var(--text)" }}>{"\uD83D\uDE80"} Live Space Launches</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold animate-pulse" style={{ background: "rgba(99,102,241,0.2)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.4)" }}>LIVE</span>
            {countdown && (
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold" style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.35)" }}>
                T- {countdown}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Launches", val: stats.launches.toString() },
              { label: "Agencies", val: stats.agencies.toString() },
              { label: "Pads", val: stats.pads.toString() },
              { label: "Countries", val: stats.countries.toString() },
              { label: "Updated", val: lastUpdated ? fmtTime(lastUpdated) : "\u2014" },
            ].map(s => (
              <div key={s.label} className="px-3 py-1.5 rounded-lg text-xs" style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", color: "var(--text)" }}>
                <span style={{ color: "var(--muted)" }}>{s.label} </span><span className="font-semibold">{s.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Top-right: Controls ──────────────────────────────────────────── */}
        <div className="flex items-center gap-2 pointer-events-auto flex-shrink-0">
          <button onClick={() => setIsSpinning(s => !s)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)", color: "var(--muted)", backdropFilter: "blur(8px)" }}>
            {isSpinning ? "\u23F8 Pause" : "\u25B6 Spin"}
          </button>
          <Link href="/uc28/details" className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)", color: "#818cf8", backdropFilter: "blur(8px)" }}>Architecture {"\u2192"}</Link>
        </div>
      </div>

      {/* ── Left sidebar: Agency filter ─────────────────────────────────────── */}
      <div className="absolute top-24 left-4 pointer-events-auto w-52 max-h-[calc(100vh-180px)] overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.15) transparent" }}>
        <div className="rounded-xl p-3" style={{ background: "rgba(0,0,0,0.78)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(14px)" }}>
          <p className="text-xs font-semibold tracking-wider mb-2" style={{ color: "var(--muted)" }}>AGENCY FILTER</p>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => { setAgencyFilter("all"); setSelectedLaunch(null) }}
              className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-left"
              style={{
                background: agencyFilter === "all" ? "rgba(99,102,241,0.15)" : "transparent",
                border: agencyFilter === "all" ? "1px solid rgba(99,102,241,0.4)" : "1px solid transparent",
                color: agencyFilter === "all" ? "#818cf8" : "var(--muted)",
              }}
            >
              <span>All Agencies</span>
              <span className="font-mono opacity-60">{launches.length}</span>
            </button>
            {agencies.map(([agency, count]) => {
              const active = agencyFilter === agency
              const color = agencyColor(agency)
              return (
                <button key={agency} onClick={() => { setAgencyFilter(agency); setSelectedLaunch(null) }}
                  className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-left"
                  style={{
                    background: active ? color + "22" : "transparent",
                    border: active ? `1px solid ${color}` : "1px solid transparent",
                    color: active ? color : "var(--muted)",
                  }}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                    <span className="truncate">{agencyShort(agency)}</span>
                  </span>
                  <span className="font-mono opacity-60 flex-shrink-0 ml-1">{count}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Right sidebar: Upcoming launches list ──────────────────────────── */}
      <div className="absolute top-24 right-4 pointer-events-auto w-64 max-h-[calc(100vh-180px)] overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.15) transparent" }}>
        <div className="rounded-xl p-3" style={{ background: "rgba(0,0,0,0.78)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(14px)" }}>
          <p className="text-xs font-semibold tracking-wider mb-2" style={{ color: "var(--muted)" }}>UPCOMING LAUNCHES</p>
          <div className="flex flex-col gap-1.5">
            {filteredLaunches.slice(0, 25).map(l => {
              const color = agencyColor(l.agency)
              const isSelected = selectedLaunch?.id === l.id
              return (
                <button
                  key={l.id}
                  onClick={() => {
                    setSelectedLaunch(l)
                    globeInst.current?.pointOfView({ lat: l.padLat, lng: l.padLng, altitude: 1.4 }, 700)
                    setIsSpinning(false)
                  }}
                  className="flex flex-col gap-0.5 px-3 py-2 rounded-lg text-left"
                  style={{
                    background: isSelected ? color + "18" : "rgba(255,255,255,0.02)",
                    border: isSelected ? `1px solid ${color}60` : "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <span className="text-xs font-medium truncate w-full" style={{ color: isSelected ? color : "var(--text)" }}>{l.name}</span>
                  <div className="flex items-center gap-2 w-full">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                    <span className="text-xs truncate" style={{ color: "var(--muted)" }}>{agencyShort(l.agency)}</span>
                    <span className="text-xs ml-auto flex-shrink-0 px-1.5 py-0 rounded" style={{ background: (STATUS_COLORS[l.status] ?? "#94a3b8") + "18", color: STATUS_COLORS[l.status] ?? "#94a3b8" }}>{l.status}</span>
                  </div>
                  <span className="text-xs" style={{ color: "var(--muted)", opacity: 0.6 }}>{fmtDate(l.net)}</span>
                </button>
              )
            })}
            {filteredLaunches.length === 0 && (
              <p className="text-xs py-4 text-center" style={{ color: "var(--muted)" }}>No launches match filter</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Country hover tooltip ────────────────────────────────────────────── */}
      {hoveredCountry && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none" style={{ zIndex: 10 }}>
          <div className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "rgba(0,0,0,0.75)", border: "1px solid rgba(255,255,255,0.15)", color: "var(--text)", backdropFilter: "blur(8px)" }}>
            {hoveredCountry.properties.name}
          </div>
        </div>
      )}

      {/* ── Bottom-right: Selected launch detail ─────────────────────────────── */}
      {selectedLaunch && (
        <div className="absolute bottom-4 right-4 pointer-events-auto w-80" style={{ zIndex: 10 }}>
          <div className="rounded-xl p-4" style={{
            background: "rgba(0,0,0,0.90)",
            border: `1px solid ${agencyColor(selectedLaunch.agency)}40`,
            backdropFilter: "blur(14px)",
          }}>
            <div className="flex items-start justify-between mb-3">
              <div className="min-w-0 pr-2">
                <p className="text-sm font-bold leading-tight" style={{ color: "var(--text)" }}>
                  {"\uD83D\uDE80"} {selectedLaunch.name}
                </p>
              </div>
              <button onClick={() => setSelectedLaunch(null)} className="opacity-40 hover:opacity-80 text-base flex-shrink-0" style={{ color: "var(--muted)" }}>{"\u2715"}</button>
            </div>

            {/* Status + orbit badges */}
            <div className="flex gap-2 mb-3 flex-wrap">
              <span className="text-xs px-2 py-0.5 rounded-full" style={{
                background: (STATUS_COLORS[selectedLaunch.status] ?? DEFAULT_AGENCY_COLOR) + "18",
                color: STATUS_COLORS[selectedLaunch.status] ?? DEFAULT_AGENCY_COLOR,
                border: `1px solid ${STATUS_COLORS[selectedLaunch.status] ?? DEFAULT_AGENCY_COLOR}40`,
              }}>{selectedLaunch.status}</span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{
                background: agencyColor(selectedLaunch.agency) + "18",
                color: agencyColor(selectedLaunch.agency),
                border: `1px solid ${agencyColor(selectedLaunch.agency)}40`,
              }}>{agencyShort(selectedLaunch.agency)}</span>
              {selectedLaunch.orbit !== "Unknown" && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{
                  background: "rgba(99,102,241,0.12)",
                  color: "#818cf8",
                  border: "1px solid rgba(99,102,241,0.3)",
                }}>{selectedLaunch.orbit}</span>
              )}
            </div>

            {/* Image thumbnail */}
            {selectedLaunch.imageUrl && (
              <div className="mb-3 rounded-lg overflow-hidden" style={{ maxHeight: 120 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedLaunch.imageUrl} alt={selectedLaunch.name} className="w-full object-cover" style={{ maxHeight: 120 }} />
              </div>
            )}

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {[
                { label: "Rocket", val: selectedLaunch.rocket },
                { label: "Mission", val: selectedLaunch.mission },
                { label: "Type", val: selectedLaunch.missionType },
                { label: "NET", val: fmtDate(selectedLaunch.net) },
                { label: "Pad", val: selectedLaunch.padName },
                { label: "Country", val: selectedLaunch.padCountry || "\u2014" },
              ].map(m => (
                <div key={m.label} className="rounded-lg px-2 py-1.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{m.label}</p>
                  <p className="text-xs font-semibold truncate" style={{ color: "var(--text)" }}>{m.val}</p>
                </div>
              ))}
            </div>

            {selectedLaunch.wikiUrl && (
              <a href={selectedLaunch.wikiUrl} target="_blank" rel="noopener noreferrer"
                className="block text-xs text-center py-1.5 rounded-lg"
                style={{
                  background: agencyColor(selectedLaunch.agency) + "20",
                  color: agencyColor(selectedLaunch.agency),
                  border: `1px solid ${agencyColor(selectedLaunch.agency)}40`,
                }}>
                View wiki {"\u2192"}
              </a>
            )}
          </div>
        </div>
      )}

      {/* ── Bottom: Agency legend ────────────────────────────────────────────── */}
      <div className="absolute bottom-4 left-4 pointer-events-none" style={{ zIndex: 5 }}>
        <div className="rounded-xl px-3 py-2 pointer-events-auto" style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(10px)" }}>
          <p className="text-xs font-semibold tracking-wider mb-1.5" style={{ color: "var(--muted)" }}>AGENCIES</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {agencies.slice(0, 8).map(([agency]) => (
              <span key={agency} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: agencyColor(agency) }} />
                {agencyShort(agency)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import Link from "next/link"

// ── Types ─────────────────────────────────────────────────────────────────────

interface CableSegment {
  name: string
  color: string
  owners: string
  length: string
  rfs: string
  coords: number[][]  // [[lng, lat], ...]
}

interface LandingStation {
  name: string
  country: string
  lat: number
  lng: number
}

interface ApiData {
  segments: CableSegment[]
  stations: LandingStation[]
}

type OceanKey = "pacific" | "atlantic" | "indian" | "arctic" | "other"

const OCEANS: Record<OceanKey, { label: string; color: string }> = {
  pacific:  { label: "Pacific",          color: "#33ccdd" },
  atlantic: { label: "Atlantic",         color: "#5588ff" },
  indian:   { label: "Indian Ocean",     color: "#44ff88" },
  arctic:   { label: "Arctic",           color: "#aaddff" },
  other:    { label: "Other / Regional", color: "#aaaaaa" },
}

function getOcean(coords: number[][]): OceanKey {
  if (!coords || coords.length === 0) return "other"
  const avgLat = coords.reduce((s, c) => s + c[1], 0) / coords.length
  const avgLng = coords.reduce((s, c) => s + c[0], 0) / coords.length
  if (avgLat > 60) return "arctic"
  // Pacific cables cross antimeridian — average lng near ±180 or far from 0
  const spread = Math.max(...coords.map(c => c[0])) - Math.min(...coords.map(c => c[0]))
  if (spread > 90 || Math.abs(avgLng) > 130) return "pacific"
  if (avgLng > 40 && avgLng < 120) return "indian"
  if (avgLng > -80 && avgLng < 40) return "atlantic"
  return "other"
}

// ── Main component ────────────────────────────────────────────────────────────

type StatusT = "loading" | "ready" | "error"

export default function UC19Page() {
  const globeRef  = useRef<HTMLDivElement>(null)
  const globeInst = useRef<any>(null)

  const [status,       setStatus]       = useState<StatusT>("loading")
  const [errorMsg,     setErrorMsg]     = useState("")
  const [data,         setData]         = useState<ApiData | null>(null)
  const [selected,     setSelected]     = useState<CableSegment | null>(null)
  const [selStation,   setSelStation]   = useState<LandingStation | null>(null)
  const [isSpinning,   setIsSpinning]   = useState(true)
  const [oceanFilter,  setOceanFilter]  = useState<OceanKey | "all">("all")
  const [showStations, setShowStations] = useState(true)
  const [liveTime,     setLiveTime]     = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setLiveTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Fetch cable data
  useEffect(() => {
    fetch("/api/submarine-cables")
      .then(r => { if (!r.ok) throw new Error(`API ${r.status}`); return r.json() })
      .then((d: ApiData) => { setData(d); setStatus("ready") })
      .catch(err => { setErrorMsg(err.message); setStatus("error") })
  }, [])

  // Segments with ocean tag
  const taggedSegments = useMemo(() => {
    if (!data) return []
    return data.segments.map(s => ({ ...s, ocean: getOcean(s.coords) }))
  }, [data])

  const filteredSegments = useMemo(() => {
    return oceanFilter === "all" ? taggedSegments : taggedSegments.filter(s => s.ocean === oceanFilter)
  }, [taggedSegments, oceanFilter])

  const oceanCounts = useMemo(() => {
    const c: Partial<Record<OceanKey | "all", number>> = { all: taggedSegments.length }
    for (const s of taggedSegments) c[s.ocean as OceanKey] = (c[s.ocean as OceanKey] ?? 0) + 1
    return c
  }, [taggedSegments])

  // Init globe — runs when data arrives
  useEffect(() => {
    if (status !== "ready" || !data || !globeRef.current || globeInst.current) return
    let globe: any

    import("globe.gl").then(globeMod => {
      if (!globeRef.current) return
      const GlobeGL = (globeMod.default ?? globeMod) as any
      globe = new GlobeGL()

      globe(globeRef.current)
        .width(globeRef.current.clientWidth)
        .height(globeRef.current.clientHeight)
        .globeImageUrl("//unpkg.com/three-globe/example/img/earth-night.jpg")
        .bumpImageUrl("//unpkg.com/three-globe/example/img/earth-topology.png")
        .backgroundImageUrl("//unpkg.com/three-globe/example/img/night-sky.png")
        .atmosphereColor("#33ccdd")
        .atmosphereAltitude(0.12)
        .pointOfView({ lat: 20, lng: 10, altitude: 2.0 })
        // Cable paths
        .pathsData(filteredSegments)
        .pathPoints((d: any) => d.coords)
        .pathPointLat((pt: any) => pt[1])
        .pathPointLng((pt: any) => pt[0])
        .pathColor((d: any) => [d.color + "cc", d.color + "88"])
        .pathStroke(1.2)
        .pathLabel((d: any) => d.name)
        .onPathClick((d: any) => { setSelected(d); setSelStation(null); setIsSpinning(false) })
        // Landing stations
        .pointsData(showStations ? data.stations : [])
        .pointLat((d: any) => d.lat)
        .pointLng((d: any) => d.lng)
        .pointColor(() => "#ffffff")
        .pointRadius(0.3)
        .pointAltitude(0.002)
        .pointLabel((d: any) => `${d.name}${d.country ? ` · ${d.country}` : ""}`)
        .onPointClick((d: any) => { setSelStation(d as LandingStation); setSelected(null); setIsSpinning(false) })

      const ctrl = globe.controls()
      ctrl.autoRotate = true; ctrl.autoRotateSpeed = 0.15
      ctrl.enableDamping = true; ctrl.dampingFactor = 0.1
      globeInst.current = globe
    })

    return () => {
      globe?.controls()?.dispose?.()
      globeInst.current = null
    }
  }, [status, data]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update paths when filter changes
  useEffect(() => {
    if (!globeInst.current) return
    globeInst.current
      .pathsData(filteredSegments)
      .pathPoints((d: any) => d.coords)
      .pathPointLat((pt: any) => pt[1])
      .pathPointLng((pt: any) => pt[0])
      .pathColor((d: any) => [d.color + "cc", d.color + "88"])
      .pathStroke(1.2)
      .pathLabel((d: any) => d.name)
      .onPathClick((d: any) => { setSelected(d); setSelStation(null); setIsSpinning(false) })
  }, [filteredSegments])

  // Update stations visibility
  useEffect(() => {
    if (!globeInst.current || !data) return
    globeInst.current.pointsData(showStations ? data.stations : [])
  }, [showStations, data])

  useEffect(() => {
    if (!globeInst.current) return
    globeInst.current.controls().autoRotate = isSpinning
  }, [isSpinning])

  const fmtTime = (d: Date) => d.toUTCString().replace("GMT", "UTC").slice(5, 25)
  const totalCables = useMemo(() => new Set(taggedSegments.map(s => s.name)).size, [taggedSegments])

  if (status === "loading") return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: "calc(100vh - 64px)", background: "var(--bg)" }}>
      <div className="text-center max-w-sm">
        <div className="mb-6 relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: "#33ccdd", borderRightColor: "#5588ff" }} />
          <div className="absolute inset-3 rounded-full flex items-center justify-center" style={{ background: "rgba(51,204,221,0.15)" }}>
            <span className="text-xl">🌐</span>
          </div>
        </div>
        <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--text)" }}>Loading cable map…</h2>
        <p className="text-sm" style={{ color: "var(--muted)" }}>Fetching TeleGeography submarine cable data</p>
      </div>
    </div>
  )

  if (status === "error") return (
    <div className="flex flex-col items-center justify-center gap-4" style={{ minHeight: "calc(100vh - 64px)", background: "var(--bg)" }}>
      <span className="text-4xl">⚠️</span>
      <p className="text-lg font-semibold" style={{ color: "var(--text)" }}>Failed to load cable data</p>
      <p className="text-sm" style={{ color: "var(--muted)" }}>{errorMsg}</p>
      <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--accent)", color: "#000" }}>Retry</button>
    </div>
  )

  return (
    <div className="relative" style={{ minHeight: "calc(100vh - 64px)", background: "#000" }}>
      <div ref={globeRef} className="absolute inset-0" />

      {/* Top bar */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-4 pointer-events-none">
        <div className="pointer-events-auto">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-lg font-bold" style={{ color: "var(--text)" }}>🌐 Submarine Internet Cables</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Cables",   val: totalCables.toString() },
              { label: "Segments", val: filteredSegments.length.toLocaleString() },
              { label: "Stations", val: (data?.stations.length ?? 0).toLocaleString() },
              { label: "UTC",      val: fmtTime(liveTime) },
            ].map(s => (
              <div key={s.label} className="px-3 py-1.5 rounded-lg text-xs" style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", color: "var(--text)" }}>
                <span style={{ color: "var(--muted)" }}>{s.label} </span><span className="font-semibold">{s.val}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 pointer-events-auto">
          <button onClick={() => setShowStations(s => !s)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: showStations ? "rgba(51,204,221,0.15)" : "rgba(0,0,0,0.6)", border: showStations ? "1px solid rgba(51,204,221,0.4)" : "1px solid rgba(255,255,255,0.15)", color: showStations ? "var(--accent)" : "var(--muted)", backdropFilter: "blur(8px)" }}>
            ● Stations
          </button>
          <button onClick={() => setIsSpinning(s => !s)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)", color: "var(--muted)", backdropFilter: "blur(8px)" }}>
            {isSpinning ? "⏸ Pause" : "▶ Spin"}
          </button>
          <Link href="/uc19/details" className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "rgba(51,204,221,0.12)", border: "1px solid rgba(51,204,221,0.3)", color: "var(--accent)", backdropFilter: "blur(8px)" }}>Architecture →</Link>
        </div>
      </div>

      {/* Ocean filter */}
      <div className="absolute bottom-4 left-4 pointer-events-auto w-56">
        <div className="rounded-xl p-3" style={{ background: "rgba(0,0,0,0.78)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(14px)" }}>
          <p className="text-xs font-semibold tracking-wider mb-2" style={{ color: "var(--muted)" }}>OCEAN REGION</p>
          <div className="flex flex-col gap-1">
            {(["all", "pacific", "atlantic", "indian", "arctic", "other"] as const).map(key => {
              const active = oceanFilter === key
              const info   = key === "all" ? null : OCEANS[key]
              const count  = key === "all" ? (oceanCounts.all ?? 0) : (oceanCounts[key] ?? 0)
              return (
                <button key={key} onClick={() => { setOceanFilter(key); setSelected(null) }}
                  className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-left"
                  style={{ background: active ? (info?.color ?? "rgba(255,255,255,0.1)") + "22" : "transparent", border: active ? `1px solid ${info?.color ?? "rgba(255,255,255,0.3)"}` : "1px solid transparent", color: active ? (info?.color ?? "var(--text)") : "var(--muted)" }}>
                  <span className="flex items-center gap-2">
                    {info && <span className="w-2 h-2 rounded-full" style={{ background: info.color }} />}
                    {key === "all" ? "All Oceans" : info!.label}
                  </span>
                  <span className="font-mono opacity-60">{count}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Cable info panel */}
      {selected && (
        <div className="absolute bottom-4 right-4 pointer-events-auto w-72">
          <div className="rounded-xl p-4" style={{ background: "rgba(0,0,0,0.88)", border: `1px solid ${selected.color}44`, backdropFilter: "blur(14px)" }}>
            <div className="flex items-start justify-between mb-3">
              <div className="min-w-0 pr-2">
                <p className="text-sm font-bold leading-tight" style={{ color: "var(--text)" }}>{selected.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Submarine Cable</p>
              </div>
              <button onClick={() => setSelected(null)} className="opacity-40 hover:opacity-80 text-base flex-shrink-0" style={{ color: "var(--muted)" }}>✕</button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: "Length",   val: selected.length || "—" },
                { label: "RFS",      val: selected.rfs    || "—" },
                { label: "Owners",   val: selected.owners || "—" },
              ].map(m => (
                <div key={m.label} className={`rounded-lg px-2 py-1.5 ${m.label === "Owners" ? "col-span-2" : ""}`} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{m.label}</p>
                  <p className="text-sm font-semibold leading-snug" style={{ color: "var(--text)" }}>{m.val}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Station info panel */}
      {selStation && !selected && (
        <div className="absolute bottom-4 right-4 pointer-events-auto w-64">
          <div className="rounded-xl p-4" style={{ background: "rgba(0,0,0,0.88)", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(14px)" }}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--text)" }}>{selStation.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{selStation.country} · Landing Station</p>
              </div>
              <button onClick={() => setSelStation(null)} className="opacity-40 hover:opacity-80 text-base" style={{ color: "var(--muted)" }}>✕</button>
            </div>
            <p className="text-xs" style={{ color: "var(--muted)" }}>{selStation.lat.toFixed(3)}°, {selStation.lng.toFixed(3)}°</p>
          </div>
        </div>
      )}

      {/* Hint */}
      {!selected && !selStation && (
        <div className="absolute bottom-4 right-4 pointer-events-none">
          <p className="text-xs px-3 py-1.5 rounded-lg" style={{ background: "rgba(0,0,0,0.6)", color: "var(--muted)", border: "1px solid rgba(255,255,255,0.08)" }}>
            Click any cable or station for details
          </p>
        </div>
      )}
    </div>
  )
}

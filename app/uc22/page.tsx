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

// Green gradient — no data → very high production
const COLOR_SCALE = [
  { t: 0.00, r: 26,  g: 26,  b: 46  },  // #1a1a2e – no data / ocean
  { t: 0.15, r: 26,  g: 95,  b: 42  },  // #1a5f2a – low
  { t: 0.40, r: 61,  g: 145, b: 66  },  // #3d9142 – medium
  { t: 0.70, r: 126, g: 200, b: 80  },  // #7ec850 – high
  { t: 1.00, r: 200, g: 240, b: 112 },  // #c8f070 – very high
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

type StatusT = "loading" | "ready" | "error"

// ── Three.js helper ───────────────────────────────────────────────────────────

const GLOBE_R = 100

function latLngToXYZ(lat: number, lng: number, altFrac: number): [number, number, number] {
  const r     = GLOBE_R * (1 + altFrac)
  const phi   = (90 - lat)  * (Math.PI / 180)
  const theta = (90 - lng) * (Math.PI / 180)
  return [
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  ]
}

function makeDotTexture(THREE: any): any {
  const sz  = 32
  const cv  = document.createElement("canvas")
  cv.width  = cv.height = sz
  const ctx = cv.getContext("2d")!
  const cx  = sz / 2
  const grd = ctx.createRadialGradient(cx, cx, 0, cx, cx, sz / 2)
  grd.addColorStop(0,    "rgba(220,255,160,1)")
  grd.addColorStop(0.35, "rgba(140,220,80,0.85)")
  grd.addColorStop(0.65, "rgba(60,160,40,0.4)")
  grd.addColorStop(1,    "rgba(0,80,20,0)")
  ctx.fillStyle = grd
  ctx.fillRect(0, 0, sz, sz)
  return new THREE.CanvasTexture(cv)
}

function updatePointBuffer(
  data: PointDatum[],
  THREE: any,
  points: any,
  viewMode: ViewMode,
): void {
  if (!points) return
  const n    = data.length
  const pos  = new Float32Array(n * 3)
  const cols = new Float32Array(n * 3)

  for (let i = 0; i < n; i++) {
    const d     = data[i]
    const alt   = viewMode === "arable" ? d.value * 0.25 : d.value * 0.6
    const [x, y, z] = latLngToXYZ(d.lat, d.lng, alt + 0.005)
    pos[i * 3]     = x
    pos[i * 3 + 1] = y
    pos[i * 3 + 2] = z

    const hex   = lerpColor(d.value > 0 ? 0.1 + d.value * 0.9 : 0)
    const color = new THREE.Color(hex)
    cols[i * 3]     = color.r
    cols[i * 3 + 1] = color.g
    cols[i * 3 + 2] = color.b
  }

  const geo = points.geometry
  geo.setAttribute("position", new THREE.BufferAttribute(pos,  3))
  geo.setAttribute("color",    new THREE.BufferAttribute(cols, 3))
  geo.setDrawRange(0, n)
  geo.computeBoundingSphere()
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function UC22Page() {
  const globeRef    = useRef<HTMLDivElement>(null)
  const globeInst   = useRef<any>(null)
  const pointsRef   = useRef<any>(null)
  const threeRef    = useRef<any>(null)
  const pointsData  = useRef<PointDatum[]>([])
  const viewModeRef = useRef<ViewMode>("production")

  const [status,      setStatus]      = useState<StatusT>("loading")
  const [errorMsg,    setErrorMsg]    = useState("")
  const [agData,      setAgData]      = useState<AgricultureData | null>(null)
  const [selectedCrop, setSelectedCrop] = useState<CropKey>("wheat")
  const [viewMode,    setViewMode]    = useState<ViewMode>("production")
  const [selectedPt,  setSelectedPt]  = useState<PointDatum | null>(null)
  const [isSpinning,  setIsSpinning]  = useState(true)
  const [tooltip,     setTooltip]     = useState<{ x: number; y: number; pt: PointDatum } | null>(null)

  // Keep ref in sync for use inside Three.js callbacks
  useEffect(() => { viewModeRef.current = viewMode }, [viewMode])

  // ── Fetch data ──────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/agriculture-data")
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const json: AgricultureData = await res.json()
      setAgData(json)
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

  // Keep ref in sync for raycaster
  useEffect(() => {
    pointsData.current = displayPoints
  }, [displayPoints])

  // ── Update globe points when data changes ──────────────────────────────────

  useEffect(() => {
    if (pointsRef.current && threeRef.current) {
      updatePointBuffer(displayPoints, threeRef.current, pointsRef.current, viewMode)
    }
  }, [displayPoints, viewMode])

  // ── Globe init ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (status !== "ready" || !globeRef.current || globeInst.current) return
    let globe: any, animId: number

    Promise.all([import("globe.gl"), import("three")]).then(([globeMod, THREE]) => {
      if (!globeRef.current) return
      threeRef.current = THREE

      const GlobeGL = (globeMod.default ?? globeMod) as any
      globe = new GlobeGL()
      globe(globeRef.current)
        .width(globeRef.current.clientWidth)
        .height(globeRef.current.clientHeight)
        .globeImageUrl("//unpkg.com/three-globe/example/img/earth-night.jpg")
        .bumpImageUrl("//unpkg.com/three-globe/example/img/earth-topology.png")
        .backgroundImageUrl("//unpkg.com/three-globe/example/img/night-sky.png")
        .atmosphereColor("#4caf50")
        .atmosphereAltitude(0.1)
        .pointOfView({ lat: 20, lng: 10, altitude: 2.0 })

      const ctrl = globe.controls()
      ctrl.autoRotate      = true
      ctrl.autoRotateSpeed = 0.15
      ctrl.enableDamping   = true
      ctrl.dampingFactor   = 0.1
      globeInst.current    = globe

      // Build particle system
      const geo = new THREE.BufferGeometry()
      const mat = new THREE.PointsMaterial({
        size:           14,
        map:            makeDotTexture(THREE),
        vertexColors:   true,
        transparent:    true,
        alphaTest:      0.01,
        sizeAttenuation: false,
        depthWrite:     false,
      })
      const pts = new THREE.Points(geo, mat)
      pts.renderOrder = 999
      globe.scene().add(pts)
      pointsRef.current = pts

      // Initial render
      updatePointBuffer(pointsData.current, THREE, pts, viewModeRef.current)

      // Gentle pulse animation
      let t = 0
      const pulse = () => {
        animId         = requestAnimationFrame(pulse)
        t             += 0.03
        mat.opacity    = 0.7 + 0.3 * Math.abs(Math.sin(t))
        mat.needsUpdate = true
      }
      animId = requestAnimationFrame(pulse)

      // Click / hover handler
      const canvas = globeRef.current!
      const onMove = (e: MouseEvent) => {
        const rect  = canvas.getBoundingClientRect()
        const mouse = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width)  * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1,
        )
        const rc = new THREE.Raycaster()
        rc.params.Points = { threshold: 4 }
        rc.setFromCamera(mouse, globe.camera())
        const hits = rc.intersectObject(pts)
        if (hits.length > 0 && hits[0].index != null) {
          const pt = pointsData.current[hits[0].index]
          if (pt) {
            setTooltip({ x: e.clientX, y: e.clientY, pt })
            canvas.style.cursor = "pointer"
            return
          }
        }
        setTooltip(null)
        canvas.style.cursor = "default"
      }
      const onClick = (e: MouseEvent) => {
        const rect  = canvas.getBoundingClientRect()
        const mouse = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width)  * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1,
        )
        const rc = new THREE.Raycaster()
        rc.params.Points = { threshold: 4 }
        rc.setFromCamera(mouse, globe.camera())
        const hits = rc.intersectObject(pts)
        if (hits.length > 0 && hits[0].index != null) {
          const pt = pointsData.current[hits[0].index]
          if (pt) {
            setSelectedPt(pt)
            setIsSpinning(false)
            globe.pointOfView({ lat: pt.lat, lng: pt.lng, altitude: 1.6 }, 700)
          }
        }
      }
      canvas.addEventListener("mousemove", onMove)
      canvas.addEventListener("click",     onClick)
      ;(canvas as any)._agMove  = onMove
      ;(canvas as any)._agClick = onClick
    })

    return () => {
      cancelAnimationFrame(animId)
      const canvas = globeRef.current
      if (canvas) {
        if ((canvas as any)._agMove)  canvas.removeEventListener("mousemove", (canvas as any)._agMove)
        if ((canvas as any)._agClick) canvas.removeEventListener("click",     (canvas as any)._agClick)
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

      {/* Floating tooltip on hover */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none px-3 py-2 rounded-lg text-xs"
          style={{
            left:       tooltip.x + 14,
            top:        tooltip.y - 10,
            background: "rgba(0,0,0,0.85)",
            border:     "1px solid rgba(76,175,80,0.4)",
            backdropFilter: "blur(8px)",
            color:      "var(--text)",
          }}
        >
          <p className="font-semibold">{tooltip.pt.country}</p>
          <p style={{ color: "#7ec850" }}>{tooltip.pt.rawLabel}</p>
        </div>
      )}

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

      {/* Selected country panel */}
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

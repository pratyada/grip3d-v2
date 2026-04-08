"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import Link from "next/link"
import { disposeGlobe } from "@/lib/globe-cleanup"

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

interface CountryFeature {
  type: "Feature"
  id: string
  properties: { name: string }
  geometry: any
}

// Maps GeoJSON country name → MCC codes
const COUNTRY_MCC: Record<string, number[]> = {
  "Afghanistan": [412], "Albania": [276], "Algeria": [603], "Angola": [631],
  "Argentina": [722], "Armenia": [283], "Australia": [505], "Austria": [232],
  "Azerbaijan": [400], "Bangladesh": [470], "Belarus": [257], "Belgium": [206],
  "Bolivia": [736], "Bosnia and Herz.": [218], "Brazil": [724], "Bulgaria": [284],
  "Cambodia": [456], "Cameroon": [624], "Canada": [302], "Chile": [730],
  "China": [460], "Colombia": [732], "Congo": [629], "Croatia": [219],
  "Cuba": [368], "Czech Rep.": [230], "Denmark": [238], "Ecuador": [740],
  "Egypt": [602], "Ethiopia": [636], "Finland": [244], "France": [208],
  "Georgia": [282], "Germany": [262], "Ghana": [620], "Greece": [202],
  "Guatemala": [704], "Hungary": [216], "India": [404, 405], "Indonesia": [510],
  "Iran": [432], "Iraq": [418], "Ireland": [272], "Israel": [425],
  "Italy": [222], "Japan": [440], "Jordan": [416], "Kazakhstan": [401],
  "Kenya": [639], "Kosovo": [212], "Kuwait": [419], "Kyrgyzstan": [437],
  "Laos": [457], "Latvia": [247], "Lebanon": [415], "Libya": [606],
  "Lithuania": [246], "Luxembourg": [270], "Malaysia": [502], "Mali": [610],
  "Mexico": [334], "Moldova": [259], "Mongolia": [428], "Morocco": [604],
  "Mozambique": [643], "Myanmar": [414], "Nepal": [429], "Netherlands": [204],
  "New Zealand": [530], "Nicaragua": [710], "Niger": [614], "Nigeria": [621],
  "North Korea": [467], "Norway": [242], "Oman": [422], "Pakistan": [410],
  "Palestine": [425], "Panama": [714], "Peru": [716], "Philippines": [515],
  "Poland": [260], "Portugal": [268], "Qatar": [427], "Romania": [226],
  "Russia": [250], "Saudi Arabia": [420], "Senegal": [608], "Serbia": [220],
  "Singapore": [525], "Slovakia": [231], "Slovenia": [293], "Somalia": [637],
  "South Africa": [655], "South Korea": [450], "Spain": [214], "Sri Lanka": [413],
  "Sudan": [634], "Sweden": [240], "Switzerland": [228], "Syria": [417],
  "Taiwan": [466], "Tanzania": [640], "Thailand": [520], "Turkey": [286],
  "Turkmenistan": [438], "Uganda": [641], "Ukraine": [255],
  "United Arab Emirates": [424], "United Kingdom": [234],
  "United States of America": [310, 311, 312, 313, 314, 315],
  "Uruguay": [748], "Uzbekistan": [434], "Venezuela": [734],
  "Vietnam": [452], "Yemen": [421], "Zambia": [645], "Zimbabwe": [648],
  "Dem. Rep. Congo": [630], "Central African Rep.": [623], "Côte d'Ivoire": [612],
  "W. Sahara": [], "Greenland": [290], "Puerto Rico": [330],
  "Hong Kong": [454], "Macao": [455],
}

const RADIO_COLORS: Record<RadioKey, string> = {
  GSM: "#44ff88", UMTS: "#ffcc44", LTE: "#44aaff", NR: "#ff44aa",
}
const RADIO_LABELS: Record<RadioKey, string> = {
  GSM: "2G GSM", UMTS: "3G UMTS", LTE: "4G LTE", NR: "5G NR",
}
const FILTER_KEYS: FilterKey[] = ["all", "GSM", "UMTS", "LTE", "NR"]

function hexBinColor(t: number): string {
  if (t < 0.15) return `rgba(13, 8, 135, ${0.45 + t * 2})`
  if (t < 0.30) return `rgba(84, 2, 163, ${0.65 + t * 0.5})`
  if (t < 0.45) return `rgba(139, 10, 165, 0.80)`
  if (t < 0.60) return `rgba(185, 50, 137, 0.85)`
  if (t < 0.75) return `rgba(219, 92, 104, 0.88)`
  if (t < 0.88) return `rgba(245, 144, 60, 0.92)`
  return `rgba(253, 231, 37, 0.96)`
}

function formatTowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`
  return n.toString()
}

function mccCountry(mcc: number): string {
  const MAP: Record<number, string> = {
    310:"USA",311:"USA",312:"USA",313:"USA",314:"USA",315:"USA",
    302:"Canada",334:"Mexico",724:"Brazil",722:"Argentina",
    732:"Colombia",716:"Peru",730:"Chile",
    234:"UK",208:"France",262:"Germany",222:"Italy",214:"Spain",
    204:"Netherlands",206:"Belgium",238:"Denmark",240:"Sweden",
    244:"Finland",242:"Norway",228:"Switzerland",232:"Austria",
    260:"Poland",226:"Romania",230:"Czech Rep.",286:"Turkey",
    272:"Ireland",268:"Portugal",216:"Hungary",202:"Greece",
    404:"India",405:"India",460:"China",440:"Japan",450:"South Korea",
    454:"Hong Kong",466:"Taiwan",525:"Singapore",502:"Malaysia",
    505:"Australia",530:"New Zealand",515:"Philippines",
    510:"Indonesia",520:"Thailand",452:"Vietnam",414:"Myanmar",
    413:"Sri Lanka",470:"Bangladesh",410:"Pakistan",
    604:"Morocco",602:"Egypt",608:"Senegal",
    621:"Nigeria",655:"South Africa",639:"Kenya",640:"Tanzania",
    636:"Ethiopia",630:"DR Congo",620:"Ghana",
    250:"Russia",255:"Ukraine",401:"Kazakhstan",434:"Uzbekistan",
    424:"UAE",420:"Saudi Arabia",425:"Israel",432:"Iran",
    282:"Georgia",400:"Azerbaijan",437:"Kyrgyzstan",
  }
  return MAP[mcc] ?? `MCC ${mcc}`
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

function generateSampleTowers(cells: DensityPoint[], filter: FilterKey): SampleTower[] {
  const samples: SampleTower[] = []
  for (const cell of cells) {
    if (filter !== "all" && cell.radio !== filter) continue
    const n = Math.min(8, Math.max(1, Math.floor(Math.log10(cell.towers + 1))))
    for (let i = 0; i < n; i++) {
      samples.push({
        lat: cell.lat + (Math.random() - 0.5) * 2.5,
        lng: cell.lng + (Math.random() - 0.5) * 2.5,
        radio: cell.radio,
        mcc: cell.mcc,
        towers: cell.towers,
      })
    }
  }
  return samples
}

type StatusT = "loading" | "ready" | "error"

export default function UC06Page() {
  const globeRef  = useRef<HTMLDivElement>(null)
  const globeInst = useRef<any>(null)

  const [status,          setStatus]          = useState<StatusT>("loading")
  const [errorMsg,        setErrorMsg]        = useState("")
  const [cells,           setCells]           = useState<DensityPoint[]>([])
  const [countries,       setCountries]       = useState<CountryFeature[]>([])
  const [hoveredCountry,  setHoveredCountry]  = useState<CountryFeature | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<CountryFeature | null>(null)
  const [hoveredHex,      setHoveredHex]      = useState<{ sumWeight: number; lat: number; lng: number } | null>(null)
  const [isSpinning,      setIsSpinning]      = useState(true)
  const [radioFilter,     setRadioFilter]     = useState<FilterKey>("all")
  const [viewMode,        setViewMode]        = useState<ViewMode>("heatmap")

  // ── Fetch cells ─────────────────────────────────────────────────────────────
  const fetchCells = useCallback(async () => {
    try {
      const [cellRes, geoRes] = await Promise.all([
        fetch("/api/cell-towers", { cache: "no-store" }),
        fetch("/countries-110m.geojson"),
      ])
      if (!cellRes.ok) throw new Error(`API error ${cellRes.status}`)
      const data: DensityPoint[] = await cellRes.json()
      const geo = await geoRes.json()
      setCells(data)
      setCountries(geo.features as CountryFeature[])
      setStatus("ready")
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Unknown error")
      setStatus("error")
    }
  }, [])

  useEffect(() => { fetchCells() }, [fetchCells])

  // ── Derived ─────────────────────────────────────────────────────────────────
  const totalTowers = useMemo(
    () => cells.reduce((s, d) => s + d.towers, 0),
    [cells],
  )

  const countsPerRadio = useMemo(() => {
    const c: Record<FilterKey, number> = { all: 0, GSM: 0, UMTS: 0, LTE: 0, NR: 0 }
    for (const d of cells) {
      c.all      += d.towers
      c[d.radio]  = (c[d.radio] ?? 0) + d.towers
    }
    return c
  }, [cells])

  // Country stats: given a country feature, compute towers by radio
  const countryStats = useMemo(() => {
    if (!selectedCountry) return null
    const name = selectedCountry.properties.name
    const mccs = COUNTRY_MCC[name] ?? []
    if (!mccs.length) return null
    const matching = cells.filter(d => mccs.includes(d.mcc))
    if (!matching.length) return null
    const total = matching.reduce((s, d) => s + d.towers, 0)
    const byRadio: Record<RadioKey, number> = { GSM: 0, UMTS: 0, LTE: 0, NR: 0 }
    for (const d of matching) byRadio[d.radio] = (byRadio[d.radio] ?? 0) + d.towers
    return { name, total, byRadio, entries: matching.length }
  }, [selectedCountry, cells])

  // ── Globe init ───────────────────────────────────────────────────────────────
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
      applyCountries(globe, countries, null, null)
    })

    return () => {
      disposeGlobe(globeInst, globeRef)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  // ── Apply flat heatmap ───────────────────────────────────────────────────────
  function applyHeatmap(globe: any, data: DensityPoint[], filter: FilterKey) {
    const pts = filter === "all" ? data : data.filter(d => d.radio === filter)
    if (!pts.length) return

    // Precompute max weight for colour normalisation
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
      .hexAltitude((d: any) => {
        const t = Math.min(d.sumWeight / maxW, 1)
        return Math.max(0.003, t * t * 0.42)  // quadratic: dense cities tower high
      })
      .hexTopColor((d: any) => hexBinColor(Math.min(d.sumWeight / maxW, 1)))
      .hexSideColor((d: any) => {
        const t = Math.min(d.sumWeight / maxW, 1)
        return hexBinColor(t).replace(/[\d.]+\)$/, "0.5)")
      })
      .onHexHover((bin: any) => {
        if (bin) {
          const pt = bin.points?.[0] as DensityPoint | undefined
          setHoveredHex({ sumWeight: bin.sumWeight, lat: pt?.lat ?? 0, lng: pt?.lng ?? 0 })
        } else {
          setHoveredHex(null)
        }
      })
      .onHexClick(() => {})  // hex clicks intentionally cleared — country click handles selection
  }

  // ── Apply individual towers ──────────────────────────────────────────────────
  function applyTowers(globe: any, data: DensityPoint[], filter: FilterKey) {
    const samples = generateSampleTowers(data, filter)
    globe
      .hexBinPointsData([])
      .pointsData(samples)
      .pointLat((d: any) => d.lat)
      .pointLng((d: any) => d.lng)
      .pointColor((d: any) => RADIO_COLORS[d.radio as RadioKey] ?? "#fff")
      .pointAltitude(0.002)
      .pointRadius(0.08)
      .pointResolution(4)
      .onPointHover((pt: any) => {
        if (globeRef.current) globeRef.current.style.cursor = pt ? "pointer" : "default"
      })
      .onPointClick(() => {})
  }

  // ── Apply country polygons ───────────────────────────────────────────────────
  function applyCountries(
    globe: any,
    features: CountryFeature[],
    hovered: CountryFeature | null,
    selected: CountryFeature | null,
  ) {
    globe
      .polygonsData(features)
      .polygonCapColor((d: any) => {
        if (selected && d.properties.name === selected.properties.name)
          return "rgba(253,231,37,0.10)"
        if (hovered && d.properties.name === hovered.properties.name)
          return "rgba(255,255,255,0.06)"
        return "rgba(0,0,0,0)"
      })
      .polygonSideColor(() => "rgba(0,0,0,0)")
      .polygonStrokeColor((d: any) => {
        if (selected && d.properties.name === selected.properties.name)
          return "rgba(253,231,37,0.9)"
        if (hovered && d.properties.name === hovered.properties.name)
          return "rgba(255,255,255,0.6)"
        return "rgba(255,255,255,0.18)"
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

  // ── Sync heatmap/towers when filter/mode changes ─────────────────────────────
  useEffect(() => {
    if (!globeInst.current || status !== "ready") return
    setHoveredHex(null)
    if (viewMode === "heatmap") applyHeatmap(globeInst.current, cells, radioFilter)
    else applyTowers(globeInst.current, cells, radioFilter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, radioFilter, cells, status])

  // ── Sync country polygons when hover/selection changes ───────────────────────
  useEffect(() => {
    if (!globeInst.current || status !== "ready" || !countries.length) return
    applyCountries(globeInst.current, countries, hoveredCountry, selectedCountry)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoveredCountry, selectedCountry, countries, status])

  // ── Spin control ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!globeInst.current) return
    globeInst.current.controls().autoRotate = isSpinning
  }, [isSpinning])

  // ── Resize ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onResize = () => {
      if (globeInst.current && globeRef.current)
        globeInst.current.width(globeRef.current.clientWidth).height(globeRef.current.clientHeight)
    }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  // ── Loading / error ───────────────────────────────────────────────────────────
  if (status === "loading") return (
    <div className="flex flex-col items-center justify-center"
      style={{ minHeight: "calc(100vh - 64px)", background: "var(--bg)" }}>
      <div className="text-center max-w-sm">
        <div className="mb-6 relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
            style={{ borderTopColor: "#b93289", borderRightColor: "#fde725" }} />
          <div className="absolute inset-3 rounded-full flex items-center justify-center"
            style={{ background: "rgba(84,2,163,0.2)" }}>
            <span className="text-xl">📡</span>
          </div>
        </div>
        <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--text)" }}>Loading tower density…</h2>
        <p className="text-sm" style={{ color: "var(--muted)" }}>Fetching 8.98M global towers + country boundaries</p>
      </div>
    </div>
  )

  if (status === "error") return (
    <div className="flex flex-col items-center justify-center gap-4"
      style={{ minHeight: "calc(100vh - 64px)", background: "var(--bg)" }}>
      <span className="text-4xl">⚠️</span>
      <p className="text-lg font-semibold" style={{ color: "var(--text)" }}>Failed to load data</p>
      <p className="text-sm" style={{ color: "var(--muted)" }}>{errorMsg}</p>
      <button onClick={() => { setStatus("loading"); fetchCells() }}
        className="px-4 py-2 rounded-lg text-sm font-medium"
        style={{ background: "#b93289", color: "#fff" }}>
        Retry
      </button>
    </div>
  )

  const legendGradient = "linear-gradient(to right, #0d0887, #541ec7, #8b0aa5, #b93289, #db5c68, #f5903c, #fde725)"

  return (
    <div className="relative" style={{ minHeight: "calc(100vh - 64px)", background: "#000" }}>
      <div ref={globeRef} className="absolute inset-0" />

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-4 pointer-events-none">
        <div className="pointer-events-auto">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base font-bold" style={{ color: "var(--text)" }}>Tower Density</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: "rgba(253,231,37,0.15)", color: "#fde725", border: "1px solid rgba(253,231,37,0.35)" }}>
              {formatTowers(totalTowers)} towers
            </span>
          </div>
          <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>
            Global 2G / 3G / LTE / 5G · Click a country for stats
          </p>
          <div className="flex gap-1.5">
            {(["heatmap", "towers"] as ViewMode[]).map(m => (
              <button key={m} onClick={() => setViewMode(m)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background:     viewMode === m ? "rgba(84,2,163,0.35)" : "rgba(0,0,0,0.6)",
                  border:         viewMode === m ? "1px solid rgba(139,10,165,0.7)" : "1px solid rgba(255,255,255,0.12)",
                  color:          viewMode === m ? "#fde725" : "var(--muted)",
                  backdropFilter: "blur(8px)",
                }}>
                {m === "heatmap" ? "Density Map" : "Individual Towers"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 pointer-events-auto">
          <button onClick={() => setIsSpinning(s => !s)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)", color: "var(--muted)", backdropFilter: "blur(8px)" }}>
            {isSpinning ? "Pause" : "Spin"}
          </button>
          <Link href="/uc6/details"
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "rgba(84,2,163,0.18)", border: "1px solid rgba(139,10,165,0.4)", color: "#b93289", backdropFilter: "blur(8px)" }}>
            About →
          </Link>
        </div>
      </div>

      {/* ── Bottom-left: radio filter + legend ────────────────────────────────── */}
      <div className="absolute bottom-4 left-4 pointer-events-auto w-56">
        <div className="rounded-xl p-3"
          style={{ background: "rgba(0,0,0,0.80)", border: "1px solid rgba(255,255,255,0.10)", backdropFilter: "blur(14px)" }}>
          <p className="text-xs font-semibold tracking-wider mb-2" style={{ color: "var(--muted)" }}>RADIO TYPE</p>
          <div className="flex flex-col gap-1">
            {FILTER_KEYS.map(key => {
              const active = radioFilter === key
              const color  = key === "all" ? "rgba(255,255,255,0.7)" : RADIO_COLORS[key as RadioKey]
              const label  = key === "all" ? "All Types" : RADIO_LABELS[key as RadioKey]
              return (
                <button key={key} onClick={() => setRadioFilter(key)}
                  className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-left transition-all"
                  style={{
                    background: active ? color + "22" : "transparent",
                    border:     active ? `1px solid ${color}` : "1px solid transparent",
                    color:      active ? color : "var(--muted)",
                  }}>
                  <span className="flex items-center gap-2">
                    {key !== "all" && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: RADIO_COLORS[key as RadioKey] }} />}
                    {label}
                  </span>
                  <span className="font-mono opacity-60">{formatTowers(countsPerRadio[key])}</span>
                </button>
              )
            })}
          </div>
          {viewMode === "heatmap" && (
            <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-xs mb-1.5" style={{ color: "var(--muted)" }}>Plasma scale</p>
              <div className="h-2.5 rounded-full mb-1" style={{ background: legendGradient }} />
              <div className="flex justify-between text-xs" style={{ color: "var(--muted)" }}>
                <span>Low</span><span>High</span>
              </div>
            </div>
          )}
          <p className="mt-3 text-xs text-center" style={{ color: "var(--muted)", opacity: 0.5 }}>
            TRAI 2024 · ITU · OpenCelliD
          </p>
        </div>
      </div>

      {/* ── Bottom-right: country stats OR hex hover ─────────────────────────── */}
      <div className="absolute bottom-4 right-4 pointer-events-auto w-72">
        {selectedCountry && countryStats ? (
          // Country stats panel
          <div className="rounded-xl p-4"
            style={{ background: "rgba(0,0,0,0.88)", border: "1px solid rgba(253,231,37,0.3)", backdropFilter: "blur(14px)" }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-bold" style={{ color: "#fde725" }}>{countryStats.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  {formatTowers(countryStats.total)} total towers
                </p>
              </div>
              <button onClick={() => setSelectedCountry(null)}
                className="opacity-40 hover:opacity-80 text-base" style={{ color: "var(--muted)" }}>✕</button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {(["GSM","UMTS","LTE","NR"] as RadioKey[]).map(r => (
                <div key={r} className="rounded-lg px-2 py-2"
                  style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${RADIO_COLORS[r]}33` }}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: RADIO_COLORS[r] }} />
                    <span className="text-xs" style={{ color: "var(--muted)" }}>{RADIO_LABELS[r]}</span>
                  </div>
                  <p className="text-sm font-bold font-mono" style={{ color: RADIO_COLORS[r] }}>
                    {formatTowers(countryStats.byRadio[r])}
                  </p>
                  <p className="text-xs" style={{ color: "var(--muted)", opacity: 0.6 }}>
                    {countryStats.total > 0 ? Math.round((countryStats.byRadio[r] / countryStats.total) * 100) : 0}%
                  </p>
                </div>
              ))}
            </div>
            <div className="pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              {/* Simple bar chart showing radio distribution */}
              <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                {(["GSM","UMTS","LTE","NR"] as RadioKey[]).map(r => {
                  const pct = countryStats.total > 0
                    ? (countryStats.byRadio[r] / countryStats.total) * 100
                    : 0
                  return pct > 0 ? (
                    <div key={r} style={{ width: `${pct}%`, background: RADIO_COLORS[r], minWidth: "2px" }} />
                  ) : null
                })}
              </div>
              <p className="mt-1.5 text-xs" style={{ color: "var(--muted)", opacity: 0.6 }}>
                Network generation distribution
              </p>
            </div>
          </div>
        ) : hoveredCountry ? (
          // Hovered country name tooltip
          <div className="rounded-xl px-4 py-3"
            style={{ background: "rgba(0,0,0,0.82)", border: "1px solid rgba(255,255,255,0.14)", backdropFilter: "blur(12px)" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{hoveredCountry.properties.name}</p>
            {(() => {
              const mccs = COUNTRY_MCC[hoveredCountry.properties.name] ?? []
              const t = cells.filter(d => mccs.includes(d.mcc)).reduce((s, d) => s + d.towers, 0)
              return t > 0 ? (
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  ~{formatTowers(t)} towers · Click for details
                </p>
              ) : (
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Click for details</p>
              )
            })()}
          </div>
        ) : viewMode === "heatmap" && hoveredHex ? (
          // Hex hover tooltip (when not hovering a country)
          <div className="rounded-xl px-4 py-3"
            style={{ background: "rgba(0,0,0,0.82)", border: "1px solid rgba(139,10,165,0.3)", backdropFilter: "blur(12px)" }}>
            <p className="text-sm font-semibold" style={{ color: "#b93289" }}>
              {Math.round(hoveredHex.sumWeight).toLocaleString()} density score
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
              {hoveredHex.lat.toFixed(1)}°, {hoveredHex.lng.toFixed(1)}°
            </p>
          </div>
        ) : null}
      </div>

      {/* ── Country name label on hover (top center) ─────────────────────────── */}
      {hoveredCountry && !selectedCountry && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.15)", color: "var(--text)", backdropFilter: "blur(8px)" }}>
            {hoveredCountry.properties.name}
          </div>
        </div>
      )}
    </div>
  )
}

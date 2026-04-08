"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { disposeGlobe } from "@/lib/globe-cleanup"

/* ── Types ───────────────────────────────────────────────────────────────────── */

interface CryptoExchange {
  id: string
  name: string
  country: string
  lat: number
  lng: number
  trustScore: number
  volume24hBtc: number
  yearEstablished: number | null
  url: string
}

interface CryptoPrice {
  id: string
  symbol: string
  name: string
  price: number
  change24h: number
  marketCap: number
  volume24h: number
}

interface GlobalStats {
  totalMarketCap: number
  totalVolume24h: number
  btcDominance: number
  activeCryptos: number
  activeExchanges: number
}

interface CountryFeature {
  type: string
  properties: { name: string; [k: string]: unknown }
  geometry: { type: string; coordinates: number[][][] | number[][][][] }
}

type ViewMode = "exchanges" | "mining" | "regulation"
type TrustFilter = "all" | "high" | "medium" | "low"

/* ── Mining data (hardcoded) ─────────────────────────────────────────────────── */

const MINING_DATA = [
  { country: "United States", lat: 39.8, lng: -98.6, hashratePct: 37.8, color: "#3b82f6" },
  { country: "China", lat: 35.9, lng: 104.2, hashratePct: 21.1, color: "#ef4444" },
  { country: "Kazakhstan", lat: 48.0, lng: 67.0, hashratePct: 13.2, color: "#f59e0b" },
  { country: "Russia", lat: 61.5, lng: 105.3, hashratePct: 11.2, color: "#22c55e" },
  { country: "Canada", lat: 56.1, lng: -106.3, hashratePct: 6.5, color: "#a78bfa" },
  { country: "Germany", lat: 51.2, lng: 10.4, hashratePct: 3.1, color: "#06b6d4" },
  { country: "Ireland", lat: 53.1, lng: -7.7, hashratePct: 2.0, color: "#f472b6" },
  { country: "Malaysia", lat: 4.2, lng: 101.7, hashratePct: 1.8, color: "#fb923c" },
  { country: "Iran", lat: 32.4, lng: 53.7, hashratePct: 1.5, color: "#64748b" },
  { country: "Norway", lat: 60.5, lng: 8.5, hashratePct: 1.0, color: "#34d399" },
]

/* ── Regulatory status (hardcoded) ───────────────────────────────────────────── */

const REGULATION: Record<string, "friendly" | "regulated" | "restricted" | "banned"> = {
  "United States": "regulated", "Japan": "regulated", "South Korea": "regulated",
  "Singapore": "friendly", "Switzerland": "friendly", "UAE": "friendly",
  "Malta": "friendly", "Estonia": "friendly", "Germany": "regulated",
  "United Kingdom": "regulated", "Australia": "regulated", "Canada": "regulated",
  "Hong Kong": "regulated", "France": "regulated",
  "China": "banned", "Algeria": "banned", "Bangladesh": "banned", "Egypt": "restricted",
  "India": "regulated", "Brazil": "regulated", "Nigeria": "restricted",
  "Turkey": "restricted", "Russia": "restricted", "Indonesia": "restricted",
  "Vietnam": "restricted", "Thailand": "regulated", "Philippines": "regulated",
  "Mexico": "regulated", "Argentina": "regulated", "Colombia": "regulated",
  "South Africa": "regulated", "Israel": "regulated",
  "El Salvador": "friendly", "Portugal": "friendly", "Bermuda": "friendly",
  "Netherlands": "regulated", "Italy": "regulated", "Spain": "regulated",
  "Poland": "regulated", "Sweden": "regulated", "Denmark": "regulated",
  "Norway": "regulated", "Finland": "regulated", "Austria": "regulated",
  "Czech Republic": "regulated", "New Zealand": "regulated",
  "Lithuania": "friendly", "Luxembourg": "regulated",
}

const REG_COLORS: Record<string, string> = {
  friendly: "rgba(34,197,94,0.25)",
  regulated: "rgba(234,179,8,0.20)",
  restricted: "rgba(249,115,22,0.25)",
  banned: "rgba(239,68,68,0.30)",
}

const REG_STROKE: Record<string, string> = {
  friendly: "rgba(34,197,94,0.8)",
  regulated: "rgba(234,179,8,0.6)",
  restricted: "rgba(249,115,22,0.8)",
  banned: "rgba(239,68,68,0.9)",
}

/* ── Helpers ─────────────────────────────────────────────────────────────────── */

function fmt$(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`
  return `$${n.toFixed(2)}`
}

function fmtBtc(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M BTC`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K BTC`
  return `${n.toFixed(1)} BTC`
}

function trustColor(score: number): string {
  if (score >= 8) return "#22c55e"
  if (score >= 5) return "#eab308"
  return "#ef4444"
}

function featureCentroid(geo: CountryFeature["geometry"]): { lat: number; lng: number } {
  const coords = geo.type === "MultiPolygon"
    ? (geo.coordinates as number[][][][]).flat(2)
    : (geo.coordinates as number[][][]).flat()
  let sLat = 0, sLng = 0, n = 0
  for (const c of coords) { sLng += c[0]; sLat += c[1]; n++ }
  return { lat: n ? sLat / n : 0, lng: n ? sLng / n : 0 }
}

/* ── Component ───────────────────────────────────────────────────────────────── */

export default function CryptoBlockchainGlobe() {
  const globeRef = useRef<HTMLDivElement>(null)
  const globeInst = useRef<ReturnType<typeof Object> | null>(null)

  const [exchanges, setExchanges] = useState<CryptoExchange[]>([])
  const [prices, setPrices] = useState<CryptoPrice[]>([])
  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    totalMarketCap: 0, totalVolume24h: 0, btcDominance: 0, activeCryptos: 0, activeExchanges: 0,
  })
  const [countries, setCountries] = useState<CountryFeature[]>([])
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const [viewMode, setViewMode] = useState<ViewMode>("exchanges")
  const [trustFilter, setTrustFilter] = useState<TrustFilter>("all")
  const [selectedExchange, setSelectedExchange] = useState<CryptoExchange | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<CountryFeature | null>(null)
  const [hoveredCountry, setHoveredCountry] = useState<CountryFeature | null>(null)
  const [isSpinning, setIsSpinning] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  /* ── Fetch data ──────────────────────────────────────────────────────────── */

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/crypto-globe")
      if (!res.ok) throw new Error("API error")
      const data = await res.json()
      setExchanges(data.exchanges ?? [])
      setPrices(data.prices ?? [])
      setGlobalStats(data.globalStats ?? {
        totalMarketCap: 0, totalVolume24h: 0, btcDominance: 0, activeCryptos: 0, activeExchanges: 0,
      })
      setLastRefresh(new Date())
    } catch {
      /* keep existing data on refresh failure */
    }
  }, [])

  useEffect(() => {
    async function init() {
      try {
        const [apiRes, geoRes] = await Promise.all([
          fetch("/api/crypto-globe"),
          fetch("https://unpkg.com/world-atlas@2/countries-110m.json"),
        ])
        if (!apiRes.ok) throw new Error("API error")
        const data = await apiRes.json()
        setExchanges(data.exchanges ?? [])
        setPrices(data.prices ?? [])
        setGlobalStats(data.globalStats ?? {
          totalMarketCap: 0, totalVolume24h: 0, btcDominance: 0, activeCryptos: 0, activeExchanges: 0,
        })

        if (geoRes.ok) {
          const topo = await geoRes.json()
          // @ts-expect-error -- no declaration file for topojson-client
          const topojson = await import("topojson-client")
          const feats = (topojson.feature(topo, topo.objects.countries) as unknown as { features: CountryFeature[] }).features
          setCountries(feats)
        }
        setLastRefresh(new Date())
        setStatus("ready")
      } catch {
        setStatus("error")
      }
    }
    init()
  }, [])

  // Auto-refresh prices every 60 seconds
  useEffect(() => {
    const id = setInterval(fetchData, 60_000)
    return () => clearInterval(id)
  }, [fetchData])

  /* ── Globe init ──────────────────────────────────────────────────────────── */

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
        .atmosphereColor("#f59e0b")
        .atmosphereAltitude(0.14)
        .pointOfView({ lat: 30, lng: 0, altitude: 2.2 })

      globe.controls().autoRotate = true
      globe.controls().autoRotateSpeed = 0.18
      globe.controls().enableDamping = true
      globe.controls().dampingFactor = 0.1

      globeInst.current = globe
      applyPoints(globe, exchanges, "all")
      applyCountries(globe, countries, null, null, "exchanges")
    })

    return () => {
      disposeGlobe(globeInst, globeRef)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  /* ── Apply exchange/mining points ────────────────────────────────────────── */

  function applyPoints(globe: any, exs: CryptoExchange[], filter: TrustFilter) {
    const filtered = filter === "all" ? exs
      : filter === "high" ? exs.filter(e => e.trustScore >= 8)
      : filter === "medium" ? exs.filter(e => e.trustScore >= 5 && e.trustScore < 8)
      : exs.filter(e => e.trustScore < 5)

    globe
      .pointsData(filtered)
      .pointLat((d: any) => d.lat)
      .pointLng((d: any) => d.lng)
      .pointColor((d: any) => trustColor(d.trustScore))
      .pointAltitude(0.01)
      .pointRadius((d: any) => Math.max(0.12, d.trustScore * 0.08))
      .pointResolution(8)
      .onPointHover((pt: any) => {
        if (globeRef.current) globeRef.current.style.cursor = pt ? "pointer" : "default"
      })
      .onPointClick((pt: any) => {
        setSelectedExchange(pt as CryptoExchange)
        setIsSpinning(false)
      })
  }

  function applyMiningPoints(globe: any) {
    globe
      .pointsData(MINING_DATA)
      .pointLat((d: any) => d.lat)
      .pointLng((d: any) => d.lng)
      .pointColor((d: any) => d.color)
      .pointAltitude((d: any) => Math.max(0.02, d.hashratePct * 0.008))
      .pointRadius((d: any) => Math.max(0.3, d.hashratePct * 0.06))
      .pointResolution(12)
      .onPointHover((pt: any) => {
        if (globeRef.current) globeRef.current.style.cursor = pt ? "pointer" : "default"
      })
      .onPointClick(() => {})
  }

  /* ── Apply country polygons ──────────────────────────────────────────────── */

  function applyCountries(
    globe: any,
    features: CountryFeature[],
    hovered: CountryFeature | null,
    selected: CountryFeature | null,
    mode: ViewMode,
  ) {
    // Count exchanges per country for choropleth
    const countryExchangeCount: Record<string, number> = {}
    for (const ex of exchanges) {
      countryExchangeCount[ex.country] = (countryExchangeCount[ex.country] ?? 0) + 1
    }
    const maxCount = Math.max(1, ...Object.values(countryExchangeCount))

    globe
      .polygonsData(features)
      .polygonCapColor((d: any) => {
        const name = d.properties?.name ?? ""
        if (selected && d.properties.name === selected.properties.name)
          return "rgba(245,158,11,0.15)"
        if (hovered && d.properties.name === hovered.properties.name)
          return "rgba(255,255,255,0.08)"

        if (mode === "regulation") {
          const reg = REGULATION[name]
          if (reg) return REG_COLORS[reg]
          return "rgba(0,0,0,0)"
        }

        if (mode === "exchanges") {
          const count = countryExchangeCount[name] ?? 0
          if (count === 0) return "rgba(0,0,0,0)"
          const t = Math.min(count / maxCount, 1)
          return `rgba(245,158,11,${(t * 0.3).toFixed(2)})`
        }

        // Mining mode: highlight mining countries
        const mining = MINING_DATA.find(m => name.includes(m.country) || m.country.includes(name))
        if (mining) {
          const t = mining.hashratePct / 40
          return `rgba(59,130,246,${(t * 0.3).toFixed(2)})`
        }
        return "rgba(0,0,0,0)"
      })
      .polygonSideColor(() => "rgba(0,0,0,0)")
      .polygonStrokeColor((d: any) => {
        const name = d.properties?.name ?? ""
        if (selected && d.properties.name === selected.properties.name)
          return "rgba(245,158,11,0.9)"
        if (hovered && d.properties.name === hovered.properties.name)
          return "rgba(255,255,255,0.6)"

        if (mode === "regulation") {
          const reg = REGULATION[name]
          if (reg) return REG_STROKE[reg]
        }
        return "rgba(255,255,255,0.15)"
      })
      .polygonAltitude(0.005)
      .onPolygonHover((d: any) => {
        setHoveredCountry(d as CountryFeature | null)
      })
      .onPolygonClick((d: any) => {
        const f = d as CountryFeature
        setSelectedCountry(prev =>
          prev?.properties.name === f.properties.name ? null : f,
        )
        if (globeInst.current) {
          const { lat, lng } = featureCentroid(f.geometry)
          globeInst.current.pointOfView({ lat, lng, altitude: 2.0 }, 800)
        }
        setIsSpinning(false)
      })
  }

  /* ── Sync points + polygons when filters/mode change ─────────────────────── */

  useEffect(() => {
    if (!globeInst.current || status !== "ready") return
    const globe = globeInst.current as any

    if (viewMode === "exchanges") {
      applyPoints(globe, exchanges, trustFilter)
    } else if (viewMode === "mining") {
      applyMiningPoints(globe)
    } else {
      // regulation mode: clear points, show choropleth borders
      globe.pointsData([])
    }

    applyCountries(globe, countries, hoveredCountry, selectedCountry, viewMode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, trustFilter, exchanges, countries, status])

  // Sync country polygons on hover/selection
  useEffect(() => {
    if (!globeInst.current || status !== "ready") return
    applyCountries(globeInst.current as any, countries, hoveredCountry, selectedCountry, viewMode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoveredCountry, selectedCountry])

  // Sync auto-rotate
  useEffect(() => {
    if (!globeInst.current) return
    ;(globeInst.current as any).controls().autoRotate = isSpinning
  }, [isSpinning])

  // Resize handler
  useEffect(() => {
    function onResize() {
      if (globeInst.current && globeRef.current) {
        ;(globeInst.current as any)
          .width(globeRef.current.clientWidth)
          .height(globeRef.current.clientHeight)
      }
    }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  /* ── Derived data ────────────────────────────────────────────────────────── */

  const filteredExchanges = trustFilter === "all" ? exchanges
    : trustFilter === "high" ? exchanges.filter(e => e.trustScore >= 8)
    : trustFilter === "medium" ? exchanges.filter(e => e.trustScore >= 5 && e.trustScore < 8)
    : exchanges.filter(e => e.trustScore < 5)

  const topExchanges = [...filteredExchanges].sort((a, b) => b.volume24hBtc - a.volume24hBtc).slice(0, 12)

  const btcPrice = prices.find(p => p.symbol === "BTC")
  const ethPrice = prices.find(p => p.symbol === "ETH")

  // Country info for selected country
  const selectedCountryName = selectedCountry?.properties.name ?? ""
  const countryExchanges = exchanges.filter(e => e.country === selectedCountryName)
  const countryTopExchange = [...countryExchanges].sort((a, b) => b.volume24hBtc - a.volume24hBtc)[0]
  const countryReg = REGULATION[selectedCountryName]

  /* ── Render ──────────────────────────────────────────────────────────────── */

  if (status === "loading") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <div className="text-center">
          <div className="mb-4 text-5xl">&#8383;</div>
          <div className="text-lg text-amber-400 animate-pulse">Loading Crypto Globe...</div>
          <p className="mt-2 text-xs text-white/40">Fetching exchange & market data</p>
        </div>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <div className="text-center">
          <div className="mb-4 text-5xl">&#9888;</div>
          <div className="text-lg text-red-400">Failed to load data</div>
          <button onClick={() => window.location.reload()} className="mt-4 rounded bg-amber-600 px-4 py-2 text-sm text-white hover:bg-amber-500">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      {/* Globe container */}
      <div ref={globeRef} className="absolute inset-0" />

      {/* ── Ticker tape (top, scrolling) ─────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-20 overflow-hidden bg-black/70 backdrop-blur-sm border-b border-amber-500/20" style={{ height: 36 }}>
        <div className="flex items-center h-full animate-marquee whitespace-nowrap">
          {[...prices.slice(0, 10), ...prices.slice(0, 10)].map((p, i) => (
            <span key={`${p.symbol}-${i}`} className="inline-flex items-center gap-1.5 px-4 text-xs font-mono">
              <span className="font-bold text-white">{p.symbol}</span>
              <span className="text-white/80">{fmt$(p.price)}</span>
              <span className={p.change24h >= 0 ? "text-green-400" : "text-red-400"}>
                {p.change24h >= 0 ? "+" : ""}{p.change24h.toFixed(2)}%
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Top-left: Title + BTC price ──────────────────────────────────────── */}
      <div className="absolute left-4 top-12 z-10 max-w-xs">
        <div className="rounded-lg border border-amber-500/30 bg-black/70 p-4 backdrop-blur-md">
          <h1 className="flex items-center gap-2 text-lg font-bold text-amber-400">
            <span style={{ fontSize: 22 }}>&#8383;</span>
            Crypto &amp; Blockchain Globe
          </h1>
          <p className="mt-1 text-xs text-white/50">Real-time exchange map &amp; market data</p>

          {btcPrice && (
            <div className="mt-3 flex items-center gap-3">
              <div>
                <div className="text-xs text-white/40">BTC</div>
                <div className="text-base font-bold text-white">{fmt$(btcPrice.price)}</div>
                <div className={`text-xs ${btcPrice.change24h >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {btcPrice.change24h >= 0 ? "+" : ""}{btcPrice.change24h.toFixed(2)}%
                </div>
              </div>
              {ethPrice && (
                <div className="border-l border-white/10 pl-3">
                  <div className="text-xs text-white/40">ETH</div>
                  <div className="text-base font-bold text-white">{fmt$(ethPrice.price)}</div>
                  <div className={`text-xs ${ethPrice.change24h >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {ethPrice.change24h >= 0 ? "+" : ""}{ethPrice.change24h.toFixed(2)}%
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-3 text-xs text-white/30">
            Market Cap: <span className="text-amber-400/80">{fmt$(globalStats.totalMarketCap)}</span>
          </div>
        </div>
      </div>

      {/* ── Left sidebar: Filters + Top exchanges ────────────────────────────── */}
      <div className="absolute left-4 top-64 z-10 max-w-xs space-y-3">
        {/* View mode */}
        <div className="rounded-lg border border-amber-500/20 bg-black/70 p-3 backdrop-blur-md">
          <div className="mb-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">View Mode</div>
          <div className="flex gap-1">
            {(["exchanges", "mining", "regulation"] as ViewMode[]).map(m => (
              <button
                key={m}
                onClick={() => { setViewMode(m); setSelectedExchange(null); setSelectedCountry(null) }}
                className={`flex-1 rounded px-2 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === m
                    ? "bg-amber-500 text-black"
                    : "bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                {m === "exchanges" ? "Exchanges" : m === "mining" ? "Mining" : "Regulation"}
              </button>
            ))}
          </div>
        </div>

        {/* Trust filter (exchanges mode only) */}
        {viewMode === "exchanges" && (
          <div className="rounded-lg border border-amber-500/20 bg-black/70 p-3 backdrop-blur-md">
            <div className="mb-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">Trust Score</div>
            <div className="flex gap-1">
              {(["all", "high", "medium", "low"] as TrustFilter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setTrustFilter(f)}
                  className={`flex-1 rounded px-2 py-1.5 text-xs font-medium transition-colors ${
                    trustFilter === f
                      ? "bg-amber-500 text-black"
                      : "bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                >
                  {f === "all" ? "All" : f === "high" ? "8-10" : f === "medium" ? "5-7" : "1-4"}
                </button>
              ))}
            </div>
            <div className="mt-2 text-xs text-white/30">
              {filteredExchanges.length} exchange{filteredExchanges.length !== 1 ? "s" : ""}
            </div>
          </div>
        )}

        {/* Mining legend */}
        {viewMode === "mining" && (
          <div className="rounded-lg border border-amber-500/20 bg-black/70 p-3 backdrop-blur-md">
            <div className="mb-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">Bitcoin Hashrate %</div>
            <div className="space-y-1 max-h-52 overflow-y-auto">
              {MINING_DATA.map(m => (
                <div key={m.country} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ background: m.color }} />
                    <span className="text-white/70">{m.country}</span>
                  </div>
                  <span className="font-mono text-white/50">{m.hashratePct}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Regulation legend */}
        {viewMode === "regulation" && (
          <div className="rounded-lg border border-amber-500/20 bg-black/70 p-3 backdrop-blur-md">
            <div className="mb-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">Regulatory Status</div>
            <div className="space-y-1.5">
              {([
                ["friendly", "#22c55e", "Crypto-Friendly"],
                ["regulated", "#eab308", "Regulated"],
                ["restricted", "#f97316", "Restricted"],
                ["banned", "#ef4444", "Banned"],
              ] as const).map(([key, color, label]) => {
                const count = Object.values(REGULATION).filter(r => r === key).length
                return (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
                      <span className="text-white/70">{label}</span>
                    </div>
                    <span className="font-mono text-white/40">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Top exchanges list (exchanges mode) */}
        {viewMode === "exchanges" && topExchanges.length > 0 && (
          <div className="rounded-lg border border-amber-500/20 bg-black/70 p-3 backdrop-blur-md">
            <div className="mb-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">Top Exchanges (Volume)</div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {topExchanges.map((ex, i) => (
                <button
                  key={ex.id}
                  onClick={() => {
                    setSelectedExchange(ex)
                    if (globeInst.current) {
                      ;(globeInst.current as any).pointOfView({ lat: ex.lat, lng: ex.lng, altitude: 1.8 }, 800)
                    }
                    setIsSpinning(false)
                  }}
                  className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs transition-colors hover:bg-white/5 ${
                    selectedExchange?.id === ex.id ? "bg-amber-500/10" : ""
                  }`}
                >
                  <span className="w-4 text-right font-mono text-white/30">{i + 1}</span>
                  <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: trustColor(ex.trustScore) }} />
                  <span className="flex-1 truncate text-white/80">{ex.name}</span>
                  <span className="font-mono text-white/40">{fmtBtc(ex.volume24hBtc)}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Right sidebar: Market stats ──────────────────────────────────────── */}
      <div className="absolute right-4 top-12 z-10 w-60">
        <div className="rounded-lg border border-amber-500/20 bg-black/70 p-4 backdrop-blur-md">
          <div className="mb-3 text-xs font-semibold text-amber-400 uppercase tracking-wider">Market Overview</div>
          <div className="space-y-3">
            <div>
              <div className="text-xs text-white/40">Total Market Cap</div>
              <div className="text-sm font-bold text-white">{fmt$(globalStats.totalMarketCap)}</div>
            </div>
            <div>
              <div className="text-xs text-white/40">24h Volume</div>
              <div className="text-sm font-bold text-white">{fmt$(globalStats.totalVolume24h)}</div>
            </div>
            <div>
              <div className="text-xs text-white/40">BTC Dominance</div>
              <div className="text-sm font-bold text-white">{globalStats.btcDominance.toFixed(1)}%</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-white/40">Cryptos</div>
                <div className="text-sm font-bold text-white">{globalStats.activeCryptos.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-white/40">Exchanges</div>
                <div className="text-sm font-bold text-white">{globalStats.activeExchanges.toLocaleString()}</div>
              </div>
            </div>
          </div>
          <div className="mt-3 border-t border-white/5 pt-2 text-xs text-white/20">
            Updated {lastRefresh.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* ── Bottom-right: Selected exchange detail ───────────────────────────── */}
      {selectedExchange && viewMode === "exchanges" && (
        <div className="absolute bottom-6 right-4 z-10 w-72">
          <div className="rounded-lg border border-amber-500/30 bg-black/80 p-4 backdrop-blur-md">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-bold text-amber-400">{selectedExchange.name}</div>
                <div className="text-xs text-white/50">{selectedExchange.country}</div>
              </div>
              <button
                onClick={() => setSelectedExchange(null)}
                className="text-xs text-white/30 hover:text-white/60"
              >
                &#10005;
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-white/40">Trust Score</div>
                <div className="font-bold" style={{ color: trustColor(selectedExchange.trustScore) }}>
                  {selectedExchange.trustScore}/10
                </div>
              </div>
              <div>
                <div className="text-white/40">24h Volume</div>
                <div className="font-bold text-white">{fmtBtc(selectedExchange.volume24hBtc)}</div>
              </div>
              <div>
                <div className="text-white/40">Established</div>
                <div className="font-bold text-white">{selectedExchange.yearEstablished ?? "N/A"}</div>
              </div>
              <div>
                <div className="text-white/40">Regulation</div>
                <div className="font-bold" style={{
                  color: REGULATION[selectedExchange.country] === "friendly" ? "#22c55e"
                    : REGULATION[selectedExchange.country] === "regulated" ? "#eab308"
                    : REGULATION[selectedExchange.country] === "restricted" ? "#f97316"
                    : REGULATION[selectedExchange.country] === "banned" ? "#ef4444"
                    : "#fff",
                }}>
                  {REGULATION[selectedExchange.country] ?? "Unknown"}
                </div>
              </div>
            </div>
            {selectedExchange.url && (
              <a
                href={selectedExchange.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-xs text-amber-400/70 hover:text-amber-400 underline"
              >
                Visit Exchange &rarr;
              </a>
            )}
          </div>
        </div>
      )}

      {/* ── Bottom-left: Country stats (when country selected) ───────────────── */}
      {selectedCountry && (
        <div className="absolute bottom-6 left-4 z-10 w-64">
          <div className="rounded-lg border border-amber-500/30 bg-black/80 p-4 backdrop-blur-md">
            <div className="flex items-start justify-between">
              <div className="text-sm font-bold text-amber-400">{selectedCountryName}</div>
              <button
                onClick={() => setSelectedCountry(null)}
                className="text-xs text-white/30 hover:text-white/60"
              >
                &#10005;
              </button>
            </div>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-white/40">Exchanges</span>
                <span className="font-bold text-white">{countryExchanges.length}</span>
              </div>
              {countryTopExchange && (
                <div className="flex justify-between">
                  <span className="text-white/40">Top Exchange</span>
                  <span className="font-bold text-white">{countryTopExchange.name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-white/40">Regulatory Status</span>
                <span className="font-bold" style={{
                  color: countryReg === "friendly" ? "#22c55e"
                    : countryReg === "regulated" ? "#eab308"
                    : countryReg === "restricted" ? "#f97316"
                    : countryReg === "banned" ? "#ef4444"
                    : "#fff",
                }}>
                  {countryReg ?? "Unknown"}
                </span>
              </div>
              {MINING_DATA.find(m => selectedCountryName.includes(m.country)) && (
                <div className="flex justify-between">
                  <span className="text-white/40">BTC Hashrate</span>
                  <span className="font-bold text-blue-400">
                    {MINING_DATA.find(m => selectedCountryName.includes(m.country))!.hashratePct}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Controls ─────────────────────────────────────────────────────────── */}
      <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2">
        <div className="flex items-center gap-2 rounded-full border border-amber-500/20 bg-black/70 px-4 py-2 backdrop-blur-md">
          <button
            onClick={() => setIsSpinning(!isSpinning)}
            className="text-xs text-white/60 hover:text-amber-400 transition-colors"
          >
            {isSpinning ? "Pause" : "Spin"}
          </button>
          <span className="text-white/10">|</span>
          <button
            onClick={() => {
              if (globeInst.current) (globeInst.current as any).pointOfView({ lat: 30, lng: 0, altitude: 2.2 }, 1000)
              setSelectedExchange(null)
              setSelectedCountry(null)
              setIsSpinning(true)
            }}
            className="text-xs text-white/60 hover:text-amber-400 transition-colors"
          >
            Reset
          </button>
          <span className="text-white/10">|</span>
          <span className="text-xs text-white/30">
            {exchanges.length} exchanges &middot; {prices.length} coins
          </span>
        </div>
      </div>

      {/* ── Marquee animation style ──────────────────────────────────────────── */}
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  )
}

"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import Link from "next/link"
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid,
} from "recharts"

// ── Types ──────────────────────────────────────────────────────────────────────

interface ChartPoint {
  t: number
  o: number
  h: number
  l: number
  c: number
  v: number
}

interface MarketHistory {
  symbol: string
  currency: string
  exchange: string
  range: string
  interval: string
  prevClose: number
  lastPrice: number
  change: number
  changePct: number
  points: ChartPoint[]
}

type TimeRange = "1d" | "5d" | "1mo" | "6mo" | "1y" | "5y" | "max"

const TIME_RANGES: { key: TimeRange; label: string }[] = [
  { key: "1d",  label: "1D"  },
  { key: "5d",  label: "5D"  },
  { key: "1mo", label: "1M"  },
  { key: "6mo", label: "6M"  },
  { key: "1y",  label: "1Y"  },
  { key: "5y",  label: "5Y"  },
  { key: "max", label: "MAX" },
]

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

// ── Ticker tape data ────────────────────────────────────────────────────────
const TICKER_ITEMS = [
  { symbol: "^GSPC",   label: "S&P 500",      value: 5780,   change: +0.82 },
  { symbol: "^DJI",    label: "Dow Jones",     value: 43250,  change: +0.55 },
  { symbol: "^IXIC",   label: "NASDAQ",        value: 19310,  change: +1.14 },
  { symbol: "^FTSE",   label: "FTSE 100",      value: 8260,   change: +0.31 },
  { symbol: "^GDAXI",  label: "DAX",           value: 19900,  change: +0.67 },
  { symbol: "^FCHI",   label: "CAC 40",        value: 7480,   change: +0.42 },
  { symbol: "^N225",   label: "Nikkei 225",    value: 39850,  change: -0.44 },
  { symbol: "000001.SS",label:"Shanghai",      value: 3310,   change: +1.12 },
  { symbol: "^HSI",    label: "Hang Seng",     value: 20100,  change: -0.25 },
  { symbol: "^NSEI",   label: "Nifty 50",      value: 23400,  change: +0.65 },
  { symbol: "^BSESN",  label: "Sensex",        value: 77200,  change: +0.71 },
  { symbol: "^AXJO",   label: "ASX 200",       value: 8340,   change: +0.38 },
  { symbol: "^GSPTSE", label: "TSX",           value: 24100,  change: +0.29 },
  { symbol: "^KS11",   label: "KOSPI",         value: 2560,   change: -0.18 },
  { symbol: "^TWII",   label: "TAIEX",         value: 22800,  change: +0.92 },
  { symbol: "^BVSP",   label: "Ibovespa",      value: 134000, change: +0.55 },
  { symbol: "^TASI.SR",label: "TASI",          value: 11900,  change: +0.33 },
  { symbol: "^SSMI",   label: "SMI",           value: 12100,  change: +0.21 },
]

// ── Country currency symbols & centroids ─────────────────────────────────────
// ISO-2 → currency symbol
const CURRENCY_SYMBOLS: Record<string, string> = {
  US: "$", CA: "C$", MX: "$", BR: "R$", AR: "$", CL: "$", CO: "$", PE: "S/",
  GB: "£", DE: "€", FR: "€", IT: "€", ES: "€", NL: "€", BE: "€", AT: "€",
  PT: "€", IE: "€", FI: "€", GR: "€", LU: "€", SK: "€", SI: "€", EE: "€",
  LV: "€", LT: "€", CY: "€", MT: "€", HR: "€",
  CH: "Fr", SE: "kr", NO: "kr", DK: "kr", PL: "zł", CZ: "Kč", HU: "Ft",
  RO: "lei", BG: "лв", RU: "₽", UA: "₴", TR: "₺",
  JP: "¥", CN: "¥", KR: "₩", IN: "₹", ID: "Rp", TH: "฿", VN: "₫",
  PH: "₱", MY: "RM", SG: "S$", TW: "NT$", HK: "HK$", BD: "৳", PK: "₨",
  LK: "Rs", NP: "Rs", MM: "K", KH: "៛", LA: "₭",
  AU: "A$", NZ: "NZ$",
  SA: "﷼", AE: "د.إ", IL: "₪", EG: "£", QA: "﷼", KW: "د.ك", BH: "BD",
  OM: "﷼", JO: "JD", LB: "LL", IQ: "ع.د", IR: "﷼",
  ZA: "R", NG: "₦", KE: "KSh", GH: "₵", TZ: "TSh", ET: "Br",
  MA: "MAD", TN: "DT", DZ: "د.ج",
}

// ISO-2 → approximate centroid [lat, lng]
const COUNTRY_CENTROIDS: Record<string, [number, number]> = {
  US: [39.8, -98.6], CA: [56.1, -106.3], MX: [23.6, -102.6], BR: [-14.2, -51.9],
  AR: [-38.4, -63.6], CL: [-35.7, -71.5], CO: [4.6, -74.3], PE: [-9.2, -75.0],
  VE: [6.4, -66.6], EC: [-1.8, -78.2], BO: [-16.3, -63.6], PY: [-23.4, -58.4],
  UY: [-32.5, -55.8],
  GB: [55.4, -3.4], DE: [51.2, 10.5], FR: [46.2, 2.2], IT: [41.9, 12.6],
  ES: [40.5, -3.7], NL: [52.1, 5.3], BE: [50.5, 4.5], AT: [47.5, 14.6],
  PT: [39.4, -8.2], IE: [53.1, -8.0], FI: [61.9, 25.7], GR: [39.1, 21.8],
  CH: [46.8, 8.2], SE: [60.1, 18.6], NO: [60.5, 8.5], DK: [56.3, 9.5],
  PL: [51.9, 19.1], CZ: [49.8, 15.5], HU: [47.2, 19.5], RO: [45.9, 25.0],
  BG: [42.7, 25.5], RU: [61.5, 105.3], UA: [48.4, 31.2], TR: [39.0, 35.2],
  JP: [36.2, 138.3], CN: [35.9, 104.2], KR: [35.9, 127.8], IN: [20.6, 79.0],
  ID: [-0.8, 113.9], TH: [15.9, 101.0], VN: [14.1, 108.3], PH: [12.9, 121.8],
  MY: [4.2, 101.9], SG: [1.4, 103.8], TW: [23.7, 121.0], HK: [22.4, 114.1],
  BD: [23.7, 90.4], PK: [30.4, 69.3], LK: [7.9, 80.8], NP: [28.4, 84.1],
  MM: [21.9, 96.0], KH: [12.6, 105.0], LA: [19.9, 102.5],
  AU: [-25.3, 133.8], NZ: [-40.9, 174.9],
  SA: [23.9, 45.1], AE: [23.4, 53.8], IL: [31.0, 34.9], EG: [26.8, 30.8],
  QA: [25.4, 51.2], KW: [29.3, 47.5], IQ: [33.2, 43.7], IR: [32.4, 53.7],
  JO: [30.6, 36.2], LB: [33.9, 35.9],
  ZA: [-30.6, 22.9], NG: [9.1, 8.7], KE: [-0.0, 37.9], GH: [7.9, -1.0],
  TZ: [-6.4, 34.9], ET: [9.1, 40.5], MA: [31.8, -7.1], TN: [34.0, 9.5],
  DZ: [28.0, 1.7],
}

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

  // Chart state
  const [chartData,    setChartData]    = useState<MarketHistory | null>(null)
  const [chartRange,   setChartRange]   = useState<TimeRange>("1y")
  const [chartLoading, setChartLoading] = useState(false)
  const [chartError,   setChartError]   = useState("")

  // Collapsible sidebar panels (collapsed by default for mobile)
  const [fxOpen,       setFxOpen]       = useState(false)
  const [indicesOpen,  setIndicesOpen]  = useState(false)
  const [gdpOpen,      setGdpOpen]      = useState(false)

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

  // ── Fetch chart data when exchange or range changes ────────────────────────
  useEffect(() => {
    if (!selectedExch) { setChartData(null); return }
    let cancelled = false
    setChartLoading(true)
    setChartError("")
    fetch(`/api/market-history?exchange=${selectedExch.id}&range=${chartRange}`)
      .then(r => {
        if (!r.ok) throw new Error(`API ${r.status}`)
        return r.json()
      })
      .then((json: MarketHistory) => {
        if (!cancelled) { setChartData(json); setChartLoading(false) }
      })
      .catch(err => {
        if (!cancelled) { setChartError(err?.message ?? "Failed"); setChartLoading(false) }
      })
    return () => { cancelled = true }
  }, [selectedExch, chartRange])

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
          const iso2  = (props.ISO_A2 ?? props.ISO_A2_EH ?? props.iso_a2 ?? "").toUpperCase()
          const iso3  = (props.ISO_A3 ?? props.ISO_A3_EH ?? props.iso_a3 ?? props.ADM0_A3 ?? props.ADM0_ISO ?? props.SOV_A3 ?? "").toUpperCase()
          const entry = gdpMapLocal.get(iso2) || gdpMapLocal.get(iso3)
          return entry ? gdpToColor(entry.gdpUsd, localMaxGdp) : "#1a1a1a"
        })
        .polygonSideColor(() => "rgba(50,40,0,0.35)")
        .polygonStrokeColor(() => "rgba(255,200,50,0.6)")
        .polygonLabel((feat: any) => {
          const props = feat?.properties ?? {}
          const iso2  = (props.ISO_A2 ?? props.ISO_A2_EH ?? props.iso_a2 ?? "").toUpperCase()
          const iso3  = (props.ISO_A3 ?? props.ISO_A3_EH ?? props.iso_a3 ?? props.ADM0_A3 ?? props.ADM0_ISO ?? props.SOV_A3 ?? "").toUpperCase()
          const entry = gdpMapLocal.get(iso2) || gdpMapLocal.get(iso3)
          const name  = props.ADMIN ?? props.NAME ?? props.NAME_LONG ?? props.name ?? "Unknown"
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
          const iso2  = (props.ISO_A2 ?? props.ISO_A2_EH ?? props.iso_a2 ?? "").toUpperCase()
          const iso3  = (props.ISO_A3 ?? props.ISO_A3_EH ?? props.iso_a3 ?? props.ADM0_A3 ?? props.ADM0_ISO ?? props.SOV_A3 ?? "").toUpperCase()
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

      // ── Currency symbol labels on each country ─────────────────────────────
      const currencyLabels = Object.entries(COUNTRY_CENTROIDS)
        .filter(([iso2]) => CURRENCY_SYMBOLS[iso2])
        .map(([iso2, [lat, lng]]) => ({
          lat, lng,
          text: CURRENCY_SYMBOLS[iso2],
          iso2,
          size: 0.6,
          color: "rgba(255,220,100,0.85)",
        }))

      globe
        .labelsData(currencyLabels)
        .labelLat("lat")
        .labelLng("lng")
        .labelText("text")
        .labelSize("size")
        .labelDotRadius(0)
        .labelColor("color")
        .labelAltitude(0.008)
        .labelResolution(3)
        .labelTypeFace(undefined as any) // use default
        .labelLabel((d: any) => {
          const entry = gdpMapLocal.get(d.iso2)
          const name = entry?.country ?? d.iso2
          return `<div style="font-family:sans-serif;padding:4px 8px;background:rgba(0,0,0,0.85);border-radius:6px;color:#ffdd88;font-size:11px;border:1px solid rgba(255,200,50,0.3);">
            <b style="color:#ffcc00">${d.text}</b> ${name}${entry ? ` · GDP: ${fmtGdp(entry.gdpUsd)}` : ""}
          </div>`
        })

      // Fetch Natural Earth GeoJSON with ISO properties for proper country matching
      fetch("//raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson")
        .then(r => r.json())
        .then((geoJson: any) => {
          try {
            globe.polygonsData(geoJson.features)
          } catch {
            // choropleth unavailable
          }
        })
        .catch(() => {
          // Fallback: try world-atlas TopoJSON
          fetch("//unpkg.com/world-atlas@2.0.2/countries-110m.json")
            .then(r => r.json())
            .then(world => {
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
        })

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
      <div className="uc21-sidebar absolute top-4 left-4 bottom-4 flex flex-col gap-2 pointer-events-none"
        style={{ width: "clamp(200px, 22vw, 288px)", maxHeight: "calc(100vh - 96px)", overflowY: "auto", overflowX: "hidden" }}>

        {/* Title */}
        <div className="rounded-xl p-3 pointer-events-auto"
          style={{ background: "rgba(0,0,0,0.78)", border: "1px solid rgba(255,200,50,0.2)", backdropFilter: "blur(14px)" }}>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-bold" style={{ color: "#ffcc00" }}>Financial Globe</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
              style={{ background: "rgba(255,200,0,0.15)", color: "#ffcc00", border: "1px solid rgba(255,200,0,0.3)" }}>
              LIVE
            </span>
          </div>
          <p className="text-xs" style={{ color: "var(--muted)" }}>GDP · Markets · Capital Flows</p>
        </div>

        {/* View toggle */}
        <div className="rounded-xl p-2.5 pointer-events-auto"
          style={{ background: "rgba(0,0,0,0.78)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(14px)" }}>
          <p className="text-xs font-semibold tracking-wider mb-1.5" style={{ color: "var(--muted)" }}>VIEW</p>
          <div className="flex flex-col gap-1">
            {([
              { id: "gdp"       as ViewMode, label: "GDP Choropleth",  icon: "🌍" },
              { id: "exchanges" as ViewMode, label: "Stock Exchanges",  icon: "📈" },
              { id: "flows"     as ViewMode, label: "Capital Flows",    icon: "⚡" },
            ]).map(v => (
              <button key={v.id} onClick={() => setViewMode(v.id)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-left transition-all"
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

        {/* FX Rates - Collapsible */}
        <div className="rounded-xl pointer-events-auto"
          style={{ background: "rgba(0,0,0,0.78)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(14px)" }}>
          <button onClick={() => setFxOpen(o => !o)}
            className="flex items-center justify-between w-full px-3 py-2.5 text-left"
            style={{ color: "var(--muted)" }}>
            <span className="text-xs font-semibold tracking-wider flex items-center gap-2">
              FX RATES
              <span className="text-xs font-normal" style={{ color: "rgba(255,200,0,0.5)" }}>
                {data?.fx?.date ?? ""}
              </span>
            </span>
            <span className="text-xs transition-transform" style={{ transform: fxOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
              ▼
            </span>
          </button>
          {fxOpen && (
            <div className="flex flex-col gap-1 px-3 pb-2.5">
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
          )}
        </div>

        {/* Stock Indices - Collapsible */}
        <div className="rounded-xl pointer-events-auto"
          style={{ background: "rgba(0,0,0,0.78)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(14px)" }}>
          <button onClick={() => setIndicesOpen(o => !o)}
            className="flex items-center justify-between w-full px-3 py-2.5 text-left"
            style={{ color: "var(--muted)" }}>
            <span className="text-xs font-semibold tracking-wider">
              INDICES
              <span className="ml-1.5 text-xs font-normal opacity-50">(indicative)</span>
            </span>
            <span className="text-xs transition-transform" style={{ transform: indicesOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
              ▼
            </span>
          </button>
          {indicesOpen && (
            <div className="flex flex-col gap-1 px-3 pb-2.5">
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
          )}
        </div>

        {/* GDP Legend - Collapsible */}
        <div className="rounded-xl pointer-events-auto"
          style={{ background: "rgba(0,0,0,0.78)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(14px)" }}>
          <button onClick={() => setGdpOpen(o => !o)}
            className="flex items-center justify-between w-full px-3 py-2.5 text-left"
            style={{ color: "var(--muted)" }}>
            <span className="text-xs font-semibold tracking-wider">GDP SCALE</span>
            <span className="text-xs transition-transform" style={{ transform: gdpOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
              ▼
            </span>
          </button>
          {gdpOpen && (
            <div className="px-3 pb-2.5">
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
          )}
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

      {/* ── Selected exchange panel with chart ────────────────────────────────── */}
      {selectedExch && (
        <div className="absolute bottom-4 right-4 pointer-events-auto"
          style={{ width: "420px", maxWidth: "calc(100vw - 320px)" }}>
          <div className="rounded-xl overflow-hidden"
            style={{ background: "rgba(0,0,0,0.92)", border: `1px solid ${selectedExch.color}44`, backdropFilter: "blur(14px)" }}>

            {/* Header */}
            <div className="flex items-start justify-between p-4 pb-2">
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold" style={{ color: selectedExch.color }}>
                    {selectedExch.id}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: `${selectedExch.color}22`, color: selectedExch.color, border: `1px solid ${selectedExch.color}44` }}>
                    {selectedExch.indexName}
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  {selectedExch.name} · {selectedExch.city}, {selectedExch.country}
                </p>
              </div>
              <button onClick={() => { setSelectedExch(null); setChartData(null); setChartRange("1y") }}
                className="opacity-40 hover:opacity-80 text-lg flex-shrink-0 leading-none"
                style={{ color: "var(--muted)" }}>✕</button>
            </div>

            {/* Price & Change */}
            <div className="px-4 pb-2">
              {chartData ? (
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-bold tabular-nums" style={{ color: "var(--text)" }}>
                    {chartData.lastPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-sm font-semibold tabular-nums"
                    style={{ color: chartData.changePct >= 0 ? "#44ff88" : "#ff5555" }}>
                    {chartData.changePct >= 0 ? "▲" : "▼"} {Math.abs(chartData.change).toFixed(2)} ({Math.abs(chartData.changePct).toFixed(2)}%)
                  </span>
                  <span className="text-xs" style={{ color: "var(--muted)" }}>{chartData.currency}</span>
                </div>
              ) : (
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-bold tabular-nums" style={{ color: "var(--text)" }}>
                    {fmtIndex(selectedExch.indexValue)}
                  </span>
                  <span className="text-xs" style={{ color: "var(--muted)" }}>indicative</span>
                </div>
              )}
            </div>

            {/* Time Range Tabs */}
            <div className="flex gap-1 px-4 pb-2">
              {TIME_RANGES.map(r => (
                <button key={r.key} onClick={() => setChartRange(r.key)}
                  className="px-2.5 py-1 rounded-md text-xs font-semibold transition-all"
                  style={{
                    background: chartRange === r.key ? `${selectedExch.color}22` : "transparent",
                    border:     chartRange === r.key ? `1px solid ${selectedExch.color}55` : "1px solid transparent",
                    color:      chartRange === r.key ? selectedExch.color : "var(--muted)",
                  }}>
                  {r.label}
                </button>
              ))}
            </div>

            {/* Chart Area */}
            <div className="px-2 pb-1" style={{ height: 180 }}>
              {chartLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-6 h-6 rounded-full border-2 border-transparent animate-spin"
                    style={{ borderTopColor: selectedExch.color }} />
                </div>
              ) : chartError ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs" style={{ color: "var(--muted)" }}>Chart unavailable</p>
                </div>
              ) : chartData && chartData.points.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData.points} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={chartData.changePct >= 0 ? "#44ff88" : "#ff5555"} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={chartData.changePct >= 0 ? "#44ff88" : "#ff5555"} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                      dataKey="t"
                      tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                      axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                      tickLine={false}
                      tickFormatter={(ts: number) => {
                        const d = new Date(ts * 1000)
                        if (chartRange === "1d") return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                        if (chartRange === "5d") return d.toLocaleDateString("en-US", { weekday: "short" })
                        if (chartRange === "1mo") return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                        if (chartRange === "max" || chartRange === "5y") return d.getFullYear().toString()
                        return d.toLocaleDateString("en-US", { month: "short" })
                      }}
                      minTickGap={30}
                    />
                    <YAxis
                      domain={["auto", "auto"]}
                      tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      width={48}
                      tickFormatter={(v: number) => v >= 10000 ? `${(v / 1000).toFixed(0)}k` : v.toFixed(0)}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(0,0,0,0.9)",
                        border: `1px solid ${selectedExch.color}44`,
                        borderRadius: 8,
                        fontSize: 11,
                        color: "#fff",
                      }}
                      labelFormatter={(ts) => new Date(Number(ts) * 1000).toLocaleString()}
                      formatter={(val) => [Number(val).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), "Close"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="c"
                      stroke={chartData.changePct >= 0 ? "#44ff88" : "#ff5555"}
                      strokeWidth={1.5}
                      fill="url(#chartGrad)"
                      dot={false}
                      animationDuration={500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs" style={{ color: "var(--muted)" }}>Select a timeframe</p>
                </div>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-1.5 px-4 pb-4 pt-1">
              {[
                { label: "Market Cap",  val: `$${selectedExch.marketCapUsdT.toFixed(1)}T` },
                { label: "Prev Close",  val: chartData ? chartData.prevClose.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "—" },
                { label: "Index",       val: selectedExch.indexName },
                ...(chartData?.points.length ? [
                  { label: "High",      val: Math.max(...chartData.points.map(p => p.h)).toLocaleString("en-US", { maximumFractionDigits: 2 }) },
                  { label: "Low",       val: Math.min(...chartData.points.map(p => p.l)).toLocaleString("en-US", { maximumFractionDigits: 2 }) },
                  { label: "Volume",    val: (() => { const v = chartData.points[chartData.points.length - 1]?.v ?? 0; return v >= 1e9 ? `${(v/1e9).toFixed(1)}B` : v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v.toLocaleString() })() },
                ] : []),
              ].map(m => (
                <div key={m.label} className="rounded-lg px-2 py-1.5"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{m.label}</p>
                  <p className="text-xs font-semibold truncate" style={{ color: "var(--text)" }}>{m.val}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Scrolling Ticker Tape ────────────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none overflow-hidden"
        style={{ height: 32, background: "rgba(0,0,0,0.85)", borderTop: "1px solid rgba(255,200,50,0.15)" }}>
        <div className="flex items-center h-full animate-[tickerScroll_60s_linear_infinite] whitespace-nowrap"
          style={{ width: "max-content" }}>
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => (
            <span key={`${t.symbol}-${i}`} className="inline-flex items-center gap-1.5 px-4 text-xs font-mono">
              <span className="font-semibold" style={{ color: "#ffcc00" }}>{t.label}</span>
              <span style={{ color: "var(--text)" }}>{t.value.toLocaleString()}</span>
              <span style={{ color: t.change >= 0 ? "#44ff88" : "#ff5555", fontSize: 10 }}>
                {t.change >= 0 ? "▲" : "▼"}{Math.abs(t.change).toFixed(2)}%
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Ticker animation keyframes + mobile sidebar */}
      <style>{`
        @keyframes tickerScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        /* Hide scrollbar on sidebar */
        .uc21-sidebar::-webkit-scrollbar { display: none; }
        .uc21-sidebar { -ms-overflow-style: none; scrollbar-width: none; }
        /* Mobile: shrink sidebar so globe is visible */
        @media (max-width: 640px) {
          .uc21-sidebar {
            width: 180px !important;
            left: 8px !important;
            top: 8px !important;
            gap: 4px !important;
            max-height: calc(100vh - 80px) !important;
          }
        }
      `}</style>
    </div>
  )
}

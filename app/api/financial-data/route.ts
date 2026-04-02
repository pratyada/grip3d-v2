// Financial data aggregator for UC21 — Stock Market & Financial Globe
// GDP: World Bank API (free, no auth)
// FX: Frankfurter API (free, no auth)
// Exchanges & flows: static curated data

export const revalidate = 3600 // 1 hour

// ── Types ──────────────────────────────────────────────────────────────────────

export interface GdpEntry {
  iso2: string
  iso3: string
  country: string
  gdpUsd: number
  year: number
}

export interface FxRates {
  base: string
  date: string
  rates: Record<string, number>
}

export interface StockExchange {
  id: string
  name: string
  city: string
  country: string
  iso2: string
  lat: number
  lng: number
  indexName: string
  indexValue: number    // indicative / cached value
  marketCapUsdT: number // market cap in trillions USD (indicative)
  color: string
}

export interface CapitalFlow {
  label: string
  srcLat: number
  srcLng: number
  dstLat: number
  dstLng: number
  valueBn: number  // estimated annual flow in USD billions
  color: string
}

export interface FinancialData {
  gdp: GdpEntry[]
  fx: FxRates
  exchanges: StockExchange[]
  flows: CapitalFlow[]
  fetchedAt: string
}

// ── Static: Stock Exchanges ────────────────────────────────────────────────────
// Market cap figures are indicative / end-2024 estimates
const EXCHANGES: StockExchange[] = [
  {
    id: "NYSE",
    name: "New York Stock Exchange",
    city: "New York",
    country: "United States",
    iso2: "US",
    lat: 40.706,
    lng: -74.009,
    indexName: "NYSE Composite",
    indexValue: 18_850,
    marketCapUsdT: 27.7,
    color: "#ffcc00",
  },
  {
    id: "NASDAQ",
    name: "NASDAQ",
    city: "New York",
    country: "United States",
    iso2: "US",
    lat: 40.757,
    lng: -73.989,
    indexName: "NASDAQ Composite",
    indexValue: 19_310,
    marketCapUsdT: 25.1,
    color: "#ffaa00",
  },
  {
    id: "LSE",
    name: "London Stock Exchange",
    city: "London",
    country: "United Kingdom",
    iso2: "GB",
    lat: 51.514,
    lng: -0.098,
    indexName: "FTSE 100",
    indexValue: 8_260,
    marketCapUsdT: 3.8,
    color: "#44ccff",
  },
  {
    id: "EURONEXT",
    name: "Euronext Paris",
    city: "Paris",
    country: "France",
    iso2: "FR",
    lat: 48.878,
    lng: 2.334,
    indexName: "CAC 40",
    indexValue: 7_480,
    marketCapUsdT: 4.5,
    color: "#4488ff",
  },
  {
    id: "XETRA",
    name: "Frankfurt Stock Exchange (Xetra)",
    city: "Frankfurt",
    country: "Germany",
    iso2: "DE",
    lat: 50.115,
    lng: 8.682,
    indexName: "DAX",
    indexValue: 19_900,
    marketCapUsdT: 2.3,
    color: "#66aaff",
  },
  {
    id: "TSE",
    name: "Tokyo Stock Exchange",
    city: "Tokyo",
    country: "Japan",
    iso2: "JP",
    lat: 35.681,
    lng: 139.769,
    indexName: "Nikkei 225",
    indexValue: 39_850,
    marketCapUsdT: 6.5,
    color: "#ff6699",
  },
  {
    id: "SSE",
    name: "Shanghai Stock Exchange",
    city: "Shanghai",
    country: "China",
    iso2: "CN",
    lat: 31.233,
    lng: 121.473,
    indexName: "Shanghai Composite",
    indexValue: 3_310,
    marketCapUsdT: 7.4,
    color: "#ff4444",
  },
  {
    id: "HKEX",
    name: "Hong Kong Stock Exchange",
    city: "Hong Kong",
    country: "China (SAR)",
    iso2: "HK",
    lat: 22.278,
    lng: 114.166,
    indexName: "Hang Seng",
    indexValue: 20_100,
    marketCapUsdT: 4.2,
    color: "#ff8844",
  },
  {
    id: "NSE",
    name: "National Stock Exchange of India",
    city: "Mumbai",
    country: "India",
    iso2: "IN",
    lat: 19.074,
    lng: 72.878,
    indexName: "Nifty 50",
    indexValue: 23_400,
    marketCapUsdT: 3.4,
    color: "#ff9900",
  },
  {
    id: "ASX",
    name: "Australian Securities Exchange",
    city: "Sydney",
    country: "Australia",
    iso2: "AU",
    lat: -33.868,
    lng: 151.207,
    indexName: "ASX 200",
    indexValue: 8_340,
    marketCapUsdT: 1.8,
    color: "#44ffaa",
  },
  {
    id: "TSX",
    name: "Toronto Stock Exchange",
    city: "Toronto",
    country: "Canada",
    iso2: "CA",
    lat: 43.644,
    lng: -79.388,
    indexName: "S&P/TSX Composite",
    indexValue: 24_100,
    marketCapUsdT: 2.9,
    color: "#ff5533",
  },
  {
    id: "DFM",
    name: "Dubai Financial Market",
    city: "Dubai",
    country: "United Arab Emirates",
    iso2: "AE",
    lat: 25.204,
    lng: 55.296,
    indexName: "DFM General Index",
    indexValue: 4_750,
    marketCapUsdT: 0.6,
    color: "#ffdd44",
  },
]

// ── Static: Capital Flows ──────────────────────────────────────────────────────
// Values are indicative annual cross-border portfolio flows (USD billions)
const FLOWS: CapitalFlow[] = [
  {
    label: "USA → UK",
    srcLat: 40.706, srcLng: -74.009,
    dstLat: 51.514, dstLng: -0.098,
    valueBn: 620,
    color: "#ffcc00",
  },
  {
    label: "USA → Japan",
    srcLat: 40.706, srcLng: -74.009,
    dstLat: 35.681, dstLng: 139.769,
    valueBn: 480,
    color: "#ffcc00",
  },
  {
    label: "USA → Germany",
    srcLat: 40.706, srcLng: -74.009,
    dstLat: 50.115, dstLng: 8.682,
    valueBn: 390,
    color: "#ffcc00",
  },
  {
    label: "UK → USA",
    srcLat: 51.514, srcLng: -0.098,
    dstLat: 40.706, dstLng: -74.009,
    valueBn: 540,
    color: "#44ccff",
  },
  {
    label: "China → USA",
    srcLat: 31.233, srcLng: 121.473,
    dstLat: 40.706, dstLng: -74.009,
    valueBn: 320,
    color: "#ff4444",
  },
  {
    label: "China → Hong Kong",
    srcLat: 31.233, srcLng: 121.473,
    dstLat: 22.278, dstLng: 114.166,
    valueBn: 890,
    color: "#ff4444",
  },
  {
    label: "Japan → USA",
    srcLat: 35.681, srcLng: 139.769,
    dstLat: 40.706, dstLng: -74.009,
    valueBn: 410,
    color: "#ff6699",
  },
  {
    label: "Germany → France",
    srcLat: 50.115, srcLng: 8.682,
    dstLat: 48.878, dstLng: 2.334,
    valueBn: 260,
    color: "#66aaff",
  },
  {
    label: "USA → Canada",
    srcLat: 40.706, srcLng: -74.009,
    dstLat: 43.644, dstLng: -79.388,
    valueBn: 350,
    color: "#ffcc00",
  },
  {
    label: "Australia → China",
    srcLat: -33.868, srcLng: 151.207,
    dstLat: 31.233, dstLng: 121.473,
    valueBn: 180,
    color: "#44ffaa",
  },
  {
    label: "India → USA",
    srcLat: 19.074, srcLng: 72.878,
    dstLat: 40.706, dstLng: -74.009,
    valueBn: 210,
    color: "#ff9900",
  },
  {
    label: "UAE → India",
    srcLat: 25.204, srcLng: 55.296,
    dstLat: 19.074, dstLng: 72.878,
    valueBn: 150,
    color: "#ffdd44",
  },
]

// ── World Bank GDP parser ──────────────────────────────────────────────────────
function parseWorldBankGdp(raw: any): GdpEntry[] {
  // World Bank returns [metadata, [records]]
  if (!Array.isArray(raw) || raw.length < 2) return []
  const records: any[] = raw[1] ?? []
  const entries: GdpEntry[] = []
  for (const r of records) {
    if (!r || r.value == null) continue
    const gdpUsd = Number(r.value)
    if (!isFinite(gdpUsd) || gdpUsd <= 0) continue
    entries.push({
      iso2: r.country?.id ?? "",
      iso3: r.countryiso3code ?? "",
      country: r.country?.value ?? "",
      gdpUsd,
      year: Number(r.date) || 0,
    })
  }
  return entries
}

// ── Route handler ──────────────────────────────────────────────────────────────
export async function GET() {
  const fetchedAt = new Date().toISOString()

  // Fetch in parallel — GDP and FX
  const [gdpRes, fxRes] = await Promise.allSettled([
    fetch(
      "https://api.worldbank.org/v2/country/all/indicator/NY.GDP.MKTP.CD?format=json&per_page=300&mrv=1",
      {
        next: { revalidate: 3600 },
        headers: { "User-Agent": "GRIP3D/1.0 contact@grip3d.com" },
      }
    ),
    fetch(
      "https://api.frankfurter.dev/v2/rates?base=USD",
      {
        next: { revalidate: 3600 },
        headers: { "User-Agent": "GRIP3D/1.0 contact@grip3d.com" },
      }
    ),
  ])

  // ── GDP ──────────────────────────────────────────────────────────────────────
  let gdp: GdpEntry[] = []
  if (gdpRes.status === "fulfilled" && gdpRes.value.ok) {
    try {
      const raw = await gdpRes.value.json()
      gdp = parseWorldBankGdp(raw)
    } catch {
      // fall through — empty gdp array
    }
  }

  // ── FX ───────────────────────────────────────────────────────────────────────
  let fx: FxRates = { base: "USD", date: fetchedAt.slice(0, 10), rates: {} }
  if (fxRes.status === "fulfilled" && fxRes.value.ok) {
    try {
      const raw = await fxRes.value.json()
      // Frankfurter /v2/rates returns { base, date, rates: {...} }
      fx = {
        base: raw.base ?? "USD",
        date: raw.date ?? fetchedAt.slice(0, 10),
        rates: raw.rates ?? {},
      }
    } catch {
      // fall through — empty rates
    }
  }

  const payload: FinancialData = {
    gdp,
    fx,
    exchanges: EXCHANGES,
    flows: FLOWS,
    fetchedAt,
  }

  return new Response(JSON.stringify(payload), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=7200",
    },
  })
}

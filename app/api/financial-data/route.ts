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
    color: "#00e5ff",
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
    color: "#7c4dff",
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
  {
    id: "BSE",
    name: "Bombay Stock Exchange",
    city: "Mumbai",
    country: "India",
    iso2: "IN",
    lat: 18.931,
    lng: 72.833,
    indexName: "Sensex",
    indexValue: 77_200,
    marketCapUsdT: 4.2,
    color: "#ff7722",
  },
  {
    id: "SZSE",
    name: "Shenzhen Stock Exchange",
    city: "Shenzhen",
    country: "China",
    iso2: "CN",
    lat: 22.543,
    lng: 114.058,
    indexName: "SZSE Component",
    indexValue: 10_350,
    marketCapUsdT: 4.7,
    color: "#ff5555",
  },
  {
    id: "KRX",
    name: "Korea Exchange",
    city: "Seoul",
    country: "South Korea",
    iso2: "KR",
    lat: 37.566,
    lng: 126.978,
    indexName: "KOSPI",
    indexValue: 2_560,
    marketCapUsdT: 1.8,
    color: "#44ddff",
  },
  {
    id: "TWSE",
    name: "Taiwan Stock Exchange",
    city: "Taipei",
    country: "Taiwan",
    iso2: "TW",
    lat: 25.033,
    lng: 121.565,
    indexName: "TAIEX",
    indexValue: 22_800,
    marketCapUsdT: 2.1,
    color: "#66ccff",
  },
  {
    id: "SIX",
    name: "SIX Swiss Exchange",
    city: "Zürich",
    country: "Switzerland",
    iso2: "CH",
    lat: 47.369,
    lng: 8.539,
    indexName: "SMI",
    indexValue: 12_100,
    marketCapUsdT: 1.9,
    color: "#88aaff",
  },
  {
    id: "JSE",
    name: "Johannesburg Stock Exchange",
    city: "Johannesburg",
    country: "South Africa",
    iso2: "ZA",
    lat: -26.205,
    lng: 28.049,
    indexName: "JSE Top 40",
    indexValue: 75_800,
    marketCapUsdT: 1.1,
    color: "#44ff88",
  },
  {
    id: "B3",
    name: "B3 — Brasil Bolsa Balcão",
    city: "São Paulo",
    country: "Brazil",
    iso2: "BR",
    lat: -23.550,
    lng: -46.634,
    indexName: "Ibovespa",
    indexValue: 134_000,
    marketCapUsdT: 0.9,
    color: "#33dd66",
  },
  {
    id: "BMV",
    name: "Bolsa Mexicana de Valores",
    city: "Mexico City",
    country: "Mexico",
    iso2: "MX",
    lat: 19.432,
    lng: -99.133,
    indexName: "IPC",
    indexValue: 55_200,
    marketCapUsdT: 0.5,
    color: "#44cc44",
  },
  {
    id: "SGX",
    name: "Singapore Exchange",
    city: "Singapore",
    country: "Singapore",
    iso2: "SG",
    lat: 1.280,
    lng: 103.851,
    indexName: "STI",
    indexValue: 3_400,
    marketCapUsdT: 0.7,
    color: "#ff88cc",
  },
  {
    id: "TADAWUL",
    name: "Saudi Exchange (Tadawul)",
    city: "Riyadh",
    country: "Saudi Arabia",
    iso2: "SA",
    lat: 24.713,
    lng: 46.675,
    indexName: "TASI",
    indexValue: 11_900,
    marketCapUsdT: 2.8,
    color: "#44ee88",
  },
  {
    id: "IDX",
    name: "Indonesia Stock Exchange",
    city: "Jakarta",
    country: "Indonesia",
    iso2: "ID",
    lat: -6.175,
    lng: 106.827,
    indexName: "IDX Composite",
    indexValue: 7_200,
    marketCapUsdT: 0.6,
    color: "#ff6644",
  },
  {
    id: "SET",
    name: "Stock Exchange of Thailand",
    city: "Bangkok",
    country: "Thailand",
    iso2: "TH",
    lat: 13.756,
    lng: 100.502,
    indexName: "SET Index",
    indexValue: 1_420,
    marketCapUsdT: 0.5,
    color: "#dd88ff",
  },
  {
    id: "BIST",
    name: "Borsa Istanbul",
    city: "Istanbul",
    country: "Turkey",
    iso2: "TR",
    lat: 41.008,
    lng: 28.978,
    indexName: "BIST 100",
    indexValue: 9_800,
    marketCapUsdT: 0.3,
    color: "#ff4488",
  },
  {
    id: "NGX",
    name: "Nigerian Exchange Group",
    city: "Lagos",
    country: "Nigeria",
    iso2: "NG",
    lat: 6.524,
    lng: 3.379,
    indexName: "NGX ASI",
    indexValue: 98_500,
    marketCapUsdT: 0.06,
    color: "#66ff66",
  },
  {
    id: "EGX",
    name: "Egyptian Exchange",
    city: "Cairo",
    country: "Egypt",
    iso2: "EG",
    lat: 30.044,
    lng: 31.236,
    indexName: "EGX 30",
    indexValue: 28_400,
    marketCapUsdT: 0.04,
    color: "#ffaa66",
  },
  {
    id: "NZX",
    name: "New Zealand Exchange",
    city: "Wellington",
    country: "New Zealand",
    iso2: "NZ",
    lat: -41.287,
    lng: 174.776,
    indexName: "NZX 50",
    indexValue: 12_300,
    marketCapUsdT: 0.1,
    color: "#55ccaa",
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
  {
    label: "India → UK",
    srcLat: 19.074, srcLng: 72.878,
    dstLat: 51.514, dstLng: -0.098,
    valueBn: 130,
    color: "#ff9900",
  },
  {
    label: "China → Japan",
    srcLat: 31.233, srcLng: 121.473,
    dstLat: 35.681, dstLng: 139.769,
    valueBn: 280,
    color: "#ff4444",
  },
  {
    label: "Japan → UK",
    srcLat: 35.681, srcLng: 139.769,
    dstLat: 51.514, dstLng: -0.098,
    valueBn: 190,
    color: "#ff6699",
  },
  {
    label: "USA → China",
    srcLat: 40.706, srcLng: -74.009,
    dstLat: 31.233, dstLng: 121.473,
    valueBn: 310,
    color: "#ffcc00",
  },
  {
    label: "Saudi Arabia → USA",
    srcLat: 24.713, srcLng: 46.675,
    dstLat: 40.706, dstLng: -74.009,
    valueBn: 220,
    color: "#44ee88",
  },
  {
    label: "Singapore → China",
    srcLat: 1.280, srcLng: 103.851,
    dstLat: 31.233, dstLng: 121.473,
    valueBn: 160,
    color: "#ff88cc",
  },
  {
    label: "UK → France",
    srcLat: 51.514, srcLng: -0.098,
    dstLat: 48.878, dstLng: 2.334,
    valueBn: 240,
    color: "#44ccff",
  },
  {
    label: "Brazil → USA",
    srcLat: -23.550, srcLng: -46.634,
    dstLat: 40.706, dstLng: -74.009,
    valueBn: 140,
    color: "#33dd66",
  },
  {
    label: "South Korea → USA",
    srcLat: 37.566, srcLng: 126.978,
    dstLat: 40.706, dstLng: -74.009,
    valueBn: 170,
    color: "#44ddff",
  },
  {
    label: "Taiwan → China",
    srcLat: 25.033, srcLng: 121.565,
    dstLat: 31.233, dstLng: 121.473,
    valueBn: 195,
    color: "#66ccff",
  },
  {
    label: "South Africa → UK",
    srcLat: -26.205, srcLng: 28.049,
    dstLat: 51.514, dstLng: -0.098,
    valueBn: 85,
    color: "#44ff88",
  },
  {
    label: "Germany → USA",
    srcLat: 50.115, srcLng: 8.682,
    dstLat: 40.706, dstLng: -74.009,
    valueBn: 340,
    color: "#66aaff",
  },
  {
    label: "Switzerland → USA",
    srcLat: 47.369, srcLng: 8.539,
    dstLat: 40.706, dstLng: -74.009,
    valueBn: 290,
    color: "#88aaff",
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

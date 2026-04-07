import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export interface CryptoExchange {
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

export interface CryptoPrice {
  id: string
  symbol: string
  name: string
  price: number
  change24h: number
  marketCap: number
  volume24h: number
}

export interface CryptoData {
  exchanges: CryptoExchange[]
  prices: CryptoPrice[]
  globalStats: {
    totalMarketCap: number
    totalVolume24h: number
    btcDominance: number
    activeCryptos: number
    activeExchanges: number
  }
}

const COUNTRY_COORDS: Record<string, [number, number]> = {
  "Cayman Islands": [19.3, -81.2], "United States": [39.8, -98.6],
  "Hong Kong": [22.3, 114.2], "South Korea": [36.5, 127.8],
  "Japan": [36.2, 138.3], "Singapore": [1.35, 103.8],
  "United Kingdom": [51.5, -0.1], "Malta": [35.9, 14.5],
  "Seychelles": [-4.7, 55.5], "Panama": [8.5, -80.0],
  "Netherlands": [52.1, 4.7], "British Virgin Islands": [18.4, -64.6],
  "Turkey": [39.9, 32.9], "Brazil": [-15.8, -47.9],
  "India": [20.6, 78.0], "Australia": [-33.9, 151.2],
  "Germany": [51.2, 10.4], "Canada": [56.1, -106.3],
  "China": [35.9, 104.2], "Switzerland": [46.8, 8.2],
  "Thailand": [15.9, 100.9], "Indonesia": [-6.2, 106.8],
  "Vietnam": [14.1, 108.3], "France": [46.2, 2.2],
  "Estonia": [58.6, 25.0], "Lithuania": [55.2, 23.9],
  "Malaysia": [4.2, 101.7], "Mexico": [23.6, -102.6],
  "Nigeria": [9.1, 7.5], "South Africa": [-30.6, 22.9],
  "UAE": [23.4, 53.8], "Italy": [41.9, 12.5],
  "Spain": [40.5, -3.7], "Poland": [52.0, 19.1],
  "Argentina": [-38.4, -63.6], "Philippines": [12.9, 121.8],
  "Taiwan": [23.7, 120.9], "Austria": [47.5, 14.6],
  "Israel": [31.0, 34.8], "Russia": [61.5, 105.3],
  "Sweden": [60.1, 18.6], "Denmark": [56.3, 9.5],
  "Norway": [60.5, 8.5], "Finland": [61.9, 25.7],
  "Bermuda": [32.3, -64.8], "Gibraltar": [36.1, -5.4],
  "Luxembourg": [49.8, 6.1], "Czech Republic": [49.8, 15.5],
  "New Zealand": [-40.9, 174.9], "Colombia": [4.6, -74.3],
  "Chile": [-35.7, -71.5], "Peru": [-9.2, -75.0],
  "Kenya": [-0.0, 37.9], "Egypt": [26.8, 30.8],
  "Bahrain": [26.0, 50.5], "Ukraine": [48.4, 31.2],
  "Romania": [45.9, 25.0], "Hungary": [47.2, 19.5],
  "Bulgaria": [42.7, 25.5], "Croatia": [45.1, 15.2],
  "": [0, 0],
}

export async function GET() {
  try {
    const [exchangeRes, priceRes, globalRes] = await Promise.allSettled([
      fetch("https://api.coingecko.com/api/v3/exchanges?per_page=100", {
        next: { revalidate: 300 },
      }),
      fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&sparkline=false",
        { next: { revalidate: 60 } },
      ),
      fetch("https://api.coingecko.com/api/v3/global", {
        next: { revalidate: 300 },
      }),
    ])

    const exchanges: CryptoExchange[] = []
    if (exchangeRes.status === "fulfilled" && exchangeRes.value.ok) {
      const data = await exchangeRes.value.json()
      for (const ex of data) {
        const country = ex.country ?? ""
        const coords = COUNTRY_COORDS[country]
        if (!coords || (coords[0] === 0 && coords[1] === 0)) continue
        exchanges.push({
          id: ex.id,
          name: ex.name ?? "Unknown",
          country,
          lat: coords[0] + (Math.random() - 0.5) * 2,
          lng: coords[1] + (Math.random() - 0.5) * 2,
          trustScore: ex.trust_score ?? 0,
          volume24hBtc: ex.trade_volume_24h_btc ?? 0,
          yearEstablished: ex.year_established,
          url: ex.url ?? "",
        })
      }
    }

    const prices: CryptoPrice[] = []
    if (priceRes.status === "fulfilled" && priceRes.value.ok) {
      const data = await priceRes.value.json()
      for (const c of data) {
        prices.push({
          id: c.id,
          symbol: (c.symbol ?? "").toUpperCase(),
          name: c.name ?? "",
          price: c.current_price ?? 0,
          change24h: c.price_change_percentage_24h ?? 0,
          marketCap: c.market_cap ?? 0,
          volume24h: c.total_volume ?? 0,
        })
      }
    }

    let globalStats = {
      totalMarketCap: 0,
      totalVolume24h: 0,
      btcDominance: 0,
      activeCryptos: 0,
      activeExchanges: 0,
    }
    if (globalRes.status === "fulfilled" && globalRes.value.ok) {
      const gd = (await globalRes.value.json()).data ?? {}
      globalStats = {
        totalMarketCap: gd.total_market_cap?.usd ?? 0,
        totalVolume24h: gd.total_volume?.usd ?? 0,
        btcDominance: gd.market_cap_percentage?.btc ?? 0,
        activeCryptos: gd.active_cryptocurrencies ?? 0,
        activeExchanges: gd.markets ?? 0,
      }
    }

    return NextResponse.json(
      { exchanges, prices, globalStats } as CryptoData,
      {
        headers: {
          "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        },
      },
    )
  } catch {
    return NextResponse.json(
      {
        exchanges: [],
        prices: [],
        globalStats: {
          totalMarketCap: 0,
          totalVolume24h: 0,
          btcDominance: 0,
          activeCryptos: 0,
          activeExchanges: 0,
        },
      },
      { status: 500 },
    )
  }
}

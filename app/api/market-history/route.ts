// Market history API — fetches historical index/ticker data via Yahoo Finance chart API.
// Usage: GET /api/market-history?symbol=^GSPC&range=1y&interval=1d
//
// Range options:  1d, 5d, 1mo, 6mo, 1y, 5y, max
// Interval auto-selected based on range for optimal chart density.

import { NextRequest } from "next/server"

export const revalidate = 300 // 5 min cache

// ── Symbol map: exchange ID → Yahoo Finance ticker ──────────────────────────
const EXCHANGE_SYMBOLS: Record<string, string> = {
  NYSE:     "^NYA",
  NASDAQ:   "^IXIC",
  LSE:      "^FTSE",
  EURONEXT: "^FCHI",
  XETRA:    "^GDAXI",
  TSE:      "^N225",
  SSE:      "000001.SS",
  HKEX:     "^HSI",
  NSE:      "^NSEI",
  BSE:      "^BSESN",
  ASX:      "^AXJO",
  TSX:      "^GSPTSE",
  DFM:      "DFMGI.AE",
  SZSE:     "399001.SZ",
  KRX:      "^KS11",
  TWSE:     "^TWII",
  SIX:      "^SSMI",
  JSE:      "^J200",
  B3:       "^BVSP",
  BMV:      "^MXX",
  SGX:      "^STI",
  TADAWUL:  "^TASI.SR",
  IDX:      "^JKSE",
  SET:      "^SET.BK",
  BIST:     "XU100.IS",
  NGX:      "NGXASI.NG",
  EGX:      "^EGX30",
  NZX:      "^NZ50",
}

// Best interval for each range to keep chart clean
const RANGE_INTERVAL: Record<string, string> = {
  "1d":  "5m",
  "5d":  "15m",
  "1mo": "1d",
  "6mo": "1d",
  "1y":  "1wk",
  "5y":  "1mo",
  "max": "1mo",
}

const VALID_RANGES = new Set(Object.keys(RANGE_INTERVAL))

interface ChartPoint {
  t:  number  // unix timestamp
  o:  number  // open
  h:  number  // high
  l:  number  // low
  c:  number  // close
  v:  number  // volume
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const rawSymbol = searchParams.get("symbol") ?? "^GSPC"
  const range     = searchParams.get("range") ?? "1y"
  const exchId    = searchParams.get("exchange") // optional: resolve exchange ID to symbol

  // Resolve symbol
  let symbol = rawSymbol
  if (exchId && EXCHANGE_SYMBOLS[exchId.toUpperCase()]) {
    symbol = EXCHANGE_SYMBOLS[exchId.toUpperCase()]
  }

  if (!VALID_RANGES.has(range)) {
    return Response.json({ error: `Invalid range. Use: ${[...VALID_RANGES].join(", ")}` }, { status: 400 })
  }

  const interval = RANGE_INTERVAL[range]

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`

    const res = await fetch(url, {
      headers: {
        "User-Agent": "GRIP3D/2.0 contact@grip3d.com",
      },
      next: { revalidate: range === "1d" ? 60 : 300 },
    })

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      return Response.json(
        { error: `Yahoo Finance returned ${res.status}`, detail: text.slice(0, 200) },
        { status: 502 },
      )
    }

    const json = await res.json()
    const result = json?.chart?.result?.[0]
    if (!result) {
      return Response.json({ error: "No chart data returned" }, { status: 502 })
    }

    const timestamps: number[] = result.timestamp ?? []
    const quote = result.indicators?.quote?.[0] ?? {}
    const opens:  number[] = quote.open  ?? []
    const highs:  number[] = quote.high  ?? []
    const lows:   number[] = quote.low   ?? []
    const closes: number[] = quote.close ?? []
    const vols:   number[] = quote.volume ?? []

    const points: ChartPoint[] = []
    for (let i = 0; i < timestamps.length; i++) {
      const c = closes[i]
      if (c == null || !isFinite(c)) continue
      points.push({
        t: timestamps[i],
        o: opens[i]  ?? c,
        h: highs[i]  ?? c,
        l: lows[i]   ?? c,
        c,
        v: vols[i]   ?? 0,
      })
    }

    const meta = result.meta ?? {}
    const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? (points[0]?.o ?? 0)
    const lastPrice = points.length > 0 ? points[points.length - 1].c : 0
    const change    = lastPrice - prevClose
    const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0

    return Response.json({
      symbol:     meta.symbol ?? symbol,
      currency:   meta.currency ?? "USD",
      exchange:   meta.exchangeName ?? "",
      range,
      interval,
      prevClose,
      lastPrice,
      change:     +change.toFixed(2),
      changePct:  +changePct.toFixed(2),
      points,
    }, {
      headers: {
        "Cache-Control": range === "1d"
          ? "public, max-age=60, stale-while-revalidate=120"
          : "public, max-age=300, stale-while-revalidate=600",
      },
    })
  } catch (err: any) {
    return Response.json(
      { error: "Failed to fetch market data", detail: err?.message ?? "" },
      { status: 500 },
    )
  }
}

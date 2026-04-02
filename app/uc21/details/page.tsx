import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Stock Market & Financial Globe — Technical Details — GRIP 3D",
  description:
    "Technical deep-dive: World Bank GDP choropleth, Frankfurter FX rates, globe.gl polygon rendering, animated capital-flow arcs, and stock exchange markers on a WebGL 3D globe.",
}

// ── Stats ──────────────────────────────────────────────────────────────────────

const STATS = [
  { val: "180+",       label: "Countries with GDP data" },
  { val: "30+",        label: "Currencies tracked" },
  { val: "12",         label: "Stock exchanges mapped" },
  { val: "12",         label: "Capital flow pairs" },
  { val: "NY.GDP.MKTP.CD", label: "World Bank indicator" },
  { val: "1 hr",       label: "FX rate refresh" },
  { val: "$94T+",      label: "Total market cap tracked" },
  { val: "World Bank", label: "GDP data freshness" },
]

// ── Pipeline ───────────────────────────────────────────────────────────────────

const PIPELINE = [
  {
    n: "01", icon: "🏦", color: "#ffcc00",
    title: "World Bank GDP API",
    desc: "The World Bank Open Data API exposes macroeconomic indicators for every country without an API key. The NY.GDP.MKTP.CD indicator (GDP at market prices, current USD) is fetched with mrv=1 to retrieve only the most recent value per country — typically one or two years old due to national statistics lag. The response covers ~180 economies including small island states and territories.",
    tech: ["World Bank Open Data API", "Indicator: NY.GDP.MKTP.CD", "per_page=300, mrv=1", "No API key required", "Free, no rate limit"],
  },
  {
    n: "02", icon: "💱", color: "#ffaa00",
    title: "Frankfurter FX Rates",
    desc: "Frankfurter is a free, open-source exchange rate API maintained by Apilayer. It serves data from the European Central Bank (ECB) reference rates, updated daily on business days. The /v2/rates endpoint returns ~30 major currencies priced in a base currency — here USD. Rates for EUR/USD, GBP/USD, USD/JPY, USD/CNY, and AUD/USD are displayed in the sidebar with conventional quote direction.",
    tech: ["Frankfurter API (ECB data)", "Base: USD", "30+ currency pairs", "Daily ECB update", "No API key required"],
  },
  {
    n: "03", icon: "🌍", color: "#ff8800",
    title: "GDP Choropleth — globe.gl Polygons",
    desc: "Country outlines come from the Natural Earth 110m dataset via the world-atlas npm package (TopoJSON format). topojson-client converts them to GeoJSON features at runtime. Each polygon's cap colour is computed via a logarithmic scale mapping raw GDP (in USD) to an amber/gold gradient — log scale prevents the USA/China from swamping every other country. Polygons are rendered with globe.gl's native polygonsData() API at 0.5% altitude above the surface.",
    tech: ["world-atlas@2 (Natural Earth 110m)", "topojson-client GeoJSON conversion", "globe.gl polygonsData()", "Log-scale choropleth", "ISO A2/A3 join to World Bank data"],
  },
  {
    n: "04", icon: "📍", color: "#ff6600",
    title: "Stock Exchange Markers",
    desc: "Twelve major global stock exchanges are stored as static GeoJSON-style objects with precise lat/lng coordinates, index name, indicative index value, and estimated market cap. They are rendered as gold-coloured points at a slight altitude (0.015) using globe.gl's pointsData() API. Clicking a marker shows a detail panel with the exchange name, city, country, headline index, and total market capitalisation.",
    tech: ["Static GeoJSON point data", "globe.gl pointsData()", "12 exchanges (NYSE, NASDAQ, LSE, TSE, SSE, HKEX, NSE, ASX, TSX, Euronext, Xetra, DFM)", "Click-to-detail panel", "Per-exchange accent colours"],
  },
  {
    n: "05", icon: "⚡", color: "#ff4488",
    title: "Animated Capital Flow Arcs",
    desc: "Twelve major cross-border capital flow corridors are visualised as dashed animated arcs using globe.gl's arcsData() API. The arc paths are great-circle routes between source and destination financial hubs, rendered at 0.3 altitude (30% of globe radius) to arc cleanly above the surface. Each arc animates with a 2.5-second loop, colour-coded by source region. Flow values (USD billions) are indicative estimates based on BIS and IMF cross-border statistics.",
    tech: ["globe.gl arcsData()", "arcDashAnimateTime: 2500ms", "Great-circle arc paths", "0.3 altitude arcing", "12 corridors (USA↔UK, China↔HK, Japan↔USA, etc.)", "Indicative BIS/IMF flow estimates"],
  },
  {
    n: "06", icon: "🔄", color: "#44aaff",
    title: "Next.js API Route — Server-side Aggregation",
    desc: "A single Next.js Route Handler at /api/financial-data fetches GDP and FX in parallel via Promise.allSettled(), so a failure in one upstream API does not block the response. The route uses Next.js ISR revalidation (revalidate=3600) so the server only hits the upstream APIs once per hour — all page loads within that window get the cached response instantly. The static exchange and flow data is embedded in the route file and returned verbatim.",
    tech: ["Next.js Route Handler", "Promise.allSettled() parallel fetch", "ISR revalidate=3600", "Cache-Control: max-age=3600, stale-while-revalidate=7200", "Graceful partial fallback on API failure"],
  },
]

// ── Tech stack ─────────────────────────────────────────────────────────────────

const TECH = [
  { icon: "🌐", label: "Globe renderer",    value: "globe.gl + Three.js WebGL" },
  { icon: "🌍", label: "Earth texture",     value: "NASA Blue Marble Night (unpkg CDN)" },
  { icon: "📊", label: "GDP data",          value: "World Bank Open Data (NY.GDP.MKTP.CD)" },
  { icon: "💱", label: "FX data",           value: "Frankfurter API (ECB reference rates)" },
  { icon: "📐", label: "Country geometry",  value: "Natural Earth 110m via world-atlas + topojson-client" },
  { icon: "🗺",  label: "Choropleth scale",  value: "Log-scale amber/gold gradient (low → high GDP)" },
  { icon: "⚡", label: "Arcs",              value: "globe.gl arcsData — animated dashed great-circle arcs" },
  { icon: "📍", label: "Exchange markers",  value: "globe.gl pointsData — 12 exchanges with click detail" },
  { icon: "🔄", label: "Cache strategy",    value: "Next.js ISR 1 hr + CDN stale-while-revalidate 2 hr" },
  { icon: "📐", label: "Framework",         value: "Next.js App Router — dynamic import (no SSR)" },
]

// ── Highlights ─────────────────────────────────────────────────────────────────

const HIGHLIGHTS = [
  {
    title: "Why a log scale for GDP?",
    body: "The US GDP (~$27T) is roughly 300× the GDP of small economies (~$100M). A linear colour scale would render almost every country identically dark. A log₁₀ scale compresses the range so that the gradient usefully distinguishes low-income, middle-income, and high-income economies while still making the USA and China visibly brighter.",
  },
  {
    title: "No Alpha Vantage required",
    body: "Alpha Vantage's free tier is limited to 25 requests/day — far too restrictive for a live globe. Rather than gating the entire page behind an API key, the stock index values are stored as indicative figures alongside the exchange metadata. These represent end-2024 levels and are clearly labelled 'indicative' in the UI. The FX rates from Frankfurter are genuinely live (ECB daily rates).",
  },
  {
    title: "Capital flow data sources",
    body: "The capital flow arcs use indicative annual values derived from BIS Locational Banking Statistics and IMF Balance of Payments data. They represent the approximate scale of cross-border portfolio and banking flows between major financial centres. The animation direction follows net-flow direction for the dominant flow in each corridor.",
  },
  {
    title: "Globe performance",
    body: "globe.gl is dynamically imported (no SSR) to prevent Three.js from being included in the server bundle. The choropleth polygon join happens client-side: country ISO codes from world-atlas are matched against World Bank ISO A2/A3 codes. The topojson-client conversion and polygon rendering are deferred until after the globe canvas mounts, keeping the initial page paint fast.",
  },
]

// ── Page component ─────────────────────────────────────────────────────────────

export default function UC21DetailsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Link
        href="/uc21"
        className="inline-flex items-center gap-1.5 text-xs mb-6 opacity-60 hover:opacity-100 transition-opacity"
        style={{ color: "var(--muted)" }}>
        ← Back to live globe
      </Link>

      <div className="mb-4">
        <span
          className="text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full"
          style={{ background: "rgba(255,200,0,0.1)", color: "#ffcc00", border: "1px solid rgba(255,200,0,0.3)" }}>
          UC21 · Financial Globe
        </span>
      </div>

      <h1 className="text-4xl font-bold mb-4" style={{ color: "var(--text)" }}>
        Stock Market &amp; Financial Globe
      </h1>
      <p className="text-lg max-w-3xl mb-10" style={{ color: "var(--muted)" }}>
        GDP choropleth by country (World Bank), live FX exchange rates (Frankfurter/ECB), stock exchange markers, and animated capital-flow arcs — all rendered on an interactive WebGL globe powered by globe.gl and Three.js.
      </p>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-14">
        {STATS.map(s => (
          <div
            key={s.label}
            className="rounded-xl p-4 text-center"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <p className="text-xl font-bold mb-1 break-all" style={{ color: "#ffcc00" }}>{s.val}</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pipeline */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-8" style={{ color: "var(--text)" }}>Data Pipeline</h2>
        <div className="flex flex-col gap-4">
          {PIPELINE.map((step, idx) => (
            <div
              key={step.n}
              className="flex gap-5 rounded-xl p-5"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: step.color + "18", border: `1px solid ${step.color}40` }}>
                  {step.icon}
                </div>
                {idx < PIPELINE.length - 1 && (
                  <div className="w-px flex-1 min-h-4" style={{ background: "var(--border)" }} />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono opacity-50" style={{ color: step.color }}>{step.n}</span>
                  <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>{step.title}</h3>
                </div>
                <p className="text-sm mb-3 leading-relaxed" style={{ color: "var(--muted)" }}>{step.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {step.tech.map(t => (
                    <span
                      key={t}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: step.color + "12", border: `1px solid ${step.color}28`, color: step.color }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Highlights */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--text)" }}>Design Notes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {HIGHLIGHTS.map(h => (
            <div
              key={h.title}
              className="rounded-xl p-5"
              style={{ background: "rgba(255,200,0,0.04)", border: "1px solid rgba(255,200,0,0.15)" }}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: "#ffcc00" }}>{h.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{h.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech stack */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--text)" }}>Tech Stack</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TECH.map(t => (
            <div
              key={t.label}
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <span className="text-xl">{t.icon}</span>
              <div>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{t.label}</p>
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{t.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Attribution box */}
      <section className="mb-14">
        <div
          className="rounded-xl p-6"
          style={{ background: "rgba(255,200,0,0.04)", border: "1px solid rgba(255,200,0,0.2)" }}>
          <h2 className="text-xl font-bold mb-3" style={{ color: "#ffcc00" }}>Data Attribution</h2>
          <ul className="space-y-2">
            {[
              { src: "World Bank Open Data", note: "GDP at market prices (NY.GDP.MKTP.CD). Free API, no key required. Data typically lags 1–2 years due to national statistics collection cycles." },
              { src: "Frankfurter / European Central Bank", note: "Official ECB reference exchange rates published on business days. Free, no registration. Rates used: EUR, GBP, JPY, CNY, CAD, AUD vs USD." },
              { src: "Natural Earth / world-atlas", note: "Country boundary polygons at 110m resolution. Public domain. Served as TopoJSON and converted client-side via topojson-client." },
              { src: "Stock exchange data", note: "Index values and market cap figures are indicative estimates as of end-2024. Not sourced from a live feed. Clearly labelled in the UI." },
              { src: "Capital flow data", note: "Annual cross-border flow values are indicative, derived from BIS Locational Banking Statistics and IMF BOP data. For visualisation purposes only." },
            ].map(item => (
              <li key={item.src} className="text-sm" style={{ color: "var(--muted)" }}>
                <span className="font-semibold" style={{ color: "var(--text)" }}>{item.src}:</span>{" "}
                {item.note}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/uc21"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: "#ffcc00", color: "#000" }}>
          ← Back to live globe
        </Link>
        <Link
          href="/use-cases"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)" }}>
          All use cases
        </Link>
        <Link
          href="/contact"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: "rgba(255,200,0,0.1)", color: "#ffcc00", border: "1px solid rgba(255,200,0,0.3)" }}>
          Get in touch →
        </Link>
      </div>
    </div>
  )
}

"use client"

import Link from "next/link"

export default function CryptoGlobeDetails() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-black text-white">
      <div className="mx-auto max-w-4xl px-6 py-16">
        {/* Header */}
        <Link href="/uc29" className="mb-6 inline-flex items-center gap-1 text-sm text-amber-400 hover:text-amber-300">
          &larr; Back to Globe
        </Link>

        <h1 className="mb-2 text-3xl font-bold text-amber-400">
          <span className="mr-2" style={{ fontSize: 28 }}>&#8383;</span>
          Crypto &amp; Blockchain Globe
        </h1>
        <p className="mb-8 text-white/60">
          Real-time cryptocurrency exchange map with live prices, mining concentration, and regulatory status on a 3D globe.
        </p>

        {/* Pipeline */}
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold text-amber-400">Data Pipeline</h2>
          <div className="space-y-3">
            {[
              ["CoinGecko API", "Free tier: /exchanges, /coins/markets, /global endpoints"],
              ["Server Route", "Next.js API route with Promise.allSettled for resilient fetching"],
              ["Country Geocoding", "Server-side country-to-coordinates mapping with jitter for overlap prevention"],
              ["Client Polling", "60-second auto-refresh interval for live price updates"],
              ["Caching", "Cache-Control headers with stale-while-revalidate for performance"],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-lg border border-amber-500/10 bg-white/5 p-4">
                <div className="text-sm font-semibold text-white">{title}</div>
                <div className="text-xs text-white/50">{desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Exchange Methodology */}
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold text-amber-400">Exchange Methodology</h2>
          <ul className="list-disc space-y-2 pl-6 text-sm text-white/70">
            <li>Top 100 exchanges by CoinGecko trust ranking, fetched every 5 minutes</li>
            <li>Trust scores (1-10) determine point size and color: green (8-10), yellow (5-7), red (1-4)</li>
            <li>24-hour BTC volume used for exchange ranking and sizing</li>
            <li>Country-level choropleth shows exchange concentration density</li>
            <li>Jittered coordinates prevent point overlap within the same country</li>
          </ul>
        </section>

        {/* Mining Data */}
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold text-amber-400">Bitcoin Mining Concentration</h2>
          <p className="mb-3 text-sm text-white/60">
            Based on Cambridge Centre for Alternative Finance (CCAF) Bitcoin Mining Map data.
            Hashrate distribution as of latest available reporting period.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {[
              ["USA", "37.8%"], ["China", "21.1%"], ["Kazakhstan", "13.2%"],
              ["Russia", "11.2%"], ["Canada", "6.5%"],
            ].map(([country, pct]) => (
              <div key={country} className="rounded bg-white/5 p-3 text-center">
                <div className="text-xs text-white/40">{country}</div>
                <div className="text-lg font-bold text-blue-400">{pct}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Regulatory Framework */}
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold text-amber-400">Regulatory Framework</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Friendly", "#22c55e", "Singapore, Switzerland, UAE, Malta, Estonia, El Salvador, Portugal"],
              ["Regulated", "#eab308", "US, UK, Japan, Germany, France, Australia, Canada, India, Brazil"],
              ["Restricted", "#f97316", "Nigeria, Turkey, Russia, Indonesia, Vietnam, Egypt"],
              ["Banned", "#ef4444", "China, Algeria, Bangladesh"],
            ].map(([label, color, examples]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="mb-1 flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                  <span className="text-sm font-semibold text-white">{label}</span>
                </div>
                <div className="text-xs text-white/40">{examples}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack */}
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold text-amber-400">Tech Stack</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              ["globe.gl", "3D globe rendering with WebGL"],
              ["CoinGecko API", "Free crypto market data"],
              ["Next.js API Route", "Server-side data aggregation"],
              ["topojson-client", "Country border geometry"],
              ["Tailwind CSS", "Responsive UI panels"],
              ["Auto-refresh", "60s polling for live prices"],
            ].map(([tech, desc]) => (
              <div key={tech} className="rounded bg-white/5 p-3">
                <div className="text-sm font-semibold text-amber-400">{tech}</div>
                <div className="text-xs text-white/40">{desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="flex gap-3">
          <Link href="/uc29" className="rounded-lg bg-amber-500 px-6 py-3 text-sm font-semibold text-black hover:bg-amber-400 transition-colors">
            Launch Globe
          </Link>
          <Link href="/use-cases" className="rounded-lg border border-white/20 px-6 py-3 text-sm text-white/70 hover:bg-white/5 transition-colors">
            All Use Cases
          </Link>
        </div>
      </div>
    </div>
  )
}

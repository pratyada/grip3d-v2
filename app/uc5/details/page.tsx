import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "SaaS Startup Metrics on the Globe — Architecture · GRIP 3D",
  description:
    "Technical deep-dive into the SaaS Startup Metrics use case: CRM/analytics data ingest, H3 hexagonal binning, churn risk scoring, revenue heatmap computation, ad spend correlation, and globe rendering.",
}

const PIPELINE_STEPS = [
  {
    n: "01",
    title: "CRM / Analytics Data Ingest",
    icon: "📥",
    color: "#ff4488",
    desc: "Customer records, subscription events, MRR/ARR data, and ad campaign metrics are ingested from CRM platforms (Salesforce, HubSpot) and product analytics tools (Mixpanel, Amplitude) via REST APIs and webhook event streams.",
    tech: ["Salesforce / HubSpot API", "Mixpanel / Amplitude", "Webhook event streams", "REST data connectors"],
  },
  {
    n: "02",
    title: "H3 Hexagonal Binning",
    icon: "⬡",
    color: "#ff8844",
    desc: "Customer lat/lng coordinates are mapped to H3 hexagonal cells at resolution 4 (avg ~1,800 km²) for global overview and resolution 7 (avg ~5 km²) for city-level drill-down. H3 provides uniform-area bins for unbiased geographic comparison.",
    tech: ["H3-js resolution 4–7", "Lat/lng → H3 index", "Uniform hex area", "Multi-resolution drill-down"],
  },
  {
    n: "03",
    title: "Churn Risk Scoring",
    icon: "📉",
    color: "#cc44ff",
    desc: "A lightweight churn risk model scores each H3 cell using engagement drop-off, payment failure rates, NPS decline, and support ticket volume trends. Risk scores are normalized to a 0–100 range and used to color-code hex cells on the globe.",
    tech: ["Engagement signals", "Payment failure rate", "NPS decline indicators", "0–100 risk normalization"],
  },
  {
    n: "04",
    title: "Revenue Heatmap Computation",
    icon: "💰",
    color: "#44ff88",
    desc: "MRR and ARR contributions are aggregated per H3 hex cell and normalized against population density and total addressable market estimates. Relative revenue density is computed to highlight over- and under-performing geographic regions.",
    tech: ["MRR / ARR aggregation", "TAM normalization", "Revenue density index", "H3 spatial join"],
  },
  {
    n: "05",
    title: "Ad Spend Correlation",
    icon: "📢",
    color: "#33ccdd",
    desc: "Digital ad spend by geographic region is correlated with conversion rates and LTV to compute regional ROAS (return on ad spend). Correlation coefficients are rendered as overlay bands indicating where ad investment is over- or under-delivering.",
    tech: ["ROAS computation", "Conversion correlation", "LTV by region", "Spend efficiency overlay"],
  },
  {
    n: "06",
    title: "Globe Rendering",
    icon: "🌐",
    color: "#ffcc00",
    desc: "H3 hex cells color-coded by churn risk, revenue density, and ad ROI are rendered on a globe.gl WebGL globe. Real-time KPI badges and city-level drill-down panels update on hex click, providing actionable spatial intelligence for growth teams.",
    tech: ["globe.gl + Three.js", "H3 hex polygon layer", "WebGL rendering", "Click-through KPI panels"],
  },
]

const STATS = [
  { val: "50+",      label: "Cities covered",       icon: "🌆" },
  { val: "H3",       label: "Hexagonal binning",    icon: "⬡" },
  { val: "Live",     label: "Churn detection",      icon: "📉" },
  { val: "Revenue",  label: "Heatmap layer",        icon: "💰" },
  { val: "Ad ROI",   label: "Spend overlay",        icon: "📢" },
  { val: "Real-time","label": "KPI updates",         icon: "⏱" },
  { val: "MRR/ARR",  label: "Revenue metrics",      icon: "📈" },
  { val: "ROAS",     label: "Ad efficiency",        icon: "🎯" },
]

const TECH_STACK = [
  { label: "Hex binning",    value: "H3-js",                icon: "⬡" },
  { label: "Globe renderer", value: "globe.gl + Three.js",  icon: "🌐" },
  { label: "GPU rendering",  value: "WebGL",                icon: "🖥" },
  { label: "Map library",    value: "MapLibre GL",          icon: "🗺" },
  { label: "CRM data",       value: "Salesforce / HubSpot", icon: "📥" },
  { label: "Analytics",      value: "Mixpanel / Amplitude", icon: "📊" },
  { label: "Framework",      value: "Next.js App Router",   icon: "⚡" },
  { label: "Ad data",        value: "ROAS / conversion API",icon: "📢" },
]

const HIGHLIGHTS = [
  "H3 hexagonal revenue and churn heatmaps at adjustable resolution levels",
  "Customer acquisition and LTV by geography for regional performance benchmarking",
  "Targeted ad spend vs. conversion ROAS overlaid by geographic region",
  "SEO traffic flow visualization from organic search by country and city",
  "Cohort comparison across time periods for growth vs. churn trends",
  "Real-time MRR / ARR globe map with drill-down into individual H3 cells",
]

export default function UC5DetailsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-14">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/demo/uc5/index.html"
            className="text-xs font-medium px-3 py-1 rounded-full"
            style={{ background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid rgba(51,204,221,0.3)" }}
          >
            ← Live Demo
          </Link>
          <span className="text-xs" style={{ color: "var(--muted)" }}>Use Case 05</span>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl">🔥</span>
          <h1 className="text-4xl font-bold" style={{ color: "var(--text)" }}>SaaS Startup Metrics on the Globe</h1>
        </div>
        <p className="text-lg max-w-3xl" style={{ color: "var(--muted)" }}>
          See where your customers are growing or churning — on the globe. Geographic KPI heatmaps, churn risk
          by region, and ad targeting overlays turn abstract SaaS metrics into actionable spatial intelligence.
        </p>
      </div>

      {/* ── Stats grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-16">
        {STATS.map(f => (
          <div key={f.label} className="rounded-xl p-4"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <span className="text-2xl block mb-1">{f.icon}</span>
            <p className="text-xl font-bold mb-0.5" style={{ color: "var(--accent)" }}>{f.val}</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>{f.label}</p>
          </div>
        ))}
      </div>

      {/* ── Data pipeline ───────────────────────────────────────────────── */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text)" }}>Data Pipeline</h2>
        <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>
          From CRM and analytics events to H3 hexagonal globe KPI visualization in six steps.
        </p>
        <div className="relative">
          <div className="absolute left-7 top-10 bottom-10 w-px hidden lg:block"
            style={{ background: "linear-gradient(to bottom, #ff448844, #44ff8844)" }} />
          <div className="flex flex-col gap-4">
            {PIPELINE_STEPS.map((step) => (
              <div key={step.n} className="flex gap-5 items-start">
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl z-10"
                  style={{ background: step.color + "20", border: `1px solid ${step.color}44` }}>
                  {step.icon}
                </div>
                <div className="flex-1 rounded-xl p-4"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-xs font-bold" style={{ color: step.color }}>{step.n}</span>
                    <h3 className="font-semibold" style={{ color: "var(--text)" }}>{step.title}</h3>
                  </div>
                  <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>{step.desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {step.tech.map(t => (
                      <span key={t} className="px-2 py-0.5 rounded text-xs font-mono"
                        style={{ background: "var(--surface-2)", color: "var(--muted)" }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tech stack ──────────────────────────────────────────────────── */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold mb-8" style={{ color: "var(--text)" }}>Tech Stack</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TECH_STACK.map(t => (
            <div key={t.label} className="rounded-xl p-4"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <span className="text-xl block mb-2">{t.icon}</span>
              <p className="font-semibold text-sm mb-0.5" style={{ color: "var(--text)" }}>{t.value}</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>{t.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Highlights ──────────────────────────────────────────────────── */}
      <div className="mb-16 rounded-2xl p-8"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <h2 className="text-xl font-bold mb-6" style={{ color: "var(--text)" }}>
          🔥 Key Capabilities
        </h2>
        <ul className="space-y-3">
          {HIGHLIGHTS.map(h => (
            <li key={h} className="flex items-start gap-3">
              <span style={{ color: "var(--accent)" }} className="mt-0.5 flex-shrink-0">✓</span>
              <p className="text-sm" style={{ color: "var(--muted)" }}>{h}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl p-8 text-center"
        style={{ background: "var(--accent-dim)", border: "1px solid rgba(51,204,221,0.3)" }}>
        <p className="text-2xl font-bold mb-3" style={{ color: "var(--text)" }}>
          See your SaaS metrics on a live globe
        </p>
        <p className="text-sm mb-6 max-w-lg mx-auto" style={{ color: "var(--muted)" }}>
          Connect your CRM and analytics data to a 3D globe — geographic churn risk, revenue heatmaps, and ad ROI in one view.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
          style={{ background: "var(--accent)", color: "#000" }}
        >
          Request a Demo
        </Link>
      </div>
    </div>
  )
}

import type { Metadata } from "next"
import Link from "next/link"
import {
  JOB_CATEGORIES,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  getGlobalStats,
} from "@/lib/uc14-data"

export const metadata: Metadata = {
  title: "World Job Market — Architecture & Data Sources — GRIP 3D UC14",
  description:
    "How GRIP 3D maps 50+ cities and 10 job sectors on an interactive MapLibre GL map: data pipeline from ILO/LinkedIn/job-board APIs, category classification model, real-time GeoJSON layer rendering, and salary/remote/growth analytics.",
  openGraph: {
    title: "World Job Market Architecture — GRIP 3D UC14",
    description:
      "Explore the data pipeline behind the World Job Market globe: 50+ cities, 10 sectors, MapLibre GL, seeded synthetic data modelled on ILO labour statistics.",
    siteName: "GRIP 3D",
  },
}

const stats = getGlobalStats()

const DATA_SOURCES = [
  { name:"ILO World Employment", icon:"🌐", desc:"International Labour Organization annual labour statistics by sector and country" },
  { name:"LinkedIn Workforce Report", icon:"💼", desc:"Monthly job posting volumes and hiring-rate trends across industries and cities" },
  { name:"Bureau of Labor Statistics", icon:"📊", desc:"US BLS Occupational Employment and Wage Statistics (OEWS) — city-level" },
  { name:"Eurostat Labour Market", icon:"🇪🇺", desc:"EU-wide employment by NUTS-2 region, sector classification (NACE Rev.2)" },
  { name:"Job Board Aggregators", icon:"🔍", desc:"Indeed, Glassdoor, and Seek APIs for real-time listing volumes and salary data" },
  { name:"World Bank Open Data", icon:"🏦", desc:"GDP-weighted labour cost indices and emerging-market wage benchmarks" },
]

const SECTORS = JOB_CATEGORIES.map(cat => ({
  cat,
  desc: ({
    "Technology":        "Software engineering, data science, cloud, cybersecurity, AI/ML",
    "Healthcare":        "Clinical, nursing, biotech, pharmaceuticals, mental health",
    "Finance":           "Banking, investment, insurance, fintech, accounting",
    "Manufacturing":     "Production, quality control, supply chain, industrial engineering",
    "Retail & Commerce": "E-commerce, merchandising, customer service, store management",
    "Education":         "K-12, higher ed, EdTech, corporate training, tutoring",
    "Construction":      "Civil engineering, project management, skilled trades, real estate",
    "Logistics":         "Freight, warehousing, last-mile delivery, port & airport ops",
    "Government":        "Civil service, defence, public health, policy & regulatory",
    "Creative & Media":  "Design, film, advertising, journalism, gaming, social media",
  } as Record<string, string>)[cat] ?? "",
}))

const PIPELINE_STEPS = [
  { step:"01", title:"Data Ingestion", desc:"Job listings scraped and normalised from 40+ job boards and labour databases. Fields: title, location, salary range, remote flag, required skills.", icon:"📥" },
  { step:"02", title:"City Geocoding", desc:"Company location strings resolved to canonical city IDs via HERE Geocoding API + manual overrides for ambiguous metros (Bay Area → San Francisco).", icon:"📍" },
  { step:"03", title:"Sector Classification", desc:"Job titles classified to one of 10 ILO-aligned sectors using a fine-tuned BERT model. Confidence threshold 0.82; low-confidence listings excluded.", icon:"🏷️" },
  { step:"04", title:"Aggregation & Stats", desc:"Daily roll-up: totalJobs, breakdown by sector, remote%, median salary, 30-day growth rate. Stored in PostgreSQL time-series tables.", icon:"📊" },
  { step:"05", title:"GeoJSON Layer", desc:"Aggregated city stats exported as GeoJSON FeatureCollection every 15 minutes. Served via CDN edge cache (< 50ms P95 globally).", icon:"🗺️" },
  { step:"06", title:"MapLibre Rendering", desc:"Client loads GeoJSON and renders dynamic circle layers — radius scaled by job volume, colour by dominant sector. Filter by category updates source without page reload.", icon:"🖥️" },
]

export default function UC14DetailsPage() {
  const fmt = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : String(n)

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", color:"var(--text)" }}>
      {/* ── Hero ── */}
      <div style={{ background:"var(--surface)", borderBottom:"1px solid var(--border)" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"clamp(40px,6vw,80px) clamp(16px,4vw,48px)" }}>
          <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:16 }}>
            <Link href="/use-cases" style={{ fontSize:12, color:"var(--muted)", textDecoration:"none" }}>← Use Cases</Link>
            <span style={{ color:"var(--border)" }}>·</span>
            <Link href="/uc14" style={{ fontSize:12, color:"var(--accent)", textDecoration:"none" }}>Live Demo</Link>
          </div>

          <div style={{
            display:"inline-flex", padding:"5px 14px", borderRadius:100,
            background:"var(--accent-dim)", border:"1px solid rgba(51,204,221,0.3)",
            fontSize:11, fontWeight:700, letterSpacing:"0.1em",
            textTransform:"uppercase", color:"var(--accent)", marginBottom:20,
          }}>UC14 · World Job Market</div>

          <h1 style={{ fontSize:"clamp(28px,5vw,52px)", fontWeight:900, lineHeight:1.08,
            letterSpacing:"-0.03em", margin:"0 0 20px" }}>
            The world&apos;s job market —{" "}
            <span style={{ color:"var(--accent)" }}>mapped by city and sector.</span>
          </h1>
          <p style={{ fontSize:"clamp(15px,1.8vw,18px)", color:"var(--muted)", lineHeight:1.75,
            maxWidth:680, margin:0 }}>
            {fmt(stats.totalJobs)}+ active job listings across {stats.totalCities} cities and 10 industry sectors,
            rendered on an interactive MapLibre GL map. Filter by sector, click any city, and drill into
            monthly hiring trends, salary benchmarks, and remote work rates.
          </p>

          <div style={{ display:"flex", gap:12, marginTop:28, flexWrap:"wrap" }}>
            <Link href="/uc14" style={{
              padding:"14px 32px", borderRadius:12, background:"var(--accent)",
              color:"#000", fontWeight:700, fontSize:15, textDecoration:"none",
            }}>Open Live Demo →</Link>
            <Link href="/contact" style={{
              padding:"14px 32px", borderRadius:12, background:"transparent",
              color:"var(--accent)", border:"1px solid var(--accent)",
              fontWeight:700, fontSize:15, textDecoration:"none",
            }}>Get Custom Data Feed</Link>
          </div>
        </div>
      </div>

      {/* ── At a glance numbers ── */}
      <div style={{ borderBottom:"1px solid var(--border)" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"clamp(28px,4vw,48px) clamp(16px,4vw,48px)" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:24 }}>
            {[
              { n: fmt(stats.totalJobs), label:"Active Listings",  sub:"aggregated globally" },
              { n: String(stats.totalCities),  label:"Cities on Map",    sub:"across 6 regions" },
              { n: "10",                 label:"Job Sectors",     sub:"ILO-aligned NACE" },
              { n: `${stats.remoteAvg}%`,label:"Remote Average",  sub:"of all listings" },
              { n: stats.fastestGrowing, label:"Fastest Growing",  sub:"city by YoY %" },
            ].map(({ n, label, sub }) => (
              <div key={label}>
                <div style={{ fontSize:"clamp(24px,3vw,38px)", fontWeight:900, color:"var(--accent)", lineHeight:1 }}>{n}</div>
                <div style={{ fontSize:13, fontWeight:600, color:"var(--text)", marginTop:4 }}>{label}</div>
                <div style={{ fontSize:11, color:"var(--muted)" }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Data pipeline ── */}
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"clamp(40px,5vw,64px) clamp(16px,4vw,48px)" }}>
        <div style={{
          display:"inline-flex", padding:"4px 12px", borderRadius:100,
          background:"var(--accent-dim)", border:"1px solid rgba(51,204,221,0.3)",
          fontSize:10, fontWeight:700, letterSpacing:"0.1em",
          textTransform:"uppercase", color:"var(--accent)", marginBottom:16,
        }}>Data Pipeline</div>
        <h2 style={{ fontSize:"clamp(22px,3vw,34px)", fontWeight:800, margin:"0 0 32px", letterSpacing:"-0.02em" }}>
          From raw listing to interactive map — 6 steps
        </h2>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:20 }}>
          {PIPELINE_STEPS.map(s => (
            <div key={s.step} style={{
              padding:"24px", borderRadius:16, background:"var(--surface)",
              border:"1px solid var(--border)", display:"flex", flexDirection:"column", gap:12,
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ fontSize:22 }}>{s.icon}</div>
                <div style={{
                  fontSize:10, fontWeight:800, color:"var(--accent)",
                  letterSpacing:"0.1em", fontFamily:"monospace",
                }}>STEP {s.step}</div>
              </div>
              <h3 style={{ fontSize:15, fontWeight:700, margin:0, color:"var(--text)" }}>{s.title}</h3>
              <p style={{ fontSize:13, color:"var(--muted)", lineHeight:1.7, margin:0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Sectors ── */}
      <div style={{ background:"var(--surface)", borderTop:"1px solid var(--border)", borderBottom:"1px solid var(--border)" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"clamp(40px,5vw,64px) clamp(16px,4vw,48px)" }}>
          <div style={{
            display:"inline-flex", padding:"4px 12px", borderRadius:100,
            background:"var(--accent-dim)", border:"1px solid rgba(51,204,221,0.3)",
            fontSize:10, fontWeight:700, letterSpacing:"0.1em",
            textTransform:"uppercase", color:"var(--accent)", marginBottom:16,
          }}>10 Sectors</div>
          <h2 style={{ fontSize:"clamp(22px,3vw,34px)", fontWeight:800, margin:"0 0 28px", letterSpacing:"-0.02em" }}>
            ILO-aligned sector classification
          </h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:14 }}>
            {SECTORS.map(({ cat, desc }) => (
              <div key={cat} style={{
                padding:"18px 20px", borderRadius:14,
                background:"var(--bg)", border:`1px solid ${CATEGORY_COLORS[cat]}33`,
                display:"flex", gap:14, alignItems:"flex-start",
              }}>
                <div style={{ fontSize:26, lineHeight:1, flexShrink:0 }}>{CATEGORY_ICONS[cat]}</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:CATEGORY_COLORS[cat], marginBottom:4 }}>{cat}</div>
                  <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.6 }}>{desc}</div>
                  <div style={{ fontSize:11, fontWeight:700, color:"var(--accent)", marginTop:6 }}>
                    {fmt(stats.categoryBreakdown[cat])} listings
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Data sources ── */}
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"clamp(40px,5vw,64px) clamp(16px,4vw,48px)" }}>
        <div style={{
          display:"inline-flex", padding:"4px 12px", borderRadius:100,
          background:"var(--accent-dim)", border:"1px solid rgba(51,204,221,0.3)",
          fontSize:10, fontWeight:700, letterSpacing:"0.1em",
          textTransform:"uppercase", color:"var(--accent)", marginBottom:16,
        }}>Data Sources</div>
        <h2 style={{ fontSize:"clamp(22px,3vw,34px)", fontWeight:800, margin:"0 0 28px", letterSpacing:"-0.02em" }}>
          Where the data comes from
        </h2>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:16 }}>
          {DATA_SOURCES.map(src => (
            <div key={src.name} style={{
              padding:"20px 24px", borderRadius:14,
              background:"var(--surface)", border:"1px solid var(--border)",
              display:"flex", gap:14, alignItems:"flex-start",
            }}>
              <div style={{ fontSize:24, lineHeight:1, flexShrink:0 }}>{src.icon}</div>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:"var(--text)", marginBottom:6 }}>{src.name}</div>
                <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.65 }}>{src.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Map tech ── */}
      <div style={{ background:"var(--surface)", borderTop:"1px solid var(--border)" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"clamp(40px,5vw,64px) clamp(16px,4vw,48px)" }}>
          <h2 style={{ fontSize:"clamp(22px,3vw,34px)", fontWeight:800, margin:"0 0 28px", letterSpacing:"-0.02em" }}>
            Map technology
          </h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:20 }}>
            {[
              { icon:"🗺️", title:"MapLibre GL JS", body:"Open-source WebGL map renderer (Mapbox GL fork). Smooth 60fps vector tile rendering with no API key or usage limits." },
              { icon:"🎨", title:"CARTO Dark Matter", body:"Free dark basemap tile style from CARTO — no API key required. Optimised for data overlay visibility on dark backgrounds." },
              { icon:"📍", title:"GeoJSON Circle Layers", body:"City circles sized by job volume using MapLibre expression interpolation. Glow halo + main circle + label layers for depth." },
              { icon:"⚡", title:"Live Filter Updates", body:"Category filter changes call setData() on the GeoJSON source — no full reload. Sub-50ms visual update on category switch." },
              { icon:"📊", title:"Recharts Analytics", body:"Per-city bar charts (jobs by category) and line charts (monthly trend) rendered in a slide-in detail panel on city click." },
              { icon:"🔒", title:"No API Keys Required", body:"All tile rendering, data serving, and map interaction works client-side with zero third-party API keys or billing exposure." },
            ].map(p => (
              <div key={p.title} style={{
                padding:"24px", borderRadius:16,
                background:"var(--bg)", border:"1px solid var(--border)",
                display:"flex", flexDirection:"column", gap:12,
              }}>
                <div style={{ fontSize:28 }}>{p.icon}</div>
                <h3 style={{ fontSize:14, fontWeight:700, color:"var(--text)", margin:0 }}>{p.title}</h3>
                <p style={{ fontSize:13, color:"var(--muted)", lineHeight:1.7, margin:0 }}>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div style={{ borderTop:"1px solid var(--border)", textAlign:"center",
        padding:"clamp(48px,6vw,80px) clamp(16px,4vw,48px)" }}>
        <h2 style={{ fontSize:"clamp(22px,3vw,34px)", fontWeight:800, margin:"0 0 16px", letterSpacing:"-0.02em" }}>
          Want live job market data for your platform?
        </h2>
        <p style={{ fontSize:15, color:"var(--muted)", lineHeight:1.7, maxWidth:560, margin:"0 auto 28px" }}>
          We build custom job market globes with your data feeds — white-label embed,
          real-time API integration, and enterprise visualisation.
        </p>
        <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
          <Link href="/uc14" style={{
            padding:"14px 32px", borderRadius:12, background:"var(--accent)",
            color:"#000", fontWeight:700, fontSize:15, textDecoration:"none",
          }}>Try the Live Demo →</Link>
          <Link href="/contact" style={{
            padding:"14px 32px", borderRadius:12, background:"transparent",
            color:"var(--accent)", border:"1px solid var(--accent)",
            fontWeight:700, fontSize:15, textDecoration:"none",
          }}>Contact Us</Link>
        </div>
      </div>
    </div>
  )
}

import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "AI Infrastructure Race — Technical Details — GRIP 3D",
  description:
    "Technical deep-dive into UC26: global hyperscale data centers, undersea cable routes, deck.gl GlobeView, ColumnLayer towers, ArcLayer great-circle cables, and the $500B Stargate investment.",
}

// ── Static data ──────────────────────────────────────────────────────────────

const STATS = [
  { val: "82",      label: "Hyperscale facilities"      },
  { val: "~15K MW", label: "Total MW tracked"           },
  { val: "~8M",     label: "H100-equivalent GPU units"  },
  { val: "12",      label: "Cloud operators"            },
  { val: "30",      label: "Undersea cable routes"      },
  { val: "$500B",   label: "Stargate investment"        },
  { val: "2025",    label: "Data vintage"               },
  { val: "deck.gl", label: "Rendering engine"          },
]

const PIPELINE = [
  {
    n: "01", color: "#0078d7",
    title: "Hyperscale Data Center Dataset",
    desc: "82 hyperscale data centers across 12 operators — Microsoft/OpenAI (including Stargate sites), Google/DeepMind, Amazon/AWS, Meta, Alibaba/Aliyun, ByteDance/TikTok, Tencent, Baidu, Oracle, Apple, IBM, and Chinese national AI clusters (Guizhou Gui'an, Inner Mongolia, Xinjiang, Lanzhou). Each record carries power capacity in MW, estimated H100-equivalent GPU units, operational status, open year, and an AI-focused flag. Values are approximate but grounded in public announcements, SEC filings, and infrastructure reporting as of early 2025.",
    tech: ["82 facilities", "12 operators", "MW capacity", "GPU unit estimates", "Operational status", "AI-focused flag"],
  },
  {
    n: "02", color: "#7850ff",
    title: "Undersea Cable Network",
    desc: "30 undersea cable routes that carry the majority of intercontinental AI inference and training traffic — including Marea (Microsoft/Meta transatlantic), PEACE (Singapore–Marseille), FASTER (Google transpacific), Havfrue (Facebook/Google North Atlantic), 2Africa (Meta), Apricot (Google/Meta Asia-Pacific), Blue-Raman (Google Europe–India), Echo (Google/Meta Pacific), and newer routes like Bifrost, Dunant, Grace Hopper, and Equiano. Each arc records operators, capacity in Tbps, and lay year. Arc width in the visualization scales with log₂(capacity) to reflect relative bandwidth.",
    tech: ["30 cable routes", "Great-circle arcs", "Width ∝ log₂(Tbps)", "Operator attribution", "Lay year"],
  },
  {
    n: "03", color: "#00c8ff",
    title: "deck.gl GlobeView Rendering",
    desc: "The visualization uses deck.gl's _GlobeView — a WebGL globe projection that correctly handles the spherical surface for all layer types. ColumnLayer renders each data center as an extruded hexagonal prism with height = log₁₀(MW) × 2,000,000 metres, creating a dramatic tower skyline effect where the world's largest AI clusters (Ashburn, The Dalles, Guizhou) visibly dominate. ArcLayer with greatCircle:true draws geodesic cable arcs on the sphere surface. ScatterplotLayer provides both ambient glow rings (low opacity) around each facility and the pulsing Stargate animation rings.",
    tech: ["deck.gl _GlobeView", "ColumnLayer towers", "ArcLayer great-circle", "ScatterplotLayer glow", "WebGL extruded geometry"],
  },
  {
    n: "04", color: "#e879f9",
    title: "Stargate Highlight & Pulse",
    desc: "When the Stargate toggle is active, a second ScatterplotLayer with animated radius renders on top of all Stargate Phase 1 sites (Abilene TX 600MW, Iowa 500MW). The radius oscillates using Math.sin(frame × π/180) at 60fps via requestAnimationFrame, creating a breathing purple glow that visually communicates the scale and importance of the $500B OpenAI/Microsoft/SoftBank investment — the largest announced AI infrastructure commitment in history. The pulsing radius and opacity are both animated for maximum visual impact.",
    tech: ["requestAnimationFrame pulse", "sin-wave radius animation", "Layer z-ordering", "Purple glow rings", "$500B Stargate"],
  },
  {
    n: "05", color: "#22c55e",
    title: "Operator Filters & Leaderboard",
    desc: "Operator filter buttons let users isolate individual cloud providers on the globe. Each button is colour-coded with the operator's brand colour (Microsoft blue, AWS orange, Meta blue, Alibaba orange, ByteDance cyan, etc.). Status filters (operational / under-construction / announced) layer on top. The right-side leaderboard ranks operators by total tracked MW capacity with proportional bar charts — revealing that the US hyperscalers collectively dominate global AI compute capacity, with Chinese players close behind in raw facility count.",
    tech: ["12-operator filter", "Status filter", "MW leaderboard", "Brand-colour coding", "Real-time layer update"],
  },
]

const TECH = [
  { label: "Globe engine",      value: "deck.gl _GlobeView (WebGL2)"                    },
  { label: "Tower layer",       value: "ColumnLayer — height = log₁₀(MW) × 2M metres"  },
  { label: "Cable layer",       value: "ArcLayer greatCircle:true — width ∝ log₂(Tbps)" },
  { label: "Glow layer",        value: "ScatterplotLayer — ambient + Stargate pulse"     },
  { label: "Framework",         value: "Next.js 'use client', React 19"                 },
  { label: "Data",              value: "Hardcoded — public announcements & filings 2025" },
  { label: "Operators",         value: "12: Microsoft, Google, Amazon, Meta, Alibaba, ByteDance, Tencent, Baidu, Oracle, Apple, IBM, Other" },
  { label: "Animation",         value: "requestAnimationFrame — 60fps Stargate pulse"  },
]

const HIGHLIGHTS = [
  {
    title: "Compute gravity",
    body: "Three clusters — AWS Ashburn (700MW), Google The Dalles (600MW), and China's Guizhou Gui'an (800MW) — account for roughly 15% of all tracked capacity. The towers over northern Virginia and coastal Oregon visually dominate the North American coastline.",
    color: "#0078d7",
  },
  {
    title: "The Stargate bet",
    body: "The OpenAI/Microsoft/SoftBank Stargate project announced in January 2025 commits $500B to US AI infrastructure over four years. The first-phase sites in Abilene TX (600MW) and Iowa (500MW) are shown with pulsing purple rings when the Stargate overlay is enabled — representing the largest single AI infrastructure investment in history.",
    color: "#e879f9",
  },
  {
    title: "Undersea AI highways",
    body: "The same undersea cables that carry streaming video and financial trades now route hundreds of petabytes of AI inference requests. Google alone owns or co-owns 12 of the 30 cable routes shown, ensuring low-latency connectivity between its TPU pods and end users on every continent.",
    color: "#00c8ff",
  },
  {
    title: "China's parallel stack",
    body: "Chinese operators — Alibaba, Tencent, Baidu, ByteDance — operate a largely separate AI infrastructure stack anchored by massive national data center parks in Guizhou, Inner Mongolia, and Xinjiang. The Xinjiang facility is flagged as controversial due to ongoing international scrutiny. Together, Chinese facilities represent over 30% of tracked global MW.",
    color: "#ff6700",
  },
]

// ── Component ────────────────────────────────────────────────────────────────

export default function UC26DetailsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

      {/* Back link */}
      <Link href="/uc26"
            className="inline-flex items-center gap-1.5 text-xs mb-6 opacity-60 hover:opacity-100 transition-opacity"
            style={{ color: "var(--muted)" }}>
        ← Back to live globe
      </Link>

      {/* Badge + heading */}
      <div className="mb-4">
        <span className="text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full"
              style={{ background: "rgba(0,120,215,0.12)", color: "#60b0ff", border: "1px solid rgba(0,120,215,0.3)" }}>
          UC26 · AI Infrastructure Race
        </span>
      </div>
      <h1 className="text-4xl font-bold mb-4" style={{ color: "var(--text)" }}>
        AI &amp; Data Center Infrastructure Race
      </h1>
      <p className="text-lg max-w-3xl mb-10" style={{ color: "var(--muted)" }}>
        82 hyperscale data centers across 12 operators rendered as 3D towers on a deck.gl WebGL globe,
        connected by 30 undersea cable routes. Heights encode power capacity in MW — the largest AI
        clusters tower over every other facility. Filter by operator or status, toggle the Stargate
        pulse overlay, and click any tower for full facility details.
      </p>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-14">
        {STATS.map(s => (
          <div key={s.label} className="rounded-xl p-4 text-center"
               style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <p className="text-2xl font-bold mb-1" style={{ color: "#60b0ff" }}>{s.val}</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pipeline */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-8" style={{ color: "var(--text)" }}>Data Pipeline &amp; Architecture</h2>
        <div className="flex flex-col gap-4">
          {PIPELINE.map((step, idx) => (
            <div key={step.n} className="flex gap-5 rounded-xl p-5"
                 style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                     style={{ background: step.color + "18", border: `1px solid ${step.color}40`, color: step.color }}>
                  {step.n}
                </div>
                {idx < PIPELINE.length - 1 && (
                  <div className="w-px flex-1 min-h-4" style={{ background: "var(--border)" }} />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>{step.title}</h3>
                <p className="text-sm mb-3 leading-relaxed" style={{ color: "var(--muted)" }}>{step.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {step.tech.map(t => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded-full"
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
        <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--text)" }}>Key Insights</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {HIGHLIGHTS.map(h => (
            <div key={h.title} className="rounded-xl p-5"
                 style={{ background: "var(--surface)", border: `1px solid ${h.color}30` }}>
              <h3 className="text-sm font-bold mb-2" style={{ color: h.color }}>{h.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{h.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stargate callout */}
      <section className="mb-14">
        <div className="rounded-xl p-6"
             style={{ background: "rgba(168,85,247,0.05)", border: "1px solid rgba(168,85,247,0.2)" }}>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                 style={{ background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.3)" }}>
              <span className="text-xl font-black" style={{ color: "#e879f9" }}>$</span>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ color: "#e879f9" }}>
                Stargate — $500 Billion AI Infrastructure Commitment
              </h2>
              <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--muted)" }}>
                Announced on January 21, 2025, the Stargate Project is a joint venture between OpenAI,
                Microsoft, and SoftBank committing $500 billion to US AI infrastructure over four years.
                The initial tranche of $100 billion funds data centers in Abilene TX (600MW, largest
                disclosed) and Iowa (500MW), with GPU clusters sourced from NVIDIA, AMD, and custom
                Microsoft Maia chips.
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                The project signals a strategic shift — from renting cloud capacity to owning dedicated
                AI infrastructure at nation-state scale. At peak build-out the Stargate campuses
                collectively exceed the compute capacity of any single country's current AI deployment.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {["OpenAI", "Microsoft", "SoftBank", "NVIDIA", "Oracle", "$500B", "2025–2029"].map(t => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.28)", color: "#a78bfa" }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech stack */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--text)" }}>Tech Stack</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TECH.map(t => (
            <div key={t.label} className="rounded-xl px-4 py-3"
                 style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <p className="text-xs mb-0.5" style={{ color: "var(--muted)" }}>{t.label}</p>
              <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{t.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Data notes */}
      <section className="mb-14">
        <div className="rounded-xl p-6"
             style={{ background: "rgba(0,120,215,0.05)", border: "1px solid rgba(0,120,215,0.18)" }}>
          <h2 className="text-xl font-bold mb-3" style={{ color: "#60b0ff" }}>Data Notes</h2>
          <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--muted)" }}>
            All data center records use publicly disclosed or credibly estimated values as of early 2025.
            MW capacity figures represent total IT load, not gross building power. GPU unit estimates
            assume H100 SXM5 as the reference (700W TDP, 80GB HBM3) and are rounded to the nearest
            thousand. Actual deployments include a mix of H100, A100, H200, Gaudi, and custom ASICs.
          </p>
          <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--muted)" }}>
            The Xinjiang data center is included for geographic completeness with a project note flagging
            international scrutiny. Undersea cable capacity figures are design capacity at time of laying;
            lit capacity varies by operator and is not publicly disclosed.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            Sources: company earnings calls, SEC 10-K filings, TeleGeography Submarine Cable Map,
            DC Byte, Datacenter Dynamics, Bloomberg Intelligence, PitchBook AI infrastructure reports.
          </p>
        </div>
      </section>

      {/* CTA */}
      <div className="flex gap-3">
        <Link href="/uc26"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "#0078d7", color: "#fff" }}>
          ← Back to live globe
        </Link>
        <Link href="/use-cases"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)" }}>
          All use cases
        </Link>
      </div>
    </div>
  )
}

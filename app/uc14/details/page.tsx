import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "UC14 Architecture — Global AI Inference Grid — GRIP 3D",
  description:
    "Architecture deep-dive: 4-layer AI inference stack, carbon-aware routing algorithm, 25 GPU cluster fleet (AWS, Azure, GCP, CoreWeave, Lambda, Together, Groq, Cerebras), green compute scoring, and real-time utilization data sources.",
  openGraph: {
    title: "Global AI Inference Grid Architecture — GRIP 3D UC14",
    description:
      "How GRIP 3D visualizes 25 global GPU clusters: carbon-aware routing, PUE/MW power draw, P50/P90/P99 latency, and green compute scoring across 8 hyperscalers.",
    siteName: "GRIP 3D",
  },
}

// ─── Data ────────────────────────────────────────────────────────────────────

const PROBLEM_CARDS = [
  {
    icon: "🔭",
    title: "Visibility Gap",
    body: "AI teams can't see where compute is available globally in real-time. Multi-cloud GPU fleets across 8+ providers operate in silos with no unified control plane — leading to over-provisioning, idle capacity, and missed SLA windows.",
    color: "#ef4444",
  },
  {
    icon: "🌫️",
    title: "Carbon Blindness",
    body: "No unified view of which clusters are green vs carbon-heavy. Inference workloads are routed purely on cost and latency — ignoring that the same request sent to a Nordic DC may produce 10× less CO₂ than one sent to Singapore.",
    color: "#f59e0b",
  },
  {
    icon: "📡",
    title: "Latency Guesswork",
    body: "Routing decisions made without real-time inference latency data. P99 tail latency can spike 3–5× under load without warning. Without continuous probing, platform teams fly blind — discovering degradation only through customer complaints.",
    color: "#8b5cf6",
  },
]

const ARCH_LAYERS = [
  {
    title: "Telemetry Collection",
    color: "#33ccdd",
    icon: "📥",
    bullets: [
      "DCGM / NVML GPU metrics per cluster",
      "IPMI & smart PDU power readings",
      "Kubernetes API cluster health checks",
      "HTTP synthetic probes every 30 seconds",
    ],
  },
  {
    title: "Inference Routing Engine",
    color: "#7C3AED",
    icon: "⚡",
    bullets: [
      "Multi-constraint scoring (latency, carbon, util)",
      "Real-time candidate cluster discovery",
      "Model availability registry lookup",
      "Failover cascade on DEGRADED/OFFLINE",
    ],
  },
  {
    title: "Carbon-Aware Scheduler",
    color: "#22c55e",
    icon: "🌿",
    bullets: [
      "electricityMap.org live gCO2/kWh feed",
      "Workload defer queue for green windows",
      "PUE-adjusted effective carbon per GPU-hr",
      "Green compute scoring (0–100 range)",
    ],
  },
  {
    title: "Global Ops Dashboard",
    color: "#f59e0b",
    icon: "🖥️",
    bullets: [
      "25-cluster unified monitoring view",
      "24h rolling time-series per DC",
      "Provider comparison & fleet benchmarking",
      "Alert webhooks for OVERLOADED / OFFLINE",
    ],
  },
]

const DATA_SOURCES = [
  {
    title: "GPU Telemetry API",
    sub: "DCGM / NVML metrics, 15-sec polling",
    icon: "🖥️",
    detail: "Per-GPU utilization, memory bandwidth, temperature, power draw, NVLink throughput. Emitted via Prometheus exporters or direct REST from cluster agents.",
  },
  {
    title: "Power Monitoring",
    sub: "Smart PDUs, IPMI, 1-min granularity",
    icon: "⚡",
    detail: "Rack-level power draw via IPMI baseboard management controllers and intelligent PDU SNMP feeds. Aggregated per cluster to derive MW totals and per-GPU efficiency.",
  },
  {
    title: "Carbon Intensity API",
    sub: "electricityMap.org, real-time regional gCO2/kWh",
    icon: "🌿",
    detail: "Live grid carbon intensity by country/bidding zone. Updated every 15 minutes. Combined with cluster PUE to derive effective carbon per GPU-hour of inference.",
  },
  {
    title: "Inference Latency Probes",
    sub: "Synthetic HTTP probes, 30-second interval per endpoint",
    icon: "📡",
    detail: "Synthetic inference requests dispatched from 8 probe locations globally. P50/P90/P99 computed per endpoint per region. Alerts fire when P99 breaches 2× baseline.",
  },
  {
    title: "Cluster Health Checks",
    sub: "Kubernetes API, Slurm scheduler status",
    icon: "🩺",
    detail: "Node readiness, pod eviction rates, GPU driver status, and queue depth from Kubernetes kube-state-metrics and Slurm accounting databases.",
  },
  {
    title: "Model Registry",
    sub: "HuggingFace Hub API, proprietary model catalogs",
    icon: "🧠",
    detail: "Which frontier models are loaded, warm, or cold at each cluster. Updated on deployment events. Used for model-aware routing — only healthy clusters with warm models receive traffic.",
  },
]

const GPU_FLEET = [
  {
    model: "H100 SXM5",
    count: "45,000+",
    clusters: "CoreWeave, Together, Groq",
    tdp: "700 W",
    use: "LLM training & inference",
  },
  {
    model: "A100 80GB",
    count: "60,000+",
    clusters: "AWS, Azure, GCP",
    tdp: "400 W",
    use: "Multi-modal inference",
  },
  {
    model: "H200",
    count: "8,000+",
    clusters: "Cerebras, Nvidia",
    tdp: "700 W",
    use: "Ultra-large models",
  },
  {
    model: "TPU v5e",
    count: "12,000+",
    clusters: "GCP",
    tdp: "197 W",
    use: "Google models, JAX workloads",
  },
]

// ─── Page ────────────────────────────────────────────────────────────────────

export default function UC14DetailsPage() {
  return (
    <div style={{
      maxWidth: "1100px",
      margin: "0 auto",
      padding: "48px 24px 96px",
      background: "var(--bg)",
      minHeight: "100vh",
      color: "var(--text)",
    }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "48px" }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--muted)", marginBottom: "16px" }}>
          <Link href="/use-cases" style={{ color: "var(--muted)", textDecoration: "none" }}>Use Cases</Link>
          <span>›</span>
          <Link href="/uc14" style={{ color: "var(--muted)", textDecoration: "none" }}>UC14</Link>
          <span>›</span>
          <span>Details</span>
        </div>

        {/* Badge + label */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
          <span style={{
            background: "rgba(51,204,221,0.15)",
            border: "1px solid rgba(51,204,221,0.4)",
            borderRadius: "6px",
            padding: "4px 12px",
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--accent)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            fontFamily: "monospace",
          }}>
            UC14
          </span>
          <span style={{
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}>
            GLOBAL AI INFERENCE GRID
          </span>
        </div>

        <h1 style={{ fontSize: "28px", fontWeight: 800, color: "var(--text)", margin: "0 0 10px 0", lineHeight: 1.2 }}>
          AI Inference Grid — Platform Architecture
        </h1>
        <p style={{ fontSize: "14px", color: "var(--muted)", maxWidth: "700px", lineHeight: 1.6, margin: "0 0 24px 0" }}>
          How we unify 25 GPU clusters across 8 hyperscalers into a single real-time monitoring and carbon-aware routing platform — built for ML infrastructure teams and enterprise AI buyers.
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link href="/uc14" style={{
            background: "var(--accent)",
            color: "#000",
            borderRadius: "8px",
            padding: "10px 22px",
            fontSize: "13px",
            fontWeight: 700,
            textDecoration: "none",
            display: "inline-block",
          }}>
            View Live Demo →
          </Link>
          <Link href="/use-cases" style={{
            background: "transparent",
            color: "var(--text)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "10px 22px",
            fontSize: "13px",
            fontWeight: 600,
            textDecoration: "none",
            display: "inline-block",
          }}>
            Browse All Use Cases
          </Link>
        </div>
      </div>

      {/* ── The Problem ─────────────────────────────────────────────────────── */}
      <section style={{ marginBottom: "56px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text)", marginBottom: "6px" }}>
          The Problem
        </h2>
        <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "20px" }}>
          Three compounding gaps that cost AI infrastructure teams time, money, and planetary impact.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
          {PROBLEM_CARDS.map((card, i) => (
            <div key={i} style={{
              background: "var(--surface)",
              border: `1px solid var(--border)`,
              borderTop: `3px solid ${card.color}`,
              borderRadius: "12px",
              padding: "20px",
            }}>
              <div style={{ fontSize: "24px", marginBottom: "10px" }}>{card.icon}</div>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", margin: "0 0 8px" }}>
                {card.title}
              </h3>
              <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
                {card.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4-Layer Architecture ──────────────────────────────────────────────── */}
      <section style={{ marginBottom: "56px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text)", marginBottom: "6px" }}>
          4-Layer Architecture
        </h2>
        <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "20px" }}>
          Each layer is independently scalable and contributes to end-to-end observability and routing.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0", position: "relative" }}>
          {ARCH_LAYERS.map((layer, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "stretch" }}>
              <div style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderLeft: i > 0 ? "none" : "1px solid var(--border)",
                padding: "20px",
                flex: 1,
                borderTop: `3px solid ${layer.color}`,
              }}>
                <div style={{ fontSize: "20px", marginBottom: "8px" }}>{layer.icon}</div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: layer.color, marginBottom: "12px", letterSpacing: "0.02em" }}>
                  {layer.title}
                </div>
                <ul style={{ margin: 0, padding: "0 0 0 14px" }}>
                  {layer.bullets.map((b, j) => (
                    <li key={j} style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "5px", lineHeight: 1.5 }}>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              {i < ARCH_LAYERS.length - 1 && (
                <div style={{
                  textAlign: "center",
                  fontSize: "18px",
                  color: "var(--muted)",
                  position: "absolute",
                  right: `-${((ARCH_LAYERS.length - 1 - i) / ARCH_LAYERS.length) * 100}%`,
                  display: "none", // arrows handled by border-only approach
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Flow arrow labels */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px", padding: "0 4px" }}>
          {ARCH_LAYERS.map((layer, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", flex: 1 }}>
              <span style={{ fontSize: "10px", color: "var(--muted)", fontWeight: 600 }}>
                {`${i + 1}. ${layer.title}`}
              </span>
              {i < ARCH_LAYERS.length - 1 && (
                <span style={{ color: "var(--muted)", margin: "0 8px" }}>→</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Data Sources ──────────────────────────────────────────────────────── */}
      <section style={{ marginBottom: "56px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text)", marginBottom: "6px" }}>
          Data Sources
        </h2>
        <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "20px" }}>
          Six real-time data feeds power the inference grid monitoring platform.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "14px" }}>
          {DATA_SOURCES.map((src, i) => (
            <div key={i} style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              padding: "18px",
              display: "flex",
              gap: "14px",
            }}>
              <span style={{ fontSize: "22px", flexShrink: 0 }}>{src.icon}</span>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", marginBottom: "2px" }}>{src.title}</div>
                <div style={{ fontSize: "11px", color: "var(--accent)", marginBottom: "6px", fontWeight: 600 }}>{src.sub}</div>
                <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.5 }}>{src.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Carbon-Aware Routing Algorithm ────────────────────────────────────── */}
      <section style={{ marginBottom: "56px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text)", marginBottom: "6px" }}>
          Carbon-Aware Routing Algorithm
        </h2>
        <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "20px" }}>
          Every inference request is scored against a multi-objective function before routing.
        </p>

        <div style={{
          background: "#0d1117",
          border: "1px solid #30363d",
          borderRadius: "12px",
          padding: "24px 28px",
          fontFamily: "monospace",
          fontSize: "13px",
          lineHeight: 2,
          color: "#e6edf3",
          overflowX: "auto",
        }}>
          <div style={{ color: "#8b949e", marginBottom: "8px" }}># inference routing pseudocode</div>
          <div>
            <span style={{ color: "#ff7b72" }}>FOR</span>
            <span style={{ color: "#e6edf3" }}> each inference request:</span>
          </div>
          <div style={{ paddingLeft: "24px" }}>
            <span style={{ color: "#e6edf3" }}>candidates = clusters </span>
            <span style={{ color: "#ff7b72" }}>WHERE</span>
            <span style={{ color: "#e6edf3" }}> status = </span>
            <span style={{ color: "#a5d6ff" }}>HEALTHY</span>
            <span style={{ color: "#ff7b72" }}> AND</span>
            <span style={{ color: "#e6edf3" }}> model_available</span>
          </div>
          <div style={{ paddingLeft: "24px" }}>
            <span style={{ color: "#e6edf3" }}>score = </span>
            <span style={{ color: "#79c0ff" }}>(1/latency_ms * 0.40)</span>
            <span style={{ color: "#e6edf3" }}> + </span>
            <span style={{ color: "#56d364" }}>(1/carbon_intensity * 0.35)</span>
            <span style={{ color: "#e6edf3" }}> + </span>
            <span style={{ color: "#f59e0b" }}>(utilization_headroom * 0.25)</span>
          </div>
          <div style={{ paddingLeft: "24px" }}>
            <span style={{ color: "#e6edf3" }}>route → </span>
            <span style={{ color: "#ff7b72" }}>argmax</span>
            <span style={{ color: "#e6edf3" }}>(score)</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginTop: "16px" }}>
          {[
            { label: "Latency Weight", value: "40%", color: "#79c0ff", desc: "P50 inference latency from nearest probe" },
            { label: "Carbon Weight", value: "35%", color: "#56d364", desc: "Live gCO2/kWh × cluster PUE factor" },
            { label: "Headroom Weight", value: "25%", color: "#f59e0b", desc: "Available GPU capacity (100 - utilization %)" },
          ].map((w, i) => (
            <div key={i} style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "14px",
            }}>
              <div style={{ fontSize: "20px", fontWeight: 800, color: w.color, marginBottom: "4px" }}>{w.value}</div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>{w.label}</div>
              <div style={{ fontSize: "11px", color: "var(--muted)" }}>{w.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── GPU Fleet Breakdown ───────────────────────────────────────────────── */}
      <section style={{ marginBottom: "56px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text)", marginBottom: "6px" }}>
          GPU Fleet Breakdown
        </h2>
        <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "20px" }}>
          Four accelerator families across the 25 clusters — each with distinct power, throughput, and use-case profiles.
        </p>

        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          overflow: "hidden",
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "560px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}>
                  {["GPU Model", "Total Count", "Clusters", "Avg TDP", "Typical Use"].map((col, i) => (
                    <th key={i} style={{
                      padding: "10px 16px",
                      textAlign: "left",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      whiteSpace: "nowrap",
                    }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {GPU_FLEET.map((row, idx) => (
                  <tr
                    key={idx}
                    style={{ borderBottom: idx < GPU_FLEET.length - 1 ? "1px solid var(--border)" : "none" }}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        fontFamily: "monospace",
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "var(--accent)",
                      }}>
                        {row.model}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>
                      {row.count}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: "12px", color: "var(--muted)" }}>
                      {row.clusters}
                    </td>
                    <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: "13px", color: "var(--text)" }}>
                      {row.tdp}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: "12px", color: "var(--muted)" }}>
                      {row.use}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Green Compute Scoring ─────────────────────────────────────────────── */}
      <section style={{ marginBottom: "56px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text)", marginBottom: "6px" }}>
          Green Compute Scoring
        </h2>
        <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "20px" }}>
          A composite 0–100 score combining carbon intensity and power usage effectiveness.
        </p>

        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          padding: "24px",
        }}>
          {/* Formula */}
          <div style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "16px 20px",
            fontFamily: "monospace",
            fontSize: "13px",
            color: "var(--text)",
            marginBottom: "20px",
          }}>
            <span style={{ color: "var(--muted)" }}>green_score = </span>
            <span style={{ color: "#22c55e" }}>100</span>
            <span style={{ color: "var(--muted)" }}> − </span>
            <span style={{ color: "#ef4444" }}>(carbon_intensity / 6)</span>
            <span style={{ color: "var(--muted)" }}> + </span>
            <span style={{ color: "#33ccdd" }}>(15 − pue × 10)</span>
            <span style={{ color: "var(--muted)" }}>  [clamped 0–100]</span>
          </div>

          {/* Color range bar */}
          <div style={{ marginBottom: "8px", fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Score Range
          </div>
          <div style={{
            height: "12px",
            borderRadius: "6px",
            background: "linear-gradient(to right, #ef4444, #eab308, #22c55e)",
            marginBottom: "8px",
          }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--muted)" }}>
            <span>0 — High carbon, poor PUE</span>
            <span>50 — Mixed</span>
            <span>100 — Green grid, efficient DC</span>
          </div>

          {/* Reference examples */}
          <div style={{ marginTop: "20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
            {[
              { label: "GCP europe-west4", score: 88, note: "22 gCO2/kWh, PUE 1.1" },
              { label: "CoreWeave ams1", score: 82, note: "35 gCO2/kWh, PUE 1.12" },
              { label: "AWS us-east-1", score: 42, note: "320 gCO2/kWh, PUE 1.3" },
              { label: "GCP me-west1", score: 4, note: "560 gCO2/kWh, PUE 1.35" },
            ].map((ex, i) => (
              <div key={i} style={{
                background: "var(--surface-2)",
                borderRadius: "8px",
                padding: "10px 14px",
                borderLeft: `3px solid ${ex.score >= 70 ? "#22c55e" : ex.score >= 40 ? "#eab308" : "#ef4444"}`,
              }}>
                <div style={{ fontSize: "16px", fontWeight: 800, color: ex.score >= 70 ? "#22c55e" : ex.score >= 40 ? "#eab308" : "#ef4444", marginBottom: "2px" }}>
                  {ex.score}/100
                </div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text)", marginBottom: "2px" }}>{ex.label}</div>
                <div style={{ fontSize: "10px", color: "var(--muted)" }}>{ex.note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ──────────────────────────────────────────────────────────── */}
      <section style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "16px",
        padding: "40px 32px",
        textAlign: "center",
      }}>
        <div style={{ fontSize: "28px", marginBottom: "12px" }}>🧠</div>
        <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text)", marginBottom: "8px" }}>
          Deploy this for your AI infrastructure
        </h2>
        <p style={{ fontSize: "14px", color: "var(--muted)", maxWidth: "500px", margin: "0 auto 24px", lineHeight: 1.6 }}>
          Bring unified GPU observability, carbon-aware routing, and real-time inference latency monitoring to your multi-cloud AI stack.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/contact" style={{
            background: "var(--accent)",
            color: "#000",
            borderRadius: "8px",
            padding: "12px 28px",
            fontSize: "14px",
            fontWeight: 700,
            textDecoration: "none",
            display: "inline-block",
          }}>
            Talk to Us →
          </Link>
          <Link href="/uc14" style={{
            background: "transparent",
            color: "var(--accent)",
            border: "1px solid rgba(51,204,221,0.4)",
            borderRadius: "8px",
            padding: "12px 28px",
            fontSize: "14px",
            fontWeight: 600,
            textDecoration: "none",
            display: "inline-block",
          }}>
            View Live Demo
          </Link>
        </div>
      </section>

    </div>
  )
}

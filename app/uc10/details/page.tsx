import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "UC10 Architecture — NTN E2E Service Assurance — GRIP 3D",
  description:
    "Deep-dive into the 4-domain NTN architecture: Kuiper LEO fleet, 5 Canadian ground stations (ACU/Beacon/Signal Analyzer/BPMS), 18 3GPP RAN KPIs, EPC Core, and the RTPM C/C++ → PostgreSQL → Grafana micro KPI pipeline with decentralized mesh replication.",
  openGraph: {
    title: "NTN E2E Service Assurance Architecture — GRIP 3D UC10",
    description:
      "Technical architecture: Kuiper LEO satellites, 5-site Canadian ground station mesh, 18 eNB 3GPP KPIs, EPC Core domains, and real-time 1-min RTPM pipeline.",
    siteName: "GRIP 3D",
  },
}

// ── Helpers ────────────────────────────────────────────────────────────────

const SATELLITES = Array.from({ length: 12 }, (_, i) => `KUIPER-K${String(i + 1).padStart(3, "0")}`)

const RAN_KPIS = [
  // Accessibility
  { name: "RRC Setup SR", ref: "RRCConnEstabSucc / RRCConnEstabAtt", threshold: "> 99%", domain: "Accessibility" },
  { name: "E-RAB Setup SR", ref: "ErabEstabSuccNbr / ErabEstabAttNbr", threshold: "> 99%", domain: "Accessibility" },
  { name: "RRC Connection Count", ref: "RRCConnMean", threshold: "> 0", domain: "Accessibility" },
  { name: "Handover SR", ref: "HoExeSucc / HoExeAtt", threshold: "> 95%", domain: "Accessibility" },
  // Retainability
  { name: "Call Drop Rate", ref: "RRCConnReEstabAtt / RRCConnMean", threshold: "< 0.5%", domain: "Retainability" },
  { name: "E-RAB Drop Rate", ref: "ErabRelAbnormalNbr / ErabRelTotal", threshold: "< 0.5%", domain: "Retainability" },
  { name: "Cell Availability", ref: "CellAvail / CellTotalTime", threshold: "> 99%", domain: "Retainability" },
  // Quality
  { name: "DL Throughput", ref: "ThpVolDl / ThpTimeDl", threshold: "> 50 Mbps", domain: "Quality" },
  { name: "UL Throughput", ref: "ThpVolUl / ThpTimeUl", threshold: "> 15 Mbps", domain: "Quality" },
  { name: "Latency", ref: "mean(PacketDelay)", threshold: "< 50ms", domain: "Quality" },
  { name: "Packet Loss", ref: "DlPdcpSduLoss / DlPdcpSduTotal", threshold: "< 1%", domain: "Quality" },
  // Signal
  { name: "RSRP", ref: "mean(L.Thrp.bits.DL.RSRP)", threshold: "> -100 dBm", domain: "Signal" },
  { name: "RSRQ", ref: "mean(L.Thrp.bits.DL.RSRQ)", threshold: "> -12 dB", domain: "Signal" },
  { name: "SINR", ref: "mean(L.Thrp.bits.DL.SINR)", threshold: "> 5 dB", domain: "Signal" },
  { name: "CQI", ref: "mean(L.ChMeas.CQI.Avg)", threshold: "> 8", domain: "Signal" },
  // Core
  { name: "PDP Activation", ref: "PdpActSuccNbr / PdpActAttNbr", threshold: "> 99%", domain: "Core" },
  { name: "MME Attach SR", ref: "AttachSuccNbr / AttachAttNbr", threshold: "> 99%", domain: "Core" },
  { name: "SGW/PGW Session", ref: "SessEstabSucc / SessEstabAtt", threshold: "> 98.5%", domain: "Core" },
]

const DOMAIN_COLORS: Record<string, string> = {
  Accessibility: "#60a5fa",
  Retainability: "#34d399",
  Quality: "#fb923c",
  Signal: "#a78bfa",
  Core: "#f472b6",
}

const GROUND_SITES = [
  { id: "GS-TORONTO", city: "Toronto", color: "#60a5fa" },
  { id: "GS-OTTAWA", city: "Ottawa", color: "#34d399" },
  { id: "GS-CALGARY", city: "Calgary", color: "#fb923c" },
  { id: "GS-VANCOUVER", city: "Vancouver", color: "#c084fc" },
  { id: "GS-MONTREAL", city: "Montreal", color: "#f472b6" },
]

const PIPELINE_STAGES = [
  {
    title: "eNB PM Files",
    color: "#60a5fa",
    lines: ["3GPP TS 32.425 counters", "1-min granularity", "XML/CSV format", "~2MB / file"],
  },
  {
    title: "C/C++ PM Parser",
    color: "#a78bfa",
    lines: ["Zero-copy file reader", "Regex counter extraction", "~50µs/record", "Multi-threaded"],
  },
  {
    title: "Counter Aggregator",
    color: "#34d399",
    lines: ["KPI formula engine", "Threshold evaluator", "Alert generator", "18 KPI formulas"],
  },
  {
    title: "PostgreSQL TSDB",
    color: "#fb923c",
    lines: ["TimescaleDB hypertable", "Auto-compression", "90-day retention", "5-node mesh repl."],
  },
  {
    title: "Grafana Dashboard",
    color: "#f472b6",
    lines: ["Live panels", "1-min refresh rate", "Alerting webhooks", "API data export"],
  },
]

// ── Page ────────────────────────────────────────────────────────────────────

export default function UC10DetailsPage() {
  return (
    <div
      style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "48px 24px 96px",
        background: "var(--bg)",
        minHeight: "100vh",
        color: "var(--text)",
      }}
    >
      {/* ── Header ── */}
      <div style={{ marginBottom: "40px" }}>
        {/* Breadcrumb */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
            color: "var(--muted)",
            marginBottom: "16px",
          }}
        >
          <Link href="/use-cases" style={{ color: "var(--muted)", textDecoration: "none" }}>
            Use Cases
          </Link>
          <span>›</span>
          <Link href="/uc10" style={{ color: "var(--muted)", textDecoration: "none" }}>
            UC10
          </Link>
        </div>

        {/* Badge + label */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
          <span
            style={{
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
            }}
          >
            UC10
          </span>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            NTN END-TO-END SERVICE ASSURANCE
          </span>
        </div>

        <h1
          style={{
            fontSize: "28px",
            fontWeight: 800,
            color: "var(--text)",
            margin: "0 0 10px 0",
            lineHeight: 1.2,
          }}
        >
          NTN E2E Service Assurance Architecture
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "var(--muted)",
            maxWidth: "700px",
            lineHeight: 1.6,
            margin: "0 0 20px 0",
          }}
        >
          4-domain service assurance: Satellite → Ground Station → RAN → Core, with real-time
          1-min micro KPI monitoring across 5 Canadian ground sites
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link
            href="/uc10"
            style={{
              background: "var(--accent)",
              color: "#000",
              borderRadius: "8px",
              padding: "10px 22px",
              fontSize: "13px",
              fontWeight: 700,
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            View Live Demo →
          </Link>
          <Link
            href="/uc10"
            style={{
              background: "transparent",
              color: "var(--text)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "10px 22px",
              fontSize: "13px",
              fontWeight: 600,
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            View Pass Schedule
          </Link>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 1: 4-Domain Architecture Flow                                 */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom: "48px" }}>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "var(--text)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            borderLeft: "3px solid var(--accent)",
            paddingLeft: "12px",
            marginBottom: "20px",
          }}
        >
          4-Domain Architecture Flow
        </div>

        {/* Domain flow */}
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            gap: "0",
            overflowX: "auto",
            marginBottom: "16px",
          }}
        >
          {[
            {
              icon: "🛰️",
              label: "Satellite Domain",
              color: "#c084fc",
              items: ["LEO Phased Array", "Doppler Compensation", "EIRP / Link Margin", "C/No Monitoring"],
            },
            {
              icon: "📡",
              label: "Ground Station",
              color: "var(--accent)",
              items: ["ACU Tracking", "Beacon Lock", "Signal Analyzer", "BPMS Processing"],
            },
            {
              icon: "📶",
              label: "RAN / eNB",
              color: "#60a5fa",
              items: ["18 3GPP KPIs", "RRC / E-RAB SR", "DL/UL Throughput", "RSRP / SINR / CQI"],
            },
            {
              icon: "🌐",
              label: "Core Network",
              color: "#fb923c",
              items: ["PDP Activation", "MME Attach SR", "SGW/PGW Sessions", "DPI Throughput"],
            },
          ].map((domain, i, arr) => (
            <div key={domain.label} style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
              <div
                style={{
                  flex: 1,
                  background: "var(--surface)",
                  border: `1px solid ${domain.color}44`,
                  borderTop: `3px solid ${domain.color}`,
                  borderRadius: "10px",
                  padding: "16px",
                  minWidth: "180px",
                }}
              >
                <div
                  style={{
                    fontSize: "18px",
                    marginBottom: "6px",
                  }}
                >
                  {domain.icon}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: domain.color,
                    marginBottom: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {domain.label}
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                  {domain.items.map(item => (
                    <li
                      key={item}
                      style={{
                        fontSize: "11px",
                        color: "var(--muted)",
                        padding: "2px 0",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              {i < arr.length - 1 && (
                <div
                  style={{
                    fontSize: "20px",
                    color: "var(--muted)",
                    padding: "0 8px",
                    flexShrink: 0,
                  }}
                >
                  →
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Overall PASS banner */}
        <div
          style={{
            background: "rgba(51,204,221,0.07)",
            border: "1px solid rgba(51,204,221,0.25)",
            borderRadius: "8px",
            padding: "12px 20px",
            fontFamily: "monospace",
            fontSize: "13px",
            color: "var(--accent)",
            fontWeight: 600,
          }}
        >
          Overall PASS = Satellite PASS ∧ Ground Station PASS ∧ RAN PASS ∧ Core PASS
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 2: Mesh Architecture & Ground Sites                           */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom: "48px" }}>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "var(--text)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            borderLeft: "3px solid #60a5fa",
            paddingLeft: "12px",
            marginBottom: "20px",
          }}
        >
          Mesh Architecture & Ground Sites
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
          {/* Left: Description */}
          <div>
            <p style={{ fontSize: "14px", color: "var(--text)", lineHeight: 1.7, marginTop: 0 }}>
              The UC10 platform operates across{" "}
              <strong style={{ color: "var(--accent)" }}>5 Canadian ground sites</strong> in a
              decentralized mesh architecture, eliminating single points of failure.
            </p>
            <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.7 }}>
              Each site — Toronto, Ottawa, Calgary, Vancouver, and Montreal — runs its own
              PostgreSQL/TimescaleDB node. Data is replicated bidirectionally across all 5 nodes
              using logical replication slots. Any node can serve as the primary for its region,
              enabling autonomous operation during WAN partitions.
            </p>
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "14px 16px",
                marginTop: "16px",
              }}
            >
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: "8px" }}>
                Replication Topology
              </div>
              {[
                ["Mode", "Bidirectional logical replication"],
                ["Conflict Resolution", "Last-write-wins (timestamp)"],
                ["Replication Lag", "< 500ms across nodes"],
                ["Failover RTO", "< 30 seconds"],
                ["RPO", "< 5 minutes"],
              ].map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "12px",
                    padding: "4px 0",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <span style={{ color: "var(--muted)" }}>{k}</span>
                  <span style={{ color: "var(--text)", fontFamily: "monospace" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Site visual */}
          <div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                position: "relative",
              }}
            >
              {GROUND_SITES.map(site => (
                <div
                  key={site.id}
                  style={{
                    background: "var(--surface)",
                    border: `1px solid ${site.color}44`,
                    borderLeft: `3px solid ${site.color}`,
                    borderRadius: "8px",
                    padding: "12px 14px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: site.color,
                        boxShadow: `0 0 6px ${site.color}`,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: site.color,
                        fontFamily: "monospace",
                      }}
                    >
                      {site.id}
                    </span>
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--muted)" }}>{site.city}, Canada</div>
                  <div style={{ fontSize: "10px", color: "var(--muted)", marginTop: "4px", fontFamily: "monospace" }}>
                    PostgreSQL + TimescaleDB
                  </div>
                </div>
              ))}
              {/* Center node placeholder */}
              <div
                style={{
                  background: "rgba(51,204,221,0.08)",
                  border: "1px dashed rgba(51,204,221,0.4)",
                  borderRadius: "8px",
                  padding: "12px 14px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gridColumn: "1 / -1",
                }}
              >
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent)", fontFamily: "monospace" }}>
                  MESH REPLICATION
                </div>
                <div style={{ fontSize: "10px", color: "var(--muted)", marginTop: "4px" }}>
                  All nodes ↔ All nodes · Bidirectional
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 3: RTPM 1-Minute Micro KPI Pipeline                          */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom: "48px" }}>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "var(--text)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            borderLeft: "3px solid #34d399",
            paddingLeft: "12px",
            marginBottom: "20px",
          }}
        >
          RTPM 1-Minute Micro KPI Pipeline
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            gap: "0",
            overflowX: "auto",
          }}
        >
          {PIPELINE_STAGES.map((stage, i, arr) => (
            <div key={stage.title} style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
              <div
                style={{
                  flex: 1,
                  background: "var(--surface)",
                  border: `1px solid ${stage.color}44`,
                  borderTop: `3px solid ${stage.color}`,
                  borderRadius: "10px",
                  padding: "14px",
                  minWidth: "160px",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: stage.color,
                    marginBottom: "8px",
                    fontFamily: "monospace",
                  }}
                >
                  {stage.title}
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                  {stage.lines.map(line => (
                    <li
                      key={line}
                      style={{
                        fontSize: "10px",
                        color: "var(--muted)",
                        padding: "2px 0",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
              {i < arr.length - 1 && (
                <div
                  style={{
                    fontSize: "18px",
                    color: "var(--muted)",
                    padding: "0 6px",
                    flexShrink: 0,
                  }}
                >
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 4: OOD Layer                                                  */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom: "48px" }}>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "var(--text)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            borderLeft: "3px solid #a78bfa",
            paddingLeft: "12px",
            marginBottom: "20px",
          }}
        >
          OOD Layer — Orchestration · Observability · Data
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
          {[
            {
              label: "Orchestration",
              color: "#a78bfa",
              items: [
                "Pass scheduling engine",
                "Domain health checks",
                "Auto-failover routing",
                "SLA breach detection",
              ],
            },
            {
              label: "Observability",
              color: "#34d399",
              items: [
                "RTPM dashboards",
                "Cross-domain correlation",
                "Anomaly detection alerts",
                "Historical replay",
              ],
            },
            {
              label: "Data",
              color: "#fb923c",
              items: [
                "PostgreSQL mesh replication",
                "TimescaleDB compression",
                "API gateway for partner access",
                "Data retention policies",
              ],
            },
          ].map(card => (
            <div
              key={card.label}
              style={{
                background: "var(--surface)",
                border: `1px solid ${card.color}33`,
                borderTop: `3px solid ${card.color}`,
                borderRadius: "10px",
                padding: "18px",
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: card.color,
                  marginBottom: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {card.label}
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {card.items.map(item => (
                  <li
                    key={item}
                    style={{
                      fontSize: "12px",
                      color: "var(--muted)",
                      padding: "5px 0",
                      borderBottom: "1px solid var(--border)",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "8px",
                    }}
                  >
                    <span style={{ color: card.color, flexShrink: 0 }}>›</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 5: Ground Station Sub-Systems                                 */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom: "48px" }}>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "var(--text)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            borderLeft: "3px solid #33ccdd",
            paddingLeft: "12px",
            marginBottom: "20px",
          }}
        >
          Ground Station Sub-Systems Deep Dive
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {[
            {
              name: "ACU",
              full: "Antenna Control Unit",
              color: "#33ccdd",
              specs: [
                "Azimuth / Elevation tracking",
                "Polarization alignment control",
                "Loop gain tuning (28–42 dB)",
                "Tracking modes: AUTO / MANUAL / PROGRAM",
                "Threshold: azimuth < 0.5°, elevation < 0.4°",
              ],
            },
            {
              name: "Beacon Receiver",
              full: "Beacon Signal Lock",
              color: "#60a5fa",
              specs: [
                "Beacon signal lock status",
                "SNR monitoring (8–28 dB range)",
                "Frequency offset compensation (0–180 Hz)",
                "State machine: LOCKED / SEARCHING / LOST",
                "Lock required for PASS status",
              ],
            },
            {
              name: "Signal Analyzer",
              full: "RF Signal Quality",
              color: "#a78bfa",
              specs: [
                "Rx signal level (-88 to -65 dBm)",
                "BER measurement (target < 1e-5)",
                "Symbol rate accuracy > 99.1%",
                "Spectrum flatness (0.2–3.1 dB)",
                "Phase noise (-105 to -85 dBc/Hz)",
              ],
            },
            {
              name: "BPMS",
              full: "Baseband Processing & Modem System",
              color: "#fb923c",
              specs: [
                "Demodulation lock status",
                "FEC correction rate (0.01–4.2%)",
                "Frame error rate (0.001–0.8%)",
                "Bitrate utilization (45–92%)",
                "Processing latency (2.1–8.8 ms)",
              ],
            },
          ].map(sys => (
            <div
              key={sys.name}
              style={{
                background: "var(--surface)",
                border: `1px solid ${sys.color}33`,
                borderLeft: `3px solid ${sys.color}`,
                borderRadius: "10px",
                padding: "18px",
              }}
            >
              <div style={{ marginBottom: "10px" }}>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: sys.color,
                    fontFamily: "monospace",
                  }}
                >
                  {sys.name}
                </div>
                <div style={{ fontSize: "11px", color: "var(--muted)" }}>{sys.full}</div>
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {sys.specs.map(spec => (
                  <li
                    key={spec}
                    style={{
                      fontSize: "11px",
                      color: "var(--muted)",
                      padding: "4px 0",
                      borderBottom: "1px solid var(--border)",
                      display: "flex",
                      gap: "8px",
                    }}
                  >
                    <span style={{ color: sys.color, flexShrink: 0 }}>·</span>
                    {spec}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 6: Satellite Domain                                           */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom: "48px" }}>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "var(--text)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            borderLeft: "3px solid #c084fc",
            paddingLeft: "12px",
            marginBottom: "20px",
          }}
        >
          Satellite Domain — Kuiper LEO Fleet
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
          {/* Left: Satellite list */}
          <div>
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "18px",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#c084fc",
                  marginBottom: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Active Satellites (12)
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "6px",
                  marginBottom: "14px",
                }}
              >
                {SATELLITES.map(sat => (
                  <div
                    key={sat}
                    style={{
                      background: "var(--surface-2)",
                      border: "1px solid rgba(192,132,252,0.2)",
                      borderRadius: "6px",
                      padding: "6px 10px",
                      fontSize: "11px",
                      fontFamily: "monospace",
                      color: "#c084fc",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "#c084fc",
                        flexShrink: 0,
                      }}
                    />
                    {sat}
                  </div>
                ))}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--muted)",
                  background: "rgba(192,132,252,0.06)",
                  borderRadius: "6px",
                  padding: "10px 12px",
                  lineHeight: 1.6,
                }}
              >
                Amazon Project Kuiper LEO constellation · 590km altitude · Ka-band (26.5–40 GHz)
                · Phased array antennas · Active beam steering
              </div>
            </div>
          </div>

          {/* Right: KPI thresholds */}
          <div>
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "18px",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#c084fc",
                  marginBottom: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                KPI Thresholds
              </div>
              {[
                { kpi: "EIRP", threshold: "> 45 dBW", unit: "dBW" },
                { kpi: "Link Margin", threshold: "> 6 dB", unit: "dB" },
                { kpi: "Phased Array Beam Efficiency", threshold: "> 90%", unit: "%" },
                { kpi: "Doppler Compensation Rate", threshold: "> 94%", unit: "%" },
                { kpi: "C/No", threshold: "> 72 dB-Hz", unit: "dB-Hz" },
                { kpi: "Eb/No", threshold: "> 8.5 dB", unit: "dB" },
                { kpi: "Doppler Shift", threshold: "12–68 kHz", unit: "kHz" },
                { kpi: "EIRP Variation", threshold: "< 2.8 dB", unit: "dB" },
              ].map(row => (
                <div
                  key={row.kpi}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "7px 0",
                    borderBottom: "1px solid var(--border)",
                    fontSize: "12px",
                  }}
                >
                  <span style={{ color: "var(--text)" }}>{row.kpi}</span>
                  <span
                    style={{
                      background: "rgba(192,132,252,0.12)",
                      border: "1px solid rgba(192,132,252,0.25)",
                      borderRadius: "4px",
                      padding: "2px 8px",
                      fontFamily: "monospace",
                      fontSize: "11px",
                      color: "#c084fc",
                      fontWeight: 600,
                    }}
                  >
                    {row.threshold}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 7: RAN KPI Framework                                          */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom: "48px" }}>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "var(--text)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            borderLeft: "3px solid #60a5fa",
            paddingLeft: "12px",
            marginBottom: "20px",
          }}
        >
          RAN KPI Framework — 18 3GPP KPIs
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
          {RAN_KPIS.map(kpi => {
            const color = DOMAIN_COLORS[kpi.domain] ?? "var(--accent)"
            return (
              <div
                key={kpi.name}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderLeft: `3px solid ${color}`,
                  borderRadius: "8px",
                  padding: "12px 14px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "8px",
                    marginBottom: "6px",
                  }}
                >
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text)" }}>
                    {kpi.name}
                  </div>
                  <span
                    style={{
                      background: `${color}18`,
                      border: `1px solid ${color}44`,
                      borderRadius: "4px",
                      padding: "1px 6px",
                      fontSize: "9px",
                      fontWeight: 700,
                      color: color,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {kpi.domain}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    fontFamily: "monospace",
                    color: "var(--muted)",
                    marginBottom: "6px",
                    wordBreak: "break-all",
                  }}
                >
                  {kpi.ref}
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    fontFamily: "monospace",
                    color: color,
                    fontWeight: 600,
                    background: `${color}0f`,
                    borderRadius: "4px",
                    padding: "2px 6px",
                    display: "inline-block",
                  }}
                >
                  {kpi.threshold}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Bottom CTA ── */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          padding: "32px",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "var(--text)",
            margin: "0 0 10px 0",
          }}
        >
          Want this for your NTN operations?
        </h2>
        <p
          style={{
            fontSize: "14px",
            color: "var(--muted)",
            margin: "0 0 24px 0",
            maxWidth: "500px",
            marginLeft: "auto",
            marginRight: "auto",
            lineHeight: 1.6,
          }}
        >
          We can deploy this 4-domain service assurance platform for your satellite fleet and
          ground station network.
        </p>
        <Link
          href="/contact"
          style={{
            background: "var(--accent)",
            color: "#000",
            borderRadius: "8px",
            padding: "12px 28px",
            fontSize: "14px",
            fontWeight: 700,
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          Talk to us →
        </Link>
      </div>
    </div>
  )
}

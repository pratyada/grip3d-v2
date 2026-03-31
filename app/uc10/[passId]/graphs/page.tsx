"use client"

import { use, useState } from "react"
import Link from "next/link"
import {
  getPass,
  getTimeSeriesForPass,
  getLatencyHistogram,
  getVendorRadarData,
  getPMCounters,
} from "@/lib/uc10-data"
import {
  ComposedChart,
  AreaChart,
  BarChart,
  ScatterChart,
  RadarChart,
  LineChart,
  ResponsiveContainer,
  Line,
  Area,
  Bar,
  Scatter,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts"

// ── Styles ────────────────────────────────────────────────────────────────────

const S = {
  page: {
    minHeight: "100vh",
    background: "var(--bg)",
    padding: "32px 24px 80px",
    maxWidth: "1300px",
    margin: "0 auto",
  } as React.CSSProperties,

  header: {
    marginBottom: "32px",
  } as React.CSSProperties,

  breadcrumbRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
  } as React.CSSProperties,

  backLink: {
    color: "var(--accent)",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: "4px",
  } as React.CSSProperties,

  passBadge: {
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    padding: "3px 10px",
    fontSize: "12px",
    fontWeight: 700,
    color: "var(--accent)",
    fontFamily: "monospace",
  } as React.CSSProperties,

  vendorBadge: {
    background: "rgba(192,132,252,0.12)",
    border: "1px solid rgba(192,132,252,0.3)",
    borderRadius: "6px",
    padding: "3px 10px",
    fontSize: "12px",
    fontWeight: 600,
    color: "#c084fc",
  } as React.CSSProperties,

  h1: {
    fontSize: "22px",
    fontWeight: 700,
    color: "var(--text)",
    margin: 0,
    marginBottom: "4px",
  } as React.CSSProperties,

  subtitle: {
    fontSize: "13px",
    color: "var(--muted)",
    margin: 0,
  } as React.CSSProperties,

  section: {
    marginBottom: "40px",
  } as React.CSSProperties,

  sectionHeader: (color: string) =>
    ({
      fontSize: "14px",
      fontWeight: 700,
      color: "var(--text)",
      textTransform: "uppercase" as const,
      letterSpacing: "0.06em",
      borderLeft: `3px solid ${color}`,
      paddingLeft: "12px",
      marginBottom: "20px",
    }) as React.CSSProperties,

  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  } as React.CSSProperties,

  grid3: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "16px",
  } as React.CSSProperties,

  chartCard: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "20px",
  } as React.CSSProperties,

  chartTitle: {
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--muted)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    marginBottom: "12px",
  } as React.CSSProperties,

  bottomNav: {
    display: "flex",
    justifyContent: "center",
    marginTop: "48px",
  } as React.CSSProperties,

  backBtn: {
    background: "var(--accent)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 24px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-block",
  } as React.CSSProperties,
}

const TOOLTIP_STYLE = {
  contentStyle: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    fontSize: "12px",
    color: "var(--text)",
  },
  cursor: { stroke: "var(--border)" },
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PassGraphsPage({
  params,
}: {
  params: Promise<{ passId: string }>
}) {
  const { passId } = use(params)
  const pass = getPass(passId)
  const [activeMainTab, setActiveMainTab] = useState<"summary" | "charts">("summary")

  if (!pass) {
    return (
      <div style={{ ...S.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--muted)", fontSize: "16px" }}>Pass not found: {passId}</div>
      </div>
    )
  }

  const vendor = pass.ranVendor
  const ts = getTimeSeriesForPass(passId, vendor)
  const hist = getLatencyHistogram(passId, vendor)
  const radarData = getVendorRadarData(passId, vendor)
  const pmCounters = getPMCounters(passId, vendor)

  // Scatter data: sinr vs dlThroughput
  const scatterData = ts.map(p => ({ sinr: parseFloat(p.sinr.toFixed(1)), dl: parseFloat(p.dlThroughput.toFixed(1)) }))

  // Stacked bar: group 30 minutes into 6 buckets of 5 mins
  const stackedBuckets = Array.from({ length: 6 }, (_, i) => {
    const slice = ts.slice(i * 5, i * 5 + 5)
    const avgE2e = slice.reduce((a, b) => a + b.e2eLatency, 0) / slice.length
    return {
      bucket: `${i * 5 + 1}-${i * 5 + 5}m`,
      ran: parseFloat((avgE2e * 0.4).toFixed(1)),
      core: parseFloat((avgE2e * 0.35).toFixed(1)),
      ntn: parseFloat((avgE2e * 0.25).toFixed(1)),
    }
  })

  // Scatter data for RSSI vs SINR (feature 3 row 4)
  const rssiSinrScatter = ts.map(p => ({ x: parseFloat(p.rsrp.toFixed(1)), y: parseFloat(p.sinr.toFixed(1)) }))

  // Scatter data for Cell Availability vs Active UEs (feature 3 row 5)
  const cellAvailScatter = ts.map(p => ({ x: p.activeUEs, y: parseFloat(p.cellAvailability.toFixed(2)) }))

  const mainTabs: { id: "summary" | "charts"; label: string }[] = [
    { id: "summary", label: "📊 KPI Summary" },
    { id: "charts", label: "📈 Micro KPI Charts" },
  ]

  function statusDot(status: "pass" | "warn" | "fail") {
    const color = status === "pass" ? "#22c55e" : status === "warn" ? "#f59e0b" : "#ef4444"
    return (
      <span style={{
        display: "inline-block",
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        background: color,
        marginRight: "6px",
      }} />
    )
  }

  return (
    <div style={S.page}>
      {/* ── Header ── */}
      <div style={S.header}>
        <div style={S.breadcrumbRow}>
          <Link href={`/uc10/${passId}`} style={S.backLink}>
            ← Back
          </Link>
          <span style={S.passBadge}>{passId}</span>
          <span style={{ fontSize: "13px", color: "var(--text)", fontWeight: 500 }}>{pass.satellite}</span>
          <span style={{ fontSize: "13px", color: "var(--muted)" }}>{pass.groundSite}</span>
          <span style={S.vendorBadge}>{vendor}</span>
        </div>
        <h1 style={S.h1}>30-Minute Pass Time Series</h1>
        <p style={S.subtitle}>
          AOS {pass.aos} → LOS {pass.los} · Duration {pass.duration} · {pass.eNB} · {pass.cell}
        </p>
      </div>

      {/* ── Main Tab Bar ── */}
      <div style={{
        display: "flex",
        gap: "4px",
        marginBottom: "28px",
        borderBottom: "1px solid var(--border)",
      }}>
        {mainTabs.map(tab => {
          const isActive = activeMainTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveMainTab(tab.id)}
              style={{
                padding: "10px 20px",
                background: "transparent",
                border: "none",
                borderBottom: `2px solid ${isActive ? "var(--accent)" : "transparent"}`,
                color: isActive ? "var(--text)" : "var(--muted)",
                fontSize: "13px",
                fontWeight: isActive ? 700 : 500,
                cursor: "pointer",
                marginBottom: "-1px",
                transition: "all 0.15s",
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* KPI SUMMARY TAB                                                       */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeMainTab === "summary" && (
        <div>
          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>
              3GPP PM Counter Report — {passId} · {vendor}
            </div>
            <div style={{ fontSize: "13px", color: "var(--muted)" }}>
              19 LTE performance counters — 1-min granularity · eNB: {pass.eNB}
            </div>
          </div>
          <div style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            overflow: "hidden",
          }}>
            {/* Table header */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "160px 1fr 100px 80px 70px",
              gap: "0",
              padding: "10px 16px",
              background: "var(--surface-2)",
              borderBottom: "1px solid var(--border)",
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}>
              <div>Counter ID</div>
              <div>KPI Name</div>
              <div style={{ textAlign: "right" }}>Value</div>
              <div style={{ textAlign: "right" }}>Unit</div>
              <div style={{ textAlign: "center" }}>Status</div>
            </div>
            {/* Table rows */}
            {pmCounters.map((counter, i) => (
              <div
                key={counter.counterId}
                style={{
                  display: "grid",
                  gridTemplateColumns: "160px 1fr 100px 80px 70px",
                  gap: "0",
                  padding: "10px 16px",
                  background: i % 2 === 0 ? "var(--surface)" : "var(--surface-2)",
                  borderBottom: i < pmCounters.length - 1 ? "1px solid var(--border)" : "none",
                  alignItems: "center",
                }}
              >
                <div style={{ fontFamily: "monospace", fontSize: "12px", color: "var(--accent)", fontWeight: 600 }}>
                  {counter.counterId}
                </div>
                <div style={{ fontSize: "13px", color: "var(--text)" }}>
                  {counter.kpiName}
                </div>
                <div style={{ fontSize: "13px", color: "var(--text)", textAlign: "right", fontFamily: "monospace" }}>
                  {counter.value}
                </div>
                <div style={{ fontSize: "12px", color: "var(--muted)", textAlign: "right" }}>
                  {counter.unit}
                </div>
                <div style={{ textAlign: "center" }}>
                  {statusDot(counter.status)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MICRO KPI CHARTS TAB                                                  */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeMainTab === "charts" && (
        <div>
          {/* ══════════════════════════════════════════════════════════════════════ */}
          {/* SECTION 1: RAN Performance                                            */}
          {/* ══════════════════════════════════════════════════════════════════════ */}
          <div style={S.section}>
            <div style={S.sectionHeader("#60a5fa")}>RAN Performance</div>
            <div style={S.grid3}>
              {/* 1. DL/UL Throughput */}
              <div style={S.chartCard}>
                <div style={S.chartTitle}>DL / UL Throughput (Mbps)</div>
                <ResponsiveContainer width="100%" height={250}>
                  <ComposedChart data={ts} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="minute" tick={{ fontSize: 10, fill: "var(--muted)" }} label={{ value: "min", position: "insideBottomRight", offset: 0, fontSize: 10, fill: "var(--muted)" }} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--muted)" }} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Line type="monotone" dataKey="dlThroughput" name="DL (Mbps)" stroke="#60a5fa" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="ulThroughput" name="UL (Mbps)" stroke="#34d399" dot={false} strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* 2. E2E Latency */}
              <div style={S.chartCard}>
                <div style={S.chartTitle}>E2E Latency (ms)</div>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={ts} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="latGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#fb923c" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#fb923c" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="minute" tick={{ fontSize: 10, fill: "var(--muted)" }} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--muted)" }} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "100ms SLA", fill: "#ef4444", fontSize: 9 }} />
                    <Area type="monotone" dataKey="e2eLatency" name="E2E Latency" stroke="#fb923c" fill="url(#latGrad)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* 3. RSRP Signal */}
              <div style={S.chartCard}>
                <div style={S.chartTitle}>RSRP Signal (dBm)</div>
                <ResponsiveContainer width="100%" height={250}>
                  <ComposedChart data={ts} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="minute" tick={{ fontSize: 10, fill: "var(--muted)" }} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--muted)" }} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Line type="monotone" dataKey="rsrp" name="RSRP (dBm)" stroke="#a78bfa" dot={false} strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════════ */}
          {/* SECTION 2: Signal Quality                                             */}
          {/* ══════════════════════════════════════════════════════════════════════ */}
          <div style={S.section}>
            <div style={S.sectionHeader("#fb923c")}>Signal Quality</div>
            <div style={S.grid2}>
              {/* 4. Latency Histogram */}
              <div style={S.chartCard}>
                <div style={S.chartTitle}>E2E Latency Histogram</div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={hist.buckets} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="range" tick={{ fontSize: 9, fill: "var(--muted)" }} angle={-30} textAnchor="end" height={40} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--muted)" }} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Bar dataKey="count" name="Count" fill="#fb923c" radius={[3, 3, 0, 0]} />
                    <ReferenceLine x={`${Math.floor(hist.p50 / 10) * 10}-${Math.floor(hist.p50 / 10) * 10 + 10}`} stroke="#60a5fa" strokeDasharray="3 3" label={{ value: `P50`, fill: "#60a5fa", fontSize: 9 }} />
                    <ReferenceLine x={`${Math.floor(hist.p90 / 10) * 10}-${Math.floor(hist.p90 / 10) * 10 + 10}`} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: `P90`, fill: "#f59e0b", fontSize: 9 }} />
                    <ReferenceLine x={`${Math.floor(hist.p99 / 10) * 10}-${Math.floor(hist.p99 / 10) * 10 + 10}`} stroke="#ef4444" strokeDasharray="3 3" label={{ value: `P99`, fill: "#ef4444", fontSize: 9 }} />
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", gap: "16px", marginTop: "8px", fontSize: "11px", color: "var(--muted)" }}>
                  <span>P50: <span style={{ color: "#60a5fa", fontWeight: 600 }}>{hist.p50.toFixed(0)}ms</span></span>
                  <span>P90: <span style={{ color: "#f59e0b", fontWeight: 600 }}>{hist.p90.toFixed(0)}ms</span></span>
                  <span>P99: <span style={{ color: "#ef4444", fontWeight: 600 }}>{hist.p99.toFixed(0)}ms</span></span>
                </div>
              </div>

              {/* 5. SINR vs DL Throughput Scatter */}
              <div style={S.chartCard}>
                <div style={S.chartTitle}>SINR vs DL Throughput</div>
                <ResponsiveContainer width="100%" height={280}>
                  <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="sinr" name="SINR (dB)" type="number" tick={{ fontSize: 10, fill: "var(--muted)" }} label={{ value: "SINR (dB)", position: "insideBottom", offset: -5, fontSize: 10, fill: "var(--muted)" }} />
                    <YAxis dataKey="dl" name="DL (Mbps)" tick={{ fontSize: 10, fill: "var(--muted)" }} label={{ value: "Mbps", angle: -90, position: "insideLeft", offset: 10, fontSize: 10, fill: "var(--muted)" }} />
                    <Tooltip {...TOOLTIP_STYLE} cursor={{ strokeDasharray: "3 3" }} />
                    <Scatter data={scatterData} fill="#60a5fa" fillOpacity={0.7} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════════ */}
          {/* SECTION 3: Satellite + Ground Station                                 */}
          {/* ══════════════════════════════════════════════════════════════════════ */}
          <div style={S.section}>
            <div style={S.sectionHeader("#c084fc")}>Satellite + Ground Station</div>
            <div style={S.grid3}>
              {/* 6. EIRP + Link Margin */}
              <div style={S.chartCard}>
                <div style={S.chartTitle}>EIRP & Link Margin</div>
                <ResponsiveContainer width="100%" height={250}>
                  <ComposedChart data={ts} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="minute" tick={{ fontSize: 10, fill: "var(--muted)" }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "var(--muted)" }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "var(--muted)" }} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Line yAxisId="left" type="monotone" dataKey="eirp" name="EIRP (dBW)" stroke="#c084fc" dot={false} strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="linkMargin" name="Link Margin (dB)" stroke="#f472b6" dot={false} strokeWidth={2} strokeDasharray="4 2" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* 7. ACU Tracking Error */}
              <div style={S.chartCard}>
                <div style={S.chartTitle}>ACU Tracking Error (°)</div>
                <ResponsiveContainer width="100%" height={250}>
                  <ComposedChart data={ts} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="minute" tick={{ fontSize: 10, fill: "var(--muted)" }} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--muted)" }} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <ReferenceLine y={0.5} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "threshold", fill: "#ef4444", fontSize: 9 }} />
                    <Line type="monotone" dataKey="azimuthError" name="Azimuth Err" stroke="#33ccdd" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="elevationError" name="Elevation Err" stroke="#fb923c" dot={false} strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* 8. Beacon Level + RxSignal */}
              <div style={S.chartCard}>
                <div style={S.chartTitle}>Beacon Level & Rx Signal (dBm)</div>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={ts} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="beaconGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#33ccdd" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#33ccdd" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="rxGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#c084fc" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#c084fc" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="minute" tick={{ fontSize: 10, fill: "var(--muted)" }} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--muted)" }} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Area type="monotone" dataKey="beaconLevel" name="Beacon (dBm)" stroke="#33ccdd" fill="url(#beaconGrad)" strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="rxSignalLevel" name="Rx Signal (dBm)" stroke="#c084fc" fill="url(#rxGrad)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════════ */}
          {/* SECTION 4: Core Network + Multi-Domain                                */}
          {/* ══════════════════════════════════════════════════════════════════════ */}
          <div style={S.section}>
            <div style={S.sectionHeader("#34d399")}>Core Network + Multi-Domain</div>
            <div style={S.grid3}>
              {/* 9. PDP + MME rates */}
              <div style={S.chartCard}>
                <div style={S.chartTitle}>PDP Context & MME Attach SR (%)</div>
                <ResponsiveContainer width="100%" height={250}>
                  <ComposedChart data={ts} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="minute" tick={{ fontSize: 10, fill: "var(--muted)" }} />
                    <YAxis domain={[95, 100]} tick={{ fontSize: 10, fill: "var(--muted)" }} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Line type="monotone" dataKey="pdpSuccessRate" name="PDP SR (%)" stroke="#34d399" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="mmeAttachRate" name="MME Attach (%)" stroke="#60a5fa" dot={false} strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* 10. Stacked latency decomposition */}
              <div style={S.chartCard}>
                <div style={S.chartTitle}>E2E Latency Decomposition (ms)</div>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stackedBuckets} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="bucket" tick={{ fontSize: 10, fill: "var(--muted)" }} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--muted)" }} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Bar dataKey="ran" name="RAN Latency" stackId="a" fill="#60a5fa" />
                    <Bar dataKey="core" name="Core Processing" stackId="a" fill="#fb923c" />
                    <Bar dataKey="ntn" name="NTN Overhead" stackId="a" fill="#c084fc" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* 11. 4-Domain Radar */}
              <div style={S.chartCard}>
                <div style={S.chartTitle}>4-Domain KPI Radar</div>
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={radarData} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fill: "var(--muted)" }} />
                    <Radar
                      name={vendor}
                      dataKey="value"
                      stroke="var(--accent)"
                      fill="rgba(51,204,221,0.2)"
                      strokeWidth={2}
                    />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════════ */}
          {/* SECTION 5: Detailed RAN KPIs                                          */}
          {/* ══════════════════════════════════════════════════════════════════════ */}
          <div style={S.section}>
            <div style={S.sectionHeader("#34d399")}>Detailed RAN KPIs</div>

            {/* Row 1 */}
            <div style={{ ...S.grid2, marginBottom: "16px" }}>
              {/* RACH Success Rate */}
              <div style={S.chartCard}>
                <div style={S.chartTitle}>RACH Success Rate (%)</div>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={ts} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="minute" tick={{ fontSize: 10, fill: "var(--muted)" }} />
                    <YAxis domain={[90, 101]} tick={{ fontSize: 10, fill: "var(--muted)" }} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <ReferenceLine y={97} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "97%", fill: "#ef4444", fontSize: 9 }} />
                    <Line type="monotone" dataKey="rachSuccessRate" name="RACH SR (%)" stroke="#34d399" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* RRC Setup SR vs Attempts */}
              <div style={S.chartCard}>
                <div style={S.chartTitle}>RRC Setup Success Rate vs Attempts</div>
                <ResponsiveContainer width="100%" height={250}>
                  <ComposedChart data={ts} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="minute" tick={{ fontSize: 10, fill: "var(--muted)" }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "var(--muted)" }} />
                    <YAxis yAxisId="right" orientation="right" domain={[95, 101]} tick={{ fontSize: 10, fill: "var(--muted)" }} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Bar yAxisId="left" dataKey="rrcAttempts" name="RRC Attempts" fill="#60a5fa" fillOpacity={0.4} />
                    <Line yAxisId="right" type="monotone" dataKey="rrcSetupSuccessRate" name="RRC SR (%)" stroke="#60a5fa" dot={false} strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Row 2 */}
            <div style={{ ...S.grid2, marginBottom: "16px" }}>
              {/* E-RAB Setup SR vs Attempts */}
              <div style={S.chartCard}>
                <div style={S.chartTitle}>E-RAB Setup Success Rate vs Attempts</div>
                <ResponsiveContainer width="100%" height={250}>
                  <ComposedChart data={ts} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="minute" tick={{ fontSize: 10, fill: "var(--muted)" }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "var(--muted)" }} />
                    <YAxis yAxisId="right" orientation="right" domain={[95, 101]} tick={{ fontSize: 10, fill: "var(--muted)" }} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Bar yAxisId="left" dataKey="erabAttempts" name="E-RAB Attempts" fill="#fb923c" fillOpacity={0.4} />
                    <Line yAxisId="right" type="monotone" dataKey="erabSetupSuccessRate" name="E-RAB SR (%)" stroke="#fb923c" dot={false} strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* PRB Usage DL */}
              <div style={S.chartCard}>
                <div style={S.chartTitle}>PRB Usage DL (%)</div>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={ts} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="prbGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#c084fc" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#c084fc" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="minute" tick={{ fontSize: 10, fill: "var(--muted)" }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--muted)" }} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "80%", fill: "#ef4444", fontSize: 9 }} />
                    <Area type="monotone" dataKey="prbUsageDL" name="PRB Usage DL (%)" stroke="#c084fc" fill="url(#prbGrad)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Row 3 */}
            <div style={{ ...S.grid2, marginBottom: "16px" }}>
              {/* Active UEs */}
              <div style={S.chartCard}>
                <div style={S.chartTitle}>Active UEs per Cell</div>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={ts} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="ueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#34d399" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="minute" tick={{ fontSize: 10, fill: "var(--muted)" }} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--muted)" }} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Area type="monotone" dataKey="activeUEs" name="Active UEs" stroke="#34d399" fill="url(#ueGrad)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* RRC Connection Setup Time */}
              <div style={S.chartCard}>
                <div style={S.chartTitle}>RRC Connection Setup Time (ms)</div>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={ts} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="minute" tick={{ fontSize: 10, fill: "var(--muted)" }} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--muted)" }} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <ReferenceLine y={20} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "20ms", fill: "#ef4444", fontSize: 9 }} />
                    <Line type="monotone" dataKey="rrcSetupTime" name="RRC Setup Time (ms)" stroke="#f472b6" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Row 4 */}
            <div style={{ ...S.grid2, marginBottom: "16px" }}>
              {/* PDCP SDU Loss UL & DL */}
              <div style={S.chartCard}>
                <div style={S.chartTitle}>PDCP SDU Loss Ratio UL & DL (%)</div>
                <ResponsiveContainer width="100%" height={250}>
                  <ComposedChart data={ts} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="minute" tick={{ fontSize: 10, fill: "var(--muted)" }} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--muted)" }} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <ReferenceLine y={1} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "1%", fill: "#ef4444", fontSize: 9 }} />
                    <Line type="monotone" dataKey="pdcpSduLossUL" name="PDCP Loss UL (%)" stroke="#fb923c" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="pdcpSduLossDL" name="PDCP Loss DL (%)" stroke="#60a5fa" dot={false} strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* RSSI vs SINR Scatter */}
              <div style={S.chartCard}>
                <div style={S.chartTitle}>RSSI PUCCH vs SINR PUCCH</div>
                <ResponsiveContainer width="100%" height={250}>
                  <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="x" name="RSRP (dBm)" type="number" tick={{ fontSize: 10, fill: "var(--muted)" }} label={{ value: "RSRP (dBm)", position: "insideBottom", offset: -5, fontSize: 10, fill: "var(--muted)" }} />
                    <YAxis dataKey="y" name="SINR (dB)" tick={{ fontSize: 10, fill: "var(--muted)" }} label={{ value: "SINR (dB)", angle: -90, position: "insideLeft", offset: 10, fontSize: 10, fill: "var(--muted)" }} />
                    <Tooltip {...TOOLTIP_STYLE} cursor={{ strokeDasharray: "3 3" }} />
                    <Scatter data={rssiSinrScatter} fill="#33ccdd" fillOpacity={0.7} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Row 5 */}
            <div style={S.grid2}>
              {/* E-RAB Setup Time */}
              <div style={S.chartCard}>
                <div style={S.chartTitle}>E-RAB Setup Time (ms)</div>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={ts} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="minute" tick={{ fontSize: 10, fill: "var(--muted)" }} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--muted)" }} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Line type="monotone" dataKey="erabSetupTime" name="E-RAB Setup Time (ms)" stroke="#a78bfa" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Cell Availability vs Active UEs Scatter */}
              <div style={S.chartCard}>
                <div style={S.chartTitle}>Cell Availability vs Active UEs</div>
                <ResponsiveContainer width="100%" height={250}>
                  <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="x" name="Active UEs" type="number" tick={{ fontSize: 10, fill: "var(--muted)" }} label={{ value: "Active UEs", position: "insideBottom", offset: -5, fontSize: 10, fill: "var(--muted)" }} />
                    <YAxis dataKey="y" name="Cell Availability (%)" tick={{ fontSize: 10, fill: "var(--muted)" }} label={{ value: "Avail (%)", angle: -90, position: "insideLeft", offset: 10, fontSize: 10, fill: "var(--muted)" }} />
                    <Tooltip {...TOOLTIP_STYLE} cursor={{ strokeDasharray: "3 3" }} />
                    <Scatter data={cellAvailScatter} fill="#22c55e" fillOpacity={0.7} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom Nav ── */}
      <div style={S.bottomNav}>
        <Link href={`/uc10/${passId}`} style={S.backBtn}>
          ← Back to KPI Summary
        </Link>
      </div>
    </div>
  )
}

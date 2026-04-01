"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  getDataCenters,
  getGlobalStats,
  getTimeSeriesForDC,
  getProviderComparison,
} from "@/lib/uc14-data"
import type { DataCenter, Provider, Region, ClusterStatus } from "@/lib/uc14-data"
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

// ─── Constants ──────────────────────────────────────────────────────────────

const PROVIDER_COLORS: Record<Provider, string> = {
  AWS: "#FF9900",
  Azure: "#0078D4",
  GCP: "#4285F4",
  CoreWeave: "#7C3AED",
  Lambda: "#10B981",
  Together: "#F59E0B",
  Groq: "#EF4444",
  Cerebras: "#8B5CF6",
}

const STATUS_COLORS: Record<ClusterStatus, string> = {
  HEALTHY: "#22c55e",
  DEGRADED: "#eab308",
  OVERLOADED: "#ef4444",
  OFFLINE: "#6b7280",
}

const ALL_REGIONS: Region[] = [
  "NA-EAST", "NA-WEST", "EU-WEST", "EU-CENTRAL",
  "APAC-EAST", "APAC-SOUTH", "ME", "SA",
]

const ALL_PROVIDERS: Provider[] = [
  "AWS", "Azure", "GCP", "CoreWeave", "Lambda", "Together", "Groq", "Cerebras",
]

const STATUS_OPTIONS: ClusterStatus[] = ["HEALTHY", "DEGRADED", "OVERLOADED", "OFFLINE"]

// ─── Sub-components ─────────────────────────────────────────────────────────

function ProviderBadge({ provider }: { provider: Provider }) {
  return (
    <span style={{
      fontSize: "10px",
      fontWeight: 700,
      padding: "2px 7px",
      borderRadius: "4px",
      background: PROVIDER_COLORS[provider] + "22",
      color: PROVIDER_COLORS[provider],
      border: `1px solid ${PROVIDER_COLORS[provider]}44`,
      letterSpacing: "0.04em",
    }}>
      {provider}
    </span>
  )
}

function StatusBadge({ status }: { status: ClusterStatus }) {
  return (
    <span style={{
      fontSize: "10px",
      fontWeight: 700,
      padding: "2px 7px",
      borderRadius: "4px",
      background: STATUS_COLORS[status] + "22",
      color: STATUS_COLORS[status],
      border: `1px solid ${STATUS_COLORS[status]}44`,
      letterSpacing: "0.04em",
    }}>
      {status}
    </span>
  )
}

function UtilBar({ value }: { value: number }) {
  const color = value > 85 ? "#ef4444" : value > 70 ? "#eab308" : "#22c55e"
  return (
    <div style={{
      height: "6px",
      borderRadius: "3px",
      background: "var(--surface-2)",
      overflow: "hidden",
      marginTop: "4px",
    }}>
      <div style={{
        height: "100%",
        width: `${value}%`,
        background: color,
        borderRadius: "3px",
        transition: "width 0.3s",
      }} />
    </div>
  )
}

function GreenScoreBadge({ score }: { score: number }) {
  const color = score >= 60 ? "#22c55e" : score >= 35 ? "#eab308" : "#ef4444"
  const icon = score >= 60 ? "🌿" : score >= 35 ? "⚠️" : "🔥"
  return (
    <span style={{
      fontSize: "11px",
      fontWeight: 700,
      padding: "2px 8px",
      borderRadius: "4px",
      background: color + "22",
      color,
      border: `1px solid ${color}44`,
    }}>
      {icon} {score}/100
    </span>
  )
}

function FilterChip({
  label,
  active,
  activeColor,
  onClick,
}: {
  label: string
  active: boolean
  activeColor?: string
  onClick: () => void
}) {
  const color = activeColor ?? "var(--accent)"
  return (
    <button
      onClick={onClick}
      style={{
        padding: "4px 10px",
        borderRadius: "6px",
        border: `1px solid ${active ? color : "var(--border)"}`,
        background: active ? color + "22" : "var(--surface)",
        color: active ? color : "var(--muted)",
        fontSize: "11px",
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.15s",
        letterSpacing: "0.04em",
      }}
    >
      {label}
    </button>
  )
}

// ─── DC Card ────────────────────────────────────────────────────────────────

function DCCard({
  dc,
  selected,
  onClick,
}: {
  dc: DataCenter
  selected: boolean
  onClick: () => void
}) {
  const displayModels = dc.models.slice(0, 3)
  const extraCount = dc.models.length - 3

  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--surface)",
        border: `1px solid ${selected ? "var(--accent)" : "var(--border)"}`,
        borderRadius: "12px",
        padding: "16px",
        cursor: "pointer",
        transition: "border-color 0.15s, box-shadow 0.15s",
        boxShadow: selected ? "0 0 0 2px rgba(51,204,221,0.2)" : "none",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <ProviderBadge provider={dc.provider} />
          <span style={{ fontSize: "11px", color: "var(--muted)" }}>{dc.city}, {dc.country}</span>
        </div>
        <StatusBadge status={dc.status} />
      </div>

      {/* DC name */}
      <div style={{ fontFamily: "monospace", fontSize: "11px", color: "var(--muted)" }}>
        {dc.id}
      </div>

      {/* GPU Utilization */}
      <div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px" }}>
          <span style={{
            fontSize: "28px",
            fontWeight: 800,
            color: dc.gpuUtilization > 85 ? "#ef4444" : dc.gpuUtilization > 70 ? "#eab308" : "var(--accent)",
            lineHeight: 1,
          }}>
            {dc.gpuUtilization}%
          </span>
          <span style={{
            fontSize: "10px",
            fontWeight: 700,
            padding: "2px 6px",
            borderRadius: "4px",
            background: "var(--surface-2)",
            color: "var(--muted)",
          }}>
            {dc.gpuModel}
          </span>
        </div>
        <UtilBar value={dc.gpuUtilization} />
        <div style={{ fontSize: "10px", color: "var(--muted)", marginTop: "3px" }}>
          {dc.gpuCount.toLocaleString()} GPUs
        </div>
      </div>

      {/* Power / PUE / Carbon */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
        {[
          { label: "Power", value: `${dc.powerDrawMW} MW` },
          { label: "PUE", value: dc.pue.toFixed(2) },
          { label: "Carbon", value: `${dc.carbonIntensity}` },
        ].map((m, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ fontSize: "10px", color: "var(--muted)", marginBottom: "2px" }}>{m.label}</div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text)" }}>{m.value}</div>
            {i === 2 && (
              <div style={{ fontSize: "9px", color: "var(--muted)" }}>gCO2/kWh</div>
            )}
          </div>
        ))}
      </div>

      {/* Latency */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
        {[
          { label: "P50 Latency", value: `${dc.inferenceLatencyP50} ms` },
          { label: "P99 Latency", value: `${dc.inferenceLatencyP99} ms` },
        ].map((m, i) => (
          <div key={i}>
            <div style={{ fontSize: "10px", color: "var(--muted)", marginBottom: "2px" }}>{m.label}</div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Green score */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "10px", color: "var(--muted)" }}>Green Score</span>
        <GreenScoreBadge score={dc.greenScore} />
      </div>

      {/* Models */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
        {displayModels.map(m => (
          <span key={m} style={{
            fontSize: "9px",
            fontWeight: 600,
            padding: "2px 6px",
            borderRadius: "4px",
            background: "var(--surface-2)",
            color: "var(--muted)",
            border: "1px solid var(--border)",
          }}>
            {m}
          </span>
        ))}
        {extraCount > 0 && (
          <span style={{
            fontSize: "9px",
            fontWeight: 600,
            padding: "2px 6px",
            borderRadius: "4px",
            background: "var(--surface-2)",
            color: "var(--accent)",
          }}>
            +{extraCount} more
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Detail Panel ────────────────────────────────────────────────────────────

function DetailPanel({ dc, onClose }: { dc: DataCenter; onClose: () => void }) {
  const series = getTimeSeriesForDC(dc.id)

  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--accent)",
      borderRadius: "14px",
      padding: "24px",
      marginBottom: "24px",
      boxShadow: "0 0 0 2px rgba(51,204,221,0.1)",
    }}>
      {/* Panel header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
            <ProviderBadge provider={dc.provider} />
            <StatusBadge status={dc.status} />
            <span style={{ fontFamily: "monospace", fontSize: "12px", color: "var(--muted)" }}>{dc.id}</span>
          </div>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "var(--text)" }}>
            {dc.name} — 24h Analytics
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--muted)" }}>
            {dc.city}, {dc.country} · {dc.gpuCount.toLocaleString()} {dc.gpuModel} GPUs
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "8px 16px",
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--muted)",
            cursor: "pointer",
          }}
        >
          ✕ Close
        </button>
      </div>

      {/* Charts grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
        {/* GPU Utilization */}
        <div>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "10px" }}>
            GPU Utilization (%)
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={series} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "var(--muted)" }} tickFormatter={h => `${h}h`} />
              <YAxis tick={{ fontSize: 9, fill: "var(--muted)" }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "11px" }}
                labelFormatter={h => `Hour ${h}:00`}
              />
              <Area type="monotone" dataKey="gpuUtilization" stroke="#33ccdd" fill="rgba(51,204,221,0.15)" strokeWidth={2} name="GPU Util %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Power Draw */}
        <div>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "10px" }}>
            Power Draw (MW)
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={series} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "var(--muted)" }} tickFormatter={h => `${h}h`} />
              <YAxis tick={{ fontSize: 9, fill: "var(--muted)" }} />
              <Tooltip
                contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "11px" }}
                labelFormatter={h => `Hour ${h}:00`}
              />
              <Line type="monotone" dataKey="powerDraw" stroke="#f59e0b" strokeWidth={2} dot={false} name="Power (MW)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Latency P50 + P99 */}
        <div>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "10px" }}>
            Inference Latency (ms)
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <ComposedChart data={series} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "var(--muted)" }} tickFormatter={h => `${h}h`} />
              <YAxis tick={{ fontSize: 9, fill: "var(--muted)" }} />
              <Tooltip
                contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "11px" }}
                labelFormatter={h => `Hour ${h}:00`}
              />
              <Legend wrapperStyle={{ fontSize: "10px" }} />
              <Line type="monotone" dataKey="latencyP50" stroke="#22c55e" strokeWidth={2} dot={false} name="P50 ms" />
              <Line type="monotone" dataKey="latencyP99" stroke="#ef4444" strokeWidth={2} dot={false} name="P99 ms" strokeDasharray="4 2" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Carbon Intensity */}
        <div>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "10px" }}>
            Carbon Intensity (gCO2/kWh)
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={series} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "var(--muted)" }} tickFormatter={h => `${h}h`} />
              <YAxis tick={{ fontSize: 9, fill: "var(--muted)" }} />
              <Tooltip
                contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "11px" }}
                labelFormatter={h => `Hour ${h}:00`}
              />
              <Area type="monotone" dataKey="carbonIntensity" stroke="#22c55e" fill="rgba(34,197,94,0.1)" strokeWidth={2} name="gCO2/kWh" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UC14Page() {
  const allDCs = getDataCenters()
  const globalStats = getGlobalStats()
  const providerComparison = getProviderComparison()

  const [selectedDC, setSelectedDC] = useState<DataCenter | null>(null)
  const [regionFilter, setRegionFilter] = useState<Region | "ALL">("ALL")
  const [providerFilter, setProviderFilter] = useState<Provider | "ALL">("ALL")
  const [statusFilter, setStatusFilter] = useState<ClusterStatus | "ALL">("ALL")

  const filtered = useMemo(() => {
    return allDCs.filter(dc => {
      if (regionFilter !== "ALL" && dc.region !== regionFilter) return false
      if (providerFilter !== "ALL" && dc.provider !== providerFilter) return false
      if (statusFilter !== "ALL" && dc.status !== statusFilter) return false
      return true
    })
  }, [allDCs, regionFilter, providerFilter, statusFilter])

  const handleCardClick = (dc: DataCenter) => {
    setSelectedDC(prev => prev?.id === dc.id ? null : dc)
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg)",
      padding: "clamp(16px, 4vw, 32px) clamp(12px, 3vw, 24px) 64px",
      maxWidth: "1440px",
      margin: "0 auto",
    }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--muted)", marginBottom: "20px" }}>
        <Link href="/use-cases" style={{ color: "var(--muted)", textDecoration: "none" }}>Use Cases</Link>
        <span>›</span>
        <span style={{ color: "var(--accent)" }}>UC14</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px", flexWrap: "wrap" }}>
          <span style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em",
            padding: "3px 10px", borderRadius: "4px",
            background: "var(--accent-dim)", color: "var(--accent)",
            border: "1px solid rgba(51,204,221,0.2)",
          }}>
            UC14 · GLOBAL AI INFERENCE GRID
          </span>
          {/* LIVE SIM badge */}
          <span style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "10px",
            fontWeight: 700,
            padding: "3px 10px",
            borderRadius: "4px",
            background: "rgba(249,115,22,0.1)",
            color: "#f97316",
            border: "1px solid rgba(249,115,22,0.3)",
            letterSpacing: "0.08em",
          }}>
            <span style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#f97316",
              display: "inline-block",
              animation: "pulse 1.4s ease-in-out infinite",
            }} />
            LIVE SIM
          </span>
        </div>
        <h1 style={{ fontSize: "32px", fontWeight: 800, color: "var(--text)", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
          AI Inference Grid — Global GPU Compute Monitor
        </h1>
        <p style={{ fontSize: "14px", color: "var(--muted)", margin: 0, maxWidth: "620px" }}>
          25 clusters · 8 hyperscalers · real-time utilization, latency &amp; carbon
        </p>
      </div>

      {/* Global stats bar */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: "12px",
        marginBottom: "28px",
      }}>
        {[
          {
            label: "Total GPUs",
            value: globalStats.totalGPUs.toLocaleString(),
            sub: "H100 · A100 · H200 · TPU-v5",
            color: "var(--accent)",
          },
          {
            label: "Active Clusters",
            value: `${globalStats.activeClusters}/25`,
            sub: `${25 - globalStats.activeClusters} offline`,
            color: "#22c55e",
          },
          {
            label: "Avg GPU Utilization",
            value: `${globalStats.avgUtilization}%`,
            sub: "across all clusters",
            color: globalStats.avgUtilization > 80 ? "#ef4444" : globalStats.avgUtilization > 65 ? "#eab308" : "var(--accent)",
          },
          {
            label: "Total Power Draw",
            value: `${globalStats.totalPowerMW} MW`,
            sub: "across all data centers",
            color: "#f59e0b",
          },
          {
            label: "Avg Carbon Intensity",
            value: `${globalStats.avgCarbonIntensity}`,
            sub: "gCO2/kWh " + (globalStats.avgCarbonIntensity < 200 ? "🌿" : "🔥"),
            color: globalStats.avgCarbonIntensity < 200 ? "#22c55e" : globalStats.avgCarbonIntensity < 400 ? "#eab308" : "#ef4444",
          },
        ].map((stat, i) => (
          <div key={i} style={{
            padding: "16px",
            borderRadius: "10px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}>
            <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {stat.label}
            </div>
            <div style={{ fontSize: "26px", fontWeight: 800, color: stat.color, lineHeight: 1, marginBottom: "4px" }}>
              {stat.value}
            </div>
            <div style={{ fontSize: "10px", color: "var(--muted)" }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters row */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
          Region:
        </span>
        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
          <FilterChip label="All Regions" active={regionFilter === "ALL"} onClick={() => setRegionFilter("ALL")} />
          {ALL_REGIONS.map(r => (
            <FilterChip key={r} label={r} active={regionFilter === r} onClick={() => setRegionFilter(r)} />
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
          Provider:
        </span>
        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
          <FilterChip label="All" active={providerFilter === "ALL"} onClick={() => setProviderFilter("ALL")} />
          {ALL_PROVIDERS.map(p => (
            <FilterChip
              key={p}
              label={p}
              active={providerFilter === p}
              activeColor={PROVIDER_COLORS[p]}
              onClick={() => setProviderFilter(p)}
            />
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "8px", flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
          Status:
        </span>
        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
          <FilterChip label="All" active={statusFilter === "ALL"} onClick={() => setStatusFilter("ALL")} />
          {STATUS_OPTIONS.map(s => (
            <FilterChip
              key={s}
              label={s}
              active={statusFilter === s}
              activeColor={STATUS_COLORS[s]}
              onClick={() => setStatusFilter(s)}
            />
          ))}
        </div>
        <span style={{ fontSize: "11px", color: "var(--muted)", marginLeft: "auto" }}>
          {filtered.length} of {allDCs.length} clusters
        </span>
      </div>

      {/* Detail panel */}
      {selectedDC && (
        <div style={{ marginTop: "20px" }}>
          <DetailPanel dc={selectedDC} onClose={() => setSelectedDC(null)} />
        </div>
      )}

      {/* DC Cards grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "16px",
        marginTop: "20px",
      }}>
        {filtered.map(dc => (
          <DCCard
            key={dc.id}
            dc={dc}
            selected={selectedDC?.id === dc.id}
            onClick={() => handleCardClick(dc)}
          />
        ))}
        {filtered.length === 0 && (
          <div style={{
            gridColumn: "1 / -1",
            padding: "64px",
            textAlign: "center",
            color: "var(--muted)",
            fontSize: "14px",
          }}>
            No clusters match the selected filters.
          </div>
        )}
      </div>

      {/* Provider comparison table */}
      <div style={{ marginTop: "48px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text)", marginBottom: "16px" }}>
          Provider Comparison
        </h2>
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          overflow: "hidden",
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}>
                  {["Provider", "Clusters", "Total GPUs", "Avg Utilization", "Avg Latency P50", "Green Score"].map((col, i) => (
                    <th key={i} style={{
                      padding: "10px 14px",
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
                {providerComparison.map((row, idx) => (
                  <tr
                    key={row.provider}
                    style={{ borderBottom: idx < providerComparison.length - 1 ? "1px solid var(--border)" : "none" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "10px 14px" }}>
                      <ProviderBadge provider={row.provider} />
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: "13px", color: "var(--text)", fontWeight: 600 }}>
                      {row.clusters}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: "13px", color: "var(--text)" }}>
                      {row.totalGPUs.toLocaleString()}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: row.avgUtilization > 85 ? "#ef4444" : row.avgUtilization > 70 ? "#eab308" : "#22c55e",
                      }}>
                        {row.avgUtilization}%
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: "13px", color: "var(--text)", fontFamily: "monospace" }}>
                      {row.avgLatencyP50} ms
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <GreenScoreBadge score={row.avgGreenScore} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Details link */}
      <div style={{ marginTop: "32px", textAlign: "center" }}>
        <Link
          href="/uc14/details"
          style={{
            display: "inline-block",
            background: "transparent",
            color: "var(--accent)",
            border: "1px solid rgba(51,204,221,0.4)",
            borderRadius: "8px",
            padding: "10px 24px",
            fontSize: "13px",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          View Architecture Details →
        </Link>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
    </div>
  )
}

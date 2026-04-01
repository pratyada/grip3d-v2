"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  getDataCenters,
  getGlobalStats,
  getProviderComparison,
  getTimeSeriesForDC,
} from "@/lib/uc14-data"
import type { DataCenter, ClusterStatus, Provider } from "@/lib/uc14-data"
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

// ─── Constants ───────────────────────────────────────────────────────────────

const PROVIDER_COLORS: Record<string, string> = {
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

// ─── Arc generator ───────────────────────────────────────────────────────────

function generateArcs(dcs: DataCenter[]) {
  const healthyDCs = dcs.filter((dc) => dc.status !== "OFFLINE")
  const arcs: Array<{
    srcLat: number
    srcLng: number
    dstLat: number
    dstLng: number
    color: [string, string]
  }> = []
  const pairs = [
    [0, 3], [1, 4], [2, 7], [3, 8], [5, 9], [6, 11], [7, 12], [0, 15], [2, 18], [4, 20],
    [1, 6], [8, 13], [9, 14], [10, 16], [11, 17], [3, 19], [5, 21], [7, 22], [12, 23], [0, 24],
  ]
  for (const [i, j] of pairs) {
    const src = healthyDCs[i % healthyDCs.length]
    const dst = healthyDCs[j % healthyDCs.length]
    if (src && dst) {
      arcs.push({
        srcLat: src.lat,
        srcLng: src.lng,
        dstLat: dst.lat,
        dstLng: dst.lng,
        color: ["rgba(51,204,221,0.6)", "rgba(51,204,221,0.0)"],
      })
    }
  }
  return arcs
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ProviderBadge({ provider }: { provider: string }) {
  const color = PROVIDER_COLORS[provider] ?? "#aaa"
  return (
    <span
      style={{
        fontSize: "10px",
        fontWeight: 700,
        padding: "2px 7px",
        borderRadius: "4px",
        background: color + "22",
        color,
        border: `1px solid ${color}44`,
        letterSpacing: "0.04em",
      }}
    >
      {provider}
    </span>
  )
}

function StatusBadge({ status }: { status: ClusterStatus }) {
  const color = STATUS_COLORS[status]
  return (
    <span
      style={{
        fontSize: "10px",
        fontWeight: 700,
        padding: "2px 7px",
        borderRadius: "4px",
        background: color + "22",
        color,
        border: `1px solid ${color}44`,
        letterSpacing: "0.04em",
      }}
    >
      {status}
    </span>
  )
}

function GreenScoreBadge({ score }: { score: number }) {
  const color = score >= 60 ? "#22c55e" : score >= 35 ? "#eab308" : "#ef4444"
  return (
    <span
      style={{
        fontSize: "11px",
        fontWeight: 700,
        padding: "2px 8px",
        borderRadius: "4px",
        background: color + "22",
        color,
        border: `1px solid ${color}44`,
      }}
    >
      {score}/100
    </span>
  )
}

// ─── Selected DC Detail Overlay ──────────────────────────────────────────────

function SelectedDCPanel({
  dc,
  onClose,
  onScrollToDashboard,
}: {
  dc: DataCenter
  onClose: () => void
  onScrollToDashboard: () => void
}) {
  const series = getTimeSeriesForDC(dc.id)
  const utilColor =
    dc.gpuUtilization > 85
      ? "#ef4444"
      : dc.gpuUtilization > 70
      ? "#eab308"
      : "#22c55e"
  const providerColor = PROVIDER_COLORS[dc.provider] ?? "#aaa"
  const greenColor =
    dc.greenScore >= 60 ? "#22c55e" : dc.greenScore >= 35 ? "#eab308" : "#ef4444"

  return (
    <div
      style={{
        position: "absolute",
        bottom: 20,
        left: 20,
        width: 300,
        zIndex: 20,
        background: "rgba(5,13,18,0.95)",
        border: "1px solid rgba(51,204,221,0.35)",
        borderRadius: 14,
        padding: "16px",
        backdropFilter: "blur(12px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 4,
              flexWrap: "wrap",
            }}
          >
            <ProviderBadge provider={dc.provider} />
            <StatusBadge status={dc.status} />
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.2,
            }}
          >
            {dc.name}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
            {dc.city}, {dc.country}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 6,
            color: "rgba(255,255,255,0.6)",
            fontSize: 12,
            cursor: "pointer",
            padding: "3px 8px",
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      </div>

      {/* Key metrics 2x2 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          marginBottom: 10,
        }}
      >
        {[
          { label: "GPU Util", value: `${dc.gpuUtilization}%`, color: utilColor },
          {
            label: "P50 Latency",
            value: `${dc.inferenceLatencyP50}ms`,
            color: "#33ccdd",
          },
          {
            label: "Power Draw",
            value: `${dc.powerDrawMW} MW`,
            color: "#f59e0b",
          },
          {
            label: "Carbon",
            value: `${dc.carbonIntensity}`,
            color:
              dc.carbonIntensity > 400
                ? "#ef4444"
                : dc.carbonIntensity > 200
                ? "#eab308"
                : "#22c55e",
          },
        ].map((m) => (
          <div
            key={m.label}
            style={{
              background: "rgba(255,255,255,0.05)",
              borderRadius: 8,
              padding: "8px 10px",
            }}
          >
            <div
              style={{
                fontSize: 9,
                color: "rgba(255,255,255,0.45)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 3,
              }}
            >
              {m.label}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: m.color, lineHeight: 1 }}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* Green score bar */}
      <div style={{ marginBottom: 10 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 10,
            color: "rgba(255,255,255,0.45)",
            marginBottom: 4,
          }}
        >
          <span>Green Score</span>
          <span style={{ color: greenColor, fontWeight: 700 }}>
            {dc.greenScore}/100
          </span>
        </div>
        <div
          style={{
            height: 5,
            borderRadius: 3,
            background: "rgba(255,255,255,0.1)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${dc.greenScore}%`,
              background: greenColor,
              borderRadius: 3,
            }}
          />
        </div>
      </div>

      {/* GPU util mini chart */}
      <div style={{ marginBottom: 10 }}>
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: "rgba(255,255,255,0.4)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 4,
          }}
        >
          GPU Util (24h)
        </div>
        <ResponsiveContainer width="100%" height={60}>
          <AreaChart data={series} margin={{ top: 2, right: 2, left: -30, bottom: 0 }}>
            <XAxis dataKey="hour" hide />
            <YAxis domain={[0, 100]} hide />
            <Area
              type="monotone"
              dataKey="gpuUtilization"
              stroke="#33ccdd"
              fill="rgba(51,204,221,0.15)"
              strokeWidth={1.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Models */}
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            fontSize: 9,
            color: "rgba(255,255,255,0.4)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 5,
          }}
        >
          Serving Models
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {dc.models.slice(0, 4).map((m) => (
            <span
              key={m}
              style={{
                fontSize: "9px",
                fontWeight: 600,
                padding: "2px 6px",
                borderRadius: 4,
                background: "rgba(255,255,255,0.07)",
                color: "rgba(255,255,255,0.55)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {m}
            </span>
          ))}
          {dc.models.length > 4 && (
            <span
              style={{
                fontSize: "9px",
                fontWeight: 600,
                padding: "2px 6px",
                borderRadius: 4,
                background: "rgba(51,204,221,0.1)",
                color: "#33ccdd",
              }}
            >
              +{dc.models.length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Scroll to dashboard */}
      <button
        onClick={onScrollToDashboard}
        style={{
          width: "100%",
          padding: "8px",
          borderRadius: 8,
          background: "rgba(51,204,221,0.12)",
          border: "1px solid rgba(51,204,221,0.3)",
          color: "#33ccdd",
          fontSize: 11,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        View in Dashboard ↓
      </button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UC14GlobePage() {
  const globeRef = useRef<HTMLDivElement>(null)
  const globeInstanceRef = useRef<any>(null)
  const dashboardRef = useRef<HTMLDivElement>(null)

  const [selectedDC, setSelectedDC] = useState<DataCenter | null>(null)
  const [colorMode, setColorMode] = useState<"provider" | "utilization" | "carbon">(
    "provider"
  )
  const [showArcs, setShowArcs] = useState(true)
  const [showLabels, setShowLabels] = useState(false)
  const [globeReady, setGlobeReady] = useState(false)

  const dataCenters = getDataCenters()
  const globalStats = getGlobalStats()
  const providerComparison = getProviderComparison()
  const top5Green = [...dataCenters]
    .sort((a, b) => b.greenScore - a.greenScore)
    .slice(0, 5)

  // ── Globe init ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!globeRef.current || typeof window === "undefined") return

    // @ts-ignore
    import("globe.gl").then((GlobeModule) => {
      const Globe = GlobeModule.default

      // Destroy previous instance
      if (globeInstanceRef.current) {
        globeInstanceRef.current._destructor?.()
      }
      if (globeRef.current) {
        globeRef.current.innerHTML = ""
      }

      const globe = new Globe(globeRef.current!)

      const arcData = showArcs ? generateArcs(dataCenters) : []

      globe
        .width(globeRef.current!.clientWidth)
        .height(globeRef.current!.clientHeight)
        .backgroundColor("rgba(0,0,0,0)")
        .globeImageUrl("//unpkg.com/three-globe/example/img/earth-dark.jpg")
        .atmosphereColor("#33ccdd")
        .atmosphereAltitude(0.15)
        // Points
        .pointsData(dataCenters)
        .pointLat((d: any) => (d as DataCenter).lat)
        .pointLng((d: any) => (d as DataCenter).lng)
        .pointAltitude((d: any) => {
          const dc = d as DataCenter
          return colorMode === "utilization" ? dc.gpuUtilization / 1000 : 0.01
        })
        .pointRadius((d: any) => {
          const dc = d as DataCenter
          return colorMode === "utilization" ? 0.3 + dc.gpuUtilization / 200 : 0.4
        })
        .pointColor((d: any) => {
          const dc = d as DataCenter
          if (colorMode === "provider") return PROVIDER_COLORS[dc.provider] ?? "#aaa"
          if (colorMode === "utilization") {
            if (dc.gpuUtilization > 85) return "#ef4444"
            if (dc.gpuUtilization > 70) return "#eab308"
            return "#22c55e"
          }
          // carbon mode
          if (dc.carbonIntensity > 400) return "#ef4444"
          if (dc.carbonIntensity > 200) return "#eab308"
          return "#22c55e"
        })
        .pointLabel((d: any) => {
          const dc = d as DataCenter
          return `<div style="background:rgba(0,0,0,0.85);padding:8px 12px;border-radius:8px;border:1px solid rgba(51,204,221,0.3);font-family:monospace;font-size:12px;color:#fff;min-width:160px">
            <div style="font-weight:700;color:#33ccdd;margin-bottom:4px">${dc.name}</div>
            <div style="color:#aaa;font-size:10px">${dc.provider} · ${dc.city}</div>
            <div style="margin-top:6px;display:flex;gap:12px">
              <div><span style="color:#aaa;font-size:10px">GPU</span><br/><span style="color:#fff;font-weight:600">${dc.gpuUtilization.toFixed(0)}%</span></div>
              <div><span style="color:#aaa;font-size:10px">Latency</span><br/><span style="color:#fff;font-weight:600">${dc.inferenceLatencyP50.toFixed(0)}ms</span></div>
              <div><span style="color:#aaa;font-size:10px">Carbon</span><br/><span style="color:#4ade80;font-weight:600">${dc.carbonIntensity.toFixed(0)}</span></div>
            </div>
          </div>`
        })
        .onPointClick((point: any) => {
          setSelectedDC(point as DataCenter)
        })
        // Arcs
        .arcsData(arcData)
        .arcStartLat((d: any) => d.srcLat)
        .arcStartLng((d: any) => d.srcLng)
        .arcEndLat((d: any) => d.dstLat)
        .arcEndLng((d: any) => d.dstLng)
        .arcColor((d: any) => d.color)
        .arcAltitude(0.2)
        .arcStroke(0.5)
        .arcDashLength(0.4)
        .arcDashGap(0.2)
        .arcDashAnimateTime(2000)

      // Labels
      if (showLabels) {
        globe
          .labelsData(dataCenters)
          .labelLat((d: any) => (d as DataCenter).lat)
          .labelLng((d: any) => (d as DataCenter).lng)
          .labelText((d: any) => (d as DataCenter).city)
          .labelSize(0.4)
          .labelColor(() => "rgba(255,255,255,0.7)")
          .labelDotRadius(0.3)
          .labelAltitude(0.02)
      }

      globe.pointOfView({ lat: 30, lng: -40, altitude: 2.2 }, 0)
      globeInstanceRef.current = globe
      setGlobeReady(true)

      const handleResize = () => {
        if (globeRef.current && globeInstanceRef.current) {
          globeInstanceRef.current.width(globeRef.current.clientWidth)
          globeInstanceRef.current.height(globeRef.current.clientHeight)
        }
      }
      window.addEventListener("resize", handleResize)
      return () => window.removeEventListener("resize", handleResize)
    })
  }, [colorMode, showArcs, showLabels])

  const scrollToDashboard = () => {
    dashboardRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <>
      {/* ── GLOBE SECTION ── */}
      <div
        style={{
          position: "relative",
          height: "100vh",
          overflow: "hidden",
          background: "#050d12",
        }}
      >
        {/* Globe canvas */}
        <div
          ref={globeRef}
          style={{ position: "absolute", inset: 0 }}
        />

        {/* Loading overlay */}
        {!globeReady && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 5,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  border: "3px solid rgba(51,204,221,0.2)",
                  borderTopColor: "#33ccdd",
                  animation: "spin 0.8s linear infinite",
                  margin: "0 auto 12px",
                }}
              />
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                Initializing globe...
              </div>
            </div>
          </div>
        )}

        {/* ── Top-left: Header badge ── */}
        <div style={{ position: "absolute", top: 20, left: 20, zIndex: 10 }}>
          <Link
            href="/use-cases"
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 12,
              textDecoration: "none",
            }}
          >
            ← Use Cases
          </Link>
          <div
            style={{
              marginTop: 8,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.12em",
                padding: "3px 10px",
                borderRadius: 4,
                background: "rgba(51,204,221,0.15)",
                color: "#33ccdd",
                border: "1px solid rgba(51,204,221,0.3)",
              }}
            >
              UC14 · AI INFERENCE GRID
            </span>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#22c55e",
                boxShadow: "0 0 8px #22c55e",
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: 10, color: "#22c55e", fontWeight: 700 }}>
              LIVE SIM
            </span>
          </div>
          <div
            style={{ marginTop: 6, fontSize: 18, fontWeight: 800, color: "#fff" }}
          >
            Global AI Inference Grid
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
            25 GPU clusters · 8 hyperscalers · rotate to explore
          </div>
        </div>

        {/* ── Top-right: Layer control panel ── */}
        <div
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            width: 210,
            zIndex: 10,
            background: "rgba(5,13,18,0.92)",
            border: "1px solid rgba(51,204,221,0.25)",
            borderRadius: 12,
            padding: "14px 16px",
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Color mode */}
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: "rgba(255,255,255,0.4)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 8,
            }}
          >
            Color Mode
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 14 }}>
            {(["provider", "utilization", "carbon"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setColorMode(mode)}
                style={{
                  padding: "5px 10px",
                  borderRadius: 6,
                  border: `1px solid ${
                    colorMode === mode
                      ? "rgba(51,204,221,0.5)"
                      : "rgba(255,255,255,0.1)"
                  }`,
                  background:
                    colorMode === mode
                      ? "rgba(51,204,221,0.12)"
                      : "transparent",
                  color:
                    colorMode === mode
                      ? "#33ccdd"
                      : "rgba(255,255,255,0.5)",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "left",
                  textTransform: "capitalize",
                }}
              >
                {mode === "provider"
                  ? "Provider"
                  : mode === "utilization"
                  ? "Utilization"
                  : "Carbon Intensity"}
              </button>
            ))}
          </div>

          {/* Toggles */}
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: "rgba(255,255,255,0.4)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 8,
            }}
          >
            Layers
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
            {[
              {
                label: "Request Arcs",
                value: showArcs,
                set: setShowArcs,
              },
              {
                label: "City Labels",
                value: showLabels,
                set: setShowLabels,
              },
            ].map(({ label, value, set }) => (
              <label
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  fontSize: 11,
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                <div
                  onClick={() => set(!value)}
                  style={{
                    width: 28,
                    height: 16,
                    borderRadius: 8,
                    background: value
                      ? "rgba(51,204,221,0.8)"
                      : "rgba(255,255,255,0.15)",
                    position: "relative",
                    cursor: "pointer",
                    transition: "background 0.2s",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 2,
                      left: value ? 14 : 2,
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: "#fff",
                      transition: "left 0.2s",
                    }}
                  />
                </div>
                {label}
              </label>
            ))}
          </div>

          {/* Legend */}
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: "rgba(255,255,255,0.4)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 8,
            }}
          >
            Legend
          </div>
          {colorMode === "provider" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {Object.entries(PROVIDER_COLORS).map(([name, color]) => (
                <div
                  key={name}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: color,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.55)" }}>
                    {name}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {[
                { color: "#22c55e", label: colorMode === "utilization" ? "< 70% util" : "< 200 gCO₂" },
                { color: "#eab308", label: colorMode === "utilization" ? "70–85% util" : "200–400 gCO₂" },
                { color: "#ef4444", label: colorMode === "utilization" ? "> 85% util" : "> 400 gCO₂" },
              ].map(({ color, label }) => (
                <div
                  key={label}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: color,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.55)" }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Bottom-right: Global stats strip ── */}
        <div
          style={{
            position: "absolute",
            bottom: 20,
            right: 20,
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {[
            {
              label: "Total GPUs",
              value: globalStats.totalGPUs.toLocaleString(),
              color: "#33ccdd",
            },
            {
              label: "Avg Util",
              value: `${globalStats.avgUtilization.toFixed(1)}%`,
              color:
                globalStats.avgUtilization > 80
                  ? "#ef4444"
                  : globalStats.avgUtilization > 65
                  ? "#eab308"
                  : "#22c55e",
            },
            {
              label: "Power",
              value: `${globalStats.totalPowerMW.toFixed(0)} MW`,
              color: "#f59e0b",
            },
            {
              label: "Avg CO₂",
              value: `${globalStats.avgCarbonIntensity.toFixed(0)} gCO₂/kWh`,
              color:
                globalStats.avgCarbonIntensity < 200
                  ? "#22c55e"
                  : globalStats.avgCarbonIntensity < 400
                  ? "#eab308"
                  : "#ef4444",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: "rgba(5,13,18,0.85)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                padding: "6px 12px",
                backdropFilter: "blur(8px)",
                display: "flex",
                alignItems: "center",
                gap: 10,
                minWidth: 170,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.4)",
                  flex: 1,
                }}
              >
                {stat.label}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: stat.color,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {stat.value}
              </span>
            </div>
          ))}
        </div>

        {/* ── Bottom-left: Selected DC panel ── */}
        {selectedDC && (
          <SelectedDCPanel
            dc={selectedDC}
            onClose={() => setSelectedDC(null)}
            onScrollToDashboard={scrollToDashboard}
          />
        )}

        {/* Scroll hint */}
        <div
          onClick={scrollToDashboard}
          style={{
            position: "absolute",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            cursor: "pointer",
            opacity: selectedDC ? 0 : 1,
            transition: "opacity 0.3s",
          }}
        >
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
            scroll for dashboard
          </span>
          <span style={{ fontSize: 16, color: "rgba(255,255,255,0.2)", animation: "bounce 2s ease-in-out infinite" }}>
            ↓
          </span>
        </div>
      </div>

      {/* ── DASHBOARD SECTION ── */}
      <div
        ref={dashboardRef}
        style={{
          background: "var(--bg)",
          padding: "clamp(24px, 4vw, 48px) clamp(12px, 3vw, 32px) 64px",
          maxWidth: 1440,
          margin: "0 auto",
        }}
      >
        {/* Section header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 32,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "clamp(20px, 3vw, 28px)",
                fontWeight: 800,
                color: "var(--text)",
                margin: "0 0 6px",
              }}
            >
              Infrastructure Dashboard
            </h2>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
              25 clusters across 8 hyperscalers · click globe points to select
            </p>
          </div>
          <button
            onClick={scrollToTop}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              background: "transparent",
              border: "1px solid rgba(51,204,221,0.35)",
              color: "#33ccdd",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ↑ Back to Globe
          </button>
        </div>

        {/* Top 5 greenest clusters */}
        <div style={{ marginBottom: 40 }}>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: 14,
            }}
          >
            Top 5 Greenest Clusters
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
            }}
          >
            {top5Green.map((dc, idx) => {
              const color = PROVIDER_COLORS[dc.provider] ?? "#aaa"
              return (
                <div
                  key={dc.id}
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderLeft: `4px solid ${color}`,
                    borderRadius: 10,
                    padding: "12px 14px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: "rgba(255,255,255,0.25)",
                      }}
                    >
                      #{idx + 1}
                    </span>
                    <ProviderBadge provider={dc.provider} />
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "var(--text)",
                      marginBottom: 2,
                    }}
                  >
                    {dc.city}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--muted)",
                      marginBottom: 8,
                    }}
                  >
                    {dc.name}
                  </div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: "#22c55e",
                      lineHeight: 1,
                    }}
                  >
                    {dc.greenScore}
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--muted)",
                        marginLeft: 2,
                      }}
                    >
                      /100
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--muted)",
                      marginTop: 4,
                    }}
                  >
                    {dc.carbonIntensity} gCO₂/kWh
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Provider comparison table */}
        <div style={{ marginBottom: 40 }}>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: 14,
            }}
          >
            Provider Comparison
          </h3>
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: 600,
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid var(--border)",
                      background: "var(--surface-2)",
                    }}
                  >
                    {[
                      "Provider",
                      "Clusters",
                      "Total GPUs",
                      "Avg Utilization",
                      "Avg Latency P50",
                      "Green Score",
                    ].map((col) => (
                      <th
                        key={col}
                        style={{
                          padding: "10px 14px",
                          textAlign: "left",
                          fontSize: 10,
                          fontWeight: 700,
                          color: "var(--muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.07em",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {providerComparison.map((row, idx) => {
                    const utilColor =
                      row.avgUtilization > 85
                        ? "#ef4444"
                        : row.avgUtilization > 70
                        ? "#eab308"
                        : "#22c55e"
                    return (
                      <tr
                        key={row.provider}
                        style={{
                          borderBottom:
                            idx < providerComparison.length - 1
                              ? "1px solid var(--border)"
                              : "none",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "var(--surface-2)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <td style={{ padding: "10px 14px" }}>
                          <ProviderBadge provider={row.provider} />
                        </td>
                        <td
                          style={{
                            padding: "10px 14px",
                            fontSize: 13,
                            color: "var(--text)",
                            fontWeight: 600,
                          }}
                        >
                          {row.clusters}
                        </td>
                        <td
                          style={{
                            padding: "10px 14px",
                            fontSize: 13,
                            color: "var(--text)",
                          }}
                        >
                          {row.totalGPUs.toLocaleString()}
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <div>
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: utilColor,
                              }}
                            >
                              {row.avgUtilization}%
                            </span>
                            <div
                              style={{
                                height: 4,
                                borderRadius: 2,
                                background: "var(--surface-2)",
                                marginTop: 4,
                                overflow: "hidden",
                                width: 80,
                              }}
                            >
                              <div
                                style={{
                                  height: "100%",
                                  width: `${row.avgUtilization}%`,
                                  background: utilColor,
                                  borderRadius: 2,
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "10px 14px",
                            fontSize: 13,
                            color: "var(--text)",
                            fontFamily: "monospace",
                          }}
                        >
                          {row.avgLatencyP50} ms
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <GreenScoreBadge score={row.avgGreenScore} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Cluster health grid */}
        <div style={{ marginBottom: 40 }}>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: 14,
            }}
          >
            All 25 Clusters
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 14,
            }}
          >
            {dataCenters.map((dc) => {
              const providerColor = PROVIDER_COLORS[dc.provider] ?? "#aaa"
              const utilColor =
                dc.gpuUtilization > 85
                  ? "#ef4444"
                  : dc.gpuUtilization > 70
                  ? "#eab308"
                  : "#33ccdd"
              const isSelected = selectedDC?.id === dc.id

              return (
                <div
                  key={dc.id}
                  onClick={() =>
                    setSelectedDC((prev) =>
                      prev?.id === dc.id ? null : dc
                    )
                  }
                  style={{
                    background: "var(--surface)",
                    border: `1px solid ${
                      isSelected ? "rgba(51,204,221,0.6)" : "var(--border)"
                    }`,
                    borderLeft: `4px solid ${providerColor}`,
                    borderRadius: 10,
                    padding: "14px 16px",
                    cursor: "pointer",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                    boxShadow: isSelected
                      ? "0 0 0 2px rgba(51,204,221,0.15)"
                      : "none",
                  }}
                >
                  {/* Header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 8,
                      gap: 6,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "var(--text)",
                          marginBottom: 2,
                        }}
                      >
                        {dc.city}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          fontFamily: "monospace",
                          color: "var(--muted)",
                        }}
                      >
                        {dc.name}
                      </div>
                    </div>
                    <StatusBadge status={dc.status} />
                  </div>

                  {/* GPU util */}
                  <div style={{ marginBottom: 10 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 4,
                      }}
                    >
                      <span style={{ fontSize: 10, color: "var(--muted)" }}>
                        GPU Utilization
                      </span>
                      <span
                        style={{
                          fontSize: 20,
                          fontWeight: 800,
                          color: utilColor,
                          lineHeight: 1,
                        }}
                      >
                        {dc.gpuUtilization}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: 5,
                        borderRadius: 3,
                        background: "var(--surface-2)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${dc.gpuUtilization}%`,
                          background: utilColor,
                          borderRadius: 3,
                        }}
                      />
                    </div>
                  </div>

                  {/* Metrics row */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: 6,
                      marginBottom: 10,
                    }}
                  >
                    {[
                      {
                        label: "Power",
                        value: `${dc.powerDrawMW}MW`,
                        color: "#f59e0b",
                      },
                      {
                        label: "Carbon",
                        value: `${dc.carbonIntensity}`,
                        color:
                          dc.carbonIntensity > 400
                            ? "#ef4444"
                            : dc.carbonIntensity > 200
                            ? "#eab308"
                            : "#22c55e",
                      },
                      {
                        label: "P50",
                        value: `${dc.inferenceLatencyP50}ms`,
                        color: "var(--text)",
                      },
                    ].map((m) => (
                      <div key={m.label} style={{ textAlign: "center" }}>
                        <div
                          style={{
                            fontSize: 9,
                            color: "var(--muted)",
                            marginBottom: 2,
                          }}
                        >
                          {m.label}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: m.color,
                          }}
                        >
                          {m.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer badges */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <ProviderBadge provider={dc.provider} />
                    <GreenScoreBadge score={dc.greenScore} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Details link */}
        <div style={{ textAlign: "center" }}>
          <Link
            href="/uc14/details"
            style={{
              display: "inline-block",
              background: "transparent",
              color: "var(--accent)",
              border: "1px solid rgba(51,204,221,0.4)",
              borderRadius: 8,
              padding: "10px 28px",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            View Architecture Details →
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
    </>
  )
}

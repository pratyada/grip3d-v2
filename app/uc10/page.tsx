"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { getPasses, GROUND_SITES, RAN_VENDORS } from "@/lib/uc10-data"
import type { GroundSite, RanVendor } from "@/lib/uc10-data"
import { PassStatusBadge } from "@/components/uc10/PassStatusBadge"
import { VendorBadge } from "@/components/uc10/VendorBadge"
import { RtpmBadge } from "@/components/uc10/RtpmBadge"
import { DomainScorePill } from "@/components/uc10/DomainScorePill"

const S = {
  page: {
    minHeight: "100vh",
    background: "var(--bg)",
    padding: "clamp(16px, 4vw, 32px) clamp(12px, 3vw, 24px) 48px",
    maxWidth: "1400px",
    margin: "0 auto",
  } as React.CSSProperties,
}

export default function UC10Page() {
  const allPasses = getPasses()

  const [siteFilter, setSiteFilter] = useState<GroundSite | "ALL">("ALL")
  const [vendorFilter, setVendorFilter] = useState<RanVendor | "ALL">("ALL")
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PASS" | "FAIL">("ALL")

  const filtered = useMemo(() => {
    return allPasses.filter(p => {
      if (siteFilter !== "ALL" && p.groundSite !== siteFilter) return false
      if (vendorFilter !== "ALL" && p.ranVendor !== vendorFilter) return false
      if (statusFilter !== "ALL" && p.overallStatus !== statusFilter) return false
      return true
    })
  }, [allPasses, siteFilter, vendorFilter, statusFilter])

  const passCount = allPasses.filter(p => p.overallStatus === "PASS").length
  const passRate = ((passCount / allPasses.length) * 100).toFixed(1)

  return (
    <div style={S.page}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--muted)", marginBottom: "20px" }}>
        <Link href="/use-cases" style={{ color: "var(--muted)", textDecoration: "none" }}>Use Cases</Link>
        <span>›</span>
        <span style={{ color: "var(--accent)" }}>UC10</span>
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
            UC10 · NTN END-TO-END SERVICE ASSURANCE
          </span>
          <RtpmBadge />
        </div>
        <h1 style={{ fontSize: "32px", fontWeight: 800, color: "var(--text)", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
          Kuiper Satellite Pass Schedule
        </h1>
        <p style={{ fontSize: "14px", color: "var(--muted)", margin: 0, maxWidth: "600px" }}>
          4-domain service assurance scoring across{" "}
          <span style={{ color: "#c084fc" }}>Satellite</span>
          {" · "}
          <span style={{ color: "var(--accent)" }}>Ground Station</span>
          {" · "}
          <span style={{ color: "#60a5fa" }}>RAN</span>
          {" · "}
          <span style={{ color: "#fb923c" }}>Core</span>
        </p>
      </div>

      {/* Stats row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: "12px",
        marginBottom: "28px",
      }}>
        {[
          { label: "Total Passes", value: "60", sub: "March 1–15 2026" },
          { label: "Overall PASS Rate", value: `${passRate}%`, sub: `${passCount}/60 passes` },
          { label: "4-Domain Score", value: "4×", sub: "Sat + GS + RAN + Core" },
          { label: "Active Sites", value: "5", sub: "Canadian ground network" },
          { label: "RAN Vendors", value: "4", sub: "Nokia · Ericsson · Samsung · Mavenir" },
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
            <div style={{ fontSize: "26px", fontWeight: 800, color: "var(--accent)", lineHeight: 1, marginBottom: "4px" }}>
              {stat.value}
            </div>
            <div style={{ fontSize: "10px", color: "var(--muted)" }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Filter:
        </span>

        {/* Site filter */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {(["ALL", ...GROUND_SITES] as const).map(site => (
            <button
              key={site}
              onClick={() => setSiteFilter(site as GroundSite | "ALL")}
              style={{
                padding: "4px 10px",
                borderRadius: "6px",
                border: `1px solid ${siteFilter === site ? "var(--accent)" : "var(--border)"}`,
                background: siteFilter === site ? "var(--accent-dim)" : "var(--surface)",
                color: siteFilter === site ? "var(--accent)" : "var(--muted)",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {site === "ALL" ? "All Sites" : site}
            </button>
          ))}
        </div>

        <div style={{ width: "1px", height: "20px", background: "var(--border)" }} />

        {/* Vendor filter */}
        <div style={{ display: "flex", gap: "6px" }}>
          {(["ALL", ...RAN_VENDORS] as const).map(v => (
            <button
              key={v}
              onClick={() => setVendorFilter(v as RanVendor | "ALL")}
              style={{
                padding: "4px 10px",
                borderRadius: "6px",
                border: `1px solid ${vendorFilter === v ? "var(--accent)" : "var(--border)"}`,
                background: vendorFilter === v ? "var(--accent-dim)" : "var(--surface)",
                color: vendorFilter === v ? "var(--accent)" : "var(--muted)",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {v === "ALL" ? "All Vendors" : v}
            </button>
          ))}
        </div>

        <div style={{ width: "1px", height: "20px", background: "var(--border)" }} />

        {/* Status filter */}
        <div style={{ display: "flex", gap: "6px" }}>
          {(["ALL", "PASS", "FAIL"] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: "4px 10px",
                borderRadius: "6px",
                border: `1px solid ${statusFilter === s ? (s === "PASS" ? "#22c55e" : s === "FAIL" ? "#ef4444" : "var(--accent)") : "var(--border)"}`,
                background: statusFilter === s ? (s === "PASS" ? "rgba(34,197,94,0.1)" : s === "FAIL" ? "rgba(239,68,68,0.1)" : "var(--accent-dim)") : "var(--surface)",
                color: statusFilter === s ? (s === "PASS" ? "#22c55e" : s === "FAIL" ? "#ef4444" : "var(--accent)") : "var(--muted)",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {s === "ALL" ? "All Status" : s}
            </button>
          ))}
        </div>

        <span style={{ fontSize: "11px", color: "var(--muted)", marginLeft: "auto" }}>
          {filtered.length} of {allPasses.length} passes
        </span>
      </div>

      {/* Table */}
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        overflow: "hidden",
      }}>
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}>
                {[
                  "Pass #", "Satellite", "Ground Site", "RAN Vendor", "eNB / Cell",
                  "AOS", "LOS", "Duration", "QV Contact", "Domain Score", "Status",
                ].map((col, i) => (
                  <th key={i} style={{
                    padding: "10px 12px",
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
              {filtered.map((pass, idx) => (
                <tr
                  key={pass.passId}
                  style={{
                    borderBottom: idx < filtered.length - 1 ? "1px solid var(--border)" : "none",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                    <Link
                      href={`/uc10/${pass.passId}`}
                      style={{ color: "var(--accent)", fontWeight: 700, fontSize: "13px", textDecoration: "none" }}
                    >
                      {pass.passId}
                    </Link>
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: "12px", color: "var(--text)", whiteSpace: "nowrap", fontFamily: "monospace" }}>
                    {pass.satellite}
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: "12px", color: "var(--text)", whiteSpace: "nowrap" }}>
                    {pass.groundSite}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <VendorBadge vendor={pass.ranVendor} size="sm" />
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: "11px", color: "var(--muted)", whiteSpace: "nowrap", fontFamily: "monospace" }}>
                    {pass.eNB}<br />
                    <span style={{ color: "#555" }}>{pass.cell}</span>
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: "11px", color: "var(--text)", whiteSpace: "nowrap", fontFamily: "monospace" }}>
                    {pass.aos}
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: "11px", color: "var(--text)", whiteSpace: "nowrap", fontFamily: "monospace" }}>
                    {pass.los}
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: "12px", color: "var(--muted)", whiteSpace: "nowrap", fontFamily: "monospace" }}>
                    {pass.duration}
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: "11px", color: "var(--muted)", whiteSpace: "nowrap", fontFamily: "monospace" }}>
                    {pass.qvContact}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <DomainScorePill domainStatus={pass.domainStatus} />
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <PassStatusBadge status={pass.overallStatus} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div style={{ padding: "48px", textAlign: "center", color: "var(--muted)", fontSize: "14px" }}>
            No passes match the selected filters.
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ marginTop: "20px", display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "11px", color: "var(--muted)" }}>
        <span style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Domain Score Legend:</span>
        {[
          { icon: "🛰️", label: "Satellite", color: "#c084fc" },
          { icon: "📡", label: "Ground Station", color: "var(--accent)" },
          { icon: "📶", label: "RAN", color: "#60a5fa" },
          { icon: "🌐", label: "Core", color: "#fb923c" },
        ].map((d, i) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span>{d.icon}</span>
            <span style={{ color: d.color }}>{d.label}</span>
          </span>
        ))}
        <span>· Dot: <span style={{ color: "#22c55e" }}>●</span> PASS&nbsp;&nbsp;<span style={{ color: "#ef4444" }}>●</span> FAIL</span>
      </div>
    </div>
  )
}

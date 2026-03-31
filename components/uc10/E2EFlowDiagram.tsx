"use client"

import React from "react"
import type { Pass, DomainKPIs } from "@/lib/uc10-data"

interface E2EFlowDiagramProps {
  pass: Pass
  kpis: DomainKPIs
}

const PASS_COLOR = "#22c55e"
const FAIL_COLOR = "#ef4444"

function statusColor(status: "PASS" | "FAIL"): string {
  return status === "PASS" ? PASS_COLOR : FAIL_COLOR
}

function blockStyle(status: "PASS" | "FAIL"): React.CSSProperties {
  const color = statusColor(status)
  return {
    minWidth: "160px",
    padding: "16px",
    borderRadius: "12px",
    border: `2px solid ${color}`,
    background: status === "PASS" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    flexShrink: 0,
  }
}

function blockIcon(icon: string): React.CSSProperties {
  return {
    fontSize: "24px",
    lineHeight: "1",
  }
}

function miniKpi(label: string, value: string): React.ReactNode {
  return (
    <div key={label} style={{ fontSize: "10px", fontFamily: "monospace", color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
      {label}: {value}
    </div>
  )
}

function Arrow({ label1, label2 }: { label1: string; label2?: string }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "2px",
      flexShrink: 0,
      color: "var(--muted)",
    }}>
      <span style={{ fontSize: "20px", lineHeight: "1" }}>→</span>
      <span style={{ fontSize: "9px", textAlign: "center", whiteSpace: "nowrap", color: "var(--muted)" }}>{label1}</span>
      {label2 && <span style={{ fontSize: "9px", textAlign: "center", whiteSpace: "nowrap", color: "var(--muted)" }}>{label2}</span>}
    </div>
  )
}

export function E2EFlowDiagram({ pass, kpis }: E2EFlowDiagramProps) {
  const failedDomains = [
    pass.domainStatus.satellite,
    pass.domainStatus.groundStation,
    pass.domainStatus.ran,
    pass.domainStatus.core,
  ].filter(s => s === "FAIL").length

  const e2ePass = failedDomains === 0

  // Ground station sub-block statuses
  const acuPass =
    kpis.groundStation.acu.azimuthTrackingError < 0.5 &&
    kpis.groundStation.acu.elevationTrackingError < 0.4
  const beaconPass = kpis.groundStation.beacon.beaconLockStatus === "LOCKED"
  const signalPass = kpis.groundStation.signalAnalyzer.ber < 1e-5
  const bpmsPass = kpis.groundStation.bpms.demodulationLock === true

  const gsColor = statusColor(pass.domainStatus.groundStation)

  return (
    <div style={{ marginBottom: "24px" }}>
      {/* E2E Banner */}
      <div style={{
        padding: "10px 16px",
        borderRadius: "8px",
        background: e2ePass ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
        border: `1px solid ${e2ePass ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
        marginBottom: "16px",
        fontSize: "14px",
        fontWeight: 700,
        color: e2ePass ? PASS_COLOR : FAIL_COLOR,
      }}>
        {e2ePass
          ? "✓ E2E PASS — all 4 domains succeeded"
          : `✗ E2E FAIL — ${failedDomains} domain(s) failed`}
      </div>

      {/* Scrollable diagram */}
      <div style={{ overflowX: "auto", paddingBottom: "8px" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          minWidth: "max-content",
          padding: "16px",
          background: "var(--surface)",
          borderRadius: "12px",
          border: "1px solid var(--border)",
        }}>

          {/* 1. UE / User Terminal */}
          <div style={blockStyle("PASS")}>
            <div style={blockIcon("📱")}>📱</div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>User Terminal</div>
            <div style={{ fontSize: "11px", color: "var(--muted)" }}>NTN UE</div>
            <div style={{
              fontSize: "9px",
              padding: "2px 6px",
              borderRadius: "4px",
              background: "rgba(34,197,94,0.15)",
              color: PASS_COLOR,
              fontWeight: 700,
              alignSelf: "flex-start",
            }}>PASS</div>
          </div>

          {/* Arrow */}
          <Arrow label1="NTN Air Interface" label2="(Ka-band beam)" />

          {/* 3. Satellite */}
          <div style={blockStyle(pass.domainStatus.satellite)}>
            <div style={blockIcon("🛰️")}>🛰️</div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>{pass.satellite}</div>
            <div style={{ fontSize: "11px", color: "var(--muted)" }}>LEO · 590km</div>
            <div style={{
              fontSize: "9px",
              padding: "2px 6px",
              borderRadius: "4px",
              background: pass.domainStatus.satellite === "PASS" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
              color: statusColor(pass.domainStatus.satellite),
              fontWeight: 700,
              alignSelf: "flex-start",
            }}>{pass.domainStatus.satellite}</div>
            {miniKpi("EIRP", `${kpis.satellite.eirp.toFixed(1)} dBW`)}
            {miniKpi("LinkMgn", `${kpis.satellite.linkMargin.toFixed(1)} dB`)}
            {miniKpi("BeamEff", `${kpis.satellite.phasedArrayBeamEfficiency.toFixed(1)}%`)}
          </div>

          {/* Arrow */}
          <Arrow label1="Feeder Link" label2="(Ground Station)" />

          {/* 5. Ground Station Compound */}
          <div style={{
            minWidth: "200px",
            padding: "16px",
            borderRadius: "12px",
            border: `2px solid ${gsColor}`,
            background: pass.domainStatus.groundStation === "PASS" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
            flexShrink: 0,
          }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text)", marginBottom: "8px" }}>
              {pass.groundSite}
            </div>
            <div style={{
              fontSize: "9px",
              padding: "2px 6px",
              borderRadius: "4px",
              background: pass.domainStatus.groundStation === "PASS" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
              color: gsColor,
              fontWeight: 700,
              display: "inline-block",
              marginBottom: "10px",
            }}>{pass.domainStatus.groundStation}</div>
            {/* 2x2 sub-blocks */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
              {/* ACU */}
              <div style={{
                padding: "8px",
                borderRadius: "8px",
                border: `1px solid ${acuPass ? PASS_COLOR : FAIL_COLOR}`,
                background: acuPass ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
              }}>
                <div style={{ fontSize: "14px" }}>🎯</div>
                <div style={{ fontSize: "10px", fontWeight: 600, color: acuPass ? PASS_COLOR : FAIL_COLOR }}>ACU</div>
                <div style={{ fontSize: "9px", color: "var(--muted)" }}>Az: {kpis.groundStation.acu.azimuthTrackingError.toFixed(2)}°</div>
              </div>
              {/* Beacon */}
              <div style={{
                padding: "8px",
                borderRadius: "8px",
                border: `1px solid ${beaconPass ? PASS_COLOR : FAIL_COLOR}`,
                background: beaconPass ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
              }}>
                <div style={{ fontSize: "14px" }}>📻</div>
                <div style={{ fontSize: "10px", fontWeight: 600, color: beaconPass ? PASS_COLOR : FAIL_COLOR }}>Beacon</div>
                <div style={{ fontSize: "9px", color: "var(--muted)" }}>{kpis.groundStation.beacon.beaconLockStatus}</div>
              </div>
              {/* Signal Analyzer */}
              <div style={{
                padding: "8px",
                borderRadius: "8px",
                border: `1px solid ${signalPass ? PASS_COLOR : FAIL_COLOR}`,
                background: signalPass ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
              }}>
                <div style={{ fontSize: "14px" }}>📊</div>
                <div style={{ fontSize: "10px", fontWeight: 600, color: signalPass ? PASS_COLOR : FAIL_COLOR }}>Signal</div>
                <div style={{ fontSize: "9px", color: "var(--muted)" }}>BER:{kpis.groundStation.signalAnalyzer.ber.toExponential(1)}</div>
              </div>
              {/* BPMS */}
              <div style={{
                padding: "8px",
                borderRadius: "8px",
                border: `1px solid ${bpmsPass ? PASS_COLOR : FAIL_COLOR}`,
                background: bpmsPass ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
              }}>
                <div style={{ fontSize: "14px" }}>⚙️</div>
                <div style={{ fontSize: "10px", fontWeight: 600, color: bpmsPass ? PASS_COLOR : FAIL_COLOR }}>BPMS</div>
                <div style={{ fontSize: "9px", color: "var(--muted)" }}>{bpmsPass ? "LOCKED" : "UNLOCKED"}</div>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <Arrow label1="S1 Interface" />

          {/* 7. RAN / eNB */}
          <div style={blockStyle(pass.domainStatus.ran)}>
            <div style={blockIcon("📶")}>📶</div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>{pass.eNB}</div>
            <div style={{ fontSize: "11px", color: "var(--muted)" }}>{pass.ranVendor}</div>
            <div style={{
              fontSize: "9px",
              padding: "2px 6px",
              borderRadius: "4px",
              background: pass.domainStatus.ran === "PASS" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
              color: statusColor(pass.domainStatus.ran),
              fontWeight: 700,
              alignSelf: "flex-start",
            }}>{pass.domainStatus.ran}</div>
            {miniKpi("RRC SR", `${kpis.ran.rrcSetupSuccessRate.toFixed(1)}%`)}
            {miniKpi("DL Thpt", `${kpis.ran.dlThroughput.toFixed(1)} Mbps`)}
            {miniKpi("RSRP", `${kpis.ran.rsrp.toFixed(1)} dBm`)}
          </div>

          {/* Arrow */}
          <Arrow label1="S1-U / SGi" />

          {/* 9. Core Network */}
          <div style={blockStyle(pass.domainStatus.core)}>
            <div style={blockIcon("🌐")}>🌐</div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>EPC Core</div>
            <div style={{ fontSize: "11px", color: "var(--muted)" }}>MME + SGW + PGW</div>
            <div style={{
              fontSize: "9px",
              padding: "2px 6px",
              borderRadius: "4px",
              background: pass.domainStatus.core === "PASS" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
              color: statusColor(pass.domainStatus.core),
              fontWeight: 700,
              alignSelf: "flex-start",
            }}>{pass.domainStatus.core}</div>
            {miniKpi("PDP Act", `${kpis.core.pdpContextActivationRate.toFixed(1)}%`)}
            {miniKpi("MME Att", `${kpis.core.mmeAttachSuccessRate.toFixed(1)}%`)}
            {miniKpi("E2E Lat", `${kpis.core.e2eLatency.toFixed(0)} ms`)}
          </div>

          {/* Arrow */}
          <Arrow label1="Internet" />

          {/* 11. Web / Internet */}
          <div style={blockStyle("PASS")}>
            <div style={blockIcon("🖥️")}>🖥️</div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>Internet</div>
            <div style={{ fontSize: "11px", color: "var(--muted)" }}>DPI · Content</div>
            <div style={{
              fontSize: "9px",
              padding: "2px 6px",
              borderRadius: "4px",
              background: "rgba(34,197,94,0.15)",
              color: PASS_COLOR,
              fontWeight: 700,
              alignSelf: "flex-start",
            }}>PASS</div>
          </div>

        </div>
      </div>
    </div>
  )
}

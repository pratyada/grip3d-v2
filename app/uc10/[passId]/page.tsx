"use client"

import { useState } from "react"
import Link from "next/link"
import { use } from "react"
import { getPass, getDomainKPIs } from "@/lib/uc10-data"
import { KpiCard } from "@/components/uc10/KpiCard"
import { PassStatusBadge } from "@/components/uc10/PassStatusBadge"
import { VendorBadge } from "@/components/uc10/VendorBadge"
import { DomainBadge } from "@/components/uc10/DomainBadge"

type TabId = "satellite" | "groundStation" | "ran" | "core"
type GSSubTab = "acu" | "beacon" | "signalAnalyzer" | "bpms"

function kpiStatus(value: number, threshold: number, higherIsBetter: boolean): "pass" | "warn" | "fail" {
  if (higherIsBetter) {
    if (value >= threshold) return "pass"
    if (value >= threshold * 0.97) return "warn"
    return "fail"
  } else {
    if (value <= threshold) return "pass"
    if (value <= threshold * 1.05) return "warn"
    return "fail"
  }
}

function berStatus(value: number): "pass" | "warn" | "fail" {
  if (value < 1e-5) return "pass"
  if (value < 1e-4) return "warn"
  return "fail"
}

export default function PassDetailPage({ params }: { params: Promise<{ passId: string }> }) {
  const { passId } = use(params)
  const pass = getPass(passId)
  const [activeTab, setActiveTab] = useState<TabId>("satellite")
  const [gsSubTab, setGsSubTab] = useState<GSSubTab>("acu")

  if (!pass) {
    return (
      <div style={{ padding: "48px", textAlign: "center", color: "var(--muted)" }}>
        Pass {passId} not found.{" "}
        <Link href="/uc10" style={{ color: "var(--accent)" }}>Back to schedule</Link>
      </div>
    )
  }

  const kpis = getDomainKPIs(passId, pass.ranVendor)
  const domainStatuses = [
    { key: "satellite" as const, label: "Satellite", status: pass.domainStatus.satellite },
    { key: "groundStation" as const, label: "Ground Stn", status: pass.domainStatus.groundStation },
    { key: "ran" as const, label: "RAN", status: pass.domainStatus.ran },
    { key: "core" as const, label: "Core", status: pass.domainStatus.core },
  ]
  const passedCount = domainStatuses.filter(d => d.status === "PASS").length

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: "satellite", label: "Satellite", icon: "🛰️" },
    { id: "groundStation", label: "Ground Station", icon: "📡" },
    { id: "ran", label: "RAN", icon: "📶" },
    { id: "core", label: "Core Network", icon: "🌐" },
  ]

  const tabBorderColor: Record<TabId, string> = {
    satellite: "#c084fc",
    groundStation: "var(--accent)",
    ran: "#60a5fa",
    core: "#fb923c",
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "28px 24px 64px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Back */}
      <div style={{ marginBottom: "20px" }}>
        <Link href="/uc10" style={{ color: "var(--muted)", fontSize: "13px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
          ← Back to Pass Schedule
        </Link>
      </div>

      {/* Pass info bar */}
      <div style={{
        padding: "16px 20px",
        borderRadius: "10px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        marginBottom: "16px",
        display: "flex",
        flexWrap: "wrap",
        gap: "24px",
        alignItems: "center",
      }}>
        <div>
          <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Pass ID</div>
          <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--accent)" }}>{pass.passId}</div>
        </div>
        <div>
          <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "2px" }}>Satellite</div>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", fontFamily: "monospace" }}>{pass.satellite}</div>
        </div>
        <div>
          <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "2px" }}>Ground Site</div>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{pass.groundSite}</div>
        </div>
        <div>
          <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "2px" }}>RAN Vendor</div>
          <VendorBadge vendor={pass.ranVendor} />
        </div>
        <div>
          <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "2px" }}>eNB / Cell</div>
          <div style={{ fontSize: "12px", color: "var(--text)", fontFamily: "monospace" }}>{pass.eNB} / {pass.cell}</div>
        </div>
        <div>
          <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "2px" }}>AOS → LOS</div>
          <div style={{ fontSize: "12px", color: "var(--text)", fontFamily: "monospace" }}>{pass.aos} → {pass.los}</div>
        </div>
        <div>
          <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "2px" }}>Duration</div>
          <div style={{ fontSize: "13px", color: "var(--text)", fontFamily: "monospace" }}>{pass.duration}</div>
        </div>
        <div>
          <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "2px" }}>Max Elevation</div>
          <div style={{ fontSize: "13px", color: "var(--text)" }}>{pass.elevation}°</div>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <PassStatusBadge status={pass.overallStatus} size="lg" />
        </div>
      </div>

      {/* Overall banner */}
      <div style={{
        padding: "14px 20px",
        borderRadius: "10px",
        background: pass.overallStatus === "PASS" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
        border: `1px solid ${pass.overallStatus === "PASS" ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
        marginBottom: "16px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        flexWrap: "wrap",
      }}>
        <div style={{ fontWeight: 700, fontSize: "15px", color: pass.overallStatus === "PASS" ? "#22c55e" : "#ef4444" }}>
          {passedCount}/4 domains passed — {pass.overallStatus}
        </div>
        <div style={{ fontSize: "12px", color: "var(--muted)" }}>
          Overall pass = PASS only if ALL 4 domains pass
        </div>
      </div>

      {/* Domain score strip */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "28px", flexWrap: "wrap" }}>
        {domainStatuses.map(d => (
          <DomainBadge key={d.key} domain={d.key} status={d.status} />
        ))}
      </div>

      {/* Tab bar */}
      <div style={{
        display: "flex",
        gap: "4px",
        marginBottom: "24px",
        borderBottom: "1px solid var(--border)",
        paddingBottom: "0",
      }}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "10px 18px",
                background: "transparent",
                border: "none",
                borderBottom: `2px solid ${isActive ? tabBorderColor[tab.id] : "transparent"}`,
                color: isActive ? "var(--text)" : "var(--muted)",
                fontSize: "13px",
                fontWeight: isActive ? 700 : 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.15s",
                marginBottom: "-1px",
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
              <span style={{
                fontSize: "9px",
                padding: "1px 5px",
                borderRadius: "3px",
                background: pass.domainStatus[tab.id] === "PASS" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                color: pass.domainStatus[tab.id] === "PASS" ? "#22c55e" : "#ef4444",
                fontWeight: 700,
              }}>
                {pass.domainStatus[tab.id]}
              </span>
            </button>
          )
        })}
      </div>

      {/* TAB CONTENT */}

      {/* ─── SATELLITE TAB ─── */}
      {activeTab === "satellite" && (
        <div>
          <div style={{ marginBottom: "16px" }}>
            <DomainBadge domain="satellite" status={pass.domainStatus.satellite} />
            <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "8px" }}>
              Kuiper LEO phased array link quality — EIRP, link budget, Doppler compensation, beam efficiency
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
            <KpiCard label="EIRP" value={kpis.satellite.eirp} unit="dBW" threshold=">45 dBW"
              status={kpiStatus(kpis.satellite.eirp, 45, true)} reference="ITU-R S.580 / Kuiper FL-1" />
            <KpiCard label="Link Margin" value={kpis.satellite.linkMargin} unit="dB" threshold=">6 dB"
              status={kpiStatus(kpis.satellite.linkMargin, 6, true)} reference="Link budget per ITU-R P.618" />
            <KpiCard label="Eb/No" value={kpis.satellite.ebNo} unit="dB" threshold=">10 dB"
              status={kpiStatus(kpis.satellite.ebNo, 10, true)} reference="3GPP TS 38.821 NTN" />
            <KpiCard label="Doppler Shift" value={kpis.satellite.dopplerShift} unit="kHz" threshold="Informational"
              status="info" reference="LEO orbital velocity ~7.8 km/s" />
            <KpiCard label="Doppler Compensation Rate" value={kpis.satellite.dopplerCompensationRate} unit="%" threshold=">96%"
              status={kpiStatus(kpis.satellite.dopplerCompensationRate, 96, true)} reference="Pre-compensation via TLE prediction" />
            <KpiCard label="Phased Array Beam Efficiency" value={kpis.satellite.phasedArrayBeamEfficiency} unit="%" threshold=">90%"
              status={kpiStatus(kpis.satellite.phasedArrayBeamEfficiency, 90, true)} reference="256-element phased array" />
            <KpiCard label="Satellite EIRP Variation" value={kpis.satellite.satelliteEirpVariation} unit="dB" threshold="<2 dB"
              status={kpiStatus(kpis.satellite.satelliteEirpVariation, 2, false)} reference="Thermal + pointing variation" />
            <KpiCard label="C/No" value={kpis.satellite.cNo} unit="dB·Hz" threshold=">78 dB·Hz"
              status={kpiStatus(kpis.satellite.cNo, 78, true)} reference="Carrier-to-noise density" />
            <KpiCard label="Link Budget Margin" value={kpis.satellite.linkBudgetMargin} unit="dB" threshold=">4 dB"
              status={kpiStatus(kpis.satellite.linkBudgetMargin, 4, true)} reference="Rain fade + pointing loss margin" />
          </div>
        </div>
      )}

      {/* ─── GROUND STATION TAB ─── */}
      {activeTab === "groundStation" && (
        <div>
          <div style={{ marginBottom: "16px" }}>
            <DomainBadge domain="groundStation" status={pass.domainStatus.groundStation} />
            <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "8px" }}>
              {pass.groundSite} — ACU tracking, beacon lock, signal analysis, baseband processing
            </p>
          </div>

          {/* GS Sub-tabs */}
          <div style={{ display: "flex", gap: "4px", marginBottom: "20px", borderBottom: "1px solid var(--border)" }}>
            {(["acu", "beacon", "signalAnalyzer", "bpms"] as GSSubTab[]).map(st => {
              const labels: Record<GSSubTab, string> = { acu: "ACU", beacon: "Beacon", signalAnalyzer: "Signal Analyzer", bpms: "BPMS" }
              return (
                <button
                  key={st}
                  onClick={() => setGsSubTab(st)}
                  style={{
                    padding: "8px 14px",
                    background: "transparent",
                    border: "none",
                    borderBottom: `2px solid ${gsSubTab === st ? "var(--accent)" : "transparent"}`,
                    color: gsSubTab === st ? "var(--accent)" : "var(--muted)",
                    fontSize: "12px",
                    fontWeight: gsSubTab === st ? 700 : 500,
                    cursor: "pointer",
                    marginBottom: "-1px",
                  }}
                >
                  {labels[st]}
                </button>
              )
            })}
          </div>

          {/* ACU */}
          {gsSubTab === "acu" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              <KpiCard label="Azimuth Tracking Error" value={kpis.groundStation.acu.azimuthTrackingError} unit="°" threshold="<0.5°"
                status={kpiStatus(kpis.groundStation.acu.azimuthTrackingError, 0.5, false)} reference="Antenna pointing accuracy" />
              <KpiCard label="Elevation Tracking Error" value={kpis.groundStation.acu.elevationTrackingError} unit="°" threshold="<0.4°"
                status={kpiStatus(kpis.groundStation.acu.elevationTrackingError, 0.4, false)} reference="Elevation axis servo loop" />
              <KpiCard label="Polarization Error" value={kpis.groundStation.acu.polarizationError} unit="°" threshold="<1°"
                status={kpiStatus(kpis.groundStation.acu.polarizationError, 1, false)} reference="Cross-pol isolation" />
              <KpiCard label="ACU Loop Gain" value={kpis.groundStation.acu.acuLoopGain} unit="dB" threshold=">32 dB"
                status={kpiStatus(kpis.groundStation.acu.acuLoopGain, 32, true)} reference="Servo loop stability margin" />
              <div style={{
                padding: "14px 16px", borderRadius: "10px", background: "var(--surface-2)",
                border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "8px", position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", background: kpis.groundStation.acu.trackingMode === "AUTO" ? "#22c55e" : "#f59e0b", borderRadius: "3px 0 0 3px" }} />
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Tracking Mode</div>
                <div style={{ fontSize: "22px", fontWeight: 700, color: kpis.groundStation.acu.trackingMode === "AUTO" ? "#22c55e" : "#f59e0b" }}>
                  {kpis.groundStation.acu.trackingMode}
                </div>
                <div style={{ fontSize: "10px", color: "var(--muted)", borderTop: "1px solid var(--border)", paddingTop: "6px" }}>AUTO = normal operation</div>
              </div>
            </div>
          )}

          {/* Beacon */}
          {gsSubTab === "beacon" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
              <KpiCard label="Beacon Level" value={kpis.groundStation.beacon.beaconLevel} unit="dBm" threshold=">-88 dBm"
                status={kpiStatus(kpis.groundStation.beacon.beaconLevel, -88, true)} reference="S-band beacon receiver" />
              <KpiCard label="Beacon SNR" value={kpis.groundStation.beacon.beaconSNR} unit="dB" threshold=">12 dB"
                status={kpiStatus(kpis.groundStation.beacon.beaconSNR, 12, true)} reference="Signal-to-noise ratio" />
              <KpiCard label="Beacon Frequency Offset" value={kpis.groundStation.beacon.beaconFrequencyOffset} unit="Hz" threshold="<150 Hz"
                status={kpiStatus(kpis.groundStation.beacon.beaconFrequencyOffset, 150, false)} reference="Residual Doppler offset" />
              <div style={{
                padding: "14px 16px", borderRadius: "10px", background: "var(--surface-2)",
                border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "8px", position: "relative", overflow: "hidden",
              }}>
                {(() => {
                  const ls = kpis.groundStation.beacon.beaconLockStatus
                  const c = ls === "LOCKED" ? "#22c55e" : ls === "SEARCHING" ? "#f59e0b" : "#ef4444"
                  return (
                    <>
                      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", background: c }} />
                      <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Beacon Lock Status</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: c, boxShadow: `0 0 8px ${c}`, display: "inline-block" }} />
                        <span style={{ fontSize: "22px", fontWeight: 700, color: c }}>{ls}</span>
                      </div>
                      <div style={{ fontSize: "10px", color: "var(--muted)", borderTop: "1px solid var(--border)", paddingTop: "6px" }}>LOCKED required for domain PASS</div>
                    </>
                  )
                })()}
              </div>
            </div>
          )}

          {/* Signal Analyzer */}
          {gsSubTab === "signalAnalyzer" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              <KpiCard label="Rx Signal Level" value={kpis.groundStation.signalAnalyzer.rxSignalLevel} unit="dBm" threshold=">-82 dBm"
                status={kpiStatus(kpis.groundStation.signalAnalyzer.rxSignalLevel, -82, true)} reference="Downconverter output" />
              <div style={{
                padding: "14px 16px", borderRadius: "10px", background: "var(--surface-2)",
                border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "8px", position: "relative", overflow: "hidden",
              }}>
                {(() => {
                  const ber = kpis.groundStation.signalAnalyzer.ber
                  const st = berStatus(ber)
                  const c = st === "pass" ? "#22c55e" : st === "warn" ? "#f59e0b" : "#ef4444"
                  return (
                    <>
                      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", background: c }} />
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>BER (pre-FEC)</div>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: c, boxShadow: `0 0 6px ${c}88`, display: "inline-block" }} />
                      </div>
                      <div style={{ fontSize: "22px", fontWeight: 700, color: c }}>{ber.toExponential(2)}</div>
                      <div style={{ fontSize: "10px", color: "var(--muted)", borderTop: "1px solid var(--border)", paddingTop: "6px" }}>Threshold: &lt;1×10⁻⁵</div>
                      <div style={{ fontSize: "9px", color: "#555", fontStyle: "italic" }}>Pre-FEC bit error rate</div>
                    </>
                  )
                })()}
              </div>
              <KpiCard label="Symbol Rate Accuracy" value={kpis.groundStation.signalAnalyzer.symbolRateAccuracy} unit="%" threshold=">99.5%"
                status={kpiStatus(kpis.groundStation.signalAnalyzer.symbolRateAccuracy, 99.5, true)} reference="Clock recovery accuracy" />
              <KpiCard label="Spectrum Flatness" value={kpis.groundStation.signalAnalyzer.spectrumFlatness} unit="dB" threshold="<2.5 dB"
                status={kpiStatus(kpis.groundStation.signalAnalyzer.spectrumFlatness, 2.5, false)} reference="Passband ripple" />
              <KpiCard label="Phase Noise" value={kpis.groundStation.signalAnalyzer.phaseNoise} unit="dBc/Hz @1kHz" threshold="<-88 dBc/Hz"
                status={kpiStatus(kpis.groundStation.signalAnalyzer.phaseNoise, -88, false)} reference="LO phase noise floor" />
            </div>
          )}

          {/* BPMS */}
          {gsSubTab === "bpms" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              <KpiCard label="Demodulation Lock" value="" isBoolean booleanValue={kpis.groundStation.bpms.demodulationLock}
                status={kpis.groundStation.bpms.demodulationLock ? "pass" : "fail"} reference="BPMS demodulator sync" />
              <KpiCard label="FEC Correction Rate" value={kpis.groundStation.bpms.fecCorrectionRate} unit="%" threshold="<3%"
                status={kpiStatus(kpis.groundStation.bpms.fecCorrectionRate, 3, false)} reference="Forward error correction load" />
              <KpiCard label="Frame Error Rate" value={kpis.groundStation.bpms.frameErrorRate} unit="%" threshold="<0.5%"
                status={kpiStatus(kpis.groundStation.bpms.frameErrorRate, 0.5, false)} reference="Transport frame integrity" />
              <KpiCard label="Bitrate Utilization" value={kpis.groundStation.bpms.bitrateUtilization} unit="%" threshold="<95%"
                status={kpiStatus(kpis.groundStation.bpms.bitrateUtilization, 95, false)} reference="Baseband capacity usage" />
              <KpiCard label="Processing Latency" value={kpis.groundStation.bpms.processingLatency} unit="ms" threshold="<8 ms"
                status={kpiStatus(kpis.groundStation.bpms.processingLatency, 8, false)} reference="BPMS pipeline delay" />
            </div>
          )}
        </div>
      )}

      {/* ─── RAN TAB ─── */}
      {activeTab === "ran" && (
        <div>
          <div style={{ marginBottom: "16px" }}>
            <DomainBadge domain="ran" status={pass.domainStatus.ran} />
            <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "8px" }}>
              {pass.eNB} — {pass.ranVendor} eNB KPIs per 3GPP TS 32.450
            </p>
          </div>

          {/* Accessibility */}
          <SectionHeader title="Accessibility" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
            <KpiCard label="RRC Setup Success Rate" value={kpis.ran.rrcSetupSuccessRate} unit="%" threshold=">95%"
              status={kpiStatus(kpis.ran.rrcSetupSuccessRate, 95, true)} reference="3GPP TS 32.450 · RRC.SR.01" />
            <KpiCard label="E-RAB Setup Success Rate" value={kpis.ran.erabSetupSuccessRate} unit="%" threshold=">95%"
              status={kpiStatus(kpis.ran.erabSetupSuccessRate, 95, true)} reference="3GPP TS 32.450 · ERAB.SR.01" />
            <KpiCard label="RRC Connection Count" value={kpis.ran.rrcConnectionCount} threshold=">1"
              status={kpis.ran.rrcConnectionCount > 1 ? "pass" : "fail"} reference="Active RRC connections" />
          </div>

          {/* Retainability */}
          <SectionHeader title="Retainability" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
            <KpiCard label="Call Drop Rate" value={kpis.ran.callDropRate} unit="%" threshold="<1%"
              status={kpiStatus(kpis.ran.callDropRate, 1, false)} reference="3GPP TS 32.450 · CDR.01" />
            <KpiCard label="E-RAB Drop Rate" value={kpis.ran.erabDropRate} unit="%" threshold="<1%"
              status={kpiStatus(kpis.ran.erabDropRate, 1, false)} reference="3GPP TS 32.450 · ERAB.DR.01" />
            <KpiCard label="Packet Loss Rate" value={kpis.ran.packetLossRate} unit="%" threshold="<1%"
              status={kpiStatus(kpis.ran.packetLossRate, 1, false)} reference="DL packet discard rate" />
          </div>

          {/* Availability */}
          <SectionHeader title="Availability" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "20px" }}>
            <KpiCard label="Cell Availability" value={kpis.ran.cellAvailability} unit="%" threshold=">99%"
              status={kpiStatus(kpis.ran.cellAvailability, 99, true)} reference="3GPP TS 32.450 · CA.01" />
            <KpiCard label="Handover Success Rate" value={kpis.ran.handoverSuccessRate} unit="%" threshold=">95%"
              status={kpiStatus(kpis.ran.handoverSuccessRate, 95, true)} reference="X2 handover SR" />
          </div>

          {/* Quality */}
          <SectionHeader title="Quality / Integrity" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
            <KpiCard label="DL Throughput" value={kpis.ran.dlThroughput} unit="Mbps" threshold=">30 Mbps"
              status={kpiStatus(kpis.ran.dlThroughput, 30, true)} reference="Average user DL" />
            <KpiCard label="UL Throughput" value={kpis.ran.ulThroughput} unit="Mbps" threshold=">10 Mbps"
              status={kpiStatus(kpis.ran.ulThroughput, 10, true)} reference="Average user UL" />
            <KpiCard label="Latency" value={kpis.ran.latency} unit="ms" threshold="<60 ms"
              status={kpiStatus(kpis.ran.latency, 60, false)} reference="One-way RAN latency" />
            <KpiCard label="CQI" value={kpis.ran.cqi} threshold=">7"
              status={kpiStatus(kpis.ran.cqi, 7, true)} reference="Channel Quality Index" />
          </div>

          {/* Signal Quality */}
          <SectionHeader title="Signal Quality (NTN)" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
            <KpiCard label="RSRP" value={kpis.ran.rsrp} unit="dBm" threshold=">-100 dBm"
              status={kpiStatus(kpis.ran.rsrp, -100, true)} reference="Reference signal received power" />
            <KpiCard label="RSRQ" value={kpis.ran.rsrq} unit="dB" threshold=">-12 dB"
              status={kpiStatus(kpis.ran.rsrq, -12, true)} reference="Reference signal received quality" />
            <KpiCard label="SINR" value={kpis.ran.sinr} unit="dB" threshold=">5 dB"
              status={kpiStatus(kpis.ran.sinr, 5, true)} reference="Signal-to-interference+noise ratio" />
          </div>
        </div>
      )}

      {/* ─── CORE TAB ─── */}
      {activeTab === "core" && (
        <div>
          <div style={{ marginBottom: "16px" }}>
            <DomainBadge domain="core" status={pass.domainStatus.core} />
            <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "8px" }}>
              EPC control plane and data plane KPIs — PDP, MME, SGW, PGW, GTP
            </p>
          </div>

          {/* Control Plane */}
          <SectionHeader title="Control Plane" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
            <KpiCard label="PDP Context Activation Rate" value={kpis.core.pdpContextActivationRate} unit="%" threshold=">99%"
              status={kpiStatus(kpis.core.pdpContextActivationRate, 99, true)} reference="3GPP TS 32.451" />
            <KpiCard label="PDP Context Success Rate" value={kpis.core.pdpContextSuccessRate} unit="%" threshold=">98.5%"
              status={kpiStatus(kpis.core.pdpContextSuccessRate, 98.5, true)} reference="3GPP TS 32.451" />
            <KpiCard label="Default Bearer Activation Rate" value={kpis.core.defaultBearerActivationRate} unit="%" threshold=">99%"
              status={kpiStatus(kpis.core.defaultBearerActivationRate, 99, true)} reference="EPS default bearer" />
            <KpiCard label="Dedicated Bearer Activation Rate" value={kpis.core.dedicatedBearerActivationRate} unit="%" threshold=">98%"
              status={kpiStatus(kpis.core.dedicatedBearerActivationRate, 98, true)} reference="EPS dedicated bearer" />
            <KpiCard label="MME Attach Success Rate" value={kpis.core.mmeAttachSuccessRate} unit="%" threshold=">99%"
              status={kpiStatus(kpis.core.mmeAttachSuccessRate, 99, true)} reference="S1-MME attach procedure" />
            <KpiCard label="SGW Session Success Rate" value={kpis.core.sgwSessionSuccessRate} unit="%" threshold=">99%"
              status={kpiStatus(kpis.core.sgwSessionSuccessRate, 99, true)} reference="S11 GTP-C session" />
          </div>

          {/* Data Plane */}
          <SectionHeader title="Data Plane" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
            <KpiCard label="PGW Data Path Success Rate" value={kpis.core.pgwDataPathSuccessRate} unit="%" threshold=">99%"
              status={kpiStatus(kpis.core.pgwDataPathSuccessRate, 99, true)} reference="S5/S8 data path" />
            <KpiCard label="DPI Throughput" value={kpis.core.dpiThroughput} unit="Gbps" threshold="Informational"
              status="info" reference="Deep packet inspection capacity" />
            <KpiCard label="DPI Classification Accuracy" value={kpis.core.dpiClassificationAccuracy} unit="%" threshold=">97%"
              status={kpiStatus(kpis.core.dpiClassificationAccuracy, 97, true)} reference="Traffic classification" />
            <KpiCard label="GTP Tunnel Integrity" value={kpis.core.gtpTunnelIntegrity} unit="%" threshold=">99.5%"
              status={kpiStatus(kpis.core.gtpTunnelIntegrity, 99.5, true)} reference="GTPv1-U tunnel continuity" />
            <KpiCard label="End-to-End Latency" value={kpis.core.e2eLatency} unit="ms" threshold="<150 ms"
              status={kpiStatus(kpis.core.e2eLatency, 150, false)} reference="UE→PGW RTT (NTN-adapted)" />
            <KpiCard label="Core Packet Loss" value={kpis.core.packetLossCore} unit="%" threshold="<0.5%"
              status={kpiStatus(kpis.core.packetLossCore, 0.5, false)} reference="GTP tunnel packet loss" />
          </div>
        </div>
      )}

      {/* Bottom CTA */}
      <div style={{
        marginTop: "40px",
        padding: "20px",
        borderRadius: "10px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
      }}>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>
            Micro KPI Analysis Available
          </div>
          <div style={{ fontSize: "12px", color: "var(--muted)" }}>
            30-minute time-series charts across all 4 domains — throughput, signal quality, latency, correlations
          </div>
        </div>
        <Link
          href={`/uc10/${passId}/graphs`}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            background: "var(--accent)",
            color: "#000",
            fontWeight: 700,
            fontSize: "13px",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          View Micro KPI Analysis →
        </Link>
      </div>
    </div>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{
      fontSize: "11px",
      fontWeight: 700,
      color: "var(--muted)",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      marginBottom: "10px",
      paddingBottom: "6px",
      borderBottom: "1px solid var(--border)",
    }}>
      {title}
    </div>
  )
}

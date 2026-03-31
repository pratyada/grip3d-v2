// =============================================================================
// UC10 — NTN End-to-End Service Assurance Data Layer
// 4 Domains: Satellite → Ground Station → RAN → Core
// =============================================================================

// ─── Types ────────────────────────────────────────────────────────────────────

export type RanVendor = "Nokia" | "Ericsson" | "Samsung" | "Mavenir"
export type PassStatus = "PASS" | "FAIL"
export type GroundSite =
  | "GS-TORONTO"
  | "GS-OTTAWA"
  | "GS-CALGARY"
  | "GS-VANCOUVER"
  | "GS-MONTREAL"

export interface DomainStatus {
  satellite: PassStatus
  groundStation: PassStatus
  ran: PassStatus
  core: PassStatus
}

export interface Pass {
  passId: string
  satellite: string
  groundSite: GroundSite
  ranVendor: RanVendor
  eNB: string
  cell: string
  aos: string
  los: string
  duration: string
  durationMins: number
  qvContact: string
  elevation: number
  overallStatus: PassStatus
  domainStatus: DomainStatus
}

// ─── Satellite KPIs ───────────────────────────────────────────────────────────

export interface SatelliteKPIs {
  eirp: number
  linkMargin: number
  ebNo: number
  dopplerShift: number
  dopplerCompensationRate: number
  phasedArrayBeamEfficiency: number
  satelliteEirpVariation: number
  cNo: number
  linkBudgetMargin: number
  status: PassStatus
}

// ─── Ground Station KPIs ──────────────────────────────────────────────────────

export interface ACUKPIs {
  azimuthTrackingError: number
  elevationTrackingError: number
  polarizationError: number
  acuLoopGain: number
  trackingMode: "AUTO" | "MANUAL" | "PROGRAM"
}

export interface BeaconKPIs {
  beaconLevel: number
  beaconSNR: number
  beaconFrequencyOffset: number
  beaconLockStatus: "LOCKED" | "SEARCHING" | "LOST"
}

export interface SignalAnalyzerKPIs {
  rxSignalLevel: number
  ber: number
  symbolRateAccuracy: number
  spectrumFlatness: number
  phaseNoise: number
}

export interface BPMSKPIs {
  demodulationLock: boolean
  fecCorrectionRate: number
  frameErrorRate: number
  bitrateUtilization: number
  processingLatency: number
}

export interface GroundStationKPIs {
  acu: ACUKPIs
  beacon: BeaconKPIs
  signalAnalyzer: SignalAnalyzerKPIs
  bpms: BPMSKPIs
  status: PassStatus
}

// ─── RAN KPIs ─────────────────────────────────────────────────────────────────

export interface RANKPIs {
  rrcSetupSuccessRate: number
  erabSetupSuccessRate: number
  callDropRate: number
  erabDropRate: number
  cellAvailability: number
  dlThroughput: number
  ulThroughput: number
  latency: number
  packetLossRate: number
  rsrp: number
  rsrq: number
  sinr: number
  cqi: number
  handoverSuccessRate: number
  rrcConnectionCount: number
  status: PassStatus
}

// ─── Core KPIs ────────────────────────────────────────────────────────────────

export interface CoreKPIs {
  pdpContextActivationRate: number
  pdpContextSuccessRate: number
  defaultBearerActivationRate: number
  dedicatedBearerActivationRate: number
  mmeAttachSuccessRate: number
  sgwSessionSuccessRate: number
  pgwDataPathSuccessRate: number
  dpiThroughput: number
  dpiClassificationAccuracy: number
  gtpTunnelIntegrity: number
  e2eLatency: number
  packetLossCore: number
  status: PassStatus
}

export interface DomainKPIs {
  satellite: SatelliteKPIs
  groundStation: GroundStationKPIs
  ran: RANKPIs
  core: CoreKPIs
}

// ─── Time Series ──────────────────────────────────────────────────────────────

export interface TimeSeriesPoint {
  minute: number
  elevation: number
  dlThroughput: number
  ulThroughput: number
  latency: number
  rsrp: number
  sinr: number
  beaconLevel: number
  eirp: number
  linkMargin: number
  cNo: number
  pdpSuccessRate: number
  mmeAttachRate: number
  e2eLatency: number
  azimuthError: number
  elevationError: number
  rxSignalLevel: number
  ber: number
  rachAttempts: number
  rachSuccessRate: number
  rrcSetupTime: number
  erabSetupTime: number
  pdcpSduLossUL: number
  pdcpSduLossDL: number
  prbUsageDL: number
  activeUEs: number
  rachSuccessCount: number
  rrcAttempts: number
  rrcSuccessCount: number
  erabAttempts: number
  erabSuccessCount: number
  rrcSetupSuccessRate: number
  erabSetupSuccessRate: number
  cellAvailability: number
}

// ─── Radar Data ───────────────────────────────────────────────────────────────

export interface RadarPoint {
  axis: string
  value: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const SATELLITES: string[] = Array.from(
  { length: 12 },
  (_, i) => `KUIPER-K${String(i + 1).padStart(3, "0")}`
)

export const GROUND_SITES: GroundSite[] = [
  "GS-TORONTO",
  "GS-OTTAWA",
  "GS-CALGARY",
  "GS-VANCOUVER",
  "GS-MONTREAL",
]

export const RAN_VENDORS: RanVendor[] = ["Nokia", "Ericsson", "Samsung", "Mavenir"]

const SITE_CODES: Record<GroundSite, string> = {
  "GS-TORONTO": "TOR",
  "GS-OTTAWA": "OTT",
  "GS-CALGARY": "CAL",
  "GS-VANCOUVER": "VAN",
  "GS-MONTREAL": "MTL",
}

const VENDOR_ENB_PREFIX: Record<RanVendor, string> = {
  Nokia: "NOK",
  Ericsson: "ERI",
  Samsung: "SAM",
  Mavenir: "MAV",
}

// ─── Seeded pseudo-random ─────────────────────────────────────────────────────

function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

function sr(seed: number, min: number, max: number): number {
  return min + seededRandom(seed) * (max - min)
}

function srInt(seed: number, min: number, max: number): number {
  return Math.floor(sr(seed, min, max + 1))
}

// ─── Pass Generation ──────────────────────────────────────────────────────────

function generateAOS(passIndex: number): string {
  // March 1–15 2026, spread across 15 days
  const dayOffset = Math.floor(passIndex / 4)
  const day = (dayOffset % 15) + 1
  const hour = srInt(passIndex * 7 + 100, 0, 23)
  const min = srInt(passIndex * 7 + 101, 0, 59)
  const sec = srInt(passIndex * 7 + 102, 0, 59)
  return `2026-03-${String(day).padStart(2, "0")} ${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
}

function addMinutes(timeStr: string, minutes: number): string {
  const [datePart, timePart] = timeStr.split(" ")
  const [h, m, s] = timePart.split(":").map(Number)
  const totalSec = h * 3600 + m * 60 + s + minutes * 60
  const nh = Math.floor(totalSec / 3600) % 24
  const nm = Math.floor((totalSec % 3600) / 60)
  const ns = totalSec % 60
  return `${datePart} ${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}:${String(ns).padStart(2, "0")}`
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`
}

export function generatePasses(): Pass[] {
  const passes: Pass[] = []

  for (let i = 0; i < 60; i++) {
    const passNum = 47001 + i
    const passId = `P${passNum}`
    const satIdx = srInt(i * 13 + 1, 0, 11)
    const siteIdx = i % 5
    const vendorIdx = srInt(i * 17 + 3, 0, 3)

    const satellite = SATELLITES[satIdx]
    const groundSite = GROUND_SITES[siteIdx]
    const ranVendor = RAN_VENDORS[vendorIdx]
    const siteCode = SITE_CODES[groundSite]
    const enbPrefix = VENDOR_ENB_PREFIX[ranVendor]
    const enbNum = srInt(i * 11 + 5, 1, 99)
    const cellNum = srInt(i * 19 + 7, 1, 6)

    const eNB = `${enbPrefix}-eNB-${siteCode}-${String(enbNum).padStart(2, "0")}`
    const cell = `CELL-${siteCode}-${cellNum}`
    const aos = generateAOS(i)
    const durationMins = srInt(i * 23 + 9, 5, 8)
    const los = addMinutes(aos, durationMins)
    const duration = formatDuration(durationMins)
    const qvContact = `QV-${passNum}-${siteCode}`
    const elevation = srInt(i * 31 + 11, 25, 85)

    // Determine domain statuses with ~80% pass rate
    const satSeed = i * 100 + 1
    const gsSeed = i * 100 + 2
    const ranSeed = i * 100 + 3
    const coreSeed = i * 100 + 4

    const satPass = seededRandom(satSeed) > 0.18
    const gsPass = seededRandom(gsSeed) > 0.15
    const ranPass = seededRandom(ranSeed) > 0.2
    const corePass = seededRandom(coreSeed) > 0.17

    const domainStatus: DomainStatus = {
      satellite: satPass ? "PASS" : "FAIL",
      groundStation: gsPass ? "PASS" : "FAIL",
      ran: ranPass ? "PASS" : "FAIL",
      core: corePass ? "PASS" : "FAIL",
    }

    const overallStatus: PassStatus = satPass && gsPass && ranPass && corePass ? "PASS" : "FAIL"

    passes.push({
      passId,
      satellite,
      groundSite,
      ranVendor,
      eNB,
      cell,
      aos,
      los,
      duration,
      durationMins,
      qvContact,
      elevation,
      overallStatus,
      domainStatus,
    })
  }

  return passes
}

// Singleton
let _passes: Pass[] | null = null
export function getPasses(): Pass[] {
  if (!_passes) _passes = generatePasses()
  return _passes
}

export function getPass(passId: string): Pass | undefined {
  return getPasses().find(p => p.passId === passId)
}

// ─── Domain KPI Generation ────────────────────────────────────────────────────

export function getDomainKPIs(passId: string, vendor: RanVendor): DomainKPIs {
  const idx = parseInt(passId.replace("P", "")) - 47001
  const s = idx * 1000

  // ── SATELLITE ──
  const eirp = sr(s + 1, 42, 58)
  const linkMargin = sr(s + 2, 3.2, 12.8)
  const beamEfficiency = sr(s + 6, 87, 99.2)
  const satStatus: PassStatus = eirp > 45 && linkMargin > 6 && beamEfficiency > 90 ? "PASS" : "FAIL"

  const satellite: SatelliteKPIs = {
    eirp,
    linkMargin,
    ebNo: sr(s + 3, 8.5, 18.2),
    dopplerShift: sr(s + 4, 12, 68),
    dopplerCompensationRate: sr(s + 5, 94, 99.8),
    phasedArrayBeamEfficiency: beamEfficiency,
    satelliteEirpVariation: sr(s + 7, 0.2, 2.8),
    cNo: sr(s + 8, 72, 88),
    linkBudgetMargin: sr(s + 9, 2.1, 9.4),
    status: satStatus,
  }

  // ── GROUND STATION ──
  const gs = s + 200
  const beaconLockRaw = seededRandom(gs + 1)
  const beaconLockStatus: "LOCKED" | "SEARCHING" | "LOST" =
    beaconLockRaw > 0.15 ? "LOCKED" : beaconLockRaw > 0.05 ? "SEARCHING" : "LOST"
  const ber = Math.pow(10, sr(gs + 15, -7, -4))
  const azimuthError = sr(gs + 3, 0.01, 0.8)
  const elevationError = sr(gs + 4, 0.01, 0.6)
  const gsStatus: PassStatus =
    beaconLockStatus === "LOCKED" &&
    azimuthError < 0.5 &&
    elevationError < 0.4 &&
    ber < 1e-5
      ? "PASS"
      : "FAIL"

  const groundStation: GroundStationKPIs = {
    acu: {
      azimuthTrackingError: azimuthError,
      elevationTrackingError: elevationError,
      polarizationError: sr(gs + 5, 0.01, 1.2),
      acuLoopGain: sr(gs + 6, 28, 42),
      trackingMode: gsStatus === "PASS" ? "AUTO" : seededRandom(gs + 7) > 0.5 ? "MANUAL" : "PROGRAM",
    },
    beacon: {
      beaconLevel: sr(gs + 10, -95, -72),
      beaconSNR: sr(gs + 11, 8, 28),
      beaconFrequencyOffset: sr(gs + 12, 0, 180),
      beaconLockStatus,
    },
    signalAnalyzer: {
      rxSignalLevel: sr(gs + 20, -88, -65),
      ber,
      symbolRateAccuracy: sr(gs + 21, 99.1, 99.99),
      spectrumFlatness: sr(gs + 22, 0.2, 3.1),
      phaseNoise: sr(gs + 23, -105, -85),
    },
    bpms: {
      demodulationLock: seededRandom(gs + 30) > 0.1,
      fecCorrectionRate: sr(gs + 31, 0.01, 4.2),
      frameErrorRate: sr(gs + 32, 0.001, 0.8),
      bitrateUtilization: sr(gs + 33, 45, 92),
      processingLatency: sr(gs + 34, 2.1, 8.8),
    },
    status: gsStatus,
  }

  // ── RAN ──
  const r = s + 400
  const vendorRanges: Record<RanVendor, {
    rrcMin: number; rrcMax: number; cdrMin: number; cdrMax: number
    dlMin: number; dlMax: number; ulMin: number; ulMax: number
    latMin: number; latMax: number
  }> = {
    Nokia:    { rrcMin: 99.2, rrcMax: 99.8, cdrMin: 0.08, cdrMax: 0.35, dlMin: 52, dlMax: 88, ulMin: 18, ulMax: 34, latMin: 24, latMax: 42 },
    Ericsson: { rrcMin: 98.8, rrcMax: 99.6, cdrMin: 0.12, cdrMax: 0.48, dlMin: 48, dlMax: 82, ulMin: 16, ulMax: 30, latMin: 28, latMax: 48 },
    Samsung:  { rrcMin: 98.2, rrcMax: 99.3, cdrMin: 0.18, cdrMax: 0.62, dlMin: 45, dlMax: 78, ulMin: 14, ulMax: 28, latMin: 32, latMax: 56 },
    Mavenir:  { rrcMin: 97.5, rrcMax: 99.1, cdrMin: 0.25, cdrMax: 0.85, dlMin: 38, dlMax: 72, ulMin: 12, ulMax: 24, latMin: 38, latMax: 65 },
  }
  const vr = vendorRanges[vendor]
  const rrcSR = sr(r + 1, vr.rrcMin, vr.rrcMax)
  const rrcCount = Math.floor(sr(r + 15, 2, 48))
  const ranStatus: PassStatus = rrcCount > 1 && rrcSR > 95 ? "PASS" : "FAIL"

  const ran: RANKPIs = {
    rrcSetupSuccessRate: rrcSR,
    erabSetupSuccessRate: sr(r + 2, vr.rrcMin - 0.3, vr.rrcMax - 0.1),
    callDropRate: sr(r + 3, vr.cdrMin, vr.cdrMax),
    erabDropRate: sr(r + 4, vr.cdrMin * 0.8, vr.cdrMax * 0.9),
    cellAvailability: sr(r + 5, 98.5, 99.95),
    dlThroughput: sr(r + 6, vr.dlMin, vr.dlMax),
    ulThroughput: sr(r + 7, vr.ulMin, vr.ulMax),
    latency: sr(r + 8, vr.latMin, vr.latMax),
    packetLossRate: sr(r + 9, 0.01, 0.8),
    rsrp: sr(r + 10, -110, -75),
    rsrq: sr(r + 11, -18, -5),
    sinr: sr(r + 12, -3, 28),
    cqi: Math.floor(sr(r + 13, 5, 15)),
    handoverSuccessRate: sr(r + 14, 95, 99.8),
    rrcConnectionCount: rrcCount,
    status: ranStatus,
  }

  // ── CORE ──
  const c = s + 600
  const pdpActivation = sr(c + 1, 98.2, 99.9)
  const mmeAttach = sr(c + 5, 98.8, 99.95)
  const e2eLatency = sr(c + 11, 45, 180)
  const coreStatus: PassStatus = pdpActivation > 99 && mmeAttach > 99 && e2eLatency < 150 ? "PASS" : "FAIL"

  const core: CoreKPIs = {
    pdpContextActivationRate: pdpActivation,
    pdpContextSuccessRate: sr(c + 2, 97.8, 99.8),
    defaultBearerActivationRate: sr(c + 3, 98.5, 99.9),
    dedicatedBearerActivationRate: sr(c + 4, 97.2, 99.6),
    mmeAttachSuccessRate: mmeAttach,
    sgwSessionSuccessRate: sr(c + 6, 98.5, 99.9),
    pgwDataPathSuccessRate: sr(c + 7, 97.8, 99.8),
    dpiThroughput: sr(c + 8, 1.2, 4.8),
    dpiClassificationAccuracy: sr(c + 9, 96.5, 99.8),
    gtpTunnelIntegrity: sr(c + 10, 99.1, 99.99),
    e2eLatency,
    packetLossCore: sr(c + 12, 0.01, 0.8),
    status: coreStatus,
  }

  return { satellite, groundStation, ran, core }
}

// ─── Time Series ──────────────────────────────────────────────────────────────

export function getTimeSeriesForPass(passId: string, vendor: RanVendor): TimeSeriesPoint[] {
  const idx = parseInt(passId.replace("P", "")) - 47001
  const pass = getPasses()[idx]
  const maxElevation = pass?.elevation ?? 45
  const durationMins = pass?.durationMins ?? 6
  const points: TimeSeriesPoint[] = []

  for (let t = 0; t < durationMins; t++) {
    // Parabolic elevation: peaks in middle
    const frac = t / Math.max(durationMins - 1, 1)
    const elevFrac = Math.sin(frac * Math.PI)
    const elevation = elevFrac * maxElevation

    // Signals stronger near peak
    const signalBoost = elevFrac
    const s = idx * 10000 + t * 100

    const dlBase = vendor === "Nokia" ? 70 : vendor === "Ericsson" ? 65 : vendor === "Samsung" ? 60 : 55
    const dlThroughput = dlBase * signalBoost + sr(s + 1, -5, 5)
    const ulThroughput = dlThroughput * sr(s + 2, 0.3, 0.45)

    const rachAttempts = srInt(s + 20, 10, 50)
    const rachSuccessRate = 94 + signalBoost * 5.8 + sr(s + 21, -1, 1)
    const rrcSetupTime = 8 + (1 - signalBoost) * 20 + sr(s + 22, -2, 2)
    const erabSetupTime = 12 + (1 - signalBoost) * 25 + sr(s + 23, -2, 2)
    const pdcpSduLossUL = Math.max(0, 0.8 - signalBoost * 0.7 + sr(s + 24, -0.1, 0.1))
    const pdcpSduLossDL = Math.max(0, 0.6 - signalBoost * 0.5 + sr(s + 25, -0.1, 0.1))
    const prbUsageDL = 20 + signalBoost * 60 + sr(s + 26, -5, 5)
    const activeUEs = srInt(s + 27, 1, 12) + Math.floor(signalBoost * 8)
    const rachSuccessCount = Math.floor(rachAttempts * rachSuccessRate / 100)
    const rrcAttempts = srInt(s + 28, 5, 30)
    // Use vendor-dependent RRC SR baseline
    const rrcSRBaseline = vendor === "Nokia" ? 99.5 : vendor === "Ericsson" ? 99.2 : vendor === "Samsung" ? 98.7 : 98.3
    const rrcSetupSuccessRateTS = rrcSRBaseline + sr(s + 29, -0.5, 0.5)
    const rrcSuccessCount = Math.floor(rrcAttempts * (rrcSetupSuccessRateTS / 100))
    const erabAttempts = srInt(s + 29, 3, 20)
    const erabSuccessCount = Math.floor(erabAttempts * 0.985)
    const erabSetupSuccessRateTS = rrcSRBaseline - 0.3 + sr(s + 30, -0.3, 0.3)
    const cellAvailabilityTS = 99.2 + sr(s + 31, -0.5, 0.5)

    points.push({
      minute: t + 1,
      elevation,
      dlThroughput: Math.max(0, dlThroughput),
      ulThroughput: Math.max(0, ulThroughput),
      latency: 35 + (1 - signalBoost) * 40 + sr(s + 3, -3, 3),
      rsrp: -110 + signalBoost * 35 + sr(s + 4, -3, 3),
      sinr: -3 + signalBoost * 28 + sr(s + 5, -2, 2),
      beaconLevel: -95 + signalBoost * 23 + sr(s + 6, -2, 2),
      eirp: 42 + signalBoost * 14 + sr(s + 7, -1, 1),
      linkMargin: 3.2 + signalBoost * 8.5 + sr(s + 8, -0.5, 0.5),
      cNo: 72 + signalBoost * 14 + sr(s + 9, -1, 1),
      pdpSuccessRate: 97 + signalBoost * 2.9 + sr(s + 10, -0.3, 0.3),
      mmeAttachRate: 97.5 + signalBoost * 2.4 + sr(s + 11, -0.3, 0.3),
      e2eLatency: 55 + (1 - signalBoost) * 110 + sr(s + 12, -5, 5),
      azimuthError: 0.6 - signalBoost * 0.5 + sr(s + 13, -0.05, 0.05),
      elevationError: 0.5 - signalBoost * 0.4 + sr(s + 14, -0.04, 0.04),
      rxSignalLevel: -88 + signalBoost * 23 + sr(s + 15, -2, 2),
      ber: Math.pow(10, -7 + (1 - signalBoost) * 3 + sr(s + 16, -0.5, 0.5)),
      rachAttempts,
      rachSuccessRate,
      rrcSetupTime,
      erabSetupTime,
      pdcpSduLossUL,
      pdcpSduLossDL,
      prbUsageDL,
      activeUEs,
      rachSuccessCount,
      rrcAttempts,
      rrcSuccessCount,
      erabAttempts,
      erabSuccessCount,
      rrcSetupSuccessRate: rrcSetupSuccessRateTS,
      erabSetupSuccessRate: erabSetupSuccessRateTS,
      cellAvailability: cellAvailabilityTS,
    })
  }

  return points
}

// ─── Vendor Radar Data ────────────────────────────────────────────────────────

export function getVendorRadarData(passId: string, vendor: RanVendor): RadarPoint[] {
  const idx = parseInt(passId.replace("P", "")) - 47001
  const s = idx * 500

  const vendorBonus: Record<RanVendor, number> = {
    Nokia: 10, Ericsson: 5, Samsung: 0, Mavenir: -5,
  }
  const bonus = vendorBonus[vendor]

  return [
    { axis: "Accessibility", value: Math.min(100, sr(s + 1, 75, 95) + bonus) },
    { axis: "Retainability", value: Math.min(100, sr(s + 2, 70, 92) + bonus) },
    { axis: "Availability", value: Math.min(100, sr(s + 3, 80, 98) + bonus * 0.5) },
    { axis: "Throughput", value: Math.min(100, sr(s + 4, 65, 90) + bonus * 1.2) },
    { axis: "Integrity", value: Math.min(100, sr(s + 5, 72, 93) + bonus * 0.8) },
  ]
}

// ─── All-vendor comparison for box plot ───────────────────────────────────────

export interface VendorStats {
  vendor: RanVendor
  min: number
  q1: number
  median: number
  q3: number
  max: number
  mean: number
}

export function getVendorDLStats(groundSite: GroundSite): VendorStats[] {
  const passes = getPasses().filter(p => p.groundSite === groundSite)

  return RAN_VENDORS.map(vendor => {
    const vendorPasses = passes.filter(p => p.ranVendor === vendor)
    if (vendorPasses.length === 0) {
      // generate synthetic
      const range: Record<RanVendor, [number, number]> = {
        Nokia: [52, 88], Ericsson: [48, 82], Samsung: [45, 78], Mavenir: [38, 72],
      }
      const [min, max] = range[vendor]
      const median = (min + max) / 2
      return { vendor, min, q1: min + (median - min) * 0.5, median, q3: median + (max - median) * 0.5, max, mean: median }
    }

    const values = vendorPasses.map(p => {
      const kpis = getDomainKPIs(p.passId, vendor)
      return kpis.ran.dlThroughput
    }).sort((a, b) => a - b)

    const n = values.length
    return {
      vendor,
      min: values[0],
      q1: values[Math.floor(n * 0.25)],
      median: values[Math.floor(n * 0.5)],
      q3: values[Math.floor(n * 0.75)],
      max: values[n - 1],
      mean: values.reduce((a, b) => a + b, 0) / n,
    }
  })
}

// ─── Latency histogram ────────────────────────────────────────────────────────

export interface LatencyBucket {
  range: string
  count: number
}

export function getLatencyHistogram(passId: string, vendor: RanVendor): {
  buckets: LatencyBucket[]
  p50: number
  p90: number
  p99: number
} {
  const ts = getTimeSeriesForPass(passId, vendor)
  const latencies = ts.map(p => p.e2eLatency).sort((a, b) => a - b)

  const min = 40
  const max = 180
  const bucketSize = 10
  const buckets: LatencyBucket[] = []

  for (let start = min; start < max; start += bucketSize) {
    const end = start + bucketSize
    buckets.push({
      range: `${start}-${end}`,
      count: latencies.filter(l => l >= start && l < end).length,
    })
  }

  const n = latencies.length
  return {
    buckets,
    p50: latencies[Math.floor(n * 0.5)] ?? 0,
    p90: latencies[Math.floor(n * 0.9)] ?? 0,
    p99: latencies[Math.floor(n * 0.99)] ?? 0,
  }
}

// ─── RSRP Heatmap ─────────────────────────────────────────────────────────────

export type SignalBand = "Excellent" | "Good" | "Fair" | "Poor" | "Edge"

export interface HeatmapCell {
  time: number
  band: SignalBand
  value: number
}

export function getRSRPHeatmap(passId: string, vendor: RanVendor): HeatmapCell[] {
  const ts = getTimeSeriesForPass(passId, vendor)
  const bands: SignalBand[] = ["Excellent", "Good", "Fair", "Poor", "Edge"]
  const cells: HeatmapCell[] = []

  ts.forEach((point, t) => {
    const rsrp = point.rsrp
    bands.forEach((band, b) => {
      const bandMin = -75 - b * 8
      const bandMax = bandMin + 8
      const inBand = rsrp >= bandMin && rsrp < bandMax
      cells.push({
        time: t + 1,
        band,
        value: inBand ? Math.abs(rsrp) : 0,
      })
    })
  })

  return cells
}

// ─── PM Counters ──────────────────────────────────────────────────────────────

export interface PMCounter {
  counterId: string
  kpiName: string
  value: number
  unit: string
  status: "pass" | "warn" | "fail"
}

export function getPMCounters(passId: string, vendor: RanVendor): PMCounter[] {
  const idx = parseInt(passId.replace("P", "")) - 47001
  const seed = idx * 2000

  function counterStatus(value: number, threshold: number | null, higherIsBetter: boolean, naCounter: boolean): "pass" | "warn" | "fail" {
    if (naCounter || threshold === null) return "pass"
    if (higherIsBetter) {
      if (value >= threshold) return "pass"
      if (value >= threshold * 0.95) return "warn"
      return "fail"
    } else {
      if (value <= threshold) return "pass"
      if (value <= threshold * 1.05) return "warn"
      return "fail"
    }
  }

  const cellAvail = sr(seed + 1, 97, 99.95)
  const rachAttempts = srInt(seed + 2, 500, 1500)
  const rachSR = sr(seed + 3, 94, 99.8)
  const rrcReestSR = sr(seed + 4, 98, 99.9)
  const avgRrcUEs = sr(seed + 5, 0, 8)
  const erabAttempts = srInt(seed + 6, 40, 200)
  const erabSR = sr(seed + 7, 97, 99.9)
  const erabQci8Att = srInt(seed + 8, 20, 80)
  const erabQci8SR = sr(seed + 9, 97, 99.9)
  const rbDropRatio = sr(seed + 10, 0.1, 2.5)
  const ulThptQci8 = sr(seed + 11, 200, 600)
  const dlThptQci8 = sr(seed + 12, 1500, 5000)
  const pdcpThptUL = sr(seed + 13, 300, 800)
  const pdcpThptDL = sr(seed + 14, 3000, 8000)
  const rssiPucch = sr(seed + 15, -92, -78)
  const rssiPusch = sr(seed + 16, -95, -80)
  const avgCqi = sr(seed + 17, 5, 13)
  const sinrPucch = sr(seed + 18, 8, 18)
  const sinrPusch = sr(seed + 19, 7, 16)

  return [
    {
      counterId: "LTE_6159b",
      kpiName: "E-UTRAN Cell Availability Ratio",
      value: parseFloat(cellAvail.toFixed(2)),
      unit: "%",
      status: counterStatus(cellAvail, 99.0, true, false),
    },
    {
      counterId: "LTE_5569b",
      kpiName: "E-UTRAN RACH Setup Attempts",
      value: rachAttempts,
      unit: "#",
      status: "pass",
    },
    {
      counterId: "LTE_5569c",
      kpiName: "E-UTRAN RACH Setup Completion Success Rate",
      value: parseFloat(rachSR.toFixed(2)),
      unit: "%",
      status: counterStatus(rachSR, 97.0, true, false),
    },
    {
      counterId: "LTE_5143a",
      kpiName: "Total E-UTRAN RRC Connection Re-establishment Success Ratio",
      value: parseFloat(rrcReestSR.toFixed(2)),
      unit: "%",
      status: counterStatus(rrcReestSR, 98.5, true, false),
    },
    {
      counterId: "LTE_5242b",
      kpiName: "E-UTRAN Average RRC Connected UEs",
      value: parseFloat(avgRrcUEs.toFixed(1)),
      unit: "#",
      status: "pass",
    },
    {
      counterId: "LTE_5118a",
      kpiName: "E-UTRAN E-RAB Setup Attempts",
      value: erabAttempts,
      unit: "#",
      status: "pass",
    },
    {
      counterId: "LTE_5017a",
      kpiName: "E-UTRAN E-RAB Setup Success Ratio",
      value: parseFloat(erabSR.toFixed(2)),
      unit: "%",
      status: counterStatus(erabSR, 98.0, true, false),
    },
    {
      counterId: "LTE_5644a",
      kpiName: "E-UTRAN E-RAB Setup Attempts QCI8",
      value: erabQci8Att,
      unit: "#",
      status: "pass",
    },
    {
      counterId: "LTE_5649a",
      kpiName: "E-UTRAN E-RAB Setup Success Ratio QCI8",
      value: parseFloat(erabQci8SR.toFixed(2)),
      unit: "%",
      status: counterStatus(erabQci8SR, 98.0, true, false),
    },
    {
      counterId: "LTE_5004d",
      kpiName: "E-UTRAN Radio Bearer Drop Ratio",
      value: parseFloat(rbDropRatio.toFixed(3)),
      unit: "%",
      status: counterStatus(rbDropRatio, 1.0, false, false),
    },
    {
      counterId: "LTE_5519a",
      kpiName: "E-UTRAN Averaged IP Throughput UL QCI8",
      value: parseFloat(ulThptQci8.toFixed(1)),
      unit: "kbps",
      status: counterStatus(ulThptQci8, 200, true, false),
    },
    {
      counterId: "LTE_5510c",
      kpiName: "E-UTRAN Averaged IP Throughput DL QCI8",
      value: parseFloat(dlThptQci8.toFixed(1)),
      unit: "kbps",
      status: counterStatus(dlThptQci8, 2000, true, false),
    },
    {
      counterId: "LTE_8097a",
      kpiName: "Maximum PDCP Throughput UL",
      value: parseFloat(pdcpThptUL.toFixed(1)),
      unit: "kbit/s",
      status: counterStatus(pdcpThptUL, 300, true, false),
    },
    {
      counterId: "LTE_8096a",
      kpiName: "Maximum PDCP Throughput DL",
      value: parseFloat(pdcpThptDL.toFixed(1)),
      unit: "kbit/s",
      status: counterStatus(pdcpThptDL, 3000, true, false),
    },
    {
      counterId: "LTE_5441b",
      kpiName: "E-UTRAN Average RSSI for PUCCH",
      value: parseFloat(rssiPucch.toFixed(1)),
      unit: "dBm",
      status: counterStatus(rssiPucch, -90, true, false),
    },
    {
      counterId: "LTE_5444b",
      kpiName: "Average RSSI for PUSCH",
      value: parseFloat(rssiPusch.toFixed(1)),
      unit: "dBm",
      status: counterStatus(rssiPusch, -92, true, false),
    },
    {
      counterId: "LTE_5427c",
      kpiName: "E-UTRAN Average CQI",
      value: parseFloat(avgCqi.toFixed(1)),
      unit: "#",
      status: counterStatus(avgCqi, 7, true, false),
    },
    {
      counterId: "LTE_5541b",
      kpiName: "E-UTRAN Average SINR for PUCCH",
      value: parseFloat(sinrPucch.toFixed(1)),
      unit: "dB",
      status: counterStatus(sinrPucch, 10, true, false),
    },
    {
      counterId: "LTE_5544b",
      kpiName: "E-UTRAN Average SINR for PUSCH",
      value: parseFloat(sinrPusch.toFixed(1)),
      unit: "dB",
      status: counterStatus(sinrPusch, 9, true, false),
    },
  ]
}

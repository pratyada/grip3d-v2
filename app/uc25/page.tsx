"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import Link from "next/link"

// ── Types ──────────────────────────────────────────────────────────────────────

interface CountryFeature {
  type: "Feature"
  id: string
  properties: { name: string }
  geometry: any
}

type ViewMode = "plastic" | "bleaching" | "temp"

type PlasticConc = "critical" | "high" | "moderate" | "low"
type BleachSev = "alert2" | "alert1" | "warning" | "watch"

interface GarbagePatch {
  type: "Feature"
  properties: {
    name: string
    oceanKm2: number
    plasticTonnes: number
    discovered: number
  }
  geometry: {
    type: "Polygon"
    coordinates: number[][][]
  }
}

interface PlasticPoint {
  lat: number
  lng: number
  concentration: PlasticConc
  plasticDensityKgKm2: number
  source?: string
}

interface BleachingEvent {
  id: string
  reef: string
  lat: number
  lng: number
  severity: BleachSev
  bleachPct: number
  year: 2024
  ocean: string
}

interface GyreArc {
  label: string
  srcLat: number
  srcLng: number
  dstLat: number
  dstLng: number
  color: string
  direction: "cw" | "ccw"
}

interface TempAnomaly {
  lat: number
  lng: number
  anomalyC: number
  region: string
  year: 2024
}

// ── Color constants ────────────────────────────────────────────────────────────

const SEVERITY_COLOR: Record<PlasticConc, [number, number, number, number]> = {
  critical: [255, 30,  30,  230],
  high:     [255, 100, 0,   210],
  moderate: [255, 180, 0,   190],
  low:      [255, 220, 100, 150],
}

const BLEACH_COLOR: Record<BleachSev, [number, number, number, number]> = {
  alert2:  [255, 0,   128, 230],
  alert1:  [255, 80,  0,   210],
  warning: [255, 160, 0,   190],
  watch:   [255, 220, 80,  160],
}

// ── Garbage Patches (GeoJSON polygons) ────────────────────────────────────────

const GARBAGE_PATCHES: GarbagePatch[] = [
  {
    type: "Feature",
    properties: {
      name: "Great Pacific Garbage Patch",
      oceanKm2: 1600000,
      plasticTonnes: 80000,
      discovered: 1997,
    },
    geometry: {
      type: "Polygon",
      coordinates: [[
        [-175, 35], [-145, 40], [-130, 35], [-125, 25],
        [-140, 15], [-160, 15], [-175, 25], [-175, 35],
      ]],
    },
  },
  {
    type: "Feature",
    properties: {
      name: "North Atlantic Garbage Patch",
      oceanKm2: 700000,
      plasticTonnes: 30000,
      discovered: 2010,
    },
    geometry: {
      type: "Polygon",
      coordinates: [[
        [-70, 35], [-50, 40], [-30, 38], [-25, 28],
        [-40, 22], [-60, 22], [-70, 28], [-70, 35],
      ]],
    },
  },
  {
    type: "Feature",
    properties: {
      name: "South Pacific Garbage Patch",
      oceanKm2: 500000,
      plasticTonnes: 25000,
      discovered: 2011,
    },
    geometry: {
      type: "Polygon",
      coordinates: [[
        [-145, -25], [-120, -20], [-105, -25],
        [-110, -40], [-130, -42], [-148, -35], [-145, -25],
      ]],
    },
  },
  {
    type: "Feature",
    properties: {
      name: "South Atlantic Garbage Patch",
      oceanKm2: 400000,
      plasticTonnes: 18000,
      discovered: 2015,
    },
    geometry: {
      type: "Polygon",
      coordinates: [[
        [-35, -15], [-15, -18], [-5, -28],
        [-12, -38], [-30, -40], [-40, -30], [-35, -15],
      ]],
    },
  },
  {
    type: "Feature",
    properties: {
      name: "Indian Ocean Garbage Patch",
      oceanKm2: 500000,
      plasticTonnes: 20000,
      discovered: 2010,
    },
    geometry: {
      type: "Polygon",
      coordinates: [[
        [65, -10], [85, -8], [95, -18],
        [88, -30], [70, -32], [58, -22], [65, -10],
      ]],
    },
  },
]

// ── Plastic concentration points (~80 points) ─────────────────────────────────

const PLASTIC_POINTS: PlasticPoint[] = [
  // Great Pacific Garbage Patch - dense core
  { lat: 32, lng: -145, concentration: "critical", plasticDensityKgKm2: 485 },
  { lat: 30, lng: -148, concentration: "critical", plasticDensityKgKm2: 512 },
  { lat: 35, lng: -143, concentration: "critical", plasticDensityKgKm2: 448 },
  { lat: 28, lng: -140, concentration: "critical", plasticDensityKgKm2: 390 },
  { lat: 33, lng: -155, concentration: "high",     plasticDensityKgKm2: 278 },
  { lat: 38, lng: -150, concentration: "high",     plasticDensityKgKm2: 245 },
  { lat: 25, lng: -138, concentration: "high",     plasticDensityKgKm2: 301 },
  { lat: 27, lng: -152, concentration: "high",     plasticDensityKgKm2: 265 },
  { lat: 20, lng: -155, concentration: "moderate", plasticDensityKgKm2: 145 },
  { lat: 22, lng: -160, concentration: "moderate", plasticDensityKgKm2: 132 },
  { lat: 36, lng: -162, concentration: "moderate", plasticDensityKgKm2: 112 },
  { lat: 18, lng: -145, concentration: "moderate", plasticDensityKgKm2: 98 },
  { lat: 17, lng: -165, concentration: "low",      plasticDensityKgKm2: 55 },
  { lat: 40, lng: -168, concentration: "low",      plasticDensityKgKm2: 48 },

  // North Atlantic Garbage Patch
  { lat: 32, lng: -50, concentration: "critical", plasticDensityKgKm2: 420 },
  { lat: 35, lng: -45, concentration: "critical", plasticDensityKgKm2: 389 },
  { lat: 30, lng: -55, concentration: "high",     plasticDensityKgKm2: 255 },
  { lat: 37, lng: -35, concentration: "high",     plasticDensityKgKm2: 210 },
  { lat: 26, lng: -42, concentration: "moderate", plasticDensityKgKm2: 128 },
  { lat: 28, lng: -62, concentration: "moderate", plasticDensityKgKm2: 115 },
  { lat: 38, lng: -60, concentration: "low",      plasticDensityKgKm2: 62 },

  // South Pacific Garbage Patch
  { lat: -30, lng: -120, concentration: "critical", plasticDensityKgKm2: 345 },
  { lat: -28, lng: -128, concentration: "high",     plasticDensityKgKm2: 268 },
  { lat: -35, lng: -115, concentration: "high",     plasticDensityKgKm2: 230 },
  { lat: -25, lng: -112, concentration: "moderate", plasticDensityKgKm2: 118 },
  { lat: -38, lng: -130, concentration: "moderate", plasticDensityKgKm2: 105 },
  { lat: -22, lng: -135, concentration: "low",      plasticDensityKgKm2: 58 },

  // South Atlantic Garbage Patch
  { lat: -22, lng: -25, concentration: "high",     plasticDensityKgKm2: 215 },
  { lat: -28, lng: -18, concentration: "high",     plasticDensityKgKm2: 198 },
  { lat: -33, lng: -22, concentration: "moderate", plasticDensityKgKm2: 122 },
  { lat: -18, lng: -30, concentration: "moderate", plasticDensityKgKm2: 108 },
  { lat: -36, lng: -28, concentration: "low",      plasticDensityKgKm2: 52 },

  // Indian Ocean Garbage Patch
  { lat: -18, lng: 72, concentration: "high",     plasticDensityKgKm2: 232 },
  { lat: -22, lng: 82, concentration: "high",     plasticDensityKgKm2: 218 },
  { lat: -25, lng: 88, concentration: "moderate", plasticDensityKgKm2: 138 },
  { lat: -15, lng: 78, concentration: "moderate", plasticDensityKgKm2: 125 },
  { lat: -28, lng: 75, concentration: "low",      plasticDensityKgKm2: 65 },
  { lat: -12, lng: 92, concentration: "low",      plasticDensityKgKm2: 48 },

  // Coastal — Yangtze River (China), world's largest plastic contributor
  { lat: 31, lng: 122,  concentration: "critical", plasticDensityKgKm2: 890, source: "Yangtze R." },
  { lat: 30, lng: 124,  concentration: "critical", plasticDensityKgKm2: 742, source: "Yangtze R." },
  { lat: 32, lng: 120,  concentration: "high",     plasticDensityKgKm2: 380, source: "China coast" },

  // Mekong Delta (Vietnam/Cambodia)
  { lat: 10, lng: 106, concentration: "critical", plasticDensityKgKm2: 620, source: "Mekong R." },
  { lat: 10.5, lng: 108, concentration: "high",   plasticDensityKgKm2: 340, source: "Vietnam coast" },

  // Ganges / Bay of Bengal (India/Bangladesh)
  { lat: 22, lng: 88, concentration: "critical", plasticDensityKgKm2: 780, source: "Ganges R." },
  { lat: 21, lng: 90, concentration: "critical", plasticDensityKgKm2: 650, source: "Bangladesh coast" },
  { lat: 18, lng: 83, concentration: "high",     plasticDensityKgKm2: 290, source: "Bay of Bengal" },

  // Nile / Mediterranean Egypt
  { lat: 31.5, lng: 30.5, concentration: "high",     plasticDensityKgKm2: 315, source: "Nile R." },
  { lat: 32,   lng: 28,   concentration: "moderate", plasticDensityKgKm2: 142, source: "Egypt coast" },

  // Niger Delta (Nigeria)
  { lat: 4.5, lng: 5,  concentration: "critical", plasticDensityKgKm2: 560, source: "Niger R." },
  { lat: 4,   lng: 7,  concentration: "high",     plasticDensityKgKm2: 298, source: "Nigeria coast" },

  // Manila Bay / Philippines
  { lat: 14.5, lng: 120.5, concentration: "critical", plasticDensityKgKm2: 720, source: "Manila Bay" },
  { lat: 13,   lng: 122,   concentration: "high",     plasticDensityKgKm2: 310, source: "Philippines" },

  // Java Sea / Indonesia
  { lat: -6.5, lng: 107, concentration: "critical", plasticDensityKgKm2: 688, source: "Java coast" },
  { lat: -8,   lng: 112, concentration: "high",     plasticDensityKgKm2: 345, source: "Indonesia" },

  // Mediterranean Sea
  { lat: 37, lng: 12, concentration: "high",     plasticDensityKgKm2: 285, source: "Mediterranean" },
  { lat: 36, lng: 18, concentration: "high",     plasticDensityKgKm2: 260, source: "Mediterranean" },
  { lat: 38, lng: 22, concentration: "moderate", plasticDensityKgKm2: 142, source: "Aegean Sea" },
  { lat: 35, lng: 28, concentration: "moderate", plasticDensityKgKm2: 118, source: "Eastern Med" },

  // Caribbean / Gulf Coast
  { lat: 20, lng: -75, concentration: "high",     plasticDensityKgKm2: 245, source: "Caribbean" },
  { lat: 18, lng: -68, concentration: "moderate", plasticDensityKgKm2: 145, source: "Caribbean" },
  { lat: 25, lng: -90, concentration: "moderate", plasticDensityKgKm2: 128, source: "Gulf of Mexico" },

  // Bay of Bengal / Myanmar/Bangladesh
  { lat: 16, lng: 95, concentration: "high",     plasticDensityKgKm2: 278, source: "Irrawaddy R." },
  { lat: 20, lng: 92, concentration: "high",     plasticDensityKgKm2: 245, source: "Bay of Bengal" },

  // South China Sea
  { lat: 12, lng: 114, concentration: "high",     plasticDensityKgKm2: 320, source: "South China Sea" },
  { lat: 15, lng: 110, concentration: "moderate", plasticDensityKgKm2: 168, source: "South China Sea" },

  // Arabian Sea / Pakistan/India
  { lat: 24, lng: 65, concentration: "high",     plasticDensityKgKm2: 235, source: "Arabian Sea" },
  { lat: 22, lng: 70, concentration: "moderate", plasticDensityKgKm2: 148, source: "India West coast" },

  // Red Sea
  { lat: 20, lng: 38, concentration: "high",     plasticDensityKgKm2: 268, source: "Red Sea" },
  { lat: 22, lng: 36, concentration: "moderate", plasticDensityKgKm2: 135, source: "Red Sea" },

  // West Africa
  { lat: 5.5, lng: -1, concentration: "high",     plasticDensityKgKm2: 248, source: "Ghana coast" },
  { lat: 6,   lng: 2,  concentration: "moderate", plasticDensityKgKm2: 138, source: "Benin coast" },

  // Brazil coast
  { lat: -10, lng: -37, concentration: "moderate", plasticDensityKgKm2: 125, source: "Brazil NE" },
  { lat: -23, lng: -44, concentration: "moderate", plasticDensityKgKm2: 118, source: "Rio de Janeiro" },

  // Additional Pacific drifters
  { lat: 25, lng: 170, concentration: "low",  plasticDensityKgKm2: 68 },
  { lat: -5, lng: 175, concentration: "low",  plasticDensityKgKm2: 52 },
  { lat: 45, lng: 158, concentration: "low",  plasticDensityKgKm2: 45 },
]

// ── Bleaching events 2024 (4th global mass bleaching event) ───────────────────

const BLEACHING_EVENTS: BleachingEvent[] = [
  // Great Barrier Reef — 91% bleached
  { id: "gbr-01", reef: "Great Barrier Reef — Northern",      lat: -14.5, lng: 145.5, severity: "alert2", bleachPct: 95, year: 2024, ocean: "Coral Sea" },
  { id: "gbr-02", reef: "Great Barrier Reef — Central",       lat: -18.0, lng: 147.0, severity: "alert2", bleachPct: 88, year: 2024, ocean: "Coral Sea" },
  { id: "gbr-03", reef: "Great Barrier Reef — Southern",      lat: -23.0, lng: 151.5, severity: "alert1", bleachPct: 72, year: 2024, ocean: "Coral Sea" },
  { id: "gbr-04", reef: "Coral Sea (off GBR)",                lat: -16.0, lng: 150.0, severity: "alert2", bleachPct: 91, year: 2024, ocean: "Coral Sea" },

  // Florida Keys / USA (90%+ bleached)
  { id: "fl-01", reef: "Florida Keys — Upper",                lat: 25.2, lng: -80.3, severity: "alert2", bleachPct: 97, year: 2024, ocean: "Atlantic" },
  { id: "fl-02", reef: "Florida Keys — Middle",               lat: 24.8, lng: -81.0, severity: "alert2", bleachPct: 93, year: 2024, ocean: "Atlantic" },
  { id: "fl-03", reef: "Florida Keys — Dry Tortugas",         lat: 24.6, lng: -82.8, severity: "alert1", bleachPct: 82, year: 2024, ocean: "Atlantic" },

  // Hawaii (100% of surveyed reefs)
  { id: "hi-01", reef: "Main Hawaiian Islands — West Maui",   lat: 21.1, lng: -156.8, severity: "alert2", bleachPct: 100, year: 2024, ocean: "Pacific" },
  { id: "hi-02", reef: "Hawaii Island — Kona Coast",          lat: 19.7, lng: -156.2, severity: "alert2", bleachPct: 100, year: 2024, ocean: "Pacific" },
  { id: "hi-03", reef: "Oahu — Kaneohe Bay",                  lat: 21.5, lng: -157.8, severity: "alert1", bleachPct: 85, year: 2024, ocean: "Pacific" },
  { id: "hi-04", reef: "Northwestern Hawaiian Islands",       lat: 23.5, lng: -166.5, severity: "alert1", bleachPct: 78, year: 2024, ocean: "Pacific" },

  // Caribbean — widespread
  { id: "car-01", reef: "Puerto Rico — La Parguera",          lat: 17.9, lng: -67.1, severity: "alert2", bleachPct: 91, year: 2024, ocean: "Caribbean" },
  { id: "car-02", reef: "U.S. Virgin Islands",                lat: 18.3, lng: -65.0, severity: "alert2", bleachPct: 88, year: 2024, ocean: "Caribbean" },
  { id: "car-03", reef: "Mesoamerican Reef — Belize",         lat: 16.5, lng: -88.0, severity: "alert2", bleachPct: 84, year: 2024, ocean: "Caribbean" },
  { id: "car-04", reef: "Cayman Islands",                     lat: 19.4, lng: -81.4, severity: "alert1", bleachPct: 75, year: 2024, ocean: "Caribbean" },
  { id: "car-05", reef: "Turks and Caicos",                   lat: 21.8, lng: -72.0, severity: "alert2", bleachPct: 90, year: 2024, ocean: "Caribbean" },
  { id: "car-06", reef: "Barbados — East Coast Reef",         lat: 13.2, lng: -59.5, severity: "alert1", bleachPct: 70, year: 2024, ocean: "Caribbean" },

  // Gulf of Mexico
  { id: "gom-01", reef: "Flower Garden Banks (Gulf of Mexico)", lat: 27.9, lng: -93.6, severity: "alert2", bleachPct: 96, year: 2024, ocean: "Gulf of Mexico" },
  { id: "gom-02", reef: "Mexican Caribbean — Cozumel",          lat: 20.4, lng: -87.0, severity: "alert2", bleachPct: 89, year: 2024, ocean: "Caribbean" },

  // Red Sea
  { id: "rs-01", reef: "Saudi Arabia — Red Sea Northern",     lat: 28.0, lng: 34.5, severity: "alert2", bleachPct: 92, year: 2024, ocean: "Red Sea" },
  { id: "rs-02", reef: "Egypt — Ras Mohammed",                lat: 27.7, lng: 34.2, severity: "alert2", bleachPct: 88, year: 2024, ocean: "Red Sea" },
  { id: "rs-03", reef: "Red Sea — Central Saudi Arabia",      lat: 22.0, lng: 38.5, severity: "alert1", bleachPct: 74, year: 2024, ocean: "Red Sea" },

  // Maldives
  { id: "mv-01", reef: "Maldives — North Atoll",              lat: 5.5,  lng: 73.5, severity: "alert2", bleachPct: 94, year: 2024, ocean: "Indian Ocean" },
  { id: "mv-02", reef: "Maldives — South Atoll",              lat: 1.8,  lng: 73.2, severity: "alert2", bleachPct: 90, year: 2024, ocean: "Indian Ocean" },

  // Seychelles
  { id: "sey-01", reef: "Seychelles — Outer Islands",         lat: -9.5,  lng: 53.5, severity: "alert2", bleachPct: 87, year: 2024, ocean: "Indian Ocean" },
  { id: "sey-02", reef: "Seychelles — Aldabra Atoll",         lat: -9.4,  lng: 46.4, severity: "alert1", bleachPct: 72, year: 2024, ocean: "Indian Ocean" },

  // Chagos Archipelago (BIOT)
  { id: "chag-01", reef: "Chagos — Diego Garcia",             lat: -7.3,  lng: 72.4, severity: "alert2", bleachPct: 85, year: 2024, ocean: "Indian Ocean" },
  { id: "chag-02", reef: "Chagos — Peros Banhos",             lat: -5.3,  lng: 71.8, severity: "alert1", bleachPct: 68, year: 2024, ocean: "Indian Ocean" },

  // South Pacific Islands
  { id: "sp-01", reef: "New Caledonia — Grand Lagoon",        lat: -21.5, lng: 165.5, severity: "alert2", bleachPct: 88, year: 2024, ocean: "Pacific" },
  { id: "sp-02", reef: "Fiji — Lau Group",                    lat: -18.0, lng: 178.5, severity: "alert2", bleachPct: 82, year: 2024, ocean: "Pacific" },
  { id: "sp-03", reef: "Tonga — Ha'apai Group",               lat: -19.8, lng: -174.5,severity: "alert1", bleachPct: 72, year: 2024, ocean: "Pacific" },
  { id: "sp-04", reef: "Micronesia — Pohnpei",                lat: 6.9,  lng: 158.2, severity: "alert2", bleachPct: 90, year: 2024, ocean: "Pacific" },
  { id: "sp-05", reef: "Palau",                               lat: 7.5,  lng: 134.5, severity: "alert2", bleachPct: 86, year: 2024, ocean: "Pacific" },
  { id: "sp-06", reef: "Johnston Atoll",                      lat: 16.8, lng: -169.5, severity: "warning", bleachPct: 55, year: 2024, ocean: "Pacific" },

  // Indian Ocean / Sri Lanka / Andamans
  { id: "ind-01", reef: "Sri Lanka — Gulf of Mannar",         lat: 8.9,  lng: 79.8, severity: "alert2", bleachPct: 88, year: 2024, ocean: "Indian Ocean" },
  { id: "ind-02", reef: "Andaman Islands",                    lat: 12.0, lng: 93.0, severity: "alert2", bleachPct: 82, year: 2024, ocean: "Bay of Bengal" },
  { id: "ind-03", reef: "Lakshadweep Islands",                lat: 11.0, lng: 72.5, severity: "alert1", bleachPct: 74, year: 2024, ocean: "Arabian Sea" },

  // Thailand / Southeast Asia
  { id: "sea-01", reef: "Thailand — Surin Islands",           lat: 9.4,  lng: 97.9, severity: "alert2", bleachPct: 90, year: 2024, ocean: "Andaman Sea" },
  { id: "sea-02", reef: "Thailand — Similan Islands",         lat: 8.6,  lng: 97.6, severity: "alert1", bleachPct: 76, year: 2024, ocean: "Andaman Sea" },
  { id: "sea-03", reef: "Philippines — Tubbataha Reef",       lat: 9.0,  lng: 120.0, severity: "warning", bleachPct: 58, year: 2024, ocean: "Sulu Sea" },
]

// ── Gyre arcs ─────────────────────────────────────────────────────────────────

const GYRE_ARCS: GyreArc[] = [
  // North Pacific Gyre (clockwise) — breaks into 4 arcs
  { label: "North Pacific Gyre (N. leg)",  srcLat: 45, srcLng: 140, dstLat: 45, dstLng: -130, color: "rgba(0,200,255,0.7)", direction: "cw" },
  { label: "North Pacific Gyre (E. leg)",  srcLat: 45, srcLng: -130, dstLat: 20, dstLng: -115, color: "rgba(0,200,255,0.7)", direction: "cw" },
  { label: "North Pacific Gyre (S. leg)",  srcLat: 20, srcLng: -115, dstLat: 15, dstLng: 135, color: "rgba(0,200,255,0.7)", direction: "cw" },
  { label: "North Pacific Gyre (W. leg)",  srcLat: 15, srcLng: 135, dstLat: 45, dstLng: 140, color: "rgba(0,200,255,0.7)", direction: "cw" },

  // South Pacific Gyre (counterclockwise)
  { label: "South Pacific Gyre (N. leg)", srcLat: -8,  srcLng: -80, dstLat: -8,  dstLng: 170, color: "rgba(0,160,255,0.6)", direction: "ccw" },
  { label: "South Pacific Gyre (W. leg)", srcLat: -8,  srcLng: 170, dstLat: -45, dstLng: 160, color: "rgba(0,160,255,0.6)", direction: "ccw" },
  { label: "South Pacific Gyre (S. leg)", srcLat: -45, srcLng: 160, dstLat: -45, dstLng: -78, color: "rgba(0,160,255,0.6)", direction: "ccw" },
  { label: "South Pacific Gyre (E. leg)", srcLat: -45, srcLng: -78, dstLat: -8,  dstLng: -80, color: "rgba(0,160,255,0.6)", direction: "ccw" },

  // North Atlantic Gyre (clockwise)
  { label: "North Atlantic Gyre (N. leg)", srcLat: 45, srcLng: -10, dstLat: 45, dstLng: -65, color: "rgba(100,180,255,0.65)", direction: "cw" },
  { label: "North Atlantic Gyre (W. leg)", srcLat: 45, srcLng: -65, dstLat: 15, dstLng: -65, color: "rgba(100,180,255,0.65)", direction: "cw" },
  { label: "North Atlantic Gyre (S. leg)", srcLat: 15, srcLng: -65, dstLat: 12, dstLng: -18, color: "rgba(100,180,255,0.65)", direction: "cw" },
  { label: "North Atlantic Gyre (E. leg)", srcLat: 12, srcLng: -18, dstLat: 45, dstLng: -10, color: "rgba(100,180,255,0.65)", direction: "cw" },

  // South Atlantic Gyre (counterclockwise)
  { label: "South Atlantic Gyre (N. leg)", srcLat: -5,  srcLng: -35, dstLat: -5,  dstLng: 12, color: "rgba(50,140,220,0.6)", direction: "ccw" },
  { label: "South Atlantic Gyre (E. leg)", srcLat: -5,  srcLng: 12,  dstLat: -40, dstLng: 20, color: "rgba(50,140,220,0.6)", direction: "ccw" },
  { label: "South Atlantic Gyre (S. leg)", srcLat: -40, srcLng: 20,  dstLat: -40, dstLng: -52, color: "rgba(50,140,220,0.6)", direction: "ccw" },
  { label: "South Atlantic Gyre (W. leg)", srcLat: -40, srcLng: -52, dstLat: -5,  dstLng: -35, color: "rgba(50,140,220,0.6)", direction: "ccw" },

  // Indian Ocean Gyre (clockwise)
  { label: "Indian Ocean Gyre (N. leg)", srcLat: -10, srcLng: 45,  dstLat: -10, dstLng: 100, color: "rgba(80,200,200,0.65)", direction: "cw" },
  { label: "Indian Ocean Gyre (E. leg)", srcLat: -10, srcLng: 100, dstLat: -40, dstLng: 90,  color: "rgba(80,200,200,0.65)", direction: "cw" },
  { label: "Indian Ocean Gyre (S. leg)", srcLat: -40, srcLng: 90,  dstLat: -40, dstLng: 42,  color: "rgba(80,200,200,0.65)", direction: "cw" },
  { label: "Indian Ocean Gyre (W. leg)", srcLat: -40, srcLng: 42,  dstLat: -10, dstLng: 45,  color: "rgba(80,200,200,0.65)", direction: "cw" },
]

// ── Temperature anomaly points (~60 points) ───────────────────────────────────

const TEMP_ANOMALIES: TempAnomaly[] = [
  // North Atlantic — record-breaking 2024 (+3°C anomaly)
  { lat: 50, lng: -30, anomalyC: 3.1, region: "North Atlantic", year: 2024 },
  { lat: 48, lng: -20, anomalyC: 3.2, region: "North Atlantic", year: 2024 },
  { lat: 52, lng: -15, anomalyC: 2.9, region: "North Atlantic", year: 2024 },
  { lat: 45, lng: -40, anomalyC: 2.8, region: "North Atlantic", year: 2024 },
  { lat: 55, lng: -25, anomalyC: 2.5, region: "North Atlantic", year: 2024 },
  { lat: 42, lng: -50, anomalyC: 2.2, region: "North Atlantic", year: 2024 },

  // Gulf of Mexico — +2.5°C
  { lat: 26, lng: -88, anomalyC: 2.6, region: "Gulf of Mexico", year: 2024 },
  { lat: 24, lng: -92, anomalyC: 2.5, region: "Gulf of Mexico", year: 2024 },
  { lat: 28, lng: -90, anomalyC: 2.4, region: "Gulf of Mexico", year: 2024 },
  { lat: 22, lng: -86, anomalyC: 2.3, region: "Gulf of Mexico", year: 2024 },

  // Mediterranean — +3°C
  { lat: 38, lng: 15,  anomalyC: 3.0, region: "Mediterranean", year: 2024 },
  { lat: 36, lng: 20,  anomalyC: 3.2, region: "Mediterranean", year: 2024 },
  { lat: 40, lng: 5,   anomalyC: 2.8, region: "Mediterranean", year: 2024 },
  { lat: 35, lng: 30,  anomalyC: 2.9, region: "Eastern Mediterranean", year: 2024 },
  { lat: 37, lng: 8,   anomalyC: 3.1, region: "Western Mediterranean", year: 2024 },

  // Indian Ocean — +1.8°C
  { lat: -5,  lng: 68, anomalyC: 1.9, region: "Indian Ocean", year: 2024 },
  { lat: -10, lng: 75, anomalyC: 1.8, region: "Indian Ocean", year: 2024 },
  { lat:  5,  lng: 65, anomalyC: 2.0, region: "Arabian Sea", year: 2024 },
  { lat:  10, lng: 80, anomalyC: 1.7, region: "Bay of Bengal", year: 2024 },
  { lat: -15, lng: 85, anomalyC: 1.6, region: "Indian Ocean", year: 2024 },

  // Pacific — El Niño-driven anomalies
  { lat:  5, lng: -120, anomalyC: 2.4, region: "Central Pacific (El Niño)", year: 2024 },
  { lat:  0, lng: -140, anomalyC: 2.6, region: "Central Pacific (El Niño)", year: 2024 },
  { lat: -5, lng: -130, anomalyC: 2.2, region: "Eastern Pacific", year: 2024 },
  { lat: 10, lng: -108, anomalyC: 2.0, region: "Eastern Pacific", year: 2024 },
  { lat:  2, lng: -155, anomalyC: 1.9, region: "Central Pacific", year: 2024 },
  { lat: 15, lng: -135, anomalyC: 1.7, region: "North Pacific", year: 2024 },

  // Coral Triangle (Indonesia/Philippines) — +1.5°C
  { lat: 5,  lng: 122, anomalyC: 1.8, region: "Coral Triangle", year: 2024 },
  { lat: 2,  lng: 128, anomalyC: 1.6, region: "Coral Triangle", year: 2024 },
  { lat: -5, lng: 130, anomalyC: 1.5, region: "Banda Sea", year: 2024 },

  // Red Sea — +2°C
  { lat: 22, lng: 37, anomalyC: 2.2, region: "Red Sea", year: 2024 },
  { lat: 18, lng: 39, anomalyC: 2.0, region: "Red Sea", year: 2024 },

  // Arctic Ocean — extreme anomalies
  { lat: 75,  lng: -30, anomalyC: 4.2, region: "Arctic Ocean", year: 2024 },
  { lat: 78,  lng:  20, anomalyC: 3.8, region: "Barents Sea", year: 2024 },
  { lat: 70,  lng: -10, anomalyC: 3.5, region: "Nordic Seas", year: 2024 },
  { lat: 72,  lng: -40, anomalyC: 3.2, region: "Labrador Sea", year: 2024 },
  { lat: 80,  lng:  60, anomalyC: 4.0, region: "Kara Sea", year: 2024 },

  // Northwest Pacific / Japan
  { lat: 35, lng: 142, anomalyC: 2.0, region: "Northwest Pacific", year: 2024 },
  { lat: 30, lng: 148, anomalyC: 1.8, region: "Northwest Pacific", year: 2024 },

  // Caribbean
  { lat: 18, lng: -70, anomalyC: 1.9, region: "Caribbean", year: 2024 },
  { lat: 14, lng: -65, anomalyC: 1.8, region: "Caribbean", year: 2024 },

  // Southeast Pacific — Peru current
  { lat: -12, lng: -78, anomalyC: 1.4, region: "Southeast Pacific", year: 2024 },
  { lat: -18, lng: -74, anomalyC: 1.5, region: "Humboldt Current", year: 2024 },

  // Southern Ocean anomalies
  { lat: -55, lng: -40,  anomalyC: 1.8, region: "Southern Ocean (Atlantic)", year: 2024 },
  { lat: -58, lng:  10,  anomalyC: 1.6, region: "Southern Ocean (Indian)",   year: 2024 },
  { lat: -55, lng: 150,  anomalyC: 1.5, region: "Southern Ocean (Pacific)",  year: 2024 },
  { lat: -60, lng:  80,  anomalyC: 1.7, region: "Southern Ocean",            year: 2024 },

  // Black Sea
  { lat: 43, lng: 33, anomalyC: 2.2, region: "Black Sea", year: 2024 },
  { lat: 42, lng: 30, anomalyC: 2.0, region: "Black Sea", year: 2024 },

  // Persian Gulf
  { lat: 26, lng: 51, anomalyC: 2.8, region: "Persian Gulf", year: 2024 },
  { lat: 24, lng: 54, anomalyC: 2.6, region: "Persian Gulf", year: 2024 },

  // Japan Sea / East China Sea
  { lat: 36, lng: 130, anomalyC: 1.8, region: "Japan Sea", year: 2024 },
  { lat: 28, lng: 125, anomalyC: 1.9, region: "East China Sea", year: 2024 },

  // Australia coast
  { lat: -28, lng: 115, anomalyC: 1.6, region: "Western Australia", year: 2024 },
  { lat: -22, lng: 152, anomalyC: 1.8, region: "Coral Sea", year: 2024 },
]

// ── Helper: color for temp anomaly ────────────────────────────────────────────

function tempColor(anomalyC: number): string {
  // 0 → blue, 1.5 → cyan, 2.5 → yellow, 3+ → red
  const t = Math.min(1, Math.max(0, anomalyC / 4))
  if (t < 0.35) {
    const f = t / 0.35
    return `rgba(${Math.round(80 + f * 100)},${Math.round(180 + f * 40)},255,0.85)`
  } else if (t < 0.65) {
    const f = (t - 0.35) / 0.30
    return `rgba(${Math.round(180 + f * 75)},${Math.round(220 - f * 100)},${Math.round(255 - f * 230)},0.85)`
  } else {
    const f = (t - 0.65) / 0.35
    return `rgba(255,${Math.round(120 - f * 100)},${Math.round(25 - f * 20)},0.9)`
  }
}

function tempDotSize(anomalyC: number): number {
  return 0.35 + Math.min(anomalyC, 4) * 0.18
}

function bleachDotSize(pct: number): number {
  return 0.25 + (pct / 100) * 0.55
}

// ── Country border helpers ─────────────────────────────────────────────────────

function featureCentroid(geometry: any): { lat: number; lng: number } {
  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180
  function walk(c: any) {
    if (!Array.isArray(c)) return
    if (typeof c[0] === "number") {
      const [lng, lat] = c
      if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat
      if (lng < minLng) minLng = lng; if (lng > maxLng) maxLng = lng
    } else for (const sub of c) walk(sub)
  }
  walk(geometry?.coordinates)
  return { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 }
}

function featureBbox(geometry: any): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180
  function walk(c: any) {
    if (!Array.isArray(c)) return
    if (typeof c[0] === "number") {
      const [lng, lat] = c
      if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat
      if (lng < minLng) minLng = lng; if (lng > maxLng) maxLng = lng
    } else for (const sub of c) walk(sub)
  }
  walk(geometry?.coordinates)
  return { minLat, maxLat, minLng, maxLng }
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function UC25Page() {
  const globeRef   = useRef<HTMLDivElement>(null)
  const globeInst  = useRef<any>(null)

  const [viewMode,   setViewMode]   = useState<ViewMode>("plastic")
  const [isSpinning, setIsSpinning] = useState(false)
  const [globeReady, setGlobeReady] = useState(false)
  const [animTick,   setAnimTick]   = useState(0)
  const [selectedPlastic,  setSelectedPlastic]  = useState<PlasticPoint | null>(null)
  const [selectedBleach,   setSelectedBleach]   = useState<BleachingEvent | null>(null)
  const [selectedTemp,     setSelectedTemp]     = useState<TempAnomaly | null>(null)
  const [countries,        setCountries]        = useState<CountryFeature[]>([])
  const [hoveredCountry,   setHoveredCountry]   = useState<CountryFeature | null>(null)
  const [selectedCountry,  setSelectedCountry]  = useState<CountryFeature | null>(null)

  const viewModeRef = useRef<ViewMode>("plastic")
  useEffect(() => { viewModeRef.current = viewMode }, [viewMode])

  // Pulse animation for bleaching
  useEffect(() => {
    const id = setInterval(() => setAnimTick(t => t + 1), 800)
    return () => clearInterval(id)
  }, [])

  // Fetch country borders
  useEffect(() => {
    fetch("/countries-110m.geojson").then(r => r.json()).then(geo => {
      setCountries(geo.features as CountryFeature[])
    })
  }, [])

  // ── Globe init ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!globeRef.current || globeInst.current) return
    let globe: any

    import("globe.gl").then(mod => {
      if (!globeRef.current) return
      const GlobeGL = (mod.default ?? mod) as any
      globe = new GlobeGL()

      globe(globeRef.current)
        .width(globeRef.current.clientWidth)
        .height(globeRef.current.clientHeight)
        .globeImageUrl("//unpkg.com/three-globe/example/img/earth-night.jpg")
        .bumpImageUrl("//unpkg.com/three-globe/example/img/earth-topology.png")
        .backgroundImageUrl("//unpkg.com/three-globe/example/img/night-sky.png")
        .atmosphereColor("#0066ff")
        .atmosphereAltitude(0.12)
        .pointOfView({ lat: 10, lng: -160, altitude: 2.2 })

        // ── Plastic points ─────────────────────────────────────────────────
        .pointsData(PLASTIC_POINTS)
        .pointLat("lat")
        .pointLng("lng")
        .pointAltitude(0.01)
        .pointRadius((d: PlasticPoint) => {
          const map: Record<PlasticConc, number> = { critical: 0.7, high: 0.55, moderate: 0.4, low: 0.3 }
          return map[d.concentration]
        })
        .pointColor((d: PlasticPoint) => {
          const [r, g, b, a] = SEVERITY_COLOR[d.concentration]
          return `rgba(${r},${g},${b},${(a / 255).toFixed(2)})`
        })
        .pointsMerge(false)
        .pointLabel((d: PlasticPoint) =>
          `<div style="font-family:sans-serif;padding:7px 11px;background:rgba(0,0,0,0.88);border-radius:9px;border:1px solid rgba(255,80,0,0.4);color:#fff;font-size:12px;max-width:220px;">
            <b style="color:${d.concentration === "critical" ? "#ff3030" : d.concentration === "high" ? "#ff7000" : d.concentration === "moderate" ? "#ffb800" : "#ffdc64"}">${d.concentration.toUpperCase()}</b>
            <br/>${d.plasticDensityKgKm2} kg/km² plastic density
            ${d.source ? `<br/><span style="color:#aaa;font-size:11px">Source: ${d.source}</span>` : ""}
          </div>`
        )
        .onPointClick((d: PlasticPoint) => {
          if (viewModeRef.current !== "plastic") return
          setSelectedPlastic(d)
          setSelectedBleach(null)
          setSelectedTemp(null)
          globe.pointOfView({ lat: d.lat, lng: d.lng, altitude: 1.5 }, 700)
        })

        // ── Gyre arcs ─────────────────────────────────────────────────────
        .arcsData(GYRE_ARCS)
        .arcStartLat("srcLat")
        .arcStartLng("srcLng")
        .arcEndLat("dstLat")
        .arcEndLng("dstLng")
        .arcColor("color")
        .arcAltitude(0.18)
        .arcStroke(0.4)
        .arcDashLength(0.35)
        .arcDashGap(0.25)
        .arcDashAnimateTime(5000)
        .arcLabel((d: GyreArc) =>
          `<div style="font-family:sans-serif;padding:4px 8px;background:rgba(0,0,0,0.8);border-radius:6px;color:#88ddff;font-size:11px;">${d.label}</div>`
        )

      const ctrl = globe.controls()
      ctrl.autoRotate      = false
      ctrl.autoRotateSpeed = 0.08
      ctrl.enableDamping   = true
      ctrl.dampingFactor   = 0.1

      globeInst.current = globe
      setGlobeReady(true)
      // Country borders are applied via the sync useEffect once countries load.
      // For immediate init with no countries yet, set up an empty polygon layer.
      applyCountries(globe, [], GARBAGE_PATCHES, null, null)

      const onResize = () => {
        if (globe && globeRef.current) {
          globe.width(globeRef.current.clientWidth)
          globe.height(globeRef.current.clientHeight)
        }
      }
      window.addEventListener("resize", onResize)
      ;(globeRef.current as any)._uc25Resize = onResize
    })

    return () => {
      const el = globeRef.current
      if (el && (el as any)._uc25Resize) {
        window.removeEventListener("resize", (el as any)._uc25Resize)
      }
      globe?._destructor?.()
      globe?.controls()?.dispose?.()
      globeInst.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Country polygon layer ───────────────────────────────────────────────────
  // globe.gl has a single polygonsData slot; we merge country borders with
  // garbage patches (in plastic mode) so both render simultaneously.
  function applyCountries(
    globe: any,
    features: CountryFeature[],
    patches: GarbagePatch[],
    hovered: CountryFeature | null,
    selected: CountryFeature | null,
  ) {
    const combined: any[] = [...patches, ...features]
    globe
      .polygonsData(combined)
      .polygonCapColor((d: any) => {
        // Garbage patches retain their orange fill
        if ((d as GarbagePatch).properties?.plasticTonnes !== undefined)
          return "rgba(255,120,0,0.18)"
        if (selected?.properties.name === d.properties.name) return "rgba(253,231,37,0.10)"
        if (hovered?.properties.name === d.properties.name) return "rgba(255,255,255,0.06)"
        return "rgba(0,0,0,0)"
      })
      .polygonSideColor((d: any) => {
        if ((d as GarbagePatch).properties?.plasticTonnes !== undefined)
          return "rgba(255,80,0,0.08)"
        return "rgba(0,0,0,0)"
      })
      .polygonStrokeColor((d: any) => {
        if ((d as GarbagePatch).properties?.plasticTonnes !== undefined)
          return "rgba(255,100,20,0.55)"
        if (selected?.properties.name === d.properties.name) return "rgba(253,231,37,0.9)"
        if (hovered?.properties.name === d.properties.name) return "rgba(255,255,255,0.6)"
        return "rgba(255,255,255,0.18)"
      })
      .polygonAltitude((d: any) => {
        if ((d as GarbagePatch).properties?.plasticTonnes !== undefined) return 0.008
        return 0.005
      })
      .polygonLabel((d: any) => {
        const patch = d as GarbagePatch
        if (patch.properties?.plasticTonnes !== undefined) {
          return `<div style="font-family:sans-serif;padding:7px 11px;background:rgba(0,0,0,0.88);border-radius:9px;border:1px solid rgba(255,100,20,0.45);color:#fff;font-size:12px;">
            <b style="color:#ff8844">${patch.properties.name}</b><br/>
            ${(patch.properties.oceanKm2 / 1e6).toFixed(1)}M km² · ${(patch.properties.plasticTonnes / 1000).toFixed(0)}k tonnes<br/>
            <span style="color:#aaa;font-size:11px">Discovered: ${patch.properties.discovered}</span>
          </div>`
        }
        return ""
      })
      .onPolygonHover((d: any) => {
        if (!d || (d as GarbagePatch).properties?.plasticTonnes !== undefined) return
        setHoveredCountry(d as CountryFeature | null)
      })
      .onPolygonClick((d: any) => {
        if ((d as GarbagePatch).properties?.plasticTonnes !== undefined) return
        const f = d as CountryFeature
        setSelectedCountry(prev => prev?.properties.name === f.properties.name ? null : f)
        const { lat, lng } = featureCentroid(f.geometry)
        globeInst.current?.pointOfView({ lat, lng, altitude: 2.0 }, 800)
      })
  }

  // ── View mode switching ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!globeInst.current || !globeReady) return
    const g = globeInst.current

    if (viewMode === "plastic") {
      g.pointsData(PLASTIC_POINTS)
        .pointLat("lat").pointLng("lng")
        .pointAltitude(0.01)
        .pointRadius((d: PlasticPoint) => {
          const map: Record<PlasticConc, number> = { critical: 0.7, high: 0.55, moderate: 0.4, low: 0.3 }
          return map[d.concentration]
        })
        .pointColor((d: PlasticPoint) => {
          const [r, g2, b, a] = SEVERITY_COLOR[d.concentration]
          return `rgba(${r},${g2},${b},${(a / 255).toFixed(2)})`
        })
        .pointsMerge(false)
        .pointLabel((d: PlasticPoint) =>
          `<div style="font-family:sans-serif;padding:7px 11px;background:rgba(0,0,0,0.88);border-radius:9px;border:1px solid rgba(255,80,0,0.4);color:#fff;font-size:12px;max-width:220px;">
            <b style="color:${d.concentration === "critical" ? "#ff3030" : d.concentration === "high" ? "#ff7000" : d.concentration === "moderate" ? "#ffb800" : "#ffdc64"}">${d.concentration.toUpperCase()}</b>
            <br/>${d.plasticDensityKgKm2} kg/km² plastic density
            ${d.source ? `<br/><span style="color:#aaa;font-size:11px">Source: ${d.source}</span>` : ""}
          </div>`
        )
        .onPointClick((d: PlasticPoint) => {
          setSelectedPlastic(d)
          setSelectedBleach(null)
          setSelectedTemp(null)
          globeInst.current?.pointOfView({ lat: d.lat, lng: d.lng, altitude: 1.5 }, 700)
        })
      applyCountries(g, countries, GARBAGE_PATCHES, hoveredCountry, selectedCountry)
      g.arcsData(GYRE_ARCS)
        .arcColor("color")
        .arcStroke(0.4)
        .arcDashLength(0.35).arcDashGap(0.25).arcDashAnimateTime(5000)

      g.pointOfView({ lat: 10, lng: -160, altitude: 2.2 }, 900)

    } else if (viewMode === "bleaching") {
      g.pointsData(BLEACHING_EVENTS)
        .pointLat("lat").pointLng("lng")
        .pointAltitude(0.015)
        .pointRadius((d: BleachingEvent) => bleachDotSize(d.bleachPct))
        .pointColor((d: BleachingEvent) => {
          const [r, gb, b, a] = BLEACH_COLOR[d.severity]
          return `rgba(${r},${gb},${b},${(a / 255).toFixed(2)})`
        })
        .pointsMerge(false)
        .pointLabel((d: BleachingEvent) =>
          `<div style="font-family:sans-serif;padding:7px 11px;background:rgba(0,0,0,0.88);border-radius:9px;border:1px solid rgba(255,0,128,0.4);color:#fff;font-size:12px;">
            <b style="color:#ff0080">${d.reef}</b><br/>
            Bleached: <b>${d.bleachPct}%</b> · Level: <b>${d.severity.toUpperCase()}</b><br/>
            <span style="color:#aaa;font-size:11px">${d.ocean} · ${d.year}</span>
          </div>`
        )
        .onPointClick((d: BleachingEvent) => {
          setSelectedBleach(d)
          setSelectedPlastic(null)
          setSelectedTemp(null)
          globeInst.current?.pointOfView({ lat: d.lat, lng: d.lng, altitude: 1.4 }, 700)
        })
      applyCountries(g, countries, [], hoveredCountry, selectedCountry)
      g.arcsData([])

      g.pointOfView({ lat: -10, lng: 150, altitude: 2.0 }, 900)

    } else {
      // temp anomaly
      g.pointsData(TEMP_ANOMALIES)
        .pointLat("lat").pointLng("lng")
        .pointAltitude(0.012)
        .pointRadius((d: TempAnomaly) => tempDotSize(d.anomalyC))
        .pointColor((d: TempAnomaly) => tempColor(d.anomalyC))
        .pointsMerge(false)
        .pointLabel((d: TempAnomaly) =>
          `<div style="font-family:sans-serif;padding:7px 11px;background:rgba(0,0,0,0.88);border-radius:9px;border:1px solid rgba(255,100,0,0.4);color:#fff;font-size:12px;">
            <b style="color:#ffaa44">${d.region}</b><br/>
            +${d.anomalyC.toFixed(1)}°C above 1991–2020 average<br/>
            <span style="color:#aaa;font-size:11px">Year: ${d.year} · NOAA data</span>
          </div>`
        )
        .onPointClick((d: TempAnomaly) => {
          setSelectedTemp(d)
          setSelectedPlastic(null)
          setSelectedBleach(null)
          globeInst.current?.pointOfView({ lat: d.lat, lng: d.lng, altitude: 1.5 }, 700)
        })
      applyCountries(g, countries, [], hoveredCountry, selectedCountry)
      g.arcsData([])

      g.pointOfView({ lat: 45, lng: -30, altitude: 2.0 }, 900)
    }

    setSelectedPlastic(null)
    setSelectedBleach(null)
    setSelectedTemp(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, globeReady])

  // ── Spin toggle ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!globeInst.current) return
    globeInst.current.controls().autoRotate = isSpinning
  }, [isSpinning])

  // ── Sync country borders on hover / select / countries load ─────────────────
  useEffect(() => {
    if (!globeInst.current || !globeReady || !countries.length) return
    const patches = viewMode === "plastic" ? GARBAGE_PATCHES : []
    applyCountries(globeInst.current, countries, patches, hoveredCountry, selectedCountry)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoveredCountry, selectedCountry, countries, globeReady, viewMode])

  // ── Bleaching pulse animation (change opacity periodically) ─────────────────
  useEffect(() => {
    if (!globeInst.current || !globeReady || viewMode !== "bleaching") return
    const g = globeInst.current
    const pulse = animTick % 2 === 0
    g.pointAltitude(pulse ? 0.018 : 0.012)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animTick, globeReady])

  // ── Country stats (computed when a country is selected) ─────────────────────
  const countryStats = useMemo(() => {
    if (!selectedCountry) return null
    const bbox = featureBbox(selectedCountry.geometry)
    const plasticCount = PLASTIC_POINTS.filter(p =>
      p.lat >= bbox.minLat && p.lat <= bbox.maxLat &&
      p.lng >= bbox.minLng && p.lng <= bbox.maxLng
    ).length
    const criticalPlastic = PLASTIC_POINTS.filter(p =>
      p.lat >= bbox.minLat && p.lat <= bbox.maxLat &&
      p.lng >= bbox.minLng && p.lng <= bbox.maxLng &&
      p.concentration === "critical"
    ).length
    const bleachCount = BLEACHING_EVENTS.filter(e =>
      e.lat >= bbox.minLat && e.lat <= bbox.maxLat &&
      e.lng >= bbox.minLng && e.lng <= bbox.maxLng
    ).length
    const tempPts = TEMP_ANOMALIES.filter(t =>
      t.lat >= bbox.minLat && t.lat <= bbox.maxLat &&
      t.lng >= bbox.minLng && t.lng <= bbox.maxLng
    )
    const avgTemp = tempPts.length
      ? (tempPts.reduce((s, t) => s + t.anomalyC, 0) / tempPts.length).toFixed(1)
      : null
    const maxTemp = tempPts.length
      ? Math.max(...tempPts.map(t => t.anomalyC)).toFixed(1)
      : null
    return { plasticCount, criticalPlastic, bleachCount, avgTemp, maxTemp, tempPts: tempPts.length }
  }, [selectedCountry])

  // ── Derived stats ───────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalPatchTonnes = GARBAGE_PATCHES.reduce((s, p) => s + p.properties.plasticTonnes, 0)
    const criticalPts = PLASTIC_POINTS.filter(p => p.concentration === "critical").length
    const alert2Events = BLEACHING_EVENTS.filter(e => e.severity === "alert2").length
    const avgAnomaly = (TEMP_ANOMALIES.reduce((s, t) => s + t.anomalyC, 0) / TEMP_ANOMALIES.length).toFixed(1)
    return { totalPatchTonnes, criticalPts, alert2Events, avgAnomaly }
  }, [])

  // ── Legends ─────────────────────────────────────────────────────────────────
  const plasticLegend = [
    { label: "Critical",  color: "rgb(255,30,30)",   note: ">400 kg/km²" },
    { label: "High",      color: "rgb(255,100,0)",   note: "200–400 kg/km²" },
    { label: "Moderate",  color: "rgb(255,180,0)",   note: "100–200 kg/km²" },
    { label: "Low",       color: "rgb(255,220,100)", note: "<100 kg/km²" },
  ]
  const bleachLegend = [
    { label: "Alert Level 2", color: "rgb(255,0,128)",   note: "Severe bleaching" },
    { label: "Alert Level 1", color: "rgb(255,80,0)",    note: "Significant bleaching" },
    { label: "Warning",       color: "rgb(255,160,0)",   note: "Elevated risk" },
    { label: "Watch",         color: "rgb(255,220,80)",  note: "Monitoring" },
  ]
  const tempLegend = [
    { label: "+4°C+",  color: "rgb(255,20,5)",    note: "Extreme (Arctic)" },
    { label: "+3°C",   color: "rgb(255,120,20)",  note: "Record-breaking" },
    { label: "+2°C",   color: "rgb(255,200,80)",  note: "Significant" },
    { label: "+1°C",   color: "rgb(100,220,255)", note: "Elevated" },
  ]

  const accentColor = viewMode === "plastic" ? "#ff7020" : viewMode === "bleaching" ? "#ff0080" : "#ff9930"
  const accentBorder = viewMode === "plastic" ? "rgba(255,112,32,0.35)" : viewMode === "bleaching" ? "rgba(255,0,128,0.35)" : "rgba(255,153,48,0.35)"

  const selectedItem = selectedPlastic ?? selectedBleach ?? selectedTemp

  return (
    <div className="relative" style={{ minHeight: "calc(100vh - 64px)", background: "#000" }}>

      {/* Globe canvas */}
      <div ref={globeRef} className="absolute inset-0" />

      {/* ── CRISIS ALERT banner ──────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-20 flex justify-center pointer-events-none">
        <div
          className="mx-4 mt-2 px-5 py-2 rounded-xl text-xs font-bold tracking-wide text-center"
          style={{
            background: "rgba(255,0,60,0.18)",
            border: "1px solid rgba(255,0,60,0.5)",
            backdropFilter: "blur(10px)",
            color: "#ff2244",
            maxWidth: 600,
          }}
        >
          CRISIS ALERT — 2024 — 4th Global Mass Coral Bleaching Event Declared by NOAA/ICRI
        </div>
      </div>

      {/* ── Left panel ───────────────────────────────────────────────────────── */}
      <div className="absolute top-12 left-4 bottom-4 flex flex-col gap-3 pointer-events-none z-10"
           style={{ width: 256 }}>

        {/* Title + stats */}
        <div className="rounded-xl p-4 pointer-events-auto"
             style={{ background: "rgba(0,0,0,0.82)", border: `1px solid ${accentBorder}`, backdropFilter: "blur(14px)" }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base font-bold" style={{ color: accentColor }}>Ocean Crisis Atlas</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: "rgba(255,0,60,0.15)", color: "#ff2244", border: "1px solid rgba(255,0,60,0.35)" }}>
              2024
            </span>
          </div>
          <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>Plastic · Bleaching · Temperature</p>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { val: "150M+", label: "Tonnes in ocean" },
              { val: "54%",   label: "Coral bleached" },
              { val: `${stats.criticalPts}`, label: "Critical zones" },
              { val: `+${stats.avgAnomaly}°C`, label: "Avg anomaly" },
            ].map(s => (
              <div key={s.label} className="rounded-lg px-2 py-1.5"
                   style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-sm font-bold" style={{ color: accentColor }}>{s.val}</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* View mode tabs */}
        <div className="rounded-xl p-3 pointer-events-auto"
             style={{ background: "rgba(0,0,0,0.82)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(14px)" }}>
          <p className="text-xs font-semibold tracking-wider mb-2" style={{ color: "var(--muted)" }}>VIEW MODE</p>
          <div className="flex flex-col gap-1.5">
            {([
              { id: "plastic"  as ViewMode, label: "Plastic Pollution",   icon: "♻" , desc: "Patches · Hotspots · Gyres" },
              { id: "bleaching" as ViewMode, label: "Coral Bleaching",     icon: "🪸", desc: "2024 Mass Bleaching Events" },
              { id: "temp"     as ViewMode, label: "Temp Anomalies",      icon: "🌡", desc: "Record 2024 SST anomalies" },
            ]).map(v => (
              <button key={v.id}
                      onClick={() => setViewMode(v.id)}
                      className="flex items-start gap-2 px-3 py-2.5 rounded-lg text-left"
                      style={{
                        background: viewMode === v.id ? `${accentColor}18` : "transparent",
                        border:     viewMode === v.id ? `1px solid ${accentBorder}` : "1px solid transparent",
                        color:      viewMode === v.id ? accentColor : "var(--muted)",
                      }}>
                <span className="text-base mt-0.5">{v.icon}</span>
                <div>
                  <p className="text-xs font-semibold">{v.label}</p>
                  <p className="text-xs opacity-60">{v.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="rounded-xl p-3 pointer-events-auto"
             style={{ background: "rgba(0,0,0,0.82)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(14px)" }}>
          <p className="text-xs font-semibold tracking-wider mb-2" style={{ color: "var(--muted)" }}>LEGEND</p>
          <div className="flex flex-col gap-1.5">
            {(viewMode === "plastic" ? plasticLegend : viewMode === "bleaching" ? bleachLegend : tempLegend).map(l => (
              <div key={l.label} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: l.color }} />
                <div className="min-w-0">
                  <span className="text-xs font-medium" style={{ color: "var(--text)" }}>{l.label}</span>
                  <span className="text-xs ml-1.5" style={{ color: "var(--muted)" }}>{l.note}</span>
                </div>
              </div>
            ))}
          </div>
          {viewMode === "plastic" && (
            <div className="mt-3 pt-2.5" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-xs font-semibold mb-1" style={{ color: "var(--muted)" }}>PATCHES (orange polygons)</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>5 major ocean garbage patches</p>
              <p className="text-xs font-semibold mt-2 mb-1" style={{ color: "var(--muted)" }}>GYRES (animated arcs)</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>5 ocean current circulation gyres</p>
            </div>
          )}
        </div>

        {/* Key facts */}
        <div className="rounded-xl p-3 pointer-events-auto"
             style={{ background: "rgba(0,0,0,0.82)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(14px)" }}>
          <p className="text-xs font-semibold tracking-wider mb-2" style={{ color: "var(--muted)" }}>KEY FACTS</p>
          <div className="flex flex-col gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
            {viewMode === "plastic" && (
              <>
                <p>• 8M tonnes of plastic enter oceans annually</p>
                <p>• Great Pacific Patch: 1.6M km² (Texas × 2)</p>
                <p>• 46% of ocean plastic is fishing nets</p>
                <p>• Rivers responsible for 80% of ocean plastic</p>
              </>
            )}
            {viewMode === "bleaching" && (
              <>
                <p>• 4th global bleaching declared Mar 2024</p>
                <p>• Great Barrier Reef: 91% bleached in 2024</p>
                <p>• Florida Keys: 90%+ mass mortality event</p>
                <p>• Hawaii: 100% of surveyed reefs bleached</p>
              </>
            )}
            {viewMode === "temp" && (
              <>
                <p>• 2024: warmest ocean year ever recorded</p>
                <p>• N. Atlantic: +3°C unprecedented anomaly</p>
                <p>• Arctic sea ice at record lows</p>
                <p>• Global SST broke records every month</p>
              </>
            )}
          </div>
        </div>

        {/* Attribution */}
        <div className="rounded-xl px-3 py-2 pointer-events-auto mt-auto"
             style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(8px)" }}>
          <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.3)" }}>
            Data: NOAA, ICRI, Ocean Cleanup, GESAMP · 2024
          </p>
        </div>
      </div>

      {/* ── Top-right controls ────────────────────────────────────────────────── */}
      <div className="absolute top-12 right-4 flex items-center gap-2 pointer-events-auto z-10">
        <button onClick={() => setIsSpinning(s => !s)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)", color: "var(--muted)", backdropFilter: "blur(8px)" }}>
          {isSpinning ? "Pause" : "Rotate"}
        </button>
        <Link href="/uc25/details"
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: `${accentColor}18`, border: `1px solid ${accentBorder}`, color: accentColor, backdropFilter: "blur(8px)" }}>
          Details →
        </Link>
      </div>

      {/* ── Selected item panel (bottom-right) ───────────────────────────────── */}
      {selectedItem && (
        <div className="absolute bottom-4 right-4 pointer-events-auto z-10" style={{ width: 272 }}>
          <div className="rounded-xl p-4"
               style={{ background: "rgba(0,0,0,0.92)", border: `1px solid ${accentBorder}`, backdropFilter: "blur(16px)" }}>

            {selectedPlastic && (
              <>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-semibold tracking-wider mb-0.5" style={{ color: accentColor }}>
                      PLASTIC HOTSPOT
                    </p>
                    {selectedPlastic.source && (
                      <p className="text-sm font-bold" style={{ color: "var(--text)" }}>{selectedPlastic.source}</p>
                    )}
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                      {selectedPlastic.lat.toFixed(1)}°, {selectedPlastic.lng.toFixed(1)}°
                    </p>
                  </div>
                  <button onClick={() => setSelectedPlastic(null)}
                          className="opacity-40 hover:opacity-80 text-sm"
                          style={{ color: "var(--muted)" }}>✕</button>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: "Concentration",   val: selectedPlastic.concentration.toUpperCase() },
                    { label: "Density",         val: `${selectedPlastic.plasticDensityKgKm2} kg/km²` },
                    { label: "Latitude",        val: `${selectedPlastic.lat.toFixed(2)}°` },
                    { label: "Longitude",       val: `${selectedPlastic.lng.toFixed(2)}°` },
                  ].map(m => (
                    <div key={m.label} className="rounded-lg px-2 py-1.5"
                         style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>{m.label}</p>
                      <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{m.val}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-2 h-1.5 rounded-full overflow-hidden"
                     style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div className="h-full rounded-full"
                       style={{ width: `${Math.min(100, (selectedPlastic.plasticDensityKgKm2 / 900) * 100)}%`, background: "linear-gradient(90deg, #ff4400, #ff1111)" }} />
                </div>
                <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Relative pollution severity</p>
              </>
            )}

            {selectedBleach && (
              <>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-semibold tracking-wider mb-0.5" style={{ color: "#ff0080" }}>
                      CORAL BLEACHING EVENT
                    </p>
                    <p className="text-sm font-bold leading-tight" style={{ color: "var(--text)" }}>{selectedBleach.reef}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{selectedBleach.ocean} · {selectedBleach.year}</p>
                  </div>
                  <button onClick={() => setSelectedBleach(null)}
                          className="opacity-40 hover:opacity-80 text-sm"
                          style={{ color: "var(--muted)" }}>✕</button>
                </div>
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  {[
                    { label: "% Bleached",     val: `${selectedBleach.bleachPct}%` },
                    { label: "Alert Level",    val: selectedBleach.severity.toUpperCase() },
                    { label: "Ocean",          val: selectedBleach.ocean },
                    { label: "Year",           val: String(selectedBleach.year) },
                  ].map(m => (
                    <div key={m.label} className="rounded-lg px-2 py-1.5"
                         style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>{m.label}</p>
                      <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{m.val}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-1 h-1.5 rounded-full overflow-hidden"
                     style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div className="h-full rounded-full"
                       style={{ width: `${selectedBleach.bleachPct}%`, background: "linear-gradient(90deg, #ff0080, #ff4400)" }} />
                </div>
                <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>{selectedBleach.bleachPct}% of reef bleached</p>
              </>
            )}

            {selectedTemp && (
              <>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-semibold tracking-wider mb-0.5" style={{ color: "#ff9930" }}>
                      TEMPERATURE ANOMALY
                    </p>
                    <p className="text-sm font-bold leading-tight" style={{ color: "var(--text)" }}>{selectedTemp.region}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                      {selectedTemp.lat.toFixed(1)}°, {selectedTemp.lng.toFixed(1)}° · {selectedTemp.year}
                    </p>
                  </div>
                  <button onClick={() => setSelectedTemp(null)}
                          className="opacity-40 hover:opacity-80 text-sm"
                          style={{ color: "var(--muted)" }}>✕</button>
                </div>
                <div className="rounded-xl px-4 py-3 mb-2"
                     style={{ background: "rgba(255,153,48,0.08)", border: "1px solid rgba(255,153,48,0.25)" }}>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>Anomaly vs 1991–2020 baseline</p>
                  <p className="text-3xl font-bold" style={{ color: tempColor(selectedTemp.anomalyC) }}>
                    +{selectedTemp.anomalyC.toFixed(1)}°C
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="rounded-lg px-2 py-1.5"
                       style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>Latitude</p>
                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{selectedTemp.lat.toFixed(1)}°</p>
                  </div>
                  <div className="rounded-lg px-2 py-1.5"
                       style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>Longitude</p>
                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{selectedTemp.lng.toFixed(1)}°</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Country stats panel ───────────────────────────────────────────────── */}
      {selectedCountry && (
        <div
          className="absolute pointer-events-auto z-10"
          style={{ width: 280, right: "1rem", bottom: selectedItem ? "calc(1rem + 270px)" : "1rem" }}>
          <div className="rounded-xl p-4"
               style={{ background: "rgba(0,0,0,0.92)", border: "1px solid rgba(253,231,37,0.35)", backdropFilter: "blur(16px)" }}>

            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-semibold tracking-wider mb-0.5" style={{ color: "rgba(253,231,37,0.9)" }}>
                  COUNTRY
                </p>
                <p className="text-base font-bold leading-tight" style={{ color: "var(--text)" }}>
                  {selectedCountry.properties.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedCountry(null)}
                className="opacity-40 hover:opacity-80 text-sm"
                style={{ color: "var(--muted)" }}>✕</button>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              <div className="rounded-lg px-2 py-1.5"
                   style={{ background: "rgba(255,112,32,0.08)", border: "1px solid rgba(255,112,32,0.2)" }}>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Plastic zones nearby</p>
                <p className="text-sm font-bold" style={{ color: "#ff7020" }}>
                  {countryStats?.plasticCount ?? 0}
                  {(countryStats?.criticalPlastic ?? 0) > 0 && (
                    <span className="text-xs ml-1" style={{ color: "#ff3030" }}>
                      ({countryStats!.criticalPlastic} crit.)
                    </span>
                  )}
                </p>
              </div>
              <div className="rounded-lg px-2 py-1.5"
                   style={{ background: "rgba(255,0,128,0.08)", border: "1px solid rgba(255,0,128,0.2)" }}>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Bleaching events</p>
                <p className="text-sm font-bold" style={{ color: "#ff0080" }}>
                  {countryStats?.bleachCount ?? 0}
                </p>
              </div>
              <div className="rounded-lg px-2 py-1.5"
                   style={{ background: "rgba(255,153,48,0.08)", border: "1px solid rgba(255,153,48,0.2)" }}>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Avg SST anomaly</p>
                <p className="text-sm font-bold" style={{ color: "#ff9930" }}>
                  {countryStats?.avgTemp ? `+${countryStats.avgTemp}°C` : "—"}
                </p>
              </div>
              <div className="rounded-lg px-2 py-1.5"
                   style={{ background: "rgba(255,153,48,0.08)", border: "1px solid rgba(255,153,48,0.2)" }}>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Peak SST anomaly</p>
                <p className="text-sm font-bold" style={{ color: "#ff9930" }}>
                  {countryStats?.maxTemp ? `+${countryStats.maxTemp}°C` : "—"}
                </p>
              </div>
            </div>

            {/* Crisis level bar */}
            {countryStats && (countryStats.plasticCount > 0 || countryStats.bleachCount > 0 || countryStats.tempPts > 0) ? (
              <>
                <div className="h-1.5 rounded-full overflow-hidden mb-1"
                     style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div className="h-full rounded-full"
                       style={{
                         width: `${Math.min(100, ((countryStats.plasticCount * 8) + (countryStats.bleachCount * 12) + (countryStats.tempPts * 5)))}%`,
                         background: "linear-gradient(90deg, rgba(253,231,37,0.7), rgba(255,60,0,0.9))",
                       }} />
                </div>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Regional crisis indicators</p>
              </>
            ) : (
              <p className="text-xs" style={{ color: "var(--muted)" }}>No crisis data in this region's bounding area</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

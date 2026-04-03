"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import Link from "next/link"
import DeckGL from "@deck.gl/react"
import { _GlobeView, type MapViewState } from "@deck.gl/core"
import { ScatterplotLayer, ArcLayer, SolidPolygonLayer } from "@deck.gl/layers"

// ── Types ──────────────────────────────────────────────────────────────────────

interface Conflict {
  id: string
  name: string
  country: string
  lat: number
  lng: number
  type: "war" | "civil-war" | "insurgency" | "territorial" | "humanitarian-crisis"
  intensity: "high" | "medium" | "low"
  startYear: number
  casualties2024: number
  displaced: number
  parties: string[]
  status: "active" | "ceasefire" | "escalating"
}

interface DisplacementArc {
  id: string
  label: string
  originName: string
  destName: string
  originLng: number
  originLat: number
  destLng: number
  destLat: number
  displaced: number
}

// ── Colour constants ────────────────────────────────────────────────────────

const INTENSITY_COLORS: Record<string, [number, number, number, number]> = {
  high:   [255, 30,  30,  230],
  medium: [255, 140, 0,   210],
  low:    [255, 220, 80,  180],
}

const TYPE_COLORS: Record<string, [number, number, number, number]> = {
  "war":                 [220, 20,  60,  230],
  "civil-war":           [255, 80,  0,   220],
  "insurgency":          [255, 160, 0,   200],
  "territorial":         [100, 180, 255, 190],
  "humanitarian-crisis": [200, 100, 255, 200],
}

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  ceasefire: "Ceasefire",
  escalating: "Escalating",
}

const STATUS_COLORS: Record<string, string> = {
  active: "#ff8c00",
  ceasefire: "#22c55e",
  escalating: "#ff1e1e",
}

// ── Data: Active Conflicts ─────────────────────────────────────────────────

const CONFLICTS: Conflict[] = [
  {
    id: "ukraine-russia",
    name: "Ukraine-Russia War",
    country: "Ukraine",
    lat: 50.45, lng: 30.52,
    type: "war",
    intensity: "high",
    startYear: 2022,
    casualties2024: 50000,
    displaced: 10.0,
    parties: ["Ukraine Armed Forces", "Russian Federation Armed Forces"],
    status: "escalating",
  },
  {
    id: "gaza-israel",
    name: "Gaza-Israel War",
    country: "Palestine / Israel",
    lat: 31.50, lng: 34.47,
    type: "war",
    intensity: "high",
    startYear: 2023,
    casualties2024: 45000,
    displaced: 2.0,
    parties: ["Israel Defense Forces", "Hamas / Palestinian Islamic Jihad"],
    status: "active",
  },
  {
    id: "sudan-civil",
    name: "Sudan Civil War",
    country: "Sudan",
    lat: 15.55, lng: 32.53,
    type: "civil-war",
    intensity: "high",
    startYear: 2023,
    casualties2024: 20000,
    displaced: 8.0,
    parties: ["Sudanese Armed Forces (SAF)", "Rapid Support Forces (RSF)"],
    status: "active",
  },
  {
    id: "myanmar-civil",
    name: "Myanmar Civil War",
    country: "Myanmar",
    lat: 19.75, lng: 96.13,
    type: "civil-war",
    intensity: "high",
    startYear: 2021,
    casualties2024: 5000,
    displaced: 3.0,
    parties: ["Military Junta (SAC)", "People's Defence Force / Ethnic Armed Orgs"],
    status: "active",
  },
  {
    id: "drc-eastern",
    name: "DRC Eastern Conflict",
    country: "Democratic Republic of Congo",
    lat: -1.68, lng: 29.23,
    type: "civil-war",
    intensity: "high",
    startYear: 2022,
    casualties2024: 3000,
    displaced: 7.0,
    parties: ["FARDC", "M23 / Rwanda Defence Force"],
    status: "escalating",
  },
  {
    id: "ethiopia-amhara",
    name: "Ethiopia Amhara Conflict",
    country: "Ethiopia",
    lat: 11.59, lng: 37.39,
    type: "civil-war",
    intensity: "medium",
    startYear: 2023,
    casualties2024: 2000,
    displaced: 1.0,
    parties: ["Ethiopian National Defence Force", "Fano Amhara Militia"],
    status: "active",
  },
  {
    id: "somalia-alshabaab",
    name: "Somalia Al-Shabaab Insurgency",
    country: "Somalia",
    lat: 2.05, lng: 45.34,
    type: "insurgency",
    intensity: "medium",
    startYear: 2006,
    casualties2024: 2000,
    displaced: 3.0,
    parties: ["Somali National Army / AU Mission", "Al-Shabaab"],
    status: "active",
  },
  {
    id: "nigeria-boko",
    name: "Nigeria Boko Haram / ISWAP",
    country: "Nigeria",
    lat: 11.85, lng: 13.15,
    type: "insurgency",
    intensity: "medium",
    startYear: 2009,
    casualties2024: 1500,
    displaced: 2.0,
    parties: ["Nigerian Armed Forces / MNJTF", "Boko Haram / ISWAP"],
    status: "active",
  },
  {
    id: "mali-sahel",
    name: "Mali / Sahel Conflict",
    country: "Mali",
    lat: 12.65, lng: -8.00,
    type: "insurgency",
    intensity: "medium",
    startYear: 2012,
    casualties2024: 2000,
    displaced: 1.5,
    parties: ["Mali Armed Forces / Wagner Group", "JNIM / ISGS jihadist groups"],
    status: "active",
  },
  {
    id: "burkina-jihadist",
    name: "Burkina Faso Jihadist Conflict",
    country: "Burkina Faso",
    lat: 12.37, lng: -1.52,
    type: "insurgency",
    intensity: "high",
    startYear: 2015,
    casualties2024: 2500,
    displaced: 2.0,
    parties: ["Burkina Faso Armed Forces", "JNIM / Ansarul Islam"],
    status: "escalating",
  },
  {
    id: "haiti-crisis",
    name: "Haiti Gang Crisis",
    country: "Haiti",
    lat: 18.54, lng: -72.34,
    type: "humanitarian-crisis",
    intensity: "high",
    startYear: 2021,
    casualties2024: 3000,
    displaced: 0.7,
    parties: ["Haitian National Police / MSS", "Gang Coalition (Viv Ansanm)"],
    status: "active",
  },
  {
    id: "yemen-civil",
    name: "Yemen Civil War",
    country: "Yemen",
    lat: 15.35, lng: 44.21,
    type: "civil-war",
    intensity: "medium",
    startYear: 2014,
    casualties2024: 1000,
    displaced: 4.5,
    parties: ["Internationally Recognised Government / Saudi-led Coalition", "Houthi Movement (Ansar Allah)"],
    status: "ceasefire",
  },
  {
    id: "syria-war",
    name: "Syrian War (residual)",
    country: "Syria",
    lat: 33.51, lng: 36.29,
    type: "civil-war",
    intensity: "medium",
    startYear: 2011,
    casualties2024: 500,
    displaced: 7.0,
    parties: ["Syrian Democratic Forces / Hayat Tahrir al-Sham", "Syrian Government remnants / Iran-backed groups"],
    status: "active",
  },
  {
    id: "iraq-isis",
    name: "Iraq / Syria ISIS Remnants",
    country: "Iraq",
    lat: 33.34, lng: 44.36,
    type: "insurgency",
    intensity: "low",
    startYear: 2013,
    casualties2024: 300,
    displaced: 1.0,
    parties: ["Iraqi Security Forces / SDF", "ISIS remnants"],
    status: "active",
  },
  {
    id: "libya-conflict",
    name: "Libya Conflict",
    country: "Libya",
    lat: 32.90, lng: 13.19,
    type: "civil-war",
    intensity: "low",
    startYear: 2014,
    casualties2024: 200,
    displaced: 0.15,
    parties: ["GNU (Tripoli)", "LNA (Cyrenaica)"],
    status: "active",
  },
  {
    id: "karabakh",
    name: "Nagorno-Karabakh Aftermath",
    country: "Armenia / Azerbaijan",
    lat: 40.18, lng: 44.50,
    type: "territorial",
    intensity: "low",
    startYear: 2020,
    casualties2024: 0,
    displaced: 0.1,
    parties: ["Armenia", "Azerbaijan"],
    status: "ceasefire",
  },
  {
    id: "kosovo-serbia",
    name: "Kosovo-Serbia Tensions",
    country: "Kosovo / Serbia",
    lat: 42.67, lng: 21.17,
    type: "territorial",
    intensity: "low",
    startYear: 2022,
    casualties2024: 0,
    displaced: 0,
    parties: ["Kosovo Government / KFOR", "Serbia"],
    status: "active",
  },
  {
    id: "taiwan-strait",
    name: "Taiwan Strait Tensions",
    country: "Taiwan",
    lat: 25.03, lng: 121.56,
    type: "territorial",
    intensity: "medium",
    startYear: 2022,
    casualties2024: 0,
    displaced: 0,
    parties: ["Taiwan (ROC)", "China (PRC)"],
    status: "escalating",
  },
  {
    id: "south-china-sea",
    name: "South China Sea Disputes",
    country: "South China Sea",
    lat: 10.22, lng: 114.42,
    type: "territorial",
    intensity: "medium",
    startYear: 2012,
    casualties2024: 0,
    displaced: 0,
    parties: ["Philippines / Vietnam / Malaysia", "China (PRC)"],
    status: "escalating",
  },
  {
    id: "niger-junta",
    name: "Niger Junta / Sahel Crisis",
    country: "Niger",
    lat: 13.51, lng: 2.12,
    type: "humanitarian-crisis",
    intensity: "medium",
    startYear: 2023,
    casualties2024: 500,
    displaced: 0.5,
    parties: ["Military Junta (CNSP)", "Jihadist insurgents / civil society"],
    status: "active",
  },
  {
    id: "car",
    name: "Central African Republic",
    country: "Central African Republic",
    lat: 4.36, lng: 18.56,
    type: "civil-war",
    intensity: "low",
    startYear: 2012,
    casualties2024: 300,
    displaced: 1.0,
    parties: ["FACA / Wagner Group", "Coalition of Rebels (CPC)"],
    status: "active",
  },
  {
    id: "mozambique-cabo",
    name: "Mozambique Cabo Delgado",
    country: "Mozambique",
    lat: -13.03, lng: 40.52,
    type: "insurgency",
    intensity: "medium",
    startYear: 2017,
    casualties2024: 500,
    displaced: 1.0,
    parties: ["Mozambique Armed Forces / SADC Mission", "Ansar al-Sunna (al-Shabaab local)"],
    status: "active",
  },
  {
    id: "pak-afghan",
    name: "Pakistan-Afghanistan Border",
    country: "Pakistan",
    lat: 34.01, lng: 71.54,
    type: "insurgency",
    intensity: "low",
    startYear: 2001,
    casualties2024: 200,
    displaced: 0.5,
    parties: ["Pakistan Army", "TTP (Tehrik-i-Taliban Pakistan)"],
    status: "active",
  },
  {
    id: "kashmir",
    name: "India-Pakistan Kashmir",
    country: "India / Pakistan",
    lat: 34.08, lng: 74.80,
    type: "territorial",
    intensity: "low",
    startYear: 1947,
    casualties2024: 100,
    displaced: 0,
    parties: ["India", "Pakistan"],
    status: "active",
  },
]

// ── Data: Displacement Arcs ────────────────────────────────────────────────

const DISPLACEMENT_ARCS: DisplacementArc[] = [
  { id: "ukr-pol", label: "Ukraine → Poland",         originName: "Ukraine",         destName: "Poland",      originLng: 30.52, originLat: 50.45, destLng: 21.01, destLat: 52.23, displaced: 1500000 },
  { id: "ukr-deu", label: "Ukraine → Germany",        originName: "Ukraine",         destName: "Germany",     originLng: 30.52, originLat: 50.45, destLng: 13.40, destLat: 52.52, displaced: 1100000 },
  { id: "syr-tur", label: "Syria → Turkey",           originName: "Syria",           destName: "Turkey",      originLng: 36.29, originLat: 33.51, destLng: 32.86, destLat: 39.93, displaced: 3500000 },
  { id: "syr-lbn", label: "Syria → Lebanon",          originName: "Syria",           destName: "Lebanon",     originLng: 36.29, originLat: 33.51, destLng: 35.50, destLat: 33.89, displaced: 1500000 },
  { id: "afg-pak", label: "Afghanistan → Pakistan",   originName: "Afghanistan",     destName: "Pakistan",    originLng: 69.17, originLat: 34.53, destLng: 67.01, destLat: 24.86, displaced: 1700000 },
  { id: "sud-egy", label: "Sudan → Egypt",            originName: "Sudan",           destName: "Egypt",       originLng: 32.53, originLat: 15.55, destLng: 31.25, destLat: 30.06, displaced: 600000  },
  { id: "sud-chad", label: "Sudan → Chad",            originName: "Sudan",           destName: "Chad",        originLng: 32.53, originLat: 15.55, destLng: 15.04, destLat: 12.35, displaced: 700000  },
  { id: "mya-bgd", label: "Myanmar → Bangladesh",    originName: "Myanmar",         destName: "Bangladesh",  originLng: 96.13, originLat: 19.75, destLng: 90.35, destLat: 23.68, displaced: 900000  },
  { id: "som-eth", label: "Somalia → Ethiopia",       originName: "Somalia",         destName: "Ethiopia",    originLng: 45.34, originLat: 2.05,  destLng: 38.74, destLat: 9.03,  displaced: 400000  },
  { id: "drc-uga", label: "DRC → Uganda",             originName: "DRC",             destName: "Uganda",      originLng: 29.23, originLat: -1.68, destLng: 32.58, destLat: 0.32,  displaced: 400000  },
  { id: "ven-col", label: "Venezuela → Colombia",     originName: "Venezuela",       destName: "Colombia",    originLng: -66.88, originLat: 10.48, destLng: -74.08, destLat: 4.71, displaced: 2400000 },
  { id: "cam-mex", label: "Central America → Mexico", originName: "Guatemala",       destName: "Mexico",      originLng: -90.52, originLat: 14.64, destLng: -99.13, destLat: 19.43, displaced: 1000000 },
  { id: "sal-eur", label: "Sahel → Mediterranean (EU)", originName: "Mali",          destName: "Tunisia",     originLng: -8.00,  originLat: 12.65, destLng: 9.19,  destLat: 38.11, displaced: 250000  },
  { id: "drc-rwa", label: "DRC → Rwanda",             originName: "DRC",             destName: "Rwanda",      originLng: 29.23, originLat: -1.68, destLng: 30.06, destLat: -1.94, displaced: 100000  },
  { id: "som-ken", label: "Somalia → Kenya",          originName: "Somalia",         destName: "Kenya",       originLng: 45.34, originLat: 2.05,  destLng: 36.82, destLat: -1.29, displaced: 300000  },
  { id: "moz-mwi", label: "Mozambique → Malawi",      originName: "Mozambique",      destName: "Malawi",      originLng: 40.52, originLat: -13.03, destLng: 34.30, destLat: -13.97, displaced: 50000  },
  { id: "eth-sud", label: "Ethiopia → Sudan",         originName: "Ethiopia",        destName: "Sudan",       originLng: 38.74, originLat: 9.03,  destLng: 32.53, destLat: 15.55, displaced: 50000   },
  { id: "yem-dji", label: "Yemen → Djibouti",         originName: "Yemen",           destName: "Djibouti",    originLng: 44.21, originLat: 15.35, destLng: 43.15, destLat: 11.83, displaced: 30000   },
  { id: "irq-jor", label: "Iraq → Jordan",            originName: "Iraq",            destName: "Jordan",      originLng: 44.36, originLat: 33.34, destLng: 36.24, destLat: 31.57, displaced: 200000  },
  { id: "ukr-cze", label: "Ukraine → Czech Republic", originName: "Ukraine",         destName: "Czech Republic", originLng: 30.52, originLat: 50.45, destLng: 14.47, destLat: 50.08, displaced: 380000 },
  { id: "ukr-ita", label: "Ukraine → Italy",          originName: "Ukraine",         destName: "Italy",       originLng: 30.52, originLat: 50.45, destLng: 12.57, destLat: 41.90, displaced: 170000  },
  { id: "bfa-mli", label: "Burkina Faso → Mali",      originName: "Burkina Faso",    destName: "Mali",        originLng: -1.52, originLat: 12.37, destLng: -8.00, destLat: 12.65, displaced: 40000   },
  { id: "ven-bra", label: "Venezuela → Brazil",       originName: "Venezuela",       destName: "Brazil",      originLng: -66.88, originLat: 10.48, destLng: -60.02, destLat: 2.82, displaced: 500000  },
  { id: "afg-irn", label: "Afghanistan → Iran",       originName: "Afghanistan",     destName: "Iran",        originLng: 69.17, originLat: 34.53, destLng: 51.39, destLat: 35.69, displaced: 800000  },
  { id: "syr-jor", label: "Syria → Jordan",           originName: "Syria",           destName: "Jordan",      originLng: 36.29, originLat: 33.51, destLng: 36.24, destLat: 31.57, displaced: 660000  },
]

// ── Globe earth polygon ────────────────────────────────────────────────────

const EARTH_POLYGON = [[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]]

// ── Helper: scale radius ───────────────────────────────────────────────────

function displacedToRadius(displaced: number): number {
  if (displaced <= 0) return 60000
  const base = 80000
  const scale = Math.pow(displaced, 0.45)
  return Math.min(base * scale, 1200000)
}

function arcWidth(displaced: number): number {
  if (displaced >= 2000000) return 4
  if (displaced >= 1000000) return 3
  if (displaced >= 500000)  return 2
  return 1
}

// ── Format helpers ─────────────────────────────────────────────────────────

function fmtDisplaced(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${Math.round(n / 1000)}K`
  return n.toString()
}

function fmtCasualties(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1000).toFixed(0)}K+`
  return `${n}+`
}

// ── Component ─────────────────────────────────────────────────────────────

type ConflictType = Conflict["type"] | "all"
type IntensityType = Conflict["intensity"] | "all"

export default function UC27Page() {
  const [viewState, setViewState] = useState<MapViewState>({
    longitude: 30,
    latitude: 15,
    zoom: 1.6,
  })

  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null)
  const [hoveredConflict, setHoveredConflict] = useState<Conflict | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)
  const [typeFilter, setTypeFilter] = useState<ConflictType>("all")
  const [intensityFilter, setIntensityFilter] = useState<IntensityType>("all")
  const [pulse, setPulse] = useState(0)
  const animRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)

  // Pulsing animation using requestAnimationFrame (time-based, not every frame draw)
  useEffect(() => {
    let id: number
    const animate = (time: number) => {
      if (time - lastTimeRef.current > 50) {
        lastTimeRef.current = time
        setPulse(t => (t + 0.04) % (Math.PI * 2))
      }
      id = requestAnimationFrame(animate)
    }
    id = requestAnimationFrame(animate)
    animRef.current = id
    return () => cancelAnimationFrame(id)
  }, [])

  // Derived: filtered conflicts
  const filteredConflicts = useMemo(() => {
    return CONFLICTS.filter(c => {
      if (typeFilter !== "all" && c.type !== typeFilter) return false
      if (intensityFilter !== "all" && c.intensity !== intensityFilter) return false
      return true
    })
  }, [typeFilter, intensityFilter])

  // Derived: stats
  const totalDisplaced = useMemo(() =>
    CONFLICTS.reduce((s, c) => s + c.displaced, 0), [])
  const totalCasualties2024 = useMemo(() =>
    CONFLICTS.reduce((s, c) => s + c.casualties2024, 0), [])
  const activeCount = CONFLICTS.filter(c => c.status !== "ceasefire").length
  const escalatingCount = CONFLICTS.filter(c => c.status === "escalating").length

  // Derived: top 5 crises by displaced
  const topCrises = useMemo(() =>
    [...CONFLICTS].sort((a, b) => b.displaced - a.displaced).slice(0, 5), [])

  // Pulse factor: oscillates between 0.75 and 1.25
  const pulseFactor = 0.85 + 0.4 * Math.abs(Math.sin(pulse))

  // Layers
  const layers = useMemo(() => {
    // Earth background
    const earthLayer = new SolidPolygonLayer({
      id: "earth-bg",
      data: [{ contour: EARTH_POLYGON }],
      getPolygon: (d: any) => d.contour,
      getFillColor: [8, 14, 28, 255],
      stroked: false,
      filled: true,
    })

    // Displacement arcs
    const arcLayer = new ArcLayer<DisplacementArc>({
      id: "displacement-arcs",
      data: DISPLACEMENT_ARCS,
      getSourcePosition: d => [d.originLng, d.originLat],
      getTargetPosition: d => [d.destLng, d.destLat],
      getSourceColor: [255, 120, 0, 160],
      getTargetColor: [220, 30, 30, 200],
      getWidth: d => arcWidth(d.displaced),
      greatCircle: true,
      widthUnits: "pixels",
      widthMinPixels: 1,
      widthMaxPixels: 5,
      pickable: false,
    })

    // Conflict scatterplot
    const scatterLayer = new ScatterplotLayer<Conflict>({
      id: "conflicts",
      data: filteredConflicts,
      getPosition: d => [d.lng, d.lat],
      getRadius: d => displacedToRadius(d.displaced) * pulseFactor,
      getFillColor: d => {
        const base = INTENSITY_COLORS[d.intensity]
        if (selectedConflict?.id === d.id) return [255, 255, 255, 240]
        return base
      },
      getLineColor: d => {
        if (selectedConflict?.id === d.id) return [255, 255, 255, 255]
        if (d.status === "escalating") return [255, 30, 30, 200]
        return [0, 0, 0, 0]
      },
      lineWidthMinPixels: 1.5,
      stroked: true,
      filled: true,
      radiusMinPixels: 4,
      radiusMaxPixels: 40,
      radiusUnits: "meters",
      pickable: true,
      autoHighlight: false,
      onClick: ({ object }) => {
        if (object) {
          setSelectedConflict(prev => prev?.id === object.id ? null : object)
        }
      },
      onHover: ({ object, x, y }) => {
        if (object) {
          setHoveredConflict(object)
          setTooltipPos({ x, y })
        } else {
          setHoveredConflict(null)
          setTooltipPos(null)
        }
      },
    })

    return [earthLayer, arcLayer, scatterLayer]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredConflicts, selectedConflict, pulseFactor])

  const handleViewStateChange = useCallback(({ viewState: vs }: { viewState: MapViewState }) => {
    setViewState(vs)
  }, [])

  const TYPE_OPTIONS: { key: ConflictType; label: string }[] = [
    { key: "all",                  label: "All Types" },
    { key: "war",                  label: "War" },
    { key: "civil-war",            label: "Civil War" },
    { key: "insurgency",           label: "Insurgency" },
    { key: "territorial",          label: "Territorial" },
    { key: "humanitarian-crisis",  label: "Humanitarian" },
  ]

  const INTENSITY_OPTIONS: { key: IntensityType; label: string }[] = [
    { key: "all",    label: "All" },
    { key: "high",   label: "High" },
    { key: "medium", label: "Medium" },
    { key: "low",    label: "Low" },
  ]

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", background: "#04080f", overflow: "hidden" }}>

      {/* DeckGL Globe */}
      <DeckGL
        views={new _GlobeView({ id: "globe", resolution: 5 })}
        viewState={viewState}
        onViewStateChange={handleViewStateChange as any}
        controller={true}
        layers={layers}
        style={{ position: "absolute", inset: "0" }}
        parameters={{ clearColor: [0.016, 0.031, 0.059, 1] } as any}
      />

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        pointerEvents: "none",
        zIndex: 10,
      }}>
        {/* URGENT banner */}
        <div style={{
          background: "rgba(180, 20, 20, 0.92)",
          backdropFilter: "blur(8px)",
          padding: "7px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          borderBottom: "1px solid rgba(255,50,50,0.4)",
        }}>
          <span style={{
            fontSize: "9px", fontWeight: 800, letterSpacing: "0.15em",
            color: "#fff", opacity: 0.7,
          }}>UNHCR 2024</span>
          <span style={{ width: 1, height: 12, background: "rgba(255,255,255,0.3)" }} />
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#fff", letterSpacing: "0.03em" }}>
            117 million people forcibly displaced globally — a new UNHCR record
          </span>
        </div>

        {/* Title row */}
        <div style={{
          padding: "14px 18px 0",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "16px",
        }}>
          {/* Left: title + stats */}
          <div style={{ pointerEvents: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
              <span style={{
                fontSize: "10px", fontWeight: 700, letterSpacing: "0.13em",
                padding: "3px 10px", borderRadius: "4px",
                background: "rgba(180,20,20,0.3)", color: "#ff6666",
                border: "1px solid rgba(220,50,50,0.3)",
              }}>
                UC27 · GLOBAL CONFLICT MONITOR
              </span>
              <Link href="/uc27/details" style={{
                fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em",
                padding: "3px 9px", borderRadius: "4px",
                background: "rgba(51,204,221,0.1)", color: "var(--accent)",
                border: "1px solid rgba(51,204,221,0.2)",
                textDecoration: "none",
              }}>
                Details →
              </Link>
            </div>
            <h1 style={{
              fontSize: "26px", fontWeight: 800, color: "#f0f0f0",
              margin: "0 0 3px", letterSpacing: "-0.02em", lineHeight: 1.1,
            }}>
              Global Conflict Monitor
            </h1>
            <p style={{ fontSize: "12px", color: "#888", margin: "0 0 12px" }}>
              2025 · Active Conflicts &amp; Displacement
            </p>

            {/* Stats chips */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {[
                { label: "Active Conflicts", value: String(activeCount), color: "#ff8c00" },
                { label: "Escalating",       value: String(escalatingCount), color: "#ff1e1e" },
                { label: "Total Displaced",  value: `${totalDisplaced.toFixed(1)}M`, color: "#c084fc" },
                { label: "2024 Casualties",  value: fmtCasualties(totalCasualties2024), color: "#f87171" },
              ].map(s => (
                <div key={s.label} style={{
                  padding: "6px 12px", borderRadius: "8px",
                  background: "rgba(0,0,0,0.65)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(10px)",
                }}>
                  <div style={{ fontSize: "9px", color: "#666", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "2px" }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: s.color, lineHeight: 1 }}>
                    {s.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: top 5 crises leaderboard */}
          <div style={{
            pointerEvents: "auto",
            minWidth: 240, maxWidth: 280,
            background: "rgba(0,0,0,0.72)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px",
            backdropFilter: "blur(14px)",
            padding: "12px 14px",
          }}>
            <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", color: "#888", marginBottom: "10px", textTransform: "uppercase" }}>
              Top 5 Crises by Displaced
            </div>
            {topCrises.map((c, i) => (
              <button
                key={c.id}
                onClick={() => setSelectedConflict(prev => prev?.id === c.id ? null : c)}
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  width: "100%", textAlign: "left",
                  padding: "5px 6px", borderRadius: "6px",
                  border: selectedConflict?.id === c.id
                    ? "1px solid rgba(255,255,255,0.2)"
                    : "1px solid transparent",
                  background: selectedConflict?.id === c.id
                    ? "rgba(255,255,255,0.07)"
                    : "transparent",
                  cursor: "pointer",
                  marginBottom: "2px",
                  transition: "all 0.12s",
                }}
              >
                <span style={{
                  fontSize: "11px", fontWeight: 700, fontFamily: "monospace",
                  color: i === 0 ? "#ff4444" : i === 1 ? "#ff7700" : "#aaa",
                  width: 16, flexShrink: 0,
                }}>
                  {i + 1}
                </span>
                <span style={{ flex: 1, fontSize: "11px", color: "#e0e0e0", fontWeight: 500, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.name}
                </span>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#c084fc", flexShrink: 0 }}>
                  {c.displaced >= 1 ? `${c.displaced.toFixed(1)}M` : `${Math.round(c.displaced * 1000)}K`}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom-left: filters ────────────────────────────────── */}
      <div style={{
        position: "absolute", bottom: 28, left: 16,
        zIndex: 10, pointerEvents: "auto",
        display: "flex", flexDirection: "column", gap: "8px",
      }}>
        {/* Type filter */}
        <div style={{
          background: "rgba(0,0,0,0.72)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "10px",
          backdropFilter: "blur(14px)",
          padding: "10px 12px",
        }}>
          <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", color: "#888", marginBottom: "8px", textTransform: "uppercase" }}>
            Conflict Type
          </div>
          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
            {TYPE_OPTIONS.map(opt => {
              const active = typeFilter === opt.key
              const color = opt.key !== "all" ? `rgba(${TYPE_COLORS[opt.key]?.slice(0,3).join(",")},1)` : "#33ccdd"
              return (
                <button
                  key={opt.key}
                  onClick={() => setTypeFilter(opt.key)}
                  style={{
                    padding: "3px 9px", borderRadius: "5px", fontSize: "10px",
                    fontWeight: 600, cursor: "pointer", transition: "all 0.12s",
                    border: active ? `1px solid ${color}` : "1px solid rgba(255,255,255,0.1)",
                    background: active ? `rgba(${TYPE_COLORS[opt.key as string]?.slice(0,3).join(",") ?? "51,204,221"},0.15)` : "transparent",
                    color: active ? color : "#666",
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Intensity filter */}
        <div style={{
          background: "rgba(0,0,0,0.72)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "10px",
          backdropFilter: "blur(14px)",
          padding: "10px 12px",
        }}>
          <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", color: "#888", marginBottom: "8px", textTransform: "uppercase" }}>
            Intensity
          </div>
          <div style={{ display: "flex", gap: "5px" }}>
            {INTENSITY_OPTIONS.map(opt => {
              const active = intensityFilter === opt.key
              const ic = opt.key !== "all" ? INTENSITY_COLORS[opt.key] : null
              const color = ic ? `rgb(${ic[0]},${ic[1]},${ic[2]})` : "#33ccdd"
              return (
                <button
                  key={opt.key}
                  onClick={() => setIntensityFilter(opt.key)}
                  style={{
                    padding: "3px 10px", borderRadius: "5px", fontSize: "10px",
                    fontWeight: 600, cursor: "pointer", transition: "all 0.12s",
                    border: active ? `1px solid ${color}` : "1px solid rgba(255,255,255,0.1)",
                    background: active ? `rgba(${ic ? ic.slice(0,3).join(",") : "51,204,221"},0.15)` : "transparent",
                    color: active ? color : "#666",
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div style={{
          background: "rgba(0,0,0,0.72)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "10px",
          backdropFilter: "blur(14px)",
          padding: "10px 12px",
        }}>
          <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", color: "#888", marginBottom: "8px", textTransform: "uppercase" }}>
            Legend
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            {[
              { color: "#ff1e1e", label: "High intensity conflict" },
              { color: "#ff8c00", label: "Medium intensity" },
              { color: "#ffdc50", label: "Low intensity" },
              { color: "rgba(255,120,0,0.7)", label: "Displacement flow arc", dashed: true },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                {item.dashed ? (
                  <div style={{ width: 18, height: 2, background: item.color, borderRadius: 1 }} />
                ) : (
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
                )}
                <span style={{ fontSize: "10px", color: "#888" }}>{item.label}</span>
              </div>
            ))}
            <div style={{ marginTop: "4px", fontSize: "9px", color: "#555" }}>
              Dot size ∝ displaced population
            </div>
          </div>
        </div>

        {/* Data attribution */}
        <div style={{ fontSize: "9px", color: "#444", paddingLeft: "4px" }}>
          Data: ACLED, UNHCR, OCHA 2024-2025
        </div>
      </div>

      {/* ── Bottom-right: selected conflict details ─────────────── */}
      {selectedConflict && (
        <div style={{
          position: "absolute", bottom: 28, right: 16,
          zIndex: 10, pointerEvents: "auto",
          width: 280,
        }}>
          <div style={{
            background: "rgba(0,0,0,0.88)",
            border: `1px solid rgba(${INTENSITY_COLORS[selectedConflict.intensity].slice(0,3).join(",")},0.5)`,
            borderRadius: "12px",
            backdropFilter: "blur(16px)",
            padding: "14px 16px",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "10px" }}>
              <div style={{ flex: 1, minWidth: 0, paddingRight: "8px" }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#f0f0f0", lineHeight: 1.3, marginBottom: "4px" }}>
                  {selectedConflict.name}
                </div>
                <div style={{ fontSize: "10px", color: "#888" }}>
                  {selectedConflict.country}
                </div>
              </div>
              <button
                onClick={() => setSelectedConflict(null)}
                style={{
                  background: "transparent", border: "none",
                  color: "#555", cursor: "pointer", fontSize: "14px",
                  padding: "0", lineHeight: 1, flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>

            {/* Status + intensity badges */}
            <div style={{ display: "flex", gap: "6px", marginBottom: "12px", flexWrap: "wrap" }}>
              <span style={{
                padding: "2px 8px", borderRadius: "4px", fontSize: "9px", fontWeight: 700,
                background: `rgba(${INTENSITY_COLORS[selectedConflict.intensity].slice(0,3).join(",")},0.2)`,
                color: `rgb(${INTENSITY_COLORS[selectedConflict.intensity].slice(0,3).join(",")})`,
                border: `1px solid rgba(${INTENSITY_COLORS[selectedConflict.intensity].slice(0,3).join(",")},0.3)`,
                letterSpacing: "0.08em",
              }}>
                {selectedConflict.intensity.toUpperCase()}
              </span>
              <span style={{
                padding: "2px 8px", borderRadius: "4px", fontSize: "9px", fontWeight: 700,
                background: `rgba(${TYPE_COLORS[selectedConflict.type].slice(0,3).join(",")},0.2)`,
                color: `rgb(${TYPE_COLORS[selectedConflict.type].slice(0,3).join(",")})`,
                border: `1px solid rgba(${TYPE_COLORS[selectedConflict.type].slice(0,3).join(",")},0.3)`,
                letterSpacing: "0.08em",
              }}>
                {selectedConflict.type.toUpperCase()}
              </span>
              <span style={{
                padding: "2px 8px", borderRadius: "4px", fontSize: "9px", fontWeight: 700,
                background: "rgba(255,255,255,0.06)",
                color: STATUS_COLORS[selectedConflict.status],
                border: "1px solid rgba(255,255,255,0.08)",
                letterSpacing: "0.08em",
              }}>
                {STATUS_LABELS[selectedConflict.status].toUpperCase()}
              </span>
            </div>

            {/* Metrics grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "12px" }}>
              {[
                { label: "Displaced",        value: selectedConflict.displaced >= 1 ? `${selectedConflict.displaced.toFixed(1)}M` : selectedConflict.displaced > 0 ? `${Math.round(selectedConflict.displaced * 1000)}K` : "—", color: "#c084fc" },
                { label: "2024 Casualties",  value: selectedConflict.casualties2024 > 0 ? fmtCasualties(selectedConflict.casualties2024) : "—", color: "#f87171" },
                { label: "Conflict Onset",   value: String(selectedConflict.startYear), color: "#94a3b8" },
                { label: "Status",           value: STATUS_LABELS[selectedConflict.status], color: STATUS_COLORS[selectedConflict.status] },
              ].map(m => (
                <div key={m.label} style={{
                  padding: "7px 9px", borderRadius: "7px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <div style={{ fontSize: "9px", color: "#666", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                    {m.label}
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: m.color }}>
                    {m.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Parties */}
            <div style={{
              padding: "8px 10px", borderRadius: "7px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <div style={{ fontSize: "9px", fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "5px" }}>
                Principal Parties
              </div>
              {selectedConflict.parties.map((p, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: "5px",
                  marginBottom: i < selectedConflict.parties.length - 1 ? "4px" : 0,
                }}>
                  <span style={{ color: "#444", fontSize: "10px", flexShrink: 0, marginTop: "1px" }}>
                    {i === 0 ? "▸" : "▸"}
                  </span>
                  <span style={{ fontSize: "10px", color: "#aaa", lineHeight: 1.4 }}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Hover tooltip ──────────────────────────────────────── */}
      {hoveredConflict && tooltipPos && !selectedConflict && (
        <div
          style={{
            position: "fixed",
            left: tooltipPos.x + 14,
            top: tooltipPos.y - 10,
            zIndex: 50,
            pointerEvents: "none",
            padding: "8px 12px",
            borderRadius: "8px",
            background: "rgba(0,0,0,0.88)",
            border: `1px solid rgba(${INTENSITY_COLORS[hoveredConflict.intensity].slice(0,3).join(",")},0.4)`,
            backdropFilter: "blur(10px)",
            minWidth: 160,
          }}
        >
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#f0f0f0", marginBottom: "3px" }}>
            {hoveredConflict.name}
          </div>
          <div style={{ fontSize: "10px", color: "#888", marginBottom: "5px" }}>{hoveredConflict.country}</div>
          <div style={{ display: "flex", gap: "8px", fontSize: "10px" }}>
            <span style={{ color: "#c084fc" }}>
              {hoveredConflict.displaced >= 1
                ? `${hoveredConflict.displaced.toFixed(1)}M displaced`
                : hoveredConflict.displaced > 0
                  ? `${Math.round(hoveredConflict.displaced * 1000)}K displaced`
                  : "0 displaced"}
            </span>
            {hoveredConflict.casualties2024 > 0 && (
              <span style={{ color: "#f87171" }}>
                {fmtCasualties(hoveredConflict.casualties2024)} cas.
              </span>
            )}
          </div>
          <div style={{ fontSize: "9px", color: "#555", marginTop: "3px" }}>
            Click for details
          </div>
        </div>
      )}

      {/* ── Filtered count badge ───────────────────────────────── */}
      {(typeFilter !== "all" || intensityFilter !== "all") && (
        <div style={{
          position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)",
          zIndex: 10, pointerEvents: "none",
          background: "rgba(0,0,0,0.75)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "20px",
          backdropFilter: "blur(10px)",
          padding: "5px 14px",
          fontSize: "11px", color: "#888",
        }}>
          Showing <span style={{ color: "#f0f0f0", fontWeight: 700 }}>{filteredConflicts.length}</span> of{" "}
          <span style={{ color: "#f0f0f0", fontWeight: 700 }}>{CONFLICTS.length}</span> conflicts
        </div>
      )}
    </div>
  )
}

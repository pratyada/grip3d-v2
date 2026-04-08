"use client"

import { useEffect, useRef, useState, useMemo, useCallback } from "react"
import Link from "next/link"
import { disposeGlobe } from "@/lib/globe-cleanup"

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

interface CountryFeature {
  type: "Feature"
  id: string
  properties: { name: string }
  geometry: any
}

type ConflictType  = Conflict["type"] | "all"
type IntensityType = Conflict["intensity"] | "all"

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
  { id: "ukr-pol", label: "Ukraine → Poland",             originName: "Ukraine",     destName: "Poland",          originLng: 30.52,  originLat: 50.45, destLng: 21.01,  destLat: 52.23,  displaced: 1500000 },
  { id: "ukr-deu", label: "Ukraine → Germany",            originName: "Ukraine",     destName: "Germany",         originLng: 30.52,  originLat: 50.45, destLng: 13.40,  destLat: 52.52,  displaced: 1100000 },
  { id: "syr-tur", label: "Syria → Turkey",               originName: "Syria",       destName: "Turkey",          originLng: 36.29,  originLat: 33.51, destLng: 32.86,  destLat: 39.93,  displaced: 3500000 },
  { id: "syr-lbn", label: "Syria → Lebanon",              originName: "Syria",       destName: "Lebanon",         originLng: 36.29,  originLat: 33.51, destLng: 35.50,  destLat: 33.89,  displaced: 1500000 },
  { id: "afg-pak", label: "Afghanistan → Pakistan",       originName: "Afghanistan", destName: "Pakistan",        originLng: 69.17,  originLat: 34.53, destLng: 67.01,  destLat: 24.86,  displaced: 1700000 },
  { id: "sud-egy", label: "Sudan → Egypt",                originName: "Sudan",       destName: "Egypt",           originLng: 32.53,  originLat: 15.55, destLng: 31.25,  destLat: 30.06,  displaced: 600000  },
  { id: "sud-chad", label: "Sudan → Chad",                originName: "Sudan",       destName: "Chad",            originLng: 32.53,  originLat: 15.55, destLng: 15.04,  destLat: 12.35,  displaced: 700000  },
  { id: "mya-bgd", label: "Myanmar → Bangladesh",         originName: "Myanmar",     destName: "Bangladesh",      originLng: 96.13,  originLat: 19.75, destLng: 90.35,  destLat: 23.68,  displaced: 900000  },
  { id: "som-eth", label: "Somalia → Ethiopia",           originName: "Somalia",     destName: "Ethiopia",        originLng: 45.34,  originLat: 2.05,  destLng: 38.74,  destLat: 9.03,   displaced: 400000  },
  { id: "drc-uga", label: "DRC → Uganda",                 originName: "DRC",         destName: "Uganda",          originLng: 29.23,  originLat: -1.68, destLng: 32.58,  destLat: 0.32,   displaced: 400000  },
  { id: "ven-col", label: "Venezuela → Colombia",         originName: "Venezuela",   destName: "Colombia",        originLng: -66.88, originLat: 10.48, destLng: -74.08, destLat: 4.71,   displaced: 2400000 },
  { id: "cam-mex", label: "Central America → Mexico",     originName: "Guatemala",   destName: "Mexico",          originLng: -90.52, originLat: 14.64, destLng: -99.13, destLat: 19.43,  displaced: 1000000 },
  { id: "sal-eur", label: "Sahel → Mediterranean (EU)",   originName: "Mali",        destName: "Tunisia",         originLng: -8.00,  originLat: 12.65, destLng: 9.19,   destLat: 38.11,  displaced: 250000  },
  { id: "drc-rwa", label: "DRC → Rwanda",                 originName: "DRC",         destName: "Rwanda",          originLng: 29.23,  originLat: -1.68, destLng: 30.06,  destLat: -1.94,  displaced: 100000  },
  { id: "som-ken", label: "Somalia → Kenya",              originName: "Somalia",     destName: "Kenya",           originLng: 45.34,  originLat: 2.05,  destLng: 36.82,  destLat: -1.29,  displaced: 300000  },
  { id: "moz-mwi", label: "Mozambique → Malawi",          originName: "Mozambique",  destName: "Malawi",          originLng: 40.52,  originLat: -13.03, destLng: 34.30, destLat: -13.97, displaced: 50000   },
  { id: "eth-sud", label: "Ethiopia → Sudan",             originName: "Ethiopia",    destName: "Sudan",           originLng: 38.74,  originLat: 9.03,  destLng: 32.53,  destLat: 15.55,  displaced: 50000   },
  { id: "yem-dji", label: "Yemen → Djibouti",             originName: "Yemen",       destName: "Djibouti",        originLng: 44.21,  originLat: 15.35, destLng: 43.15,  destLat: 11.83,  displaced: 30000   },
  { id: "irq-jor", label: "Iraq → Jordan",                originName: "Iraq",        destName: "Jordan",          originLng: 44.36,  originLat: 33.34, destLng: 36.24,  destLat: 31.57,  displaced: 200000  },
  { id: "ukr-cze", label: "Ukraine → Czech Republic",     originName: "Ukraine",     destName: "Czech Republic",  originLng: 30.52,  originLat: 50.45, destLng: 14.47,  destLat: 50.08,  displaced: 380000  },
  { id: "ukr-ita", label: "Ukraine → Italy",              originName: "Ukraine",     destName: "Italy",           originLng: 30.52,  originLat: 50.45, destLng: 12.57,  destLat: 41.90,  displaced: 170000  },
  { id: "bfa-mli", label: "Burkina Faso → Mali",          originName: "Burkina Faso", destName: "Mali",           originLng: -1.52,  originLat: 12.37, destLng: -8.00,  destLat: 12.65,  displaced: 40000   },
  { id: "ven-bra", label: "Venezuela → Brazil",           originName: "Venezuela",   destName: "Brazil",          originLng: -66.88, originLat: 10.48, destLng: -60.02, destLat: 2.82,   displaced: 500000  },
  { id: "afg-irn", label: "Afghanistan → Iran",           originName: "Afghanistan", destName: "Iran",            originLng: 69.17,  originLat: 34.53, destLng: 51.39,  destLat: 35.69,  displaced: 800000  },
  { id: "syr-jor", label: "Syria → Jordan",               originName: "Syria",       destName: "Jordan",          originLng: 36.29,  originLat: 33.51, destLng: 36.24,  destLat: 31.57,  displaced: 660000  },
]

// ── Helper functions ───────────────────────────────────────────────────────

function displacedToRadius(displaced: number): number {
  if (displaced <= 0) return 0.3
  return Math.max(0.3, Math.min(3.5, 0.4 + Math.pow(displaced, 0.38) * 0.22))
}

function arcWidth(displaced: number): number {
  if (displaced >= 2000000) return 4
  if (displaced >= 1000000) return 3
  if (displaced >= 500000)  return 2
  return 1
}

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

function featureCentroid(geometry: any): { lat: number; lng: number } {
  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180
  function walk(c: any) {
    if (!Array.isArray(c)) return
    if (typeof c[0] === "number") {
      const [lng, lat] = c
      if (lat < minLat) minLat = lat
      if (lat > maxLat) maxLat = lat
      if (lng < minLng) minLng = lng
      if (lng > maxLng) maxLng = lng
    } else {
      for (const sub of c) walk(sub)
    }
  }
  walk(geometry?.coordinates)
  return { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 }
}

// ── Component ─────────────────────────────────────────────────────────────

export default function UC27Page() {
  const globeRef  = useRef<HTMLDivElement>(null)
  const globeInst = useRef<any>(null)

  const [globeReady,       setGlobeReady]       = useState(false)
  const [isSpinning,       setIsSpinning]       = useState(true)
  const [countries,        setCountries]        = useState<CountryFeature[]>([])
  const [hoveredCountry,   setHoveredCountry]   = useState<CountryFeature | null>(null)
  const [selectedCountry,  setSelectedCountry]  = useState<CountryFeature | null>(null)
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null)
  const [typeFilter,       setTypeFilter]       = useState<ConflictType>("all")
  const [intensityFilter,  setIntensityFilter]  = useState<IntensityType>("all")
  const [pulseAlt,         setPulseAlt]         = useState(0.015)

  // ── Derived: filtered conflicts ──────────────────────────────────────────
  const filteredConflicts = useMemo(() => {
    return CONFLICTS.filter(c => {
      if (typeFilter !== "all" && c.type !== typeFilter) return false
      if (intensityFilter !== "all" && c.intensity !== intensityFilter) return false
      return true
    })
  }, [typeFilter, intensityFilter])

  // ── Derived: stats ───────────────────────────────────────────────────────
  const totalDisplaced     = useMemo(() => CONFLICTS.reduce((s, c) => s + c.displaced, 0), [])
  const totalCasualties2024 = useMemo(() => CONFLICTS.reduce((s, c) => s + c.casualties2024, 0), [])
  const activeCount        = CONFLICTS.filter(c => c.status !== "ceasefire").length
  const escalatingCount    = CONFLICTS.filter(c => c.status === "escalating").length
  const topCrises          = useMemo(() => [...CONFLICTS].sort((a, b) => b.displaced - a.displaced).slice(0, 5), [])

  // ── Derived: country stats ───────────────────────────────────────────────
  const countryConflicts = useMemo(() => {
    if (!selectedCountry) return []
    const name = selectedCountry.properties.name
    return CONFLICTS.filter(c =>
      c.country === name ||
      c.country.includes(name) ||
      name.includes(c.country)
    )
  }, [selectedCountry])

  const countryArcs = useMemo(() => {
    if (!selectedCountry) return []
    const name = selectedCountry.properties.name
    return DISPLACEMENT_ARCS.filter(a =>
      a.originName === name ||
      a.originName.includes(name) ||
      name.includes(a.originName)
    )
  }, [selectedCountry])

  const countryTotalDisplaced = useMemo(() =>
    countryConflicts.reduce((s, c) => s + c.displaced, 0), [countryConflicts])

  const countryTypes = useMemo(() =>
    [...new Set(countryConflicts.map(c => c.type))], [countryConflicts])

  // ── Globe init ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!globeRef.current || globeInst.current) return

    import("globe.gl").then(mod => {
      if (!globeRef.current) return
      const GlobeGL = (mod.default ?? mod) as any
      const globe = new GlobeGL()
      globe(globeRef.current)
        .width(globeRef.current.clientWidth)
        .height(globeRef.current.clientHeight)
        .globeImageUrl("//unpkg.com/three-globe/example/img/earth-night.jpg")
        .bumpImageUrl("//unpkg.com/three-globe/example/img/earth-topology.png")
        .backgroundImageUrl("//unpkg.com/three-globe/example/img/night-sky.png")
        .atmosphereColor("#ff4444")
        .atmosphereAltitude(0.12)
        .pointOfView({ lat: 15, lng: 30, altitude: 2.0 })

      globe.controls().autoRotate      = true
      globe.controls().autoRotateSpeed = 0.12
      globe.controls().enableDamping   = true
      globe.controls().dampingFactor   = 0.1

      // Displacement arcs
      globe
        .arcsData(DISPLACEMENT_ARCS)
        .arcStartLat("originLat")
        .arcStartLng("originLng")
        .arcEndLat("destLat")
        .arcEndLng("destLng")
        .arcColor(() => "rgba(255,120,0,0.5)")
        .arcStroke((d: any) => arcWidth(d.displaced))
        .arcDashLength(0.3)
        .arcDashGap(0.2)
        .arcDashAnimateTime(3000)
        .arcAltitudeAutoScale(0.4)
        .arcLabel((d: any) => `<div style="font-family:sans-serif;padding:7px 11px;background:rgba(0,0,0,0.92);border-radius:7px;border:1px solid rgba(255,120,0,0.4);color:#fff;font-size:11px;max-width:200px;"><b style="color:#ff7800">${d.label}</b><br/>${(d.displaced / 1e6).toFixed(2)}M displaced</div>`)

      globeInst.current = globe
      setGlobeReady(true)

      // Fetch country borders
      fetch("/countries-110m.geojson")
        .then(r => r.json())
        .then(geo => {
          setCountries(geo.features as CountryFeature[])
        })
        .catch(() => {/* border fetch failed silently */})
    })

    return () => {
      disposeGlobe(globeInst, globeRef)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Pulse animation ──────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setPulseAlt(prev => prev < 0.016 ? 0.020 : 0.012)
    }, 600)
    return () => clearInterval(id)
  }, [])

  // ── Sync conflict points when filters / selection / pulse change ─────────
  const applyPoints = useCallback((conflicts: Conflict[], selected: Conflict | null, alt: number) => {
    const g = globeInst.current
    if (!g) return
    g
      .pointsData(conflicts)
      .pointLat("lat")
      .pointLng("lng")
      .pointAltitude(alt)
      .pointRadius((d: any) => displacedToRadius(d.displaced))
      .pointColor((d: any) => {
        if (selected?.id === d.id) return "rgba(255,255,255,0.9)"
        const [r, gv, b, a] = INTENSITY_COLORS[d.intensity]
        return `rgba(${r},${gv},${b},${(a / 255).toFixed(2)})`
      })
      .pointsMerge(false)
      .pointLabel((d: any) => `<div style="font-family:sans-serif;padding:8px 12px;background:rgba(0,0,0,0.92);border-radius:8px;border:1px solid rgba(220,30,30,0.5);color:#fff;font-size:12px;max-width:240px;"><b style="color:#ff4444">${d.name}</b><br/>${d.country} &middot; ${d.type}<br/>Displaced: <b>${d.displaced >= 1 ? `${d.displaced.toFixed(1)}M` : d.displaced > 0 ? `${Math.round(d.displaced * 1000)}K` : "0"}</b><br/><span style="color:#aaa;font-size:11px">Intensity: ${d.intensity} &middot; Since ${d.startYear}</span></div>`)
      .onPointClick((d: any) => {
        setSelectedConflict((prev: Conflict | null) => prev?.id === d.id ? null : d)
        globeInst.current?.pointOfView({ lat: d.lat, lng: d.lng, altitude: 1.5 }, 700)
        setIsSpinning(false)
      })
      .onPointHover((d: any) => {
        if (globeRef.current) globeRef.current.style.cursor = d ? "pointer" : "default"
      })
  }, [])

  useEffect(() => {
    if (!globeReady) return
    applyPoints(filteredConflicts, selectedConflict, pulseAlt)
  }, [globeReady, filteredConflicts, selectedConflict, pulseAlt, applyPoints])

  // ── Apply country polygons ───────────────────────────────────────────────
  const applyCountries = useCallback((
    features: CountryFeature[],
    hovered: CountryFeature | null,
    selected: CountryFeature | null,
  ) => {
    const g = globeInst.current
    if (!g) return
    g
      .polygonsData(features)
      .polygonCapColor((d: any) => {
        if (selected && d.properties.name === selected.properties.name)
          return "rgba(255,68,68,0.12)"
        if (hovered && d.properties.name === hovered.properties.name)
          return "rgba(255,255,255,0.05)"
        return "rgba(0,0,0,0)"
      })
      .polygonSideColor(() => "rgba(0,0,0,0)")
      .polygonStrokeColor((d: any) => {
        if (selected && d.properties.name === selected.properties.name)
          return "rgba(255,68,68,0.85)"
        if (hovered && d.properties.name === hovered.properties.name)
          return "rgba(255,255,255,0.55)"
        return "rgba(255,255,255,0.15)"
      })
      .polygonAltitude(0.005)
      .onPolygonHover((d: any) => {
        setHoveredCountry(d as CountryFeature | null)
      })
      .onPolygonClick((d: any) => {
        const f = d as CountryFeature
        setSelectedCountry((prev: CountryFeature | null) =>
          prev?.properties.name === f.properties.name ? null : f
        )
        if (globeInst.current) {
          const { lat, lng } = featureCentroid(f.geometry)
          globeInst.current.pointOfView({ lat, lng, altitude: 2.0 }, 800)
        }
        setIsSpinning(false)
      })
  }, [])

  useEffect(() => {
    if (!globeReady || !countries.length) return
    applyCountries(countries, hoveredCountry, selectedCountry)
  }, [globeReady, countries, hoveredCountry, selectedCountry, applyCountries])

  // ── Spin control ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!globeInst.current) return
    globeInst.current.controls().autoRotate = isSpinning
  }, [isSpinning])

  // ── Resize ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const onResize = () => {
      if (globeInst.current && globeRef.current)
        globeInst.current.width(globeRef.current.clientWidth).height(globeRef.current.clientHeight)
    }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
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
    <div style={{ position: "relative", width: "100%", height: "calc(100vh - 64px)", background: "#04080f", overflow: "hidden" }}>

      {/* Globe canvas */}
      <div ref={globeRef} style={{ position: "absolute", inset: 0 }} />

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        pointerEvents: "none", zIndex: 10,
      }}>
        {/* URGENT banner */}
        <div style={{
          background: "rgba(180,20,20,0.92)",
          backdropFilter: "blur(8px)",
          padding: "7px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          borderBottom: "1px solid rgba(255,50,50,0.4)",
        }}>
          <span style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.15em", color: "#fff", opacity: 0.7 }}>
            UNHCR 2024
          </span>
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
                background: "rgba(51,204,221,0.1)", color: "#33ccdd",
                border: "1px solid rgba(51,204,221,0.2)",
                textDecoration: "none",
              }}>
                Details →
              </Link>
              <button
                onClick={() => setIsSpinning(s => !s)}
                style={{
                  fontSize: "10px", fontWeight: 600,
                  padding: "3px 9px", borderRadius: "4px",
                  background: "rgba(255,255,255,0.06)", color: "#aaa",
                  border: "1px solid rgba(255,255,255,0.12)", cursor: "pointer",
                }}
              >
                {isSpinning ? "Pause" : "Spin"}
              </button>
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
                { label: "Active Conflicts", value: String(activeCount),              color: "#ff8c00" },
                { label: "Escalating",       value: String(escalatingCount),          color: "#ff1e1e" },
                { label: "Total Displaced",  value: `${totalDisplaced.toFixed(1)}M`,  color: "#c084fc" },
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
                onClick={() => {
                  setSelectedConflict(prev => prev?.id === c.id ? null : c)
                  globeInst.current?.pointOfView({ lat: c.lat, lng: c.lng, altitude: 1.5 }, 700)
                  setIsSpinning(false)
                }}
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

      {/* ── Bottom-left: filters + legend ───────────────────────── */}
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
              const tc = opt.key !== "all" ? TYPE_COLORS[opt.key] : null
              const color = tc ? `rgba(${tc[0]},${tc[1]},${tc[2]},1)` : "#33ccdd"
              return (
                <button
                  key={opt.key}
                  onClick={() => setTypeFilter(opt.key)}
                  style={{
                    padding: "3px 9px", borderRadius: "5px", fontSize: "10px",
                    fontWeight: 600, cursor: "pointer", transition: "all 0.12s",
                    border: active ? `1px solid ${color}` : "1px solid rgba(255,255,255,0.1)",
                    background: active && tc ? `rgba(${tc[0]},${tc[1]},${tc[2]},0.15)` : active ? "rgba(51,204,221,0.15)" : "transparent",
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
                    background: active && ic ? `rgba(${ic[0]},${ic[1]},${ic[2]},0.15)` : active ? "rgba(51,204,221,0.15)" : "transparent",
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

      {/* ── Bottom-right: country stats panel OR conflict detail panel ── */}
      <div style={{ position: "absolute", bottom: 28, right: 16, zIndex: 10, pointerEvents: "auto", display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>

        {/* Country stats panel */}
        {selectedCountry && (
          <div style={{
            width: 280,
            background: "rgba(0,0,0,0.88)",
            border: "1px solid rgba(255,68,68,0.4)",
            borderRadius: "12px",
            backdropFilter: "blur(16px)",
            padding: "14px 16px",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "10px" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#ff6666" }}>
                  {selectedCountry.properties.name}
                </div>
                <div style={{ fontSize: "10px", color: "#777", marginTop: "2px" }}>
                  Country overview
                </div>
              </div>
              <button
                onClick={() => setSelectedCountry(null)}
                style={{ background: "transparent", border: "none", color: "#555", cursor: "pointer", fontSize: "14px", padding: 0 }}
              >✕</button>
            </div>

            {countryConflicts.length > 0 ? (
              <>
                {/* Conflict summary */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "10px" }}>
                  <div style={{ padding: "7px 9px", borderRadius: "7px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: "9px", color: "#666", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "2px" }}>Active Conflicts</div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#ff8c00" }}>{countryConflicts.length}</div>
                  </div>
                  <div style={{ padding: "7px 9px", borderRadius: "7px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: "9px", color: "#666", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "2px" }}>Total Displaced</div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#c084fc" }}>
                      {countryTotalDisplaced >= 1 ? `${countryTotalDisplaced.toFixed(1)}M` : countryTotalDisplaced > 0 ? `${Math.round(countryTotalDisplaced * 1000)}K` : "—"}
                    </div>
                  </div>
                </div>

                {/* Conflict types */}
                {countryTypes.length > 0 && (
                  <div style={{ marginBottom: "8px" }}>
                    <div style={{ fontSize: "9px", color: "#666", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "5px" }}>Conflict Types</div>
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      {countryTypes.map(t => {
                        const tc = TYPE_COLORS[t]
                        return (
                          <span key={t} style={{
                            padding: "2px 7px", borderRadius: "4px", fontSize: "9px", fontWeight: 700,
                            background: `rgba(${tc[0]},${tc[1]},${tc[2]},0.18)`,
                            color: `rgb(${tc[0]},${tc[1]},${tc[2]})`,
                            border: `1px solid rgba(${tc[0]},${tc[1]},${tc[2]},0.3)`,
                            letterSpacing: "0.06em",
                          }}>
                            {t.toUpperCase()}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Individual conflicts */}
                <div style={{ marginBottom: "8px" }}>
                  <div style={{ fontSize: "9px", color: "#666", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "5px" }}>Conflict Zones</div>
                  {countryConflicts.map(c => {
                    const ic = INTENSITY_COLORS[c.intensity]
                    return (
                      <div key={c.id} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: `rgb(${ic[0]},${ic[1]},${ic[2]})`, flexShrink: 0 }} />
                        <span style={{ fontSize: "10px", color: "#ccc", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                        <span style={{ fontSize: "9px", color: STATUS_COLORS[c.status], flexShrink: 0 }}>{STATUS_LABELS[c.status]}</span>
                      </div>
                    )
                  })}
                </div>

                {/* Displacement corridors */}
                {countryArcs.length > 0 && (
                  <div style={{ paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: "9px", color: "#666", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "5px" }}>
                      Displacement Corridors ({countryArcs.length})
                    </div>
                    {countryArcs.slice(0, 3).map(a => (
                      <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
                        <span style={{ fontSize: "10px", color: "#999" }}>{a.label}</span>
                        <span style={{ fontSize: "10px", fontWeight: 700, color: "#ff7800" }}>{fmtDisplaced(a.displaced)}</span>
                      </div>
                    ))}
                    {countryArcs.length > 3 && (
                      <div style={{ fontSize: "9px", color: "#555" }}>+{countryArcs.length - 3} more corridors</div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div style={{ fontSize: "11px", color: "#666", fontStyle: "italic" }}>
                No tracked conflicts in this country
              </div>
            )}
          </div>
        )}

        {/* Selected conflict detail panel */}
        {selectedConflict && (
          <div style={{ width: 280 }}>
            <div style={{
              background: "rgba(0,0,0,0.88)",
              border: `1px solid rgba(${INTENSITY_COLORS[selectedConflict.intensity].slice(0, 3).join(",")},0.5)`,
              borderRadius: "12px",
              backdropFilter: "blur(16px)",
              padding: "14px 16px",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "10px" }}>
                <div style={{ flex: 1, minWidth: 0, paddingRight: "8px" }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#f0f0f0", lineHeight: 1.3, marginBottom: "4px" }}>
                    {selectedConflict.name}
                  </div>
                  <div style={{ fontSize: "10px", color: "#888" }}>{selectedConflict.country}</div>
                </div>
                <button
                  onClick={() => setSelectedConflict(null)}
                  style={{ background: "transparent", border: "none", color: "#555", cursor: "pointer", fontSize: "14px", padding: 0, lineHeight: 1, flexShrink: 0 }}
                >✕</button>
              </div>

              {/* Status + intensity badges */}
              <div style={{ display: "flex", gap: "6px", marginBottom: "12px", flexWrap: "wrap" }}>
                <span style={{
                  padding: "2px 8px", borderRadius: "4px", fontSize: "9px", fontWeight: 700,
                  background: `rgba(${INTENSITY_COLORS[selectedConflict.intensity].slice(0, 3).join(",")},0.2)`,
                  color: `rgb(${INTENSITY_COLORS[selectedConflict.intensity].slice(0, 3).join(",")})`,
                  border: `1px solid rgba(${INTENSITY_COLORS[selectedConflict.intensity].slice(0, 3).join(",")},0.3)`,
                  letterSpacing: "0.08em",
                }}>
                  {selectedConflict.intensity.toUpperCase()}
                </span>
                <span style={{
                  padding: "2px 8px", borderRadius: "4px", fontSize: "9px", fontWeight: 700,
                  background: `rgba(${TYPE_COLORS[selectedConflict.type].slice(0, 3).join(",")},0.2)`,
                  color: `rgb(${TYPE_COLORS[selectedConflict.type].slice(0, 3).join(",")})`,
                  border: `1px solid rgba(${TYPE_COLORS[selectedConflict.type].slice(0, 3).join(",")},0.3)`,
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
                  { label: "Displaced",       value: selectedConflict.displaced >= 1 ? `${selectedConflict.displaced.toFixed(1)}M` : selectedConflict.displaced > 0 ? `${Math.round(selectedConflict.displaced * 1000)}K` : "—", color: "#c084fc" },
                  { label: "2024 Casualties", value: selectedConflict.casualties2024 > 0 ? fmtCasualties(selectedConflict.casualties2024) : "—", color: "#f87171" },
                  { label: "Conflict Onset",  value: String(selectedConflict.startYear), color: "#94a3b8" },
                  { label: "Status",          value: STATUS_LABELS[selectedConflict.status], color: STATUS_COLORS[selectedConflict.status] },
                ].map(m => (
                  <div key={m.label} style={{
                    padding: "7px 9px", borderRadius: "7px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}>
                    <div style={{ fontSize: "9px", color: "#666", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                      {m.label}
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: m.color }}>{m.value}</div>
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
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "5px", marginBottom: i < selectedConflict.parties.length - 1 ? "4px" : 0 }}>
                    <span style={{ color: "#444", fontSize: "10px", flexShrink: 0, marginTop: "1px" }}>▸</span>
                    <span style={{ fontSize: "10px", color: "#aaa", lineHeight: 1.4 }}>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Hovered country label (top center) ──────────────────── */}
      {hoveredCountry && !selectedCountry && (
        <div style={{ position: "absolute", top: 80, left: "50%", transform: "translateX(-50%)", zIndex: 10, pointerEvents: "none" }}>
          <div style={{
            padding: "5px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: 600,
            background: "rgba(0,0,0,0.75)", border: "1px solid rgba(255,255,255,0.15)", color: "#f0f0f0",
            backdropFilter: "blur(8px)",
          }}>
            {hoveredCountry.properties.name}
          </div>
        </div>
      )}

      {/* ── Filter count badge ───────────────────────────────────── */}
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
          whiteSpace: "nowrap",
        }}>
          Showing <span style={{ color: "#f0f0f0", fontWeight: 700 }}>{filteredConflicts.length}</span> of{" "}
          <span style={{ color: "#f0f0f0", fontWeight: 700 }}>{CONFLICTS.length}</span> conflicts
        </div>
      )}
    </div>
  )
}

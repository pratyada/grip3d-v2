"use client"

import { useEffect, useRef, useState, useMemo, useCallback } from "react"
import Link from "next/link"
import { disposeGlobe } from "@/lib/globe-cleanup"

// ── Types ────────────────────────────────────────────────────────────────────

type ViewMode = "stadiums" | "fanTravel" | "teams" | "matches"
type CountryFilter = "all" | "USA" | "MEX" | "CAN"

interface Stadium {
  id: string
  name: string
  city: string
  country: "USA" | "MEX" | "CAN"
  lat: number
  lng: number
  capacity: number
  matches: number
  color: string
}

interface FanCorridor {
  label: string
  fromLat: number
  fromLng: number
  toLat: number
  toLng: number
  country: string
  volume: "high" | "medium" | "low"
  color: string
}

interface Team {
  code: string
  name: string
  group: string
  lat: number
  lng: number
  color: string
  region: "CONCACAF" | "UEFA" | "CONMEBOL" | "AFC" | "CAF" | "OFC"
}

interface MatchData {
  id: string
  date: string
  homeTeam: string
  awayTeam: string
  homeCode: string
  awayCode: string
  homeScore: number | null
  awayScore: number | null
  venue: string
  city: string
  status: number
  stage: string
  group: string
}

interface CountryFeature {
  type: string
  properties: { name: string; [k: string]: unknown }
  geometry: { type: string; coordinates: unknown[] }
}

// ── Constants ────────────────────────────────────────────────────────────────

const COUNTRY_COLORS: Record<string, string> = {
  USA: "#3b82f6",
  MEX: "#22c55e",
  CAN: "#dc2626",
}

const STAGE_COLORS: Record<string, string> = {
  "Group Stage": "#94a3b8",
  "Round of 32": "#a78bfa",
  "Round of 16": "#60a5fa",
  "Quarter-final": "#fbbf24",
  "Semi-final": "#f97316",
  Final: "#ef4444",
}

const VIEW_MODES: { key: ViewMode; label: string; icon: string }[] = [
  { key: "stadiums", label: "Stadiums", icon: "\u{1F3DF}\uFE0F" },
  { key: "fanTravel", label: "Fan Travel", icon: "\u2708\uFE0F" },
  { key: "teams", label: "Teams", icon: "\u{1F30D}" },
  { key: "matches", label: "Matches", icon: "\u26BD" },
]

// ── 16 Stadiums ──────────────────────────────────────────────────────────────

const STADIUMS: Stadium[] = [
  { id: "metlife", name: "MetLife Stadium", city: "East Rutherford, NJ", country: "USA", lat: 40.8128, lng: -74.0742, capacity: 82500, matches: 8, color: "#3b82f6" },
  { id: "sofi", name: "SoFi Stadium", city: "Los Angeles, CA", country: "USA", lat: 33.9535, lng: -118.3392, capacity: 70240, matches: 7, color: "#3b82f6" },
  { id: "att", name: "AT&T Stadium", city: "Arlington, TX", country: "USA", lat: 32.7473, lng: -97.0945, capacity: 80000, matches: 8, color: "#3b82f6" },
  { id: "nrg", name: "NRG Stadium", city: "Houston, TX", country: "USA", lat: 29.6847, lng: -95.4107, capacity: 72220, matches: 7, color: "#3b82f6" },
  { id: "hardrock", name: "Hard Rock Stadium", city: "Miami Gardens, FL", country: "USA", lat: 25.9580, lng: -80.2389, capacity: 64767, matches: 7, color: "#3b82f6" },
  { id: "mercedesbenz", name: "Mercedes-Benz Stadium", city: "Atlanta, GA", country: "USA", lat: 33.7553, lng: -84.4006, capacity: 71000, matches: 6, color: "#3b82f6" },
  { id: "lincoln", name: "Lincoln Financial Field", city: "Philadelphia, PA", country: "USA", lat: 39.9008, lng: -75.1675, capacity: 69176, matches: 6, color: "#3b82f6" },
  { id: "lumen", name: "Lumen Field", city: "Seattle, WA", country: "USA", lat: 47.5952, lng: -122.3316, capacity: 68740, matches: 6, color: "#3b82f6" },
  { id: "levis", name: "Levi's Stadium", city: "Santa Clara, CA", country: "USA", lat: 37.4033, lng: -121.9694, capacity: 68500, matches: 6, color: "#3b82f6" },
  { id: "gillette", name: "Gillette Stadium", city: "Foxborough, MA", country: "USA", lat: 42.0909, lng: -71.2643, capacity: 65878, matches: 6, color: "#3b82f6" },
  { id: "arrowhead", name: "Arrowhead Stadium", city: "Kansas City, MO", country: "USA", lat: 39.0489, lng: -94.4839, capacity: 76416, matches: 6, color: "#3b82f6" },
  { id: "azteca", name: "Estadio Azteca", city: "Mexico City", country: "MEX", lat: 19.3029, lng: -99.1505, capacity: 87523, matches: 7, color: "#22c55e" },
  { id: "akron", name: "Estadio Akron", city: "Guadalajara", country: "MEX", lat: 20.6810, lng: -103.4625, capacity: 49850, matches: 6, color: "#22c55e" },
  { id: "bbva", name: "Estadio BBVA", city: "Monterrey", country: "MEX", lat: 25.6700, lng: -100.2438, capacity: 53500, matches: 6, color: "#22c55e" },
  { id: "bmo", name: "BMO Field", city: "Toronto", country: "CAN", lat: 43.6332, lng: -79.4186, capacity: 30000, matches: 6, color: "#dc2626" },
  { id: "bcplace", name: "BC Place", city: "Vancouver", country: "CAN", lat: 49.2768, lng: -123.1120, capacity: 54500, matches: 6, color: "#dc2626" },
]

// ── Fan Travel Corridors ─────────────────────────────────────────────────────

const FAN_CORRIDORS: FanCorridor[] = [
  // From South America
  { label: "Argentina \u2192 Miami", fromLat: -34.6, fromLng: -58.4, toLat: 25.96, toLng: -80.24, country: "Argentina", volume: "high", color: "#75aadb" },
  { label: "Brazil \u2192 Houston", fromLat: -15.8, fromLng: -47.9, toLat: 29.68, toLng: -95.41, country: "Brazil", volume: "high", color: "#009c3b" },
  { label: "Mexico \u2192 Azteca", fromLat: 23.6, fromLng: -102.6, toLat: 19.30, toLng: -99.15, country: "Mexico", volume: "high", color: "#006341" },
  { label: "Colombia \u2192 Miami", fromLat: 4.6, fromLng: -74.1, toLat: 25.96, toLng: -80.24, country: "Colombia", volume: "medium", color: "#fcd116" },
  // From Europe
  { label: "England \u2192 New York", fromLat: 51.5, fromLng: -0.13, toLat: 40.81, toLng: -74.07, country: "England", volume: "high", color: "#ffffff" },
  { label: "Germany \u2192 Boston", fromLat: 52.5, fromLng: 13.4, toLat: 42.09, toLng: -71.26, country: "Germany", volume: "high", color: "#ffce00" },
  { label: "France \u2192 Atlanta", fromLat: 48.9, fromLng: 2.35, toLat: 33.76, toLng: -84.40, country: "France", volume: "high", color: "#002395" },
  { label: "Spain \u2192 Dallas", fromLat: 40.4, fromLng: -3.7, toLat: 32.75, toLng: -97.09, country: "Spain", volume: "high", color: "#c60b1e" },
  { label: "Portugal \u2192 Philadelphia", fromLat: 38.7, fromLng: -9.14, toLat: 39.90, toLng: -75.17, country: "Portugal", volume: "medium", color: "#006600" },
  { label: "Italy \u2192 New York", fromLat: 41.9, fromLng: 12.5, toLat: 40.81, toLng: -74.07, country: "Italy", volume: "medium", color: "#009246" },
  { label: "Netherlands \u2192 Houston", fromLat: 52.4, fromLng: 4.9, toLat: 29.68, toLng: -95.41, country: "Netherlands", volume: "medium", color: "#ff6600" },
  // From Africa
  { label: "Nigeria \u2192 Atlanta", fromLat: 9.1, fromLng: 7.5, toLat: 33.76, toLng: -84.40, country: "Nigeria", volume: "medium", color: "#008751" },
  { label: "Morocco \u2192 Kansas City", fromLat: 34.0, fromLng: -6.8, toLat: 39.05, toLng: -94.48, country: "Morocco", volume: "high", color: "#c1272d" },
  { label: "Senegal \u2192 Philadelphia", fromLat: 14.7, fromLng: -17.5, toLat: 39.90, toLng: -75.17, country: "Senegal", volume: "low", color: "#00853f" },
  // From Asia
  { label: "Japan \u2192 Seattle", fromLat: 35.7, fromLng: 139.7, toLat: 47.60, toLng: -122.33, country: "Japan", volume: "high", color: "#bc002d" },
  { label: "South Korea \u2192 San Francisco", fromLat: 37.6, fromLng: 127.0, toLat: 37.40, toLng: -121.97, country: "South Korea", volume: "high", color: "#0047a0" },
  { label: "Saudi Arabia \u2192 Dallas", fromLat: 24.7, fromLng: 46.7, toLat: 32.75, toLng: -97.09, country: "Saudi Arabia", volume: "medium", color: "#006c35" },
  { label: "Australia \u2192 Los Angeles", fromLat: -33.9, fromLng: 151.2, toLat: 33.95, toLng: -118.34, country: "Australia", volume: "medium", color: "#ffcd00" },
  { label: "India \u2192 Toronto", fromLat: 20.6, fromLng: 78.0, toLat: 43.63, toLng: -79.42, country: "India", volume: "medium", color: "#ff9933" },
  // From North America
  { label: "Canada \u2192 Vancouver", fromLat: 45.4, fromLng: -75.7, toLat: 49.28, toLng: -123.11, country: "Canada", volume: "high", color: "#ff0000" },
  { label: "US East \u2192 MetLife", fromLat: 38.9, fromLng: -77.0, toLat: 40.81, toLng: -74.07, country: "USA", volume: "high", color: "#3b82f6" },
]

// ── 48 Qualified Teams ───────────────────────────────────────────────────────

const TEAMS: Team[] = [
  // CONCACAF (host + qualified)
  { code: "USA", name: "United States", group: "A", lat: 38.9, lng: -77.0, color: "#3b82f6", region: "CONCACAF" },
  { code: "MEX", name: "Mexico", group: "A", lat: 19.4, lng: -99.1, color: "#006341", region: "CONCACAF" },
  { code: "CAN", name: "Canada", group: "B", lat: 45.4, lng: -75.7, color: "#dc2626", region: "CONCACAF" },
  { code: "CRC", name: "Costa Rica", group: "B", lat: 9.9, lng: -84.1, color: "#002b7f", region: "CONCACAF" },
  { code: "JAM", name: "Jamaica", group: "C", lat: 18.0, lng: -76.8, color: "#009b3a", region: "CONCACAF" },
  { code: "HON", name: "Honduras", group: "C", lat: 14.1, lng: -87.2, color: "#00bce4", region: "CONCACAF" },
  // UEFA
  { code: "ENG", name: "England", group: "D", lat: 51.5, lng: -0.13, color: "#ffffff", region: "UEFA" },
  { code: "GER", name: "Germany", group: "D", lat: 52.5, lng: 13.4, color: "#ffce00", region: "UEFA" },
  { code: "FRA", name: "France", group: "E", lat: 48.9, lng: 2.35, color: "#002395", region: "UEFA" },
  { code: "ESP", name: "Spain", group: "E", lat: 40.4, lng: -3.7, color: "#c60b1e", region: "UEFA" },
  { code: "POR", name: "Portugal", group: "F", lat: 38.7, lng: -9.1, color: "#006600", region: "UEFA" },
  { code: "NED", name: "Netherlands", group: "F", lat: 52.4, lng: 4.9, color: "#ff6600", region: "UEFA" },
  { code: "ITA", name: "Italy", group: "G", lat: 41.9, lng: 12.5, color: "#009246", region: "UEFA" },
  { code: "BEL", name: "Belgium", group: "G", lat: 50.8, lng: 4.4, color: "#ed2939", region: "UEFA" },
  { code: "CRO", name: "Croatia", group: "H", lat: 45.8, lng: 16.0, color: "#ff0000", region: "UEFA" },
  { code: "DEN", name: "Denmark", group: "H", lat: 55.7, lng: 12.6, color: "#c8102e", region: "UEFA" },
  { code: "SUI", name: "Switzerland", group: "I", lat: 46.9, lng: 7.4, color: "#ff0000", region: "UEFA" },
  { code: "AUT", name: "Austria", group: "I", lat: 48.2, lng: 16.4, color: "#ed2939", region: "UEFA" },
  { code: "POL", name: "Poland", group: "J", lat: 52.2, lng: 21.0, color: "#dc143c", region: "UEFA" },
  { code: "SRB", name: "Serbia", group: "J", lat: 44.8, lng: 20.5, color: "#c6363c", region: "UEFA" },
  { code: "SCO", name: "Scotland", group: "K", lat: 56.0, lng: -3.2, color: "#003399", region: "UEFA" },
  { code: "UKR", name: "Ukraine", group: "K", lat: 50.4, lng: 30.5, color: "#005bbb", region: "UEFA" },
  { code: "TUR", name: "Turkey", group: "L", lat: 39.9, lng: 32.9, color: "#e30a17", region: "UEFA" },
  { code: "WAL", name: "Wales", group: "L", lat: 51.5, lng: -3.2, color: "#c8102e", region: "UEFA" },
  // CONMEBOL
  { code: "ARG", name: "Argentina", group: "A", lat: -34.6, lng: -58.4, color: "#75aadb", region: "CONMEBOL" },
  { code: "BRA", name: "Brazil", group: "B", lat: -15.8, lng: -47.9, color: "#009c3b", region: "CONMEBOL" },
  { code: "COL", name: "Colombia", group: "C", lat: 4.6, lng: -74.1, color: "#fcd116", region: "CONMEBOL" },
  { code: "URU", name: "Uruguay", group: "D", lat: -34.9, lng: -56.2, color: "#001489", region: "CONMEBOL" },
  { code: "ECU", name: "Ecuador", group: "E", lat: -0.2, lng: -78.5, color: "#ffe100", region: "CONMEBOL" },
  { code: "CHI", name: "Chile", group: "F", lat: -33.4, lng: -70.7, color: "#d52b1e", region: "CONMEBOL" },
  { code: "PAR", name: "Paraguay", group: "G", lat: -25.3, lng: -57.6, color: "#d52b1e", region: "CONMEBOL" },
  { code: "PER", name: "Peru", group: "H", lat: -12.0, lng: -77.0, color: "#d91023", region: "CONMEBOL" },
  { code: "BOL", name: "Bolivia", group: "I", lat: -16.5, lng: -68.1, color: "#007934", region: "CONMEBOL" },
  { code: "VEN", name: "Venezuela", group: "J", lat: 10.5, lng: -66.9, color: "#cf142b", region: "CONMEBOL" },
  // AFC
  { code: "JPN", name: "Japan", group: "K", lat: 35.7, lng: 139.7, color: "#bc002d", region: "AFC" },
  { code: "KOR", name: "South Korea", group: "K", lat: 37.6, lng: 127.0, color: "#0047a0", region: "AFC" },
  { code: "KSA", name: "Saudi Arabia", group: "L", lat: 24.7, lng: 46.7, color: "#006c35", region: "AFC" },
  { code: "AUS", name: "Australia", group: "L", lat: -33.9, lng: 151.2, color: "#ffcd00", region: "AFC" },
  { code: "IRN", name: "Iran", group: "F", lat: 35.7, lng: 51.4, color: "#239f40", region: "AFC" },
  { code: "QAT", name: "Qatar", group: "G", lat: 25.3, lng: 51.5, color: "#8d1b3d", region: "AFC" },
  { code: "IRQ", name: "Iraq", group: "H", lat: 33.3, lng: 44.4, color: "#007a3d", region: "AFC" },
  { code: "UZB", name: "Uzbekistan", group: "I", lat: 41.3, lng: 69.3, color: "#1eb53a", region: "AFC" },
  // CAF
  { code: "MAR", name: "Morocco", group: "C", lat: 34.0, lng: -6.8, color: "#c1272d", region: "CAF" },
  { code: "NGA", name: "Nigeria", group: "D", lat: 9.1, lng: 7.5, color: "#008751", region: "CAF" },
  { code: "SEN", name: "Senegal", group: "E", lat: 14.7, lng: -17.5, color: "#00853f", region: "CAF" },
  { code: "CMR", name: "Cameroon", group: "J", lat: 3.9, lng: 11.5, color: "#007a5e", region: "CAF" },
  { code: "EGY", name: "Egypt", group: "H", lat: 30.0, lng: 31.2, color: "#ce1126", region: "CAF" },
  { code: "GHA", name: "Ghana", group: "I", lat: 5.6, lng: -0.2, color: "#006b3f", region: "CAF" },
]

// ── Hardcoded sample matches ─────────────────────────────────────────────────

const SAMPLE_MATCHES: MatchData[] = [
  { id: "1", date: "2026-06-11T22:00:00Z", homeTeam: "Mexico", awayTeam: "TBD", homeCode: "MEX", awayCode: "", homeScore: null, awayScore: null, venue: "Estadio Azteca", city: "Mexico City", status: 0, stage: "Group Stage", group: "Group A" },
  { id: "2", date: "2026-06-12T00:00:00Z", homeTeam: "United States", awayTeam: "TBD", homeCode: "USA", awayCode: "", homeScore: null, awayScore: null, venue: "SoFi Stadium", city: "Los Angeles", status: 0, stage: "Group Stage", group: "Group A" },
  { id: "3", date: "2026-06-12T18:00:00Z", homeTeam: "Argentina", awayTeam: "TBD", homeCode: "ARG", awayCode: "", homeScore: null, awayScore: null, venue: "Hard Rock Stadium", city: "Miami", status: 0, stage: "Group Stage", group: "Group A" },
  { id: "4", date: "2026-06-12T21:00:00Z", homeTeam: "Brazil", awayTeam: "TBD", homeCode: "BRA", awayCode: "", homeScore: null, awayScore: null, venue: "NRG Stadium", city: "Houston", status: 0, stage: "Group Stage", group: "Group B" },
  { id: "5", date: "2026-06-13T00:00:00Z", homeTeam: "England", awayTeam: "TBD", homeCode: "ENG", awayCode: "", homeScore: null, awayScore: null, venue: "MetLife Stadium", city: "East Rutherford", status: 0, stage: "Group Stage", group: "Group D" },
  { id: "6", date: "2026-06-13T18:00:00Z", homeTeam: "France", awayTeam: "TBD", homeCode: "FRA", awayCode: "", homeScore: null, awayScore: null, venue: "Mercedes-Benz Stadium", city: "Atlanta", status: 0, stage: "Group Stage", group: "Group E" },
  { id: "7", date: "2026-06-13T21:00:00Z", homeTeam: "Germany", awayTeam: "TBD", homeCode: "GER", awayCode: "", homeScore: null, awayScore: null, venue: "Gillette Stadium", city: "Foxborough", status: 0, stage: "Group Stage", group: "Group D" },
  { id: "8", date: "2026-06-14T00:00:00Z", homeTeam: "Spain", awayTeam: "TBD", homeCode: "ESP", awayCode: "", homeScore: null, awayScore: null, venue: "AT&T Stadium", city: "Arlington", status: 0, stage: "Group Stage", group: "Group E" },
  { id: "9", date: "2026-06-14T18:00:00Z", homeTeam: "Canada", awayTeam: "TBD", homeCode: "CAN", awayCode: "", homeScore: null, awayScore: null, venue: "BMO Field", city: "Toronto", status: 0, stage: "Group Stage", group: "Group B" },
  { id: "10", date: "2026-06-14T21:00:00Z", homeTeam: "Japan", awayTeam: "TBD", homeCode: "JPN", awayCode: "", homeScore: null, awayScore: null, venue: "Lumen Field", city: "Seattle", status: 0, stage: "Group Stage", group: "Group K" },
  { id: "sf1", date: "2026-07-14T22:00:00Z", homeTeam: "SF1", awayTeam: "SF2", homeCode: "", awayCode: "", homeScore: null, awayScore: null, venue: "AT&T Stadium", city: "Arlington", status: 0, stage: "Semi-final", group: "" },
  { id: "sf2", date: "2026-07-15T22:00:00Z", homeTeam: "SF3", awayTeam: "SF4", homeCode: "", awayCode: "", homeScore: null, awayScore: null, venue: "MetLife Stadium", city: "East Rutherford", status: 0, stage: "Semi-final", group: "" },
  { id: "final", date: "2026-07-19T21:00:00Z", homeTeam: "W-SF1", awayTeam: "W-SF2", homeCode: "", awayCode: "", homeScore: null, awayScore: null, venue: "MetLife Stadium", city: "East Rutherford", status: 0, stage: "Final", group: "" },
]

// ── Map of qualified nations ─────────────────────────────────────────────────

const QUALIFIED_COUNTRIES: Record<string, string> = {}
for (const t of TEAMS) QUALIFIED_COUNTRIES[t.name] = t.color

// Manual name mapping for GeoJSON country names that differ
const NAME_MAP: Record<string, string> = {
  "United States of America": "United States",
  "Korea": "South Korea",
  "Republic of Korea": "South Korea",
  "Saudi Arabia": "Saudi Arabia",
  "Iran (Islamic Republic of)": "Iran",
}

// ── Satellite tiles helper ───────────────────────────────────────────────────

function getSatelliteTiles(lat: number, lng: number): string[] {
  const zoom = 15
  const n = Math.pow(2, zoom)
  const centerX = Math.floor(((lng + 180) / 360) * n)
  const centerY = Math.floor(
    ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * n,
  )
  const tiles: string[] = []
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      tiles.push(
        `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${centerY + dy}/${centerX + dx}`,
      )
    }
  }
  return tiles
}

// ── Kickoff Countdown ────────────────────────────────────────────────────────

const KICKOFF = new Date("2026-06-11T22:00:00Z")

function useCountdown() {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const diff = KICKOFF.getTime() - now
  if (diff <= 0) return { days: 0, hours: 0, mins: 0, secs: 0, live: true }
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    mins: Math.floor((diff % 3600000) / 60000),
    secs: Math.floor((diff % 60000) / 1000),
    live: false,
  }
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function UC31Page() {
  const globeRef = useRef<HTMLDivElement | null>(null)
  const globeInst = useRef<any>(null)

  const [viewMode, setViewMode] = useState<ViewMode>("fanTravel")
  const [countryFilter, setCountryFilter] = useState<CountryFilter>("all")
  const [selectedStadium, setSelectedStadium] = useState<Stadium | null>(null)
  const [countries, setCountries] = useState<CountryFeature[]>([])
  const [hoveredCountry, setHoveredCountry] = useState<CountryFeature | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<CountryFeature | null>(null)
  const [matches, setMatches] = useState<MatchData[]>(SAMPLE_MATCHES)
  const [isSpinning, setIsSpinning] = useState(true)
  const [showPanel, setShowPanel] = useState(false)

  const countdown = useCountdown()

  // ── Filtered stadiums ────────────────────────────────────────────────────
  const filteredStadiums = useMemo(() => {
    if (countryFilter === "all") return STADIUMS
    return STADIUMS.filter((s) => s.country === countryFilter)
  }, [countryFilter])

  // ── Fetch country borders ────────────────────────────────────────────────
  useEffect(() => {
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then((r) => r.json())
      .then((topo) => {
        // @ts-expect-error topojson types
        import("topojson-client").then(({ feature }) => {
          const fc = feature(topo, topo.objects.countries) as any
          setCountries(fc.features)
        })
      })
      .catch(() => {})
  }, [])

  // ── Fetch matches from API ──────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/worldcup")
      .then((r) => r.json())
      .then((d) => {
        if (d.matches?.length) setMatches(d.matches)
      })
      .catch(() => {})
  }, [])

  // ── Globe init ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!globeRef.current || globeInst.current) return

    import("globe.gl").then((mod) => {
      if (!globeRef.current) return
      const GlobeGL = (mod.default ?? mod) as any
      const globe = new GlobeGL()
      globe(globeRef.current)
        .width(globeRef.current.clientWidth)
        .height(globeRef.current.clientHeight)
        .globeImageUrl("//unpkg.com/three-globe/example/img/earth-night.jpg")
        .bumpImageUrl("//unpkg.com/three-globe/example/img/earth-topology.png")
        .backgroundImageUrl("//unpkg.com/three-globe/example/img/night-sky.png")
        .atmosphereColor("#22c55e")
        .atmosphereAltitude(0.14)
        .pointOfView({ lat: 35, lng: -98, altitude: 1.8 })

      globe.controls().autoRotate = true
      globe.controls().autoRotateSpeed = 0.18
      globe.controls().enableDamping = true
      globe.controls().dampingFactor = 0.1

      globeInst.current = globe
    })

    return () => {
      disposeGlobe(globeInst, globeRef)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Resize handler ──────────────────────────────────────────────────────
  useEffect(() => {
    function onResize() {
      if (!globeInst.current || !globeRef.current) return
      globeInst.current.width(globeRef.current.clientWidth)
      globeInst.current.height(globeRef.current.clientHeight)
    }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  // ── Sync spin ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!globeInst.current) return
    try { globeInst.current.controls().autoRotate = isSpinning } catch {}
  }, [isSpinning])

  // ── Apply stadium points ─────────────────────────────────────────────────
  const applyStadiums = useCallback(
    (globe: any) => {
      globe
        .pointsData(filteredStadiums)
        .pointLat((d: any) => d.lat)
        .pointLng((d: any) => d.lng)
        .pointColor((d: any) => d.color)
        .pointAltitude(0.01)
        .pointRadius((d: any) => 0.15 + (d.capacity / 87523) * 0.35)
        .pointResolution(12)
        .onPointHover((pt: any) => {
          if (globeRef.current) globeRef.current.style.cursor = pt ? "pointer" : "default"
        })
        .onPointClick((d: any) => {
          setSelectedStadium(d as Stadium)
          setIsSpinning(false)
          globe.pointOfView({ lat: d.lat, lng: d.lng, altitude: 0.4 }, 1000)
        })
    },
    [filteredStadiums],
  )

  // ── Apply fan travel arcs ──────────────────────────────────────────────
  const applyArcs = useCallback((globe: any) => {
    globe
      .arcsData(FAN_CORRIDORS)
      .arcStartLat((d: any) => d.fromLat)
      .arcStartLng((d: any) => d.fromLng)
      .arcEndLat((d: any) => d.toLat)
      .arcEndLng((d: any) => d.toLng)
      .arcColor((d: any) => [d.color, d.color])
      .arcStroke((d: any) => (d.volume === "high" ? 1.2 : d.volume === "medium" ? 0.6 : 0.3))
      .arcDashLength(0.4)
      .arcDashGap(0.2)
      .arcDashAnimateTime(2000)
      .arcAltitudeAutoScale(0.4)
      .onArcHover((arc: any) => {
        if (globeRef.current) globeRef.current.style.cursor = arc ? "pointer" : "default"
      })
  }, [])

  // ── Apply team origin points ──────────────────────────────────────────
  const applyTeamPoints = useCallback((globe: any) => {
    globe
      .pointsData(TEAMS)
      .pointLat((d: any) => d.lat)
      .pointLng((d: any) => d.lng)
      .pointColor((d: any) => d.color)
      .pointAltitude(0.008)
      .pointRadius(0.2)
      .pointResolution(8)
      .onPointHover((pt: any) => {
        if (globeRef.current) globeRef.current.style.cursor = pt ? "pointer" : "default"
      })
      .onPointClick((d: any) => {
        const team = d as Team
        setSelectedStadium(null)
        setIsSpinning(false)
        globe.pointOfView({ lat: team.lat, lng: team.lng, altitude: 1.4 }, 1000)
      })
  }, [])

  // ── Apply country polygons ────────────────────────────────────────────
  const applyCountries = useCallback(
    (globe: any, features: CountryFeature[], hovered: CountryFeature | null, selected: CountryFeature | null) => {
      globe
        .polygonsData(features)
        .polygonCapColor((d: any) => {
          const geoName = d.properties?.name ?? ""
          const mappedName = NAME_MAP[geoName] ?? geoName
          const teamColor = QUALIFIED_COUNTRIES[mappedName]

          if (selected && d.properties.name === selected.properties.name) return "rgba(253,231,37,0.15)"
          if (hovered && d.properties.name === hovered.properties.name) return "rgba(255,255,255,0.08)"
          if (viewMode === "teams" && teamColor) return teamColor + "30"
          return "rgba(0,0,0,0)"
        })
        .polygonSideColor(() => "rgba(0,0,0,0)")
        .polygonStrokeColor((d: any) => {
          const geoName = d.properties?.name ?? ""
          const mappedName = NAME_MAP[geoName] ?? geoName
          const teamColor = QUALIFIED_COUNTRIES[mappedName]

          if (selected && d.properties.name === selected.properties.name) return "rgba(253,231,37,0.9)"
          if (hovered && d.properties.name === hovered.properties.name) return "rgba(255,255,255,0.6)"
          if (viewMode === "teams" && teamColor) return teamColor + "88"
          return "rgba(255,255,255,0.12)"
        })
        .polygonAltitude(0.005)
        .onPolygonHover((d: any) => setHoveredCountry(d as CountryFeature | null))
        .onPolygonClick((d: any) => {
          const f = d as CountryFeature
          setSelectedCountry((prev) => (prev?.properties.name === f.properties.name ? null : f))
          setIsSpinning(false)
        })
    },
    [viewMode],
  )

  // ── Sync layers on view mode changes ──────────────────────────────────
  useEffect(() => {
    if (!globeInst.current) return
    const globe = globeInst.current

    // Clear layers first
    globe.pointsData([]).arcsData([])

    if (viewMode === "stadiums") {
      applyStadiums(globe)
    } else if (viewMode === "fanTravel") {
      applyArcs(globe)
      // Also show stadiums as small dots
      globe
        .pointsData(filteredStadiums)
        .pointLat((d: any) => d.lat)
        .pointLng((d: any) => d.lng)
        .pointColor((d: any) => d.color)
        .pointAltitude(0.008)
        .pointRadius(0.12)
        .pointResolution(8)
    } else if (viewMode === "teams") {
      applyTeamPoints(globe)
    } else if (viewMode === "matches") {
      applyStadiums(globe)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, countryFilter, applyStadiums, applyArcs, applyTeamPoints])

  // ── Sync country polygons ─────────────────────────────────────────────
  useEffect(() => {
    if (!globeInst.current || !countries.length) return
    applyCountries(globeInst.current, countries, hoveredCountry, selectedCountry)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countries, hoveredCountry, selectedCountry, viewMode])

  // ── Fly to stadium from list ──────────────────────────────────────────
  const flyToStadium = useCallback((s: Stadium) => {
    setSelectedStadium(s)
    setIsSpinning(false)
    if (globeInst.current) {
      globeInst.current.pointOfView({ lat: s.lat, lng: s.lng, altitude: 0.4 }, 1000)
    }
  }, [])

  // ── Sorted stadiums ──────────────────────────────────────────────────
  const sortedStadiums = useMemo(() => [...filteredStadiums].sort((a, b) => b.capacity - a.capacity), [filteredStadiums])

  // ── Country click info ────────────────────────────────────────────────
  const countryInfo = useMemo(() => {
    if (!selectedCountry) return null
    const name = NAME_MAP[selectedCountry.properties.name] ?? selectedCountry.properties.name
    const isHost = name === "United States" || name === "Mexico" || name === "Canada"
    const team = TEAMS.find((t) => t.name === name)
    if (isHost) {
      const key = name === "United States" ? "USA" : name === "Mexico" ? "MEX" : "CAN"
      const venues = STADIUMS.filter((s) => s.country === key)
      const totalCap = venues.reduce((s, v) => s + v.capacity, 0)
      const totalMatches = venues.reduce((s, v) => s + v.matches, 0)
      return { name, isHost: true as const, venues: venues.length, totalCapacity: totalCap, totalMatches, team, color: COUNTRY_COLORS[key] }
    }
    if (team) return { name, isHost: false as const, team, color: team.color }
    return { name, isHost: false as const, team: null, color: null }
  }, [selectedCountry])

  // ── Flag emoji from country code ──────────────────────────────────────
  const countryFlag = useCallback((country: "USA" | "MEX" | "CAN") => {
    return country === "USA" ? "\u{1F1FA}\u{1F1F8}" : country === "MEX" ? "\u{1F1F2}\u{1F1FD}" : "\u{1F1E8}\u{1F1E6}"
  }, [])

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#030712]">
      {/* Globe container */}
      <div ref={globeRef} className="absolute inset-0" />

      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 pointer-events-auto" style={{ background: "linear-gradient(180deg, rgba(3,7,18,0.92) 0%, rgba(3,7,18,0.6) 80%, transparent 100%)" }}>
          {/* Title + Live */}
          <div className="flex items-center gap-3">
            <Link href="/" className="text-white/40 hover:text-white/70 text-sm mr-2 transition-colors">&larr; Home</Link>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              <span className="mr-1">{"\u26BD"}</span>
              FIFA World Cup 2026
            </h1>
            {countdown.live && (
              <span className="px-2 py-0.5 text-xs font-bold uppercase rounded-full bg-green-500/20 text-green-400 border border-green-500/30 animate-pulse">
                LIVE
              </span>
            )}
          </div>

          {/* Countdown */}
          <div className="flex items-center gap-2 text-sm font-mono">
            {!countdown.live ? (
              <span className="text-green-400">
                {"\u26BD"} KICKOFF IN {countdown.days}d {String(countdown.hours).padStart(2, "0")}h {String(countdown.mins).padStart(2, "0")}m {String(countdown.secs).padStart(2, "0")}s
              </span>
            ) : (
              <span className="text-green-400 font-bold animate-pulse">TOURNAMENT IN PROGRESS</span>
            )}
          </div>

          {/* Stats */}
          <div className="hidden md:flex items-center gap-3 text-xs text-white/50">
            <span>104 matches</span>
            <span className="text-white/20">|</span>
            <span>16 venues</span>
            <span className="text-white/20">|</span>
            <span>48 teams</span>
            <span className="text-white/20">|</span>
            <span>3 nations</span>
            <Link href="/uc31/details" className="ml-2 px-2 py-1 rounded bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors">Details &rarr;</Link>
          </div>
        </div>
      </div>

      {/* ── Left panel — view mode ───────────────────────────────────── */}
      <div className="absolute left-4 top-20 z-20 flex flex-col gap-2">
        {VIEW_MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => { setViewMode(m.key); setSelectedStadium(null); setSelectedCountry(null) }}
            className="px-3 py-2 rounded-lg text-sm font-medium transition-all text-left"
            style={{
              background: viewMode === m.key ? "rgba(34,197,94,0.2)" : "rgba(15,23,42,0.85)",
              border: viewMode === m.key ? "1px solid rgba(34,197,94,0.5)" : "1px solid rgba(255,255,255,0.1)",
              color: viewMode === m.key ? "#22c55e" : "rgba(255,255,255,0.7)",
              backdropFilter: "blur(12px)",
            }}
          >
            <span className="mr-1.5">{m.icon}</span>
            {m.label}
          </button>
        ))}

        {/* Country filter */}
        <div className="mt-2 flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-white/30 px-1">Filter</span>
          {(["all", "USA", "MEX", "CAN"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setCountryFilter(f)}
              className="px-2 py-1 rounded text-xs transition-all text-left"
              style={{
                background: countryFilter === f ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.7)",
                border: countryFilter === f ? "1px solid rgba(255,255,255,0.3)" : "1px solid rgba(255,255,255,0.06)",
                color: f === "all" ? "rgba(255,255,255,0.8)" : COUNTRY_COLORS[f],
                backdropFilter: "blur(8px)",
              }}
            >
              {f === "all" ? "All Countries" : f === "USA" ? "\u{1F1FA}\u{1F1F8} USA" : f === "MEX" ? "\u{1F1F2}\u{1F1FD} Mexico" : "\u{1F1E8}\u{1F1E6} Canada"}
            </button>
          ))}
        </div>

        {/* Spin toggle */}
        <button
          onClick={() => setIsSpinning((p) => !p)}
          className="mt-2 px-2 py-1.5 rounded text-xs transition-all"
          style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", backdropFilter: "blur(8px)" }}
        >
          {isSpinning ? "\u23F8 Pause" : "\u25B6 Spin"}
        </button>
      </div>

      {/* ── Right panel — Stadiums list / Matches ───────────────────── */}
      {showPanel && (viewMode === "stadiums" || viewMode === "matches") && (
        <div className="absolute right-4 top-20 z-20 w-80 max-h-[calc(100vh-140px)] overflow-y-auto rounded-xl" style={{ background: "rgba(15,23,42,0.92)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {viewMode === "stadiums" && (
            <>
              <div className="px-4 py-3 border-b border-white/5">
                <h2 className="text-sm font-bold text-white">{"\u{1F3DF}\uFE0F"} 16 World Cup Venues</h2>
                <p className="text-[11px] text-white/40 mt-0.5">Sorted by capacity. Click to fly.</p>
              </div>
              <div className="divide-y divide-white/5">
                {sortedStadiums.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => flyToStadium(s)}
                    className="w-full px-4 py-2.5 text-left hover:bg-white/5 transition-colors flex items-start gap-2"
                    style={{ borderLeft: selectedStadium?.id === s.id ? `3px solid ${s.color}` : "3px solid transparent" }}
                  >
                    <span className="text-base mt-0.5">{countryFlag(s.country)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white/90 truncate">{s.name}</div>
                      <div className="text-[11px] text-white/40">{s.city}</div>
                      <div className="flex gap-3 mt-0.5 text-[10px] text-white/30">
                        <span>{s.capacity.toLocaleString()} seats</span>
                        <span>{s.matches} matches</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {viewMode === "matches" && (
            <>
              <div className="px-4 py-3 border-b border-white/5">
                <h2 className="text-sm font-bold text-white">{"\u26BD"} Match Schedule</h2>
                <p className="text-[11px] text-white/40 mt-0.5">104 matches, Jun 11 - Jul 19, 2026</p>
              </div>
              <div className="divide-y divide-white/5">
                {matches.map((m) => {
                  const d = new Date(m.date)
                  const isLive = m.status === 1
                  const isFinished = m.status === 3
                  const stageColor = STAGE_COLORS[m.stage] ?? "#94a3b8"
                  return (
                    <div
                      key={m.id}
                      className="px-4 py-2.5"
                      style={{ borderLeft: isLive ? "3px solid #22c55e" : "3px solid transparent" }}
                    >
                      {isLive && (
                        <span className="inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-green-500/20 text-green-400 border border-green-500/30 mb-1 animate-pulse">
                          LIVE
                        </span>
                      )}
                      <div className="flex items-center gap-2 text-sm text-white/90">
                        <span className="font-medium">{m.homeTeam}</span>
                        {isFinished || isLive ? (
                          <span className="font-bold text-white">{m.homeScore} - {m.awayScore}</span>
                        ) : (
                          <span className="text-white/30">vs</span>
                        )}
                        <span className="font-medium">{m.awayTeam}</span>
                      </div>
                      <div className="flex gap-2 mt-1 text-[10px] text-white/40">
                        <span>{d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        <span>{d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                        <span style={{ color: stageColor }}>{m.stage}</span>
                      </div>
                      <div className="text-[10px] text-white/30 mt-0.5">{m.venue}, {m.city}</div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Right panel toggle ───────────────────────────────────────── */}
      {(viewMode === "stadiums" || viewMode === "matches") && (
        <button
          onClick={() => setShowPanel((p) => !p)}
          className="absolute right-4 top-[calc(100vh-60px)] z-20 px-2 py-1 rounded text-xs text-white/50 hover:text-white/80 transition-colors"
          style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {showPanel ? "Hide Panel" : "Show Panel"}
        </button>
      )}

      {/* ── Fan Travel legend ────────────────────────────────────────── */}
      {showPanel && viewMode === "fanTravel" && (
        <div className="absolute right-4 top-20 z-20 w-72 rounded-xl overflow-hidden" style={{ background: "rgba(15,23,42,0.92)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="px-4 py-3 border-b border-white/5">
            <h2 className="text-sm font-bold text-white">{"\u2708\uFE0F"} Fan Travel Corridors</h2>
            <p className="text-[11px] text-white/40 mt-0.5">{FAN_CORRIDORS.length} major corridors worldwide</p>
          </div>
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto divide-y divide-white/5">
            {FAN_CORRIDORS.map((c, i) => (
              <div key={i} className="px-4 py-2 flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c.color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white/80 truncate">{c.label}</div>
                  <div className="text-[10px] text-white/30">{c.volume} volume</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Teams legend ─────────────────────────────────────────────── */}
      {showPanel && viewMode === "teams" && (
        <div className="absolute right-4 top-20 z-20 w-72 rounded-xl overflow-hidden" style={{ background: "rgba(15,23,42,0.92)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="px-4 py-3 border-b border-white/5">
            <h2 className="text-sm font-bold text-white">{"\u{1F30D}"} 48 Qualified Nations</h2>
            <p className="text-[11px] text-white/40 mt-0.5">Click a country to see details</p>
          </div>
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto divide-y divide-white/5">
            {TEAMS.map((t) => (
              <div key={t.code} className="px-4 py-1.5 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: t.color }} />
                <span className="text-xs text-white/80 font-medium w-8">{t.code}</span>
                <span className="text-xs text-white/50 flex-1 truncate">{t.name}</span>
                <span className="text-[10px] text-white/30">Grp {t.group}</span>
                <span className="text-[10px] text-white/20">{t.region}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Selected stadium detail panel ────────────────────────────── */}
      {selectedStadium && (
        <div className="absolute bottom-16 right-4 z-20 w-96 max-w-[calc(100vw-2rem)] rounded-2xl overflow-hidden" style={{ background: "rgba(15,23,42,0.95)", backdropFilter: "blur(14px)", border: `1px solid ${selectedStadium.color}44` }}>
          {/* Satellite tiles */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", width: "100%", height: 140, overflow: "hidden" }}>
            {getSatelliteTiles(selectedStadium.lat, selectedStadium.lng).map((url, i) => (
              <img
                key={i}
                src={url}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  ;(e.target as HTMLImageElement).src =
                    "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect fill='%23172033' width='100' height='100'/></svg>"
                }}
              />
            ))}
          </div>

          <div className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-white">{selectedStadium.name}</h3>
                <p className="text-sm text-white/50 mt-0.5">
                  {countryFlag(selectedStadium.country)} {selectedStadium.city}
                </p>
              </div>
              <button
                onClick={() => setSelectedStadium(null)}
                className="text-white/30 hover:text-white/70 text-lg leading-none transition-colors"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-3">
              <div className="text-center p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }}>
                <div className="text-base font-bold" style={{ color: selectedStadium.color }}>
                  {selectedStadium.capacity.toLocaleString()}
                </div>
                <div className="text-[10px] text-white/40">Capacity</div>
              </div>
              <div className="text-center p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }}>
                <div className="text-base font-bold" style={{ color: selectedStadium.color }}>
                  {selectedStadium.matches}
                </div>
                <div className="text-[10px] text-white/40">Matches</div>
              </div>
              <div className="text-center p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }}>
                <div className="text-base font-bold" style={{ color: selectedStadium.color }}>
                  {selectedStadium.country}
                </div>
                <div className="text-[10px] text-white/40">Country</div>
              </div>
            </div>

            {/* Google Maps link */}
            <a
              href={`https://www.google.com/maps/@${selectedStadium.lat},${selectedStadium.lng},800a,35y,0t/data=!3m1!1e3`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              {"\u{1F5FA}\uFE0F"} Open in Google Maps 3D
            </a>
          </div>
        </div>
      )}

      {/* ── Country info popup ───────────────────────────────────────── */}
      {countryInfo && selectedCountry && (
        <div className="absolute bottom-16 left-4 z-20 w-72 rounded-xl overflow-hidden" style={{ background: "rgba(15,23,42,0.95)", backdropFilter: "blur(14px)", border: `1px solid ${countryInfo.color ?? "rgba(255,255,255,0.1)"}` }}>
          <div className="p-4">
            <div className="flex items-start justify-between">
              <h3 className="text-sm font-bold text-white">{countryInfo.name}</h3>
              <button onClick={() => setSelectedCountry(null)} className="text-white/30 hover:text-white/70 text-lg leading-none">&times;</button>
            </div>

            {countryInfo.isHost && (
              <div className="mt-2 grid grid-cols-3 gap-2">
                <div className="text-center p-2 rounded" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="text-sm font-bold" style={{ color: countryInfo.color }}>{countryInfo.venues}</div>
                  <div className="text-[9px] text-white/40">Venues</div>
                </div>
                <div className="text-center p-2 rounded" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="text-sm font-bold" style={{ color: countryInfo.color }}>{countryInfo.totalCapacity.toLocaleString()}</div>
                  <div className="text-[9px] text-white/40">Total Seats</div>
                </div>
                <div className="text-center p-2 rounded" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="text-sm font-bold" style={{ color: countryInfo.color }}>{countryInfo.totalMatches}</div>
                  <div className="text-[9px] text-white/40">Matches</div>
                </div>
              </div>
            )}

            {countryInfo.team && (
              <div className="mt-2">
                <div className="flex gap-2 text-xs text-white/60">
                  <span>Group <strong className="text-white/90">{countryInfo.team.group}</strong></span>
                  <span className="text-white/20">|</span>
                  <span>{countryInfo.team.region}</span>
                </div>
                <div className="mt-1 flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ background: countryInfo.team.color }} />
                  <span className="text-xs text-white/50">{countryInfo.team.code}</span>
                </div>
              </div>
            )}

            {!countryInfo.isHost && !countryInfo.team && (
              <p className="mt-2 text-xs text-white/40">Not a qualified team or host nation</p>
            )}
          </div>
        </div>
      )}

      {/* ── Bottom ticker tape ───────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 z-20 overflow-hidden" style={{ background: "linear-gradient(0deg, rgba(3,7,18,0.92) 0%, rgba(3,7,18,0.6) 80%, transparent 100%)" }}>
        <div className="py-2 whitespace-nowrap animate-marquee">
          <span className="inline-block text-xs text-white/40 px-8">
            {"\u26BD"} FIFA World Cup 2026 {"\u00B7"} 16 Cities {"\u00B7"} 3 Countries {"\u00B7"} 48 Teams {"\u00B7"} June 11 {"\u2013"} July 19 {"\u00B7"} 104 Matches {"\u00B7"} MetLife Stadium Final {"\u00B7"} First 48-team World Cup {"\u00B7"} USA {"\u00B7"} Mexico {"\u00B7"} Canada
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            {"\u26BD"} FIFA World Cup 2026 {"\u00B7"} 16 Cities {"\u00B7"} 3 Countries {"\u00B7"} 48 Teams {"\u00B7"} June 11 {"\u2013"} July 19 {"\u00B7"} 104 Matches {"\u00B7"} MetLife Stadium Final {"\u00B7"} First 48-team World Cup {"\u00B7"} USA {"\u00B7"} Mexico {"\u00B7"} Canada
          </span>
        </div>
      </div>

      {/* Marquee animation */}
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  )
}

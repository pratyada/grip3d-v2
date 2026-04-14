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

interface TeamDetail {
  code: string
  name: string
  nickname: string
  confederation: string
  fifaRanking: number
  worldCupAppearances: number
  bestFinish: string
  coach: string
  captain: string
  keyPlayers: { name: string; position: string; club: string }[]
  funFacts: string[]
  teamPageUrl: string
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

// ── Team Details ────────────────────────────────────────────────────────────

const TEAM_DETAILS: Record<string, TeamDetail> = {
  USA: {
    code: "USA", name: "United States", nickname: "USMNT", confederation: "CONCACAF",
    fifaRanking: 11, worldCupAppearances: 11, bestFinish: "Semi-finals (1930)",
    coach: "Mauricio Pochettino", captain: "Christian Pulisic",
    keyPlayers: [
      { name: "Christian Pulisic", position: "Forward", club: "AC Milan" },
      { name: "Weston McKennie", position: "Midfielder", club: "Juventus" },
      { name: "Gio Reyna", position: "Midfielder", club: "Borussia Dortmund" },
      { name: "Yunus Musah", position: "Midfielder", club: "AC Milan" },
      { name: "Timothy Weah", position: "Forward", club: "Juventus" },
    ],
    funFacts: ["Host nation for 3rd time (also 1994)", "Largest sports market in the world", "Pochettino's first major international tournament as national coach"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/USA",
  },
  MEX: {
    code: "MEX", name: "Mexico", nickname: "El Tri", confederation: "CONCACAF",
    fifaRanking: 15, worldCupAppearances: 17, bestFinish: "Quarter-finals (1970, 1986)",
    coach: "Javier Aguirre", captain: "Edson Alvarez",
    keyPlayers: [
      { name: "Edson Alvarez", position: "Midfielder", club: "West Ham" },
      { name: "Hirving Lozano", position: "Forward", club: "PSV" },
      { name: "Raul Jimenez", position: "Forward", club: "Fulham" },
    ],
    funFacts: ["Estadio Azteca hosted 2 WC finals (1970, 1986)", "Most CONCACAF Gold Cup wins (12)", "16 consecutive World Cup appearances"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/MEX",
  },
  CAN: {
    code: "CAN", name: "Canada", nickname: "Les Rouges", confederation: "CONCACAF",
    fifaRanking: 43, worldCupAppearances: 2, bestFinish: "Group Stage (1986)",
    coach: "Jesse Marsch", captain: "Alphonso Davies",
    keyPlayers: [
      { name: "Alphonso Davies", position: "Defender", club: "Bayern Munich" },
      { name: "Jonathan David", position: "Forward", club: "Lille" },
      { name: "Cyle Larin", position: "Forward", club: "Real Valladolid" },
    ],
    funFacts: ["Only 2nd World Cup ever (first was 1986)", "Davies is fastest player in Bundesliga history (36.51 km/h)", "Hosted Women's World Cup in 2015"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/CAN",
  },
  CRC: {
    code: "CRC", name: "Costa Rica", nickname: "Los Ticos", confederation: "CONCACAF",
    fifaRanking: 52, worldCupAppearances: 6, bestFinish: "Quarter-finals (2014)",
    coach: "Claudio Vivas", captain: "Bryan Ruiz",
    keyPlayers: [
      { name: "Keylor Navas", position: "Goalkeeper", club: "Nottingham Forest" },
      { name: "Joel Campbell", position: "Forward", club: "Alajuelense" },
      { name: "Jewison Bennette", position: "Forward", club: "Sunderland" },
    ],
    funFacts: ["Shocked the world reaching QF in 2014 Brazil", "Known for producing top goalkeepers", "Smallest nation by population to reach WC QF"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/CRC",
  },
  JAM: {
    code: "JAM", name: "Jamaica", nickname: "Reggae Boyz", confederation: "CONCACAF",
    fifaRanking: 62, worldCupAppearances: 2, bestFinish: "Group Stage (1998)",
    coach: "Heimir Hallgrimsson", captain: "Andre Blake",
    keyPlayers: [
      { name: "Leon Bailey", position: "Forward", club: "Aston Villa" },
      { name: "Michail Antonio", position: "Forward", club: "West Ham" },
      { name: "Andre Blake", position: "Goalkeeper", club: "Philadelphia Union" },
    ],
    funFacts: ["First Caribbean nation to qualify for a World Cup (1998)", "Reggae Boyz inspired a national movement in 1998", "Several players have dual nationality options from England"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/JAM",
  },
  HON: {
    code: "HON", name: "Honduras", nickname: "Los Catrachos", confederation: "CONCACAF",
    fifaRanking: 76, worldCupAppearances: 4, bestFinish: "Group Stage (1982, 2010, 2014)",
    coach: "Reinaldo Rueda", captain: "Maynor Figueroa",
    keyPlayers: [
      { name: "Alberth Elis", position: "Forward", club: "Bordeaux" },
      { name: "Romell Quioto", position: "Forward", club: "CF Montreal" },
      { name: "Andy Najar", position: "Defender", club: "D.C. United" },
    ],
    funFacts: ["Honduras qualified for 3 World Cups in 4 cycles (2010-2014)", "Known for passionate home support in San Pedro Sula", "Produced legendary coach Chelato Ucles"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/HON",
  },
  ENG: {
    code: "ENG", name: "England", nickname: "Three Lions", confederation: "UEFA",
    fifaRanking: 4, worldCupAppearances: 16, bestFinish: "Champions (1966)",
    coach: "Thomas Tuchel", captain: "Harry Kane",
    keyPlayers: [
      { name: "Harry Kane", position: "Forward", club: "Bayern Munich" },
      { name: "Jude Bellingham", position: "Midfielder", club: "Real Madrid" },
      { name: "Bukayo Saka", position: "Forward", club: "Arsenal" },
      { name: "Phil Foden", position: "Midfielder", club: "Manchester City" },
      { name: "Declan Rice", position: "Midfielder", club: "Arsenal" },
    ],
    funFacts: ["Invented the sport of football", "1 World Cup title (1966 at Wembley)", "Tuchel is first German to manage England"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/ENG",
  },
  GER: {
    code: "GER", name: "Germany", nickname: "Die Mannschaft", confederation: "UEFA",
    fifaRanking: 13, worldCupAppearances: 20, bestFinish: "Champions (1954, 1974, 1990, 2014)",
    coach: "Julian Nagelsmann", captain: "Ilkay Gundogan",
    keyPlayers: [
      { name: "Jamal Musiala", position: "Midfielder", club: "Bayern Munich" },
      { name: "Florian Wirtz", position: "Midfielder", club: "Bayer Leverkusen" },
      { name: "Kai Havertz", position: "Forward", club: "Arsenal" },
    ],
    funFacts: ["4 World Cup titles (tied 2nd most)", "Most European Championship wins (3)", "Youngest squad rebuild under Nagelsmann"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/GER",
  },
  FRA: {
    code: "FRA", name: "France", nickname: "Les Bleus", confederation: "UEFA",
    fifaRanking: 2, worldCupAppearances: 16, bestFinish: "Champions (1998, 2018)",
    coach: "Didier Deschamps", captain: "Kylian Mbappe",
    keyPlayers: [
      { name: "Kylian Mbappe", position: "Forward", club: "Real Madrid" },
      { name: "Antoine Griezmann", position: "Forward", club: "Atletico Madrid" },
      { name: "Aurelien Tchouameni", position: "Midfielder", club: "Real Madrid" },
      { name: "William Saliba", position: "Defender", club: "Arsenal" },
    ],
    funFacts: ["2018 champions, 2022 runners-up", "Deschamps is longest-serving France coach", "Mbappe scored hat-trick in 2022 WC final"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/FRA",
  },
  ESP: {
    code: "ESP", name: "Spain", nickname: "La Roja", confederation: "UEFA",
    fifaRanking: 3, worldCupAppearances: 16, bestFinish: "Champions (2010)",
    coach: "Luis de la Fuente", captain: "Alvaro Morata",
    keyPlayers: [
      { name: "Lamine Yamal", position: "Forward", club: "Barcelona" },
      { name: "Pedri", position: "Midfielder", club: "Barcelona" },
      { name: "Rodri", position: "Midfielder", club: "Manchester City" },
      { name: "Nico Williams", position: "Forward", club: "Athletic Bilbao" },
    ],
    funFacts: ["2010 champions with tiki-taka style", "Euro 2024 champions", "Lamine Yamal youngest ever Euros goalscorer at 16"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/ESP",
  },
  POR: {
    code: "POR", name: "Portugal", nickname: "A Selecao", confederation: "UEFA",
    fifaRanking: 6, worldCupAppearances: 8, bestFinish: "3rd Place (1966)",
    coach: "Roberto Martinez", captain: "Cristiano Ronaldo",
    keyPlayers: [
      { name: "Cristiano Ronaldo", position: "Forward", club: "Al Nassr" },
      { name: "Bruno Fernandes", position: "Midfielder", club: "Manchester United" },
      { name: "Bernardo Silva", position: "Midfielder", club: "Manchester City" },
      { name: "Rafael Leao", position: "Forward", club: "AC Milan" },
    ],
    funFacts: ["Ronaldo's record 6th World Cup", "Euro 2016 champions", "Ronaldo is all-time top international goalscorer"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/POR",
  },
  NED: {
    code: "NED", name: "Netherlands", nickname: "Oranje", confederation: "UEFA",
    fifaRanking: 7, worldCupAppearances: 11, bestFinish: "Runners-up (1974, 1978, 2010)",
    coach: "Ronald Koeman", captain: "Virgil van Dijk",
    keyPlayers: [
      { name: "Virgil van Dijk", position: "Defender", club: "Liverpool" },
      { name: "Frenkie de Jong", position: "Midfielder", club: "Barcelona" },
      { name: "Cody Gakpo", position: "Forward", club: "Liverpool" },
    ],
    funFacts: ["3 WC finals, 0 wins - the best team to never win it", "Invented Total Football under Rinus Michels", "Johan Cruyff's legacy still shapes Dutch football"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/NED",
  },
  ITA: {
    code: "ITA", name: "Italy", nickname: "Gli Azzurri", confederation: "UEFA",
    fifaRanking: 9, worldCupAppearances: 18, bestFinish: "Champions (1934, 1938, 1982, 2006)",
    coach: "Luciano Spalletti", captain: "Gianluigi Donnarumma",
    keyPlayers: [
      { name: "Gianluigi Donnarumma", position: "Goalkeeper", club: "PSG" },
      { name: "Federico Chiesa", position: "Forward", club: "Liverpool" },
      { name: "Nicolo Barella", position: "Midfielder", club: "Inter Milan" },
    ],
    funFacts: ["4 World Cup titles (tied with Germany)", "Failed to qualify in 2018 and 2022", "Euro 2020 champions"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/ITA",
  },
  BEL: {
    code: "BEL", name: "Belgium", nickname: "Red Devils", confederation: "UEFA",
    fifaRanking: 5, worldCupAppearances: 14, bestFinish: "3rd Place (2018)",
    coach: "Domenico Tedesco", captain: "Kevin De Bruyne",
    keyPlayers: [
      { name: "Kevin De Bruyne", position: "Midfielder", club: "Manchester City" },
      { name: "Romelu Lukaku", position: "Forward", club: "Roma" },
      { name: "Jeremy Doku", position: "Forward", club: "Manchester City" },
    ],
    funFacts: ["Golden generation era with De Bruyne, Lukaku, Hazard", "3rd place in 2018 Russia", "Highest FIFA ranking ever reached: #1"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/BEL",
  },
  CRO: {
    code: "CRO", name: "Croatia", nickname: "Vatreni (The Blazers)", confederation: "UEFA",
    fifaRanking: 8, worldCupAppearances: 7, bestFinish: "Runners-up (2018)",
    coach: "Zlatko Dalic", captain: "Luka Modric",
    keyPlayers: [
      { name: "Luka Modric", position: "Midfielder", club: "Real Madrid" },
      { name: "Mateo Kovacic", position: "Midfielder", club: "Manchester City" },
      { name: "Josko Gvardiol", position: "Defender", club: "Manchester City" },
    ],
    funFacts: ["Runners-up in 2018, 3rd in 2022", "Population of only 3.9 million", "Modric won Ballon d'Or in 2018"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/CRO",
  },
  DEN: {
    code: "DEN", name: "Denmark", nickname: "Danish Dynamite", confederation: "UEFA",
    fifaRanking: 21, worldCupAppearances: 6, bestFinish: "Quarter-finals (1998)",
    coach: "Kasper Hjulmand", captain: "Simon Kjaer",
    keyPlayers: [
      { name: "Christian Eriksen", position: "Midfielder", club: "Manchester United" },
      { name: "Rasmus Hojlund", position: "Forward", club: "Manchester United" },
      { name: "Pierre-Emile Hojbjerg", position: "Midfielder", club: "Marseille" },
    ],
    funFacts: ["Won Euro 1992 as a last-minute replacement team", "Eriksen's miraculous return after cardiac arrest at Euro 2020", "Known for strong team cohesion"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/DEN",
  },
  SUI: {
    code: "SUI", name: "Switzerland", nickname: "Nati", confederation: "UEFA",
    fifaRanking: 19, worldCupAppearances: 12, bestFinish: "Quarter-finals (1934, 1938, 1954)",
    coach: "Murat Yakin", captain: "Granit Xhaka",
    keyPlayers: [
      { name: "Granit Xhaka", position: "Midfielder", club: "Bayer Leverkusen" },
      { name: "Manuel Akanji", position: "Defender", club: "Manchester City" },
      { name: "Breel Embolo", position: "Forward", club: "Monaco" },
    ],
    funFacts: ["Reached Euro 2024 quarter-finals", "Knocked out France in Euro 2020 on penalties", "Multi-lingual squad with 4 national languages"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/SUI",
  },
  AUT: {
    code: "AUT", name: "Austria", nickname: "Das Team", confederation: "UEFA",
    fifaRanking: 22, worldCupAppearances: 8, bestFinish: "3rd Place (1954)",
    coach: "Ralf Rangnick", captain: "David Alaba",
    keyPlayers: [
      { name: "David Alaba", position: "Defender", club: "Real Madrid" },
      { name: "Marcel Sabitzer", position: "Midfielder", club: "Borussia Dortmund" },
      { name: "Christoph Baumgartner", position: "Midfielder", club: "RB Leipzig" },
    ],
    funFacts: ["Ralf Rangnick revolutionized Austrian football", "Beat Turkey to reach Euro 2024 knockout rounds", "Known as the 'Godfather of Gegenpressing' coaching style"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/AUT",
  },
  POL: {
    code: "POL", name: "Poland", nickname: "Bialo-czerwoni (White and Reds)", confederation: "UEFA",
    fifaRanking: 28, worldCupAppearances: 9, bestFinish: "3rd Place (1974, 1982)",
    coach: "Michal Probierz", captain: "Robert Lewandowski",
    keyPlayers: [
      { name: "Robert Lewandowski", position: "Forward", club: "Barcelona" },
      { name: "Piotr Zielinski", position: "Midfielder", club: "Inter Milan" },
      { name: "Nicola Zalewski", position: "Midfielder", club: "Roma" },
    ],
    funFacts: ["Lewandowski is Poland's all-time top scorer", "Strong 1970s-80s generation reached two 3rd places", "One of the most passionate fan bases in Europe"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/POL",
  },
  SRB: {
    code: "SRB", name: "Serbia", nickname: "Orlovi (Eagles)", confederation: "UEFA",
    fifaRanking: 33, worldCupAppearances: 3, bestFinish: "Group Stage (2006, 2010, 2018, 2022 as Serbia)",
    coach: "Dragan Stojkovic", captain: "Dusan Tadic",
    keyPlayers: [
      { name: "Dusan Vlahovic", position: "Forward", club: "Juventus" },
      { name: "Aleksandar Mitrovic", position: "Forward", club: "Al Hilal" },
      { name: "Sergej Milinkovic-Savic", position: "Midfielder", club: "Al Hilal" },
    ],
    funFacts: ["As Yugoslavia, reached WC semi-finals in 1930 and 1962", "Incredibly talented generation of attacking players", "Belgrade is one of oldest cities in Europe"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/SRB",
  },
  SCO: {
    code: "SCO", name: "Scotland", nickname: "Tartan Army", confederation: "UEFA",
    fifaRanking: 39, worldCupAppearances: 9, bestFinish: "Group Stage (8 times)",
    coach: "Steve Clarke", captain: "Andy Robertson",
    keyPlayers: [
      { name: "Andy Robertson", position: "Defender", club: "Liverpool" },
      { name: "John McGinn", position: "Midfielder", club: "Aston Villa" },
      { name: "Scott McTominay", position: "Midfielder", club: "Napoli" },
    ],
    funFacts: ["First World Cup since 1998 if they qualify", "Tartan Army fans are known for friendliness", "Played in the very first international football match (1872 vs England)"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/SCO",
  },
  UKR: {
    code: "UKR", name: "Ukraine", nickname: "Zbirna", confederation: "UEFA",
    fifaRanking: 25, worldCupAppearances: 2, bestFinish: "Quarter-finals (2006)",
    coach: "Serhiy Rebrov", captain: "Andriy Yarmolenko",
    keyPlayers: [
      { name: "Mykhailo Mudryk", position: "Forward", club: "Chelsea" },
      { name: "Oleksandr Zinchenko", position: "Defender", club: "Arsenal" },
      { name: "Artem Dovbyk", position: "Forward", club: "Roma" },
    ],
    funFacts: ["Playing through wartime conditions since 2022", "Shevchenko led them to QF in 2006", "Domestic league continues despite conflict"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/UKR",
  },
  TUR: {
    code: "TUR", name: "Turkey", nickname: "Ay-Yildizlilar (Crescent-Stars)", confederation: "UEFA",
    fifaRanking: 26, worldCupAppearances: 3, bestFinish: "3rd Place (2002)",
    coach: "Vincenzo Montella", captain: "Hakan Calhanoglu",
    keyPlayers: [
      { name: "Hakan Calhanoglu", position: "Midfielder", club: "Inter Milan" },
      { name: "Arda Guler", position: "Midfielder", club: "Real Madrid" },
      { name: "Kenan Yildiz", position: "Forward", club: "Juventus" },
    ],
    funFacts: ["Sensational 3rd place in 2002 Korea/Japan", "Arda Guler dubbed 'Turkish Messi'", "Reached Euro 2024 quarter-finals"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/TUR",
  },
  WAL: {
    code: "WAL", name: "Wales", nickname: "Dragons", confederation: "UEFA",
    fifaRanking: 45, worldCupAppearances: 2, bestFinish: "Quarter-finals (1958)",
    coach: "Craig Bellamy", captain: "Aaron Ramsey",
    keyPlayers: [
      { name: "Brennan Johnson", position: "Forward", club: "Tottenham" },
      { name: "Harry Wilson", position: "Forward", club: "Fulham" },
      { name: "Ethan Ampadu", position: "Defender", club: "Leeds United" },
    ],
    funFacts: ["2022 was first WC since 1958", "Gareth Bale era reignited Welsh football", "Euro 2016 semi-finalists shocked the world"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/WAL",
  },
  ARG: {
    code: "ARG", name: "Argentina", nickname: "La Albiceleste", confederation: "CONMEBOL",
    fifaRanking: 1, worldCupAppearances: 18, bestFinish: "Champions (1978, 1986, 2022)",
    coach: "Lionel Scaloni", captain: "Lionel Messi",
    keyPlayers: [
      { name: "Lionel Messi", position: "Forward", club: "Inter Miami" },
      { name: "Julian Alvarez", position: "Forward", club: "Atletico Madrid" },
      { name: "Enzo Fernandez", position: "Midfielder", club: "Chelsea" },
      { name: "Rodrigo De Paul", position: "Midfielder", club: "Atletico Madrid" },
    ],
    funFacts: ["Defending champions (Qatar 2022)", "Messi's final World Cup", "3 WC titles: 1978, 1986, 2022"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/ARG",
  },
  BRA: {
    code: "BRA", name: "Brazil", nickname: "Selecao", confederation: "CONMEBOL",
    fifaRanking: 5, worldCupAppearances: 22, bestFinish: "Champions (1958, 1962, 1970, 1994, 2002)",
    coach: "Dorival Junior", captain: "Marquinhos",
    keyPlayers: [
      { name: "Vinicius Jr", position: "Forward", club: "Real Madrid" },
      { name: "Rodrygo", position: "Forward", club: "Real Madrid" },
      { name: "Marquinhos", position: "Defender", club: "PSG" },
      { name: "Casemiro", position: "Midfielder", club: "Manchester United" },
    ],
    funFacts: ["Record 5 World Cup titles", "Most World Cup appearances (22 — never missed one)", "Only team to have played in every World Cup"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/BRA",
  },
  COL: {
    code: "COL", name: "Colombia", nickname: "Los Cafeteros", confederation: "CONMEBOL",
    fifaRanking: 12, worldCupAppearances: 7, bestFinish: "Quarter-finals (2014)",
    coach: "Nestor Lorenzo", captain: "James Rodriguez",
    keyPlayers: [
      { name: "Luis Diaz", position: "Forward", club: "Liverpool" },
      { name: "James Rodriguez", position: "Midfielder", club: "Rayo Vallecano" },
      { name: "Jhon Arias", position: "Forward", club: "Fluminense" },
    ],
    funFacts: ["Copa America 2024 runners-up", "James Rodriguez was Golden Boot winner in 2014 WC", "Carlos Valderrama's hair is iconic WC imagery"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/COL",
  },
  URU: {
    code: "URU", name: "Uruguay", nickname: "La Celeste", confederation: "CONMEBOL",
    fifaRanking: 14, worldCupAppearances: 14, bestFinish: "Champions (1930, 1950)",
    coach: "Marcelo Bielsa", captain: "Federico Valverde",
    keyPlayers: [
      { name: "Federico Valverde", position: "Midfielder", club: "Real Madrid" },
      { name: "Darwin Nunez", position: "Forward", club: "Liverpool" },
      { name: "Ronald Araujo", position: "Defender", club: "Barcelona" },
    ],
    funFacts: ["Won the first ever World Cup in 1930", "Population of only 3.5 million — smallest 2-time champion", "Bielsa brings his intense tactical philosophy"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/URU",
  },
  ECU: {
    code: "ECU", name: "Ecuador", nickname: "La Tri", confederation: "CONMEBOL",
    fifaRanking: 30, worldCupAppearances: 4, bestFinish: "Round of 16 (2006)",
    coach: "Sebastian Beccacece", captain: "Enner Valencia",
    keyPlayers: [
      { name: "Moises Caicedo", position: "Midfielder", club: "Chelsea" },
      { name: "Enner Valencia", position: "Forward", club: "Internacional" },
      { name: "Piero Hincapie", position: "Defender", club: "Bayer Leverkusen" },
    ],
    funFacts: ["Caicedo is one of world's most expensive midfielders", "Play home qualifiers at 2,850m altitude in Quito", "Enner Valencia scored in 3 consecutive WC matches"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/ECU",
  },
  CHI: {
    code: "CHI", name: "Chile", nickname: "La Roja", confederation: "CONMEBOL",
    fifaRanking: 35, worldCupAppearances: 10, bestFinish: "3rd Place (1962)",
    coach: "Ricardo Gareca", captain: "Claudio Bravo",
    keyPlayers: [
      { name: "Alexis Sanchez", position: "Forward", club: "Marseille" },
      { name: "Ben Brereton Diaz", position: "Forward", club: "Sheffield United" },
      { name: "Erick Pulgar", position: "Midfielder", club: "Flamengo" },
    ],
    funFacts: ["Won back-to-back Copa Americas in 2015, 2016", "Failed to qualify for 2018 and 2022 WC", "Hosted and placed 3rd in 1962 World Cup"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/CHI",
  },
  PAR: {
    code: "PAR", name: "Paraguay", nickname: "La Albirroja", confederation: "CONMEBOL",
    fifaRanking: 50, worldCupAppearances: 9, bestFinish: "Quarter-finals (2010)",
    coach: "Alfaro Moreno", captain: "Gustavo Gomez",
    keyPlayers: [
      { name: "Miguel Almiron", position: "Midfielder", club: "Newcastle" },
      { name: "Gustavo Gomez", position: "Defender", club: "Palmeiras" },
      { name: "Julio Enciso", position: "Forward", club: "Brighton" },
    ],
    funFacts: ["Reached QF in 2010 with legendary goalkeeper Chilavert-era legacy", "Known for defensive resilience", "Enciso is one of the most exciting young South American talents"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/PAR",
  },
  PER: {
    code: "PER", name: "Peru", nickname: "La Blanquirroja", confederation: "CONMEBOL",
    fifaRanking: 32, worldCupAppearances: 6, bestFinish: "Quarter-finals (1970, 1978)",
    coach: "Jorge Fossati", captain: "Paolo Guerrero",
    keyPlayers: [
      { name: "Paolo Guerrero", position: "Forward", club: "Alianza Lima" },
      { name: "Andre Carrillo", position: "Forward", club: "Al Hilal" },
      { name: "Renato Tapia", position: "Midfielder", club: "Celta Vigo" },
    ],
    funFacts: ["Returned to WC in 2018 after 36-year absence", "Passionate fans known as 'La Blanquirroja'", "1970s team was one of the most exciting in South American history"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/PER",
  },
  BOL: {
    code: "BOL", name: "Bolivia", nickname: "La Verde", confederation: "CONMEBOL",
    fifaRanking: 83, worldCupAppearances: 4, bestFinish: "Group Stage (1930, 1950, 1994)",
    coach: "Oscar Villegas", captain: "Marcelo Moreno Martins",
    keyPlayers: [
      { name: "Marcelo Moreno Martins", position: "Forward", club: "Always Ready" },
      { name: "Ramiro Vaca", position: "Midfielder", club: "The Strongest" },
      { name: "Carlos Lampe", position: "Goalkeeper", club: "Bolivar" },
    ],
    funFacts: ["Play home matches at 3,640m altitude in La Paz", "Highest altitude national stadium in the world (Estadio Hernando Siles)", "Won Copa America in 1963 as hosts"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/BOL",
  },
  VEN: {
    code: "VEN", name: "Venezuela", nickname: "La Vinotinto", confederation: "CONMEBOL",
    fifaRanking: 55, worldCupAppearances: 1, bestFinish: "First World Cup appearance",
    coach: "Fernando Batista", captain: "Tomas Rincon",
    keyPlayers: [
      { name: "Salomon Rondon", position: "Forward", club: "Pachuca" },
      { name: "Yeferson Soteldo", position: "Forward", club: "Santos" },
      { name: "Yangel Herrera", position: "Midfielder", club: "Girona" },
    ],
    funFacts: ["Only CONMEBOL team that had never qualified for a World Cup until now", "Baseball traditionally more popular than football in Venezuela", "Copa America 2024 quarter-finalists showed rising quality"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/VEN",
  },
  JPN: {
    code: "JPN", name: "Japan", nickname: "Samurai Blue", confederation: "AFC",
    fifaRanking: 18, worldCupAppearances: 7, bestFinish: "Round of 16 (2002, 2010, 2018, 2022)",
    coach: "Hajime Moriyasu", captain: "Wataru Endo",
    keyPlayers: [
      { name: "Takefusa Kubo", position: "Forward", club: "Real Sociedad" },
      { name: "Kaoru Mitoma", position: "Forward", club: "Brighton" },
      { name: "Wataru Endo", position: "Midfielder", club: "Liverpool" },
    ],
    funFacts: ["Fans clean the stadium after every match", "Beat Germany and Spain in 2022 WC group stage", "One of Asia's most consistent WC performers"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/JPN",
  },
  KOR: {
    code: "KOR", name: "South Korea", nickname: "Taegeuk Warriors", confederation: "AFC",
    fifaRanking: 23, worldCupAppearances: 11, bestFinish: "4th Place (2002)",
    coach: "Hong Myung-bo", captain: "Son Heung-min",
    keyPlayers: [
      { name: "Son Heung-min", position: "Forward", club: "Tottenham" },
      { name: "Kim Min-jae", position: "Defender", club: "Bayern Munich" },
      { name: "Lee Kang-in", position: "Midfielder", club: "PSG" },
    ],
    funFacts: ["4th place finish in 2002 as co-hosts — best ever Asian result", "Son is Asia's greatest ever player in the Premier League", "11 consecutive WC qualifications"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/KOR",
  },
  KSA: {
    code: "KSA", name: "Saudi Arabia", nickname: "The Green Falcons", confederation: "AFC",
    fifaRanking: 56, worldCupAppearances: 7, bestFinish: "Round of 16 (1994)",
    coach: "Herve Renard", captain: "Salman Al-Faraj",
    keyPlayers: [
      { name: "Salem Al-Dawsari", position: "Forward", club: "Al Hilal" },
      { name: "Salman Al-Faraj", position: "Midfielder", club: "Al Hilal" },
      { name: "Mohammed Al-Owais", position: "Goalkeeper", club: "Al Hilal" },
    ],
    funFacts: ["Beat Argentina 2-1 in 2022 WC group stage — one of biggest upsets ever", "Saudi Pro League attracted Ronaldo, Neymar, Benzema", "King declared national holiday after 2022 Argentina win"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/KSA",
  },
  AUS: {
    code: "AUS", name: "Australia", nickname: "Socceroos", confederation: "AFC",
    fifaRanking: 24, worldCupAppearances: 6, bestFinish: "Round of 16 (2006, 2022)",
    coach: "Tony Popovic", captain: "Mat Ryan",
    keyPlayers: [
      { name: "Mat Ryan", position: "Goalkeeper", club: "Roma" },
      { name: "Jackson Irvine", position: "Midfielder", club: "St. Pauli" },
      { name: "Riley McGree", position: "Midfielder", club: "Middlesbrough" },
    ],
    funFacts: ["Only OFC-to-AFC confederation switch in football history", "Beat Peru in intercontinental playoff to reach 2022 WC", "Tim Cahill's bicycle kick vs Netherlands is iconic WC moment"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/AUS",
  },
  IRN: {
    code: "IRN", name: "Iran", nickname: "Team Melli", confederation: "AFC",
    fifaRanking: 20, worldCupAppearances: 6, bestFinish: "Group Stage (1978, 1998, 2006, 2014, 2018, 2022)",
    coach: "Amir Ghalenoei", captain: "Alireza Jahanbakhsh",
    keyPlayers: [
      { name: "Mehdi Taremi", position: "Forward", club: "Inter Milan" },
      { name: "Sardar Azmoun", position: "Forward", club: "Roma" },
      { name: "Alireza Jahanbakhsh", position: "Forward", club: "Feyenoord" },
    ],
    funFacts: ["Asia's most successful qualifying team historically", "Beat USA 2-1 in politically charged 1998 WC match", "Passionate fan culture — Azadi Stadium holds 78,000"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/IRN",
  },
  QAT: {
    code: "QAT", name: "Qatar", nickname: "The Maroons", confederation: "AFC",
    fifaRanking: 34, worldCupAppearances: 2, bestFinish: "Group Stage (2022)",
    coach: "Carlos Queiroz", captain: "Hassan Al-Haydos",
    keyPlayers: [
      { name: "Akram Afif", position: "Forward", club: "Al Sadd" },
      { name: "Almoez Ali", position: "Forward", club: "Al Duhail" },
      { name: "Hassan Al-Haydos", position: "Midfielder", club: "Al Sadd" },
    ],
    funFacts: ["Hosted 2022 WC — first Middle Eastern host", "Won Asian Cup in 2019 and 2023", "Invested heavily in football academy Aspire since 2004"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/QAT",
  },
  IRQ: {
    code: "IRQ", name: "Iraq", nickname: "Lions of Mesopotamia", confederation: "AFC",
    fifaRanking: 63, worldCupAppearances: 2, bestFinish: "Group Stage (1986)",
    coach: "Jesus Casas", captain: "Mohanad Ali",
    keyPlayers: [
      { name: "Mohanad Ali", position: "Forward", club: "Al Wehda" },
      { name: "Ali Adnan", position: "Defender", club: "Al Duhail" },
      { name: "Ibrahim Bayesh", position: "Midfielder", club: "Al Quwa Al Jawiya" },
    ],
    funFacts: ["Won Asian Cup in 2007 during wartime — one of sport's greatest stories", "First WC appearance since 1986", "Football united the nation through decades of conflict"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/IRQ",
  },
  UZB: {
    code: "UZB", name: "Uzbekistan", nickname: "White Wolves", confederation: "AFC",
    fifaRanking: 64, worldCupAppearances: 1, bestFinish: "First World Cup appearance",
    coach: "Srecko Katanec", captain: "Eldor Shomurodov",
    keyPlayers: [
      { name: "Eldor Shomurodov", position: "Forward", club: "Roma" },
      { name: "Abbosbek Fayzullaev", position: "Midfielder", club: "CSKA Moscow" },
      { name: "Otabek Shukurov", position: "Midfielder", club: "Al Sadd" },
    ],
    funFacts: ["First ever World Cup qualification", "Nearly qualified multiple times, heartbreaking near-misses", "Silk Road nation bringing Central Asian football to world stage"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/UZB",
  },
  MAR: {
    code: "MAR", name: "Morocco", nickname: "Atlas Lions", confederation: "CAF",
    fifaRanking: 10, worldCupAppearances: 7, bestFinish: "Semi-finals (2022)",
    coach: "Walid Regragui", captain: "Romain Saiss",
    keyPlayers: [
      { name: "Achraf Hakimi", position: "Defender", club: "PSG" },
      { name: "Hakim Ziyech", position: "Midfielder", club: "Galatasaray" },
      { name: "Youssef En-Nesyri", position: "Forward", club: "Fenerbahce" },
    ],
    funFacts: ["First African team in WC semi-finals (2022)", "Beat Belgium, Spain, and Portugal in 2022 run", "Huge diaspora fan support across Europe"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/MAR",
  },
  NGA: {
    code: "NGA", name: "Nigeria", nickname: "Super Eagles", confederation: "CAF",
    fifaRanking: 36, worldCupAppearances: 7, bestFinish: "Round of 16 (1994, 1998, 2014)",
    coach: "Finidi George", captain: "William Troost-Ekong",
    keyPlayers: [
      { name: "Victor Osimhen", position: "Forward", club: "Napoli" },
      { name: "Samuel Chukwueze", position: "Forward", club: "AC Milan" },
      { name: "Alex Iwobi", position: "Midfielder", club: "Fulham" },
    ],
    funFacts: ["Super Eagles have Africa's most WC Round of 16 appearances", "Nigerian jersey is always one of the best-selling at WC", "Osimhen is one of world's most feared strikers"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/NGA",
  },
  SEN: {
    code: "SEN", name: "Senegal", nickname: "Lions of Teranga", confederation: "CAF",
    fifaRanking: 17, worldCupAppearances: 3, bestFinish: "Quarter-finals (2002)",
    coach: "Aliou Cisse", captain: "Kalidou Koulibaly",
    keyPlayers: [
      { name: "Sadio Mane", position: "Forward", club: "Al Nassr" },
      { name: "Kalidou Koulibaly", position: "Defender", club: "Al Hilal" },
      { name: "Ismaila Sarr", position: "Forward", club: "Crystal Palace" },
    ],
    funFacts: ["2022 AFCON champions — first ever continental title", "Beat France in 2002 WC opening match as debutants", "Teranga means hospitality in Wolof"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/SEN",
  },
  CMR: {
    code: "CMR", name: "Cameroon", nickname: "Indomitable Lions", confederation: "CAF",
    fifaRanking: 47, worldCupAppearances: 8, bestFinish: "Quarter-finals (1990)",
    coach: "Marc Brys", captain: "Vincent Aboubakar",
    keyPlayers: [
      { name: "Andre-Frank Zambo Anguissa", position: "Midfielder", club: "Napoli" },
      { name: "Eric Maxim Choupo-Moting", position: "Forward", club: "Bayern Munich" },
      { name: "Vincent Aboubakar", position: "Forward", club: "Besiktas" },
    ],
    funFacts: ["Roger Milla's iconic 1990 WC corner flag dance", "Most WC appearances by an African team (8)", "Beat Argentina in 1990 WC opening match"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/CMR",
  },
  EGY: {
    code: "EGY", name: "Egypt", nickname: "The Pharaohs", confederation: "CAF",
    fifaRanking: 37, worldCupAppearances: 4, bestFinish: "Group Stage (1934, 1990, 2018)",
    coach: "Hossam Hassan", captain: "Mohamed Salah",
    keyPlayers: [
      { name: "Mohamed Salah", position: "Forward", club: "Liverpool" },
      { name: "Omar Marmoush", position: "Forward", club: "Eintracht Frankfurt" },
      { name: "Mohamed Elneny", position: "Midfielder", club: "Al Ahly" },
    ],
    funFacts: ["Record 7-time AFCON champions", "Salah is one of the best players in Premier League history", "First African team to play in a World Cup (1934)"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/EGY",
  },
  GHA: {
    code: "GHA", name: "Ghana", nickname: "Black Stars", confederation: "CAF",
    fifaRanking: 44, worldCupAppearances: 4, bestFinish: "Quarter-finals (2010)",
    coach: "Otto Addo", captain: "Andre Ayew",
    keyPlayers: [
      { name: "Mohammed Kudus", position: "Midfielder", club: "West Ham" },
      { name: "Thomas Partey", position: "Midfielder", club: "Arsenal" },
      { name: "Andre Ayew", position: "Forward", club: "Le Havre" },
    ],
    funFacts: ["Missed 2010 semi-finals by Suarez's infamous handball on the line", "Kudus is one of Africa's most exciting talents", "Asamoah Gyan's penalty miss remains heartbreaking WC moment"],
    teamPageUrl: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams/GHA",
  },
}

// ── News Sources ────────────────────────────────────────────────────────────

const NEWS_SOURCES = [
  { label: "FIFA Official", url: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026", icon: "\u26BD" },
  { label: "Latest News", url: "https://news.google.com/search?q=FIFA+World+Cup+2026", icon: "\u{1F4F0}" },
  { label: "ESPN Coverage", url: "https://www.espn.com/soccer/FIFA-World-Cup", icon: "\u{1F4FA}" },
  { label: "BBC Sport", url: "https://www.bbc.com/sport/football/world-cup", icon: "\u{1F3F4}" },
  { label: "r/worldcup", url: "https://www.reddit.com/r/worldcup/", icon: "\u{1F4AC}" },
  { label: "Tickets", url: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/tickets", icon: "\u{1F3AB}" },
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

  const [viewMode, setViewMode] = useState<ViewMode>("teams")
  const [countryFilter, setCountryFilter] = useState<CountryFilter>("all")
  const [selectedStadium, setSelectedStadium] = useState<Stadium | null>(null)
  const [countries, setCountries] = useState<CountryFeature[]>([])
  const [hoveredCountry, setHoveredCountry] = useState<CountryFeature | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<CountryFeature | null>(null)
  const [matches, setMatches] = useState<MatchData[]>(SAMPLE_MATCHES)
  const [isSpinning, setIsSpinning] = useState(true)
  const [showPanel, setShowPanel] = useState(false)
  const [globeReady, setGlobeReady] = useState(false)
  const [showNewsPanel, setShowNewsPanel] = useState(false)

  const [isWhiteLabel, setIsWhiteLabel] = useState(false)
  useEffect(() => {
    if (typeof window !== "undefined") setIsWhiteLabel(window.location.hostname === "fifa2026.yprateek.com")
  }, [])

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
      setGlobeReady(true)
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
  }, [viewMode, countryFilter, applyStadiums, applyArcs, applyTeamPoints, globeReady])

  // ── Sync country polygons ─────────────────────────────────────────────
  useEffect(() => {
    if (!globeInst.current || !countries.length) return
    applyCountries(globeInst.current, countries, hoveredCountry, selectedCountry)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countries, hoveredCountry, selectedCountry, viewMode, globeReady])

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
    const detail = team ? TEAM_DETAILS[team.code] ?? null : null
    if (isHost) {
      const key = name === "United States" ? "USA" : name === "Mexico" ? "MEX" : "CAN"
      const venues = STADIUMS.filter((s) => s.country === key)
      const totalCap = venues.reduce((s, v) => s + v.capacity, 0)
      const totalMatches = venues.reduce((s, v) => s + v.matches, 0)
      return { name, isHost: true as const, venues: venues.length, totalCapacity: totalCap, totalMatches, team, detail, color: COUNTRY_COLORS[key] }
    }
    if (team) return { name, isHost: false as const, team, detail, color: team.color }
    return { name, isHost: false as const, team: null, detail: null, color: null }
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
            {isWhiteLabel && (
              <a href="https://yprateek.com" target="_blank" rel="noopener noreferrer"
                className="ml-1 px-2 py-1 rounded text-xs font-semibold transition-colors hidden sm:flex items-center gap-1"
                style={{ borderColor: "rgba(34,197,94,0.5)", border: "1px solid rgba(34,197,94,0.5)", color: "#4ade80", background: "rgba(34,197,94,0.08)" }}>
                <span>&larr;</span><span>yprateek.com</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── BIG KICKOFF COUNTDOWN (top-center hero) ──────────────────── */}
      {!countdown.live && (
        <div className="absolute z-20 pointer-events-none" style={{ top: 60, left: "50%", transform: "translateX(-50%)" }}>
          <div className="flex flex-col items-center" style={{
            background: "linear-gradient(180deg, rgba(0,15,5,0.88) 0%, rgba(0,30,10,0.65) 100%)",
            border: "1px solid rgba(34,197,94,0.4)",
            borderRadius: 16,
            padding: "12px 28px",
            backdropFilter: "blur(10px)",
            boxShadow: "0 0 40px rgba(34,197,94,0.2), 0 0 80px rgba(34,197,94,0.08)",
          }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold tracking-[0.25em]" style={{
                color: "#4ade80",
                textShadow: "0 0 12px rgba(34,197,94,0.6)",
              }}>
                ⚽ KICKOFF IN
              </span>
            </div>
            <div className="flex items-end gap-2 sm:gap-3 font-mono">
              {[
                { v: String(countdown.days).padStart(2, "0"), l: "DAYS" },
                { v: String(countdown.hours).padStart(2, "0"), l: "HRS" },
                { v: String(countdown.mins).padStart(2, "0"), l: "MIN" },
                { v: String(countdown.secs).padStart(2, "0"), l: "SEC" },
              ].map((seg, i) => (
                <div key={seg.l} className="flex items-end gap-2 sm:gap-3">
                  <div className="flex flex-col items-center">
                    <span className="tabular-nums leading-none" style={{
                      fontSize: "clamp(32px, 5.5vw, 58px)",
                      fontWeight: 900,
                      color: "#fff",
                      textShadow: "0 0 16px rgba(34,197,94,0.85), 0 0 32px rgba(34,197,94,0.45)",
                      letterSpacing: "-0.02em",
                    }}>{seg.v}</span>
                    <span className="text-[9px] sm:text-[10px] font-bold tracking-[0.2em] mt-1" style={{ color: "#94a3b8" }}>
                      {seg.l}
                    </span>
                  </div>
                  {i < 3 && (
                    <span className="text-green-400/40 leading-none pb-3 sm:pb-4" style={{ fontSize: "clamp(24px, 4.5vw, 46px)", fontWeight: 200 }}>:</span>
                  )}
                </div>
              ))}
            </div>
            <div className="text-[10px] mt-1 tracking-wide" style={{ color: "#64748b" }}>
              June 11, 2026 · Mexico City · Estadio Azteca · Opening Match
            </div>
          </div>
        </div>
      )}

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

        {/* News button */}
        <button
          onClick={() => setShowNewsPanel((p) => !p)}
          className="mt-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
          style={{
            background: showNewsPanel ? "rgba(34,197,94,0.2)" : "rgba(15,23,42,0.85)",
            border: showNewsPanel ? "1px solid rgba(34,197,94,0.5)" : "1px solid rgba(255,255,255,0.1)",
            color: showNewsPanel ? "#22c55e" : "rgba(255,255,255,0.7)",
            backdropFilter: "blur(12px)",
          }}
        >
          {"\u{1F4F0}"} News
        </button>

        {/* News panel (collapsible) */}
        {showNewsPanel && (
          <div
            className="mt-1 rounded-xl overflow-hidden w-48"
            style={{
              background: "rgba(15,23,42,0.95)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(34,197,94,0.2)",
            }}
          >
            <div className="px-3 py-2 border-b border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">{"\u26BD"} WC 2026 News</span>
            </div>
            <div className="divide-y divide-white/5">
              {NEWS_SOURCES.map((src) => (
                <a
                  key={src.label}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 text-xs text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <span>{src.icon}</span>
                  <span>{src.label}</span>
                </a>
              ))}
            </div>
          </div>
        )}
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

      {/* ── Country / Team detail panel ─────────────────────────────── */}
      {countryInfo && selectedCountry && (
        <div
          className="absolute bottom-16 right-4 z-20 w-80 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-140px)] overflow-y-auto rounded-2xl"
          style={{
            background: "rgba(15,23,42,0.96)",
            backdropFilter: "blur(16px)",
            border: `1.5px solid ${countryInfo.color ?? "rgba(255,255,255,0.1)"}`,
            boxShadow: countryInfo.color ? `0 0 30px ${countryInfo.color}22, 0 0 60px ${countryInfo.color}11` : undefined,
          }}
        >
          {/* Header */}
          <div className="px-4 pt-4 pb-3" style={{ borderBottom: `1px solid ${countryInfo.color ?? "rgba(255,255,255,0.08)"}33` }}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">{countryInfo.name}</h3>
                {countryInfo.detail && (
                  <p className="text-xs mt-0.5" style={{ color: countryInfo.color ?? "#94a3b8" }}>
                    &ldquo;{countryInfo.detail.nickname}&rdquo;
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedCountry(null)}
                className="text-white/30 hover:text-white/70 text-lg leading-none transition-colors ml-2"
              >
                &times;
              </button>
            </div>
          </div>

          <div className="px-4 pb-4">
            {/* Team detail — rich panel */}
            {countryInfo.detail && countryInfo.team && (
              <>
                {/* Coach / Captain / Ranking row */}
                <div className="mt-3 space-y-1.5 text-xs text-white/70">
                  <div className="flex justify-between">
                    <span className="text-white/40">Coach</span>
                    <span className="font-medium text-white/90">{countryInfo.detail.coach}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Captain</span>
                    <span className="font-medium text-white/90">{countryInfo.detail.captain}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">FIFA Ranking</span>
                    <span className="font-bold" style={{ color: countryInfo.color ?? "#fff" }}>#{countryInfo.detail.fifaRanking}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">WC Appearances</span>
                    <span className="text-white/90">{countryInfo.detail.worldCupAppearances}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Best Finish</span>
                    <span className="text-white/90">
                      {countryInfo.detail.bestFinish.includes("Champions") ? "\u{1F3C6} " : ""}{countryInfo.detail.bestFinish}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Group</span>
                    <span className="text-white/90">Group {countryInfo.team.group} &middot; {countryInfo.team.region}</span>
                  </div>
                </div>

                {/* Host nation stats */}
                {countryInfo.isHost && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="text-center p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <div className="text-sm font-bold" style={{ color: countryInfo.color }}>{countryInfo.venues}</div>
                      <div className="text-[9px] text-white/40">Venues</div>
                    </div>
                    <div className="text-center p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <div className="text-sm font-bold" style={{ color: countryInfo.color }}>{countryInfo.totalCapacity.toLocaleString()}</div>
                      <div className="text-[9px] text-white/40">Total Seats</div>
                    </div>
                    <div className="text-center p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <div className="text-sm font-bold" style={{ color: countryInfo.color }}>{countryInfo.totalMatches}</div>
                      <div className="text-[9px] text-white/40">Matches</div>
                    </div>
                  </div>
                )}

                {/* Key Players */}
                <div className="mt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 10 }}>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">{"\u2B50"} Key Players</h4>
                  <div className="space-y-1.5">
                    {countryInfo.detail.keyPlayers.map((p) => (
                      <div key={p.name} className="flex items-center gap-2 text-xs">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: countryInfo.color ?? "#fff" }} />
                        <span className="text-white/90 font-medium">{p.name}</span>
                        <span className="text-white/30">&mdash;</span>
                        <span className="text-white/50">{p.position}</span>
                        <span className="text-white/30">&mdash;</span>
                        <span className="text-white/40 truncate">{p.club}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fun Facts */}
                <div className="mt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 10 }}>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">{"\u{1F4A1}"} Fun Facts</h4>
                  <div className="space-y-1">
                    {countryInfo.detail.funFacts.map((f, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-white/60">
                        <span className="text-white/30 mt-0.5">&bull;</span>
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Links */}
                <div className="mt-3 flex flex-col gap-1.5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 10 }}>
                  <a
                    href="https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:bg-white/5"
                    style={{ background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    {"\u{1F517}"} FIFA Team Page &rarr;
                  </a>
                  <a
                    href={`https://news.google.com/search?q=${encodeURIComponent(countryInfo.name + " FIFA World Cup 2026")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:bg-white/5"
                    style={{ background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    {"\u{1F4F0}"} Latest News &rarr;
                  </a>
                </div>
              </>
            )}

            {/* Qualified team WITHOUT detail data (fallback) */}
            {countryInfo.team && !countryInfo.detail && (
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

            {/* Not qualified */}
            {!countryInfo.team && (
              <p className="mt-3 text-xs text-white/40">Not a qualified team or host nation</p>
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

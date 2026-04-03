"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import Link from "next/link"

// ── Types ──────────────────────────────────────────────────────────────────────

type RailType = "high-speed" | "conventional" | "freight" | "metro" | "planned"

interface RailLine {
  id: string
  name: string
  type: RailType
  country: string
  color: [number, number, number]
  path: [number, number][]
  speedKmh: number
  lengthKm: number
  openedYear: number | null
  operator: string
}

interface RailHub {
  id: string
  name: string
  city: string
  country: string
  lat: number
  lng: number
  passengersMillion: number
  type: "terminus" | "through" | "interchange"
}

interface FlowArc {
  id: string
  from: string
  to: string
  srcLat: number
  srcLng: number
  dstLat: number
  dstLng: number
  weeklyPassengers: number
  color: [number, number, number]
}

type FilterType = "all" | RailType

interface SelectedItem {
  kind: "line" | "hub"
  line?: RailLine
  hub?: RailHub
}

// ── Color scheme ───────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<RailType, [number, number, number]> = {
  "high-speed":   [255, 60,  60],
  "conventional": [100, 180, 255],
  "freight":      [180, 140, 80],
  "metro":        [100, 220, 100],
  "planned":      [150, 80,  220],
}

const TYPE_HEX: Record<RailType, string> = {
  "high-speed":   "#ff3c3c",
  "conventional": "#64b4ff",
  "freight":      "#b48c50",
  "metro":        "#64dc64",
  "planned":      "#9650dc",
}

// ── Static data ────────────────────────────────────────────────────────────────

const RAIL_LINES: RailLine[] = [
  {
    id: "cn-hsr-bsh",
    name: "Beijing–Shanghai HSR",
    type: "high-speed",
    country: "China",
    color: TYPE_COLORS["high-speed"],
    path: [[116.39,39.91],[117.12,38.85],[118.01,37.37],[119.13,34.21],[120.31,31.57],[121.47,31.23]],
    speedKmh: 350, lengthKm: 1318, openedYear: 2011, operator: "China Railway",
  },
  {
    id: "fr-tgv-pl",
    name: "Paris–Lyon TGV",
    type: "high-speed",
    country: "France",
    color: TYPE_COLORS["high-speed"],
    path: [[2.35,48.85],[3.07,47.80],[4.83,45.75]],
    speedKmh: 300, lengthKm: 427, openedYear: 1981, operator: "SNCF",
  },
  {
    id: "es-ave-mb",
    name: "Madrid–Barcelona AVE",
    type: "high-speed",
    country: "Spain",
    color: TYPE_COLORS["high-speed"],
    path: [[-3.70,40.42],[-0.88,41.65],[2.17,41.38]],
    speedKmh: 300, lengthKm: 621, openedYear: 2008, operator: "Renfe",
  },
  {
    id: "jp-shinkansen-to",
    name: "Tokyo–Osaka Shinkansen",
    type: "high-speed",
    country: "Japan",
    color: TYPE_COLORS["high-speed"],
    path: [[139.77,35.68],[138.38,35.00],[137.38,34.97],[136.06,35.16],[135.50,34.69]],
    speedKmh: 320, lengthKm: 515, openedYear: 1964, operator: "JR Central",
  },
  {
    id: "kr-ktx-sb",
    name: "Seoul–Busan KTX",
    type: "high-speed",
    country: "South Korea",
    color: TYPE_COLORS["high-speed"],
    path: [[127.02,37.56],[127.73,36.35],[128.59,35.83],[129.04,35.10]],
    speedKmh: 300, lengthKm: 416, openedYear: 2004, operator: "Korail",
  },
  {
    id: "gb-hs2",
    name: "London–Birmingham HS2",
    type: "planned",
    country: "United Kingdom",
    color: TYPE_COLORS["planned"],
    path: [[-0.13,51.51],[-1.00,52.10],[-1.90,52.48]],
    speedKmh: 360, lengthKm: 225, openedYear: 2033, operator: "Network Rail",
  },
  {
    id: "in-mahsr",
    name: "Mumbai–Ahmedabad HSR",
    type: "planned",
    country: "India",
    color: TYPE_COLORS["planned"],
    path: [[72.88,19.08],[72.75,20.00],[72.63,21.17],[72.58,23.03]],
    speedKmh: 350, lengthKm: 508, openedYear: 2026, operator: "Indian Railways",
  },
  {
    id: "ru-transsib",
    name: "Trans-Siberian Railway",
    type: "conventional",
    country: "Russia",
    color: TYPE_COLORS["conventional"],
    path: [[37.62,55.75],[60.61,56.85],[73.37,54.99],[82.93,54.99],[104.30,52.29],[132.93,48.47],[132.02,43.11]],
    speedKmh: 100, lengthKm: 9289, openedYear: 1916, operator: "RZhD",
  },
  {
    id: "eu-eurostar",
    name: "Eurostar London–Paris",
    type: "high-speed",
    country: "UK/France",
    color: TYPE_COLORS["high-speed"],
    path: [[-0.12,51.51],[1.15,50.98],[2.35,48.85]],
    speedKmh: 300, lengthKm: 494, openedYear: 1994, operator: "Eurostar",
  },
  {
    id: "de-ice-fm",
    name: "ICE Frankfurt–Munich",
    type: "high-speed",
    country: "Germany",
    color: TYPE_COLORS["high-speed"],
    path: [[8.68,50.11],[9.50,49.20],[10.55,48.90],[11.56,48.14]],
    speedKmh: 300, lengthKm: 393, openedYear: 2017, operator: "Deutsche Bahn",
  },
  {
    id: "us-nec",
    name: "Amtrak Northeast Corridor",
    type: "conventional",
    country: "United States",
    color: TYPE_COLORS["conventional"],
    path: [[-71.06,42.36],[-72.67,41.73],[-74.00,40.71],[-75.16,39.95],[-77.01,38.90]],
    speedKmh: 240, lengthKm: 734, openedYear: 1976, operator: "Amtrak",
  },
  {
    id: "us-cahsr",
    name: "California HSR",
    type: "planned",
    country: "United States",
    color: TYPE_COLORS["planned"],
    path: [[-118.24,34.05],[-119.18,34.20],[-120.45,35.28],[-121.50,36.98],[-122.42,37.77]],
    speedKmh: 350, lengthKm: 1287, openedYear: 2030, operator: "CalHSR",
  },
  {
    id: "eg-hsr-ca",
    name: "Egypt HSR Cairo–Alexandria",
    type: "planned",
    country: "Egypt",
    color: TYPE_COLORS["planned"],
    path: [[31.25,30.06],[30.58,30.62],[29.92,31.20]],
    speedKmh: 250, lengthKm: 200, openedYear: 2027, operator: "ENR",
  },
  {
    id: "ke-sgr",
    name: "Mombasa–Nairobi SGR",
    type: "conventional",
    country: "Kenya",
    color: TYPE_COLORS["conventional"],
    path: [[39.67,-4.05],[38.49,-3.39],[37.07,-1.52],[36.82,-1.29]],
    speedKmh: 120, lengthKm: 472, openedYear: 2017, operator: "Kenya Railways",
  },
  {
    id: "af-addis-djibouti",
    name: "Addis–Djibouti Railway",
    type: "conventional",
    country: "Ethiopia/Djibouti",
    color: TYPE_COLORS["conventional"],
    path: [[38.74,9.03],[40.50,10.20],[43.14,11.59]],
    speedKmh: 120, lengthKm: 752, openedYear: 2016, operator: "ETH/DJI Railways",
  },
  {
    id: "au-xpt",
    name: "Sydney–Melbourne XPT",
    type: "conventional",
    country: "Australia",
    color: TYPE_COLORS["conventional"],
    path: [[151.21,-33.87],[149.78,-36.40],[147.43,-37.00],[144.96,-37.81]],
    speedKmh: 160, lengthKm: 983, openedYear: 1982, operator: "NSWTrainLink",
  },
  {
    id: "br-tav-sprj",
    name: "SP–RJ High Speed Rail",
    type: "planned",
    country: "Brazil",
    color: TYPE_COLORS["planned"],
    path: [[-46.63,-23.55],[-44.90,-23.00],[-43.17,-22.91]],
    speedKmh: 350, lengthKm: 511, openedYear: 2032, operator: "TAV Brasil",
  },
  {
    id: "cn-hsr-bjgz",
    name: "Beijing–Guangzhou HSR",
    type: "high-speed",
    country: "China",
    color: TYPE_COLORS["high-speed"],
    path: [[116.39,39.91],[114.30,30.60],[113.26,23.13]],
    speedKmh: 350, lengthKm: 2298, openedYear: 2012, operator: "China Railway",
  },
  {
    id: "cn-hsr-shkm",
    name: "Shanghai–Kunming HSR",
    type: "high-speed",
    country: "China",
    color: TYPE_COLORS["high-speed"],
    path: [[121.47,31.23],[104.06,30.66],[102.71,25.05]],
    speedKmh: 350, lengthKm: 2264, openedYear: 2016, operator: "China Railway",
  },
  {
    id: "it-frecciarossa",
    name: "Frecciarossa Rome–Milan",
    type: "high-speed",
    country: "Italy",
    color: TYPE_COLORS["high-speed"],
    path: [[12.49,41.90],[11.34,43.72],[9.19,45.46]],
    speedKmh: 300, lengthKm: 574, openedYear: 2009, operator: "Trenitalia",
  },
  {
    id: "ma-hsr",
    name: "Morocco TGV al-Boraq",
    type: "high-speed",
    country: "Morocco",
    color: TYPE_COLORS["high-speed"],
    path: [[-7.62,33.59],[-6.83,34.02],[-5.83,34.02]],
    speedKmh: 320, lengthKm: 186, openedYear: 2018, operator: "ONCF",
  },
  {
    id: "sa-haramain",
    name: "Haramain HSR",
    type: "high-speed",
    country: "Saudi Arabia",
    color: TYPE_COLORS["high-speed"],
    path: [[39.83,21.42],[39.62,22.94],[39.11,24.46]],
    speedKmh: 300, lengthKm: 453, openedYear: 2018, operator: "SAR",
  },
  {
    id: "ru-sapsan",
    name: "Sapsan Moscow–St Petersburg",
    type: "high-speed",
    country: "Russia",
    color: TYPE_COLORS["high-speed"],
    path: [[37.62,55.75],[34.00,57.90],[30.32,59.95]],
    speedKmh: 250, lengthKm: 649, openedYear: 2009, operator: "RZhD",
  },
  {
    id: "pk-ml1",
    name: "Pakistan ML-1 Upgrade",
    type: "planned",
    country: "Pakistan",
    color: TYPE_COLORS["planned"],
    path: [[67.01,24.86],[69.38,27.40],[71.50,29.40],[74.35,31.55]],
    speedKmh: 160, lengthKm: 1872, openedYear: 2030, operator: "Pakistan Railways",
  },
  {
    id: "tw-hsr",
    name: "Taiwan High Speed Rail",
    type: "high-speed",
    country: "Taiwan",
    color: TYPE_COLORS["high-speed"],
    path: [[121.56,25.05],[121.00,24.15],[120.20,22.99]],
    speedKmh: 300, lengthKm: 345, openedYear: 2007, operator: "THSR",
  },
]

const RAIL_HUBS: RailHub[] = [
  { id: "h-tokyo",     name: "Tokyo Station",           city: "Tokyo",          country: "Japan",         lat: 35.68, lng: 139.77, passengersMillion: 462,  type: "terminus"     },
  { id: "h-shinjuku",  name: "Shinjuku Station",         city: "Tokyo",          country: "Japan",         lat: 35.69, lng: 139.70, passengersMillion: 770,  type: "interchange"  },
  { id: "h-beijing",   name: "Beijing West Station",     city: "Beijing",        country: "China",         lat: 39.90, lng: 116.32, passengersMillion: 137,  type: "terminus"     },
  { id: "h-shanghai",  name: "Shanghai Hongqiao",        city: "Shanghai",       country: "China",         lat: 31.19, lng: 121.33, passengersMillion: 100,  type: "terminus"     },
  { id: "h-guangzhou", name: "Guangzhou South",          city: "Guangzhou",      country: "China",         lat: 23.00, lng: 113.26, passengersMillion: 84,   type: "terminus"     },
  { id: "h-paris-gdn", name: "Gare du Nord",             city: "Paris",          country: "France",        lat: 48.88, lng: 2.36,   passengersMillion: 214,  type: "terminus"     },
  { id: "h-london-stp",name: "London St Pancras",        city: "London",         country: "United Kingdom",lat: 51.53, lng: -0.12,  passengersMillion: 44,   type: "terminus"     },
  { id: "h-frankfurt", name: "Frankfurt Hauptbahnhof",   city: "Frankfurt",      country: "Germany",       lat: 50.11, lng: 8.66,   passengersMillion: 130,  type: "through"      },
  { id: "h-madrid",    name: "Madrid Atocha",            city: "Madrid",         country: "Spain",         lat: 40.41, lng: -3.69,  passengersMillion: 62,   type: "terminus"     },
  { id: "h-barcelona", name: "Barcelona Sants",          city: "Barcelona",      country: "Spain",         lat: 41.38, lng: 2.14,   passengersMillion: 56,   type: "through"      },
  { id: "h-seoul",     name: "Seoul Station",            city: "Seoul",          country: "South Korea",   lat: 37.55, lng: 126.97, passengersMillion: 120,  type: "terminus"     },
  { id: "h-busan",     name: "Busan Station",            city: "Busan",          country: "South Korea",   lat: 35.11, lng: 129.04, passengersMillion: 45,   type: "terminus"     },
  { id: "h-newyork",   name: "New York Penn Station",    city: "New York",       country: "United States", lat: 40.75, lng: -73.99, passengersMillion: 92,   type: "through"      },
  { id: "h-mumbai",    name: "Mumbai CSMT",              city: "Mumbai",         country: "India",         lat: 18.94, lng: 72.84,  passengersMillion: 98,   type: "terminus"     },
  { id: "h-delhi",     name: "New Delhi Station",        city: "Delhi",          country: "India",         lat: 28.64, lng: 77.22,  passengersMillion: 110,  type: "terminus"     },
  { id: "h-sydney",    name: "Sydney Central",           city: "Sydney",         country: "Australia",     lat: -33.88,lng: 151.21, passengersMillion: 60,   type: "terminus"     },
  { id: "h-moscow",    name: "Moscow Yaroslavsky",       city: "Moscow",         country: "Russia",        lat: 55.77, lng: 37.66,  passengersMillion: 30,   type: "terminus"     },
  { id: "h-berlin",    name: "Berlin Hauptbahnhof",      city: "Berlin",         country: "Germany",       lat: 52.53, lng: 13.37,  passengersMillion: 91,   type: "through"      },
  { id: "h-rome",      name: "Roma Termini",             city: "Rome",           country: "Italy",         lat: 41.90, lng: 12.50,  passengersMillion: 59,   type: "terminus"     },
  { id: "h-milan",     name: "Milano Centrale",          city: "Milan",          country: "Italy",         lat: 45.49, lng: 9.20,   passengersMillion: 50,   type: "terminus"     },
  { id: "h-zurich",    name: "Zürich HB",                city: "Zürich",         country: "Switzerland",   lat: 47.38, lng: 8.54,   passengersMillion: 90,   type: "through"      },
  { id: "h-amsterdam", name: "Amsterdam Centraal",       city: "Amsterdam",      country: "Netherlands",   lat: 52.38, lng: 4.90,   passengersMillion: 57,   type: "terminus"     },
  { id: "h-brussels",  name: "Brussels Midi",            city: "Brussels",       country: "Belgium",       lat: 50.84, lng: 4.34,   passengersMillion: 51,   type: "through"      },
  { id: "h-osaka",     name: "Osaka Station",            city: "Osaka",          country: "Japan",         lat: 34.70, lng: 135.50, passengersMillion: 228,  type: "interchange"  },
  { id: "h-taipei",    name: "Taipei Main Station",      city: "Taipei",         country: "Taiwan",        lat: 25.05, lng: 121.52, passengersMillion: 80,   type: "interchange"  },
  { id: "h-hongkong",  name: "Hong Kong West Kowloon",   city: "Hong Kong",      country: "China",         lat: 22.30, lng: 114.17, passengersMillion: 35,   type: "terminus"     },
  { id: "h-dubai",     name: "Dubai Union Station",      city: "Dubai",          country: "UAE",           lat: 25.27, lng: 55.32,  passengersMillion: 28,   type: "through"      },
  { id: "h-toronto",   name: "Toronto Union Station",    city: "Toronto",        country: "Canada",        lat: 43.64, lng: -79.38, passengersMillion: 32,   type: "terminus"     },
  { id: "h-chicago",   name: "Chicago Union Station",    city: "Chicago",        country: "United States", lat: 41.88, lng: -87.64, passengersMillion: 20,   type: "terminus"     },
  { id: "h-singapore", name: "Singapore Woodlands",      city: "Singapore",      country: "Singapore",     lat: 1.44,  lng: 103.79, passengersMillion: 18,   type: "terminus"     },
]

const FLOW_ARCS: FlowArc[] = [
  { id: "f-to-os",  from: "Tokyo",    to: "Osaka",     srcLat: 35.68,  srcLng: 139.77, dstLat: 34.69,  dstLng: 135.50, weeklyPassengers: 875000,  color: [255, 80, 80]   },
  { id: "f-bj-sh",  from: "Beijing",  to: "Shanghai",  srcLat: 39.91,  srcLng: 116.39, dstLat: 31.23,  dstLng: 121.47, weeklyPassengers: 560000,  color: [255, 80, 80]   },
  { id: "f-pa-lo",  from: "Paris",    to: "London",    srcLat: 48.85,  srcLng: 2.35,   dstLat: 51.51,  dstLng: -0.12,  weeklyPassengers: 200000,  color: [255, 80, 80]   },
  { id: "f-ma-ba",  from: "Madrid",   to: "Barcelona", srcLat: 40.42,  srcLng: -3.70,  dstLat: 41.38,  dstLng: 2.17,   weeklyPassengers: 180000,  color: [255, 80, 80]   },
  { id: "f-se-bu",  from: "Seoul",    to: "Busan",     srcLat: 37.56,  srcLng: 127.02, dstLat: 35.10,  dstLng: 129.04, weeklyPassengers: 220000,  color: [255, 80, 80]   },
  { id: "f-be-mu",  from: "Berlin",   to: "Munich",    srcLat: 52.53,  srcLng: 13.37,  dstLat: 48.14,  dstLng: 11.56,  weeklyPassengers: 150000,  color: [100, 180, 255] },
  { id: "f-ro-mi",  from: "Rome",     to: "Milan",     srcLat: 41.90,  srcLng: 12.49,  dstLat: 45.46,  dstLng: 9.19,   weeklyPassengers: 120000,  color: [255, 80, 80]   },
  { id: "f-pa-ly",  from: "Paris",    to: "Lyon",      srcLat: 48.85,  srcLng: 2.35,   dstLat: 45.75,  dstLng: 4.83,   weeklyPassengers: 280000,  color: [255, 80, 80]   },
  { id: "f-ny-dc",  from: "New York", to: "Washington",srcLat: 40.71,  srcLng: -74.00, dstLat: 38.90,  dstLng: -77.01, weeklyPassengers: 90000,   color: [100, 180, 255] },
  { id: "f-ny-bo",  from: "New York", to: "Boston",    srcLat: 40.71,  srcLng: -74.00, dstLat: 42.36,  dstLng: -71.06, weeklyPassengers: 95000,   color: [100, 180, 255] },
  { id: "f-sh-gzh", from: "Shanghai", to: "Guangzhou", srcLat: 31.23,  srcLng: 121.47, dstLat: 23.13,  dstLng: 113.26, weeklyPassengers: 420000,  color: [255, 80, 80]   },
  { id: "f-bj-gzh", from: "Beijing",  to: "Guangzhou", srcLat: 39.91,  srcLng: 116.39, dstLat: 23.13,  dstLng: 113.26, weeklyPassengers: 350000,  color: [255, 80, 80]   },
  { id: "f-fr-br",  from: "Frankfurt", to: "Brussels", srcLat: 50.11,  srcLng: 8.68,   dstLat: 50.84,  dstLng: 4.34,   weeklyPassengers: 80000,   color: [255, 80, 80]   },
  { id: "f-am-br",  from: "Amsterdam",to: "Brussels",  srcLat: 52.38,  srcLng: 4.90,   dstLat: 50.84,  dstLng: 4.34,   weeklyPassengers: 75000,   color: [100, 180, 255] },
  { id: "f-mo-spb", from: "Moscow",   to: "St. Petersburg",srcLat:55.75,srcLng:37.62,  dstLat: 59.95,  dstLng: 30.32,  weeklyPassengers: 130000,  color: [100, 180, 255] },
  { id: "f-sy-me",  from: "Sydney",   to: "Melbourne", srcLat: -33.87, srcLng: 151.21, dstLat: -37.81, dstLng: 144.96, weeklyPassengers: 55000,   color: [100, 180, 255] },
  { id: "f-tp-kh",  from: "Taipei",   to: "Kaohsiung", srcLat: 25.05,  srcLng: 121.56, dstLat: 22.99,  dstLng: 120.20, weeklyPassengers: 160000,  color: [255, 80, 80]   },
  { id: "f-bj-xan", from: "Beijing",  to: "Xi'an",     srcLat: 39.91,  srcLng: 116.39, dstLat: 34.27,  dstLng: 108.94, weeklyPassengers: 200000,  color: [255, 80, 80]   },
  { id: "f-zu-pa",  from: "Zürich",   to: "Paris",     srcLat: 47.38,  srcLng: 8.54,   dstLat: 48.85,  dstLng: 2.35,   weeklyPassengers: 50000,   color: [100, 180, 255] },
  { id: "f-mi-fr",  from: "Milan",    to: "Frankfurt", srcLat: 45.46,  srcLng: 9.19,   dstLat: 50.11,  dstLng: 8.68,   weeklyPassengers: 45000,   color: [100, 180, 255] },
]

// ── Derived stats ──────────────────────────────────────────────────────────────

function getTotalKm(): number {
  return RAIL_LINES.reduce((s, l) => s + l.lengthKm, 0)
}

function getCountByType(): Record<RailType, number> {
  const counts: Record<RailType, number> = { "high-speed": 0, "conventional": 0, "freight": 0, "metro": 0, "planned": 0 }
  for (const l of RAIL_LINES) counts[l.type]++
  return counts
}

function getHsrByCountry(): { country: string; km: number }[] {
  const map: Record<string, number> = {}
  for (const l of RAIL_LINES) {
    if (l.type === "high-speed") {
      map[l.country] = (map[l.country] ?? 0) + l.lengthKm
    }
  }
  return Object.entries(map)
    .map(([country, km]) => ({ country, km }))
    .sort((a, b) => b.km - a.km)
    .slice(0, 6)
}

function fmtKm(km: number): string {
  if (km >= 1000) return `${(km / 1000).toFixed(1)}k km`
  return `${km.toLocaleString()} km`
}

// ── Earth polygon (full sphere background) ────────────────────────────────────

const EARTH_POLYGON = {
  contour: [
    [-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90],
  ],
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function UC24Page() {
  const [filter, setFilter] = useState<FilterType>("all")
  const [selected, setSelected] = useState<SelectedItem | null>(null)
  const [deckLoaded, setDeckLoaded] = useState(false)
  const [animTick, setAnimTick] = useState(0)

  // Animation tick for arc width pulsing
  useEffect(() => {
    const id = setInterval(() => setAnimTick(t => t + 1), 80)
    return () => clearInterval(id)
  }, [])

  const deckRef = useRef<any>(null)
  const deckContainerRef = useRef<HTMLDivElement>(null)

  const filteredLines = useMemo(() =>
    filter === "all" ? RAIL_LINES : RAIL_LINES.filter(l => l.type === filter),
    [filter]
  )

  const totalKm = useMemo(() => getTotalKm(), [])
  const countByType = useMemo(() => getCountByType(), [])
  const hsrByCountry = useMemo(() => getHsrByCountry(), [])

  // deck.gl dynamic import
  useEffect(() => {
    let destroyed = false
    let deckInst: any

    Promise.all([
      import("@deck.gl/react"),
      import("deck.gl"),
      import("react-dom/client"),
    ]).then(([deckReact, deckCore, reactDomClient]) => {
      if (destroyed || !deckContainerRef.current) return

      const { DeckGL } = deckReact
      const {
        _GlobeView,
        PathLayer,
        ArcLayer,
        ScatterplotLayer,
        SolidPolygonLayer,
      } = deckCore

      const INITIAL_VIEW_STATE = {
        longitude: 60,
        latitude: 30,
        zoom: 1.5,
      }

      function buildLayers(
        lines: RailLine[],
        filterType: FilterType,
        tick: number,
        onSelectLine: (l: RailLine) => void,
        onSelectHub: (h: RailHub) => void,
      ) {
        const pulse = 0.5 + 0.5 * Math.sin(tick * 0.15)

        return [
          // Earth background
          new SolidPolygonLayer({
            id: "earth-bg",
            data: [EARTH_POLYGON],
            getPolygon: (d: any) => d.contour,
            getFillColor: [8, 20, 40, 255],
            stroked: false,
          }),

          // Rail lines
          new PathLayer({
            id: "rail-lines",
            data: lines,
            getPath: (d: RailLine) => d.path,
            getColor: (d: RailLine) => {
              const [r, g, b] = d.color
              const opacity = d.type === "planned" ? 160 : 220
              return [r, g, b, opacity]
            },
            getWidth: (d: RailLine) => {
              if (d.type === "high-speed") return 4
              if (d.type === "planned")    return 2
              return 2
            },
            widthUnits: "pixels",
            widthScale: 1,
            widthMinPixels: 1,
            widthMaxPixels: 8,
            capRounded: true,
            jointRounded: true,
            pickable: true,
            autoHighlight: true,
            highlightColor: [255, 255, 255, 80],
            onClick: (info: any) => {
              if (info.object) onSelectLine(info.object)
            },
          }),

          // Flow arcs
          new ArcLayer({
            id: "flow-arcs",
            data: filterType === "all" ? FLOW_ARCS : [],
            getSourcePosition: (d: FlowArc) => [d.srcLng, d.srcLat],
            getTargetPosition: (d: FlowArc) => [d.dstLng, d.dstLat],
            getSourceColor: (d: FlowArc) => [...d.color, 180] as [number,number,number,number],
            getTargetColor: (d: FlowArc) => [...d.color, 60]  as [number,number,number,number],
            getWidth: (d: FlowArc) => {
              const base = Math.max(1, Math.log10(d.weeklyPassengers) - 3.5)
              return base * (1 + 0.3 * pulse)
            },
            widthUnits: "pixels",
            widthMinPixels: 1,
            widthMaxPixels: 6,
            greatCircle: true,
            pickable: false,
            updateTriggers: { getWidth: tick },
          }),

          // Station hubs
          new ScatterplotLayer({
            id: "rail-hubs",
            data: RAIL_HUBS,
            getPosition: (d: RailHub) => [d.lng, d.lat],
            getRadius: (d: RailHub) => {
              const base = Math.sqrt(d.passengersMillion) * 15000
              return Math.max(30000, Math.min(base, 200000))
            },
            radiusUnits: "meters",
            getFillColor: (d: RailHub) => {
              const intensity = Math.min(1, d.passengersMillion / 800)
              return [
                Math.round(51  + intensity * (255 - 51)),
                Math.round(204 + intensity * (220 - 204)),
                Math.round(221 + intensity * (60  - 221)),
                200,
              ] as [number,number,number,number]
            },
            getLineColor: [255, 255, 255, 120],
            stroked: true,
            lineWidthMinPixels: 1,
            lineWidthMaxPixels: 2,
            pickable: true,
            autoHighlight: true,
            highlightColor: [255, 255, 255, 100],
            onClick: (info: any) => {
              if (info.object) onSelectHub(info.object)
            },
          }),
        ]
      }

      // We render into the container via React root
      const root = reactDomClient.createRoot(deckContainerRef.current!)

      function render(lines: RailLine[], filterType: FilterType, tick: number, sel: SelectedItem | null) {
        const layers = buildLayers(
          lines,
          filterType,
          tick,
          (l) => { setSelected({ kind: "line", line: l }) },
          (h) => { setSelected({ kind: "hub",  hub: h  }) },
        )

        root.render(
          // @ts-ignore
          <DeckGL
            views={new _GlobeView({ id: "globe" })}
            initialViewState={INITIAL_VIEW_STATE}
            controller={true}
            layers={layers}
            parameters={{ clearColor: [0, 0, 0, 1] } as any}
            style={{ position: "absolute", inset: "0" }}
          />
        )
      }

      deckRef.current = { render, root }
      render(filteredLines, filter, animTick, selected)
      setDeckLoaded(true)
    })

    return () => {
      destroyed = true
      deckRef.current?.root?.unmount?.()
      deckRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-render deck when state changes
  useEffect(() => {
    if (!deckRef.current) return
    deckRef.current.render(filteredLines, filter, animTick, selected)
  }, [filteredLines, filter, animTick, selected])

  const handleFilterClick = useCallback((f: FilterType) => {
    setFilter(f)
    setSelected(null)
  }, [])

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", background: "#000508", overflow: "hidden" }}>

      {/* deck.gl canvas container */}
      <div
        ref={deckContainerRef}
        style={{ position: "absolute", inset: 0, zIndex: 0 }}
      />

      {/* Loading overlay */}
      {!deckLoaded && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 10,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "#000508",
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 48, height: 48, margin: "0 auto 16px",
              borderRadius: "50%",
              border: "2px solid transparent",
              borderTopColor: "var(--accent)",
              borderRightColor: "rgba(51,204,221,0.3)",
              animation: "spin 1s linear infinite",
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ color: "var(--text)", fontSize: 14, fontWeight: 600 }}>Loading rail network…</p>
            <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>deck.gl GlobeView initialising</p>
          </div>
        </div>
      )}

      {/* ── Top-left: title + stats ─────────────────────────────────────────── */}
      <div style={{
        position: "absolute", top: 20, left: 20, zIndex: 5,
        pointerEvents: "none",
        maxWidth: 300,
      }}>
        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
          padding: "3px 10px", borderRadius: 4, marginBottom: 8,
          background: "var(--accent-dim)", color: "var(--accent)",
          border: "1px solid rgba(51,204,221,0.25)",
        }}>
          UC24 · WORLD RAIL NETWORKS
        </div>

        <h1 style={{
          fontSize: 22, fontWeight: 800, color: "var(--text)",
          margin: "0 0 4px", letterSpacing: "-0.02em",
          textShadow: "0 2px 12px rgba(0,0,0,0.8)",
        }}>
          Global Railway Infrastructure
        </h1>
        <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 12px", lineHeight: 1.5 }}>
          {RAIL_LINES.length} corridors · {fmtKm(totalKm)} tracked · 30 major hubs
        </p>

        {/* Stat chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {(Object.entries(countByType) as [RailType, number][])
            .filter(([, n]) => n > 0)
            .map(([type, count]) => (
              <div key={type} style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "3px 8px", borderRadius: 6, fontSize: 11,
                background: "rgba(0,0,0,0.7)",
                border: `1px solid ${TYPE_HEX[type]}40`,
                backdropFilter: "blur(8px)",
                color: "var(--text)",
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: 2,
                  background: TYPE_HEX[type], flexShrink: 0,
                }} />
                <span style={{ color: "var(--muted)" }}>
                  {type === "high-speed" ? "HSR" : type.charAt(0).toUpperCase() + type.slice(1)}:
                </span>
                <span style={{ fontWeight: 700 }}>{count}</span>
              </div>
          ))}
        </div>
      </div>

      {/* ── Top-right: Race to connect ──────────────────────────────────────── */}
      <div style={{
        position: "absolute", top: 20, right: 20, zIndex: 5,
        width: 220,
        background: "rgba(0,0,0,0.78)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 12,
        backdropFilter: "blur(14px)",
        padding: "12px 14px",
        pointerEvents: "auto",
      }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "var(--muted)", marginBottom: 10, textTransform: "uppercase" }}>
          Race to Connect — HSR km
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {hsrByCountry.map((entry, i) => {
            const maxKm = hsrByCountry[0].km
            const pct = (entry.km / maxKm) * 100
            return (
              <div key={entry.country}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: i < 3 ? "var(--text)" : "var(--muted)", fontWeight: i === 0 ? 700 : 400 }}>
                    {i + 1}. {entry.country}
                  </span>
                  <span style={{ fontSize: 11, color: TYPE_HEX["high-speed"], fontWeight: 600 }}>
                    {fmtKm(entry.km)}
                  </span>
                </div>
                <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${pct}%`, borderRadius: 2,
                    background: `linear-gradient(to right, ${TYPE_HEX["high-speed"]}, rgba(255,150,150,0.6))`,
                    transition: "width 0.4s ease",
                  }} />
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ marginTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 10 }}>
          <Link
            href="/uc24/details"
            style={{
              display: "block", textAlign: "center",
              fontSize: 11, fontWeight: 600, color: "var(--accent)",
              textDecoration: "none",
              padding: "5px 0",
              borderRadius: 6,
              background: "var(--accent-dim)",
              border: "1px solid rgba(51,204,221,0.2)",
            }}
          >
            Technical Details →
          </Link>
        </div>
      </div>

      {/* ── Bottom-left: type filter buttons ───────────────────────────────── */}
      <div style={{
        position: "absolute", bottom: 24, left: 20, zIndex: 5,
        display: "flex", flexWrap: "wrap", gap: 7,
        maxWidth: 420,
      }}>
        {([
          { key: "all",          label: "All Lines"    },
          { key: "high-speed",   label: "High-Speed"   },
          { key: "conventional", label: "Conventional" },
          { key: "planned",      label: "Planned"      },
          { key: "freight",      label: "Freight"      },
          { key: "metro",        label: "Metro"        },
        ] as { key: FilterType; label: string }[]).map(({ key, label }) => {
          const active = filter === key
          const color  = key === "all" ? "var(--accent)" : TYPE_HEX[key as RailType]
          const colorDim = key === "all" ? "var(--accent-dim)" : `${TYPE_HEX[key as RailType]}20`
          return (
            <button
              key={key}
              onClick={() => handleFilterClick(key)}
              style={{
                padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600,
                cursor: "pointer", transition: "all 0.15s",
                border: `1px solid ${active ? color : "rgba(255,255,255,0.12)"}`,
                background: active ? colorDim : "rgba(0,0,0,0.7)",
                color: active ? color : "var(--muted)",
                backdropFilter: "blur(8px)",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              {key !== "all" && (
                <span style={{
                  width: 8, height: 8, borderRadius: 2,
                  background: TYPE_HEX[key as RailType],
                  flexShrink: 0,
                }} />
              )}
              {label}
            </button>
          )
        })}
      </div>

      {/* ── Bottom-right: selected item details ────────────────────────────── */}
      {selected && (
        <div style={{
          position: "absolute", bottom: 24, right: 20, zIndex: 5,
          width: 280,
          background: "rgba(0,0,0,0.88)",
          border: `1px solid ${selected.kind === "line" ? TYPE_HEX[selected.line!.type] + "60" : "rgba(51,204,221,0.35)"}`,
          borderRadius: 12,
          backdropFilter: "blur(14px)",
          padding: "14px 16px",
        }}>
          {/* Close button */}
          <button
            onClick={() => setSelected(null)}
            style={{
              position: "absolute", top: 10, right: 10,
              background: "none", border: "none", cursor: "pointer",
              color: "var(--muted)", fontSize: 16, lineHeight: 1,
              padding: "2px 4px",
            }}
          >
            ✕
          </button>

          {selected.kind === "line" && selected.line && (() => {
            const l = selected.line
            const typeColor = TYPE_HEX[l.type]
            return (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{
                    width: 10, height: 10, borderRadius: 2,
                    background: typeColor, flexShrink: 0,
                  }} />
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", margin: 0, lineHeight: 1.3 }}>
                    {l.name}
                  </p>
                </div>
                <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 10 }}>
                  {l.country} · {l.operator}
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { label: "Type",     value: l.type === "high-speed" ? "High-Speed" : l.type.charAt(0).toUpperCase() + l.type.slice(1) },
                    { label: "Length",   value: fmtKm(l.lengthKm)  },
                    { label: "Top Speed",value: `${l.speedKmh} km/h` },
                    { label: "Opened",   value: l.openedYear ? l.openedYear.toString() : "N/A" },
                  ].map(m => (
                    <div key={m.label} style={{
                      padding: "8px 10px", borderRadius: 8,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}>
                      <p style={{ fontSize: 10, color: "var(--muted)", margin: "0 0 3px" }}>{m.label}</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: 0 }}>{m.value}</p>
                    </div>
                  ))}
                </div>
                <div style={{
                  marginTop: 10, padding: "5px 10px", borderRadius: 6,
                  background: `${typeColor}10`,
                  border: `1px solid ${typeColor}30`,
                  display: "inline-flex", alignItems: "center", gap: 4,
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: 2, background: typeColor,
                  }} />
                  <span style={{ fontSize: 11, color: typeColor, fontWeight: 600 }}>
                    {l.type === "planned" ? `Expected ${l.openedYear ?? "TBD"}` : `Operating since ${l.openedYear}`}
                  </span>
                </div>
              </>
            )
          })()}

          {selected.kind === "hub" && selected.hub && (() => {
            const h = selected.hub
            return (
              <>
                <div style={{ marginBottom: 10 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", margin: "0 0 2px" }}>
                    {h.name}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>
                    {h.city}, {h.country}
                  </p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { label: "Annual Pax",   value: `${h.passengersMillion}M` },
                    { label: "Station Type", value: h.type.charAt(0).toUpperCase() + h.type.slice(1) },
                    { label: "Latitude",     value: h.lat.toFixed(2) + "°" },
                    { label: "Longitude",    value: h.lng.toFixed(2) + "°" },
                  ].map(m => (
                    <div key={m.label} style={{
                      padding: "8px 10px", borderRadius: 8,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}>
                      <p style={{ fontSize: 10, color: "var(--muted)", margin: "0 0 3px" }}>{m.label}</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: 0 }}>{m.value}</p>
                    </div>
                  ))}
                </div>
                {/* Pax bar */}
                <div style={{ marginTop: 10 }}>
                  <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${Math.min(100, (h.passengersMillion / 800) * 100)}%`,
                      background: "linear-gradient(to right, var(--accent), rgba(51,204,221,0.4))",
                      borderRadius: 2,
                    }} />
                  </div>
                  <p style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>
                    {h.passengersMillion}M annual passengers
                  </p>
                </div>
              </>
            )
          })()}
        </div>
      )}

      {/* ── Legend ─────────────────────────────────────────────────────────── */}
      <div style={{
        position: "absolute", bottom: 80, left: 20, zIndex: 5,
        background: "rgba(0,0,0,0.72)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 8, backdropFilter: "blur(10px)",
        padding: "8px 12px",
        display: "flex", gap: 12, alignItems: "center",
        flexWrap: "wrap",
      }}>
        <span style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Legend
        </span>
        {([
          { type: "high-speed",   label: "HSR"          },
          { type: "conventional", label: "Conventional" },
          { type: "planned",      label: "Planned"      },
        ] as { type: RailType; label: string }[]).map(({ type, label }) => (
          <div key={type} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 20, height: 3, borderRadius: 1, background: TYPE_HEX[type] }} />
            <span style={{ fontSize: 11, color: "var(--muted)" }}>{label}</span>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: "var(--accent)", border: "1px solid rgba(255,255,255,0.3)",
          }} />
          <span style={{ fontSize: 11, color: "var(--muted)" }}>Hub</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 20, height: 2, borderRadius: 1, background: "rgba(255,80,80,0.7)" }} />
          <span style={{ fontSize: 11, color: "var(--muted)" }}>Flow arc</span>
        </div>
      </div>

    </div>
  )
}

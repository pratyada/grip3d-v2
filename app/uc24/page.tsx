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

interface CountryFeature {
  type: "Feature"
  id: string
  properties: { name: string }
  geometry: any
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

// ── Country centroid helper ────────────────────────────────────────────────────

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

// ── Arc colour helpers ─────────────────────────────────────────────────────────

function typeArcColor(type: RailType): string {
  return TYPE_HEX[type]
}

function lineToArcData(line: RailLine) {
  const pts = line.path
  const src = pts[0]
  const dst = pts[pts.length - 1]
  return {
    ...line,
    srcLng: src[0], srcLat: src[1],
    dstLng: dst[0], dstLat: dst[1],
  }
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function UC24Page() {
  const globeRef  = useRef<HTMLDivElement>(null)
  const globeInst = useRef<any>(null)

  const [globeReady,      setGlobeReady]      = useState(false)
  const [filter,          setFilter]          = useState<FilterType>("all")
  const [selected,        setSelected]        = useState<SelectedItem | null>(null)
  const [isSpinning,      setIsSpinning]      = useState(true)
  const [countries,       setCountries]       = useState<CountryFeature[]>([])
  const [hoveredCountry,  setHoveredCountry]  = useState<CountryFeature | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<CountryFeature | null>(null)

  const totalKm      = useMemo(() => getTotalKm(), [])
  const countByType  = useMemo(() => getCountByType(), [])
  const hsrByCountry = useMemo(() => getHsrByCountry(), [])

  const filteredLines = useMemo(
    () => filter === "all" ? RAIL_LINES : RAIL_LINES.filter(l => l.type === filter),
    [filter],
  )

  // Country stats: lines passing through / hub count
  const countryStats = useMemo(() => {
    if (!selectedCountry) return null
    const name = selectedCountry.properties.name
    // Match lines (country field may contain "/")
    const lines = RAIL_LINES.filter(l =>
      l.country.split("/").some(c => c.trim().toLowerCase() === name.toLowerCase())
    )
    const hubs = RAIL_HUBS.filter(h => h.country.toLowerCase() === name.toLowerCase())
    const totalLineKm = lines.reduce((s, l) => s + l.lengthKm, 0)
    return { name, lines, hubs, totalLineKm }
  }, [selectedCountry])

  // ── Fetch countries GeoJSON ───────────────────────────────────────────────────
  useEffect(() => {
    fetch("/countries-110m.geojson")
      .then(r => r.json())
      .then(geo => setCountries(geo.features as CountryFeature[]))
      .catch(() => {/* non-fatal */})
  }, [])

  // ── Globe init ────────────────────────────────────────────────────────────────
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
        .atmosphereColor("#1a3fff")
        .atmosphereAltitude(0.14)
        .pointOfView({ lat: 30, lng: 60, altitude: 2.0 })

      globe.controls().autoRotate      = true
      globe.controls().autoRotateSpeed = 0.15
      globe.controls().enableDamping   = true
      globe.controls().dampingFactor   = 0.1

      globeInst.current = globe
      setGlobeReady(true)
    })

    return () => {
      globeInst.current?.controls()?.dispose?.()
      globeInst.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Apply rail arcs ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!globeInst.current || !globeReady) return
    const g = globeInst.current

    // Rail line arcs (one per line, src→dst of path)
    const arcData = filteredLines.map(lineToArcData)

    g.arcsData(arcData)
      .arcStartLat((d: any) => d.srcLat)
      .arcStartLng((d: any) => d.srcLng)
      .arcEndLat((d: any) => d.dstLat)
      .arcEndLng((d: any) => d.dstLng)
      .arcColor((d: any) => {
        const col = typeArcColor(d.type as RailType)
        return [col, col]
      })
      .arcStroke((d: any) => {
        if (d.type === "high-speed") return 0.5
        if (d.type === "planned")    return 0.25
        return 0.35
      })
      .arcAltitudeAutoScale(0.3)
      .arcDashLength((d: any) => d.type === "planned" ? 0.4 : 1)
      .arcDashGap((d: any) => d.type === "planned" ? 0.3 : 0)
      .arcDashAnimateTime((d: any) => d.type === "planned" ? 2500 : 0)
      .arcLabel((d: any) => `<div style="background:rgba(0,0,0,0.85);color:#fff;padding:6px 10px;border-radius:8px;font-size:12px;border:1px solid ${typeArcColor(d.type)}60">
        <b>${d.name}</b><br/>
        <span style="color:${typeArcColor(d.type)}">${d.type === "high-speed" ? "HSR" : d.type}</span> · ${fmtKm(d.lengthKm)} · ${d.speedKmh} km/h
      </div>`)
      .onArcClick((d: any) => {
        const line = RAIL_LINES.find(l => l.id === d.id) ?? null
        if (line) setSelected({ kind: "line", line })
      })
  }, [filteredLines, globeReady])

  // ── Apply hub points ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!globeInst.current || !globeReady) return
    const g = globeInst.current

    g.pointsData(RAIL_HUBS)
      .pointLat("lat")
      .pointLng("lng")
      .pointAltitude(0.01)
      .pointRadius((d: any) => Math.sqrt(d.passengersMillion) * 0.02)
      .pointColor((d: any) => {
        const intensity = Math.min(1, d.passengersMillion / 800)
        const r = Math.round(51  + intensity * (255 - 51))
        const gg = Math.round(204 + intensity * (220 - 204))
        const b  = Math.round(221 + intensity * (60  - 221))
        return `rgba(${r},${gg},${b},0.9)`
      })
      .pointsMerge(false)
      .pointLabel((d: any) =>
        `<div style="background:rgba(0,0,0,0.85);color:#fff;padding:6px 10px;border-radius:8px;font-size:12px;border:1px solid rgba(51,204,221,0.4)">
          <b>${d.name}</b><br/>
          <span style="color:var(--accent,#33ccdd)">${d.city}, ${d.country}</span><br/>
          ${d.passengersMillion}M annual passengers
        </div>`
      )
      .onPointClick((d: any) => {
        const hub = RAIL_HUBS.find(h => h.id === d.id) ?? null
        if (hub) setSelected({ kind: "hub", hub })
      })
  }, [globeReady])

  // ── Apply country polygons ────────────────────────────────────────────────────
  const applyCountries = useCallback((
    features: CountryFeature[],
    hovered: CountryFeature | null,
    sel: CountryFeature | null,
  ) => {
    const g = globeInst.current
    if (!g || !features.length) return

    g.polygonsData(features)
      .polygonCapColor((d: any) => {
        if (sel?.properties.name === d.properties.name)    return "rgba(253,231,37,0.10)"
        if (hovered?.properties.name === d.properties.name) return "rgba(255,255,255,0.06)"
        return "rgba(0,0,0,0)"
      })
      .polygonSideColor(() => "rgba(0,0,0,0)")
      .polygonStrokeColor((d: any) => {
        if (sel?.properties.name === d.properties.name)    return "rgba(253,231,37,0.9)"
        if (hovered?.properties.name === d.properties.name) return "rgba(255,255,255,0.6)"
        return "rgba(255,255,255,0.18)"
      })
      .polygonAltitude(0.005)
      .onPolygonHover((d: any) => setHoveredCountry(d as CountryFeature | null))
      .onPolygonClick((d: any) => {
        const f = d as CountryFeature
        setSelectedCountry(prev =>
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

  // ── Spin control ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!globeInst.current) return
    globeInst.current.controls().autoRotate = isSpinning
  }, [isSpinning])

  // ── Resize ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onResize = () => {
      if (globeInst.current && globeRef.current)
        globeInst.current.width(globeRef.current.clientWidth).height(globeRef.current.clientHeight)
    }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const handleFilterClick = useCallback((f: FilterType) => {
    setFilter(f)
    setSelected(null)
  }, [])

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="relative" style={{ minHeight: "calc(100vh - 64px)", background: "#000508", overflow: "hidden" }}>

      {/* Globe canvas */}
      <div ref={globeRef} className="absolute inset-0" />

      {/* Loading overlay */}
      {!globeReady && (
        <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ background: "#000508" }}>
          <div className="text-center">
            <div className="mb-4 relative w-12 h-12 mx-auto">
              <div className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
                style={{ borderTopColor: "#ff3c3c", borderRightColor: "rgba(255,60,60,0.3)" }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Loading rail network…</p>
            <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>globe.gl initialising</p>
          </div>
        </div>
      )}

      {/* ── Top-left: title + stats ─────────────────────────────────────────── */}
      <div className="absolute top-5 left-5 z-5 pointer-events-none" style={{ maxWidth: 300 }}>
        <div className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase px-2.5 py-1 rounded mb-2"
          style={{ background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid rgba(51,204,221,0.25)" }}>
          UC24 · WORLD RAIL NETWORKS
        </div>
        <h1 className="text-xl font-extrabold mb-1" style={{ color: "var(--text)", letterSpacing: "-0.02em", textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}>
          Global Railway Infrastructure
        </h1>
        <p className="text-xs mb-3" style={{ color: "var(--muted)", lineHeight: 1.5 }}>
          {RAIL_LINES.length} corridors · {fmtKm(totalKm)} tracked · {RAIL_HUBS.length} major hubs
        </p>
        <div className="flex flex-wrap gap-1.5">
          {(Object.entries(countByType) as [RailType, number][])
            .filter(([, n]) => n > 0)
            .map(([type, count]) => (
              <div key={type} className="flex items-center gap-1 px-2 py-1 rounded-md text-xs"
                style={{ background: "rgba(0,0,0,0.70)", border: `1px solid ${TYPE_HEX[type]}40`, backdropFilter: "blur(8px)", color: "var(--text)" }}>
                <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: TYPE_HEX[type] }} />
                <span style={{ color: "var(--muted)" }}>
                  {type === "high-speed" ? "HSR" : type.charAt(0).toUpperCase() + type.slice(1)}:
                </span>
                <span className="font-bold">{count}</span>
              </div>
            ))}
        </div>
      </div>

      {/* ── Top-right: controls + HSR leaderboard ─────────────────────────────── */}
      <div className="absolute top-5 right-5 z-5 w-56 pointer-events-auto">
        {/* Spin / About buttons */}
        <div className="flex gap-2 mb-3 justify-end">
          <button onClick={() => setIsSpinning(s => !s)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)", color: "var(--muted)", backdropFilter: "blur(8px)" }}>
            {isSpinning ? "Pause" : "Spin"}
          </button>
          <Link href="/uc24/details"
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "rgba(255,60,60,0.18)", border: "1px solid rgba(255,60,60,0.4)", color: "#ff3c3c", backdropFilter: "blur(8px)" }}>
            About →
          </Link>
        </div>

        {/* HSR leaderboard */}
        <div className="rounded-xl p-3"
          style={{ background: "rgba(0,0,0,0.78)", border: "1px solid rgba(255,255,255,0.10)", backdropFilter: "blur(14px)" }}>
          <p className="text-xs font-bold tracking-widest uppercase mb-2.5" style={{ color: "var(--muted)" }}>
            Race to Connect — HSR km
          </p>
          <div className="flex flex-col gap-1.5">
            {hsrByCountry.map((entry, i) => {
              const maxKm = hsrByCountry[0].km
              const pct = (entry.km / maxKm) * 100
              return (
                <div key={entry.country}>
                  <div className="flex justify-between mb-0.5">
                    <span className="text-xs" style={{ color: i < 3 ? "var(--text)" : "var(--muted)", fontWeight: i === 0 ? 700 : 400 }}>
                      {i + 1}. {entry.country}
                    </span>
                    <span className="text-xs font-semibold" style={{ color: TYPE_HEX["high-speed"] }}>
                      {fmtKm(entry.km)}
                    </span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div style={{
                      height: "100%", width: `${pct}%`, borderRadius: 2,
                      background: `linear-gradient(to right, ${TYPE_HEX["high-speed"]}, rgba(255,150,150,0.6))`,
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Bottom-left: type filter buttons ───────────────────────────────────── */}
      <div className="absolute bottom-6 left-5 z-5 flex flex-wrap gap-1.5" style={{ maxWidth: 440 }}>
        {([
          { key: "all",          label: "All Lines"    },
          { key: "high-speed",   label: "High-Speed"   },
          { key: "conventional", label: "Conventional" },
          { key: "planned",      label: "Planned"      },
          { key: "freight",      label: "Freight"      },
          { key: "metro",        label: "Metro"        },
        ] as { key: FilterType; label: string }[]).map(({ key, label }) => {
          const active    = filter === key
          const color     = key === "all" ? "var(--accent)" : TYPE_HEX[key as RailType]
          const colorDim  = key === "all" ? "var(--accent-dim)" : `${TYPE_HEX[key as RailType]}20`
          return (
            <button key={key} onClick={() => handleFilterClick(key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all pointer-events-auto"
              style={{
                border:         `1px solid ${active ? color : "rgba(255,255,255,0.12)"}`,
                background:     active ? colorDim : "rgba(0,0,0,0.70)",
                color:          active ? color : "var(--muted)",
                backdropFilter: "blur(8px)",
              }}>
              {key !== "all" && (
                <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: TYPE_HEX[key as RailType] }} />
              )}
              {label}
            </button>
          )
        })}
      </div>

      {/* ── Bottom-right: selected item / country stats panel ─────────────────── */}
      <div className="absolute bottom-6 right-5 z-5 w-72 flex flex-col gap-2 items-end pointer-events-auto">

        {/* Country stats panel */}
        {selectedCountry && (
          <div className="w-full rounded-xl p-4"
            style={{ background: "rgba(0,0,0,0.88)", border: "1px solid rgba(253,231,37,0.35)", backdropFilter: "blur(14px)" }}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm font-bold" style={{ color: "#fde725" }}>{selectedCountry.properties.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  {countryStats ? `${countryStats.lines.length} lines · ${fmtKm(countryStats.totalLineKm)} · ${countryStats.hubs.length} hub${countryStats.hubs.length !== 1 ? "s" : ""}` : "No rail data"}
                </p>
              </div>
              <button onClick={() => setSelectedCountry(null)}
                className="opacity-40 hover:opacity-80 text-base" style={{ color: "var(--muted)" }}>✕</button>
            </div>
            {countryStats && countryStats.lines.length > 0 && (
              <div className="flex flex-col gap-1 mt-2">
                {countryStats.lines.slice(0, 4).map(l => (
                  <div key={l.id} className="flex items-center gap-2 px-2 py-1 rounded-lg text-xs"
                    style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${TYPE_HEX[l.type]}25` }}>
                    <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: TYPE_HEX[l.type] }} />
                    <span className="flex-1 truncate" style={{ color: "var(--text)" }}>{l.name}</span>
                    <span className="font-mono opacity-60" style={{ color: "var(--muted)" }}>{fmtKm(l.lengthKm)}</span>
                  </div>
                ))}
                {countryStats.lines.length > 4 && (
                  <p className="text-xs text-center mt-0.5" style={{ color: "var(--muted)", opacity: 0.6 }}>
                    +{countryStats.lines.length - 4} more lines
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Selected rail line / hub panel */}
        {selected && (
          <div className="w-full rounded-xl p-4 relative"
            style={{
              background:     "rgba(0,0,0,0.88)",
              border:         `1px solid ${selected.kind === "line" ? TYPE_HEX[selected.line!.type] + "60" : "rgba(51,204,221,0.35)"}`,
              backdropFilter: "blur(14px)",
            }}>
            <button onClick={() => setSelected(null)}
              className="absolute top-2.5 right-2.5 opacity-40 hover:opacity-80 text-base"
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}>
              ✕
            </button>

            {selected.kind === "line" && selected.line && (() => {
              const l = selected.line
              const typeColor = TYPE_HEX[l.type]
              return (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: typeColor }} />
                    <p className="text-sm font-bold leading-snug pr-5" style={{ color: "var(--text)" }}>{l.name}</p>
                  </div>
                  <p className="text-xs mb-2.5" style={{ color: "var(--muted)" }}>
                    {l.country} · {l.operator}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Type",      value: l.type === "high-speed" ? "High-Speed" : l.type.charAt(0).toUpperCase() + l.type.slice(1) },
                      { label: "Length",    value: fmtKm(l.lengthKm) },
                      { label: "Top Speed", value: `${l.speedKmh} km/h` },
                      { label: "Opened",    value: l.openedYear ? l.openedYear.toString() : "N/A" },
                    ].map(m => (
                      <div key={m.label} className="px-2.5 py-2 rounded-lg"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <p className="text-xs mb-0.5" style={{ color: "var(--muted)", fontSize: 10 }}>{m.label}</p>
                        <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{m.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2.5 px-2.5 py-1.5 rounded-md inline-flex items-center gap-1.5"
                    style={{ background: `${typeColor}10`, border: `1px solid ${typeColor}30` }}>
                    <span className="w-2 h-2 rounded-sm" style={{ background: typeColor }} />
                    <span className="text-xs font-semibold" style={{ color: typeColor }}>
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
                  <p className="text-sm font-bold mb-1 pr-5" style={{ color: "var(--text)" }}>{h.name}</p>
                  <p className="text-xs mb-2.5" style={{ color: "var(--muted)" }}>{h.city}, {h.country}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Annual Pax",   value: `${h.passengersMillion}M` },
                      { label: "Station Type", value: h.type.charAt(0).toUpperCase() + h.type.slice(1) },
                      { label: "Latitude",     value: h.lat.toFixed(2) + "°" },
                      { label: "Longitude",    value: h.lng.toFixed(2) + "°" },
                    ].map(m => (
                      <div key={m.label} className="px-2.5 py-2 rounded-lg"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <p className="text-xs mb-0.5" style={{ color: "var(--muted)", fontSize: 10 }}>{m.label}</p>
                        <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{m.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2.5">
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                      <div style={{
                        height: "100%",
                        width: `${Math.min(100, (h.passengersMillion / 800) * 100)}%`,
                        background: "linear-gradient(to right, var(--accent,#33ccdd), rgba(51,204,221,0.4))",
                        borderRadius: 2,
                      }} />
                    </div>
                    <p className="text-xs mt-1" style={{ color: "var(--muted)", fontSize: 10 }}>
                      {h.passengersMillion}M annual passengers vs. 800M peak (Shinjuku)
                    </p>
                  </div>
                </>
              )
            })()}
          </div>
        )}
      </div>

      {/* ── Hover country label ─────────────────────────────────────────────────── */}
      {hoveredCountry && !selectedCountry && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-5 pointer-events-none">
          <div className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "rgba(0,0,0,0.82)", border: "1px solid rgba(255,255,255,0.14)", backdropFilter: "blur(12px)", color: "var(--text)" }}>
            {hoveredCountry.properties.name} · Click to explore
          </div>
        </div>
      )}

      {/* ── Legend strip ───────────────────────────────────────────────────────── */}
      <div className="absolute pointer-events-none"
        style={{ bottom: 96, left: 20, zIndex: 5, background: "rgba(0,0,0,0.72)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, backdropFilter: "blur(10px)", padding: "7px 12px", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Legend</span>
        {([
          { type: "high-speed",   label: "HSR"          },
          { type: "conventional", label: "Conventional" },
          { type: "planned",      label: "Planned"      },
        ] as { type: RailType; label: string }[]).map(({ type, label }) => (
          <div key={type} className="flex items-center gap-1">
            <div style={{ width: 20, height: 3, borderRadius: 1, background: TYPE_HEX[type] }} />
            <span className="text-xs" style={{ color: "var(--muted)" }}>{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1">
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent,#33ccdd)", border: "1px solid rgba(255,255,255,0.3)" }} />
          <span className="text-xs" style={{ color: "var(--muted)" }}>Hub</span>
        </div>
        <div className="flex items-center gap-1">
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(253,231,37,0.6)", border: "1px solid rgba(253,231,37,0.5)" }} />
          <span className="text-xs" style={{ color: "var(--muted)" }}>Country</span>
        </div>
      </div>

    </div>
  )
}

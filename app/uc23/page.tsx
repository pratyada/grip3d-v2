"use client"

import { useState, useMemo } from "react"
import DeckGL from "@deck.gl/react"
import { _GlobeView as GlobeView } from "@deck.gl/core"
import { ColumnLayer, ScatterplotLayer, SolidPolygonLayer } from "@deck.gl/layers"
import Link from "next/link"

// ── Types ──────────────────────────────────────────────────────────────────────

interface Building {
  id: string
  name: string
  city: string
  country: string
  lat: number
  lng: number
  heightM: number
  floors: number
  year: number
  status: "complete" | "under-construction" | "proposed"
  use: "mixed" | "office" | "residential" | "hotel" | "observation"
  architect: string
}

// ── Data ───────────────────────────────────────────────────────────────────────

const BUILDINGS: Building[] = [
  {
    id: "jeddah-tower",
    name: "Jeddah Tower",
    city: "Jeddah",
    country: "Saudi Arabia",
    lat: 21.668,
    lng: 39.106,
    heightM: 1008,
    floors: 167,
    year: 2028,
    status: "under-construction",
    use: "mixed",
    architect: "Adrian Smith + Gordon Gill Architecture",
  },
  {
    id: "burj-khalifa",
    name: "Burj Khalifa",
    city: "Dubai",
    country: "UAE",
    lat: 25.197,
    lng: 55.274,
    heightM: 828,
    floors: 163,
    year: 2010,
    status: "complete",
    use: "mixed",
    architect: "Skidmore, Owings & Merrill (SOM)",
  },
  {
    id: "shanghai-tower",
    name: "Shanghai Tower",
    city: "Shanghai",
    country: "China",
    lat: 31.235,
    lng: 121.501,
    heightM: 632,
    floors: 128,
    year: 2015,
    status: "complete",
    use: "mixed",
    architect: "Gensler",
  },
  {
    id: "makkah-clock",
    name: "Makkah Clock Royal Tower",
    city: "Mecca",
    country: "Saudi Arabia",
    lat: 21.419,
    lng: 39.826,
    heightM: 601,
    floors: 120,
    year: 2012,
    status: "complete",
    use: "hotel",
    architect: "Dar Al-Handasah (Shair and Partners)",
  },
  {
    id: "ping-an",
    name: "Ping An Finance Centre",
    city: "Shenzhen",
    country: "China",
    lat: 22.537,
    lng: 114.057,
    heightM: 599,
    floors: 115,
    year: 2017,
    status: "complete",
    use: "office",
    architect: "Kohn Pedersen Fox (KPF)",
  },
  {
    id: "goldin-finance-117",
    name: "Goldin Finance 117",
    city: "Tianjin",
    country: "China",
    lat: 39.789,
    lng: 117.071,
    heightM: 597,
    floors: 128,
    year: 2024,
    status: "complete",
    use: "mixed",
    architect: "P&T Group",
  },
  {
    id: "merdeka-118",
    name: "Merdeka 118",
    city: "Kuala Lumpur",
    country: "Malaysia",
    lat: 3.143,
    lng: 101.688,
    heightM: 679,
    floors: 118,
    year: 2023,
    status: "complete",
    use: "mixed",
    architect: "Fender Katsalidis",
  },
  {
    id: "lotte-world-tower",
    name: "Lotte World Tower",
    city: "Seoul",
    country: "South Korea",
    lat: 37.513,
    lng: 127.102,
    heightM: 555,
    floors: 123,
    year: 2017,
    status: "complete",
    use: "mixed",
    architect: "Kohn Pedersen Fox (KPF)",
  },
  {
    id: "one-wtc",
    name: "One World Trade Center",
    city: "New York",
    country: "USA",
    lat: 40.713,
    lng: -74.013,
    heightM: 541,
    floors: 104,
    year: 2014,
    status: "complete",
    use: "office",
    architect: "Skidmore, Owings & Merrill (SOM)",
  },
  {
    id: "guangzhou-ctf",
    name: "Guangzhou CTF Finance Centre",
    city: "Guangzhou",
    country: "China",
    lat: 23.121,
    lng: 113.327,
    heightM: 530,
    floors: 111,
    year: 2016,
    status: "complete",
    use: "mixed",
    architect: "Kohn Pedersen Fox (KPF)",
  },
  {
    id: "tianjin-ctf",
    name: "Tianjin CTF Finance Centre",
    city: "Tianjin",
    country: "China",
    lat: 39.724,
    lng: 117.218,
    heightM: 530,
    floors: 97,
    year: 2019,
    status: "complete",
    use: "mixed",
    architect: "Skidmore, Owings & Merrill (SOM)",
  },
  {
    id: "citic-tower",
    name: "CITIC Tower",
    city: "Beijing",
    country: "China",
    lat: 39.909,
    lng: 116.461,
    heightM: 528,
    floors: 109,
    year: 2018,
    status: "complete",
    use: "office",
    architect: "Kohn Pedersen Fox (KPF)",
  },
  {
    id: "tianjin-chow-tai-fook",
    name: "Tianjin Chow Tai Fook Binhai Center",
    city: "Tianjin",
    country: "China",
    lat: 39.015,
    lng: 117.745,
    heightM: 530,
    floors: 97,
    year: 2019,
    status: "complete",
    use: "mixed",
    architect: "Skidmore, Owings & Merrill (SOM)",
  },
  {
    id: "taipei-101",
    name: "Taipei 101",
    city: "Taipei",
    country: "Taiwan",
    lat: 25.034,
    lng: 121.565,
    heightM: 508,
    floors: 101,
    year: 2004,
    status: "complete",
    use: "mixed",
    architect: "C.Y. Lee & Partners",
  },
  {
    id: "swfc",
    name: "Shanghai World Financial Center",
    city: "Shanghai",
    country: "China",
    lat: 31.235,
    lng: 121.5,
    heightM: 492,
    floors: 101,
    year: 2008,
    status: "complete",
    use: "mixed",
    architect: "Kohn Pedersen Fox (KPF)",
  },
  {
    id: "icc",
    name: "International Commerce Centre",
    city: "Hong Kong",
    country: "China",
    lat: 22.303,
    lng: 114.16,
    heightM: 484,
    floors: 108,
    year: 2010,
    status: "complete",
    use: "mixed",
    architect: "Kohn Pedersen Fox (KPF)",
  },
  {
    id: "landmark-81",
    name: "Landmark 81",
    city: "Ho Chi Minh City",
    country: "Vietnam",
    lat: 10.729,
    lng: 106.722,
    heightM: 461,
    floors: 81,
    year: 2018,
    status: "complete",
    use: "mixed",
    architect: "Atkins",
  },
  {
    id: "lakhta-center",
    name: "Lakhta Center",
    city: "St Petersburg",
    country: "Russia",
    lat: 59.988,
    lng: 30.178,
    heightM: 462,
    floors: 87,
    year: 2018,
    status: "complete",
    use: "office",
    architect: "RMJM / Gorproject",
  },
  {
    id: "changsha-ifs",
    name: "Changsha IFS Tower T1",
    city: "Changsha",
    country: "China",
    lat: 28.228,
    lng: 112.944,
    heightM: 452,
    floors: 94,
    year: 2018,
    status: "complete",
    use: "mixed",
    architect: "Aedas",
  },
  {
    id: "petronas-1",
    name: "Petronas Tower 1",
    city: "Kuala Lumpur",
    country: "Malaysia",
    lat: 3.158,
    lng: 101.712,
    heightM: 452,
    floors: 88,
    year: 1998,
    status: "complete",
    use: "office",
    architect: "César Pelli & Associates",
  },
  {
    id: "petronas-2",
    name: "Petronas Tower 2",
    city: "Kuala Lumpur",
    country: "Malaysia",
    lat: 3.157,
    lng: 101.713,
    heightM: 452,
    floors: 88,
    year: 1998,
    status: "complete",
    use: "office",
    architect: "César Pelli & Associates",
  },
  {
    id: "zifeng-tower",
    name: "Zifeng Tower",
    city: "Nanjing",
    country: "China",
    lat: 32.06,
    lng: 118.797,
    heightM: 450,
    floors: 89,
    year: 2010,
    status: "complete",
    use: "mixed",
    architect: "Skidmore, Owings & Merrill (SOM)",
  },
  {
    id: "suzhou-ifs",
    name: "Suzhou IFS",
    city: "Suzhou",
    country: "China",
    lat: 31.299,
    lng: 120.747,
    heightM: 450,
    floors: 92,
    year: 2019,
    status: "complete",
    use: "mixed",
    architect: "Skidmore, Owings & Merrill (SOM)",
  },
  {
    id: "willis-tower",
    name: "Willis Tower",
    city: "Chicago",
    country: "USA",
    lat: 41.879,
    lng: -87.636,
    heightM: 442,
    floors: 108,
    year: 1973,
    status: "complete",
    use: "office",
    architect: "Skidmore, Owings & Merrill (SOM)",
  },
  {
    id: "empire-state",
    name: "Empire State Building",
    city: "New York",
    country: "USA",
    lat: 40.748,
    lng: -73.985,
    heightM: 443,
    floors: 102,
    year: 1931,
    status: "complete",
    use: "office",
    architect: "Shreve, Lamb & Harmon",
  },
  {
    id: "kk100",
    name: "KK100",
    city: "Shenzhen",
    country: "China",
    lat: 22.541,
    lng: 114.121,
    heightM: 442,
    floors: 100,
    year: 2011,
    status: "complete",
    use: "mixed",
    architect: "TFP Farrells",
  },
  {
    id: "guangzhou-ifc",
    name: "Guangzhou International Finance Centre",
    city: "Guangzhou",
    country: "China",
    lat: 23.13,
    lng: 113.319,
    heightM: 440,
    floors: 103,
    year: 2010,
    status: "complete",
    use: "mixed",
    architect: "Wilkinson Eyre",
  },
  {
    id: "yongan-ifc",
    name: "Yongan International Finance Center",
    city: "Guangzhou",
    country: "China",
    lat: 23.115,
    lng: 113.325,
    heightM: 440,
    floors: 95,
    year: 2023,
    status: "complete",
    use: "mixed",
    architect: "Skidmore, Owings & Merrill (SOM)",
  },
  {
    id: "432-park",
    name: "432 Park Avenue",
    city: "New York",
    country: "USA",
    lat: 40.762,
    lng: -73.972,
    heightM: 426,
    floors: 96,
    year: 2015,
    status: "complete",
    use: "residential",
    architect: "Rafael Viñoly Architects",
  },
  {
    id: "marina-101",
    name: "Marina 101",
    city: "Dubai",
    country: "UAE",
    lat: 25.077,
    lng: 55.14,
    heightM: 425,
    floors: 101,
    year: 2017,
    status: "complete",
    use: "mixed",
    architect: "de Stefano + Partners",
  },
  {
    id: "trump-chicago",
    name: "Trump International Hotel",
    city: "Chicago",
    country: "USA",
    lat: 41.889,
    lng: -87.627,
    heightM: 423,
    floors: 98,
    year: 2009,
    status: "complete",
    use: "hotel",
    architect: "Skidmore, Owings & Merrill (SOM)",
  },
  {
    id: "jin-mao",
    name: "Jin Mao Tower",
    city: "Shanghai",
    country: "China",
    lat: 31.235,
    lng: 121.498,
    heightM: 421,
    floors: 88,
    year: 1999,
    status: "complete",
    use: "mixed",
    architect: "Skidmore, Owings & Merrill (SOM)",
  },
  {
    id: "princess-tower",
    name: "Princess Tower",
    city: "Dubai",
    country: "UAE",
    lat: 25.096,
    lng: 55.14,
    heightM: 414,
    floors: 101,
    year: 2012,
    status: "complete",
    use: "residential",
    architect: "Eng. Adnan Saffarini",
  },
  {
    id: "al-hamra",
    name: "Al Hamra Tower",
    city: "Kuwait City",
    country: "Kuwait",
    lat: 29.369,
    lng: 47.993,
    heightM: 412,
    floors: 77,
    year: 2011,
    status: "complete",
    use: "mixed",
    architect: "Skidmore, Owings & Merrill (SOM)",
  },
  {
    id: "two-ifc",
    name: "Two International Finance Centre",
    city: "Hong Kong",
    country: "China",
    lat: 22.286,
    lng: 114.158,
    heightM: 412,
    floors: 88,
    year: 2003,
    status: "complete",
    use: "office",
    architect: "César Pelli & Associates",
  },
  {
    id: "23-marina",
    name: "23 Marina",
    city: "Dubai",
    country: "UAE",
    lat: 25.09,
    lng: 55.141,
    heightM: 395,
    floors: 89,
    year: 2012,
    status: "complete",
    use: "residential",
    architect: "Aedas",
  },
  {
    id: "30-hudson-yards",
    name: "30 Hudson Yards",
    city: "New York",
    country: "USA",
    lat: 40.754,
    lng: -74.002,
    heightM: 387,
    floors: 73,
    year: 2019,
    status: "complete",
    use: "office",
    architect: "Kohn Pedersen Fox (KPF)",
  },
  {
    id: "moscow-city-tower",
    name: "Moscow City Tower",
    city: "Moscow",
    country: "Russia",
    lat: 55.749,
    lng: 37.539,
    heightM: 374,
    floors: 97,
    year: 2016,
    status: "complete",
    use: "mixed",
    architect: "GORPROJECT / Skidmore, Owings & Merrill (SOM)",
  },
  {
    id: "bank-of-america",
    name: "Bank of America Tower",
    city: "New York",
    country: "USA",
    lat: 40.755,
    lng: -73.984,
    heightM: 366,
    floors: 55,
    year: 2009,
    status: "complete",
    use: "office",
    architect: "Cook + Fox Architects",
  },
  {
    id: "jumeirah-emirates",
    name: "Jumeirah Emirates Towers",
    city: "Dubai",
    country: "UAE",
    lat: 25.219,
    lng: 55.28,
    heightM: 355,
    floors: 56,
    year: 2000,
    status: "complete",
    use: "mixed",
    architect: "Norr Group",
  },
  {
    id: "index-tower",
    name: "Index Tower",
    city: "Dubai",
    country: "UAE",
    lat: 25.082,
    lng: 55.157,
    heightM: 328,
    floors: 80,
    year: 2010,
    status: "complete",
    use: "mixed",
    architect: "Foster + Partners",
  },
  {
    id: "q1-tower",
    name: "Q1 Tower",
    city: "Gold Coast",
    country: "Australia",
    lat: -27.996,
    lng: 153.432,
    heightM: 322,
    floors: 78,
    year: 2005,
    status: "complete",
    use: "residential",
    architect: "Sunland Group (in-house)",
  },
  {
    id: "gate-to-east",
    name: "Gate to the East",
    city: "Suzhou",
    country: "China",
    lat: 31.306,
    lng: 120.598,
    heightM: 302,
    floors: 60,
    year: 2015,
    status: "complete",
    use: "office",
    architect: "RMJM",
  },
  {
    id: "kingdom-centre",
    name: "Kingdom Centre",
    city: "Riyadh",
    country: "Saudi Arabia",
    lat: 24.689,
    lng: 46.685,
    heightM: 302,
    floors: 100,
    year: 2002,
    status: "complete",
    use: "mixed",
    architect: "Ellerbe Becket / Omrania & Associates",
  },
  {
    id: "one-zaabeel",
    name: "One Za'abeel",
    city: "Dubai",
    country: "UAE",
    lat: 25.22,
    lng: 55.3,
    heightM: 306,
    floors: 67,
    year: 2023,
    status: "complete",
    use: "mixed",
    architect: "Nikken Sekkei",
  },
  {
    id: "eureka-tower",
    name: "Eureka Tower",
    city: "Melbourne",
    country: "Australia",
    lat: -37.821,
    lng: 144.964,
    heightM: 297,
    floors: 92,
    year: 2006,
    status: "complete",
    use: "residential",
    architect: "Fender Katsalidis",
  },
  {
    id: "the-shard",
    name: "The Shard",
    city: "London",
    country: "UK",
    lat: 51.505,
    lng: -0.086,
    heightM: 310,
    floors: 72,
    year: 2012,
    status: "complete",
    use: "mixed",
    architect: "Renzo Piano Building Workshop",
  },
  {
    id: "adnoc-hq",
    name: "ADNOC Headquarters",
    city: "Abu Dhabi",
    country: "UAE",
    lat: 24.376,
    lng: 54.468,
    heightM: 342,
    floors: 65,
    year: 2015,
    status: "complete",
    use: "office",
    architect: "Gensler",
  },
  {
    id: "azrieli-sarona",
    name: "Azrieli Sarona Tower",
    city: "Tel Aviv",
    country: "Israel",
    lat: 32.069,
    lng: 34.792,
    heightM: 238,
    floors: 49,
    year: 2017,
    status: "complete",
    use: "office",
    architect: "Moshe Tzur Architects",
  },
  {
    id: "bahrain-wtc",
    name: "Bahrain World Trade Center",
    city: "Manama",
    country: "Bahrain",
    lat: 26.214,
    lng: 50.584,
    heightM: 240,
    floors: 50,
    year: 2008,
    status: "complete",
    use: "office",
    architect: "Atkins",
  },
  {
    id: "al-faisaliah",
    name: "Al Faisaliah Center",
    city: "Riyadh",
    country: "Saudi Arabia",
    lat: 24.686,
    lng: 46.684,
    heightM: 267,
    floors: 44,
    year: 2000,
    status: "complete",
    use: "mixed",
    architect: "Foster + Partners",
  },
  {
    id: "commerzbank",
    name: "Commerzbank Tower",
    city: "Frankfurt",
    country: "Germany",
    lat: 50.11,
    lng: 8.671,
    heightM: 259,
    floors: 56,
    year: 1997,
    status: "complete",
    use: "office",
    architect: "Foster + Partners",
  },
  {
    id: "one-canada-square",
    name: "One Canada Square",
    city: "London",
    country: "UK",
    lat: 51.505,
    lng: -0.019,
    heightM: 235,
    floors: 50,
    year: 1991,
    status: "complete",
    use: "office",
    architect: "César Pelli & Associates",
  },
  {
    id: "carlton-centre",
    name: "Carlton Centre",
    city: "Johannesburg",
    country: "South Africa",
    lat: -26.202,
    lng: 28.045,
    heightM: 223,
    floors: 50,
    year: 1973,
    status: "complete",
    use: "office",
    architect: "Skidmore, Owings & Merrill (SOM)",
  },
  {
    id: "tour-montparnasse",
    name: "Tour Montparnasse",
    city: "Paris",
    country: "France",
    lat: 48.842,
    lng: 2.322,
    heightM: 210,
    floors: 59,
    year: 1973,
    status: "complete",
    use: "office",
    architect: "Eugène Beaudouin / Urbain Cassan",
  },
  {
    id: "costain-place",
    name: "Costain Place",
    city: "Lagos",
    country: "Nigeria",
    lat: 6.45,
    lng: 3.38,
    heightM: 160,
    floors: 35,
    year: 2024,
    status: "complete",
    use: "mixed",
    architect: "Perkins & Will",
  },
  {
    id: "22-bishopsgate",
    name: "22 Bishopsgate",
    city: "London",
    country: "UK",
    lat: 51.515,
    lng: -0.082,
    heightM: 278,
    floors: 62,
    year: 2020,
    status: "complete",
    use: "office",
    architect: "PLP Architecture",
  },
  {
    id: "wuhan-greenland",
    name: "Wuhan Greenland Center",
    city: "Wuhan",
    country: "China",
    lat: 30.614,
    lng: 114.296,
    heightM: 475,
    floors: 100,
    year: 2024,
    status: "under-construction",
    use: "mixed",
    architect: "Adrian Smith + Gordon Gill Architecture",
  },
  {
    id: "burj-azizi",
    name: "Burj Azizi",
    city: "Dubai",
    country: "UAE",
    lat: 25.2,
    lng: 55.27,
    heightM: 725,
    floors: 131,
    year: 2028,
    status: "under-construction",
    use: "mixed",
    architect: "Norr Group",
  },
  {
    id: "nakheel-harbour-tower",
    name: "Nakheel Harbour Tower",
    city: "Dubai",
    country: "UAE",
    lat: 25.12,
    lng: 55.056,
    heightM: 1000,
    floors: 200,
    year: 2030,
    status: "proposed",
    use: "mixed",
    architect: "Skidmore, Owings & Merrill (SOM)",
  },
  {
    id: "shenzhen-hk-connect",
    name: "Shenzhen-Hong Kong Stock Connect Center",
    city: "Shenzhen",
    country: "China",
    lat: 22.52,
    lng: 114.09,
    heightM: 600,
    floors: 115,
    year: 2027,
    status: "proposed",
    use: "office",
    architect: "Kohn Pedersen Fox (KPF)",
  },
]

// ── Constants ──────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, [number, number, number, number]> = {
  complete:             [253, 231,  37, 220],  // yellow
  "under-construction": [255, 140,   0, 230],  // orange
  proposed:             [100, 149, 237, 200],  // cornflower blue
}

const EARTH_POLYGON = [[-180, 90], [180, 90], [180, -90], [-180, -90], [-180, 90]]

const GLOBE_VIEW = new GlobeView({ id: "globe", controller: true })

const INITIAL_VIEW_STATE = { longitude: 45, latitude: 25, zoom: 1.6 }

type StatusFilter = "all" | "complete" | "under-construction" | "proposed"

// ── Component ──────────────────────────────────────────────────────────────────

export default function UC23Page() {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE)
  const [selected,  setSelected]  = useState<Building | null>(null)
  const [filter,    setFilter]    = useState<StatusFilter>("all")
  const [sortBy,    setSortBy]    = useState<"height" | "year">("height")

  const filtered = useMemo(
    () => filter === "all" ? BUILDINGS : BUILDINGS.filter(b => b.status === filter),
    [filter],
  )

  const maxHeight = useMemo(() => Math.max(...filtered.map(b => b.heightM)), [filtered])

  const layers = useMemo(() => [
    // Earth background
    new SolidPolygonLayer({
      id: "earth",
      data: [{ polygon: EARTH_POLYGON }],
      getPolygon: (d: any) => d.polygon,
      getFillColor: [8, 18, 38, 255],
      stroked: false,
    }),

    // Glow dots at base
    new ScatterplotLayer<Building>({
      id: "glows",
      data: filtered,
      getPosition:   (d) => [d.lng, d.lat],
      getColor:      (d) => STATUS_COLOR[d.status] ?? ([200, 200, 200, 120] as [number,number,number,number]),
      getRadius:     80000,
      radiusUnits:   "meters",
      opacity:       0.35,
      pickable:      false,
    }),

    // Column layer — 3D extruded buildings
    new ColumnLayer<Building>({
      id: "buildings",
      data: filtered,
      diskResolution: 12,
      radius: 35000,
      extruded: true,
      getPosition:   (d) => [d.lng, d.lat],
      getElevation:  (d) => (d.heightM / maxHeight) * 6_500_000,
      getFillColor:  (d) => STATUS_COLOR[d.status] ?? ([200, 200, 200, 200] as [number,number,number,number]),
      getLineColor:  [0, 0, 0, 80] as [number, number, number, number],
      lineWidthMinPixels: 1,
      pickable: true,
      autoHighlight: true,
      highlightColor: [255, 255, 255, 60] as [number, number, number, number],
      onClick: (info: any) => setSelected(info.object ?? null),
    }),
  ], [filtered, maxHeight])

  const top10 = useMemo(
    () =>
      [...BUILDINGS]
        .sort((a, b) => sortBy === "height" ? b.heightM - a.heightM : b.year - a.year)
        .slice(0, 10),
    [sortBy],
  )

  return (
    <div className="relative" style={{ height: "calc(100vh - 64px)", background: "#000810" }}>
      <DeckGL
        views={GLOBE_VIEW}
        viewState={viewState}
        onViewStateChange={({ viewState: vs }: { viewState: typeof INITIAL_VIEW_STATE }) =>
          setViewState(vs)
        }
        layers={layers}
        parameters={{ cull: true } as any}
        style={{ position: "absolute", inset: "0" }}
        getCursor={() => "crosshair"}
      />

      {/* ── Top bar ── */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-4 pointer-events-none">
        <div className="pointer-events-auto">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base font-bold" style={{ color: "var(--text)" }}>
              Global Skyscraper Race
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{
                background: "rgba(253,231,37,0.15)",
                color: "#fde725",
                border: "1px solid rgba(253,231,37,0.35)",
              }}
            >
              {filtered.length} towers
            </span>
          </div>
          <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>
            World's tallest buildings — height, status &amp; race to 1000m
          </p>

          {/* Status filter */}
          <div className="flex gap-1.5 flex-wrap">
            {(["all", "complete", "under-construction", "proposed"] as StatusFilter[]).map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background:    filter === s ? "rgba(253,231,37,0.2)" : "rgba(0,0,0,0.6)",
                  border:        filter === s ? "1px solid rgba(253,231,37,0.6)" : "1px solid rgba(255,255,255,0.12)",
                  color:         filter === s ? "#fde725" : "var(--muted)",
                  backdropFilter: "blur(8px)",
                }}
              >
                {s === "all" ? "All"
                  : s === "under-construction" ? "Under Construction"
                  : s === "proposed" ? "Proposed"
                  : "Complete"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <Link
            href="/uc23/details"
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{
              background:    "rgba(253,231,37,0.12)",
              border:        "1px solid rgba(253,231,37,0.3)",
              color:         "#fde725",
              backdropFilter: "blur(8px)",
            }}
          >
            About →
          </Link>
        </div>
      </div>

      {/* ── Legend (bottom-left) ── */}
      <div className="absolute bottom-4 left-4 pointer-events-auto w-52">
        <div
          className="rounded-xl p-3"
          style={{
            background:    "rgba(0,0,0,0.82)",
            border:        "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(14px)",
          }}
        >
          <p className="text-xs font-semibold tracking-wider mb-2" style={{ color: "var(--muted)" }}>
            STATUS
          </p>
          {[
            { s: "complete",            label: "Completed",          c: "#fde725" },
            { s: "under-construction",  label: "Under Construction", c: "#ff8c00" },
            { s: "proposed",            label: "Proposed",           c: "#6495ed" },
          ].map(({ s, label, c }) => (
            <div key={s} className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: c }} />
              <span className="text-xs" style={{ color: "var(--muted)" }}>{label}</span>
            </div>
          ))}

          <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-xs mb-2" style={{ color: "var(--muted)" }}>Sort leaderboard</p>
            <div className="flex gap-1">
              {(["height", "year"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className="flex-1 px-2 py-1 rounded text-xs"
                  style={{
                    background: sortBy === s ? "rgba(253,231,37,0.2)" : "rgba(255,255,255,0.04)",
                    border:     sortBy === s ? "1px solid rgba(253,231,37,0.5)" : "1px solid rgba(255,255,255,0.1)",
                    color:      sortBy === s ? "#fde725" : "var(--muted)",
                  }}
                >
                  {s === "height" ? "Height" : "Newest"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Top-10 leaderboard (top-right) ── */}
      <div className="absolute pointer-events-auto w-64" style={{ top: "4.5rem", right: "1rem" }}>
        <div
          className="rounded-xl p-3"
          style={{
            background:    "rgba(0,0,0,0.82)",
            border:        "1px solid rgba(253,231,37,0.2)",
            backdropFilter: "blur(14px)",
          }}
        >
          <p className="text-xs font-semibold tracking-wider mb-2" style={{ color: "#fde725" }}>
            TOP 10 BY {sortBy === "height" ? "HEIGHT" : "YEAR BUILT"}
          </p>
          {top10.map((b, i) => (
            <div
              key={b.id}
              onClick={() => {
                setSelected(b)
                setViewState(v => ({ ...v, longitude: b.lng, latitude: b.lat, zoom: 3 }))
              }}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg mb-0.5 cursor-pointer transition-all"
              style={{
                background: selected?.id === b.id ? "rgba(253,231,37,0.12)" : "rgba(255,255,255,0.03)",
                border:     selected?.id === b.id ? "1px solid rgba(253,231,37,0.4)" : "1px solid transparent",
              }}
            >
              <span className="text-xs font-bold w-4 text-right flex-shrink-0" style={{ color: "var(--muted)" }}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: "var(--text)" }}>{b.name}</p>
                <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{b.city}</p>
              </div>
              <span
                className="text-xs font-bold flex-shrink-0"
                style={{ color: `rgb(${STATUS_COLOR[b.status].slice(0, 3).join(",")})` }}
              >
                {b.heightM}m
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Selected building panel (bottom-right) ── */}
      {selected && (
        <div className="absolute bottom-4 right-4 pointer-events-auto w-72">
          <div
            className="rounded-xl p-4"
            style={{
              background:    "rgba(0,0,0,0.9)",
              border:        "1px solid rgba(253,231,37,0.3)",
              backdropFilter: "blur(14px)",
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-bold" style={{ color: "#fde725" }}>{selected.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  {selected.city}, {selected.country}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="opacity-40 hover:opacity-80 transition-opacity"
                style={{ color: "var(--muted)" }}
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: "Height",    val: `${selected.heightM.toLocaleString()} m` },
                { label: "Floors",    val: selected.floors.toString() },
                { label: "Year",      val: selected.status === "complete" ? selected.year.toString() : `Est. ${selected.year}` },
                { label: "Status",    val: selected.status === "under-construction" ? "Under Construction" : selected.status === "proposed" ? "Proposed" : "Complete" },
                { label: "Use",       val: selected.use.charAt(0).toUpperCase() + selected.use.slice(1) },
                { label: "Architect", val: selected.architect },
              ].map(m => (
                <div
                  key={m.label}
                  className="rounded-lg px-2 py-1.5"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{m.label}</p>
                  <p className="text-xs font-semibold truncate" style={{ color: "var(--text)" }}>{m.val}</p>
                </div>
              ))}
            </div>

            {/* Height bar vs Burj Khalifa */}
            <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex justify-between text-xs mb-1" style={{ color: "var(--muted)" }}>
                <span>vs Burj Khalifa (828m)</span>
                <span>{Math.round((selected.heightM / 828) * 100)}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.min((selected.heightM / 1008) * 100, 100)}%`, background: "#fde725" }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

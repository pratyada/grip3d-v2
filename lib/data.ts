// =============================================================================
// HOW TO ADD A NEW USE CASE (marketing team guide)
// =============================================================================
//
// 1. Drop a tile image into:  public/img/tile-XX.jpg
// 2. Add ONE object to the `useCases` array below.
// 3. Set status: "coming-soon" while demo isn't built; "live" when ready.
// 4. Set featured: true to show on homepage.
//
// That's it — auto-appears on homepage, /use-cases, /use-cases/[slug], footer.
// =============================================================================

export interface UseCase {
  id: string
  slug: string
  title: string
  category: string
  image: string
  emoji: string
  tags: string[]
  description: string
  longDescription?: string
  highlights?: string[]
  status: "live" | "coming-soon"
  featured: boolean
  demoUrl?: string
  detailsUrl?: string
}

export interface Leader {
  name: string
  role: string
  image: string
  bio: string
  tags: string[]
  isSpecial?: boolean
}

export const useCases: UseCase[] = [
  {
    id: "UC01",
    slug: "uc1",
    title: "Satellite NTN + Ground Stations",
    category: "telecom",
    image: "/img/tile-01.jpg",
    emoji: "🛰️",
    tags: ["NTN", "Satellites", "Telco Ops", "Ground Stations", "Beam Footprints"],
    description: "Beams, coverage, gateways, and signal health — for telecom operations.",
    longDescription:
      "Visualize full non-terrestrial network operations in real-time 3D. Layer satellite orbits, ground station locations, beam footprints, and signal health metrics on a live globe — purpose-built for telecom NOC teams managing NTN infrastructure.",
    highlights: [
      "Live satellite orbit tracks and coverage footprints",
      "Ground station locations with uplink/downlink status",
      "Beam footprint visualization per service area",
      "Signal strength and latency heatmaps",
      "Multi-constellation support (LEO, MEO, GEO)",
      "NOC alert integration ready",
    ],
    status: "live",
    featured: true,
    demoUrl: "/demo/uc1/index.html",
    detailsUrl: "/uc1/details",
  },
  {
    id: "UC02",
    slug: "uc2",
    title: "Ships & Fleets on Water",
    category: "maritime",
    image: "/img/tile-02.jpg",
    emoji: "🚢",
    tags: ["Maritime", "AIS", "Ports", "ETA", "Risk"],
    description: "Routes, ports, ETAs, congestion, and risk zones on a live globe.",
    longDescription:
      "Track global maritime operations from a single live globe view. AIS-powered vessel tracking, port congestion indicators, ETA calculations, and geofenced risk zones give fleet operators complete situational awareness.",
    highlights: [
      "Live AIS vessel positions and route tracks",
      "Port status and congestion zones",
      "ETA estimation with wind/current overlay",
      "Risk zone geofencing and alerts",
      "Cargo type and flag state filtering",
      "Historical route replay",
    ],
    status: "live",
    featured: true,
    demoUrl: "/demo/uc2/index.html",
    detailsUrl: "/uc2/details",
  },
  {
    id: "UC03",
    slug: "uc3",
    title: "Artemis II — Moon Mission Tracker",
    category: "human-civilization",
    image: "/img/tile-03.jpg",
    emoji: "🚀",
    tags: ["Artemis", "NASA", "Moon", "Orion", "SLS", "Lunar", "WebGL", "Real-time"],
    description: "Real-time 3D tracker for NASA's Artemis II crewed lunar mission — Orion trajectory, live Earth-Moon geometry, crew profiles, and mission timeline.",
    longDescription:
      "Follow NASA's first crewed mission to the Moon since Apollo in real-time 3D. The Orion spacecraft's free-return trajectory is rendered on a WebGL Earth-Moon scene driven by live NASA JPL Horizons ephemeris data. Crew profiles, mission phase timeline, countdown, live telemetry estimates, and a NASA imagery feed are all included.",
    highlights: [
      "Live Moon position from NASA JPL Horizons ephemeris API",
      "Orion free-return trajectory arc rendered in 3D WebGL",
      "4-astronaut crew profiles: Wiseman, Glover, Koch, Hansen",
      "Real-time mission phase, MET clock, and countdown to launch",
      "Live distance-to-Earth, distance-to-Moon, and velocity telemetry",
      "NASA Image Library feed — latest Artemis imagery and news",
      "Drag-to-rotate and scroll-to-zoom Earth-Moon system view",
    ],
    status: "live",
    featured: true,
    demoUrl: "/uc3",
    detailsUrl: "/uc3/details",
  },
  {
    id: "UC04",
    slug: "uc4",
    title: "Weather & Meteorological Layers",
    category: "weather",
    image: "/img/tile-04.jpg",
    emoji: "🌦️",
    tags: ["Weather", "Radar", "Forecast", "Disruption", "Safety"],
    description: "Live weather overlays for planning, safety, and disruption prediction.",
    longDescription:
      "Overlay live and forecast meteorological data onto global operations. Radar loops, storm tracks, wind shear, visibility zones, and disruption probability layers help teams proactively manage weather-sensitive operations.",
    highlights: [
      "Live precipitation and radar loops",
      "Storm track forecasts and severity alerts",
      "Wind speed and direction at altitude",
      "Temperature and visibility surface layers",
      "Lightning strike real-time overlay",
      "72-hour forecast mode",
    ],
    status: "live",
    featured: true,
    demoUrl: "/demo/uc4/index.html",
    detailsUrl: "/uc4/details",
  },
  {
    id: "UC05",
    slug: "uc5",
    title: "SaaS Startup Metrics on the Globe",
    category: "analytics",
    image: "/img/tile-05.jpg",
    emoji: "🔥",
    tags: ["Churn", "Revenue", "KPIs", "Targeted Ads", "H3 Heatmap"],
    description: "Performance, churn detection, SEO and targeted ads on a live globe.",
    longDescription:
      "See where your customers are growing or churning — on the globe. Geographic KPI heatmaps, customer acquisition sources, churn risk by region, and ad targeting overlays turn abstract SaaS metrics into actionable spatial intelligence.",
    highlights: [
      "H3 hexagonal revenue and churn heatmaps",
      "Customer acquisition and LTV by geography",
      "Targeted ad spend vs. conversion by region",
      "SEO traffic flow visualization",
      "Cohort comparison across time periods",
      "Real-time MRR / ARR globe map",
    ],
    status: "live",
    featured: true,
    demoUrl: "/demo/uc5/index.html",
    detailsUrl: "/uc5/details",
  },
  {
    id: "UC07",
    slug: "uc7",
    title: "Demographics & Population",
    category: "human-civilization",
    image: "/img/tile-07.jpg",
    emoji: "📊",
    tags: ["Birthrate", "Population", "Life Expectancy", "Migration"],
    description: "46 demographic layers, One LIVE globe.",
    longDescription:
      "Explore 46 demographic and population datasets rendered on a single interactive globe.",
    highlights: [
      "46 configurable demographic data layers",
      "Population density and growth overlays",
      "Migration flow arcs by origin/destination",
      "Age structure pyramids by country",
      "Fertility and mortality rate heatmaps",
      "Urban vs. rural distribution layers",
    ],
    status: "live",
    featured: true,
    demoUrl: "/demo/uc7/index.html",
    detailsUrl: "/uc7/details",
  },
  {
    id: "UC08",
    slug: "uc8",
    title: "Plate Boundaries, Earthquakes & Volcanoes",
    category: "environment",
    image: "/img/tile-08.jpg",
    emoji: "🌋",
    tags: ["Earthquakes", "Volcanoes", "Tectonic Plates", "Seismic", "USGS"],
    description: "Tectonic plates, live earthquake alerts, and volcano status on the globe.",
    longDescription:
      "Monitor the Earth's geological pulse in real-time. Tectonic plate boundaries, live USGS earthquake feeds, active volcano status, and seismic risk zones are rendered on a high-fidelity globe.",
    highlights: [
      "Live USGS earthquake feed (M1.0+)",
      "Tectonic plate boundary visualization",
      "Active and dormant volcano locations",
      "Seismic hazard risk zones by region",
      "Historical earthquake magnitude heatmap",
      "Tsunami alert zone overlays",
    ],
    status: "live",
    featured: true,
    demoUrl: "/demo/uc8/index.html",
    detailsUrl: "/uc8/details",
  },
  {
    id: "UC10",
    slug: "uc10",
    title: "NTN End-to-End Service Assurance",
    category: "telecom",
    image: "/img/tile-10.jpg",
    emoji: "📡",
    tags: ["NTN", "Service Assurance", "4-Domain", "RTPM", "eNB KPIs", "LEO", "Kuiper"],
    description: "4-domain E2E service assurance: Satellite → Ground Station → RAN → Core, with real-time 1-min micro KPI monitoring.",
    longDescription:
      "End-to-end NTN service assurance across all four network domains — Satellite, Ground Station, RAN (eNB), and Core. Each satellite pass is evaluated across domain-specific KPIs. Overall pass status is PASS only when all 4 domains succeed.",
    highlights: [
      "4-domain scoring: Satellite + Ground Station + RAN + Core",
      "Satellite: LEO phased array, Doppler comp, EIRP, link budget",
      "Ground Station: ACU, Beacon, Signal Analyzer, BPMS KPIs",
      "RAN: 18 3GPP eNB KPIs — accessibility, retainability, quality",
      "Core: PDP activation, DPI throughput, bearer integrity",
      "RTPM 1-min micro KPI pipeline: C/C++ edge → PostgreSQL → Grafana",
      "Mesh architecture with decentralized replication across sites",
    ],
    status: "live",
    featured: true,
    demoUrl: "/uc10",
    detailsUrl: "/uc10/details",
  },
  {
    id: "UC11",
    slug: "uc11",
    title: "Live Radio Stations on the Globe",
    category: "entertainment",
    image: "/img/tile-11.jpg",
    emoji: "📻",
    tags: ["Radio", "FM", "Live Audio", "Genre Filter", "Global Radio"],
    description: "26,000+ internet radio stations from 246 countries — click to listen.",
    longDescription:
      "The world's radio stations — all 26,000+ of them — geolocated and playable from a single globe.",
    highlights: [
      "26,000+ geolocated radio stations worldwide",
      "One-click live audio streaming",
      "Genre and language filtering",
      "Station density heatmap by country",
      "Coverage from 246 countries",
      "Favorites and recently played history",
    ],
    status: "live",
    featured: true,
    demoUrl: "/demo/uc11/index.html",
    detailsUrl: "/uc11/details",
  },
  {
    id: "UC12",
    slug: "uc12",
    title: "Country Energy Profile & Power Plants",
    category: "energy",
    image: "/img/tile-12.jpg",
    emoji: "⚡",
    tags: ["Energy", "Power Plants", "Solar", "Wind", "Coal", "Installed Capacity"],
    description: "Installed capacity by country and 35,000 geolocated power plants.",
    longDescription:
      "A comprehensive globe of global energy infrastructure. 35,000 power plants geolocated and color-coded by fuel type.",
    highlights: [
      "35,000+ power plants with location and capacity",
      "Color-coded by energy source type",
      "National installed capacity by country",
      "Renewable vs. fossil fuel energy share",
      "Grid connectivity and transmission lines",
      "Energy production vs. consumption comparison",
    ],
    status: "live",
    featured: true,
    demoUrl: "/demo/uc12/index.html",
    detailsUrl: "/uc12/details",
  },
  {
    id: "UC13",
    slug: "uc13",
    title: "Air Quality Index, Pollen & Stations",
    category: "environment",
    image: "/img/tile-13.jpg",
    emoji: "🌿",
    tags: ["AQI", "Air Quality", "Pollen", "PM2.5", "OpenAQ"],
    description: "Live AQI heatmap, Pollen Index, and 30,000+ monitoring stations.",
    longDescription:
      "A real-time public health layer for the globe. Live AQI heatmaps from OpenAQ's 30,000+ monitoring stations.",
    highlights: [
      "Live AQI data from 30,000+ OpenAQ stations",
      "PM2.5, PM10, NO2, and O3 layer toggles",
      "Pollen index overlay by season and region",
      "WHO threshold alert visualization",
      "City-level trend charts on click",
      "Historical comparison by date range",
    ],
    status: "live",
    featured: true,
    demoUrl: "/demo/uc13/index.html",
    detailsUrl: "/uc13/details",
  },
  {
    id: "UC14",
    slug: "uc14",
    title: "World Job Market",
    category: "analytics",
    image: "/img/tile-14.jpg",
    emoji: "🌍",
    tags: ["Jobs", "Labour Market", "MapGL", "City", "Sector", "Remote", "Salary"],
    description: "50+ cities, 10 job sectors — filter by category, click any city, explore hiring trends and salaries on a live MapLibre map.",
    longDescription: "The global job market visualised on an interactive MapLibre GL map. 50+ world cities with job volume by sector, monthly hiring trends, average salaries, remote work rates, and YoY growth — all filterable by industry category in real time.",
    highlights: [
      "50+ world cities across 6 global regions",
      "10 ILO-aligned job sectors: Tech, Healthcare, Finance, and more",
      "Filter map by sector — circles resize and recolour live",
      "Click any city for breakdown chart + monthly trend line",
      "Salary benchmarks, remote %, and YoY growth per city",
      "MapLibre GL (open-source) — no API key, 60fps WebGL rendering",
      "Top-city leaderboard updates with active category filter",
    ],
    status: "live",
    featured: true,
    demoUrl: "/uc14",
    detailsUrl: "/uc14/details",
  },
  {
    id: "UC15",
    slug: "uc15",
    title: "Starlinks Spacemap",
    category: "telecom",
    image: "/img/tile-15.jpg",
    emoji: "🛰️",
    tags: ["Starlink", "Satellites", "TLE", "SGP4", "Orbital", "Real-time", "WebGL", "SpaceX"],
    description:
      "Real-time tracking of 6,000+ Starlink satellites on a WebGL globe — live TLE orbital data, SGP4 propagation, orbital shell filters, and ground track visualization.",
    longDescription:
      "The complete Starlink mega-constellation tracked in real time. Live Two-Line Element (TLE) data from CelesTrak feeds satellite.js SGP4 propagation, computing geodetic positions for every active Starlink satellite every 5 seconds. Rendered on a globe.gl WebGL globe with NASA Earth-Night texture, orbital shell color coding, generation filters, and 90-minute animated ground tracks.",
    highlights: [
      "6,000+ Starlink satellites tracked in real time via CelesTrak TLE feed",
      "SGP4/SDP4 orbital propagation using satellite.js — positions updated every 5 s",
      "5 orbital shells color-coded: 53°, 53.2°, 70°, 97.6°, 43° inclination",
      "Click any satellite for altitude, velocity, inclination, and orbital period",
      "90-minute animated ground track with dashed orbital path",
      "Generation filter: Gen 1 (v1.0), Gen 1.5, Gen 2 Mini",
      "globe.gl WebGL rendering — NASA Earth Night texture, topology bump map",
    ],
    status: "live",
    featured: true,
    demoUrl: "/uc15",
    detailsUrl: "/uc15/details",
  },
  {
    id: "UC16",
    slug: "uc16",
    title: "Space Debris Tracker",
    category: "telecom",
    image: "/img/tile-16.jpg",
    emoji: "☄️",
    tags: ["Space Debris", "Kessler", "TLE", "SGP4", "Orbital", "Real-time", "WebGL", "NORAD", "CelesTrak"],
    description:
      "Real-time tracking of 5,000+ space debris objects on a WebGL globe — CelesTrak TLE data, SGP4 propagation, origin-event filters (Cosmos, FenYun, Iridium), and per-object orbital telemetry.",
    longDescription:
      "The complete tracked orbital debris population rendered in real time. Three CelesTrak debris groups (Cosmos 2251, FenYun-1C, Iridium 33) are fetched and deduplicated, then propagated via SGP4 every 5 seconds. Objects are colour-coded by origin event and altitude band on a globe.gl WebGL globe. Click any debris piece for altitude, velocity, inclination, orbital period, and a full-orbit track drawn directly in 3D space.",
    highlights: [
      "5,000+ debris objects from 3 major origin events tracked in real time",
      "CelesTrak multi-group TLE feed: Cosmos 2251 · FenYun-1C · Iridium 33",
      "SGP4/SDP4 propagation via satellite.js — positions updated every 5 s",
      "Colour-coded by origin event: Cosmos (red) · FenYun (orange) · Iridium (yellow)",
      "Altitude band filter: LEO / MEO / GEO / Deep orbit",
      "Click any debris for NORAD ID, altitude, velocity, period, and orbit track",
      "Kessler Syndrome context — density risk by altitude band",
    ],
    status: "live",
    featured: true,
    demoUrl: "/uc16",
    detailsUrl: "/uc16/details",
  },
  {
    id: "UC17",
    slug: "uc17",
    title: "Live Aircraft Traffic",
    category: "telecom",
    image: "/img/tile-17.jpg",
    emoji: "✈️",
    tags: ["Aircraft", "ADS-B", "OpenSky", "Real-time", "WebGL", "Aviation"],
    description:
      "10,000+ airborne aircraft tracked in real time on a WebGL globe — OpenSky Network ADS-B data, altitude-band colour coding, and per-aircraft telemetry.",
    longDescription:
      "Global flight surveillance powered by the OpenSky Network community ADS-B receiver network. Every tracked aircraft rendered as a WebGL particle colour-coded by altitude band. Click any point for callsign, ICAO24, speed, altitude, heading, and vertical rate. Data refreshes every 60 seconds via a server-side edge cache.",
    highlights: [
      "10,000+ live state vectors from OpenSky Network ADS-B / MLAT",
      "Altitude-band colour coding: ground · low · medium · cruise",
      "60-second auto-refresh with edge caching to respect rate limits",
      "Click any aircraft for callsign, ICAO24, altitude (ft), speed (kts), heading",
      "No API key required — open community network",
      "globe.gl + Three.js BufferGeometry single-draw-call rendering",
    ],
    status: "live",
    featured: true,
    demoUrl: "/uc17",
    detailsUrl: "/uc17/details",
  },
  {
    id: "UC18",
    slug: "uc18",
    title: "Active Wildfires",
    category: "human-civilization",
    image: "/img/tile-18.jpg",
    emoji: "🔥",
    tags: ["Wildfires", "NASA EONET", "Natural Hazards", "Real-time", "WebGL", "GeoJSON"],
    description:
      "Satellite-confirmed active wildfire events from NASA EONET rendered as glowing fire sprites on a WebGL globe — regional filters and source-agency links.",
    longDescription:
      "Real-time wildfire tracking using NASA's Earth Observatory Natural Event Tracker (EONET v3). Satellite-confirmed fires from InciWeb, USGS, NOAA, and ESA Copernicus are rendered as pulsing fire sprites on a globe.gl WebGL globe. Filter by geographic region and click any event for name, date, region, and a direct link to the source agency report.",
    highlights: [
      "NASA EONET v3 — satellite-confirmed active wildfire events globally",
      "Fire sprite WebGL rendering with pulsing opacity animation",
      "7 geographic regions with per-region colour coding",
      "Click for event name, region, date, and source agency link",
      "15-minute cache refresh aligned to NASA update cadence",
      "No API key required — NASA open data",
    ],
    status: "live",
    featured: true,
    demoUrl: "/uc18",
    detailsUrl: "/uc18/details",
  },
  {
    id: "UC19",
    slug: "uc19",
    title: "Submarine Internet Cables",
    category: "telecom",
    image: "/img/tile-19.jpg",
    emoji: "🌊",
    tags: ["Submarine Cables", "Internet Infrastructure", "TeleGeography", "GeoJSON", "WebGL"],
    description:
      "500+ submarine internet cables carrying 95% of global data traffic, visualised as geodesic paths on a WebGL globe — TeleGeography public GeoJSON, ocean-region filters, landing stations.",
    longDescription:
      "The hidden backbone of the internet mapped in 3D. TeleGeography's authoritative cable GeoJSON is fetched, segmented, and rendered as geodesic paths on a globe.gl WebGL globe using the cable operator's own colour palette. Toggle cable landing station dots, filter by ocean region, and click any cable or station for metadata and ownership details.",
    highlights: [
      "500+ active submarine cables from TeleGeography's public GeoJSON",
      "Geodesic path rendering via globe.gl pathsData — no Three.js needed",
      "Ocean region filter: Pacific · Atlantic · Indian · Arctic · Other",
      "Toggle cable landing stations as dot overlay",
      "Click cable for name, RFS year, length, owners, landing countries",
      "24-hour edge cache — cable data rarely changes",
    ],
    status: "live",
    featured: true,
    demoUrl: "/uc19",
    detailsUrl: "/uc19/details",
  },
  {
    id: "UC20",
    slug: "uc20",
    title: "Space Weather & Aurora",
    category: "human-civilization",
    image: "/img/tile-20.jpg",
    emoji: "🌌",
    tags: ["Aurora", "Space Weather", "NOAA SWPC", "Kp Index", "Solar Wind", "WebGL", "Real-time"],
    description:
      "Live aurora borealis and australis ovals at accurate 120 km altitude on a WebGL globe — NOAA SWPC Ovation Prime forecast, Kp index, solar wind, and IMF Bz component.",
    longDescription:
      "Real-time space weather and aurora visualisation powered by NOAA's Space Weather Prediction Center. The Ovation Prime aurora probability grid is rendered as colour-coded particles at 120 km altitude on a globe.gl WebGL globe. A live stats panel shows the planetary Kp geomagnetic index, solar wind speed and density, and the critical IMF Bz component — all updated every 5 minutes from DSCOVR satellite data.",
    highlights: [
      "NOAA SWPC Ovation Prime aurora probability grid — updated every 5 min",
      "Aurora particles rendered at accurate 120 km altitude in 3D space",
      "6-level probability colour gradient from faint green to cyan-white",
      "Live Kp index gauge with storm-level classification (G1–G5)",
      "Real-time solar wind: speed, density, and IMF Bz from DSCOVR satellite",
      "Hemisphere filter (north / south) and minimum probability threshold slider",
      "Starts with polar view to highlight auroral oval geometry",
    ],
    status: "live",
    featured: true,
    demoUrl: "/uc20",
    detailsUrl: "/uc20/details",
  },
]

export const leaders: Leader[] = [
  {
    name: "Bill Robbins",
    role: "CVO",
    image: "/img/leader-bill.jpg",
    bio: "Driving vision, strategic direction, partnerships, and long-range positioning for GRIP 3D.",
    tags: ["Vision", "Strategy", "Growth"],
  },
  {
    name: "Boris Penchev",
    role: "CTO",
    image: "/img/leader-boris.png",
    bio: "Leading system architecture, engineering direction, technical standards, APIs, backend, and platform delivery.",
    tags: ["Architecture", "Engineering", "Solution"],
  },
  {
    name: "Marko Andlar",
    role: "C3DO",
    image: "/img/leader-marko.jpg",
    bio: "Building the 3D data layer strategy, intelligence workflows, and spatial experience behind the platform.",
    tags: ["3D Data", "Spatial", "Intelligence"],
  },
  {
    name: "Deepti Ramaul",
    role: "Program Director",
    image: "/img/leader-deepti.jpg",
    bio: "Driving program execution, team coordination and operational alignment across product portfolio.",
    tags: ["Program Lead", "Account", "Team Build"],
  },
  {
    name: "Vishal Nirmal",
    role: "CDO",
    image: "/img/leader-vishal.jpg",
    bio: "Leading design vision, User Journey UI/UX, enterprise visualization and expansion.",
    tags: ["UI/UX", "Layers", "APIs"],
  },
  {
    name: "Want to be next?",
    role: "Future Team Member",
    image: "/img/leader-next.png",
    bio: "Help build the future of global 3D intelligence platforms. If you enjoy solving complex problems and building real systems, we would love to hear from you.",
    tags: ["Builders", "Engineers", "Creators"],
    isSpecial: true,
  },
]

export function getCategoryLabel(cat: string): string {
  const overrides: Record<string, string> = {
    "telecom": "Telecom / NTN",
    "human-civilization": "Human Civilization",
    "ai-compute": "AI / Compute",
  }
  return overrides[cat] ?? cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g, " ")
}

export function getUniqueCategories(): string[] {
  return Array.from(new Set(useCases.map((uc) => uc.category)))
}

export function getFeaturedUseCases(): UseCase[] {
  return useCases.filter((uc) => uc.featured && uc.status === "live")
}

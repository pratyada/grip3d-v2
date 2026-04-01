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
    detailsUrl: "/demo/uc1/details/index.html",
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
    detailsUrl: "/demo/uc2/details/index.html",
  },
  {
    id: "UC03",
    slug: "uc3",
    title: "Airplane Live",
    category: "aviation",
    image: "/img/tile-03.jpg",
    emoji: "✈️",
    tags: ["Aviation", "Airspace", "Traffic", "Corridors", "Ops"],
    description: "Air traffic, corridors, airspace layers, and operational constraints.",
    status: "coming-soon",
    featured: false,
    demoUrl: undefined,
    detailsUrl: undefined,
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
    detailsUrl: "/demo/uc4/details/index.html",
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
    detailsUrl: "/demo/uc5/details/index.html",
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
    detailsUrl: "/demo/uc7/details/index.html",
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
    detailsUrl: "/demo/uc8/details/index.html",
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
    detailsUrl: "/demo/uc11/details/index.html",
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
    detailsUrl: "/demo/uc12/details/index.html",
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
    detailsUrl: "/demo/uc13/details/index.html",
  },
  {
    id: "UC14",
    slug: "uc14",
    title: "Global AI Inference Grid",
    category: "ai-compute",
    image: "/img/tile-14.jpg",
    emoji: "🧠",
    tags: ["AI", "GPU Clusters", "Inference", "Data Centers", "Carbon", "Latency"],
    description: "25 GPU clusters, 8 hyperscalers, live utilization, carbon intensity, and inference latency on a single globe.",
    longDescription: "Visualize the world's AI compute infrastructure in real-time. GPU cluster utilization, inference request routing, power draw, PUE, and carbon intensity across 25 hyperscaler data centers — built for ML platform teams and enterprise AI buyers.",
    highlights: [
      "25 global GPU clusters across AWS, Azure, GCP, CoreWeave, Lambda, Together, Groq, Cerebras",
      "Real-time GPU utilization % and cluster health scoring",
      "Inference latency by region — P50/P90/P99 in milliseconds",
      "Power draw (MW) and PUE per data center",
      "Carbon intensity (gCO2/kWh) with green compute scoring",
      "Request routing simulation: nearest-lowest-carbon cluster selection",
      "Model availability map: which clusters run which frontier models",
    ],
    status: "live",
    featured: true,
    demoUrl: "/uc14",
    detailsUrl: "/uc14/details",
  },
]

export const leaders: Leader[] = [
  {
    name: "Bill Robbins",
    role: "CVO",
    image: "/img/leader-bill.png",
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

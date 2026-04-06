"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Types
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

type Category =
  | "Natural Hazards"
  | "Space"
  | "Infrastructure"
  | "Geography"
  | "Architecture"
  | "Environment"
  | "Geopolitics"
  | "Technology"

type Difficulty = "easy" | "medium" | "hard"

interface GlobeLayerConfig {
  type: "points" | "arcs" | "hexbin"
  data: Record<string, number | string>[]
  pointColor?: string
  pointRadius?: number
  pointAltitude?: number
  arcColor?: string
}

interface QuizCard {
  id: string
  category: Category
  question: string
  options: string[]
  correctIndex: number
  explanation: string
  target: { lat: number; lng: number; altitude: number }
  globeLayer: GlobeLayerConfig
  difficulty: Difficulty
  icon: string
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Category colours
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const CATEGORY_COLORS: Record<Category, string> = {
  "Natural Hazards": "#ff6b35",
  Space: "#7c3aed",
  Infrastructure: "#06b6d4",
  Geography: "#10b981",
  Architecture: "#f59e0b",
  Environment: "#22c55e",
  Geopolitics: "#ef4444",
  Technology: "#3b82f6",
}

const DIFFICULTY_LABELS: Record<Difficulty, { label: string; color: string }> = {
  easy: { label: "Easy", color: "#22c55e" },
  medium: { label: "Medium", color: "#f59e0b" },
  hard: { label: "Hard", color: "#ef4444" },
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Fisher-Yates shuffle
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Question Bank (100+ cards)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const QUESTIONS: QuizCard[] = [
  // ──────────────────── NATURAL HAZARDS (15) ────────────────────
  {
    id: "nh-01",
    category: "Natural Hazards",
    question: "Which US state experiences the most wildfires each year?",
    options: ["Florida", "California", "Texas", "Colorado"],
    correctIndex: 1,
    explanation:
      "California leads the US in wildfire activity due to its dry Santa Ana winds, drought conditions, and vast wildland-urban interfaces. In 2020 alone, over 4 million acres burned across the state.",
    target: { lat: 36.78, lng: -119.42, altitude: 1.8 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 34.05, lng: -118.24, label: "Los Angeles" },
        { lat: 38.58, lng: -121.49, label: "Sacramento" },
        { lat: 37.77, lng: -122.42, label: "San Francisco" },
        { lat: 40.58, lng: -122.39, label: "Redding" },
        { lat: 39.53, lng: -121.56, label: "Paradise" },
        { lat: 34.42, lng: -119.7, label: "Santa Barbara" },
      ],
      pointColor: "#ff4500",
      pointRadius: 0.6,
      pointAltitude: 0.05,
    },
    difficulty: "easy",
    icon: "🔥",
  },
  {
    id: "nh-02",
    category: "Natural Hazards",
    question: "Which ocean basin generates the most tropical cyclones?",
    options: ["Atlantic Ocean", "Indian Ocean", "Western Pacific Ocean", "Eastern Pacific Ocean"],
    correctIndex: 2,
    explanation:
      "The Western Pacific is the most active basin for tropical cyclones (called typhoons there), producing about 26 storms per year on average. Warm ocean waters and favorable atmospheric conditions fuel these powerful storms.",
    target: { lat: 15.0, lng: 135.0, altitude: 2.5 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 14.6, lng: 121.0, label: "Manila" },
        { lat: 22.3, lng: 114.2, label: "Hong Kong" },
        { lat: 35.7, lng: 139.7, label: "Tokyo" },
        { lat: 25.0, lng: 121.5, label: "Taipei" },
        { lat: 10.3, lng: 124.0, label: "Tacloban" },
        { lat: 13.1, lng: 145.8, label: "Guam" },
      ],
      pointColor: "#00bfff",
      pointRadius: 0.5,
      pointAltitude: 0.04,
    },
    difficulty: "medium",
    icon: "🌀",
  },
  {
    id: "nh-03",
    category: "Natural Hazards",
    question: "Where did the devastating 2023 earthquake in Morocco occur?",
    options: ["Casablanca coast", "Sahara Desert", "Atlas Mountains", "Tangier region"],
    correctIndex: 2,
    explanation:
      "The September 2023 earthquake struck the High Atlas Mountains near Marrakech with a magnitude of 6.8. It was the deadliest earthquake in Morocco in over 60 years, causing nearly 3,000 fatalities.",
    target: { lat: 31.1, lng: -8.0, altitude: 1.5 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 31.1, lng: -8.0, label: "Epicenter" },
        { lat: 31.63, lng: -8.0, label: "Marrakech" },
        { lat: 33.57, lng: -7.59, label: "Casablanca" },
        { lat: 34.02, lng: -6.83, label: "Rabat" },
      ],
      pointColor: "#ff2200",
      pointRadius: 0.8,
      pointAltitude: 0.06,
    },
    difficulty: "medium",
    icon: "🌍",
  },
  {
    id: "nh-04",
    category: "Natural Hazards",
    question: "Which country has the most active volcanoes in the world?",
    options: ["Japan", "Indonesia", "Iceland", "Philippines"],
    correctIndex: 1,
    explanation:
      "Indonesia sits on the Pacific Ring of Fire and has about 130 active volcanoes — more than any other country. Famous ones include Krakatoa, Mount Merapi, and Mount Tambora (whose 1815 eruption caused the 'Year Without a Summer').",
    target: { lat: -2.5, lng: 118.0, altitude: 2.2 },
    globeLayer: {
      type: "points",
      data: [
        { lat: -6.1, lng: 105.42, label: "Krakatoa" },
        { lat: -7.54, lng: 110.45, label: "Merapi" },
        { lat: -8.25, lng: 118.0, label: "Tambora" },
        { lat: 1.38, lng: 124.79, label: "Lokon" },
        { lat: -8.34, lng: 115.51, label: "Agung" },
        { lat: -7.93, lng: 112.95, label: "Semeru" },
      ],
      pointColor: "#ff6600",
      pointRadius: 0.7,
      pointAltitude: 0.08,
    },
    difficulty: "easy",
    icon: "🌋",
  },
  {
    id: "nh-05",
    category: "Natural Hazards",
    question: "What is the Ring of Fire?",
    options: [
      "A volcanic belt around the Indian Ocean",
      "A Pacific Ocean volcanic and earthquake belt",
      "A chain of volcanoes in Africa",
      "A fire-prone region in Australia",
    ],
    correctIndex: 1,
    explanation:
      "The Ring of Fire is a horseshoe-shaped zone around the Pacific Ocean where about 75% of the world's volcanoes are found and 90% of earthquakes occur. It stretches from New Zealand through Asia, across Alaska, and down the Americas.",
    target: { lat: 10.0, lng: -170.0, altitude: 3.0 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 35.7, lng: 139.7, label: "Japan" },
        { lat: -6.2, lng: 106.8, label: "Indonesia" },
        { lat: -41.3, lng: 174.8, label: "New Zealand" },
        { lat: 14.6, lng: 121.0, label: "Philippines" },
        { lat: 61.2, lng: -149.9, label: "Alaska" },
        { lat: -33.4, lng: -70.7, label: "Chile" },
        { lat: 19.4, lng: -99.1, label: "Mexico" },
        { lat: -12.0, lng: -77.0, label: "Peru" },
      ],
      pointColor: "#ff3300",
      pointRadius: 0.5,
      pointAltitude: 0.05,
    },
    difficulty: "easy",
    icon: "🔥",
  },
  {
    id: "nh-06",
    category: "Natural Hazards",
    question: "Where was the 2011 Fukushima nuclear disaster?",
    options: ["South Korea", "Japan", "China", "Taiwan"],
    correctIndex: 1,
    explanation:
      "The Fukushima Daiichi nuclear disaster was triggered by a massive 9.1-magnitude earthquake and tsunami off Japan's coast on March 11, 2011. It was the worst nuclear accident since Chernobyl in 1986.",
    target: { lat: 37.42, lng: 141.03, altitude: 1.2 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 37.42, lng: 141.03, label: "Fukushima" },
        { lat: 35.68, lng: 139.69, label: "Tokyo" },
        { lat: 38.27, lng: 140.87, label: "Sendai" },
      ],
      pointColor: "#ffff00",
      pointRadius: 0.8,
      pointAltitude: 0.06,
    },
    difficulty: "easy",
    icon: "☢️",
  },
  {
    id: "nh-07",
    category: "Natural Hazards",
    question: "Where do most Atlantic hurricanes originally form?",
    options: [
      "Gulf of Mexico",
      "Cape Verde region, West Africa",
      "Caribbean Sea",
      "Bermuda Triangle",
    ],
    correctIndex: 1,
    explanation:
      "Most major Atlantic hurricanes begin as tropical waves that roll off the coast of West Africa near the Cape Verde Islands. Warm ocean water and the Coriolis effect help them spin up into powerful storms as they cross the Atlantic.",
    target: { lat: 15.0, lng: -24.0, altitude: 2.0 },
    globeLayer: {
      type: "arcs",
      data: [
        { startLat: 15, startLng: -24, endLat: 25, endLng: -75 },
        { startLat: 14, startLng: -22, endLat: 18, endLng: -66 },
        { startLat: 13, startLng: -20, endLat: 30, endLng: -89 },
      ],
      arcColor: "#00bfff",
    },
    difficulty: "medium",
    icon: "🌀",
  },
  {
    id: "nh-08",
    category: "Natural Hazards",
    question: "Which continent experiences the most earthquakes?",
    options: ["North America", "Europe", "Asia", "South America"],
    correctIndex: 2,
    explanation:
      "Asia is the most earthquake-prone continent because it sits along several major tectonic plate boundaries, including the Pacific Ring of Fire and the Alpide Belt. Countries like Japan, Indonesia, and Nepal are particularly vulnerable.",
    target: { lat: 35.0, lng: 105.0, altitude: 3.0 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 35.7, lng: 139.7, label: "Tokyo" },
        { lat: 28.2, lng: 84.0, label: "Nepal" },
        { lat: -6.2, lng: 106.8, label: "Jakarta" },
        { lat: 39.9, lng: 116.4, label: "Beijing" },
        { lat: 37.5, lng: 127.0, label: "Seoul" },
        { lat: 14.6, lng: 121.0, label: "Manila" },
      ],
      pointColor: "#ff4444",
      pointRadius: 0.5,
      pointAltitude: 0.04,
    },
    difficulty: "medium",
    icon: "🌏",
  },
  {
    id: "nh-09",
    category: "Natural Hazards",
    question: "What is the world's most earthquake-prone major city?",
    options: ["Los Angeles, USA", "Tokyo, Japan", "Istanbul, Turkey", "Lima, Peru"],
    correctIndex: 1,
    explanation:
      "Tokyo sits at the junction of three tectonic plates (Pacific, Philippine, and Eurasian), making it the most seismically active major city. Japan has invested heavily in earthquake-resistant engineering and early warning systems.",
    target: { lat: 35.68, lng: 139.69, altitude: 1.2 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 35.68, lng: 139.69, label: "Tokyo" },
        { lat: 34.05, lng: -118.24, label: "Los Angeles" },
        { lat: 41.01, lng: 28.98, label: "Istanbul" },
        { lat: -12.05, lng: -77.04, label: "Lima" },
      ],
      pointColor: "#ff6666",
      pointRadius: 0.6,
      pointAltitude: 0.05,
    },
    difficulty: "medium",
    icon: "🏙️",
  },
  {
    id: "nh-10",
    category: "Natural Hazards",
    question: "What was the strongest earthquake ever recorded?",
    options: [
      "1906 San Francisco (7.9)",
      "2011 Japan Tohoku (9.1)",
      "1960 Chile Valdivia (9.5)",
      "2004 Indian Ocean (9.1)",
    ],
    correctIndex: 2,
    explanation:
      "The 1960 Valdivia earthquake in Chile is the strongest ever recorded at magnitude 9.5. It triggered tsunamis that crossed the Pacific Ocean and reached Hawaii and Japan. About 1,655 people were killed.",
    target: { lat: -39.82, lng: -73.24, altitude: 1.5 },
    globeLayer: {
      type: "points",
      data: [
        { lat: -39.82, lng: -73.24, label: "Valdivia" },
        { lat: -33.45, lng: -70.67, label: "Santiago" },
      ],
      pointColor: "#ff0000",
      pointRadius: 1.0,
      pointAltitude: 0.1,
    },
    difficulty: "hard",
    icon: "💥",
  },
  {
    id: "nh-11",
    category: "Natural Hazards",
    question: "Which natural disaster kills the most people worldwide each year?",
    options: ["Earthquakes", "Floods", "Hurricanes", "Wildfires"],
    correctIndex: 1,
    explanation:
      "Floods are the deadliest natural disaster type globally, affecting more people than any other hazard. River flooding, flash floods, and coastal flooding impact hundreds of millions of people every year, especially in South and Southeast Asia.",
    target: { lat: 23.0, lng: 90.0, altitude: 2.5 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 23.81, lng: 90.41, label: "Bangladesh" },
        { lat: 28.61, lng: 77.21, label: "Delhi" },
        { lat: 31.55, lng: 74.35, label: "Lahore" },
        { lat: 16.87, lng: 96.2, label: "Myanmar" },
      ],
      pointColor: "#4488ff",
      pointRadius: 0.6,
      pointAltitude: 0.05,
    },
    difficulty: "medium",
    icon: "🌊",
  },
  {
    id: "nh-12",
    category: "Natural Hazards",
    question: "Where is Tornado Alley in the United States?",
    options: [
      "East Coast (New York to Florida)",
      "Central US (Texas to South Dakota)",
      "West Coast (California to Washington)",
      "Great Lakes region",
    ],
    correctIndex: 1,
    explanation:
      "Tornado Alley stretches across the central United States from Texas through Oklahoma, Kansas, Nebraska, and South Dakota. Cold air from the Rockies meets warm, moist air from the Gulf of Mexico, creating perfect tornado conditions.",
    target: { lat: 35.5, lng: -98.0, altitude: 1.8 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 35.47, lng: -97.52, label: "Oklahoma City" },
        { lat: 38.97, lng: -95.24, label: "Kansas" },
        { lat: 40.81, lng: -96.7, label: "Nebraska" },
        { lat: 32.78, lng: -96.8, label: "Dallas" },
        { lat: 43.55, lng: -96.73, label: "South Dakota" },
      ],
      pointColor: "#888888",
      pointRadius: 0.5,
      pointAltitude: 0.04,
    },
    difficulty: "easy",
    icon: "🌪️",
  },
  {
    id: "nh-13",
    category: "Natural Hazards",
    question: "What is a lahar?",
    options: [
      "A type of tornado",
      "A volcanic mudflow",
      "An underwater earthquake",
      "A lightning storm",
    ],
    correctIndex: 1,
    explanation:
      "A lahar is a destructive mudflow of volcanic debris mixed with water. They can travel at speeds over 60 mph and bury entire villages. Mount Pinatubo in the Philippines and Mount Rainier in Washington are known lahar hazard zones.",
    target: { lat: 15.14, lng: 120.35, altitude: 1.3 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 15.14, lng: 120.35, label: "Pinatubo" },
        { lat: 46.85, lng: -121.76, label: "Mt Rainier" },
      ],
      pointColor: "#996633",
      pointRadius: 0.7,
      pointAltitude: 0.06,
    },
    difficulty: "hard",
    icon: "🌋",
  },
  {
    id: "nh-14",
    category: "Natural Hazards",
    question: "Which volcanic eruption in 79 AD buried the Roman city of Pompeii?",
    options: ["Mount Etna", "Mount Vesuvius", "Stromboli", "Mount Olympus"],
    correctIndex: 1,
    explanation:
      "Mount Vesuvius erupted in 79 AD, burying the cities of Pompeii and Herculaneum under meters of volcanic ash. Today, it remains one of the most dangerous volcanoes in the world because over 3 million people live nearby in Naples.",
    target: { lat: 40.82, lng: 14.43, altitude: 1.0 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 40.82, lng: 14.43, label: "Vesuvius" },
        { lat: 40.85, lng: 14.27, label: "Naples" },
        { lat: 40.75, lng: 14.49, label: "Pompeii" },
      ],
      pointColor: "#ff4400",
      pointRadius: 0.6,
      pointAltitude: 0.05,
    },
    difficulty: "easy",
    icon: "🏛️",
  },
  {
    id: "nh-15",
    category: "Natural Hazards",
    question: "What causes a tsunami?",
    options: [
      "Strong ocean winds",
      "Underwater earthquakes or volcanic eruptions",
      "The Moon's gravity",
      "Climate change",
    ],
    correctIndex: 1,
    explanation:
      "Tsunamis are caused by underwater earthquakes, volcanic eruptions, or landslides that displace massive amounts of water. The 2004 Indian Ocean tsunami was triggered by a 9.1-magnitude quake and killed over 230,000 people across 14 countries.",
    target: { lat: 3.3, lng: 95.85, altitude: 2.5 },
    globeLayer: {
      type: "arcs",
      data: [
        { startLat: 3.3, startLng: 95.85, endLat: 6.9, endLng: 79.9 },
        { startLat: 3.3, startLng: 95.85, endLat: -6.2, endLng: 106.8 },
        { startLat: 3.3, startLng: 95.85, endLat: 8.0, endLng: 80.0 },
        { startLat: 3.3, startLng: 95.85, endLat: -1.3, endLng: 36.8 },
      ],
      arcColor: "#00aaff",
    },
    difficulty: "easy",
    icon: "🌊",
  },

  // ──────────────────── SPACE & SATELLITES (13) ────────────────────
  {
    id: "sp-01",
    category: "Space",
    question: "Approximately how many Starlink satellites orbit Earth?",
    options: ["500", "2,000", "6,000+", "50,000"],
    correctIndex: 2,
    explanation:
      "SpaceX's Starlink constellation has over 6,000 active satellites in low Earth orbit (about 550 km altitude). They provide broadband internet to users in remote areas worldwide. SpaceX plans to eventually launch up to 42,000 satellites!",
    target: { lat: 28.57, lng: -80.65, altitude: 2.5 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 28.57, lng: -80.65, label: "Cape Canaveral" },
        { lat: 34.63, lng: -120.61, label: "Vandenberg" },
        { lat: 5.16, lng: -52.65, label: "Kourou" },
      ],
      pointColor: "#bb88ff",
      pointRadius: 0.5,
      pointAltitude: 0.04,
    },
    difficulty: "medium",
    icon: "🛰️",
  },
  {
    id: "sp-02",
    category: "Space",
    question: "Which country launched the first artificial satellite (Sputnik)?",
    options: ["United States", "Soviet Union / Russia", "Germany", "China"],
    correctIndex: 1,
    explanation:
      "The Soviet Union launched Sputnik 1 on October 4, 1957, from the Baikonur Cosmodrome in Kazakhstan. It was a 58 cm metal sphere that orbited Earth for three months, beeping a radio signal that shocked the world and kicked off the Space Race.",
    target: { lat: 45.96, lng: 63.31, altitude: 1.5 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 45.96, lng: 63.31, label: "Baikonur" },
        { lat: 55.75, lng: 37.62, label: "Moscow" },
      ],
      pointColor: "#ff4444",
      pointRadius: 0.7,
      pointAltitude: 0.06,
    },
    difficulty: "easy",
    icon: "🚀",
  },
  {
    id: "sp-03",
    category: "Space",
    question: "Where is NASA's Kennedy Space Center?",
    options: ["Houston, Texas", "Cape Canaveral, Florida", "Washington, DC", "Huntsville, Alabama"],
    correctIndex: 1,
    explanation:
      "Kennedy Space Center is on Merritt Island near Cape Canaveral, Florida. It's where the Apollo Moon missions launched, the Space Shuttle flew from, and where SpaceX now launches many Falcon 9 rockets. Fun fact: Houston is Mission Control, not the launch site!",
    target: { lat: 28.57, lng: -80.65, altitude: 1.0 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 28.57, lng: -80.65, label: "KSC" },
        { lat: 29.76, lng: -95.37, label: "Houston" },
        { lat: 34.63, lng: -120.61, label: "Vandenberg" },
        { lat: 34.73, lng: -118.38, label: "JPL" },
      ],
      pointColor: "#3388ff",
      pointRadius: 0.6,
      pointAltitude: 0.05,
    },
    difficulty: "easy",
    icon: "🚀",
  },
  {
    id: "sp-04",
    category: "Space",
    question: "What altitude do most Starlink satellites orbit at?",
    options: ["200 km", "550 km", "2,000 km", "35,786 km"],
    correctIndex: 1,
    explanation:
      "Starlink satellites orbit at about 550 km altitude in Low Earth Orbit (LEO). This is much closer than traditional geostationary satellites at 35,786 km, which is why Starlink has lower latency for internet connections.",
    target: { lat: 0.0, lng: 0.0, altitude: 3.0 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 0, lng: 0, label: "LEO 550km" },
        { lat: 0, lng: 120, label: "LEO 550km" },
        { lat: 0, lng: -120, label: "LEO 550km" },
      ],
      pointColor: "#bb88ff",
      pointRadius: 0.4,
      pointAltitude: 0.15,
    },
    difficulty: "medium",
    icon: "🛰️",
  },
  {
    id: "sp-05",
    category: "Space",
    question: "Where is the world's largest radio telescope (FAST)?",
    options: ["New Mexico, USA", "Guizhou, China", "Atacama, Chile", "Jodrell Bank, England"],
    correctIndex: 1,
    explanation:
      "The Five-hundred-meter Aperture Spherical Telescope (FAST) is in Guizhou province, China. With a dish 500 meters wide, it's the world's largest single-dish radio telescope. It searches for pulsars, interstellar molecules, and even extraterrestrial signals!",
    target: { lat: 25.65, lng: 106.86, altitude: 1.2 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 25.65, lng: 106.86, label: "FAST" },
        { lat: 34.08, lng: -107.62, label: "VLA" },
        { lat: 53.24, lng: -2.31, label: "Jodrell Bank" },
        { lat: -23.02, lng: -67.76, label: "ALMA" },
      ],
      pointColor: "#44aaff",
      pointRadius: 0.6,
      pointAltitude: 0.05,
    },
    difficulty: "hard",
    icon: "📡",
  },
  {
    id: "sp-06",
    category: "Space",
    question: "Which orbit do GPS satellites use?",
    options: [
      "Low Earth Orbit (400 km)",
      "Medium Earth Orbit (20,200 km)",
      "Geostationary Orbit (35,786 km)",
      "Polar Orbit (800 km)",
    ],
    correctIndex: 1,
    explanation:
      "GPS satellites orbit in Medium Earth Orbit at about 20,200 km altitude. There are 31 active GPS satellites forming a constellation that ensures at least 4 satellites are visible from any point on Earth at any time.",
    target: { lat: 38.8, lng: -77.0, altitude: 3.0 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 38.8, lng: -77.0, label: "GPS Control (DC)" },
        { lat: 38.75, lng: -104.84, label: "Schriever AFB" },
      ],
      pointColor: "#22cc88",
      pointRadius: 0.6,
      pointAltitude: 0.05,
    },
    difficulty: "hard",
    icon: "🛰️",
  },
  {
    id: "sp-07",
    category: "Space",
    question: "What is the Kessler Syndrome?",
    options: [
      "A disease astronauts get in space",
      "Cascading space debris collisions",
      "A type of black hole",
      "Loss of gravity on the Moon",
    ],
    correctIndex: 1,
    explanation:
      "The Kessler Syndrome (proposed by NASA scientist Don Kessler in 1978) describes a scenario where space debris collisions create more debris, triggering a chain reaction. This could make certain orbits unusable for satellites. There are already over 30,000 tracked debris objects in orbit!",
    target: { lat: 0.0, lng: 0.0, altitude: 3.5 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 72.5, lng: 97.5, label: "Cosmos-Iridium collision" },
        { lat: 0, lng: 60, label: "Debris field" },
        { lat: 0, lng: 180, label: "Debris field" },
        { lat: 45, lng: -90, label: "Debris field" },
      ],
      pointColor: "#aaaaaa",
      pointRadius: 0.3,
      pointAltitude: 0.12,
    },
    difficulty: "hard",
    icon: "💫",
  },
  {
    id: "sp-08",
    category: "Space",
    question: "Where is ESA's main rocket launch site?",
    options: ["Darmstadt, Germany", "Kourou, French Guiana", "Kiruna, Sweden", "Canary Islands, Spain"],
    correctIndex: 1,
    explanation:
      "The European Space Agency (ESA) launches most of its rockets from the Guiana Space Centre in Kourou, French Guiana, South America. Its location near the equator gives rockets a speed boost from Earth's rotation.",
    target: { lat: 5.16, lng: -52.65, altitude: 1.5 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 5.16, lng: -52.65, label: "Kourou" },
        { lat: 49.87, lng: 8.65, label: "ESA HQ Darmstadt" },
      ],
      pointColor: "#3366cc",
      pointRadius: 0.7,
      pointAltitude: 0.06,
    },
    difficulty: "medium",
    icon: "🚀",
  },
  {
    id: "sp-09",
    category: "Space",
    question: "Who was the first human to orbit Earth?",
    options: ["Neil Armstrong", "Yuri Gagarin", "John Glenn", "Buzz Aldrin"],
    correctIndex: 1,
    explanation:
      "Soviet cosmonaut Yuri Gagarin became the first human in space on April 12, 1961, aboard Vostok 1. His flight lasted 108 minutes and completed one orbit of Earth. He famously said, 'The Earth is blue... how wonderful.'",
    target: { lat: 55.75, lng: 37.62, altitude: 1.5 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 55.75, lng: 37.62, label: "Moscow" },
        { lat: 45.96, lng: 63.31, label: "Baikonur" },
        { lat: 51.27, lng: 45.57, label: "Landing site" },
      ],
      pointColor: "#ff4444",
      pointRadius: 0.6,
      pointAltitude: 0.05,
    },
    difficulty: "easy",
    icon: "👨‍🚀",
  },
  {
    id: "sp-10",
    category: "Space",
    question: "Where is the Hubble Space Telescope?",
    options: [
      "On the Moon",
      "At the L2 Lagrange point",
      "In Low Earth Orbit (540 km)",
      "In geostationary orbit",
    ],
    correctIndex: 2,
    explanation:
      "The Hubble Space Telescope orbits Earth at about 540 km altitude. Launched in 1990, it has taken some of the most iconic images of deep space. Note: the newer James Webb Space Telescope is at the L2 Lagrange point, 1.5 million km away!",
    target: { lat: 28.57, lng: -80.65, altitude: 2.0 },
    globeLayer: {
      type: "points",
      data: [{ lat: 28.57, lng: -80.65, label: "Launch site" }],
      pointColor: "#ffcc00",
      pointRadius: 0.6,
      pointAltitude: 0.15,
    },
    difficulty: "medium",
    icon: "🔭",
  },
  {
    id: "sp-11",
    category: "Space",
    question: "What country has the Baikonur Cosmodrome?",
    options: ["Russia", "Kazakhstan", "Uzbekistan", "Ukraine"],
    correctIndex: 1,
    explanation:
      "The Baikonur Cosmodrome is in Kazakhstan, though Russia leases and operates it. It's the world's oldest and largest operational space launch facility. Sputnik, Vostok 1 (Gagarin's flight), and Soyuz missions to the ISS all launch from Baikonur.",
    target: { lat: 45.96, lng: 63.31, altitude: 1.3 },
    globeLayer: {
      type: "points",
      data: [{ lat: 45.96, lng: 63.31, label: "Baikonur" }],
      pointColor: "#ffaa00",
      pointRadius: 0.8,
      pointAltitude: 0.06,
    },
    difficulty: "hard",
    icon: "🚀",
  },
  {
    id: "sp-12",
    category: "Space",
    question: "How long does the International Space Station take to orbit Earth?",
    options: ["24 hours", "90 minutes", "8 hours", "1 week"],
    correctIndex: 1,
    explanation:
      "The ISS orbits Earth every 90 minutes at about 408 km altitude and 28,000 km/h. This means astronauts see 16 sunrises and sunsets every day! The ISS has been continuously inhabited since November 2000.",
    target: { lat: 28.57, lng: -80.65, altitude: 2.5 },
    globeLayer: {
      type: "arcs",
      data: [
        { startLat: 51.6, startLng: 0, endLat: -51.6, endLng: 90 },
        { startLat: -51.6, startLng: 90, endLat: 51.6, endLng: 180 },
      ],
      arcColor: "#ffcc00",
    },
    difficulty: "medium",
    icon: "🚀",
  },
  {
    id: "sp-13",
    category: "Space",
    question: "Where is India's main space launch center?",
    options: ["Mumbai", "Sriharikota, Andhra Pradesh", "Bangalore", "New Delhi"],
    correctIndex: 1,
    explanation:
      "The Satish Dhawan Space Centre in Sriharikota, Andhra Pradesh, is ISRO's primary launch site. India's space program has achieved remarkable feats including the Chandrayaan-3 Moon landing in 2023, making India the 4th country to land on the Moon.",
    target: { lat: 13.72, lng: 80.23, altitude: 1.3 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 13.72, lng: 80.23, label: "Sriharikota" },
        { lat: 12.97, lng: 77.59, label: "ISRO HQ Bangalore" },
      ],
      pointColor: "#ff8800",
      pointRadius: 0.7,
      pointAltitude: 0.06,
    },
    difficulty: "medium",
    icon: "🇮🇳",
  },

  // ──────────────────── ARCHITECTURE & SKYSCRAPERS (12) ────────────────────
  {
    id: "ar-01",
    category: "Architecture",
    question: "What is the world's tallest building?",
    options: ["Empire State Building", "Burj Khalifa, Dubai", "Shanghai Tower", "Taipei 101"],
    correctIndex: 1,
    explanation:
      "The Burj Khalifa in Dubai stands at 828 meters (2,717 feet) with 163 floors. Completed in 2010, it's the tallest man-made structure ever built. The building uses over 26,000 hand-cut glass panels and you can see it from 95 km away!",
    target: { lat: 25.2, lng: 55.27, altitude: 1.0 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 25.2, lng: 55.27, label: "Burj Khalifa 828m" },
        { lat: 31.23, lng: 121.47, label: "Shanghai Tower 632m" },
        { lat: 40.71, lng: -74.01, label: "One WTC 541m" },
        { lat: 25.1, lng: 55.15, label: "Dubai Frame 150m" },
        { lat: 29.27, lng: 47.97, label: "Al Hamra Tower 413m" },
      ],
      pointColor: "#f5a623",
      pointRadius: 0.6,
      pointAltitude: 0.08,
    },
    difficulty: "easy",
    icon: "🏗️",
  },
  {
    id: "ar-02",
    category: "Architecture",
    question: "Which building will be the first to reach 1,000 meters?",
    options: [
      "Jeddah Tower, Saudi Arabia",
      "Sky Mile Tower, Japan",
      "Dubai Creek Tower, UAE",
      "Nakheel Tower, UAE",
    ],
    correctIndex: 0,
    explanation:
      "Jeddah Tower (formerly Kingdom Tower) in Saudi Arabia is designed to be the world's first 1-kilometer-tall building. Construction began in 2013 but was paused. When completed, it will surpass the Burj Khalifa by over 170 meters.",
    target: { lat: 21.49, lng: 39.19, altitude: 1.2 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 21.49, lng: 39.19, label: "Jeddah Tower" },
        { lat: 25.2, lng: 55.27, label: "Burj Khalifa" },
      ],
      pointColor: "#ffcc00",
      pointRadius: 0.7,
      pointAltitude: 0.08,
    },
    difficulty: "hard",
    icon: "🏗️",
  },
  {
    id: "ar-03",
    category: "Architecture",
    question: "Which country has the most supertall buildings (300m+)?",
    options: ["United States", "UAE", "China", "South Korea"],
    correctIndex: 2,
    explanation:
      "China has the most supertall buildings (300m+) in the world with over 100! The rapid urbanization and economic growth of Chinese cities led to a skyscraper boom. Shenzhen, Shanghai, Guangzhou, and Wuhan each have multiple supertall towers.",
    target: { lat: 31.23, lng: 121.47, altitude: 2.0 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 31.23, lng: 121.47, label: "Shanghai" },
        { lat: 22.54, lng: 114.06, label: "Shenzhen" },
        { lat: 23.13, lng: 113.26, label: "Guangzhou" },
        { lat: 39.9, lng: 116.4, label: "Beijing" },
        { lat: 30.59, lng: 114.31, label: "Wuhan" },
        { lat: 29.56, lng: 106.55, label: "Chongqing" },
      ],
      pointColor: "#ff8800",
      pointRadius: 0.5,
      pointAltitude: 0.06,
    },
    difficulty: "medium",
    icon: "🏙️",
  },
  {
    id: "ar-04",
    category: "Architecture",
    question: "Where is One World Trade Center?",
    options: ["Chicago, USA", "New York City, USA", "London, UK", "Dubai, UAE"],
    correctIndex: 1,
    explanation:
      "One World Trade Center stands at 541 meters (1,776 feet — symbolizing the year of American independence) in Lower Manhattan, New York City. Built on the site of the original Twin Towers, it opened in 2014 and is the tallest building in the Western Hemisphere.",
    target: { lat: 40.71, lng: -74.01, altitude: 0.8 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 40.71, lng: -74.01, label: "One WTC 541m" },
        { lat: 40.75, lng: -73.98, label: "Empire State 443m" },
        { lat: 40.76, lng: -73.97, label: "432 Park Ave 426m" },
      ],
      pointColor: "#3388ff",
      pointRadius: 0.5,
      pointAltitude: 0.05,
    },
    difficulty: "easy",
    icon: "🗽",
  },
  {
    id: "ar-05",
    category: "Architecture",
    question: "What is the tallest building in Europe?",
    options: ["The Shard, London", "Lakhta Center, St. Petersburg", "Moscow City Tower", "Turning Torso, Malmö"],
    correctIndex: 1,
    explanation:
      "The Lakhta Center in St. Petersburg, Russia, stands at 462 meters. Completed in 2019, it serves as the headquarters of Gazprom. The Shard in London (310m) is the tallest in Western Europe but not the overall tallest.",
    target: { lat: 59.99, lng: 30.18, altitude: 1.0 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 59.99, lng: 30.18, label: "Lakhta Center 462m" },
        { lat: 51.5, lng: -0.09, label: "The Shard 310m" },
        { lat: 55.75, lng: 37.54, label: "Moscow City" },
      ],
      pointColor: "#44aaff",
      pointRadius: 0.6,
      pointAltitude: 0.06,
    },
    difficulty: "hard",
    icon: "🏢",
  },
  {
    id: "ar-06",
    category: "Architecture",
    question: "Where is Taipei 101?",
    options: ["Tokyo, Japan", "Taipei, Taiwan", "Seoul, South Korea", "Singapore"],
    correctIndex: 1,
    explanation:
      "Taipei 101 stands at 508 meters in Taipei, Taiwan. From 2004 to 2010, it was the world's tallest building. It has a massive 730-ton wind damper (a giant golden pendulum) visible to visitors, which stabilizes the tower during typhoons and earthquakes.",
    target: { lat: 25.03, lng: 121.56, altitude: 1.0 },
    globeLayer: {
      type: "points",
      data: [{ lat: 25.03, lng: 121.56, label: "Taipei 101 508m" }],
      pointColor: "#00cc88",
      pointRadius: 0.7,
      pointAltitude: 0.07,
    },
    difficulty: "easy",
    icon: "🏙️",
  },
  {
    id: "ar-07",
    category: "Architecture",
    question: "Which architect designed the Burj Khalifa?",
    options: [
      "Frank Gehry",
      "Zaha Hadid",
      "Adrian Smith (SOM)",
      "Norman Foster",
    ],
    correctIndex: 2,
    explanation:
      "Adrian Smith of Skidmore, Owings & Merrill (SOM) designed the Burj Khalifa. The design was inspired by the Hymenocallis flower, with a Y-shaped floor plan that reduces wind forces on the building. Smith also designed Jeddah Tower.",
    target: { lat: 25.2, lng: 55.27, altitude: 1.0 },
    globeLayer: {
      type: "points",
      data: [{ lat: 25.2, lng: 55.27, label: "Burj Khalifa" }],
      pointColor: "#f5a623",
      pointRadius: 0.8,
      pointAltitude: 0.08,
    },
    difficulty: "hard",
    icon: "✏️",
  },
  {
    id: "ar-08",
    category: "Architecture",
    question: "What is the tallest building in Africa?",
    options: [
      "Carlton Centre, Johannesburg",
      "Iconic Tower, Cairo",
      "Britam Tower, Nairobi",
      "Al Noor Tower, Casablanca",
    ],
    correctIndex: 1,
    explanation:
      "The Iconic Tower in Egypt's New Administrative Capital near Cairo is Africa's tallest building at 385 meters. It was completed in 2023 as part of Egypt's ambitious new capital city project. Africa's skyline is growing fast!",
    target: { lat: 30.02, lng: 31.76, altitude: 1.2 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 30.02, lng: 31.76, label: "Iconic Tower 385m" },
        { lat: -26.2, lng: 28.05, label: "Carlton Centre 223m" },
        { lat: -1.29, lng: 36.82, label: "Britam Tower 200m" },
      ],
      pointColor: "#ffaa44",
      pointRadius: 0.6,
      pointAltitude: 0.06,
    },
    difficulty: "hard",
    icon: "🌍",
  },
  {
    id: "ar-09",
    category: "Architecture",
    question: "Where are the Petronas Twin Towers?",
    options: ["Singapore", "Kuala Lumpur, Malaysia", "Bangkok, Thailand", "Jakarta, Indonesia"],
    correctIndex: 1,
    explanation:
      "The Petronas Twin Towers in Kuala Lumpur, Malaysia, stand at 452 meters. From 1998 to 2004, they were the world's tallest buildings. They remain the tallest twin towers in the world, connected by a sky bridge on the 41st and 42nd floors.",
    target: { lat: 3.16, lng: 101.71, altitude: 1.0 },
    globeLayer: {
      type: "points",
      data: [{ lat: 3.16, lng: 101.71, label: "Petronas 452m" }],
      pointColor: "#cc8800",
      pointRadius: 0.7,
      pointAltitude: 0.07,
    },
    difficulty: "easy",
    icon: "🏢",
  },
  {
    id: "ar-10",
    category: "Architecture",
    question: "What ancient wonder was the tallest man-made structure for over 3,800 years?",
    options: [
      "Colossus of Rhodes",
      "Great Pyramid of Giza",
      "Lighthouse of Alexandria",
      "Tower of Babel",
    ],
    correctIndex: 1,
    explanation:
      "The Great Pyramid of Giza (146 meters when built in 2560 BC) was the tallest man-made structure for about 3,800 years — until Lincoln Cathedral in England surpassed it around 1300 AD. It's the only surviving ancient wonder of the world!",
    target: { lat: 29.98, lng: 31.13, altitude: 1.0 },
    globeLayer: {
      type: "points",
      data: [{ lat: 29.98, lng: 31.13, label: "Great Pyramid 146m" }],
      pointColor: "#ddbb44",
      pointRadius: 0.8,
      pointAltitude: 0.06,
    },
    difficulty: "medium",
    icon: "🏛️",
  },
  {
    id: "ar-11",
    category: "Architecture",
    question: "Where is the Shanghai Tower?",
    options: ["Beijing, China", "Shanghai, China", "Hong Kong", "Taipei, Taiwan"],
    correctIndex: 1,
    explanation:
      "The Shanghai Tower is in the Pudong district of Shanghai, China. At 632 meters, it's the tallest building in China and the third tallest in the world. Its twisting design reduces wind loads by 24% and it has the world's highest observation deck.",
    target: { lat: 31.24, lng: 121.5, altitude: 1.0 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 31.24, lng: 121.5, label: "Shanghai Tower 632m" },
        { lat: 31.24, lng: 121.49, label: "SWFC 492m" },
        { lat: 31.24, lng: 121.5, label: "Jin Mao 421m" },
      ],
      pointColor: "#4488cc",
      pointRadius: 0.6,
      pointAltitude: 0.07,
    },
    difficulty: "easy",
    icon: "🏙️",
  },
  {
    id: "ar-12",
    category: "Architecture",
    question: "What is the tallest building in South America?",
    options: [
      "Gran Torre Santiago, Chile",
      "Torre de Cali, Colombia",
      "Parque Central, Venezuela",
      "Altino Arantes, Brazil",
    ],
    correctIndex: 0,
    explanation:
      "Gran Torre Santiago (also called Costanera Center) in Santiago, Chile, is the tallest building in South America at 300 meters. Completed in 2014, it has a sky observation deck called Sky Costanera with panoramic views of the Andes mountains.",
    target: { lat: -33.42, lng: -70.61, altitude: 1.2 },
    globeLayer: {
      type: "points",
      data: [{ lat: -33.42, lng: -70.61, label: "Gran Torre 300m" }],
      pointColor: "#cc4444",
      pointRadius: 0.7,
      pointAltitude: 0.06,
    },
    difficulty: "hard",
    icon: "🏗️",
  },

  // ──────────────────── RAIL NETWORKS (10) ────────────────────
  {
    id: "rl-01",
    category: "Infrastructure",
    question: "Which country has the world's longest high-speed rail network?",
    options: ["Japan", "France", "China", "Germany"],
    correctIndex: 2,
    explanation:
      "China has by far the world's longest high-speed rail network at over 45,000 km — more than the rest of the world combined! Since 2008, China has built an astonishing network connecting major cities. A Beijing-to-Shanghai trip (1,300 km) takes just 4.5 hours.",
    target: { lat: 35.0, lng: 105.0, altitude: 2.5 },
    globeLayer: {
      type: "arcs",
      data: [
        { startLat: 39.9, startLng: 116.4, endLat: 31.23, endLng: 121.47 },
        { startLat: 39.9, startLng: 116.4, endLat: 23.13, endLng: 113.26 },
        { startLat: 31.23, startLng: 121.47, endLat: 22.54, endLng: 114.06 },
        { startLat: 39.9, startLng: 116.4, endLat: 30.59, endLng: 114.31 },
        { startLat: 34.26, startLng: 108.94, endLat: 29.56, endLng: 106.55 },
      ],
      arcColor: "#ff4444",
    },
    difficulty: "easy",
    icon: "🚄",
  },
  {
    id: "rl-02",
    category: "Infrastructure",
    question: "What is the fastest commercial train in regular service?",
    options: [
      "TGV (France, 320 km/h)",
      "Shanghai Maglev (China, 431 km/h)",
      "Shinkansen (Japan, 320 km/h)",
      "ICE (Germany, 300 km/h)",
    ],
    correctIndex: 1,
    explanation:
      "The Shanghai Maglev (magnetic levitation) train reaches 431 km/h in regular service, covering 30 km from Pudong Airport to the city in just 7 minutes. It uses powerful electromagnets instead of wheels, floating above the track!",
    target: { lat: 31.15, lng: 121.81, altitude: 1.0 },
    globeLayer: {
      type: "arcs",
      data: [{ startLat: 31.19, startLng: 121.81, endLat: 31.15, endLng: 121.34 }],
      arcColor: "#00ccff",
    },
    difficulty: "medium",
    icon: "🚄",
  },
  {
    id: "rl-03",
    category: "Infrastructure",
    question: "Where does the Trans-Siberian Railway run?",
    options: [
      "St. Petersburg to Beijing",
      "Moscow to Vladivostok, Russia",
      "Berlin to Moscow",
      "Istanbul to Tehran",
    ],
    correctIndex: 1,
    explanation:
      "The Trans-Siberian Railway stretches 9,289 km from Moscow to Vladivostok on Russia's Pacific coast — the longest railway line in the world. The full journey takes about 7 days and crosses 8 time zones. It was built between 1891 and 1916.",
    target: { lat: 55.0, lng: 90.0, altitude: 2.5 },
    globeLayer: {
      type: "arcs",
      data: [{ startLat: 55.75, startLng: 37.62, endLat: 43.12, endLng: 131.87 }],
      arcColor: "#ff6600",
    },
    difficulty: "easy",
    icon: "🚂",
  },
  {
    id: "rl-04",
    category: "Infrastructure",
    question: "Which country invented the bullet train (Shinkansen)?",
    options: ["France", "Germany", "Japan", "China"],
    correctIndex: 2,
    explanation:
      "Japan introduced the Shinkansen (bullet train) on October 1, 1964, just before the Tokyo Olympics. The first route connected Tokyo and Osaka at speeds up to 210 km/h. Remarkably, in over 60 years of service, there has never been a fatal accident on the Shinkansen!",
    target: { lat: 35.68, lng: 139.69, altitude: 1.5 },
    globeLayer: {
      type: "arcs",
      data: [
        { startLat: 35.68, startLng: 139.69, endLat: 34.69, endLng: 135.5 },
        { startLat: 35.68, startLng: 139.69, endLat: 38.27, endLng: 140.87 },
        { startLat: 34.69, startLng: 135.5, endLat: 33.59, endLng: 130.4 },
      ],
      arcColor: "#ffffff",
    },
    difficulty: "easy",
    icon: "🚅",
  },
  {
    id: "rl-05",
    category: "Infrastructure",
    question: "Where is the Channel Tunnel (Chunnel)?",
    options: [
      "Between Denmark and Sweden",
      "Between England and France",
      "Between Spain and Morocco",
      "Between Italy and Sicily",
    ],
    correctIndex: 1,
    explanation:
      "The Channel Tunnel runs 50.5 km under the English Channel between Folkestone, England, and Coquelles, France. Opened in 1994, it carries Eurostar passenger trains and freight. The underwater portion is 37.9 km, making it the longest undersea tunnel in the world.",
    target: { lat: 51.01, lng: 1.13, altitude: 0.8 },
    globeLayer: {
      type: "arcs",
      data: [{ startLat: 51.09, startLng: 1.18, endLat: 50.93, endLng: 1.79 }],
      arcColor: "#3388ff",
    },
    difficulty: "easy",
    icon: "🚇",
  },
  {
    id: "rl-06",
    category: "Infrastructure",
    question: "What is the longest rail tunnel in the world?",
    options: [
      "Channel Tunnel (UK-France)",
      "Gotthard Base Tunnel, Switzerland",
      "Seikan Tunnel, Japan",
      "Laerdal Tunnel, Norway",
    ],
    correctIndex: 1,
    explanation:
      "The Gotthard Base Tunnel in Switzerland is the world's longest railway tunnel at 57.1 km. Opened in 2016, it runs under the Swiss Alps and reduced travel time between Zurich and Milan. It took 17 years to build and reaches a depth of 2,300 meters below the mountain peaks above.",
    target: { lat: 46.65, lng: 8.65, altitude: 0.8 },
    globeLayer: {
      type: "arcs",
      data: [{ startLat: 46.83, startLng: 8.65, endLat: 46.48, endLng: 8.78 }],
      arcColor: "#ff4444",
    },
    difficulty: "medium",
    icon: "🏔️",
  },
  {
    id: "rl-07",
    category: "Infrastructure",
    question: "Which city has the busiest metro system in the world (by ridership)?",
    options: ["Tokyo, Japan", "Beijing, China", "New York City, USA", "London, UK"],
    correctIndex: 1,
    explanation:
      "Beijing's metro system carries over 10 million passengers daily and has the highest annual ridership globally. The system has expanded rapidly since 2000 and now has over 800 km of track with 27 lines, making it one of the largest in the world.",
    target: { lat: 39.9, lng: 116.4, altitude: 1.2 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 39.9, lng: 116.4, label: "Beijing" },
        { lat: 35.68, lng: 139.69, label: "Tokyo" },
        { lat: 40.71, lng: -74.01, label: "NYC" },
        { lat: 51.51, lng: -0.13, label: "London" },
      ],
      pointColor: "#cc3333",
      pointRadius: 0.5,
      pointAltitude: 0.04,
    },
    difficulty: "hard",
    icon: "🚇",
  },
  {
    id: "rl-08",
    category: "Infrastructure",
    question: "Which European country has the most extensive rail network?",
    options: ["France", "Germany", "United Kingdom", "Spain"],
    correctIndex: 1,
    explanation:
      "Germany has the most extensive rail network in Europe with about 38,000 km of track. Deutsche Bahn operates both high-speed ICE trains and local services. Germany's central location makes its rail network a critical hub for European freight and passenger transport.",
    target: { lat: 51.0, lng: 10.0, altitude: 1.5 },
    globeLayer: {
      type: "arcs",
      data: [
        { startLat: 52.52, startLng: 13.4, endLat: 48.14, endLng: 11.58 },
        { startLat: 52.52, startLng: 13.4, endLat: 50.94, endLng: 6.96 },
        { startLat: 53.55, startLng: 10.0, endLat: 48.78, endLng: 9.18 },
      ],
      arcColor: "#dddddd",
    },
    difficulty: "medium",
    icon: "🚆",
  },
  {
    id: "rl-09",
    category: "Infrastructure",
    question: "What is the highest railway in the world?",
    options: [
      "Bernina Express, Switzerland",
      "Qinghai-Tibet Railway, China",
      "Andean Railway, Peru",
      "Darjeeling Railway, India",
    ],
    correctIndex: 1,
    explanation:
      "The Qinghai-Tibet Railway reaches a maximum elevation of 5,072 meters above sea level at Tanggula Pass — the highest point of any railway in the world. Opened in 2006, it connects Xining to Lhasa across the Tibetan Plateau. Trains have pressurized cabins and supplemental oxygen!",
    target: { lat: 33.0, lng: 92.0, altitude: 2.0 },
    globeLayer: {
      type: "arcs",
      data: [{ startLat: 36.62, startLng: 101.77, endLat: 29.65, endLng: 91.13 }],
      arcColor: "#ffaa00",
    },
    difficulty: "hard",
    icon: "🏔️",
  },
  {
    id: "rl-10",
    category: "Infrastructure",
    question: "Where is the world's most punctual high-speed rail system?",
    options: ["France (TGV)", "Japan (Shinkansen)", "China (CRH)", "Spain (AVE)"],
    correctIndex: 1,
    explanation:
      "Japan's Shinkansen averages delays of less than 1 minute per train, making it the most punctual high-speed rail in the world. The system runs 323 trains per day on the Tokaido line alone. If a train is more than 1 minute late, the conductor apologizes!",
    target: { lat: 35.68, lng: 139.69, altitude: 1.5 },
    globeLayer: {
      type: "arcs",
      data: [
        { startLat: 35.68, startLng: 139.69, endLat: 34.69, endLng: 135.5 },
        { startLat: 34.69, startLng: 135.5, endLat: 34.4, endLng: 132.46 },
      ],
      arcColor: "#00ccff",
    },
    difficulty: "medium",
    icon: "🚅",
  },

  // ──────────────────── OCEAN & ENVIRONMENT (12) ────────────────────
  {
    id: "en-01",
    category: "Environment",
    question: "Where is the Great Pacific Garbage Patch?",
    options: [
      "Near Australia",
      "Between Hawaii and California",
      "Near Japan",
      "In the South Pacific",
    ],
    correctIndex: 1,
    explanation:
      "The Great Pacific Garbage Patch is between Hawaii and California, covering an area roughly twice the size of Texas. It contains an estimated 80,000 tons of plastic. Most pieces are microplastics — too small to see but harmful to marine life.",
    target: { lat: 30.0, lng: -140.0, altitude: 2.0 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 30, lng: -140, label: "Garbage Patch center" },
        { lat: 21.3, lng: -157.8, label: "Hawaii" },
        { lat: 34.05, lng: -118.24, label: "California" },
      ],
      pointColor: "#88cc44",
      pointRadius: 1.0,
      pointAltitude: 0.03,
    },
    difficulty: "easy",
    icon: "🗑️",
  },
  {
    id: "en-02",
    category: "Environment",
    question: "Which reef experienced severe bleaching in 2024?",
    options: [
      "Belize Barrier Reef",
      "Red Sea Coral Reef",
      "Great Barrier Reef",
      "Maldives Coral Reef",
    ],
    correctIndex: 2,
    explanation:
      "Australia's Great Barrier Reef experienced mass coral bleaching in 2024, with surveys finding bleaching in 73% of reefs. Bleaching happens when water temperatures rise and corals expel the algae living in their tissues. The reef is the world's largest coral system at 2,300 km long.",
    target: { lat: -18.29, lng: 147.7, altitude: 1.8 },
    globeLayer: {
      type: "points",
      data: [
        { lat: -18.29, lng: 147.7, label: "GBR North" },
        { lat: -20.5, lng: 149.0, label: "GBR Central" },
        { lat: -23.4, lng: 151.9, label: "GBR South" },
      ],
      pointColor: "#ff8844",
      pointRadius: 0.5,
      pointAltitude: 0.03,
    },
    difficulty: "medium",
    icon: "🐠",
  },
  {
    id: "en-03",
    category: "Environment",
    question: "What percentage of Earth's surface is covered by ocean?",
    options: ["51%", "61%", "71%", "81%"],
    correctIndex: 2,
    explanation:
      "About 71% of Earth's surface is covered by ocean water. The Pacific Ocean alone is larger than all the land areas combined! Despite covering most of our planet, we've explored less than 20% of the ocean floor — we know more about the Moon's surface.",
    target: { lat: 0.0, lng: -160.0, altitude: 3.0 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 0, lng: -160, label: "Pacific" },
        { lat: 0, lng: -30, label: "Atlantic" },
        { lat: -10, lng: 70, label: "Indian" },
        { lat: -70, lng: 0, label: "Southern" },
        { lat: 80, lng: 0, label: "Arctic" },
      ],
      pointColor: "#2288ff",
      pointRadius: 0.8,
      pointAltitude: 0.02,
    },
    difficulty: "easy",
    icon: "🌊",
  },
  {
    id: "en-04",
    category: "Environment",
    question: "Where is the Mariana Trench?",
    options: ["Atlantic Ocean", "Indian Ocean", "Western Pacific Ocean", "Arctic Ocean"],
    correctIndex: 2,
    explanation:
      "The Mariana Trench is in the western Pacific Ocean, east of the Philippines and Mariana Islands. Its deepest point, Challenger Deep, reaches 10,935 meters (nearly 11 km!) below sea level. If you put Mount Everest at the bottom, its peak would still be over 2 km underwater!",
    target: { lat: 11.35, lng: 142.2, altitude: 1.5 },
    globeLayer: {
      type: "points",
      data: [{ lat: 11.35, lng: 142.2, label: "Challenger Deep" }],
      pointColor: "#000066",
      pointRadius: 0.8,
      pointAltitude: 0.02,
    },
    difficulty: "medium",
    icon: "🌊",
  },
  {
    id: "en-05",
    category: "Environment",
    question: "Which ocean is the warmest on average?",
    options: ["Pacific Ocean", "Atlantic Ocean", "Indian Ocean", "Southern Ocean"],
    correctIndex: 2,
    explanation:
      "The Indian Ocean is the warmest ocean with average surface temperatures around 22°C (72°F). Its tropical location between Africa, Asia, and Australia means most of its water sits in warm equatorial and tropical zones. This warmth fuels cyclones in the region.",
    target: { lat: -10.0, lng: 70.0, altitude: 2.5 },
    globeLayer: {
      type: "points",
      data: [
        { lat: -10, lng: 70, label: "Indian Ocean" },
        { lat: 12.0, lng: 44.0, label: "Gulf of Aden" },
        { lat: -4.0, lng: 55.5, label: "Seychelles" },
        { lat: -12.3, lng: 44.3, label: "Comoros" },
      ],
      pointColor: "#ff6644",
      pointRadius: 0.5,
      pointAltitude: 0.02,
    },
    difficulty: "medium",
    icon: "🌡️",
  },
  {
    id: "en-06",
    category: "Environment",
    question: "Where does the Gulf Stream flow?",
    options: [
      "Pacific: Japan to Alaska",
      "Atlantic: Gulf of Mexico to Northern Europe",
      "Indian Ocean: Africa to India",
      "Arctic: Russia to Canada",
    ],
    correctIndex: 1,
    explanation:
      "The Gulf Stream is a powerful warm ocean current that flows from the Gulf of Mexico along the US East Coast and across the Atlantic to Northern Europe. It carries warm water that keeps Western Europe much warmer than other regions at the same latitude. London is warmer than Labrador because of it!",
    target: { lat: 35.0, lng: -55.0, altitude: 2.5 },
    globeLayer: {
      type: "arcs",
      data: [
        { startLat: 25.0, startLng: -80.0, endLat: 40.0, endLng: -60.0 },
        { startLat: 40.0, startLng: -60.0, endLat: 55.0, endLng: -10.0 },
        { startLat: 55.0, startLng: -10.0, endLat: 65.0, endLng: 10.0 },
      ],
      arcColor: "#ff6633",
    },
    difficulty: "medium",
    icon: "🌊",
  },
  {
    id: "en-07",
    category: "Environment",
    question: "How many major ocean garbage patches exist?",
    options: ["1", "3", "5", "10"],
    correctIndex: 2,
    explanation:
      "There are 5 major garbage patches in the world's oceans, one in each of the main ocean gyres: North Pacific, South Pacific, North Atlantic, South Atlantic, and Indian Ocean. Ocean currents trap floating debris in these rotating zones. Together they contain millions of tons of plastic.",
    target: { lat: 10.0, lng: -30.0, altitude: 3.5 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 30, lng: -140, label: "North Pacific" },
        { lat: -30, lng: -110, label: "South Pacific" },
        { lat: 30, lng: -45, label: "North Atlantic" },
        { lat: -30, lng: -20, label: "South Atlantic" },
        { lat: -25, lng: 75, label: "Indian Ocean" },
      ],
      pointColor: "#66cc44",
      pointRadius: 0.8,
      pointAltitude: 0.03,
    },
    difficulty: "medium",
    icon: "♻️",
  },
  {
    id: "en-08",
    category: "Environment",
    question: "Where is the Amazon Rainforest?",
    options: ["Central Africa", "South America (mainly Brazil)", "Southeast Asia", "Central America"],
    correctIndex: 1,
    explanation:
      "The Amazon Rainforest covers about 5.5 million square kilometers, mostly in Brazil (60%) but also in Peru, Colombia, and other South American countries. It produces about 6% of the world's oxygen and is home to 10% of all species on Earth. It's often called the 'Lungs of the Earth.'",
    target: { lat: -3.0, lng: -60.0, altitude: 2.0 },
    globeLayer: {
      type: "points",
      data: [
        { lat: -3.12, lng: -60.02, label: "Manaus" },
        { lat: -1.46, lng: -48.5, label: "Belem" },
        { lat: -3.77, lng: -73.25, label: "Iquitos" },
        { lat: 2.82, lng: -60.67, label: "Roraima" },
      ],
      pointColor: "#22aa44",
      pointRadius: 0.5,
      pointAltitude: 0.03,
    },
    difficulty: "easy",
    icon: "🌳",
  },
  {
    id: "en-09",
    category: "Environment",
    question: "Which is the largest desert in the world?",
    options: ["Sahara Desert", "Arabian Desert", "Antarctic Desert", "Gobi Desert"],
    correctIndex: 2,
    explanation:
      "Surprise! The Antarctic is technically the world's largest desert at 14.2 million square kilometers. A desert is defined by low precipitation, not temperature. Antarctica receives very little snowfall. The Sahara (9.2 million sq km) is the largest hot desert.",
    target: { lat: -82.0, lng: 0.0, altitude: 2.5 },
    globeLayer: {
      type: "points",
      data: [
        { lat: -82, lng: 0, label: "Antarctica" },
        { lat: 23, lng: 12, label: "Sahara" },
        { lat: 23, lng: 45, label: "Arabian" },
        { lat: 43, lng: 105, label: "Gobi" },
      ],
      pointColor: "#ddcc88",
      pointRadius: 0.8,
      pointAltitude: 0.03,
    },
    difficulty: "hard",
    icon: "🏜️",
  },
  {
    id: "en-10",
    category: "Environment",
    question: "What is the deepest lake in the world?",
    options: ["Lake Victoria", "Caspian Sea", "Lake Baikal", "Lake Tanganyika"],
    correctIndex: 2,
    explanation:
      "Lake Baikal in Siberia, Russia, is the world's deepest lake at 1,642 meters deep. It's also the oldest (25 million years) and holds about 20% of the world's unfrozen fresh surface water — more than all the Great Lakes combined!",
    target: { lat: 53.5, lng: 108.0, altitude: 1.5 },
    globeLayer: {
      type: "points",
      data: [{ lat: 53.5, lng: 108.0, label: "Lake Baikal 1642m deep" }],
      pointColor: "#2266cc",
      pointRadius: 0.8,
      pointAltitude: 0.04,
    },
    difficulty: "medium",
    icon: "💧",
  },
  {
    id: "en-11",
    category: "Environment",
    question: "Where is the Sahara Desert?",
    options: ["Southern Africa", "North Africa", "Middle East", "Central Asia"],
    correctIndex: 1,
    explanation:
      "The Sahara Desert covers most of North Africa, spanning 9.2 million square kilometers across 11 countries including Algeria, Libya, Egypt, and Morocco. It's roughly the size of the United States! Temperatures can exceed 50°C during the day and drop below freezing at night.",
    target: { lat: 23.0, lng: 12.0, altitude: 2.5 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 23, lng: 12, label: "Central Sahara" },
        { lat: 27, lng: 1, label: "Algeria" },
        { lat: 27, lng: 17, label: "Libya" },
        { lat: 18, lng: 20, label: "Chad" },
      ],
      pointColor: "#ddaa44",
      pointRadius: 0.6,
      pointAltitude: 0.03,
    },
    difficulty: "easy",
    icon: "🏜️",
  },
  {
    id: "en-12",
    category: "Environment",
    question: "Which country has the most biodiversity (species of plants and animals)?",
    options: ["India", "Brazil", "Australia", "Indonesia"],
    correctIndex: 1,
    explanation:
      "Brazil is considered the most biodiverse country on Earth, home to an estimated 15-20% of all known species. The Amazon Rainforest, Atlantic Forest, Cerrado, and Pantanal wetlands create incredibly diverse habitats. Brazil has more plant species (over 50,000) than any other country.",
    target: { lat: -14.24, lng: -51.93, altitude: 2.0 },
    globeLayer: {
      type: "points",
      data: [
        { lat: -3.12, lng: -60.02, label: "Amazon" },
        { lat: -15.79, lng: -47.88, label: "Cerrado" },
        { lat: -19.92, lng: -43.94, label: "Atlantic Forest" },
        { lat: -19.0, lng: -57.0, label: "Pantanal" },
      ],
      pointColor: "#22cc44",
      pointRadius: 0.5,
      pointAltitude: 0.04,
    },
    difficulty: "medium",
    icon: "🦜",
  },

  // ──────────────────── CELL TOWERS & TELECOM (8) ────────────────────
  {
    id: "tc-01",
    category: "Technology",
    question: "Which country has the most cell towers?",
    options: ["United States", "India", "China", "Brazil"],
    correctIndex: 2,
    explanation:
      "China has the most cell towers in the world, with over 3.5 million base stations including more than 2 million 5G towers. China's massive investment in telecommunications infrastructure has given it the world's largest 5G network.",
    target: { lat: 35.0, lng: 105.0, altitude: 2.5 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 39.9, lng: 116.4, label: "Beijing" },
        { lat: 31.23, lng: 121.47, label: "Shanghai" },
        { lat: 22.54, lng: 114.06, label: "Shenzhen" },
        { lat: 23.13, lng: 113.26, label: "Guangzhou" },
        { lat: 30.59, lng: 114.31, label: "Wuhan" },
      ],
      pointColor: "#33ccdd",
      pointRadius: 0.4,
      pointAltitude: 0.04,
    },
    difficulty: "medium",
    icon: "📡",
  },
  {
    id: "tc-02",
    category: "Technology",
    question: "What does 5G NR stand for?",
    options: ["5th Generation Network Relay", "5th Generation New Radio", "5 Gigabit Network Router", "5th Generation Next Release"],
    correctIndex: 1,
    explanation:
      "5G NR stands for '5th Generation New Radio.' It's the global standard for 5G wireless networks, offering speeds up to 20 Gbps, ultra-low latency (under 1 millisecond), and the ability to connect millions of devices per square kilometer.",
    target: { lat: 37.57, lng: 127.0, altitude: 1.5 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 37.57, lng: 127.0, label: "Seoul (5G pioneer)" },
        { lat: 39.9, lng: 116.4, label: "Beijing" },
        { lat: 40.71, lng: -74.01, label: "New York" },
        { lat: 51.51, lng: -0.13, label: "London" },
      ],
      pointColor: "#00ddaa",
      pointRadius: 0.5,
      pointAltitude: 0.05,
    },
    difficulty: "hard",
    icon: "📶",
  },
  {
    id: "tc-03",
    category: "Technology",
    question: "Approximately how many cell towers exist worldwide?",
    options: ["1 million", "5 million", "10 million", "50 million"],
    correctIndex: 2,
    explanation:
      "There are approximately 10 million cell towers worldwide, with China and India having the most. As 5G rolls out, more small cells are being deployed in cities, so this number is growing rapidly. A single tower can serve hundreds of simultaneous users.",
    target: { lat: 20.0, lng: 0.0, altitude: 3.5 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 39.9, lng: 116.4, label: "China" },
        { lat: 20.6, lng: 78.96, label: "India" },
        { lat: 38.9, lng: -77.04, label: "USA" },
        { lat: -14.24, lng: -51.93, label: "Brazil" },
        { lat: 55.75, lng: 37.62, label: "Russia" },
      ],
      pointColor: "#33ccdd",
      pointRadius: 0.6,
      pointAltitude: 0.04,
    },
    difficulty: "medium",
    icon: "📡",
  },
  {
    id: "tc-04",
    category: "Technology",
    question: "Which city has the highest cell tower density in the world?",
    options: ["Tokyo, Japan", "New York City, USA", "Delhi NCR, India", "London, UK"],
    correctIndex: 2,
    explanation:
      "The Delhi National Capital Region (NCR) in India has one of the highest cell tower densities due to its massive population of over 30 million people. India's telecom revolution, led by affordable data from Jio, required huge infrastructure buildout.",
    target: { lat: 28.61, lng: 77.21, altitude: 1.0 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 28.61, lng: 77.21, label: "Delhi" },
        { lat: 28.46, lng: 77.03, label: "Gurgaon" },
        { lat: 28.57, lng: 77.32, label: "Noida" },
      ],
      pointColor: "#ff8800",
      pointRadius: 0.5,
      pointAltitude: 0.04,
    },
    difficulty: "hard",
    icon: "📱",
  },
  {
    id: "tc-05",
    category: "Technology",
    question: "What percentage of international internet traffic is carried by undersea cables?",
    options: ["50%", "75%", "95%", "99%"],
    correctIndex: 3,
    explanation:
      "Approximately 99% of all intercontinental internet traffic travels through undersea fiber optic cables. There are over 500 cables on the ocean floor totaling more than 1.3 million km. These cables are only about as thick as a garden hose but carry the data that runs the modern world!",
    target: { lat: 30.0, lng: -40.0, altitude: 3.0 },
    globeLayer: {
      type: "arcs",
      data: [
        { startLat: 40.71, startLng: -74.01, endLat: 51.51, endLng: -0.13 },
        { startLat: 34.05, startLng: -118.24, endLat: 35.68, endLng: 139.69 },
        { startLat: 1.35, startLng: 103.82, endLat: -33.87, endLng: 151.21 },
      ],
      arcColor: "#44aaff",
    },
    difficulty: "medium",
    icon: "🌐",
  },
  {
    id: "tc-06",
    category: "Technology",
    question: "Which country launched 5G service first?",
    options: ["United States", "Japan", "South Korea", "China"],
    correctIndex: 2,
    explanation:
      "South Korea launched the world's first nationwide 5G network in April 2019, just hours before the US carriers went live. SK Telecom, KT, and LG U+ rolled out 5G services simultaneously. South Korea has consistently been a leader in mobile technology adoption.",
    target: { lat: 37.57, lng: 127.0, altitude: 1.2 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 37.57, lng: 127.0, label: "Seoul" },
        { lat: 35.18, lng: 129.08, label: "Busan" },
        { lat: 35.87, lng: 128.6, label: "Daegu" },
      ],
      pointColor: "#00ccaa",
      pointRadius: 0.5,
      pointAltitude: 0.05,
    },
    difficulty: "hard",
    icon: "📱",
  },
  {
    id: "tc-07",
    category: "Technology",
    question: "What is a 'small cell' in 5G networks?",
    options: [
      "A tiny phone battery",
      "A low-power base station for dense areas",
      "A type of SIM card",
      "A satellite dish",
    ],
    correctIndex: 1,
    explanation:
      "Small cells are low-power, short-range base stations used to boost 5G coverage in dense urban areas. Unlike tall cell towers, small cells can be mounted on lamp posts, buildings, and street furniture. A single city block might need several small cells for full 5G mmWave coverage.",
    target: { lat: 40.71, lng: -74.01, altitude: 1.0 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 40.71, lng: -74.01, label: "NYC" },
        { lat: 34.05, lng: -118.24, label: "LA" },
        { lat: 41.88, lng: -87.63, label: "Chicago" },
      ],
      pointColor: "#00ddcc",
      pointRadius: 0.4,
      pointAltitude: 0.03,
    },
    difficulty: "medium",
    icon: "📶",
  },
  {
    id: "tc-08",
    category: "Technology",
    question: "Where is Microsoft's $500B Stargate AI data center project?",
    options: ["Seattle, Washington", "Abilene, Texas", "Silicon Valley, California", "Ashburn, Virginia"],
    correctIndex: 1,
    explanation:
      "Microsoft and OpenAI announced the Stargate project in Abilene, Texas — a massive $500 billion AI data center investment. Texas was chosen for its abundant land, energy resources, and favorable regulations. It aims to be the largest AI computing infrastructure ever built.",
    target: { lat: 32.45, lng: -99.73, altitude: 1.2 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 32.45, lng: -99.73, label: "Abilene TX" },
        { lat: 47.61, lng: -122.33, label: "Seattle" },
        { lat: 37.39, lng: -122.08, label: "Silicon Valley" },
      ],
      pointColor: "#3388ff",
      pointRadius: 0.7,
      pointAltitude: 0.05,
    },
    difficulty: "hard",
    icon: "🤖",
  },

  // ──────────────────── AI & TECHNOLOGY (10) ────────────────────
  {
    id: "ai-01",
    category: "Technology",
    question: "Which company operates the most hyperscale data centers?",
    options: ["Google", "Microsoft", "Amazon (AWS)", "Meta"],
    correctIndex: 2,
    explanation:
      "Amazon Web Services (AWS) operates the most hyperscale data centers globally with facilities across 34 geographic regions. AWS powers about 31% of the cloud computing market and serves millions of customers from Netflix to NASA.",
    target: { lat: 38.9, lng: -77.0, altitude: 2.5 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 39.04, lng: -77.49, label: "AWS Virginia" },
        { lat: 45.52, lng: -122.68, label: "AWS Oregon" },
        { lat: 1.35, lng: 103.82, label: "AWS Singapore" },
        { lat: 53.35, lng: -6.26, label: "AWS Ireland" },
        { lat: -33.87, lng: 151.21, label: "AWS Sydney" },
        { lat: 35.68, lng: 139.69, label: "AWS Tokyo" },
      ],
      pointColor: "#ff9900",
      pointRadius: 0.5,
      pointAltitude: 0.05,
    },
    difficulty: "medium",
    icon: "☁️",
  },
  {
    id: "ai-02",
    category: "Technology",
    question: "Where is Google's largest data center?",
    options: ["Mountain View, California", "The Dalles, Oregon", "Dublin, Ireland", "Singapore"],
    correctIndex: 1,
    explanation:
      "Google's largest data center is in The Dalles, Oregon. Located along the Columbia River, it benefits from cheap hydroelectric power and cool climate for natural cooling. Google has invested over $12 billion in this facility.",
    target: { lat: 45.6, lng: -121.18, altitude: 1.2 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 45.6, lng: -121.18, label: "The Dalles OR" },
        { lat: 37.42, lng: -122.08, label: "Google HQ" },
      ],
      pointColor: "#4285f4",
      pointRadius: 0.7,
      pointAltitude: 0.05,
    },
    difficulty: "hard",
    icon: "🔍",
  },
  {
    id: "ai-03",
    category: "Technology",
    question: "Where is the world's largest server farm (by area)?",
    options: [
      "Ashburn, Virginia",
      "Citadel Campus, Tahoe Reno, Nevada",
      "Prineville, Oregon",
      "Lulea, Sweden",
    ],
    correctIndex: 1,
    explanation:
      "The Citadel Campus in Tahoe Reno, Nevada (operated by Switch) covers over 7.2 million square feet, making it the world's largest data center campus. Nevada's dry climate and available solar/geothermal energy make it ideal for data centers.",
    target: { lat: 39.53, lng: -119.81, altitude: 1.2 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 39.53, lng: -119.81, label: "Citadel" },
        { lat: 39.04, lng: -77.49, label: "Ashburn VA" },
      ],
      pointColor: "#44cc88",
      pointRadius: 0.7,
      pointAltitude: 0.05,
    },
    difficulty: "hard",
    icon: "🖥️",
  },
  {
    id: "ai-04",
    category: "Technology",
    question: "What country hosts the most undersea cable landing stations?",
    options: ["United States", "United Kingdom", "Singapore", "Japan"],
    correctIndex: 0,
    explanation:
      "The United States has the most undersea cable landing stations, with major hubs in New York, Miami, Los Angeles, and the Pacific Northwest. These cables connect the US to Europe, Asia, and South America, carrying 99% of international data traffic.",
    target: { lat: 38.0, lng: -97.0, altitude: 2.5 },
    globeLayer: {
      type: "arcs",
      data: [
        { startLat: 40.71, startLng: -74.01, endLat: 51.51, endLng: -0.13 },
        { startLat: 25.76, startLng: -80.19, endLat: -22.91, endLng: -43.17 },
        { startLat: 34.05, startLng: -118.24, endLat: 35.68, endLng: 139.69 },
      ],
      arcColor: "#00aaff",
    },
    difficulty: "medium",
    icon: "🌐",
  },
  {
    id: "ai-05",
    category: "Technology",
    question: "Where is the world's most connected internet exchange point?",
    options: ["New York (NYIIX)", "Frankfurt (DE-CIX)", "London (LINX)", "Amsterdam (AMS-IX)"],
    correctIndex: 1,
    explanation:
      "DE-CIX in Frankfurt, Germany, is the world's largest internet exchange point by peak traffic, handling over 17 Tbps. Internet exchange points are physical locations where different internet networks connect to exchange data directly, making the internet faster.",
    target: { lat: 50.11, lng: 8.68, altitude: 1.0 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 50.11, lng: 8.68, label: "DE-CIX Frankfurt" },
        { lat: 52.37, lng: 4.9, label: "AMS-IX" },
        { lat: 51.51, lng: -0.13, label: "LINX" },
        { lat: 40.71, lng: -74.01, label: "NYIIX" },
      ],
      pointColor: "#ff4488",
      pointRadius: 0.6,
      pointAltitude: 0.05,
    },
    difficulty: "hard",
    icon: "🌐",
  },

  // ──────────────────── GLOBAL CONFLICTS & GEOPOLITICS (10) ────────────────────
  {
    id: "gp-01",
    category: "Geopolitics",
    question: "How many people are forcibly displaced globally (as of 2024)?",
    options: ["25 million", "60 million", "117 million", "500 million"],
    correctIndex: 2,
    explanation:
      "According to UNHCR, over 117 million people are forcibly displaced worldwide — the highest number ever recorded. This includes refugees, asylum seekers, and internally displaced persons. Wars in Syria, Ukraine, Sudan, and other conflicts drive these numbers.",
    target: { lat: 20.0, lng: 30.0, altitude: 3.0 },
    globeLayer: {
      type: "arcs",
      data: [
        { startLat: 35.0, startLng: 38.0, endLat: 41.0, endLng: 29.0 },
        { startLat: 35.0, startLng: 38.0, endLat: 33.9, endLng: 35.5 },
        { startLat: 35.0, startLng: 38.0, endLat: 32.0, endLng: 36.0 },
        { startLat: 48.38, startLng: 31.17, endLat: 52.23, endLng: 21.01 },
      ],
      arcColor: "#ff4444",
    },
    difficulty: "medium",
    icon: "🏚️",
  },
  {
    id: "gp-02",
    category: "Geopolitics",
    question: "Which ongoing conflict has displaced the most people?",
    options: ["Ukraine", "Syria", "Yemen", "Somalia"],
    correctIndex: 1,
    explanation:
      "The Syrian Civil War (since 2011) has displaced over 14 million people — more than half the country's pre-war population. About 6.8 million are refugees in other countries (mainly Turkey, Lebanon, and Jordan) and 7.2 million are displaced within Syria.",
    target: { lat: 35.0, lng: 38.0, altitude: 1.5 },
    globeLayer: {
      type: "arcs",
      data: [
        { startLat: 35, startLng: 38, endLat: 39.93, endLng: 32.86 },
        { startLat: 35, startLng: 38, endLat: 33.89, endLng: 35.5 },
        { startLat: 35, startLng: 38, endLat: 31.95, endLng: 35.93 },
        { startLat: 35, startLng: 38, endLat: 52.52, endLng: 13.4 },
      ],
      arcColor: "#ff6644",
    },
    difficulty: "medium",
    icon: "🕊️",
  },
  {
    id: "gp-03",
    category: "Geopolitics",
    question: "Where is the largest refugee camp in the world?",
    options: [
      "Zaatari, Jordan",
      "Cox's Bazar (Kutupalong), Bangladesh",
      "Dadaab, Kenya",
      "Azraq, Jordan",
    ],
    correctIndex: 1,
    explanation:
      "The Kutupalong refugee camp in Cox's Bazar, Bangladesh, is the world's largest, housing over 900,000 Rohingya refugees who fled violence in Myanmar. The camp sprawls across 26 square kilometers. Living conditions are extremely challenging with monsoon flooding a constant threat.",
    target: { lat: 21.18, lng: 92.15, altitude: 1.2 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 21.18, lng: 92.15, label: "Cox's Bazar" },
        { lat: 23.81, lng: 90.41, label: "Dhaka" },
        { lat: 21.17, lng: 96.17, label: "Myanmar" },
      ],
      pointColor: "#ff4444",
      pointRadius: 0.7,
      pointAltitude: 0.05,
    },
    difficulty: "hard",
    icon: "🏕️",
  },
  {
    id: "gp-04",
    category: "Geopolitics",
    question: "Which UN agency handles refugees?",
    options: ["UNICEF", "WHO", "UNHCR", "UNESCO"],
    correctIndex: 2,
    explanation:
      "UNHCR (United Nations High Commissioner for Refugees) is the UN's refugee agency, established in 1950. It protects and assists over 117 million displaced people worldwide. The organization has won the Nobel Peace Prize twice (1954 and 1981).",
    target: { lat: 46.23, lng: 6.15, altitude: 1.0 },
    globeLayer: {
      type: "points",
      data: [{ lat: 46.23, lng: 6.15, label: "UNHCR HQ Geneva" }],
      pointColor: "#0072bc",
      pointRadius: 0.7,
      pointAltitude: 0.06,
    },
    difficulty: "easy",
    icon: "🇺🇳",
  },
  {
    id: "gp-05",
    category: "Geopolitics",
    question: "How many countries are members of the United Nations?",
    options: ["150", "175", "193", "210"],
    correctIndex: 2,
    explanation:
      "There are 193 member states in the United Nations. The most recent member is South Sudan, which joined in 2011. The Vatican City and Palestine have observer status but are not full members. The UN was founded in 1945 with just 51 original members.",
    target: { lat: 40.75, lng: -73.97, altitude: 1.0 },
    globeLayer: {
      type: "points",
      data: [{ lat: 40.75, lng: -73.97, label: "UN HQ New York" }],
      pointColor: "#0072bc",
      pointRadius: 0.7,
      pointAltitude: 0.06,
    },
    difficulty: "easy",
    icon: "🇺🇳",
  },
  {
    id: "gp-06",
    category: "Geopolitics",
    question: "Which country hosts the most refugees?",
    options: ["Germany", "Turkey", "Pakistan", "Uganda"],
    correctIndex: 1,
    explanation:
      "Turkey hosts more refugees than any other country, with about 3.6 million — the vast majority being Syrians. Turkey's geographic position bordering Syria made it the primary destination. Iran, Colombia, Germany, and Pakistan also host millions of refugees.",
    target: { lat: 39.93, lng: 32.86, altitude: 1.5 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 39.93, lng: 32.86, label: "Ankara" },
        { lat: 37.0, lng: 35.32, label: "Adana" },
        { lat: 37.07, lng: 37.38, label: "Gaziantep" },
        { lat: 41.01, lng: 28.98, label: "Istanbul" },
      ],
      pointColor: "#ff6644",
      pointRadius: 0.5,
      pointAltitude: 0.04,
    },
    difficulty: "medium",
    icon: "🏚️",
  },
  {
    id: "gp-07",
    category: "Geopolitics",
    question: "Where is the International Court of Justice?",
    options: ["New York, USA", "The Hague, Netherlands", "Geneva, Switzerland", "Brussels, Belgium"],
    correctIndex: 1,
    explanation:
      "The International Court of Justice (ICJ) is in The Hague, Netherlands, housed in the Peace Palace since 1946. It's the primary judicial branch of the United Nations and settles disputes between countries. The Hague is also home to the International Criminal Court (ICC).",
    target: { lat: 52.09, lng: 4.3, altitude: 1.0 },
    globeLayer: {
      type: "points",
      data: [{ lat: 52.09, lng: 4.3, label: "The Hague" }],
      pointColor: "#0072bc",
      pointRadius: 0.7,
      pointAltitude: 0.06,
    },
    difficulty: "medium",
    icon: "⚖️",
  },
  {
    id: "gp-08",
    category: "Geopolitics",
    question: "Which strait is one of the busiest shipping lanes, connecting the Pacific and Indian Oceans?",
    options: [
      "Strait of Gibraltar",
      "Strait of Hormuz",
      "Strait of Malacca",
      "Suez Canal",
    ],
    correctIndex: 2,
    explanation:
      "The Strait of Malacca, between Malaysia and Indonesia, is one of the world's busiest shipping lanes. About 25% of all traded goods pass through it, including much of East Asia's oil supply from the Middle East. Over 100,000 ships transit the strait annually.",
    target: { lat: 2.5, lng: 101.5, altitude: 1.5 },
    globeLayer: {
      type: "arcs",
      data: [
        { startLat: -1.0, startLng: 104.0, endLat: 6.0, endLng: 100.0 },
        { startLat: 6.0, startLng: 100.0, endLat: 22.3, endLng: 114.2 },
      ],
      arcColor: "#ffaa00",
    },
    difficulty: "medium",
    icon: "🚢",
  },
  {
    id: "gp-09",
    category: "Geopolitics",
    question: "What is the most spoken native language in the world?",
    options: ["English", "Mandarin Chinese", "Spanish", "Hindi"],
    correctIndex: 1,
    explanation:
      "Mandarin Chinese has the most native speakers at about 920 million. When including second-language speakers, English is the most widely spoken overall (about 1.5 billion). Spanish (475 million native speakers) and Hindi (345 million) round out the top four.",
    target: { lat: 39.9, lng: 116.4, altitude: 2.0 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 39.9, lng: 116.4, label: "China" },
        { lat: 19.43, lng: -99.13, label: "Spanish" },
        { lat: 28.61, lng: 77.21, label: "Hindi" },
        { lat: 51.51, lng: -0.13, label: "English" },
      ],
      pointColor: "#ff8844",
      pointRadius: 0.6,
      pointAltitude: 0.04,
    },
    difficulty: "easy",
    icon: "🗣️",
  },
  {
    id: "gp-10",
    category: "Geopolitics",
    question: "Which continent has the youngest population on average?",
    options: ["Asia", "South America", "Africa", "North America"],
    correctIndex: 2,
    explanation:
      "Africa has the youngest population of any continent, with a median age of about 19 years. In comparison, Europe's median age is about 43. By 2050, Africa is expected to have 2.5 billion people, making it the most populous continent after Asia.",
    target: { lat: 0.0, lng: 20.0, altitude: 3.0 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 9.06, lng: 7.49, label: "Nigeria" },
        { lat: -1.29, lng: 36.82, label: "Kenya" },
        { lat: -6.17, lng: 35.74, label: "Tanzania" },
        { lat: 0.35, lng: 32.62, label: "Uganda" },
        { lat: 14.72, lng: -17.47, label: "Senegal" },
      ],
      pointColor: "#ff8844",
      pointRadius: 0.5,
      pointAltitude: 0.04,
    },
    difficulty: "medium",
    icon: "👶",
  },

  // ──────────────────── WORLD GEOGRAPHY GENERAL (16) ────────────────────
  {
    id: "geo-01",
    category: "Geography",
    question: "What is the largest country by area?",
    options: ["Canada", "China", "Russia", "United States"],
    correctIndex: 2,
    explanation:
      "Russia is the world's largest country at 17.1 million square kilometers — nearly twice the size of Canada. It spans 11 time zones from Europe to the Pacific Ocean. Russia covers more than one-eighth of Earth's inhabited land area.",
    target: { lat: 61.52, lng: 105.32, altitude: 2.5 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 55.75, lng: 37.62, label: "Moscow" },
        { lat: 59.93, lng: 30.32, label: "St. Petersburg" },
        { lat: 56.84, lng: 60.6, label: "Yekaterinburg" },
        { lat: 55.03, lng: 82.92, label: "Novosibirsk" },
        { lat: 43.12, lng: 131.87, label: "Vladivostok" },
      ],
      pointColor: "#ff4444",
      pointRadius: 0.5,
      pointAltitude: 0.04,
    },
    difficulty: "easy",
    icon: "🌍",
  },
  {
    id: "geo-02",
    category: "Geography",
    question: "Which continent has the most countries?",
    options: ["Asia (48)", "Europe (44)", "Africa (54)", "North America (23)"],
    correctIndex: 2,
    explanation:
      "Africa has 54 recognized countries — more than any other continent. Many of Africa's borders were drawn by European colonial powers in the 19th century during the 'Scramble for Africa,' often without regard for ethnic or cultural boundaries.",
    target: { lat: 5.0, lng: 20.0, altitude: 3.0 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 9.06, lng: 7.49, label: "Nigeria" },
        { lat: 30.04, lng: 31.24, label: "Egypt" },
        { lat: -26.2, lng: 28.05, label: "South Africa" },
        { lat: -1.29, lng: 36.82, label: "Kenya" },
        { lat: 33.89, lng: 9.54, label: "Tunisia" },
        { lat: 5.56, lng: -0.2, label: "Ghana" },
      ],
      pointColor: "#ff8844",
      pointRadius: 0.4,
      pointAltitude: 0.03,
    },
    difficulty: "easy",
    icon: "🌍",
  },
  {
    id: "geo-03",
    category: "Geography",
    question: "Where is the Prime Meridian (0 degrees longitude)?",
    options: ["Paris, France", "Washington, DC", "Greenwich, London", "Rome, Italy"],
    correctIndex: 2,
    explanation:
      "The Prime Meridian passes through the Royal Observatory in Greenwich, London. It was established in 1884 at an international conference. Everything east of it is East longitude, and everything west is West longitude. You can literally stand with one foot in each hemisphere!",
    target: { lat: 51.48, lng: -0.0, altitude: 0.8 },
    globeLayer: {
      type: "points",
      data: [{ lat: 51.48, lng: -0.0, label: "Greenwich Observatory" }],
      pointColor: "#ffcc00",
      pointRadius: 0.7,
      pointAltitude: 0.06,
    },
    difficulty: "easy",
    icon: "🧭",
  },
  {
    id: "geo-04",
    category: "Geography",
    question: "What is the highest point on Earth?",
    options: [
      "K2, Pakistan/China",
      "Mount Kilimanjaro, Tanzania",
      "Mount Everest, Nepal/Tibet",
      "Denali, Alaska",
    ],
    correctIndex: 2,
    explanation:
      "Mount Everest stands at 8,849 meters (29,032 feet) above sea level on the border of Nepal and Tibet (China). It was first summited by Edmund Hillary and Tenzing Norgay in 1953. Fun fact: measured from base to peak, Hawaii's Mauna Kea is actually taller!",
    target: { lat: 27.99, lng: 86.93, altitude: 1.0 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 27.99, lng: 86.93, label: "Everest 8849m" },
        { lat: 35.88, lng: 76.51, label: "K2 8611m" },
        { lat: 27.7, lng: 88.15, label: "Kangchenjunga 8586m" },
      ],
      pointColor: "#ffffff",
      pointRadius: 0.7,
      pointAltitude: 0.08,
    },
    difficulty: "easy",
    icon: "🏔️",
  },
  {
    id: "geo-05",
    category: "Geography",
    question: "What is the longest river in the world?",
    options: ["Amazon River", "Nile River", "Mississippi River", "Yangtze River"],
    correctIndex: 1,
    explanation:
      "The Nile River in Africa is traditionally considered the longest river at about 6,650 km, flowing through 11 countries from Burundi to Egypt. However, some scientists argue the Amazon (6,400 km) might be longer depending on how the source is measured. The debate continues!",
    target: { lat: 22.0, lng: 31.0, altitude: 2.5 },
    globeLayer: {
      type: "arcs",
      data: [
        { startLat: -2.5, startLng: 29.5, endLat: 15.6, endLng: 32.53 },
        { startLat: 15.6, startLng: 32.53, endLat: 31.2, endLng: 29.92 },
      ],
      arcColor: "#4488ff",
    },
    difficulty: "easy",
    icon: "🏞️",
  },
  {
    id: "geo-06",
    category: "Geography",
    question: "Which is the smallest country in the world?",
    options: ["Monaco", "Vatican City", "San Marino", "Liechtenstein"],
    correctIndex: 1,
    explanation:
      "Vatican City is the smallest country in the world at just 0.44 square kilometers (110 acres) — about the size of a golf course. It's an independent city-state within Rome, Italy, home to the Pope and about 800 residents. It has its own postal service, radio station, and even a tiny railway station!",
    target: { lat: 41.9, lng: 12.45, altitude: 0.6 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 41.9, lng: 12.45, label: "Vatican City" },
        { lat: 43.73, lng: 7.42, label: "Monaco" },
        { lat: 43.94, lng: 12.46, label: "San Marino" },
      ],
      pointColor: "#ffcc00",
      pointRadius: 0.5,
      pointAltitude: 0.05,
    },
    difficulty: "easy",
    icon: "🏰",
  },
  {
    id: "geo-07",
    category: "Geography",
    question: "Which is the most populated city in the world?",
    options: ["Shanghai, China", "Tokyo, Japan", "Delhi, India", "São Paulo, Brazil"],
    correctIndex: 1,
    explanation:
      "The Tokyo metropolitan area has the world's largest population at about 37 million people. The Greater Tokyo Area is so large that it includes surrounding prefectures. Despite being the world's most populated metro area, Tokyo is known for its cleanliness and efficient public transit.",
    target: { lat: 35.68, lng: 139.69, altitude: 1.2 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 35.68, lng: 139.69, label: "Tokyo 37M" },
        { lat: 28.61, lng: 77.21, label: "Delhi 32M" },
        { lat: 31.23, lng: 121.47, label: "Shanghai 29M" },
        { lat: -23.55, lng: -46.63, label: "Sao Paulo 22M" },
      ],
      pointColor: "#ff6644",
      pointRadius: 0.6,
      pointAltitude: 0.05,
    },
    difficulty: "easy",
    icon: "🏙️",
  },
  {
    id: "geo-08",
    category: "Geography",
    question: "What is the driest inhabited place on Earth?",
    options: [
      "Death Valley, USA",
      "Atacama Desert, Chile",
      "Sahara Desert, Africa",
      "Gobi Desert, Mongolia",
    ],
    correctIndex: 1,
    explanation:
      "The Atacama Desert in Chile is the driest place on Earth. Some weather stations have NEVER recorded rain. Parts are so dry that NASA uses them as a stand-in for Mars to test rover instruments. Despite the extreme aridity, about 1 million people live in the Atacama region.",
    target: { lat: -23.86, lng: -69.13, altitude: 1.5 },
    globeLayer: {
      type: "points",
      data: [{ lat: -23.86, lng: -69.13, label: "Atacama" }],
      pointColor: "#ddaa44",
      pointRadius: 0.8,
      pointAltitude: 0.04,
    },
    difficulty: "medium",
    icon: "🏜️",
  },
  {
    id: "geo-09",
    category: "Geography",
    question: "How many continents are there?",
    options: ["5", "6", "7", "8"],
    correctIndex: 2,
    explanation:
      "There are 7 continents: Africa, Antarctica, Asia, Australia/Oceania, Europe, North America, and South America. Asia is the largest by both area and population. Antarctica is the only continent with no permanent human residents — just research stations.",
    target: { lat: 20.0, lng: 0.0, altitude: 3.5 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 34, lng: 100, label: "Asia" },
        { lat: 10, lng: 25, label: "Africa" },
        { lat: 50, lng: 10, label: "Europe" },
        { lat: 40, lng: -100, label: "N. America" },
        { lat: -15, lng: -60, label: "S. America" },
        { lat: -25, lng: 135, label: "Australia" },
        { lat: -80, lng: 0, label: "Antarctica" },
      ],
      pointColor: "#44cc88",
      pointRadius: 0.6,
      pointAltitude: 0.03,
    },
    difficulty: "easy",
    icon: "🌍",
  },
  {
    id: "geo-10",
    category: "Geography",
    question: "What is the largest island in the world?",
    options: ["Madagascar", "Borneo", "Greenland", "New Guinea"],
    correctIndex: 2,
    explanation:
      "Greenland is the world's largest island at 2.17 million square kilometers. Despite its icy name (a marketing trick by Viking Erik the Red!), the ice sheet covers about 80% of the island. It's an autonomous territory of Denmark with a population of only about 56,000.",
    target: { lat: 72.0, lng: -40.0, altitude: 2.0 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 72, lng: -40, label: "Greenland" },
        { lat: 64.17, lng: -51.74, label: "Nuuk" },
      ],
      pointColor: "#88ccff",
      pointRadius: 0.8,
      pointAltitude: 0.04,
    },
    difficulty: "medium",
    icon: "🏝️",
  },
  {
    id: "geo-11",
    category: "Geography",
    question: "Which country spans the most time zones?",
    options: ["Russia (11)", "United States (6)", "China (1 official)", "France (12)"],
    correctIndex: 3,
    explanation:
      "France spans 12 time zones — the most of any country! This is because France has overseas territories around the world: French Guiana, Guadeloupe, Martinique, Reunion, Mayotte, New Caledonia, Tahiti, and more. Russia has 11 time zones within its mainland.",
    target: { lat: 46.6, lng: 2.0, altitude: 1.5 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 48.86, lng: 2.35, label: "Paris" },
        { lat: 4.94, lng: -52.33, label: "Fr. Guiana" },
        { lat: -21.11, lng: 55.53, label: "Reunion" },
        { lat: -22.28, lng: 166.46, label: "New Caledonia" },
        { lat: -17.53, lng: -149.57, label: "Tahiti" },
      ],
      pointColor: "#3344ff",
      pointRadius: 0.5,
      pointAltitude: 0.05,
    },
    difficulty: "hard",
    icon: "🕐",
  },
  {
    id: "geo-12",
    category: "Geography",
    question: "What is the most visited country in the world?",
    options: ["United States", "Spain", "France", "Italy"],
    correctIndex: 2,
    explanation:
      "France is the most visited country in the world, welcoming about 90 million international tourists per year. Paris alone attracts over 30 million visitors. The Eiffel Tower, Louvre Museum, French Riviera, and world-famous cuisine are major draws.",
    target: { lat: 48.86, lng: 2.35, altitude: 1.0 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 48.86, lng: 2.35, label: "Paris 30M/yr" },
        { lat: 43.7, lng: 7.27, label: "Nice" },
        { lat: 43.3, lng: 5.37, label: "Marseille" },
      ],
      pointColor: "#3344ff",
      pointRadius: 0.5,
      pointAltitude: 0.04,
    },
    difficulty: "medium",
    icon: "🗼",
  },
  {
    id: "geo-13",
    category: "Geography",
    question: "Where are the Galápagos Islands?",
    options: ["Near Australia", "In the Caribbean", "Off the coast of Ecuador", "Near Madagascar"],
    correctIndex: 2,
    explanation:
      "The Galápagos Islands are about 1,000 km off the coast of Ecuador in the Pacific Ocean. Charles Darwin's visit in 1835 inspired his theory of evolution. The islands are home to unique species found nowhere else, like giant tortoises, marine iguanas, and blue-footed boobies.",
    target: { lat: -0.75, lng: -90.5, altitude: 1.2 },
    globeLayer: {
      type: "points",
      data: [
        { lat: -0.75, lng: -90.5, label: "Galapagos" },
        { lat: -0.18, lng: -78.47, label: "Quito, Ecuador" },
      ],
      pointColor: "#22aa44",
      pointRadius: 0.6,
      pointAltitude: 0.04,
    },
    difficulty: "easy",
    icon: "🐢",
  },
  {
    id: "geo-14",
    category: "Geography",
    question: "What is the largest freshwater lake by surface area?",
    options: ["Lake Victoria", "Lake Superior", "Caspian Sea", "Lake Baikal"],
    correctIndex: 1,
    explanation:
      "Lake Superior is the largest freshwater lake by surface area at 82,100 square kilometers, shared between the US and Canada. The Caspian Sea is larger but is technically a saltwater lake. Lake Superior contains 10% of all the world's fresh surface water.",
    target: { lat: 47.5, lng: -88.0, altitude: 1.2 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 47.5, lng: -88.0, label: "Lake Superior" },
        { lat: -1.0, lng: 33.0, label: "Lake Victoria" },
        { lat: 53.5, lng: 108.0, label: "Lake Baikal" },
      ],
      pointColor: "#2288ff",
      pointRadius: 0.7,
      pointAltitude: 0.04,
    },
    difficulty: "medium",
    icon: "💧",
  },
  {
    id: "geo-15",
    category: "Geography",
    question: "Which country has the most UNESCO World Heritage Sites?",
    options: ["China", "France", "Italy", "Spain"],
    correctIndex: 2,
    explanation:
      "Italy has the most UNESCO World Heritage Sites with 59, including the Colosseum, Pompeii, Venice, the Amalfi Coast, and Florence's historic center. China and Germany tie for second place. These sites are considered to have outstanding universal value to humanity.",
    target: { lat: 41.9, lng: 12.5, altitude: 1.5 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 41.9, lng: 12.5, label: "Rome" },
        { lat: 43.77, lng: 11.25, label: "Florence" },
        { lat: 45.44, lng: 12.32, label: "Venice" },
        { lat: 40.85, lng: 14.27, label: "Naples/Pompeii" },
        { lat: 40.63, lng: 14.6, label: "Amalfi Coast" },
      ],
      pointColor: "#ffcc00",
      pointRadius: 0.5,
      pointAltitude: 0.04,
    },
    difficulty: "hard",
    icon: "🏛️",
  },
  {
    id: "geo-16",
    category: "Geography",
    question: "What is the largest ocean on Earth?",
    options: ["Atlantic Ocean", "Indian Ocean", "Pacific Ocean", "Arctic Ocean"],
    correctIndex: 2,
    explanation:
      "The Pacific Ocean is by far the largest ocean, covering about 165 million square kilometers — more than all the land areas on Earth combined! At its widest point, it stretches over 19,000 km from Indonesia to Colombia. It was named by explorer Ferdinand Magellan in 1521.",
    target: { lat: 0, lng: -160, altitude: 3.5 },
    globeLayer: {
      type: "points",
      data: [
        { lat: 0, lng: -160, label: "Pacific center" },
        { lat: 21.3, lng: -157.8, label: "Hawaii" },
        { lat: -17.53, lng: -149.57, label: "Tahiti" },
      ],
      pointColor: "#2266cc",
      pointRadius: 0.8,
      pointAltitude: 0.02,
    },
    difficulty: "easy",
    icon: "🌊",
  },
]

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   All unique categories
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const ALL_CATEGORIES: Category[] = [
  "Natural Hazards",
  "Space",
  "Architecture",
  "Infrastructure",
  "Environment",
  "Technology",
  "Geopolitics",
  "Geography",
]

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Component
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export default function LearningPage() {
  /* ── State ─────────────────────────────────────────────────────── */
  const [activeCategory, setActiveCategory] = useState<Category | "All">("All")
  const [deck, setDeck] = useState<QuizCard[]>([])
  const [cardIndex, setCardIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [correct, setCorrect] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)
  const [score, setScore] = useState(0)
  const [attempted, setAttempted] = useState(0)
  const [shakeIdx, setShakeIdx] = useState<number | null>(null)
  const [confetti, setConfetti] = useState(false)
  const [mounted, setMounted] = useState(false)

  /* ── Refs ──────────────────────────────────────────────────────── */
  const globeRef = useRef<HTMLDivElement>(null)
  const globeInst = useRef<any>(null)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  /* ── Build deck when category changes ──────────────────────────── */
  const filteredQuestions = useMemo(() => {
    if (activeCategory === "All") return QUESTIONS
    return QUESTIONS.filter((q) => q.category === activeCategory)
  }, [activeCategory])

  useEffect(() => {
    const newDeck = shuffle(filteredQuestions)
    setDeck(newDeck)
    setCardIndex(0)
    setSelected(null)
    setCorrect(false)
    setShowExplanation(false)
  }, [filteredQuestions])

  /* ── Current card ──────────────────────────────────────────────── */
  const card = deck[cardIndex] as QuizCard | undefined

  /* ── Initialise globe.gl ───────────────────────────────────────── */
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !globeRef.current || globeInst.current) return

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
        .atmosphereColor("#33ccdd")
        .atmosphereAltitude(0.15)
        .pointOfView({ lat: 20, lng: 0, altitude: 2.5 })

      globe.controls().autoRotate = false
      globe.controls().enableDamping = true
      globe.controls().dampingFactor = 0.1

      globeInst.current = globe
    })

    return () => {
      globeInst.current?.controls()?.dispose?.()
      globeInst.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted])

  /* ── Resize handler ────────────────────────────────────────────── */
  useEffect(() => {
    function onResize() {
      if (globeInst.current && globeRef.current) {
        globeInst.current
          .width(globeRef.current.clientWidth)
          .height(globeRef.current.clientHeight)
      }
    }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  /* ── Update globe layers when card changes ─────────────────────── */
  useEffect(() => {
    const g = globeInst.current
    if (!g || !card) return

    const layer = card.globeLayer
    const catColor = CATEGORY_COLORS[card.category]

    g.atmosphereColor(catColor)

    // Clear all layers first
    g.pointsData([])
    g.arcsData([])

    if (layer.type === "points") {
      g.pointsData(layer.data)
        .pointLat("lat")
        .pointLng("lng")
        .pointColor(() => layer.pointColor ?? catColor)
        .pointRadius(layer.pointRadius ?? 0.5)
        .pointAltitude(layer.pointAltitude ?? 0.04)
        .pointLabel("label")
    } else if (layer.type === "arcs") {
      g.arcsData(layer.data)
        .arcStartLat("startLat")
        .arcStartLng("startLng")
        .arcEndLat("endLat")
        .arcEndLng("endLng")
        .arcColor(() => layer.arcColor ?? catColor)
        .arcStroke(1.5)
        .arcDashLength(0.6)
        .arcDashGap(0.3)
        .arcDashAnimateTime(2000)
    }

    // Reset view
    g.pointOfView({ lat: 20, lng: 0, altitude: 2.5 }, 800)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card?.id])

  /* ── Answer handler ────────────────────────────────────────────── */
  const handleAnswer = useCallback(
    (idx: number) => {
      if (!card || correct) return

      if (idx === card.correctIndex) {
        setSelected(idx)
        setCorrect(true)
        setShowExplanation(true)
        setScore((s) => s + 1)
        setAttempted((a) => a + 1)
        setConfetti(true)
        setTimeout(() => setConfetti(false), 2000)

        // Fly to target
        if (globeInst.current) {
          globeInst.current.pointOfView(card.target, 1500)
        }
      } else {
        setShakeIdx(idx)
        setTimeout(() => setShakeIdx(null), 500)
        if (selected === null) {
          setAttempted((a) => a + 1)
        }
      }
    },
    [card, correct, selected],
  )

  /* ── Navigation ────────────────────────────────────────────────── */
  const goTo = useCallback(
    (dir: "prev" | "next") => {
      if (!deck.length) return
      setSelected(null)
      setCorrect(false)
      setShowExplanation(false)
      if (dir === "next") {
        setCardIndex((i) => (i + 1 < deck.length ? i + 1 : 0))
      } else {
        setCardIndex((i) => (i - 1 >= 0 ? i - 1 : deck.length - 1))
      }
    },
    [deck.length],
  )

  /* ── Touch / swipe ─────────────────────────────────────────────── */
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }, [])
  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStart.current) return
      const dx = e.changedTouches[0].clientX - touchStart.current.x
      const dy = e.changedTouches[0].clientY - touchStart.current.y
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
        goTo(dx < 0 ? "next" : "prev")
      }
      touchStart.current = null
    },
    [goTo],
  )

  /* ── Keyboard nav ──────────────────────────────────────────────── */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") goTo("next")
      if (e.key === "ArrowLeft") goTo("prev")
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [goTo])

  /* ── Render ────────────────────────────────────────────────────── */
  if (!mounted) return null

  const catColor = card ? CATEGORY_COLORS[card.category] : "#33ccdd"
  const diffInfo = card ? DIFFICULTY_LABELS[card.difficulty] : DIFFICULTY_LABELS.easy

  return (
    <div
      style={{ background: "var(--bg)", minHeight: "100vh" }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Inline styles ────────────────────────────────────────── */}
      <style>{`
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
        @keyframes popIn { from{transform:scale(0.8);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes flyIn { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes confettiFall {
          0%{transform:translateY(-10px) rotate(0deg);opacity:1}
          100%{transform:translateY(120vh) rotate(720deg);opacity:0}
        }
        .shake-anim{animation:shake 0.4s ease}
        .pop-in{animation:popIn 0.35s ease}
        .fly-in{animation:flyIn 0.4s ease}
        .confetti-piece{position:fixed;top:-10px;width:8px;height:8px;border-radius:2px;animation:confettiFall 2.5s ease-out forwards;pointer-events:none;z-index:100}
      `}</style>

      {/* ── Confetti ─────────────────────────────────────────────── */}
      {confetti &&
        Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="confetti-piece"
            style={{
              left: `${Math.random() * 100}%`,
              background: ["#ff6b35", "#7c3aed", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#22c55e"][i % 8],
              animationDelay: `${Math.random() * 0.8}s`,
              animationDuration: `${1.8 + Math.random() * 1.5}s`,
            }}
          />
        ))}

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--text)" }}>
              GRIP3D Learning
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
              Interactive Geography Quiz on a 3D Globe
            </p>
          </div>
          <div
            className="px-4 py-2 rounded-xl text-sm font-semibold"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
          >
            Score: {score} / {attempted}
          </div>
        </div>

        {/* ── Category filter ────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 mt-5">
          {(["All", ...ALL_CATEGORIES] as const).map((cat) => {
            const isActive = activeCategory === cat
            const chipColor = cat === "All" ? "#33ccdd" : CATEGORY_COLORS[cat as Category]
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat as Category | "All")}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-150"
                style={{
                  background: isActive ? chipColor : "var(--surface)",
                  color: isActive ? "#000" : "var(--muted)",
                  border: isActive ? `1px solid ${chipColor}` : "1px solid var(--border)",
                }}
              >
                {cat}
              </button>
            )
          })}
        </div>
        <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
          {deck.length} question{deck.length !== 1 ? "s" : ""} in deck
        </p>
      </div>

      {/* ── Card ─────────────────────────────────────────────────── */}
      {card && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-12">
          <div
            className="rounded-2xl overflow-hidden pop-in"
            style={{
              background: "var(--surface)",
              border: `1px solid ${catColor}33`,
              boxShadow: `0 0 40px ${catColor}15`,
            }}
          >
            {/* Category + difficulty badge */}
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{ borderBottom: `1px solid ${catColor}22` }}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{card.icon}</span>
                <span className="text-sm font-medium" style={{ color: catColor }}>
                  {card.category}
                </span>
              </div>
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                style={{
                  background: `${diffInfo.color}22`,
                  color: diffInfo.color,
                  border: `1px solid ${diffInfo.color}44`,
                }}
              >
                {diffInfo.label}
              </span>
            </div>

            {/* Globe container */}
            <div
              ref={globeRef}
              style={{
                width: "100%",
                height: "min(55vw, 420px)",
                background: "#000",
                cursor: "grab",
              }}
            />

            {/* Question */}
            <div className="px-5 pt-5 pb-3">
              <p
                className="text-base sm:text-lg font-semibold fly-in"
                style={{ color: "var(--text)" }}
              >
                {card.question}
              </p>
            </div>

            {/* Answer buttons */}
            <div className="grid grid-cols-2 gap-3 px-5 pb-4">
              {card.options.map((opt, i) => {
                const isCorrectAnswer = i === card.correctIndex
                const isSelected = selected === i
                const isShaking = shakeIdx === i

                let bg = "var(--bg)"
                let borderColor = "var(--border)"
                let textColor = "var(--text)"

                if (correct && isCorrectAnswer) {
                  bg = "#22c55e22"
                  borderColor = "#22c55e"
                  textColor = "#22c55e"
                } else if (isShaking) {
                  bg = "#ef444422"
                  borderColor = "#ef4444"
                  textColor = "#ef4444"
                } else if (correct && isSelected && !isCorrectAnswer) {
                  bg = "#ef444422"
                  borderColor = "#ef4444"
                  textColor = "#ef4444"
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    disabled={correct}
                    className={`relative px-4 py-3 rounded-xl text-sm font-medium text-left transition-all duration-150 ${isShaking ? "shake-anim" : ""}`}
                    style={{
                      background: bg,
                      border: `1px solid ${borderColor}`,
                      color: textColor,
                      cursor: correct ? "default" : "pointer",
                      opacity: correct && !isCorrectAnswer ? 0.4 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!correct) {
                        e.currentTarget.style.borderColor = catColor
                        e.currentTarget.style.boxShadow = `0 0 12px ${catColor}33`
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!correct) {
                        e.currentTarget.style.borderColor = "var(--border)"
                        e.currentTarget.style.boxShadow = "none"
                      }
                    }}
                  >
                    <span style={{ color: "var(--muted)", marginRight: 6 }}>
                      {String.fromCharCode(65 + i)}.
                    </span>
                    {opt}
                    {correct && isCorrectAnswer && (
                      <span className="absolute top-2 right-3 text-lg">
                        ✓
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Explanation */}
            {showExplanation && (
              <div
                className="mx-5 mb-5 p-4 rounded-xl fly-in"
                style={{
                  background: "var(--bg)",
                  borderLeft: `3px solid ${catColor}`,
                }}
              >
                <p className="text-xs font-semibold mb-1" style={{ color: catColor }}>
                  Did you know?
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                  {card.explanation}
                </p>
              </div>
            )}

            {/* Navigation */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <button
                onClick={() => goTo("prev")}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150"
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  color: "var(--muted)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--text)"
                  e.currentTarget.style.color = "var(--text)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)"
                  e.currentTarget.style.color = "var(--muted)"
                }}
              >
                &#9664; Prev
              </button>

              <span className="text-xs" style={{ color: "var(--muted)" }}>
                Card {cardIndex + 1} of {deck.length}
              </span>

              <button
                onClick={() => goTo("next")}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150"
                style={{
                  background: correct ? catColor : "var(--bg)",
                  border: correct ? `1px solid ${catColor}` : "1px solid var(--border)",
                  color: correct ? "#000" : "var(--muted)",
                }}
                onMouseEnter={(e) => {
                  if (!correct) {
                    e.currentTarget.style.borderColor = "var(--text)"
                    e.currentTarget.style.color = "var(--text)"
                  }
                }}
                onMouseLeave={(e) => {
                  if (!correct) {
                    e.currentTarget.style.borderColor = "var(--border)"
                    e.currentTarget.style.color = "var(--muted)"
                  }
                }}
              >
                Next &#9654;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────────────── */}
      {!card && deck.length === 0 && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
          <span className="text-5xl">🌍</span>
          <p className="text-lg font-semibold mt-4" style={{ color: "var(--text)" }}>
            No questions found
          </p>
          <p className="text-sm mt-2" style={{ color: "var(--muted)" }}>
            Try a different category filter.
          </p>
        </div>
      )}
    </div>
  )
}

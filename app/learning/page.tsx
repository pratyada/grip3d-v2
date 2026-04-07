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

type AgeGroup = "kindergarten" | "elementary" | "secondary" | "university" | "adult"

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
  ageGroup: AgeGroup
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Age Groups
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const AGE_GROUPS: { key: AgeGroup; emoji: string; label: string; subtitle: string; ages: string; color: string; bgGradient: string }[] = [
  { key: "kindergarten", emoji: "\u{1F9D2}", label: "Little Explorers", subtitle: "Fun picture cards!", ages: "Ages 4-6", color: "#ff6b9d", bgGradient: "linear-gradient(135deg, #ff6b9d22, #c084fc22)" },
  { key: "elementary", emoji: "\u{1F31F}", label: "Young Learners", subtitle: "Discover the world!", ages: "Ages 7-11", color: "#fbbf24", bgGradient: "linear-gradient(135deg, #fbbf2422, #34d39922)" },
  { key: "secondary", emoji: "\u{1F52D}", label: "World Explorers", subtitle: "Deeper knowledge", ages: "Ages 12-17", color: "#60a5fa", bgGradient: "linear-gradient(135deg, #60a5fa22, #818cf822)" },
  { key: "university", emoji: "\u{1F393}", label: "Advanced Study", subtitle: "Expert-level challenges", ages: "Ages 18-25", color: "#a78bfa", bgGradient: "linear-gradient(135deg, #a78bfa22, #6366f122)" },
  { key: "adult", emoji: "\u{1F30D}", label: "Curious Minds", subtitle: "Learn something new!", ages: "Adults 25+", color: "#34d399", bgGradient: "linear-gradient(135deg, #34d39922, #06b6d422)" },
]

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
   Question Bank — Kindergarten (22 questions)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const KINDERGARTEN_QUESTIONS: QuizCard[] = [
  {
    id: "kg-01", category: "Geography", ageGroup: "kindergarten", difficulty: "easy", icon: "\u{1F30A}",
    question: "What is this blue part of the globe? \u{1F30A}",
    options: ["Ocean \u{1F30A}", "Sky \u2601\uFE0F", "Lake \u{1F3DE}\uFE0F", "River \u{1F3DE}\uFE0F"],
    correctIndex: 0,
    explanation: "The blue parts on a globe are the oceans! They cover most of our planet.",
    target: { lat: 0, lng: -160, altitude: 1.5 },
    globeLayer: { type: "points", data: [{ lat: 0, lng: -160, label: "Pacific Ocean" }], pointColor: "#2288ff", pointRadius: 1.2, pointAltitude: 0.02 },
  },
  {
    id: "kg-02", category: "Geography", ageGroup: "kindergarten", difficulty: "easy", icon: "\u{1F43B}\u200D\u2744\uFE0F",
    question: "Where do polar bears live? \u{1F43B}\u200D\u2744\uFE0F",
    options: ["North Pole \u2744\uFE0F", "Desert \u{1F3DC}\uFE0F", "Jungle \u{1F334}", "Beach \u{1F3D6}\uFE0F"],
    correctIndex: 0,
    explanation: "Polar bears live near the North Pole where it is very cold and icy!",
    target: { lat: 80, lng: 0, altitude: 1.5 },
    globeLayer: { type: "points", data: [{ lat: 80, lng: 0, label: "North Pole" }], pointColor: "#88ccff", pointRadius: 1.2, pointAltitude: 0.03 },
  },
  {
    id: "kg-03", category: "Natural Hazards", ageGroup: "kindergarten", difficulty: "easy", icon: "\u{1F30B}",
    question: "What color is a volcano when it erupts? \u{1F30B}",
    options: ["Red & Orange \u{1F534}", "Blue \u{1F535}", "Green \u{1F7E2}", "Purple \u{1F7E3}"],
    correctIndex: 0,
    explanation: "Hot lava from a volcano is red and orange because it is super hot melted rock!",
    target: { lat: -8.34, lng: 115.51, altitude: 1.5 },
    globeLayer: { type: "points", data: [{ lat: -8.34, lng: 115.51, label: "Volcano" }], pointColor: "#ff4400", pointRadius: 1.2, pointAltitude: 0.06 },
  },
  {
    id: "kg-04", category: "Geography", ageGroup: "kindergarten", difficulty: "easy", icon: "\u{1F427}",
    question: "Where do penguins live? \u{1F427}",
    options: ["Antarctica \u2744\uFE0F", "Forest \u{1F332}", "Desert \u{1F3DC}\uFE0F", "City \u{1F3D9}\uFE0F"],
    correctIndex: 0,
    explanation: "Penguins live in Antarctica, the coldest place on Earth at the South Pole!",
    target: { lat: -82, lng: 0, altitude: 1.5 },
    globeLayer: { type: "points", data: [{ lat: -82, lng: 0, label: "Antarctica" }], pointColor: "#ffffff", pointRadius: 1.2, pointAltitude: 0.03 },
  },
  {
    id: "kg-05", category: "Geography", ageGroup: "kindergarten", difficulty: "easy", icon: "\u{1F30D}",
    question: "What shape is our planet Earth? \u{1F30D}",
    options: ["Round like a ball \u{26BD}", "Flat like a pancake \u{1F95E}", "Square like a box \u{1F4E6}", "Triangle \u{1F53A}"],
    correctIndex: 0,
    explanation: "Earth is round like a big ball! We call it a sphere.",
    target: { lat: 20, lng: 0, altitude: 2.5 },
    globeLayer: { type: "points", data: [{ lat: 20, lng: 0, label: "Earth" }], pointColor: "#44cc88", pointRadius: 1.0, pointAltitude: 0.02 },
  },
  {
    id: "kg-06", category: "Environment", ageGroup: "kindergarten", difficulty: "easy", icon: "\u{1F333}",
    question: "What is the biggest forest in the world? \u{1F333}",
    options: ["Amazon Rainforest \u{1F334}", "City Park \u{1F3DE}\uFE0F", "Backyard Garden \u{1F33B}", "Small Woods \u{1F332}"],
    correctIndex: 0,
    explanation: "The Amazon Rainforest in South America is the biggest forest! It has SO many animals!",
    target: { lat: -3, lng: -60, altitude: 1.5 },
    globeLayer: { type: "points", data: [{ lat: -3, lng: -60, label: "Amazon" }], pointColor: "#22aa44", pointRadius: 1.2, pointAltitude: 0.03 },
  },
  {
    id: "kg-07", category: "Space", ageGroup: "kindergarten", difficulty: "easy", icon: "\u{1F680}",
    question: "What do rockets fly to? \u{1F680}",
    options: ["Space \u{1F31F}", "Underground \u{1F573}\uFE0F", "Under the sea \u{1F30A}", "Into a mountain \u{1F3D4}\uFE0F"],
    correctIndex: 0,
    explanation: "Rockets fly up, up, up into outer space where the stars are!",
    target: { lat: 28.57, lng: -80.65, altitude: 1.5 },
    globeLayer: { type: "points", data: [{ lat: 28.57, lng: -80.65, label: "Rocket Launch" }], pointColor: "#bb88ff", pointRadius: 1.2, pointAltitude: 0.1 },
  },
  {
    id: "kg-08", category: "Geography", ageGroup: "kindergarten", difficulty: "easy", icon: "\u{1F3DC}\uFE0F",
    question: "What is a desert? \u{1F3DC}\uFE0F",
    options: ["A very dry place \u2600\uFE0F", "A rainy place \u{1F327}\uFE0F", "A snowy mountain \u{1F3D4}\uFE0F", "A deep ocean \u{1F30A}"],
    correctIndex: 0,
    explanation: "A desert is a very dry, hot place with lots of sand and very little rain!",
    target: { lat: 23, lng: 12, altitude: 1.5 },
    globeLayer: { type: "points", data: [{ lat: 23, lng: 12, label: "Sahara Desert" }], pointColor: "#ddaa44", pointRadius: 1.2, pointAltitude: 0.03 },
  },
  {
    id: "kg-09", category: "Natural Hazards", ageGroup: "kindergarten", difficulty: "easy", icon: "\u{1F32A}\uFE0F",
    question: "What is a really big spinning wind called? \u{1F32A}\uFE0F",
    options: ["Tornado \u{1F32A}\uFE0F", "Rainbow \u{1F308}", "Snowflake \u2744\uFE0F", "Sunshine \u2600\uFE0F"],
    correctIndex: 0,
    explanation: "A tornado is a big spinning tube of wind. Stay safe indoors!",
    target: { lat: 35.5, lng: -98, altitude: 1.5 },
    globeLayer: { type: "points", data: [{ lat: 35.5, lng: -98, label: "Tornado Alley" }], pointColor: "#888888", pointRadius: 1.2, pointAltitude: 0.04 },
  },
  {
    id: "kg-10", category: "Space", ageGroup: "kindergarten", difficulty: "easy", icon: "\u{1F319}",
    question: "What shines at night in the sky? \u{1F319}",
    options: ["The Moon \u{1F319}", "The Sun \u2600\uFE0F", "A Cloud \u2601\uFE0F", "A Rainbow \u{1F308}"],
    correctIndex: 0,
    explanation: "The Moon shines at night! It reflects light from the Sun.",
    target: { lat: 20, lng: 0, altitude: 2.5 },
    globeLayer: { type: "points", data: [{ lat: 20, lng: 0, label: "Night Sky" }], pointColor: "#ffcc00", pointRadius: 1.0, pointAltitude: 0.15 },
  },
  {
    id: "kg-11", category: "Geography", ageGroup: "kindergarten", difficulty: "easy", icon: "\u{1F418}",
    question: "Where do elephants live in the wild? \u{1F418}",
    options: ["Africa \u{1F30D}", "North Pole \u2744\uFE0F", "Under the sea \u{1F30A}", "On the moon \u{1F319}"],
    correctIndex: 0,
    explanation: "Elephants live in Africa and Asia! African elephants are the biggest land animals.",
    target: { lat: -2, lng: 34, altitude: 1.5 },
    globeLayer: { type: "points", data: [{ lat: -2, lng: 34, label: "Africa" }], pointColor: "#ff8844", pointRadius: 1.2, pointAltitude: 0.03 },
  },
  {
    id: "kg-12", category: "Environment", ageGroup: "kindergarten", difficulty: "easy", icon: "\u{1F40B}",
    question: "What is the biggest animal in the ocean? \u{1F40B}",
    options: ["Blue Whale \u{1F40B}", "Goldfish \u{1F41F}", "Crab \u{1F980}", "Starfish \u2B50"],
    correctIndex: 0,
    explanation: "The blue whale is the biggest animal EVER! Even bigger than dinosaurs!",
    target: { lat: -10, lng: 70, altitude: 1.5 },
    globeLayer: { type: "points", data: [{ lat: -10, lng: 70, label: "Ocean" }], pointColor: "#2266cc", pointRadius: 1.2, pointAltitude: 0.02 },
  },
  {
    id: "kg-13", category: "Architecture", ageGroup: "kindergarten", difficulty: "easy", icon: "\u{1F3F0}",
    question: "What is a very tall building called? \u{1F3F0}",
    options: ["Skyscraper \u{1F3D9}\uFE0F", "Igloo \u{1F3E0}", "Tent \u26FA", "Cave \u{1F573}\uFE0F"],
    correctIndex: 0,
    explanation: "Skyscrapers are super tall buildings that touch the clouds! The tallest is in Dubai.",
    target: { lat: 25.2, lng: 55.27, altitude: 1.5 },
    globeLayer: { type: "points", data: [{ lat: 25.2, lng: 55.27, label: "Tall Building" }], pointColor: "#f5a623", pointRadius: 1.2, pointAltitude: 0.08 },
  },
  {
    id: "kg-14", category: "Infrastructure", ageGroup: "kindergarten", difficulty: "easy", icon: "\u{1F682}",
    question: "What goes very fast on train tracks? \u{1F682}",
    options: ["A train \u{1F682}", "A boat \u26F5", "An airplane \u2708\uFE0F", "A bicycle \u{1F6B2}"],
    correctIndex: 0,
    explanation: "Trains zoom along on tracks! The fastest trains in Japan go super duper fast!",
    target: { lat: 35.68, lng: 139.69, altitude: 1.5 },
    globeLayer: { type: "points", data: [{ lat: 35.68, lng: 139.69, label: "Fast Train" }], pointColor: "#ffffff", pointRadius: 1.2, pointAltitude: 0.04 },
  },
  {
    id: "kg-15", category: "Natural Hazards", ageGroup: "kindergarten", difficulty: "easy", icon: "\u{1F30A}",
    question: "What is a really really big wave called? \u{1F30A}",
    options: ["Tsunami \u{1F30A}", "Puddle \u{1F4A7}", "Raindrop \u{1F327}\uFE0F", "Snowball \u26C4"],
    correctIndex: 0,
    explanation: "A tsunami is a giant wave made by earthquakes under the ocean. So powerful!",
    target: { lat: 35.68, lng: 139.69, altitude: 1.5 },
    globeLayer: { type: "points", data: [{ lat: 35.68, lng: 139.69, label: "Japan" }], pointColor: "#00aaff", pointRadius: 1.2, pointAltitude: 0.04 },
  },
  {
    id: "kg-16", category: "Geopolitics", ageGroup: "kindergarten", difficulty: "easy", icon: "\u{1F30D}",
    question: "How many big pieces of land (continents) are there? \u{1F30D}",
    options: ["7 \u{1F31F}", "2 \u270C\uFE0F", "100 \u{1F4AF}", "1 \u261D\uFE0F"],
    correctIndex: 0,
    explanation: "There are 7 continents: Africa, Antarctica, Asia, Australia, Europe, North America, and South America!",
    target: { lat: 20, lng: 0, altitude: 2.5 },
    globeLayer: { type: "points", data: [{ lat: 34, lng: 100, label: "Asia" }, { lat: 10, lng: 25, label: "Africa" }, { lat: 50, lng: 10, label: "Europe" }], pointColor: "#44cc88", pointRadius: 1.0, pointAltitude: 0.03 },
  },
  {
    id: "kg-17", category: "Technology", ageGroup: "kindergarten", difficulty: "easy", icon: "\u{1F6F0}\uFE0F",
    question: "What flies around Earth to give us internet? \u{1F6F0}\uFE0F",
    options: ["Satellites \u{1F6F0}\uFE0F", "Birds \u{1F426}", "Kites \u{1FA81}", "Balloons \u{1F388}"],
    correctIndex: 0,
    explanation: "Satellites zoom around Earth in space and help us use the internet and watch TV!",
    target: { lat: 0, lng: 0, altitude: 2.5 },
    globeLayer: { type: "points", data: [{ lat: 0, lng: 0, label: "Satellite" }], pointColor: "#bb88ff", pointRadius: 1.0, pointAltitude: 0.15 },
  },
  {
    id: "kg-18", category: "Geography", ageGroup: "kindergarten", difficulty: "easy", icon: "\u{1F3D4}\uFE0F",
    question: "What is the tallest mountain in the world? \u{1F3D4}\uFE0F",
    options: ["Mount Everest \u{1F3D4}\uFE0F", "A sand dune \u{1F3DC}\uFE0F", "A hill \u26F0\uFE0F", "A building \u{1F3E2}"],
    correctIndex: 0,
    explanation: "Mount Everest is the tallest mountain! It is so high it touches the clouds!",
    target: { lat: 27.99, lng: 86.93, altitude: 1.5 },
    globeLayer: { type: "points", data: [{ lat: 27.99, lng: 86.93, label: "Everest" }], pointColor: "#ffffff", pointRadius: 1.2, pointAltitude: 0.08 },
  },
  {
    id: "kg-19", category: "Environment", ageGroup: "kindergarten", difficulty: "easy", icon: "\u{1F422}",
    question: "Where do sea turtles swim? \u{1F422}",
    options: ["In the ocean \u{1F30A}", "In a bathtub \u{1F6C1}", "On a mountain \u{1F3D4}\uFE0F", "In the sky \u2601\uFE0F"],
    correctIndex: 0,
    explanation: "Sea turtles swim in warm oceans all around the world! They are great swimmers!",
    target: { lat: -18.29, lng: 147.7, altitude: 1.5 },
    globeLayer: { type: "points", data: [{ lat: -18.29, lng: 147.7, label: "Coral Reef" }], pointColor: "#22cc88", pointRadius: 1.2, pointAltitude: 0.03 },
  },
  {
    id: "kg-20", category: "Natural Hazards", ageGroup: "kindergarten", difficulty: "easy", icon: "\u{1F525}",
    question: "What do firefighters put out? \u{1F525}",
    options: ["Fires \u{1F525}", "Rain \u{1F327}\uFE0F", "Snow \u2744\uFE0F", "Wind \u{1F4A8}"],
    correctIndex: 0,
    explanation: "Firefighters are heroes who put out fires and keep us safe!",
    target: { lat: 36.78, lng: -119.42, altitude: 1.5 },
    globeLayer: { type: "points", data: [{ lat: 36.78, lng: -119.42, label: "California" }], pointColor: "#ff4500", pointRadius: 1.2, pointAltitude: 0.05 },
  },
  {
    id: "kg-21", category: "Space", ageGroup: "kindergarten", difficulty: "easy", icon: "\u2B50",
    question: "What is the Sun? \u2B50",
    options: ["A star \u2B50", "A planet \u{1F30D}", "A moon \u{1F319}", "A cloud \u2601\uFE0F"],
    correctIndex: 0,
    explanation: "The Sun is a giant star! It gives us light and warmth every day!",
    target: { lat: 0, lng: 0, altitude: 2.5 },
    globeLayer: { type: "points", data: [{ lat: 0, lng: 0, label: "Sun Light" }], pointColor: "#ffcc00", pointRadius: 1.2, pointAltitude: 0.1 },
  },
  {
    id: "kg-22", category: "Geography", ageGroup: "kindergarten", difficulty: "easy", icon: "\u{1F30B}",
    question: "What is an island? \u{1F3DD}\uFE0F",
    options: ["Land with water all around \u{1F3DD}\uFE0F", "A tall mountain \u{1F3D4}\uFE0F", "A big city \u{1F3D9}\uFE0F", "A deep cave \u{1F573}\uFE0F"],
    correctIndex: 0,
    explanation: "An island is a piece of land with water all around it! Hawaii is a famous island!",
    target: { lat: 21.3, lng: -157.8, altitude: 1.5 },
    globeLayer: { type: "points", data: [{ lat: 21.3, lng: -157.8, label: "Hawaii" }], pointColor: "#22aa44", pointRadius: 1.2, pointAltitude: 0.04 },
  },
]

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Question Bank — Elementary (22 questions)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const ELEMENTARY_QUESTIONS: QuizCard[] = [
  {
    id: "el-01", category: "Geography", ageGroup: "elementary", difficulty: "easy", icon: "\u{1F30D}",
    question: "Which country has the MOST people? \u{1F3E0}",
    options: ["China", "India", "USA", "Brazil"],
    correctIndex: 1,
    explanation: "India just passed China as the most populated country with over 1.4 billion people! That is a LOT of people.",
    target: { lat: 20.6, lng: 78.96, altitude: 2.0 },
    globeLayer: { type: "points", data: [{ lat: 20.6, lng: 78.96, label: "India" }, { lat: 35, lng: 105, label: "China" }], pointColor: "#ff8844", pointRadius: 0.8, pointAltitude: 0.04 },
  },
  {
    id: "el-02", category: "Architecture", ageGroup: "elementary", difficulty: "easy", icon: "\u{1F3D7}\uFE0F",
    question: "Where is the tallest building in the world? \u{1F3D7}\uFE0F",
    options: ["Dubai", "New York", "Shanghai", "Tokyo"],
    correctIndex: 0,
    explanation: "The Burj Khalifa in Dubai is 828 meters tall - that is taller than two Eiffel Towers stacked up!",
    target: { lat: 25.2, lng: 55.27, altitude: 1.0 },
    globeLayer: { type: "points", data: [{ lat: 25.2, lng: 55.27, label: "Burj Khalifa" }], pointColor: "#f5a623", pointRadius: 0.8, pointAltitude: 0.08 },
  },
  {
    id: "el-03", category: "Space", ageGroup: "elementary", difficulty: "easy", icon: "\u{1F6F0}\uFE0F",
    question: "What are Starlink satellites for? \u{1F6F0}\uFE0F",
    options: ["Internet from space!", "Taking photos", "Weather reports", "TV channels"],
    correctIndex: 0,
    explanation: "Starlink satellites give internet to people everywhere, even in the middle of nowhere!",
    target: { lat: 28.57, lng: -80.65, altitude: 2.0 },
    globeLayer: { type: "points", data: [{ lat: 28.57, lng: -80.65, label: "Cape Canaveral" }], pointColor: "#bb88ff", pointRadius: 0.8, pointAltitude: 0.04 },
  },
  {
    id: "el-04", category: "Natural Hazards", ageGroup: "elementary", difficulty: "easy", icon: "\u{1F525}",
    question: "Which US state has the most wildfires? \u{1F525}",
    options: ["Florida", "California", "Texas", "Colorado"],
    correctIndex: 1,
    explanation: "California has the most wildfires because it gets very dry and windy. Dry plants catch fire easily!",
    target: { lat: 36.78, lng: -119.42, altitude: 1.8 },
    globeLayer: { type: "points", data: [{ lat: 34.05, lng: -118.24, label: "Los Angeles" }, { lat: 37.77, lng: -122.42, label: "San Francisco" }], pointColor: "#ff4500", pointRadius: 0.7, pointAltitude: 0.05 },
  },
  {
    id: "el-05", category: "Natural Hazards", ageGroup: "elementary", difficulty: "easy", icon: "\u{1F30B}",
    question: "Which country has the most volcanoes? \u{1F30B}",
    options: ["Japan", "Indonesia", "Iceland", "Philippines"],
    correctIndex: 1,
    explanation: "Indonesia has about 130 active volcanoes! It sits on the Ring of Fire around the Pacific Ocean.",
    target: { lat: -2.5, lng: 118, altitude: 2.2 },
    globeLayer: { type: "points", data: [{ lat: -6.1, lng: 105.42, label: "Krakatoa" }, { lat: -7.54, lng: 110.45, label: "Merapi" }], pointColor: "#ff6600", pointRadius: 0.8, pointAltitude: 0.08 },
  },
  {
    id: "el-06", category: "Geography", ageGroup: "elementary", difficulty: "easy", icon: "\u{1F30D}",
    question: "What is the biggest country in the world? \u{1F30D}",
    options: ["Canada", "China", "Russia", "United States"],
    correctIndex: 2,
    explanation: "Russia is the biggest country! It covers 11 time zones from Europe all the way to the Pacific.",
    target: { lat: 61.52, lng: 105.32, altitude: 2.5 },
    globeLayer: { type: "points", data: [{ lat: 55.75, lng: 37.62, label: "Moscow" }, { lat: 43.12, lng: 131.87, label: "Vladivostok" }], pointColor: "#ff4444", pointRadius: 0.6, pointAltitude: 0.04 },
  },
  {
    id: "el-07", category: "Space", ageGroup: "elementary", difficulty: "easy", icon: "\u{1F680}",
    question: "Who was the first person to go to space? \u{1F680}",
    options: ["Neil Armstrong", "Yuri Gagarin", "Buzz Aldrin", "John Glenn"],
    correctIndex: 1,
    explanation: "Yuri Gagarin from Russia went to space in 1961! He said 'The Earth is blue... how wonderful.'",
    target: { lat: 55.75, lng: 37.62, altitude: 1.5 },
    globeLayer: { type: "points", data: [{ lat: 55.75, lng: 37.62, label: "Moscow" }, { lat: 45.96, lng: 63.31, label: "Baikonur" }], pointColor: "#ff4444", pointRadius: 0.7, pointAltitude: 0.05 },
  },
  {
    id: "el-08", category: "Environment", ageGroup: "elementary", difficulty: "easy", icon: "\u{1F5D1}\uFE0F",
    question: "Where is the Great Pacific Garbage Patch? \u{1F5D1}\uFE0F",
    options: ["Near Australia", "Between Hawaii and California", "Near Japan", "In the South Pacific"],
    correctIndex: 1,
    explanation: "A huge floating pile of plastic trash is stuck between Hawaii and California. We need to reduce plastic!",
    target: { lat: 30, lng: -140, altitude: 2.0 },
    globeLayer: { type: "points", data: [{ lat: 30, lng: -140, label: "Garbage Patch" }], pointColor: "#88cc44", pointRadius: 1.0, pointAltitude: 0.03 },
  },
  {
    id: "el-09", category: "Infrastructure", ageGroup: "elementary", difficulty: "easy", icon: "\u{1F684}",
    question: "Which country has the most fast trains? \u{1F684}",
    options: ["Japan", "France", "China", "Germany"],
    correctIndex: 2,
    explanation: "China has over 45,000 km of high-speed rail! That is more than the rest of the world combined!",
    target: { lat: 35, lng: 105, altitude: 2.5 },
    globeLayer: { type: "arcs", data: [{ startLat: 39.9, startLng: 116.4, endLat: 31.23, endLng: 121.47 }], arcColor: "#ff4444" },
  },
  {
    id: "el-10", category: "Geography", ageGroup: "elementary", difficulty: "easy", icon: "\u{1F3D4}\uFE0F",
    question: "What is the tallest mountain on Earth? \u{1F3D4}\uFE0F",
    options: ["K2", "Kilimanjaro", "Mount Everest", "Denali"],
    correctIndex: 2,
    explanation: "Mount Everest is 8,849 meters tall! It is on the border of Nepal and Tibet. People climb it every year!",
    target: { lat: 27.99, lng: 86.93, altitude: 1.0 },
    globeLayer: { type: "points", data: [{ lat: 27.99, lng: 86.93, label: "Everest" }], pointColor: "#ffffff", pointRadius: 0.8, pointAltitude: 0.08 },
  },
  {
    id: "el-11", category: "Geography", ageGroup: "elementary", difficulty: "medium", icon: "\u{1F30A}",
    question: "What percentage of Earth is covered by ocean? \u{1F30A}",
    options: ["51%", "61%", "71%", "81%"],
    correctIndex: 2,
    explanation: "About 71% of Earth is ocean! The Pacific Ocean alone is bigger than all the land put together.",
    target: { lat: 0, lng: -160, altitude: 3.0 },
    globeLayer: { type: "points", data: [{ lat: 0, lng: -160, label: "Pacific" }, { lat: 0, lng: -30, label: "Atlantic" }], pointColor: "#2288ff", pointRadius: 0.8, pointAltitude: 0.02 },
  },
  {
    id: "el-12", category: "Environment", ageGroup: "elementary", difficulty: "easy", icon: "\u{1F3DC}\uFE0F",
    question: "Where is the Sahara Desert? \u{1F3DC}\uFE0F",
    options: ["Southern Africa", "North Africa", "Middle East", "Central Asia"],
    correctIndex: 1,
    explanation: "The Sahara is in North Africa and it is almost as big as the entire United States!",
    target: { lat: 23, lng: 12, altitude: 2.5 },
    globeLayer: { type: "points", data: [{ lat: 23, lng: 12, label: "Sahara" }], pointColor: "#ddaa44", pointRadius: 0.8, pointAltitude: 0.03 },
  },
  {
    id: "el-13", category: "Geopolitics", ageGroup: "elementary", difficulty: "easy", icon: "\u{1F5E3}\uFE0F",
    question: "What language has the most native speakers? \u{1F5E3}\uFE0F",
    options: ["English", "Mandarin Chinese", "Spanish", "Hindi"],
    correctIndex: 1,
    explanation: "About 920 million people speak Mandarin Chinese as their first language! English has the most total speakers though.",
    target: { lat: 39.9, lng: 116.4, altitude: 2.0 },
    globeLayer: { type: "points", data: [{ lat: 39.9, lng: 116.4, label: "China" }], pointColor: "#ff8844", pointRadius: 0.7, pointAltitude: 0.04 },
  },
  {
    id: "el-14", category: "Space", ageGroup: "elementary", difficulty: "medium", icon: "\u{1F680}",
    question: "How long does the Space Station take to go around Earth? \u{1F680}",
    options: ["24 hours", "90 minutes", "8 hours", "1 week"],
    correctIndex: 1,
    explanation: "The ISS orbits Earth every 90 minutes! Astronauts see 16 sunrises every single day!",
    target: { lat: 28.57, lng: -80.65, altitude: 2.5 },
    globeLayer: { type: "arcs", data: [{ startLat: 51.6, startLng: 0, endLat: -51.6, endLng: 90 }], arcColor: "#ffcc00" },
  },
  {
    id: "el-15", category: "Natural Hazards", ageGroup: "elementary", difficulty: "easy", icon: "\u{1F30A}",
    question: "What causes a tsunami? \u{1F30A}",
    options: ["Strong winds", "Underwater earthquakes", "The Moon", "Climate change"],
    correctIndex: 1,
    explanation: "Tsunamis happen when earthquakes shake the ocean floor and push huge amounts of water!",
    target: { lat: 3.3, lng: 95.85, altitude: 2.0 },
    globeLayer: { type: "arcs", data: [{ startLat: 3.3, startLng: 95.85, endLat: 6.9, endLng: 79.9 }], arcColor: "#00aaff" },
  },
  {
    id: "el-16", category: "Architecture", ageGroup: "elementary", difficulty: "easy", icon: "\u{1F3DB}\uFE0F",
    question: "What ancient building was the tallest for 3,800 years? \u{1F3DB}\uFE0F",
    options: ["Colossus of Rhodes", "Great Pyramid of Giza", "Lighthouse of Alexandria", "Tower of Babel"],
    correctIndex: 1,
    explanation: "The Great Pyramid of Giza in Egypt was the tallest building for thousands of years! It is still standing today!",
    target: { lat: 29.98, lng: 31.13, altitude: 1.0 },
    globeLayer: { type: "points", data: [{ lat: 29.98, lng: 31.13, label: "Great Pyramid" }], pointColor: "#ddbb44", pointRadius: 0.8, pointAltitude: 0.06 },
  },
  {
    id: "el-17", category: "Geography", ageGroup: "elementary", difficulty: "easy", icon: "\u{1F3DD}\uFE0F",
    question: "What is the biggest island in the world? \u{1F3DD}\uFE0F",
    options: ["Madagascar", "Borneo", "Greenland", "New Guinea"],
    correctIndex: 2,
    explanation: "Greenland is the world's biggest island! It is covered in ice and belongs to Denmark.",
    target: { lat: 72, lng: -40, altitude: 2.0 },
    globeLayer: { type: "points", data: [{ lat: 72, lng: -40, label: "Greenland" }], pointColor: "#88ccff", pointRadius: 0.8, pointAltitude: 0.04 },
  },
  {
    id: "el-18", category: "Geography", ageGroup: "elementary", difficulty: "easy", icon: "\u{1F3D9}\uFE0F",
    question: "What is the smallest country in the world? \u{1F3D9}\uFE0F",
    options: ["Monaco", "Vatican City", "San Marino", "Liechtenstein"],
    correctIndex: 1,
    explanation: "Vatican City is tiny - about the size of a golf course! It is inside Rome, Italy.",
    target: { lat: 41.9, lng: 12.45, altitude: 0.6 },
    globeLayer: { type: "points", data: [{ lat: 41.9, lng: 12.45, label: "Vatican City" }], pointColor: "#ffcc00", pointRadius: 0.6, pointAltitude: 0.05 },
  },
  {
    id: "el-19", category: "Infrastructure", ageGroup: "elementary", difficulty: "medium", icon: "\u{1F687}",
    question: "Where is the Channel Tunnel? \u{1F687}",
    options: ["Denmark and Sweden", "England and France", "Spain and Morocco", "Italy and Sicily"],
    correctIndex: 1,
    explanation: "The Channel Tunnel goes UNDER the English Channel connecting England and France! Trains zoom through it!",
    target: { lat: 51.01, lng: 1.13, altitude: 0.8 },
    globeLayer: { type: "arcs", data: [{ startLat: 51.09, startLng: 1.18, endLat: 50.93, endLng: 1.79 }], arcColor: "#3388ff" },
  },
  {
    id: "el-20", category: "Geopolitics", ageGroup: "elementary", difficulty: "easy", icon: "\u{1F1FA}\u{1F1F3}",
    question: "How many countries are in the United Nations? \u{1F1FA}\u{1F1F3}",
    options: ["150", "175", "193", "210"],
    correctIndex: 2,
    explanation: "There are 193 countries in the UN! It started in 1945 with only 51 countries.",
    target: { lat: 40.75, lng: -73.97, altitude: 1.0 },
    globeLayer: { type: "points", data: [{ lat: 40.75, lng: -73.97, label: "UN New York" }], pointColor: "#0072bc", pointRadius: 0.7, pointAltitude: 0.06 },
  },
  {
    id: "el-21", category: "Environment", ageGroup: "elementary", difficulty: "medium", icon: "\u{1F9CA}",
    question: "Which is the biggest desert in the world? \u{1F9CA}",
    options: ["Sahara", "Arabian Desert", "Antarctic Desert", "Gobi Desert"],
    correctIndex: 2,
    explanation: "Surprise! Antarctica is the biggest desert! A desert just means very little rain, not just hot and sandy.",
    target: { lat: -82, lng: 0, altitude: 2.5 },
    globeLayer: { type: "points", data: [{ lat: -82, lng: 0, label: "Antarctica" }, { lat: 23, lng: 12, label: "Sahara" }], pointColor: "#ddcc88", pointRadius: 0.8, pointAltitude: 0.03 },
  },
  {
    id: "el-22", category: "Technology", ageGroup: "elementary", difficulty: "easy", icon: "\u{1F4F1}",
    question: "Which country launched 5G mobile internet first? \u{1F4F1}",
    options: ["United States", "Japan", "South Korea", "China"],
    correctIndex: 2,
    explanation: "South Korea turned on 5G in April 2019, just hours before the USA! South Korea loves new technology!",
    target: { lat: 37.57, lng: 127, altitude: 1.2 },
    globeLayer: { type: "points", data: [{ lat: 37.57, lng: 127, label: "Seoul" }], pointColor: "#00ccaa", pointRadius: 0.7, pointAltitude: 0.05 },
  },
]

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Question Bank — Secondary (22 questions)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const SECONDARY_QUESTIONS: QuizCard[] = [
  {
    id: "sc-01", category: "Natural Hazards", ageGroup: "secondary", difficulty: "medium", icon: "\u{1F300}",
    question: "Which ocean basin generates the most tropical cyclones annually?",
    options: ["Atlantic Ocean", "Indian Ocean", "Western Pacific Ocean", "Eastern Pacific Ocean"],
    correctIndex: 2,
    explanation: "The Western Pacific is the most active basin for tropical cyclones (called typhoons there), producing about 26 storms per year on average. Warm ocean waters and favorable atmospheric conditions fuel these powerful storms.",
    target: { lat: 15, lng: 135, altitude: 2.5 },
    globeLayer: { type: "points", data: [{ lat: 14.6, lng: 121, label: "Manila" }, { lat: 22.3, lng: 114.2, label: "Hong Kong" }, { lat: 35.7, lng: 139.7, label: "Tokyo" }], pointColor: "#00bfff", pointRadius: 0.5, pointAltitude: 0.04 },
  },
  {
    id: "sc-02", category: "Natural Hazards", ageGroup: "secondary", difficulty: "medium", icon: "\u{1F30D}",
    question: "The 2023 Morocco earthquake struck the Atlas Mountains at magnitude 6.8. How many fatalities?",
    options: ["About 300", "Nearly 3,000", "Over 10,000", "About 500"],
    correctIndex: 1,
    explanation: "The September 2023 earthquake near Marrakech killed nearly 3,000 people. It was the deadliest earthquake in Morocco in over 60 years.",
    target: { lat: 31.1, lng: -8, altitude: 1.5 },
    globeLayer: { type: "points", data: [{ lat: 31.1, lng: -8, label: "Epicenter" }, { lat: 31.63, lng: -8, label: "Marrakech" }], pointColor: "#ff2200", pointRadius: 0.8, pointAltitude: 0.06 },
  },
  {
    id: "sc-03", category: "Natural Hazards", ageGroup: "secondary", difficulty: "medium", icon: "\u{1F3D9}\uFE0F",
    question: "Tokyo sits at the junction of how many tectonic plates?",
    options: ["Two", "Three", "Four", "Five"],
    correctIndex: 1,
    explanation: "Tokyo sits at the junction of three tectonic plates (Pacific, Philippine, and Eurasian), making it the most seismically active major city. Japan has invested heavily in earthquake-resistant engineering.",
    target: { lat: 35.68, lng: 139.69, altitude: 1.2 },
    globeLayer: { type: "points", data: [{ lat: 35.68, lng: 139.69, label: "Tokyo" }, { lat: 34.05, lng: -118.24, label: "Los Angeles" }], pointColor: "#ff6666", pointRadius: 0.6, pointAltitude: 0.05 },
  },
  {
    id: "sc-04", category: "Natural Hazards", ageGroup: "secondary", difficulty: "hard", icon: "\u{1F4A5}",
    question: "The strongest earthquake ever recorded was magnitude 9.5. Where and when?",
    options: ["1906 San Francisco", "2011 Japan Tohoku", "1960 Chile Valdivia", "2004 Indian Ocean"],
    correctIndex: 2,
    explanation: "The 1960 Valdivia earthquake in Chile is the strongest ever recorded at 9.5. It triggered tsunamis across the Pacific reaching Hawaii and Japan, killing about 1,655 people.",
    target: { lat: -39.82, lng: -73.24, altitude: 1.5 },
    globeLayer: { type: "points", data: [{ lat: -39.82, lng: -73.24, label: "Valdivia" }, { lat: -33.45, lng: -70.67, label: "Santiago" }], pointColor: "#ff0000", pointRadius: 1.0, pointAltitude: 0.1 },
  },
  {
    id: "sc-05", category: "Natural Hazards", ageGroup: "secondary", difficulty: "medium", icon: "\u{1F30A}",
    question: "Where do most Atlantic hurricanes originally form?",
    options: ["Gulf of Mexico", "Cape Verde region, West Africa", "Caribbean Sea", "Bermuda Triangle"],
    correctIndex: 1,
    explanation: "Most major Atlantic hurricanes begin as tropical waves that roll off the coast of West Africa near the Cape Verde Islands. Warm ocean water and the Coriolis effect help them develop as they cross the Atlantic.",
    target: { lat: 15, lng: -24, altitude: 2.0 },
    globeLayer: { type: "arcs", data: [{ startLat: 15, startLng: -24, endLat: 25, endLng: -75 }, { startLat: 14, startLng: -22, endLat: 18, endLng: -66 }], arcColor: "#00bfff" },
  },
  {
    id: "sc-06", category: "Space", ageGroup: "secondary", difficulty: "medium", icon: "\u{1F6F0}\uFE0F",
    question: "Approximately how many Starlink satellites are currently in orbit?",
    options: ["500", "2,000", "6,000+", "50,000"],
    correctIndex: 2,
    explanation: "SpaceX's Starlink constellation has over 6,000 active satellites in low Earth orbit at about 550 km altitude. SpaceX plans to eventually launch up to 42,000 satellites.",
    target: { lat: 28.57, lng: -80.65, altitude: 2.5 },
    globeLayer: { type: "points", data: [{ lat: 28.57, lng: -80.65, label: "Cape Canaveral" }, { lat: 34.63, lng: -120.61, label: "Vandenberg" }], pointColor: "#bb88ff", pointRadius: 0.5, pointAltitude: 0.04 },
  },
  {
    id: "sc-07", category: "Space", ageGroup: "secondary", difficulty: "medium", icon: "\u{1F52D}",
    question: "Where is the world's largest radio telescope (FAST)?",
    options: ["New Mexico, USA", "Guizhou, China", "Atacama, Chile", "Jodrell Bank, England"],
    correctIndex: 1,
    explanation: "The Five-hundred-meter Aperture Spherical Telescope (FAST) in Guizhou province, China has a 500m dish. It searches for pulsars, interstellar molecules, and even extraterrestrial signals.",
    target: { lat: 25.65, lng: 106.86, altitude: 1.2 },
    globeLayer: { type: "points", data: [{ lat: 25.65, lng: 106.86, label: "FAST" }, { lat: 34.08, lng: -107.62, label: "VLA" }], pointColor: "#44aaff", pointRadius: 0.6, pointAltitude: 0.05 },
  },
  {
    id: "sc-08", category: "Architecture", ageGroup: "secondary", difficulty: "medium", icon: "\u{1F3D7}\uFE0F",
    question: "Which country has the most supertall buildings (300m+)?",
    options: ["United States", "UAE", "China", "South Korea"],
    correctIndex: 2,
    explanation: "China has over 100 supertall buildings, more than any other country. Rapid urbanization and economic growth led to a skyscraper boom in cities like Shenzhen, Shanghai, and Guangzhou.",
    target: { lat: 31.23, lng: 121.47, altitude: 2.0 },
    globeLayer: { type: "points", data: [{ lat: 31.23, lng: 121.47, label: "Shanghai" }, { lat: 22.54, lng: 114.06, label: "Shenzhen" }, { lat: 23.13, lng: 113.26, label: "Guangzhou" }], pointColor: "#ff8800", pointRadius: 0.5, pointAltitude: 0.06 },
  },
  {
    id: "sc-09", category: "Architecture", ageGroup: "secondary", difficulty: "hard", icon: "\u{1F3D7}\uFE0F",
    question: "Jeddah Tower aims to be the first building to reach what height?",
    options: ["900 meters", "1,000 meters", "1,200 meters", "1,500 meters"],
    correctIndex: 1,
    explanation: "Jeddah Tower in Saudi Arabia is designed to be the first 1-kilometer-tall building. Construction began in 2013 but was paused. It will surpass the Burj Khalifa by over 170 meters.",
    target: { lat: 21.49, lng: 39.19, altitude: 1.2 },
    globeLayer: { type: "points", data: [{ lat: 21.49, lng: 39.19, label: "Jeddah Tower" }, { lat: 25.2, lng: 55.27, label: "Burj Khalifa" }], pointColor: "#ffcc00", pointRadius: 0.7, pointAltitude: 0.08 },
  },
  {
    id: "sc-10", category: "Infrastructure", ageGroup: "secondary", difficulty: "medium", icon: "\u{1F684}",
    question: "China has 45,000km of high-speed rail. What is the fastest commercial train speed?",
    options: ["TGV at 320 km/h", "Shanghai Maglev at 431 km/h", "Shinkansen at 320 km/h", "ICE at 300 km/h"],
    correctIndex: 1,
    explanation: "The Shanghai Maglev reaches 431 km/h in regular service, covering 30 km from Pudong Airport to the city in just 7 minutes using magnetic levitation technology.",
    target: { lat: 31.15, lng: 121.81, altitude: 1.0 },
    globeLayer: { type: "arcs", data: [{ startLat: 31.19, startLng: 121.81, endLat: 31.15, endLng: 121.34 }], arcColor: "#00ccff" },
  },
  {
    id: "sc-11", category: "Infrastructure", ageGroup: "secondary", difficulty: "medium", icon: "\u{1F3D4}\uFE0F",
    question: "What is the longest railway tunnel in the world and where is it?",
    options: ["Channel Tunnel, UK-France", "Gotthard Base Tunnel, Switzerland", "Seikan Tunnel, Japan", "Laerdal Tunnel, Norway"],
    correctIndex: 1,
    explanation: "The Gotthard Base Tunnel in Switzerland is 57.1 km long, the world's longest railway tunnel. Opened in 2016, it reduced travel time between Zurich and Milan and took 17 years to build.",
    target: { lat: 46.65, lng: 8.65, altitude: 0.8 },
    globeLayer: { type: "arcs", data: [{ startLat: 46.83, startLng: 8.65, endLat: 46.48, endLng: 8.78 }], arcColor: "#ff4444" },
  },
  {
    id: "sc-12", category: "Environment", ageGroup: "secondary", difficulty: "medium", icon: "\u{1F420}",
    question: "Australia's Great Barrier Reef experienced mass bleaching in 2024. What percentage was affected?",
    options: ["25%", "50%", "73%", "90%"],
    correctIndex: 2,
    explanation: "Surveys found bleaching in 73% of the Great Barrier Reef in 2024. Bleaching occurs when water temperatures rise and corals expel their symbiotic algae. The reef stretches 2,300 km.",
    target: { lat: -18.29, lng: 147.7, altitude: 1.8 },
    globeLayer: { type: "points", data: [{ lat: -18.29, lng: 147.7, label: "GBR North" }, { lat: -20.5, lng: 149, label: "GBR Central" }], pointColor: "#ff8844", pointRadius: 0.5, pointAltitude: 0.03 },
  },
  {
    id: "sc-13", category: "Environment", ageGroup: "secondary", difficulty: "medium", icon: "\u{1F30A}",
    question: "The Gulf Stream flows from where to where?",
    options: ["Pacific: Japan to Alaska", "Atlantic: Gulf of Mexico to Northern Europe", "Indian Ocean: Africa to India", "Arctic: Russia to Canada"],
    correctIndex: 1,
    explanation: "The Gulf Stream carries warm water from the Gulf of Mexico along the US East Coast and across the Atlantic. It keeps Western Europe much warmer than other regions at the same latitude.",
    target: { lat: 35, lng: -55, altitude: 2.5 },
    globeLayer: { type: "arcs", data: [{ startLat: 25, startLng: -80, endLat: 40, endLng: -60 }, { startLat: 40, startLng: -60, endLat: 55, endLng: -10 }], arcColor: "#ff6633" },
  },
  {
    id: "sc-14", category: "Technology", ageGroup: "secondary", difficulty: "medium", icon: "\u{1F4F6}",
    question: "What percentage of international internet traffic travels through undersea cables?",
    options: ["50%", "75%", "95%", "99%"],
    correctIndex: 3,
    explanation: "About 99% of all intercontinental internet traffic travels through undersea fiber optic cables. Over 500 cables totaling 1.3 million km sit on the ocean floor, each about as thick as a garden hose.",
    target: { lat: 30, lng: -40, altitude: 3.0 },
    globeLayer: { type: "arcs", data: [{ startLat: 40.71, startLng: -74.01, endLat: 51.51, endLng: -0.13 }, { startLat: 34.05, startLng: -118.24, endLat: 35.68, endLng: 139.69 }], arcColor: "#44aaff" },
  },
  {
    id: "sc-15", category: "Geopolitics", ageGroup: "secondary", difficulty: "medium", icon: "\u{1F3DA}\uFE0F",
    question: "How many people are forcibly displaced globally as of 2024?",
    options: ["25 million", "60 million", "117 million", "500 million"],
    correctIndex: 2,
    explanation: "Over 117 million people are forcibly displaced worldwide, the highest ever recorded. This includes refugees, asylum seekers, and internally displaced persons from conflicts in Syria, Ukraine, Sudan, and more.",
    target: { lat: 20, lng: 30, altitude: 3.0 },
    globeLayer: { type: "arcs", data: [{ startLat: 35, startLng: 38, endLat: 41, endLng: 29 }, { startLat: 48.38, startLng: 31.17, endLat: 52.23, endLng: 21.01 }], arcColor: "#ff4444" },
  },
  {
    id: "sc-16", category: "Geopolitics", ageGroup: "secondary", difficulty: "medium", icon: "\u{1F6A2}",
    question: "The Strait of Malacca carries what percentage of global traded goods?",
    options: ["5%", "15%", "25%", "40%"],
    correctIndex: 2,
    explanation: "About 25% of all traded goods pass through the Strait of Malacca between Malaysia and Indonesia, including much of East Asia's oil. Over 100,000 ships transit annually.",
    target: { lat: 2.5, lng: 101.5, altitude: 1.5 },
    globeLayer: { type: "arcs", data: [{ startLat: -1, startLng: 104, endLat: 6, endLng: 100 }], arcColor: "#ffaa00" },
  },
  {
    id: "sc-17", category: "Geography", ageGroup: "secondary", difficulty: "medium", icon: "\u{1F3DD}\uFE0F",
    question: "The Galapagos Islands are off the coast of which country?",
    options: ["Peru", "Ecuador", "Colombia", "Chile"],
    correctIndex: 1,
    explanation: "The Galapagos Islands are about 1,000 km off Ecuador's coast. Darwin's 1835 visit inspired his theory of evolution. The islands have unique species like giant tortoises and marine iguanas.",
    target: { lat: -0.75, lng: -90.5, altitude: 1.2 },
    globeLayer: { type: "points", data: [{ lat: -0.75, lng: -90.5, label: "Galapagos" }, { lat: -0.18, lng: -78.47, label: "Ecuador" }], pointColor: "#22aa44", pointRadius: 0.6, pointAltitude: 0.04 },
  },
  {
    id: "sc-18", category: "Geography", ageGroup: "secondary", difficulty: "hard", icon: "\u{1F554}",
    question: "Which country spans the most time zones?",
    options: ["Russia (11)", "United States (6)", "China (1 official)", "France (12)"],
    correctIndex: 3,
    explanation: "France spans 12 time zones due to overseas territories: French Guiana, Guadeloupe, Martinique, Reunion, New Caledonia, Tahiti, and more. Russia has 11 time zones within its mainland.",
    target: { lat: 46.6, lng: 2, altitude: 1.5 },
    globeLayer: { type: "points", data: [{ lat: 48.86, lng: 2.35, label: "Paris" }, { lat: 4.94, lng: -52.33, label: "French Guiana" }, { lat: -17.53, lng: -149.57, label: "Tahiti" }], pointColor: "#3344ff", pointRadius: 0.5, pointAltitude: 0.05 },
  },
  {
    id: "sc-19", category: "Geography", ageGroup: "secondary", difficulty: "medium", icon: "\u{1F5FC}",
    question: "France is the most visited country with how many tourists per year?",
    options: ["50 million", "70 million", "90 million", "110 million"],
    correctIndex: 2,
    explanation: "France welcomes about 90 million international tourists per year. Paris alone attracts over 30 million visitors for the Eiffel Tower, Louvre Museum, and French cuisine.",
    target: { lat: 48.86, lng: 2.35, altitude: 1.0 },
    globeLayer: { type: "points", data: [{ lat: 48.86, lng: 2.35, label: "Paris" }, { lat: 43.7, lng: 7.27, label: "Nice" }], pointColor: "#3344ff", pointRadius: 0.5, pointAltitude: 0.04 },
  },
  {
    id: "sc-20", category: "Technology", ageGroup: "secondary", difficulty: "medium", icon: "\u{1F4E1}",
    question: "China has the most cell towers. Approximately how many?",
    options: ["500,000", "1.5 million", "3.5 million", "10 million"],
    correctIndex: 2,
    explanation: "China has over 3.5 million base stations including more than 2 million 5G towers, giving it the world's largest 5G network.",
    target: { lat: 35, lng: 105, altitude: 2.5 },
    globeLayer: { type: "points", data: [{ lat: 39.9, lng: 116.4, label: "Beijing" }, { lat: 31.23, lng: 121.47, label: "Shanghai" }], pointColor: "#33ccdd", pointRadius: 0.5, pointAltitude: 0.04 },
  },
  {
    id: "sc-21", category: "Architecture", ageGroup: "secondary", difficulty: "medium", icon: "\u{1F3E2}",
    question: "The Lakhta Center is the tallest building in Europe at 462m. Where is it?",
    options: ["London, UK", "St. Petersburg, Russia", "Frankfurt, Germany", "Istanbul, Turkey"],
    correctIndex: 1,
    explanation: "The Lakhta Center in St. Petersburg, Russia, stands at 462 meters. Completed in 2019, it serves as Gazprom's headquarters. The Shard in London (310m) is the tallest in Western Europe.",
    target: { lat: 59.99, lng: 30.18, altitude: 1.0 },
    globeLayer: { type: "points", data: [{ lat: 59.99, lng: 30.18, label: "Lakhta 462m" }, { lat: 51.5, lng: -0.09, label: "The Shard 310m" }], pointColor: "#44aaff", pointRadius: 0.6, pointAltitude: 0.06 },
  },
  {
    id: "sc-22", category: "Environment", ageGroup: "secondary", difficulty: "medium", icon: "\u{1F4A7}",
    question: "Lake Baikal in Russia is the world's deepest lake. How deep?",
    options: ["800 meters", "1,200 meters", "1,642 meters", "2,100 meters"],
    correctIndex: 2,
    explanation: "Lake Baikal is 1,642 meters deep, the world's oldest lake (25 million years), and holds about 20% of the world's unfrozen fresh surface water - more than all the Great Lakes combined!",
    target: { lat: 53.5, lng: 108, altitude: 1.5 },
    globeLayer: { type: "points", data: [{ lat: 53.5, lng: 108, label: "Lake Baikal" }], pointColor: "#2266cc", pointRadius: 0.8, pointAltitude: 0.04 },
  },
]

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Question Bank — University (22 questions)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const UNIVERSITY_QUESTIONS: QuizCard[] = [
  {
    id: "un-01", category: "Space", ageGroup: "university", difficulty: "hard", icon: "\u{1F4AB}",
    question: "What is the Kessler Syndrome and why does it threaten satellite operations?",
    options: ["A disease astronauts get in space", "Cascading space debris collisions making orbits unusable", "A type of black hole", "Loss of gravity on the Moon"],
    correctIndex: 1,
    explanation: "The Kessler Syndrome (proposed by NASA scientist Don Kessler in 1978) describes a scenario where space debris collisions create more debris, triggering a chain reaction that could make certain orbits unusable. Over 30,000 tracked debris objects are already in orbit.",
    target: { lat: 0, lng: 0, altitude: 3.5 },
    globeLayer: { type: "points", data: [{ lat: 72.5, lng: 97.5, label: "Cosmos-Iridium collision" }, { lat: 0, lng: 60, label: "Debris field" }], pointColor: "#aaaaaa", pointRadius: 0.3, pointAltitude: 0.12 },
  },
  {
    id: "un-02", category: "Space", ageGroup: "university", difficulty: "hard", icon: "\u{1F6F0}\uFE0F",
    question: "GPS satellites orbit in Medium Earth Orbit. At what altitude?",
    options: ["400 km (LEO)", "2,000 km", "20,200 km (MEO)", "35,786 km (GEO)"],
    correctIndex: 2,
    explanation: "GPS satellites orbit at 20,200 km in MEO. There are 31 active GPS satellites forming a constellation ensuring at least 4 are visible from any point on Earth at all times.",
    target: { lat: 38.8, lng: -77, altitude: 3.0 },
    globeLayer: { type: "points", data: [{ lat: 38.8, lng: -77, label: "GPS Control DC" }, { lat: 38.75, lng: -104.84, label: "Schriever AFB" }], pointColor: "#22cc88", pointRadius: 0.6, pointAltitude: 0.05 },
  },
  {
    id: "un-03", category: "Space", ageGroup: "university", difficulty: "hard", icon: "\u{1F680}",
    question: "The Baikonur Cosmodrome is in which country, and who operates it?",
    options: ["Russia (Russian-operated)", "Kazakhstan (Russia leases it)", "Uzbekistan", "Ukraine"],
    correctIndex: 1,
    explanation: "The Baikonur Cosmodrome is in Kazakhstan but Russia leases and operates it. It's the world's oldest and largest operational launch facility - Sputnik, Gagarin's Vostok 1, and Soyuz missions all launched from there.",
    target: { lat: 45.96, lng: 63.31, altitude: 1.3 },
    globeLayer: { type: "points", data: [{ lat: 45.96, lng: 63.31, label: "Baikonur" }], pointColor: "#ffaa00", pointRadius: 0.8, pointAltitude: 0.06 },
  },
  {
    id: "un-04", category: "Natural Hazards", ageGroup: "university", difficulty: "hard", icon: "\u{1F30B}",
    question: "What is a lahar and which famous volcanoes are known hazard zones?",
    options: ["A type of tornado", "A volcanic mudflow - Pinatubo and Mt. Rainier are hazard zones", "An underwater earthquake", "A lightning storm"],
    correctIndex: 1,
    explanation: "A lahar is a destructive mudflow of volcanic debris mixed with water, traveling at over 60 mph. Mount Pinatubo in the Philippines and Mount Rainier in Washington are known lahar hazard zones that could bury entire communities.",
    target: { lat: 15.14, lng: 120.35, altitude: 1.3 },
    globeLayer: { type: "points", data: [{ lat: 15.14, lng: 120.35, label: "Pinatubo" }, { lat: 46.85, lng: -121.76, label: "Mt Rainier" }], pointColor: "#996633", pointRadius: 0.7, pointAltitude: 0.06 },
  },
  {
    id: "un-05", category: "Natural Hazards", ageGroup: "university", difficulty: "hard", icon: "\u{1F30A}",
    question: "The Fukushima Daiichi disaster was triggered by a 9.1-magnitude earthquake. What was unique about the triple disaster?",
    options: ["Earthquake only", "Earthquake + tsunami + nuclear meltdown", "Tsunami + volcanic eruption", "Nuclear test + earthquake"],
    correctIndex: 1,
    explanation: "The March 11, 2011 event was a triple disaster: a 9.1 magnitude earthquake triggered a massive tsunami, which then caused three nuclear meltdowns at Fukushima Daiichi - the worst nuclear accident since Chernobyl.",
    target: { lat: 37.42, lng: 141.03, altitude: 1.2 },
    globeLayer: { type: "points", data: [{ lat: 37.42, lng: 141.03, label: "Fukushima" }, { lat: 35.68, lng: 139.69, label: "Tokyo" }], pointColor: "#ffff00", pointRadius: 0.8, pointAltitude: 0.06 },
  },
  {
    id: "un-06", category: "Architecture", ageGroup: "university", difficulty: "hard", icon: "\u270F\uFE0F",
    question: "Who designed the Burj Khalifa, and what flower inspired its Y-shaped floor plan?",
    options: ["Frank Gehry - Tulip", "Zaha Hadid - Rose", "Adrian Smith (SOM) - Hymenocallis flower", "Norman Foster - Lily"],
    correctIndex: 2,
    explanation: "Adrian Smith of Skidmore, Owings & Merrill designed the Burj Khalifa. The Hymenocallis flower inspired the Y-shaped plan that reduces wind forces. Smith also designed Jeddah Tower.",
    target: { lat: 25.2, lng: 55.27, altitude: 1.0 },
    globeLayer: { type: "points", data: [{ lat: 25.2, lng: 55.27, label: "Burj Khalifa" }], pointColor: "#f5a623", pointRadius: 0.8, pointAltitude: 0.08 },
  },
  {
    id: "un-07", category: "Architecture", ageGroup: "university", difficulty: "hard", icon: "\u{1F30D}",
    question: "Africa's tallest building, the Iconic Tower, was completed in 2023. Where is it?",
    options: ["Johannesburg", "Egypt's New Administrative Capital near Cairo", "Nairobi", "Casablanca"],
    correctIndex: 1,
    explanation: "The Iconic Tower in Egypt's New Administrative Capital near Cairo stands at 385 meters. It is part of Egypt's ambitious new capital city project, representing Africa's growing skyline.",
    target: { lat: 30.02, lng: 31.76, altitude: 1.2 },
    globeLayer: { type: "points", data: [{ lat: 30.02, lng: 31.76, label: "Iconic Tower 385m" }, { lat: -26.2, lng: 28.05, label: "Carlton Centre 223m" }], pointColor: "#ffaa44", pointRadius: 0.6, pointAltitude: 0.06 },
  },
  {
    id: "un-08", category: "Infrastructure", ageGroup: "university", difficulty: "hard", icon: "\u{1F687}",
    question: "Beijing's metro carries how many passengers daily, and how many lines does it have?",
    options: ["5M daily, 15 lines", "10M daily, 27 lines", "3M daily, 10 lines", "15M daily, 35 lines"],
    correctIndex: 1,
    explanation: "Beijing's metro carries over 10 million passengers daily with the highest annual ridership globally. The system has expanded rapidly since 2000 with over 800 km of track and 27 lines.",
    target: { lat: 39.9, lng: 116.4, altitude: 1.2 },
    globeLayer: { type: "points", data: [{ lat: 39.9, lng: 116.4, label: "Beijing" }, { lat: 35.68, lng: 139.69, label: "Tokyo" }], pointColor: "#cc3333", pointRadius: 0.5, pointAltitude: 0.04 },
  },
  {
    id: "un-09", category: "Infrastructure", ageGroup: "university", difficulty: "hard", icon: "\u{1F3D4}\uFE0F",
    question: "The Qinghai-Tibet Railway reaches a maximum elevation of 5,072m. What special feature do its trains have?",
    options: ["Solar panels", "Pressurized cabins with supplemental oxygen", "Magnetic levitation", "Heated tracks"],
    correctIndex: 1,
    explanation: "The Qinghai-Tibet Railway at Tanggula Pass reaches 5,072m - the highest point of any railway. Opened in 2006, trains have pressurized cabins and supplemental oxygen for passengers crossing the Tibetan Plateau.",
    target: { lat: 33, lng: 92, altitude: 2.0 },
    globeLayer: { type: "arcs", data: [{ startLat: 36.62, startLng: 101.77, endLat: 29.65, endLng: 91.13 }], arcColor: "#ffaa00" },
  },
  {
    id: "un-10", category: "Environment", ageGroup: "university", difficulty: "hard", icon: "\u{1F30A}",
    question: "The Mariana Trench's Challenger Deep is 10,935m. If Everest were placed inside, how much water would remain above the peak?",
    options: ["500 meters", "Over 2 kilometers", "100 meters", "5 kilometers"],
    correctIndex: 1,
    explanation: "Challenger Deep is 10,935m vs Everest at 8,849m, so over 2 km of water would remain above the peak. The trench is in the western Pacific Ocean, east of the Philippines and Mariana Islands.",
    target: { lat: 11.35, lng: 142.2, altitude: 1.5 },
    globeLayer: { type: "points", data: [{ lat: 11.35, lng: 142.2, label: "Challenger Deep" }], pointColor: "#000066", pointRadius: 0.8, pointAltitude: 0.02 },
  },
  {
    id: "un-11", category: "Environment", ageGroup: "university", difficulty: "hard", icon: "\u267B\uFE0F",
    question: "There are 5 major ocean garbage patches corresponding to ocean gyres. Which oceans have them?",
    options: ["3 in Pacific, 2 in Atlantic", "N&S Pacific, N&S Atlantic, Indian", "All 5 in the Pacific", "2 Pacific, 2 Atlantic, 1 Arctic"],
    correctIndex: 1,
    explanation: "The 5 garbage patches are in the North Pacific, South Pacific, North Atlantic, South Atlantic, and Indian Ocean gyres. Ocean currents trap floating debris in these rotating zones, containing millions of tons of plastic.",
    target: { lat: 10, lng: -30, altitude: 3.5 },
    globeLayer: { type: "points", data: [{ lat: 30, lng: -140, label: "N Pacific" }, { lat: -30, lng: -110, label: "S Pacific" }, { lat: 30, lng: -45, label: "N Atlantic" }, { lat: -30, lng: -20, label: "S Atlantic" }, { lat: -25, lng: 75, label: "Indian" }], pointColor: "#66cc44", pointRadius: 0.8, pointAltitude: 0.03 },
  },
  {
    id: "un-12", category: "Technology", ageGroup: "university", difficulty: "hard", icon: "\u{1F4F6}",
    question: "What does 5G NR stand for, and what are its theoretical capabilities?",
    options: ["5G Network Relay - 1 Gbps", "5G New Radio - 20 Gbps, sub-1ms latency", "5G Next Release - 5 Gbps", "5G Node Router - 10 Gbps"],
    correctIndex: 1,
    explanation: "5G NR (5th Generation New Radio) is the global standard offering up to 20 Gbps speeds, ultra-low latency under 1 millisecond, and ability to connect millions of devices per square kilometer.",
    target: { lat: 37.57, lng: 127, altitude: 1.5 },
    globeLayer: { type: "points", data: [{ lat: 37.57, lng: 127, label: "Seoul" }, { lat: 39.9, lng: 116.4, label: "Beijing" }], pointColor: "#00ddaa", pointRadius: 0.5, pointAltitude: 0.05 },
  },
  {
    id: "un-13", category: "Technology", ageGroup: "university", difficulty: "hard", icon: "\u{1F4F6}",
    question: "What is a 'small cell' in 5G networks and why are they needed?",
    options: ["A tiny battery", "Low-power base stations for mmWave coverage in dense areas", "A type of SIM card", "A satellite dish"],
    correctIndex: 1,
    explanation: "Small cells are low-power, short-range base stations mounted on lamp posts and buildings to boost 5G mmWave coverage in dense urban areas. A single city block might need several for full coverage.",
    target: { lat: 40.71, lng: -74.01, altitude: 1.0 },
    globeLayer: { type: "points", data: [{ lat: 40.71, lng: -74.01, label: "NYC" }, { lat: 34.05, lng: -118.24, label: "LA" }], pointColor: "#00ddcc", pointRadius: 0.4, pointAltitude: 0.03 },
  },
  {
    id: "un-14", category: "Technology", ageGroup: "university", difficulty: "hard", icon: "\u2601\uFE0F",
    question: "Which company operates the most hyperscale data centers globally?",
    options: ["Google", "Microsoft", "Amazon (AWS)", "Meta"],
    correctIndex: 2,
    explanation: "Amazon Web Services operates the most hyperscale data centers globally across 34 geographic regions, powering about 31% of the cloud computing market. AWS serves millions of customers from Netflix to NASA.",
    target: { lat: 38.9, lng: -77, altitude: 2.5 },
    globeLayer: { type: "points", data: [{ lat: 39.04, lng: -77.49, label: "AWS Virginia" }, { lat: 45.52, lng: -122.68, label: "AWS Oregon" }, { lat: 1.35, lng: 103.82, label: "AWS Singapore" }], pointColor: "#ff9900", pointRadius: 0.5, pointAltitude: 0.05 },
  },
  {
    id: "un-15", category: "Technology", ageGroup: "university", difficulty: "hard", icon: "\u{1F50D}",
    question: "Google's largest data center is in The Dalles, Oregon. Why was this location chosen?",
    options: ["Close to HQ", "Cheap hydroelectric power and cool climate", "Tax incentives only", "Near major population center"],
    correctIndex: 1,
    explanation: "The Dalles sits along the Columbia River, benefiting from cheap hydroelectric power and cool climate for natural cooling. Google has invested over $12 billion in this facility.",
    target: { lat: 45.6, lng: -121.18, altitude: 1.2 },
    globeLayer: { type: "points", data: [{ lat: 45.6, lng: -121.18, label: "The Dalles" }, { lat: 37.42, lng: -122.08, label: "Google HQ" }], pointColor: "#4285f4", pointRadius: 0.7, pointAltitude: 0.05 },
  },
  {
    id: "un-16", category: "Technology", ageGroup: "university", difficulty: "hard", icon: "\u{1F30D}",
    question: "DE-CIX in Frankfurt is the world's largest internet exchange point by peak traffic. What throughput?",
    options: ["5 Tbps", "10 Tbps", "17+ Tbps", "50 Tbps"],
    correctIndex: 2,
    explanation: "DE-CIX Frankfurt handles over 17 Tbps peak traffic. Internet exchange points are physical locations where different networks connect to exchange data directly, reducing latency and costs.",
    target: { lat: 50.11, lng: 8.68, altitude: 1.0 },
    globeLayer: { type: "points", data: [{ lat: 50.11, lng: 8.68, label: "DE-CIX Frankfurt" }, { lat: 52.37, lng: 4.9, label: "AMS-IX" }], pointColor: "#ff4488", pointRadius: 0.6, pointAltitude: 0.05 },
  },
  {
    id: "un-17", category: "Geopolitics", ageGroup: "university", difficulty: "hard", icon: "\u{1F3D5}\uFE0F",
    question: "The Kutupalong refugee camp in Cox's Bazar houses how many Rohingya refugees?",
    options: ["200,000", "500,000", "Over 900,000", "2 million"],
    correctIndex: 2,
    explanation: "Kutupalong in Bangladesh houses over 900,000 Rohingya refugees who fled violence in Myanmar. Sprawling across 26 sq km, it is the world's largest refugee camp with extreme monsoon flooding threats.",
    target: { lat: 21.18, lng: 92.15, altitude: 1.2 },
    globeLayer: { type: "points", data: [{ lat: 21.18, lng: 92.15, label: "Cox's Bazar" }, { lat: 23.81, lng: 90.41, label: "Dhaka" }], pointColor: "#ff4444", pointRadius: 0.7, pointAltitude: 0.05 },
  },
  {
    id: "un-18", category: "Geopolitics", ageGroup: "university", difficulty: "hard", icon: "\u2696\uFE0F",
    question: "The International Court of Justice is in The Hague. Which other major court is also located there?",
    options: ["European Court of Justice", "International Criminal Court (ICC)", "WTO Dispute Body", "Human Rights Court"],
    correctIndex: 1,
    explanation: "Both the ICJ (UN's judicial branch, settling disputes between countries) and the ICC (prosecuting individuals for genocide, war crimes, crimes against humanity) are in The Hague, Netherlands.",
    target: { lat: 52.09, lng: 4.3, altitude: 1.0 },
    globeLayer: { type: "points", data: [{ lat: 52.09, lng: 4.3, label: "The Hague" }], pointColor: "#0072bc", pointRadius: 0.7, pointAltitude: 0.06 },
  },
  {
    id: "un-19", category: "Geography", ageGroup: "university", difficulty: "hard", icon: "\u{1F3DB}\uFE0F",
    question: "Italy has the most UNESCO World Heritage Sites with 59. Which sites are among them?",
    options: ["Only ancient Roman sites", "Colosseum, Pompeii, Venice, Amalfi Coast, Florence", "Only Renaissance buildings", "Only natural landscapes"],
    correctIndex: 1,
    explanation: "Italy's 59 UNESCO sites span from the Colosseum and Pompeii to Venice, the Amalfi Coast, and Florence's historic center. China and Germany tie for second place worldwide.",
    target: { lat: 41.9, lng: 12.5, altitude: 1.5 },
    globeLayer: { type: "points", data: [{ lat: 41.9, lng: 12.5, label: "Rome" }, { lat: 43.77, lng: 11.25, label: "Florence" }, { lat: 45.44, lng: 12.32, label: "Venice" }], pointColor: "#ffcc00", pointRadius: 0.5, pointAltitude: 0.04 },
  },
  {
    id: "un-20", category: "Geography", ageGroup: "university", difficulty: "hard", icon: "\u{1F3DC}\uFE0F",
    question: "NASA uses parts of the Atacama Desert to test Mars rover instruments. Why?",
    options: ["It is the hottest place", "It is the driest inhabited place on Earth - some stations have never recorded rain", "It has red soil", "It is at high altitude"],
    correctIndex: 1,
    explanation: "The Atacama Desert in Chile is the driest place on Earth - some weather stations have never recorded rain. Its extreme aridity makes it a perfect analog for Mars surface conditions.",
    target: { lat: -23.86, lng: -69.13, altitude: 1.5 },
    globeLayer: { type: "points", data: [{ lat: -23.86, lng: -69.13, label: "Atacama" }], pointColor: "#ddaa44", pointRadius: 0.8, pointAltitude: 0.04 },
  },
  {
    id: "un-21", category: "Space", ageGroup: "university", difficulty: "hard", icon: "\u{1F1EE}\u{1F1F3}",
    question: "India's Chandrayaan-3 made India the 4th country to land on the Moon in 2023. Where is ISRO's primary launch site?",
    options: ["Mumbai", "Sriharikota, Andhra Pradesh", "Bangalore", "New Delhi"],
    correctIndex: 1,
    explanation: "The Satish Dhawan Space Centre in Sriharikota, Andhra Pradesh, is ISRO's primary launch site. India's space program has achieved remarkable feats at a fraction of the cost of Western agencies.",
    target: { lat: 13.72, lng: 80.23, altitude: 1.3 },
    globeLayer: { type: "points", data: [{ lat: 13.72, lng: 80.23, label: "Sriharikota" }, { lat: 12.97, lng: 77.59, label: "ISRO HQ" }], pointColor: "#ff8800", pointRadius: 0.7, pointAltitude: 0.06 },
  },
  {
    id: "un-22", category: "Environment", ageGroup: "university", difficulty: "hard", icon: "\u{1F99C}",
    question: "Brazil is considered the most biodiverse country. How many plant species does it have?",
    options: ["10,000", "25,000", "Over 50,000", "100,000"],
    correctIndex: 2,
    explanation: "Brazil has over 50,000 plant species, more than any other country. The Amazon Rainforest, Atlantic Forest, Cerrado, and Pantanal wetlands create incredibly diverse habitats hosting 15-20% of all known species.",
    target: { lat: -14.24, lng: -51.93, altitude: 2.0 },
    globeLayer: { type: "points", data: [{ lat: -3.12, lng: -60.02, label: "Amazon" }, { lat: -15.79, lng: -47.88, label: "Cerrado" }], pointColor: "#22cc44", pointRadius: 0.5, pointAltitude: 0.04 },
  },
]

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Question Bank — Adult (22 questions)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const ADULT_QUESTIONS: QuizCard[] = [
  {
    id: "ad-01", category: "Technology", ageGroup: "adult", difficulty: "hard", icon: "\u{1F916}",
    question: "Microsoft's Stargate project is a $500B investment. Where is Phase 1 being built?",
    options: ["Seattle, Washington", "Abilene, Texas", "Silicon Valley, California", "Ashburn, Virginia"],
    correctIndex: 1,
    explanation: "Microsoft and OpenAI announced the Stargate project in Abilene, Texas. Texas was chosen for abundant land, energy resources, and favorable regulations. It aims to be the largest AI computing infrastructure ever built.",
    target: { lat: 32.45, lng: -99.73, altitude: 1.2 },
    globeLayer: { type: "points", data: [{ lat: 32.45, lng: -99.73, label: "Abilene TX" }, { lat: 47.61, lng: -122.33, label: "Seattle" }], pointColor: "#3388ff", pointRadius: 0.7, pointAltitude: 0.05 },
  },
  {
    id: "ad-02", category: "Geopolitics", ageGroup: "adult", difficulty: "medium", icon: "\u{1F3DA}\uFE0F",
    question: "117 million people were forcibly displaced in 2024. Which country generates the most refugees?",
    options: ["Ukraine", "Syria", "Afghanistan", "Somalia"],
    correctIndex: 1,
    explanation: "Syria's civil war (since 2011) has displaced over 14 million people, more than half the pre-war population. About 6.8 million are refugees abroad (mainly Turkey, Lebanon, Jordan) and 7.2 million are internally displaced.",
    target: { lat: 35, lng: 38, altitude: 1.5 },
    globeLayer: { type: "arcs", data: [{ startLat: 35, startLng: 38, endLat: 39.93, endLng: 32.86 }, { startLat: 35, startLng: 38, endLat: 33.89, endLng: 35.5 }], arcColor: "#ff6644" },
  },
  {
    id: "ad-03", category: "Geopolitics", ageGroup: "adult", difficulty: "medium", icon: "\u{1F3DA}\uFE0F",
    question: "Which country hosts the most refugees in the world?",
    options: ["Germany", "Turkey", "Pakistan", "Uganda"],
    correctIndex: 1,
    explanation: "Turkey hosts about 3.6 million refugees, mostly Syrians. Its border with Syria made it the primary destination. Iran, Colombia, Germany, and Pakistan also host millions.",
    target: { lat: 39.93, lng: 32.86, altitude: 1.5 },
    globeLayer: { type: "points", data: [{ lat: 39.93, lng: 32.86, label: "Ankara" }, { lat: 37.07, lng: 37.38, label: "Gaziantep" }], pointColor: "#ff6644", pointRadius: 0.5, pointAltitude: 0.04 },
  },
  {
    id: "ad-04", category: "Geopolitics", ageGroup: "adult", difficulty: "medium", icon: "\u{1F476}",
    question: "Africa has the youngest population with a median age of about what?",
    options: ["15 years", "19 years", "25 years", "30 years"],
    correctIndex: 1,
    explanation: "Africa's median age is about 19 years, vs Europe's 43. By 2050, Africa is expected to have 2.5 billion people, making it the most populous continent after Asia.",
    target: { lat: 0, lng: 20, altitude: 3.0 },
    globeLayer: { type: "points", data: [{ lat: 9.06, lng: 7.49, label: "Nigeria" }, { lat: -1.29, lng: 36.82, label: "Kenya" }], pointColor: "#ff8844", pointRadius: 0.5, pointAltitude: 0.04 },
  },
  {
    id: "ad-05", category: "Natural Hazards", ageGroup: "adult", difficulty: "easy", icon: "\u{1F525}",
    question: "Did you know California had over 4 million acres burn in 2020 alone? What drives its wildfires?",
    options: ["Monsoons", "Santa Ana winds and drought", "Volcanic activity", "Industrial fires"],
    correctIndex: 1,
    explanation: "California leads in wildfire activity due to dry Santa Ana winds, prolonged drought conditions, and vast wildland-urban interfaces. Climate change is making fire seasons longer and more severe.",
    target: { lat: 36.78, lng: -119.42, altitude: 1.8 },
    globeLayer: { type: "points", data: [{ lat: 34.05, lng: -118.24, label: "Los Angeles" }, { lat: 39.53, lng: -121.56, label: "Paradise" }], pointColor: "#ff4500", pointRadius: 0.6, pointAltitude: 0.05 },
  },
  {
    id: "ad-06", category: "Natural Hazards", ageGroup: "adult", difficulty: "medium", icon: "\u{1F30A}",
    question: "Floods kill more people worldwide annually than any other natural disaster. Which region is most affected?",
    options: ["Europe", "North America", "South and Southeast Asia", "South America"],
    correctIndex: 2,
    explanation: "Floods are the deadliest natural disaster globally, especially in South and Southeast Asia where monsoons, river flooding, and dense populations create devastating impacts. Bangladesh, India, and Myanmar are particularly vulnerable.",
    target: { lat: 23, lng: 90, altitude: 2.5 },
    globeLayer: { type: "points", data: [{ lat: 23.81, lng: 90.41, label: "Bangladesh" }, { lat: 28.61, lng: 77.21, label: "Delhi" }], pointColor: "#4488ff", pointRadius: 0.6, pointAltitude: 0.05 },
  },
  {
    id: "ad-07", category: "Space", ageGroup: "adult", difficulty: "easy", icon: "\u{1F6F0}\uFE0F",
    question: "SpaceX launched Sputnik's successor era: Starlink has 6,000+ satellites. What is their main purpose?",
    options: ["Military surveillance", "Broadband internet for remote areas", "Weather monitoring", "Deep space research"],
    correctIndex: 1,
    explanation: "Starlink provides broadband internet to users in remote areas worldwide from low Earth orbit (550 km). The constellation is already used in war zones, disaster areas, and rural communities globally.",
    target: { lat: 28.57, lng: -80.65, altitude: 2.5 },
    globeLayer: { type: "points", data: [{ lat: 28.57, lng: -80.65, label: "Cape Canaveral" }], pointColor: "#bb88ff", pointRadius: 0.5, pointAltitude: 0.04 },
  },
  {
    id: "ad-08", category: "Space", ageGroup: "adult", difficulty: "medium", icon: "\u{1F52D}",
    question: "The Hubble Space Telescope orbits at 540 km. Where is the newer James Webb Telescope?",
    options: ["Also in LEO", "At the L2 Lagrange point, 1.5 million km away", "On the Moon", "In geostationary orbit"],
    correctIndex: 1,
    explanation: "While Hubble orbits at 540 km in LEO, the James Webb Space Telescope is at L2, 1.5 million km from Earth. This location keeps the Sun, Earth, and Moon behind its sunshield for optimal infrared observations.",
    target: { lat: 28.57, lng: -80.65, altitude: 2.0 },
    globeLayer: { type: "points", data: [{ lat: 28.57, lng: -80.65, label: "Launch site" }], pointColor: "#ffcc00", pointRadius: 0.6, pointAltitude: 0.15 },
  },
  {
    id: "ad-09", category: "Architecture", ageGroup: "adult", difficulty: "easy", icon: "\u{1F3D7}\uFE0F",
    question: "One World Trade Center stands at 1,776 feet. What does that number symbolize?",
    options: ["The number of victims", "Year of American independence", "Address on the street", "Cost in millions"],
    correctIndex: 1,
    explanation: "One WTC at 541 meters (1,776 feet) symbolizes the year of American independence, 1776. Built on the original Twin Towers site, it opened in 2014 as the tallest building in the Western Hemisphere.",
    target: { lat: 40.71, lng: -74.01, altitude: 0.8 },
    globeLayer: { type: "points", data: [{ lat: 40.71, lng: -74.01, label: "One WTC" }, { lat: 40.75, lng: -73.98, label: "Empire State" }], pointColor: "#3388ff", pointRadius: 0.5, pointAltitude: 0.05 },
  },
  {
    id: "ad-10", category: "Architecture", ageGroup: "adult", difficulty: "medium", icon: "\u{1F3D9}\uFE0F",
    question: "Taipei 101 has a 730-ton golden pendulum visible to visitors. What is it for?",
    options: ["Decoration", "Earthquake/typhoon stabilization (wind damper)", "Clock mechanism", "Art installation"],
    correctIndex: 1,
    explanation: "Taipei 101's massive wind damper (a tuned mass damper) stabilizes the building during typhoons and earthquakes. It is one of the few buildings where visitors can see the damper in action.",
    target: { lat: 25.03, lng: 121.56, altitude: 1.0 },
    globeLayer: { type: "points", data: [{ lat: 25.03, lng: 121.56, label: "Taipei 101" }], pointColor: "#00cc88", pointRadius: 0.7, pointAltitude: 0.07 },
  },
  {
    id: "ad-11", category: "Infrastructure", ageGroup: "adult", difficulty: "easy", icon: "\u{1F685}",
    question: "Japan's Shinkansen has operated 60+ years with zero fatal accidents. What is its average delay?",
    options: ["10 minutes", "5 minutes", "Less than 1 minute", "No delays ever"],
    correctIndex: 2,
    explanation: "Japan's Shinkansen averages delays of less than 1 minute. It runs 323 trains per day on the Tokaido line alone. If a train is more than 1 minute late, the conductor actually apologizes!",
    target: { lat: 35.68, lng: 139.69, altitude: 1.5 },
    globeLayer: { type: "arcs", data: [{ startLat: 35.68, startLng: 139.69, endLat: 34.69, endLng: 135.5 }], arcColor: "#00ccff" },
  },
  {
    id: "ad-12", category: "Infrastructure", ageGroup: "adult", difficulty: "medium", icon: "\u{1F682}",
    question: "The Trans-Siberian Railway is the world's longest at 9,289 km. How many time zones does it cross?",
    options: ["4", "6", "8", "11"],
    correctIndex: 2,
    explanation: "The Trans-Siberian Railway from Moscow to Vladivostok crosses 8 time zones. The full journey takes about 7 days. It was built between 1891 and 1916.",
    target: { lat: 55, lng: 90, altitude: 2.5 },
    globeLayer: { type: "arcs", data: [{ startLat: 55.75, startLng: 37.62, endLat: 43.12, endLng: 131.87 }], arcColor: "#ff6600" },
  },
  {
    id: "ad-13", category: "Environment", ageGroup: "adult", difficulty: "easy", icon: "\u{1F333}",
    question: "The Amazon produces about 6% of the world's oxygen. What percentage of all species call it home?",
    options: ["2%", "5%", "10%", "25%"],
    correctIndex: 2,
    explanation: "The Amazon is home to about 10% of all known species on Earth, spread across 5.5 million sq km. It's often called the 'Lungs of the Earth' - though that title is debated among scientists.",
    target: { lat: -3, lng: -60, altitude: 2.0 },
    globeLayer: { type: "points", data: [{ lat: -3.12, lng: -60.02, label: "Manaus" }, { lat: -1.46, lng: -48.5, label: "Belem" }], pointColor: "#22aa44", pointRadius: 0.5, pointAltitude: 0.03 },
  },
  {
    id: "ad-14", category: "Environment", ageGroup: "adult", difficulty: "medium", icon: "\u{1F321}\uFE0F",
    question: "The Indian Ocean is the warmest ocean. Why does this matter for weather patterns?",
    options: ["It doesn't affect weather", "It fuels cyclones in the region", "It cools nearby continents", "It causes droughts only"],
    correctIndex: 1,
    explanation: "The Indian Ocean's average surface temperature of 22C fuels powerful cyclones. Its tropical location between Africa, Asia, and Australia keeps most of its water in warm equatorial zones.",
    target: { lat: -10, lng: 70, altitude: 2.5 },
    globeLayer: { type: "points", data: [{ lat: -10, lng: 70, label: "Indian Ocean" }, { lat: 12, lng: 44, label: "Gulf of Aden" }], pointColor: "#ff6644", pointRadius: 0.5, pointAltitude: 0.02 },
  },
  {
    id: "ad-15", category: "Geography", ageGroup: "adult", difficulty: "medium", icon: "\u{1F9ED}",
    question: "The Prime Meridian passes through Greenwich, London. You can literally do what there?",
    options: ["See the International Date Line", "Stand with one foot in each hemisphere", "Touch the equator", "See both poles"],
    correctIndex: 1,
    explanation: "At the Royal Observatory in Greenwich, established in 1884, you can stand with one foot in the Eastern Hemisphere and one in the Western. Everything east is East longitude, west is West.",
    target: { lat: 51.48, lng: 0, altitude: 0.8 },
    globeLayer: { type: "points", data: [{ lat: 51.48, lng: 0, label: "Greenwich" }], pointColor: "#ffcc00", pointRadius: 0.7, pointAltitude: 0.06 },
  },
  {
    id: "ad-16", category: "Geography", ageGroup: "adult", difficulty: "easy", icon: "\u{1F3D9}\uFE0F",
    question: "Tokyo is the most populated metro area at 37 million. Which city is second?",
    options: ["Shanghai (29M)", "Delhi (32M)", "Sao Paulo (22M)", "Beijing (21M)"],
    correctIndex: 1,
    explanation: "Delhi NCR is the second largest with about 32 million people. Despite being the world's biggest metro, Tokyo is famous for its cleanliness and incredibly efficient public transit.",
    target: { lat: 35.68, lng: 139.69, altitude: 1.2 },
    globeLayer: { type: "points", data: [{ lat: 35.68, lng: 139.69, label: "Tokyo 37M" }, { lat: 28.61, lng: 77.21, label: "Delhi 32M" }], pointColor: "#ff6644", pointRadius: 0.6, pointAltitude: 0.05 },
  },
  {
    id: "ad-17", category: "Geography", ageGroup: "adult", difficulty: "medium", icon: "\u{1F3DE}\uFE0F",
    question: "Lake Superior is the largest freshwater lake by area. What percentage of global fresh surface water does it contain?",
    options: ["2%", "5%", "10%", "15%"],
    correctIndex: 2,
    explanation: "Lake Superior at 82,100 sq km contains 10% of all fresh surface water on Earth. It is shared between the US and Canada. (The Caspian Sea is bigger but is technically saltwater.)",
    target: { lat: 47.5, lng: -88, altitude: 1.2 },
    globeLayer: { type: "points", data: [{ lat: 47.5, lng: -88, label: "Lake Superior" }], pointColor: "#2288ff", pointRadius: 0.7, pointAltitude: 0.04 },
  },
  {
    id: "ad-18", category: "Geography", ageGroup: "adult", difficulty: "easy", icon: "\u{1F3DE}\uFE0F",
    question: "The Nile and Amazon rivers compete for the title of longest. How long is the Nile?",
    options: ["4,000 km", "5,500 km", "6,650 km", "8,000 km"],
    correctIndex: 2,
    explanation: "The Nile is traditionally measured at about 6,650 km, flowing through 11 African countries. Some scientists argue the Amazon (6,400 km) might be longer depending on how the source is measured.",
    target: { lat: 22, lng: 31, altitude: 2.5 },
    globeLayer: { type: "arcs", data: [{ startLat: -2.5, startLng: 29.5, endLat: 15.6, endLng: 32.53 }, { startLat: 15.6, startLng: 32.53, endLat: 31.2, endLng: 29.92 }], arcColor: "#4488ff" },
  },
  {
    id: "ad-19", category: "Technology", ageGroup: "adult", difficulty: "hard", icon: "\u{1F5A5}\uFE0F",
    question: "The Citadel Campus in Nevada is the world's largest data center at 7.2 million sq ft. Who operates it?",
    options: ["AWS", "Google", "Switch", "Microsoft"],
    correctIndex: 2,
    explanation: "The Citadel Campus in Tahoe Reno, Nevada, operated by Switch, is the world's largest data center campus. Nevada's dry climate and available solar/geothermal energy make it ideal.",
    target: { lat: 39.53, lng: -119.81, altitude: 1.2 },
    globeLayer: { type: "points", data: [{ lat: 39.53, lng: -119.81, label: "Citadel" }, { lat: 39.04, lng: -77.49, label: "Ashburn VA" }], pointColor: "#44cc88", pointRadius: 0.7, pointAltitude: 0.05 },
  },
  {
    id: "ad-20", category: "Technology", ageGroup: "adult", difficulty: "medium", icon: "\u{1F30D}",
    question: "Which country hosts the most undersea cable landing stations?",
    options: ["United States", "United Kingdom", "Singapore", "Japan"],
    correctIndex: 0,
    explanation: "The US has the most undersea cable landing stations with major hubs in New York, Miami, LA, and the Pacific Northwest. These cables carry 99% of international data traffic.",
    target: { lat: 38, lng: -97, altitude: 2.5 },
    globeLayer: { type: "arcs", data: [{ startLat: 40.71, startLng: -74.01, endLat: 51.51, endLng: -0.13 }, { startLat: 34.05, startLng: -118.24, endLat: 35.68, endLng: 139.69 }], arcColor: "#00aaff" },
  },
  {
    id: "ad-21", category: "Architecture", ageGroup: "adult", difficulty: "medium", icon: "\u{1F3D9}\uFE0F",
    question: "The Shanghai Tower's twisting design reduces wind loads by what percentage?",
    options: ["10%", "24%", "40%", "50%"],
    correctIndex: 1,
    explanation: "At 632 meters, the Shanghai Tower's twist reduces wind loads by 24%. It is the tallest in China and third tallest worldwide, with the world's highest observation deck in the Pudong district.",
    target: { lat: 31.24, lng: 121.5, altitude: 1.0 },
    globeLayer: { type: "points", data: [{ lat: 31.24, lng: 121.5, label: "Shanghai Tower 632m" }], pointColor: "#4488cc", pointRadius: 0.6, pointAltitude: 0.07 },
  },
  {
    id: "ad-22", category: "Geopolitics", ageGroup: "adult", difficulty: "easy", icon: "\u{1F1FA}\u{1F1F3}",
    question: "The UNHCR handles refugees and has won the Nobel Peace Prize. How many times?",
    options: ["Once (1954)", "Twice (1954 and 1981)", "Three times", "Never"],
    correctIndex: 1,
    explanation: "UNHCR (United Nations High Commissioner for Refugees) has won the Nobel Peace Prize twice - in 1954 and 1981. Established in 1950 in Geneva, it now protects over 117 million displaced people.",
    target: { lat: 46.23, lng: 6.15, altitude: 1.0 },
    globeLayer: { type: "points", data: [{ lat: 46.23, lng: 6.15, label: "UNHCR Geneva" }], pointColor: "#0072bc", pointRadius: 0.7, pointAltitude: 0.06 },
  },
]

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Combined Question Bank
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const QUESTIONS: QuizCard[] = [
  ...KINDERGARTEN_QUESTIONS,
  ...ELEMENTARY_QUESTIONS,
  ...SECONDARY_QUESTIONS,
  ...UNIVERSITY_QUESTIONS,
  ...ADULT_QUESTIONS,
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
   Kindergarten answer pastel colors
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const KG_PASTEL_COLORS = ["#ff6b9d", "#fbbf24", "#60a5fa", "#34d399"]

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Component
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export default function LearningPage() {
  /* -- State ---------------------------------------------------------- */
  const [ageGroup, setAgeGroup] = useState<AgeGroup | null>(null)
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

  /* -- Refs ----------------------------------------------------------- */
  const globeRef = useRef<HTMLDivElement>(null)
  const globeInst = useRef<any>(null)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  /* -- Build deck when ageGroup / category changes -------------------- */
  const filteredQuestions = useMemo(() => {
    if (!ageGroup) return []
    let qs = QUESTIONS.filter((q) => q.ageGroup === ageGroup)
    if (activeCategory !== "All") qs = qs.filter((q) => q.category === activeCategory)
    return qs
  }, [ageGroup, activeCategory])

  useEffect(() => {
    const newDeck = shuffle(filteredQuestions)
    setDeck(newDeck)
    setCardIndex(0)
    setSelected(null)
    setCorrect(false)
    setShowExplanation(false)
  }, [filteredQuestions])

  /* -- Current card --------------------------------------------------- */
  const card = deck[cardIndex] as QuizCard | undefined

  /* -- Mount flag ------------------------------------------------------ */
  useEffect(() => {
    setMounted(true)
  }, [])

  /* -- Init globe.gl -------------------------------------------------- */
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

  /* -- Resize handler ------------------------------------------------- */
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

  /* -- Update globe layers when card changes -------------------------- */
  useEffect(() => {
    const g = globeInst.current
    if (!g || !card) return

    const layer = card.globeLayer
    const catColor = CATEGORY_COLORS[card.category]

    g.atmosphereColor(catColor)

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

    g.pointOfView({ lat: 20, lng: 0, altitude: 2.5 }, 800)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card?.id])

  /* -- Answer handler ------------------------------------------------- */
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

  /* -- Navigation ----------------------------------------------------- */
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

  /* -- Touch / swipe -------------------------------------------------- */
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

  /* -- Keyboard nav --------------------------------------------------- */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") goTo("next")
      if (e.key === "ArrowLeft") goTo("prev")
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [goTo])

  /* -- Handle age group change (reset quiz state) --------------------- */
  const handleSelectAgeGroup = useCallback((ag: AgeGroup) => {
    setAgeGroup(ag)
    setActiveCategory("All")
    setScore(0)
    setAttempted(0)
    setCardIndex(0)
    setSelected(null)
    setCorrect(false)
    setShowExplanation(false)
  }, [])

  const handleChangeLevel = useCallback(() => {
    setAgeGroup(null)
    setScore(0)
    setAttempted(0)
  }, [])

  /* -- Current age group info ----------------------------------------- */
  const currentAgeGroupInfo = AGE_GROUPS.find((g) => g.key === ageGroup)
  const isKindergarten = ageGroup === "kindergarten"

  /* -- Render --------------------------------------------------------- */
  if (!mounted) return null

  /* ============ AGE GROUP SELECTION SCREEN ============ */
  if (ageGroup === null) {
    return (
      <div style={{ background: "linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #0a0a1a 100%)", minHeight: "100vh" }}>
        <style>{`
          @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
          @keyframes glow { 0%,100%{opacity:0.3} 50%{opacity:0.6} }
          .age-card {
            width: 200px; height: 180px; border-radius: 20px; cursor: pointer;
            display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
            border: 2px solid rgba(255,255,255,0.08); transition: all 0.3s ease;
            position: relative; overflow: hidden;
          }
          .age-card:hover { transform: scale(1.05); }
          @media (max-width: 640px) {
            .age-card { width: 160px; height: 150px; }
          }
        `}</style>

        {/* Header */}
        <div style={{ textAlign: "center", paddingTop: 60, paddingBottom: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 12, animation: "float 3s ease infinite" }}>
            {"\u{1F30D}"}
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#fff", margin: 0 }}>
            GRIP3D Learning
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 16, marginTop: 8, fontStyle: "italic" }}>
            Explore the World, One Card at a Time
          </p>
        </div>

        {/* Subtitle */}
        <p style={{ textAlign: "center", color: "rgba(255,255,255,0.7)", fontSize: 18, marginBottom: 32, fontWeight: 500 }}>
          Choose your learning level:
        </p>

        {/* Age group cards */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 16, maxWidth: 680, margin: "0 auto", padding: "0 16px" }}>
          {AGE_GROUPS.map((ag) => (
            <button
              key={ag.key}
              className="age-card"
              onClick={() => handleSelectAgeGroup(ag.key)}
              style={{ background: ag.bgGradient }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = ag.color
                e.currentTarget.style.boxShadow = `0 0 30px ${ag.color}44`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"
                e.currentTarget.style.boxShadow = "none"
              }}
            >
              <span style={{ fontSize: 40 }}>{ag.emoji}</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{ag.label}</span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{ag.subtitle}</span>
              <span style={{ fontSize: 11, color: ag.color, fontWeight: 600, marginTop: 2 }}>{ag.ages}</span>
            </button>
          ))}
        </div>

        {/* Bottom teaser */}
        <div style={{ textAlign: "center", padding: "48px 20px 40px", borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: 48 }}>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginBottom: 12 }}>
            {"\u{1F512}"} Free to explore today &mdash; personalized learning paths coming soon
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", maxWidth: 400, margin: "0 auto" }}>
            <input
              type="email"
              placeholder="Enter your email"
              disabled
              style={{
                flex: 1, padding: "10px 14px", borderRadius: 10,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.3)", fontSize: 14, outline: "none",
              }}
            />
            <button
              disabled
              style={{
                padding: "10px 20px", borderRadius: 10, fontWeight: 600, fontSize: 14,
                background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.3)", cursor: "not-allowed",
              }}
            >
              Notify me
            </button>
          </div>
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, marginTop: 8 }}>
            Coming Q3 2026 &mdash; Subscription plans, progress tracking, certificates
          </p>
        </div>
      </div>
    )
  }

  /* ============ QUIZ VIEW ============ */
  const catColor = card ? CATEGORY_COLORS[card.category] : "#33ccdd"
  const diffInfo = card ? DIFFICULTY_LABELS[card.difficulty] : DIFFICULTY_LABELS.easy
  const agModeLabel = ageGroup === "university" ? "\u{1F4DA} Study Mode" : ageGroup === "adult" ? "\u{1F9E0} Curiosity Mode" : null

  return (
    <div
      style={{ background: "var(--bg)", minHeight: "100vh" }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* -- Inline styles ------------------------------------------------ */}
      <style>{`
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
        @keyframes popIn { from{transform:scale(0.8);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes flyIn { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes confettiFall {
          0%{transform:translateY(-10px) rotate(0deg);opacity:1}
          100%{transform:translateY(120vh) rotate(720deg);opacity:0}
        }
        @keyframes starBurst {
          0%{transform:scale(0) rotate(0deg);opacity:1}
          50%{transform:scale(1.5) rotate(180deg);opacity:1}
          100%{transform:scale(2) rotate(360deg);opacity:0}
        }
        .shake-anim{animation:shake 0.4s ease}
        .pop-in{animation:popIn 0.35s ease}
        .fly-in{animation:flyIn 0.4s ease}
        .confetti-piece{position:fixed;top:-10px;width:8px;height:8px;border-radius:2px;animation:confettiFall 2.5s ease-out forwards;pointer-events:none;z-index:100}
        .star-burst{position:fixed;top:50%;left:50%;font-size:80px;animation:starBurst 1.5s ease-out forwards;pointer-events:none;z-index:100;transform-origin:center}
        ${isKindergarten ? `
          .kg-answer {
            width: 100%; padding: 16px 20px; border-radius: 16px; font-size: 18px; font-weight: 700;
            text-align: left; transition: all 0.2s ease; border: 2px solid transparent;
          }
          .kg-answer:hover { transform: scale(1.02); }
        ` : ""}
      `}</style>

      {/* -- Confetti / Star burst ---------------------------------------- */}
      {confetti && isKindergarten && (
        <div className="star-burst">{"\u2B50"}</div>
      )}
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

      {/* -- Header ------------------------------------------------------- */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1
                className={`font-bold ${isKindergarten ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"}`}
                style={{ color: "var(--text)" }}
              >
                GRIP3D Learning
              </h1>
              {agModeLabel && (
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: `${currentAgeGroupInfo?.color ?? "#fff"}22`, color: currentAgeGroupInfo?.color, border: `1px solid ${currentAgeGroupInfo?.color ?? "#fff"}44` }}>
                  {agModeLabel}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span style={{ fontSize: isKindergarten ? 20 : 16 }}>{currentAgeGroupInfo?.emoji}</span>
              <span className="text-sm font-medium" style={{ color: currentAgeGroupInfo?.color }}>
                {currentAgeGroupInfo?.label}
              </span>
              <button
                onClick={handleChangeLevel}
                className="text-xs px-2 py-0.5 rounded-md transition-colors duration-150"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--muted)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--text)"; e.currentTarget.style.color = "var(--text)" }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--muted)" }}
              >
                Change level
              </button>
            </div>
          </div>
          <div
            className="px-4 py-2 rounded-xl text-sm font-semibold"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              fontSize: isKindergarten ? 18 : 14,
            }}
          >
            Score: {score} / {attempted}
          </div>
        </div>

        {/* -- Category filter --------------------------------------------- */}
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

      {/* -- Card --------------------------------------------------------- */}
      {card && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-12">
          <div
            className="rounded-2xl overflow-hidden pop-in"
            style={{
              background: "var(--surface)",
              border: isKindergarten
                ? "2px solid transparent"
                : `1px solid ${catColor}33`,
              boxShadow: isKindergarten
                ? "0 0 0 2px #ff6b9d44, 0 0 0 4px #fbbf2444, 0 0 40px #ff6b9d15"
                : `0 0 40px ${catColor}15`,
              ...(isKindergarten ? { borderImage: "linear-gradient(135deg, #ff6b9d, #fbbf24, #60a5fa, #34d399) 1" } : {}),
            }}
          >
            {/* Category + difficulty badge */}
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{ borderBottom: `1px solid ${catColor}22` }}
            >
              <div className="flex items-center gap-2">
                <span className={isKindergarten ? "text-2xl" : "text-lg"}>{card.icon}</span>
                <span className={`font-medium ${isKindergarten ? "text-base" : "text-sm"}`} style={{ color: catColor }}>
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
                height: isKindergarten ? "min(60vw, 450px)" : "min(55vw, 420px)",
                background: "#000",
                cursor: "grab",
              }}
            />

            {/* Question */}
            <div className="px-5 pt-5 pb-3">
              <p
                className={`font-semibold fly-in ${isKindergarten ? "text-xl sm:text-2xl" : "text-base sm:text-lg"}`}
                style={{ color: "var(--text)" }}
              >
                {card.question}
              </p>
            </div>

            {/* Answer buttons */}
            {isKindergarten ? (
              /* Kindergarten: full-width, large, pastel buttons */
              <div className="flex flex-col gap-3 px-5 pb-4">
                {card.options.map((opt, i) => {
                  const isCorrectAnswer = i === card.correctIndex
                  const isSelected = selected === i
                  const isShaking = shakeIdx === i
                  const pastel = KG_PASTEL_COLORS[i % KG_PASTEL_COLORS.length]

                  let bg = `${pastel}18`
                  let borderColor = `${pastel}44`
                  let textColor = "var(--text)"

                  if (correct && isCorrectAnswer) {
                    bg = "#22c55e33"
                    borderColor = "#22c55e"
                    textColor = "#22c55e"
                  } else if (isShaking) {
                    bg = "#ef444433"
                    borderColor = "#ef4444"
                    textColor = "#ef4444"
                  } else if (correct && isSelected && !isCorrectAnswer) {
                    bg = "#ef444433"
                    borderColor = "#ef4444"
                    textColor = "#ef4444"
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => handleAnswer(i)}
                      disabled={correct}
                      className={`kg-answer ${isShaking ? "shake-anim" : ""}`}
                      style={{
                        background: bg,
                        border: `2px solid ${borderColor}`,
                        color: textColor,
                        cursor: correct ? "default" : "pointer",
                        opacity: correct && !isCorrectAnswer ? 0.4 : 1,
                      }}
                    >
                      {opt}
                      {correct && isCorrectAnswer && (
                        <span style={{ float: "right", fontSize: 24 }}>{"\u2B50"}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            ) : (
              /* Standard 2-column grid */
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
                          {"\u2713"}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Explanation */}
            {showExplanation && (
              <div
                className="mx-5 mb-5 p-4 rounded-xl fly-in"
                style={{
                  background: "var(--bg)",
                  borderLeft: `3px solid ${catColor}`,
                }}
              >
                <p className={`font-semibold mb-1 ${isKindergarten ? "text-sm" : "text-xs"}`} style={{ color: catColor }}>
                  {isKindergarten ? "Fun Fact! \u{1F31F}" : ageGroup === "elementary" ? "Great job! \u{1F389}" : "Did you know?"}
                </p>
                <p className={`leading-relaxed ${isKindergarten ? "text-base" : "text-sm"}`} style={{ color: "var(--muted)" }}>
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

      {/* -- Empty state -------------------------------------------------- */}
      {!card && deck.length === 0 && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
          <span className="text-5xl">{"\u{1F30D}"}</span>
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

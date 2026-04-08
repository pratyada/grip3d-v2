"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import Link from "next/link"
import { disposeGlobe } from "@/lib/globe-cleanup"

// ── Types ──────────────────────────────────────────────────────────────────────

type EraId =
  | "classical"
  | "roman-christian"
  | "islamic-golden"
  | "mongol-crusades"
  | "renaissance"
  | "exploration"
  | "enlightenment"
  | "industrial"
  | "world-wars"
  | "cold-war"
  | "decolonization"
  | "post-cold-war"
  | "modern"

type LayerType = "empires" | "religions" | "events" | "migrations"

interface HistoricalEra {
  id: EraId
  label: string
  period: string
  yearStart: number
  yearEnd: number
  color: string
  description: string
}

interface Empire {
  name: string
  era: EraId
  lat: number
  lng: number
  radius: number
  color: string
  peakPopulation?: string
  capital?: string
  yearStart: number
  yearEnd: number
}

interface ReligionSpread {
  religion: string
  era: EraId
  regions: { lat: number; lng: number; label: string; percentage: number }[]
  color: string
}

interface HistoricalEvent {
  title: string
  era: EraId
  year: number
  lat: number
  lng: number
  description: string
  type: "war" | "partition" | "revolution" | "treaty" | "formation" | "collapse" | "discovery"
  significance: "major" | "significant" | "notable"
}

interface MigrationFlow {
  label: string
  era: EraId
  fromLat: number
  fromLng: number
  toLat: number
  toLng: number
  people: string
  reason: string
  color: string
}

interface CountryFeature {
  type: "Feature"
  id: string
  properties: { name: string }
  geometry: any
}

// ── Color constants ────────────────────────────────────────────────────────────

const ERA_COLORS: Record<EraId, string> = {
  "classical":       "#c084fc",
  "roman-christian": "#f472b6",
  "islamic-golden":  "#34d399",
  "mongol-crusades": "#f59e0b",
  "renaissance":     "#60a5fa",
  "exploration":     "#fb923c",
  "enlightenment":   "#a78bfa",
  "industrial":      "#64748b",
  "world-wars":      "#ef4444",
  "cold-war":        "#3b82f6",
  "decolonization":  "#22c55e",
  "post-cold-war":   "#06b6d4",
  "modern":          "#f43f5e",
}

const RELIGION_COLORS: Record<string, string> = {
  "Christianity": "#60a5fa",
  "Islam":        "#34d399",
  "Hinduism":     "#f59e0b",
  "Buddhism":     "#a78bfa",
  "Judaism":      "#fbbf24",
  "Indigenous":   "#78716c",
  "Sikhism":      "#fb923c",
  "Secular":      "#94a3b8",
  "Zoroastrianism": "#f97316",
  "Greek Polytheism": "#c084fc",
  "Confucianism": "#facc15",
  "Shinto":       "#fb7185",
  "Protestantism": "#38bdf8",
  "Catholicism":   "#818cf8",
  "State Atheism": "#475569",
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  "war":         "#ef4444",
  "partition":   "#f97316",
  "revolution":  "#eab308",
  "treaty":      "#22c55e",
  "formation":   "#3b82f6",
  "collapse":    "#a855f7",
  "discovery":   "#06b6d4",
}

const LAYER_CONFIG: Record<LayerType, { label: string; icon: string; color: string }> = {
  empires:    { label: "Empires",    icon: "\u{1F3F0}", color: "#c084fc" },
  religions:  { label: "Religions",  icon: "\u{1F54C}", color: "#34d399" },
  events:     { label: "Events",     icon: "\u26A1",    color: "#ef4444" },
  migrations: { label: "Migrations", icon: "\u{1F6A2}", color: "#06b6d4" },
}

// ── Era data ───────────────────────────────────────────────────────────────────

const ERAS: HistoricalEra[] = [
  { id: "classical",       label: "Classical Antiquity",       period: "500 BC \u2013 0 AD",     yearStart: -500, yearEnd: 0,    color: ERA_COLORS["classical"],       description: "Greek city-states, the Persian Empire, Maurya India, Han China, and the Roman Republic shape the foundations of civilization." },
  { id: "roman-christian", label: "Rise of Christianity",     period: "0 \u2013 500 AD",         yearStart: 0,    yearEnd: 500,  color: ERA_COLORS["roman-christian"], description: "The Roman Empire at its zenith, the birth and spread of Christianity, the Gupta golden age in India, and the fall of Rome." },
  { id: "islamic-golden",  label: "Islamic Golden Age",       period: "500 \u2013 1000 AD",      yearStart: 500,  yearEnd: 1000, color: ERA_COLORS["islamic-golden"],  description: "The rapid spread of Islam, the Tang Dynasty, Byzantine resilience, Viking exploration, and Polynesian settlement of the Pacific." },
  { id: "mongol-crusades", label: "Mongol Empire & Crusades", period: "1000 \u2013 1300",        yearStart: 1000, yearEnd: 1300, color: ERA_COLORS["mongol-crusades"], description: "The largest contiguous land empire in history, the Crusades, Song Dynasty innovations, and the Delhi Sultanate." },
  { id: "renaissance",     label: "Renaissance & Ottoman Rise",period: "1300 \u2013 1500",       yearStart: 1300, yearEnd: 1500, color: ERA_COLORS["renaissance"],     description: "The Black Death reshapes Europe, Ottoman expansion, Ming Dynasty voyages, and Aztec and Inca civilizations at their peak." },
  { id: "exploration",     label: "Age of Exploration",       period: "1500 \u2013 1700",        yearStart: 1500, yearEnd: 1700, color: ERA_COLORS["exploration"],     description: "European maritime empires, the Protestant Reformation, Mughal India, and the beginning of the transatlantic slave trade." },
  { id: "enlightenment",   label: "Enlightenment & Colonies", period: "1700 \u2013 1800",        yearStart: 1700, yearEnd: 1800, color: ERA_COLORS["enlightenment"],   description: "Reason and revolution \u2014 the American and French Revolutions, the British Empire\u2019s rise, and the beginning of the Industrial Revolution." },
  { id: "industrial",      label: "Industrial Revolution",    period: "1800 \u2013 1900",        yearStart: 1800, yearEnd: 1900, color: ERA_COLORS["industrial"],      description: "Steam, steel, and empires \u2014 the Scramble for Africa, Napoleonic Wars, Meiji Japan, and the Great European Migration to the Americas." },
  { id: "world-wars",      label: "World Wars",               period: "1900 \u2013 1945",        yearStart: 1900, yearEnd: 1945, color: ERA_COLORS["world-wars"],      description: "Two devastating global conflicts, the Ottoman collapse, the Russian Revolution, the Holocaust, and the dawn of the atomic age." },
  { id: "cold-war",        label: "Cold War & Decolonization",period: "1945 \u2013 1970",        yearStart: 1945, yearEnd: 1970, color: ERA_COLORS["cold-war"],        description: "The USA\u2013USSR standoff, NATO vs Warsaw Pact, African and Asian independence movements, and the Space Race." },
  { id: "decolonization",  label: "Late Cold War",            period: "1970 \u2013 1991",        yearStart: 1970, yearEnd: 1991, color: ERA_COLORS["decolonization"],  description: "The Iranian Revolution, Soviet\u2013Afghan War, Fall of the Berlin Wall, and the dissolution of the Soviet Union." },
  { id: "post-cold-war",   label: "Post-Cold War",            period: "1991 \u2013 2010",        yearStart: 1991, yearEnd: 2010, color: ERA_COLORS["post-cold-war"],   description: "Globalization, the Yugoslav Wars, 9/11 and the War on Terror, China\u2019s economic rise, and EU expansion." },
  { id: "modern",          label: "Modern Era",               period: "2010 \u2013 2025",        yearStart: 2010, yearEnd: 2025, color: ERA_COLORS["modern"],          description: "The Arab Spring, Syrian Civil War, Brexit, COVID-19, Russia\u2013Ukraine War, and the global migration crisis." },
]

// ── Empire data (60+ empires) ──────────────────────────────────────────────────

const EMPIRES: Empire[] = [
  // Classical Antiquity
  { name: "Roman Republic",          era: "classical", lat: 41.9, lng: 12.5,  radius: 2.2, color: "#dc2626", peakPopulation: "~4M citizens", capital: "Rome",         yearStart: -509, yearEnd: -27 },
  { name: "Achaemenid Persia",       era: "classical", lat: 32.4, lng: 53.7,  radius: 3.0, color: "#f59e0b", peakPopulation: "~50M",         capital: "Persepolis",   yearStart: -550, yearEnd: -330 },
  { name: "Maurya Empire",           era: "classical", lat: 25.0, lng: 80.0,  radius: 2.5, color: "#34d399", peakPopulation: "~60M",         capital: "Pataliputra",  yearStart: -322, yearEnd: -185 },
  { name: "Han Dynasty",             era: "classical", lat: 34.0, lng: 109.0, radius: 2.8, color: "#ef4444", peakPopulation: "~60M",         capital: "Chang\u2019an",       yearStart: -206, yearEnd: 220 },
  { name: "Greek City-States",       era: "classical", lat: 38.0, lng: 23.7,  radius: 1.2, color: "#60a5fa", peakPopulation: "~8M total",    capital: "Athens/Sparta", yearStart: -500, yearEnd: -146 },
  { name: "Carthage",                era: "classical", lat: 36.8, lng: 10.2,  radius: 1.5, color: "#a855f7", peakPopulation: "~4M",          capital: "Carthage",     yearStart: -650, yearEnd: -146 },
  // Roman-Christian
  { name: "Roman Empire",            era: "roman-christian", lat: 41.9, lng: 12.5,  radius: 3.0, color: "#dc2626", peakPopulation: "~70M",    capital: "Rome/Constantinople", yearStart: -27,  yearEnd: 476 },
  { name: "Gupta Empire",            era: "roman-christian", lat: 25.3, lng: 82.0,  radius: 2.0, color: "#34d399", peakPopulation: "~30M",    capital: "Pataliputra",  yearStart: 320,  yearEnd: 550 },
  { name: "Sassanid Persia",         era: "roman-christian", lat: 32.7, lng: 52.5,  radius: 2.2, color: "#f59e0b", peakPopulation: "~25M",    capital: "Ctesiphon",    yearStart: 224,  yearEnd: 651 },
  { name: "Aksumite Empire",         era: "roman-christian", lat: 14.1, lng: 38.7,  radius: 1.3, color: "#22c55e", peakPopulation: "~5M",     capital: "Aksum",        yearStart: 100,  yearEnd: 940 },
  { name: "Kushan Empire",           era: "roman-christian", lat: 33.0, lng: 68.0,  radius: 1.8, color: "#06b6d4", peakPopulation: "~20M",    capital: "Peshawar",     yearStart: 30,   yearEnd: 375 },
  // Islamic Golden Age
  { name: "Umayyad Caliphate",       era: "islamic-golden", lat: 33.5, lng: 36.3,  radius: 3.5, color: "#34d399", peakPopulation: "~62M",    capital: "Damascus",     yearStart: 661,  yearEnd: 750 },
  { name: "Abbasid Caliphate",       era: "islamic-golden", lat: 33.3, lng: 44.4,  radius: 3.2, color: "#059669", peakPopulation: "~50M",    capital: "Baghdad",      yearStart: 750,  yearEnd: 1258 },
  { name: "Tang Dynasty",            era: "islamic-golden", lat: 34.3, lng: 108.9, radius: 2.8, color: "#ef4444", peakPopulation: "~80M",    capital: "Chang\u2019an",       yearStart: 618,  yearEnd: 907 },
  { name: "Byzantine Empire",        era: "islamic-golden", lat: 41.0, lng: 29.0,  radius: 2.0, color: "#a855f7", peakPopulation: "~26M",    capital: "Constantinople", yearStart: 330, yearEnd: 1453 },
  { name: "Carolingian Empire",      era: "islamic-golden", lat: 49.0, lng: 7.0,   radius: 1.8, color: "#3b82f6", peakPopulation: "~15M",    capital: "Aachen",       yearStart: 800,  yearEnd: 888 },
  { name: "Ghana Empire",            era: "islamic-golden", lat: 16.0, lng: -8.0,  radius: 1.5, color: "#fbbf24", peakPopulation: "~3M",     capital: "Koumbi Saleh", yearStart: 300,  yearEnd: 1200 },
  // Mongol-Crusades
  { name: "Mongol Empire",           era: "mongol-crusades", lat: 47.9, lng: 106.9, radius: 4.0, color: "#f59e0b", peakPopulation: "~110M", capital: "Karakorum",    yearStart: 1206, yearEnd: 1368 },
  { name: "Song Dynasty",            era: "mongol-crusades", lat: 30.3, lng: 120.2, radius: 2.0, color: "#ef4444", peakPopulation: "~120M", capital: "Hangzhou",     yearStart: 960,  yearEnd: 1279 },
  { name: "Holy Roman Empire",       era: "mongol-crusades", lat: 50.1, lng: 11.0,  radius: 1.8, color: "#fbbf24", peakPopulation: "~10M",  capital: "Various",      yearStart: 962,  yearEnd: 1806 },
  { name: "Delhi Sultanate",         era: "mongol-crusades", lat: 28.6, lng: 77.2,  radius: 2.0, color: "#22c55e", peakPopulation: "~25M",  capital: "Delhi",        yearStart: 1206, yearEnd: 1526 },
  { name: "Crusader States",         era: "mongol-crusades", lat: 31.8, lng: 35.2,  radius: 0.8, color: "#60a5fa", peakPopulation: "~1M",   capital: "Jerusalem",    yearStart: 1099, yearEnd: 1291 },
  { name: "Khmer Empire",            era: "mongol-crusades", lat: 13.4, lng: 103.9, radius: 1.5, color: "#a855f7", peakPopulation: "~2M",   capital: "Angkor",       yearStart: 802,  yearEnd: 1431 },
  // Renaissance
  { name: "Ottoman Empire",          era: "renaissance", lat: 41.0, lng: 29.0,  radius: 2.5, color: "#ef4444", peakPopulation: "~11M",  capital: "Constantinople", yearStart: 1299, yearEnd: 1922 },
  { name: "Ming Dynasty",            era: "renaissance", lat: 39.9, lng: 116.4, radius: 2.8, color: "#dc2626", peakPopulation: "~160M", capital: "Beijing",      yearStart: 1368, yearEnd: 1644 },
  { name: "Aztec Empire",            era: "renaissance", lat: 19.4, lng: -99.1, radius: 1.5, color: "#f59e0b", peakPopulation: "~5M",   capital: "Tenochtitlan", yearStart: 1428, yearEnd: 1521 },
  { name: "Inca Empire",             era: "renaissance", lat: -13.5, lng: -72.0, radius: 1.8, color: "#fbbf24", peakPopulation: "~12M", capital: "Cusco",        yearStart: 1438, yearEnd: 1533 },
  { name: "Vijayanagara Empire",     era: "renaissance", lat: 15.3, lng: 76.5,  radius: 1.5, color: "#34d399", peakPopulation: "~25M",  capital: "Vijayanagara", yearStart: 1336, yearEnd: 1646 },
  { name: "Majapahit",               era: "renaissance", lat: -7.3, lng: 112.7, radius: 1.5, color: "#06b6d4", peakPopulation: "~7M",   capital: "Trowulan",     yearStart: 1293, yearEnd: 1527 },
  { name: "Mali Empire",             era: "renaissance", lat: 14.0, lng: -5.0,  radius: 1.8, color: "#a855f7", peakPopulation: "~8M",   capital: "Niani",        yearStart: 1235, yearEnd: 1600 },
  // Exploration
  { name: "Spanish Empire",          era: "exploration", lat: 40.4, lng: -3.7,  radius: 3.0, color: "#f59e0b", peakPopulation: "~60M",  capital: "Madrid",       yearStart: 1492, yearEnd: 1898 },
  { name: "Portuguese Empire",       era: "exploration", lat: 38.7, lng: -9.1,  radius: 2.5, color: "#22c55e", peakPopulation: "~15M",  capital: "Lisbon",       yearStart: 1415, yearEnd: 1999 },
  { name: "Mughal Empire",           era: "exploration", lat: 28.6, lng: 77.2,  radius: 2.5, color: "#34d399", peakPopulation: "~150M", capital: "Agra/Delhi",   yearStart: 1526, yearEnd: 1857 },
  { name: "Qing Dynasty (early)",    era: "exploration", lat: 39.9, lng: 116.4, radius: 2.8, color: "#ef4444", peakPopulation: "~150M", capital: "Beijing",      yearStart: 1644, yearEnd: 1912 },
  { name: "Ottoman (Expansion)",     era: "exploration", lat: 41.0, lng: 29.0,  radius: 2.5, color: "#dc2626", peakPopulation: "~25M",  capital: "Constantinople", yearStart: 1453, yearEnd: 1683 },
  { name: "Safavid Persia",          era: "exploration", lat: 32.7, lng: 51.7,  radius: 1.8, color: "#a78bfa", peakPopulation: "~10M",  capital: "Isfahan",      yearStart: 1501, yearEnd: 1736 },
  // Enlightenment
  { name: "British Empire (rising)", era: "enlightenment", lat: 51.5, lng: -0.1,  radius: 2.5, color: "#ef4444", peakPopulation: "~20M UK", capital: "London",    yearStart: 1707, yearEnd: 1800 },
  { name: "French Empire",           era: "enlightenment", lat: 48.9, lng: 2.3,   radius: 2.0, color: "#3b82f6", peakPopulation: "~28M",    capital: "Paris",     yearStart: 1534, yearEnd: 1800 },
  { name: "Qing Dynasty (peak)",     era: "enlightenment", lat: 39.9, lng: 116.4, radius: 3.0, color: "#dc2626", peakPopulation: "~300M",   capital: "Beijing",   yearStart: 1700, yearEnd: 1800 },
  { name: "Russian Empire",          era: "enlightenment", lat: 55.8, lng: 37.6,  radius: 3.0, color: "#64748b", peakPopulation: "~35M",    capital: "St. Petersburg", yearStart: 1721, yearEnd: 1917 },
  { name: "Ottoman (declining)",     era: "enlightenment", lat: 41.0, lng: 29.0,  radius: 2.0, color: "#f59e0b", peakPopulation: "~25M",    capital: "Constantinople", yearStart: 1700, yearEnd: 1800 },
  { name: "Maratha Empire",          era: "enlightenment", lat: 18.9, lng: 73.8,  radius: 1.8, color: "#fb923c", peakPopulation: "~50M",    capital: "Pune",      yearStart: 1674, yearEnd: 1818 },
  // Industrial
  { name: "British Empire (peak)",   era: "industrial", lat: 51.5, lng: -0.1,  radius: 3.5, color: "#ef4444", peakPopulation: "~400M subjects", capital: "London", yearStart: 1800, yearEnd: 1900 },
  { name: "French Colonial Empire",  era: "industrial", lat: 48.9, lng: 2.3,   radius: 2.5, color: "#3b82f6", peakPopulation: "~70M",  capital: "Paris",       yearStart: 1800, yearEnd: 1900 },
  { name: "Russian Empire (exp.)",   era: "industrial", lat: 55.8, lng: 37.6,  radius: 3.0, color: "#64748b", peakPopulation: "~125M", capital: "St. Petersburg", yearStart: 1800, yearEnd: 1917 },
  { name: "German Empire",           era: "industrial", lat: 52.5, lng: 13.4,  radius: 1.5, color: "#475569", peakPopulation: "~65M",  capital: "Berlin",      yearStart: 1871, yearEnd: 1918 },
  { name: "Meiji Japan",             era: "industrial", lat: 35.7, lng: 139.7, radius: 1.5, color: "#dc2626", peakPopulation: "~44M",  capital: "Tokyo",       yearStart: 1868, yearEnd: 1912 },
  { name: "Qing Dynasty (decline)",  era: "industrial", lat: 39.9, lng: 116.4, radius: 2.5, color: "#b91c1c", peakPopulation: "~400M", capital: "Beijing",     yearStart: 1800, yearEnd: 1912 },
  { name: "Ottoman (late)",          era: "industrial", lat: 41.0, lng: 29.0,  radius: 1.5, color: "#f59e0b", peakPopulation: "~26M",  capital: "Constantinople", yearStart: 1800, yearEnd: 1900 },
  // World Wars
  { name: "British Empire (WW)",     era: "world-wars", lat: 51.5, lng: -0.1,  radius: 3.5, color: "#ef4444", peakPopulation: "~530M", capital: "London",      yearStart: 1900, yearEnd: 1945 },
  { name: "French Empire (WW)",      era: "world-wars", lat: 48.9, lng: 2.3,   radius: 2.5, color: "#3b82f6", peakPopulation: "~110M", capital: "Paris",       yearStart: 1900, yearEnd: 1945 },
  { name: "Nazi Germany",            era: "world-wars", lat: 52.5, lng: 13.4,  radius: 2.0, color: "#1e1e1e", peakPopulation: "~80M",  capital: "Berlin",      yearStart: 1933, yearEnd: 1945 },
  { name: "Japanese Empire",         era: "world-wars", lat: 35.7, lng: 139.7, radius: 2.5, color: "#dc2626", peakPopulation: "~130M", capital: "Tokyo",       yearStart: 1895, yearEnd: 1945 },
  { name: "Soviet Union (forming)",  era: "world-wars", lat: 55.8, lng: 37.6,  radius: 3.0, color: "#b91c1c", peakPopulation: "~170M", capital: "Moscow",      yearStart: 1922, yearEnd: 1945 },
  { name: "Ottoman/Turkey",          era: "world-wars", lat: 39.9, lng: 32.9,  radius: 1.2, color: "#f59e0b", peakPopulation: "~13M",  capital: "Ankara",      yearStart: 1900, yearEnd: 1945 },
  // Cold War
  { name: "United States",           era: "cold-war", lat: 38.9, lng: -77.0, radius: 3.0, color: "#3b82f6", peakPopulation: "~200M", capital: "Washington", yearStart: 1945, yearEnd: 1970 },
  { name: "Soviet Union",            era: "cold-war", lat: 55.8, lng: 37.6,  radius: 3.5, color: "#ef4444", peakPopulation: "~240M", capital: "Moscow",     yearStart: 1945, yearEnd: 1970 },
  { name: "People\u2019s Rep. China",       era: "cold-war", lat: 39.9, lng: 116.4, radius: 2.8, color: "#dc2626", peakPopulation: "~700M", capital: "Beijing",    yearStart: 1949, yearEnd: 1970 },
  { name: "British Empire (end)",    era: "cold-war", lat: 51.5, lng: -0.1,  radius: 2.0, color: "#f472b6", peakPopulation: "declining", capital: "London",  yearStart: 1945, yearEnd: 1970 },
  { name: "French Union",            era: "cold-war", lat: 48.9, lng: 2.3,   radius: 1.8, color: "#818cf8", peakPopulation: "~80M",  capital: "Paris",      yearStart: 1946, yearEnd: 1958 },
  // Decolonization / Late Cold War
  { name: "Soviet Union (late)",     era: "decolonization", lat: 55.8, lng: 37.6,  radius: 3.5, color: "#ef4444", peakPopulation: "~290M", capital: "Moscow",     yearStart: 1970, yearEnd: 1991 },
  { name: "United States (CW)",      era: "decolonization", lat: 38.9, lng: -77.0, radius: 3.0, color: "#3b82f6", peakPopulation: "~250M", capital: "Washington", yearStart: 1970, yearEnd: 1991 },
  { name: "PRC (Deng era)",          era: "decolonization", lat: 39.9, lng: 116.4, radius: 2.8, color: "#dc2626", peakPopulation: "~1.1B", capital: "Beijing",    yearStart: 1978, yearEnd: 1991 },
  { name: "European Community",      era: "decolonization", lat: 50.8, lng: 4.4,   radius: 1.5, color: "#3b82f6", peakPopulation: "~340M", capital: "Brussels",   yearStart: 1967, yearEnd: 1993 },
  // Post-Cold War
  { name: "United States (sole)",    era: "post-cold-war", lat: 38.9, lng: -77.0, radius: 3.0, color: "#3b82f6", peakPopulation: "~310M", capital: "Washington", yearStart: 1991, yearEnd: 2010 },
  { name: "European Union",          era: "post-cold-war", lat: 50.8, lng: 4.4,   radius: 2.0, color: "#2563eb", peakPopulation: "~500M", capital: "Brussels",   yearStart: 1993, yearEnd: 2010 },
  { name: "PRC (rising)",            era: "post-cold-war", lat: 39.9, lng: 116.4, radius: 2.8, color: "#dc2626", peakPopulation: "~1.3B", capital: "Beijing",    yearStart: 1991, yearEnd: 2010 },
  { name: "Russian Federation",      era: "post-cold-war", lat: 55.8, lng: 37.6,  radius: 2.5, color: "#64748b", peakPopulation: "~145M", capital: "Moscow",     yearStart: 1991, yearEnd: 2010 },
  { name: "India (liberalized)",     era: "post-cold-war", lat: 28.6, lng: 77.2,  radius: 2.0, color: "#f59e0b", peakPopulation: "~1.1B", capital: "New Delhi",  yearStart: 1991, yearEnd: 2010 },
  // Modern
  { name: "United States",           era: "modern", lat: 38.9, lng: -77.0, radius: 3.0, color: "#3b82f6", peakPopulation: "~330M", capital: "Washington", yearStart: 2010, yearEnd: 2025 },
  { name: "PRC (superpower)",        era: "modern", lat: 39.9, lng: 116.4, radius: 3.0, color: "#dc2626", peakPopulation: "~1.4B", capital: "Beijing",    yearStart: 2010, yearEnd: 2025 },
  { name: "European Union",          era: "modern", lat: 50.8, lng: 4.4,   radius: 2.0, color: "#2563eb", peakPopulation: "~450M", capital: "Brussels",   yearStart: 2010, yearEnd: 2025 },
  { name: "India (rising)",          era: "modern", lat: 28.6, lng: 77.2,  radius: 2.2, color: "#f59e0b", peakPopulation: "~1.4B", capital: "New Delhi",  yearStart: 2010, yearEnd: 2025 },
  { name: "Russian Federation",      era: "modern", lat: 55.8, lng: 37.6,  radius: 2.5, color: "#64748b", peakPopulation: "~144M", capital: "Moscow",     yearStart: 2010, yearEnd: 2025 },
]

// ── Religion data ──────────────────────────────────────────────────────────────

const RELIGIONS: ReligionSpread[] = [
  // Classical
  { religion: "Greek Polytheism", era: "classical", color: RELIGION_COLORS["Greek Polytheism"], regions: [{ lat: 38.0, lng: 23.7, label: "Greece", percentage: 95 }, { lat: 37.0, lng: 15.0, label: "Sicily", percentage: 70 }, { lat: 38.5, lng: 28.0, label: "Ionia", percentage: 85 }] },
  { religion: "Hinduism",   era: "classical", color: RELIGION_COLORS["Hinduism"],   regions: [{ lat: 25.0, lng: 80.0, label: "India", percentage: 90 }, { lat: 7.0, lng: 80.0, label: "Sri Lanka", percentage: 60 }] },
  { religion: "Buddhism",   era: "classical", color: RELIGION_COLORS["Buddhism"],   regions: [{ lat: 25.6, lng: 85.1, label: "Magadha", percentage: 30 }, { lat: 27.7, lng: 85.3, label: "Nepal", percentage: 25 }] },
  { religion: "Zoroastrianism", era: "classical", color: RELIGION_COLORS["Zoroastrianism"], regions: [{ lat: 32.4, lng: 53.7, label: "Persia", percentage: 85 }, { lat: 38.0, lng: 58.0, label: "Central Asia", percentage: 40 }] },
  { religion: "Judaism",    era: "classical", color: RELIGION_COLORS["Judaism"],    regions: [{ lat: 31.8, lng: 35.2, label: "Judea", percentage: 90 }, { lat: 31.2, lng: 29.9, label: "Alexandria", percentage: 15 }] },
  // Roman-Christian
  { religion: "Christianity", era: "roman-christian", color: RELIGION_COLORS["Christianity"], regions: [{ lat: 31.8, lng: 35.2, label: "Jerusalem", percentage: 30 }, { lat: 41.9, lng: 12.5, label: "Rome", percentage: 40 }, { lat: 41.0, lng: 29.0, label: "Byzantium", percentage: 50 }, { lat: 30.0, lng: 31.2, label: "Egypt", percentage: 35 }] },
  { religion: "Hinduism",   era: "roman-christian", color: RELIGION_COLORS["Hinduism"],   regions: [{ lat: 25.0, lng: 80.0, label: "India", percentage: 85 }, { lat: 2.0, lng: 105.0, label: "SE Asia", percentage: 20 }] },
  { religion: "Buddhism",   era: "roman-christian", color: RELIGION_COLORS["Buddhism"],   regions: [{ lat: 34.0, lng: 109.0, label: "China", percentage: 15 }, { lat: 25.0, lng: 80.0, label: "India", percentage: 25 }, { lat: 7.0, lng: 80.0, label: "Sri Lanka", percentage: 70 }] },
  // Islamic Golden Age
  { religion: "Islam",        era: "islamic-golden", color: RELIGION_COLORS["Islam"],        regions: [{ lat: 21.4, lng: 39.8, label: "Arabia", percentage: 95 }, { lat: 33.3, lng: 44.4, label: "Iraq", percentage: 80 }, { lat: 30.0, lng: 31.2, label: "Egypt", percentage: 60 }, { lat: 37.0, lng: -4.0, label: "Al-Andalus", percentage: 50 }, { lat: 34.0, lng: 2.0, label: "North Africa", percentage: 70 }] },
  { religion: "Christianity", era: "islamic-golden", color: RELIGION_COLORS["Christianity"], regions: [{ lat: 48.9, lng: 2.3, label: "France", percentage: 95 }, { lat: 52.5, lng: -1.5, label: "England", percentage: 90 }, { lat: 41.0, lng: 29.0, label: "Byzantium", percentage: 85 }] },
  { religion: "Buddhism",     era: "islamic-golden", color: RELIGION_COLORS["Buddhism"],     regions: [{ lat: 34.0, lng: 109.0, label: "China", percentage: 30 }, { lat: 13.7, lng: 100.5, label: "SE Asia", percentage: 50 }, { lat: 35.7, lng: 139.7, label: "Japan", percentage: 40 }] },
  // Mongol-Crusades
  { religion: "Islam",        era: "mongol-crusades", color: RELIGION_COLORS["Islam"],        regions: [{ lat: 33.3, lng: 44.4, label: "Middle East", percentage: 90 }, { lat: 28.6, lng: 77.2, label: "N. India", percentage: 35 }, { lat: 34.0, lng: 2.0, label: "N. Africa", percentage: 85 }] },
  { religion: "Christianity", era: "mongol-crusades", color: RELIGION_COLORS["Christianity"], regions: [{ lat: 48.9, lng: 2.3, label: "W. Europe", percentage: 95 }, { lat: 55.8, lng: 37.6, label: "Russia", percentage: 85 }] },
  { religion: "Buddhism",     era: "mongol-crusades", color: RELIGION_COLORS["Buddhism"],     regions: [{ lat: 13.4, lng: 103.9, label: "Cambodia", percentage: 80 }, { lat: 16.9, lng: 96.2, label: "Myanmar", percentage: 85 }, { lat: 35.7, lng: 139.7, label: "Japan", percentage: 60 }] },
  // Renaissance
  { religion: "Christianity", era: "renaissance", color: RELIGION_COLORS["Christianity"], regions: [{ lat: 48.9, lng: 2.3, label: "Catholic Europe", percentage: 95 }, { lat: 41.0, lng: 29.0, label: "Orthodox East", percentage: 90 }] },
  { religion: "Islam",        era: "renaissance", color: RELIGION_COLORS["Islam"],        regions: [{ lat: 41.0, lng: 29.0, label: "Ottoman lands", percentage: 85 }, { lat: 28.6, lng: 77.2, label: "N. India", percentage: 45 }] },
  { religion: "Indigenous",   era: "renaissance", color: RELIGION_COLORS["Indigenous"],   regions: [{ lat: 19.4, lng: -99.1, label: "Aztec Mexico", percentage: 95 }, { lat: -13.5, lng: -72.0, label: "Inca Peru", percentage: 95 }] },
  // Exploration
  { religion: "Protestantism", era: "exploration", color: RELIGION_COLORS["Protestantism"], regions: [{ lat: 52.5, lng: 13.4, label: "Germany", percentage: 40 }, { lat: 52.5, lng: -1.5, label: "England", percentage: 70 }, { lat: 59.3, lng: 18.1, label: "Scandinavia", percentage: 85 }] },
  { religion: "Catholicism",   era: "exploration", color: RELIGION_COLORS["Catholicism"],   regions: [{ lat: 40.4, lng: -3.7, label: "Spain", percentage: 98 }, { lat: 48.9, lng: 2.3, label: "France", percentage: 90 }, { lat: 19.4, lng: -99.1, label: "New Spain", percentage: 75 }] },
  { religion: "Islam",         era: "exploration", color: RELIGION_COLORS["Islam"],         regions: [{ lat: 3.1, lng: 101.7, label: "Malay Pen.", percentage: 60 }, { lat: -7.3, lng: 112.7, label: "Java", percentage: 50 }] },
  // Enlightenment
  { religion: "Christianity", era: "enlightenment", color: RELIGION_COLORS["Christianity"], regions: [{ lat: 48.9, lng: 2.3, label: "Europe", percentage: 90 }, { lat: 38.9, lng: -77.0, label: "Americas", percentage: 85 }] },
  { religion: "Secular",      era: "enlightenment", color: RELIGION_COLORS["Secular"],      regions: [{ lat: 48.9, lng: 2.3, label: "France", percentage: 20 }, { lat: 52.5, lng: -1.5, label: "Britain", percentage: 10 }] },
  { religion: "Islam",        era: "enlightenment", color: RELIGION_COLORS["Islam"],        regions: [{ lat: 41.0, lng: 29.0, label: "Ottoman", percentage: 85 }, { lat: 28.6, lng: 77.2, label: "Mughal India", percentage: 40 }] },
  // Industrial
  { religion: "Christianity", era: "industrial", color: RELIGION_COLORS["Christianity"], regions: [{ lat: 48.9, lng: 2.3, label: "Europe", percentage: 88 }, { lat: 38.9, lng: -77.0, label: "Americas", percentage: 90 }, { lat: -1.3, lng: 36.8, label: "E. Africa (missions)", percentage: 15 }] },
  { religion: "Hinduism",     era: "industrial", color: RELIGION_COLORS["Hinduism"],     regions: [{ lat: 25.0, lng: 80.0, label: "India (reform)", percentage: 75 }] },
  { religion: "Islam",        era: "industrial", color: RELIGION_COLORS["Islam"],        regions: [{ lat: 33.3, lng: 44.4, label: "Middle East", percentage: 90 }, { lat: 3.1, lng: 101.7, label: "SE Asia", percentage: 55 }] },
  // World Wars
  { religion: "Christianity", era: "world-wars", color: RELIGION_COLORS["Christianity"], regions: [{ lat: 48.9, lng: 2.3, label: "Europe", percentage: 85 }, { lat: 38.9, lng: -77.0, label: "Americas", percentage: 90 }] },
  { religion: "Secular",      era: "world-wars", color: RELIGION_COLORS["Secular"],      regions: [{ lat: 55.8, lng: 37.6, label: "Soviet Union", percentage: 30 }] },
  { religion: "Islam",        era: "world-wars", color: RELIGION_COLORS["Islam"],        regions: [{ lat: 33.3, lng: 44.4, label: "Middle East", percentage: 92 }] },
  // Cold War
  { religion: "Christianity", era: "cold-war", color: RELIGION_COLORS["Christianity"], regions: [{ lat: 38.9, lng: -77.0, label: "West", percentage: 85 }, { lat: -1.3, lng: 36.8, label: "Africa (growing)", percentage: 35 }] },
  { religion: "State Atheism", era: "cold-war", color: RELIGION_COLORS["State Atheism"], regions: [{ lat: 55.8, lng: 37.6, label: "USSR", percentage: 60 }, { lat: 39.9, lng: 116.4, label: "China", percentage: 70 }] },
  { religion: "Hinduism",     era: "cold-war", color: RELIGION_COLORS["Hinduism"],     regions: [{ lat: 25.0, lng: 80.0, label: "India", percentage: 80 }] },
  // Decolonization
  { religion: "Islam",        era: "decolonization", color: RELIGION_COLORS["Islam"],        regions: [{ lat: 35.7, lng: 51.4, label: "Iran (rev.)", percentage: 98 }, { lat: 33.3, lng: 44.4, label: "Middle East", percentage: 92 }] },
  { religion: "Christianity", era: "decolonization", color: RELIGION_COLORS["Christianity"], regions: [{ lat: -1.3, lng: 36.8, label: "Africa", percentage: 45 }, { lat: -23.5, lng: -46.6, label: "Latin America", percentage: 90 }] },
  { religion: "State Atheism", era: "decolonization", color: RELIGION_COLORS["State Atheism"], regions: [{ lat: 55.8, lng: 37.6, label: "USSR", percentage: 55 }, { lat: 39.9, lng: 116.4, label: "China", percentage: 65 }] },
  // Post-Cold War
  { religion: "Islam",        era: "post-cold-war", color: RELIGION_COLORS["Islam"],        regions: [{ lat: 33.3, lng: 44.4, label: "Middle East", percentage: 93 }, { lat: 3.1, lng: 101.7, label: "SE Asia", percentage: 60 }, { lat: 9.0, lng: 7.5, label: "W. Africa", percentage: 50 }] },
  { religion: "Christianity", era: "post-cold-war", color: RELIGION_COLORS["Christianity"], regions: [{ lat: -1.3, lng: 36.8, label: "Africa (growing)", percentage: 50 }, { lat: -23.5, lng: -46.6, label: "Latin America", percentage: 85 }] },
  { religion: "Hinduism",     era: "post-cold-war", color: RELIGION_COLORS["Hinduism"],     regions: [{ lat: 25.0, lng: 80.0, label: "India", percentage: 80 }] },
  // Modern
  { religion: "Islam",        era: "modern", color: RELIGION_COLORS["Islam"],        regions: [{ lat: 33.3, lng: 44.4, label: "Middle East", percentage: 93 }, { lat: 48.9, lng: 2.3, label: "Europe (growing)", percentage: 8 }] },
  { religion: "Christianity", era: "modern", color: RELIGION_COLORS["Christianity"], regions: [{ lat: -1.3, lng: 36.8, label: "Global South", percentage: 55 }, { lat: 48.9, lng: 2.3, label: "Europe (declining)", percentage: 65 }] },
  { religion: "Secular",      era: "modern", color: RELIGION_COLORS["Secular"],      regions: [{ lat: 48.9, lng: 2.3, label: "W. Europe", percentage: 30 }, { lat: 38.9, lng: -77.0, label: "USA (rising)", percentage: 25 }] },
  { religion: "Hinduism",     era: "modern", color: RELIGION_COLORS["Hinduism"],     regions: [{ lat: 25.0, lng: 80.0, label: "India", percentage: 80 }] },
]

// ── Historical events (80+ events) ─────────────────────────────────────────────

const EVENTS: HistoricalEvent[] = [
  // Classical
  { title: "Battle of Thermopylae",     era: "classical", year: -480, lat: 38.8, lng: 22.5,  description: "300 Spartans and Greek allies hold the pass against the Persian invasion under Xerxes I.", type: "war", significance: "major" },
  { title: "Alexander Conquers Persia", era: "classical", year: -334, lat: 36.2, lng: 36.2,  description: "Alexander the Great defeats Darius III and creates the largest empire the Western world had seen.", type: "war", significance: "major" },
  { title: "Ashoka\u2019s Conversion",         era: "classical", year: -260, lat: 20.5, lng: 86.0,  description: "After the bloody Kalinga War, Maurya Emperor Ashoka converts to Buddhism and spreads it across Asia.", type: "revolution", significance: "major" },
  { title: "Assassination of Julius Caesar", era: "classical", year: -44, lat: 41.9, lng: 12.5, description: "Roman senators assassinate Caesar on the Ides of March, triggering the end of the Roman Republic.", type: "revolution", significance: "major" },
  { title: "Battle of Marathon",        era: "classical", year: -490, lat: 38.1, lng: 23.9,  description: "Athenian victory over the first Persian invasion, preserving Greek independence.", type: "war", significance: "significant" },
  { title: "Founding of Rome",          era: "classical", year: -753, lat: 41.9, lng: 12.5,  description: "Traditional founding date of Rome by Romulus.", type: "formation", significance: "notable" },
  { title: "Punic Wars Begin",          era: "classical", year: -264, lat: 36.8, lng: 10.2,  description: "Rome and Carthage begin their century-long struggle for Mediterranean dominance.", type: "war", significance: "significant" },
  // Roman-Christian
  { title: "Crucifixion of Jesus",      era: "roman-christian", year: 33,  lat: 31.8, lng: 35.2,  description: "The crucifixion of Jesus of Nazareth in Jerusalem, foundational event for Christianity.", type: "revolution", significance: "major" },
  { title: "Fall of Rome",              era: "roman-christian", year: 476, lat: 41.9, lng: 12.5,  description: "Germanic chieftain Odoacer deposes the last Western Roman Emperor, Romulus Augustulus.", type: "collapse", significance: "major" },
  { title: "Constantine\u2019s Conversion",    era: "roman-christian", year: 312, lat: 41.9, lng: 12.5,  description: "Emperor Constantine converts to Christianity before the Battle of the Milvian Bridge.", type: "revolution", significance: "major" },
  { title: "Council of Nicaea",         era: "roman-christian", year: 325, lat: 40.4, lng: 29.7,  description: "First ecumenical council establishes core Christian doctrine including the Nicene Creed.", type: "treaty", significance: "significant" },
  { title: "Edict of Milan",            era: "roman-christian", year: 313, lat: 45.5, lng: 9.2,   description: "Constantine and Licinius proclaim religious tolerance, ending persecution of Christians.", type: "treaty", significance: "significant" },
  { title: "Sack of Rome by Visigoths", era: "roman-christian", year: 410, lat: 41.9, lng: 12.5,  description: "Alaric\u2019s Visigoths sack Rome for the first time in 800 years.", type: "war", significance: "significant" },
  // Islamic Golden Age
  { title: "Birth of Islam",            era: "islamic-golden", year: 610, lat: 21.4, lng: 39.8,  description: "Prophet Muhammad receives the first revelations of the Quran in Mecca.", type: "formation", significance: "major" },
  { title: "Battle of Tours",           era: "islamic-golden", year: 732, lat: 46.8, lng: 0.7,   description: "Frankish leader Charles Martel halts the Umayyad advance into Western Europe.", type: "war", significance: "major" },
  { title: "Viking Age Begins",         era: "islamic-golden", year: 793, lat: 54.7, lng: -1.3,  description: "Vikings raid Lindisfarne monastery, marking the start of the Viking expansion.", type: "war", significance: "significant" },
  { title: "Foundation of Baghdad",     era: "islamic-golden", year: 762, lat: 33.3, lng: 44.4,  description: "Abbasid Caliph al-Mansur founds Baghdad, which becomes the world\u2019s largest city.", type: "formation", significance: "significant" },
  { title: "Hijra to Medina",           era: "islamic-golden", year: 622, lat: 24.5, lng: 39.6,  description: "Muhammad\u2019s migration from Mecca to Medina, year one of the Islamic calendar.", type: "formation", significance: "major" },
  { title: "Charlemagne Crowned",       era: "islamic-golden", year: 800, lat: 41.9, lng: 12.5,  description: "Pope Leo III crowns Charlemagne as Emperor, reviving the concept of a Western Roman Empire.", type: "formation", significance: "significant" },
  // Mongol-Crusades
  { title: "First Crusade",             era: "mongol-crusades", year: 1096, lat: 31.8, lng: 35.2,  description: "European knights capture Jerusalem, establishing Crusader states in the Levant.", type: "war", significance: "major" },
  { title: "Genghis Khan Unifies Mongols", era: "mongol-crusades", year: 1206, lat: 47.9, lng: 106.9, description: "Temujin is proclaimed Genghis Khan, beginning the Mongol conquest of Eurasia.", type: "formation", significance: "major" },
  { title: "Magna Carta",               era: "mongol-crusades", year: 1215, lat: 51.4, lng: -0.6,  description: "English barons force King John to sign the Magna Carta, a cornerstone of constitutional law.", type: "treaty", significance: "major" },
  { title: "Fall of Baghdad",           era: "mongol-crusades", year: 1258, lat: 33.3, lng: 44.4,  description: "Mongol forces under Hulagu destroy Baghdad, ending the Abbasid Caliphate.", type: "collapse", significance: "major" },
  { title: "Battle of Ain Jalut",       era: "mongol-crusades", year: 1260, lat: 32.5, lng: 35.3,  description: "Mamluks defeat the Mongols, halting their westward expansion.", type: "war", significance: "significant" },
  { title: "Fourth Crusade sacks Constantinople", era: "mongol-crusades", year: 1204, lat: 41.0, lng: 29.0, description: "Crusaders sack the Christian city of Constantinople, fatally weakening Byzantium.", type: "war", significance: "significant" },
  // Renaissance
  { title: "Black Death Reaches Europe",era: "renaissance", year: 1347, lat: 43.3, lng: 5.4,   description: "The plague arrives in Messina and spreads across Europe, killing 30\u201360% of the population.", type: "collapse", significance: "major" },
  { title: "Fall of Constantinople",    era: "renaissance", year: 1453, lat: 41.0, lng: 29.0,  description: "Ottoman Sultan Mehmed II conquers Constantinople, ending the Byzantine Empire.", type: "war", significance: "major" },
  { title: "Gutenberg Printing Press",  era: "renaissance", year: 1440, lat: 50.0, lng: 8.3,   description: "Johannes Gutenberg develops movable-type printing, revolutionizing information spread.", type: "discovery", significance: "major" },
  { title: "Columbus Reaches Americas", era: "renaissance", year: 1492, lat: 24.0, lng: -74.5, description: "Christopher Columbus reaches the Bahamas, beginning sustained European contact with the Americas.", type: "discovery", significance: "major" },
  { title: "Vasco da Gama Reaches India",era: "renaissance", year: 1498, lat: 11.3, lng: 75.8, description: "Portuguese navigator reaches Calicut, opening the sea route from Europe to India.", type: "discovery", significance: "significant" },
  { title: "Reconquista Complete",      era: "renaissance", year: 1492, lat: 37.2, lng: -3.6,  description: "Ferdinand and Isabella capture Granada, completing the Christian reconquest of Iberia.", type: "war", significance: "significant" },
  // Exploration
  { title: "Martin Luther\u2019s 95 Theses", era: "exploration", year: 1517, lat: 51.9, lng: 12.7, description: "Luther posts his 95 Theses in Wittenberg, sparking the Protestant Reformation.", type: "revolution", significance: "major" },
  { title: "Spanish Conquest of Aztecs",era: "exploration", year: 1521, lat: 19.4, lng: -99.1, description: "Hern\u00e1n Cort\u00e9s and allies conquer Tenochtitlan, ending the Aztec Empire.", type: "war", significance: "major" },
  { title: "Mughal Empire Founded",     era: "exploration", year: 1526, lat: 28.6, lng: 77.2,  description: "Babur defeats the Delhi Sultanate at Panipat, founding the Mughal dynasty.", type: "formation", significance: "major" },
  { title: "Galileo\u2019s Telescope",         era: "exploration", year: 1609, lat: 43.8, lng: 11.3,  description: "Galileo observes the heavens with a telescope, confirming the heliocentric model.", type: "discovery", significance: "significant" },
  { title: "Peace of Westphalia",       era: "exploration", year: 1648, lat: 52.0, lng: 7.6,   description: "Treaties ending the Thirty Years\u2019 War, establishing the modern concept of state sovereignty.", type: "treaty", significance: "major" },
  { title: "Spanish Armada Defeated",   era: "exploration", year: 1588, lat: 50.3, lng: -4.1,  description: "England defeats Spain\u2019s invasion fleet, marking the rise of English naval power.", type: "war", significance: "significant" },
  { title: "Pizarro Conquers Inca",     era: "exploration", year: 1533, lat: -13.5, lng: -72.0,description: "Francisco Pizarro captures Atahualpa and conquers the Inca Empire.", type: "war", significance: "significant" },
  // Enlightenment
  { title: "American Revolution",       era: "enlightenment", year: 1776, lat: 39.9, lng: -75.2, description: "The thirteen colonies declare independence from Britain, founding the United States.", type: "revolution", significance: "major" },
  { title: "French Revolution",         era: "enlightenment", year: 1789, lat: 48.9, lng: 2.3,   description: "The storming of the Bastille ignites a revolution that transforms France and inspires the world.", type: "revolution", significance: "major" },
  { title: "Industrial Revolution Begins", era: "enlightenment", year: 1760, lat: 53.5, lng: -2.2, description: "Steam power and mechanized production transform Britain, beginning the Industrial Revolution.", type: "discovery", significance: "major" },
  { title: "Partition of Poland",       era: "enlightenment", year: 1795, lat: 52.2, lng: 21.0,  description: "Russia, Prussia, and Austria partition Poland out of existence for 123 years.", type: "partition", significance: "significant" },
  { title: "Captain Cook Maps Pacific", era: "enlightenment", year: 1770, lat: -33.9, lng: 151.2, description: "James Cook charts Australia and New Zealand, opening the Pacific to European colonization.", type: "discovery", significance: "significant" },
  { title: "Haitian Revolution",        era: "enlightenment", year: 1791, lat: 18.5, lng: -72.3, description: "Enslaved people in Saint-Domingue revolt, eventually creating the first Black republic.", type: "revolution", significance: "significant" },
  // Industrial
  { title: "Napoleonic Wars",           era: "industrial", year: 1803, lat: 48.9, lng: 2.3,   description: "Napoleon\u2019s campaigns reshape the map of Europe before his final defeat at Waterloo.", type: "war", significance: "major" },
  { title: "US Civil War",              era: "industrial", year: 1861, lat: 38.9, lng: -77.0,  description: "Union and Confederacy fight over slavery and states\u2019 rights; 620,000\u2013750,000 die.", type: "war", significance: "major" },
  { title: "Scramble for Africa",       era: "industrial", year: 1884, lat: 52.5, lng: 13.4,   description: "European powers partition Africa at the Berlin Conference, colonizing nearly the entire continent.", type: "partition", significance: "major" },
  { title: "Meiji Restoration",         era: "industrial", year: 1868, lat: 35.7, lng: 139.7,  description: "Japan rapidly modernizes under Emperor Meiji, transforming from feudal to industrial power.", type: "revolution", significance: "major" },
  { title: "Abolition of Slavery (UK)", era: "industrial", year: 1833, lat: 51.5, lng: -0.1,   description: "Britain abolishes slavery throughout its empire, beginning a global abolitionist wave.", type: "treaty", significance: "significant" },
  { title: "Unification of Germany",    era: "industrial", year: 1871, lat: 52.5, lng: 13.4,   description: "Bismarck unifies German states into the German Empire after the Franco-Prussian War.", type: "formation", significance: "significant" },
  { title: "Unification of Italy",      era: "industrial", year: 1861, lat: 41.9, lng: 12.5,   description: "Garibaldi and Cavour unify the Italian peninsula into a single kingdom.", type: "formation", significance: "significant" },
  // World Wars
  { title: "World War I",              era: "world-wars", year: 1914, lat: 50.5, lng: 4.4,   description: "Assassination of Archduke Franz Ferdinand triggers a global conflict killing 20 million.", type: "war", significance: "major" },
  { title: "Russian Revolution",       era: "world-wars", year: 1917, lat: 59.9, lng: 30.3,  description: "Bolsheviks seize power, creating the Soviet Union and reshaping global politics.", type: "revolution", significance: "major" },
  { title: "Treaty of Versailles",     era: "world-wars", year: 1919, lat: 48.8, lng: 2.1,   description: "Peace treaty ending WWI imposes harsh terms on Germany, sowing seeds for WWII.", type: "treaty", significance: "major" },
  { title: "World War II",             era: "world-wars", year: 1939, lat: 52.5, lng: 13.4,  description: "Nazi Germany invades Poland, triggering the deadliest conflict in history (70\u201385 million dead).", type: "war", significance: "major" },
  { title: "Hiroshima",                era: "world-wars", year: 1945, lat: 34.4, lng: 132.5, description: "US drops the first atomic bomb on Hiroshima, beginning the nuclear age.", type: "war", significance: "major" },
  { title: "Holocaust",                era: "world-wars", year: 1941, lat: 51.4, lng: 21.0,  description: "Nazi Germany systematically murders 6 million Jews and millions of others.", type: "war", significance: "major" },
  { title: "Armenian Genocide",        era: "world-wars", year: 1915, lat: 39.9, lng: 32.9,  description: "Ottoman government systematically exterminates 1.5 million Armenians.", type: "war", significance: "significant" },
  // Cold War
  { title: "India-Pakistan Partition",  era: "cold-war", year: 1947, lat: 28.6, lng: 77.2,  description: "British India partitions into India and Pakistan; 10\u201315 million displaced, up to 2 million die.", type: "partition", significance: "major" },
  { title: "Creation of Israel",        era: "cold-war", year: 1948, lat: 32.1, lng: 34.8,  description: "The State of Israel is proclaimed, triggering the first Arab-Israeli War.", type: "formation", significance: "major" },
  { title: "Korean War",               era: "cold-war", year: 1950, lat: 37.6, lng: 127.0, description: "North Korea invades the South; 3 million die in the first major Cold War proxy conflict.", type: "war", significance: "major" },
  { title: "Cuban Missile Crisis",      era: "cold-war", year: 1962, lat: 22.0, lng: -79.5, description: "US and USSR come closest to nuclear war over Soviet missiles in Cuba.", type: "war", significance: "major" },
  { title: "African Independence Wave", era: "cold-war", year: 1960, lat: 6.5, lng: 3.4,    description: "17 African nations gain independence in 1960 alone, reshaping the continent.", type: "formation", significance: "major" },
  { title: "Chinese Revolution",        era: "cold-war", year: 1949, lat: 39.9, lng: 116.4, description: "Mao Zedong proclaims the People\u2019s Republic of China after defeating the Nationalists.", type: "revolution", significance: "major" },
  // Decolonization / Late Cold War
  { title: "Iranian Revolution",        era: "decolonization", year: 1979, lat: 35.7, lng: 51.4,  description: "Shah is overthrown; Ayatollah Khomeini establishes an Islamic republic.", type: "revolution", significance: "major" },
  { title: "Soviet-Afghan War",         era: "decolonization", year: 1979, lat: 34.5, lng: 69.2,  description: "Soviet Union invades Afghanistan, beginning a decade-long quagmire.", type: "war", significance: "major" },
  { title: "Fall of Berlin Wall",       era: "decolonization", year: 1989, lat: 52.5, lng: 13.4,  description: "East Berliners breach the Wall, symbolizing the end of the Cold War.", type: "collapse", significance: "major" },
  { title: "Dissolution of USSR",       era: "decolonization", year: 1991, lat: 55.8, lng: 37.6,  description: "The Soviet Union dissolves into 15 independent republics.", type: "collapse", significance: "major" },
  { title: "Tiananmen Square",          era: "decolonization", year: 1989, lat: 39.9, lng: 116.4, description: "Chinese government violently suppresses pro-democracy protests in Beijing.", type: "revolution", significance: "significant" },
  { title: "Bangladesh Independence",   era: "decolonization", year: 1971, lat: 23.8, lng: 90.4,  description: "East Pakistan secedes after a brutal war, becoming Bangladesh.", type: "formation", significance: "significant" },
  { title: "German Reunification",      era: "decolonization", year: 1990, lat: 52.5, lng: 13.4,  description: "East and West Germany reunify, ending 45 years of division.", type: "formation", significance: "significant" },
  // Post-Cold War
  { title: "Yugoslav Wars",            era: "post-cold-war", year: 1991, lat: 43.9, lng: 17.7, description: "Yugoslavia breaks apart in bloody ethnic conflicts; 140,000 die.", type: "war", significance: "major" },
  { title: "9/11 Attacks",             era: "post-cold-war", year: 2001, lat: 40.7, lng: -74.0, description: "Al-Qaeda attacks kill nearly 3,000 in New York and Washington, launching the War on Terror.", type: "war", significance: "major" },
  { title: "Iraq War",                 era: "post-cold-war", year: 2003, lat: 33.3, lng: 44.4, description: "US-led coalition invades Iraq, toppling Saddam Hussein; sectarian conflict follows.", type: "war", significance: "major" },
  { title: "EU Expansion (2004)",      era: "post-cold-war", year: 2004, lat: 50.8, lng: 4.4,  description: "10 new countries join the EU, the largest single expansion in its history.", type: "formation", significance: "significant" },
  { title: "Rwandan Genocide",         era: "post-cold-war", year: 1994, lat: -1.9, lng: 29.9,  description: "Hutu extremists kill 800,000 Tutsis and moderate Hutus in 100 days.", type: "war", significance: "major" },
  { title: "South Africa: End of Apartheid", era: "post-cold-war", year: 1994, lat: -33.9, lng: 18.4, description: "Nelson Mandela elected president in first fully democratic South African election.", type: "formation", significance: "major" },
  // Modern
  { title: "Arab Spring",              era: "modern", year: 2011, lat: 36.8, lng: 10.2, description: "Wave of protests and revolutions across the Arab world, starting in Tunisia.", type: "revolution", significance: "major" },
  { title: "Syrian Civil War",         era: "modern", year: 2011, lat: 33.5, lng: 36.3, description: "Protests escalate into a devastating civil war displacing 13 million.", type: "war", significance: "major" },
  { title: "Crimea Annexation",        era: "modern", year: 2014, lat: 44.9, lng: 34.1, description: "Russia annexes Crimea from Ukraine, triggering international sanctions.", type: "war", significance: "major" },
  { title: "Brexit",                   era: "modern", year: 2016, lat: 51.5, lng: -0.1, description: "UK votes to leave the European Union, reshaping European politics.", type: "revolution", significance: "major" },
  { title: "COVID-19 Pandemic",        era: "modern", year: 2020, lat: 30.6, lng: 114.3, description: "Global pandemic kills millions and reshapes economies, healthcare, and daily life worldwide.", type: "collapse", significance: "major" },
  { title: "Russia-Ukraine War",       era: "modern", year: 2022, lat: 50.4, lng: 30.5, description: "Russia launches full-scale invasion of Ukraine, the largest European conflict since WWII.", type: "war", significance: "major" },
  { title: "Gaza Conflict 2023",       era: "modern", year: 2023, lat: 31.5, lng: 34.5, description: "Hamas attacks Israel on October 7; Israel launches a major military operation in Gaza.", type: "war", significance: "major" },
]

// ── Migration data (40+ flows) ─────────────────────────────────────────────────

const MIGRATIONS: MigrationFlow[] = [
  // Classical
  { label: "Greek Colonization",        era: "classical", fromLat: 38.0, fromLng: 23.7, toLat: 37.5, toLng: 15.0,   people: "~2M", reason: "Trade & settlement", color: "#c084fc" },
  { label: "Bantu Expansion",           era: "classical", fromLat: 5.0,  fromLng: 10.0, toLat: -5.0,  toLng: 30.0,  people: "millions", reason: "Agricultural expansion", color: "#34d399" },
  { label: "Scythian Migrations",       era: "classical", fromLat: 48.0, fromLng: 68.0, toLat: 46.0,  toLng: 35.0,  people: "~500K", reason: "Nomadic expansion", color: "#f59e0b" },
  // Roman-Christian
  { label: "Germanic Migrations",       era: "roman-christian", fromLat: 54.0, fromLng: 12.0, toLat: 43.0, toLng: 5.0,   people: "~3M", reason: "Settlement in Roman territory", color: "#f472b6" },
  { label: "Silk Road Trade Routes",    era: "roman-christian", fromLat: 34.0, fromLng: 109.0, toLat: 41.9, toLng: 12.5, people: "merchants", reason: "Trade & cultural exchange", color: "#fbbf24" },
  { label: "Jewish Diaspora",           era: "roman-christian", fromLat: 31.8, fromLng: 35.2, toLat: 41.9, toLng: 12.5,  people: "~1M", reason: "Roman dispersal after revolts", color: "#60a5fa" },
  // Islamic Golden Age
  { label: "Arab Expansion",            era: "islamic-golden", fromLat: 21.4, fromLng: 39.8, toLat: 30.0, toLng: 31.2,  people: "~5M", reason: "Islamic conquests", color: "#34d399" },
  { label: "Viking Exploration",        era: "islamic-golden", fromLat: 59.3, fromLng: 18.1, toLat: 64.1, toLng: -21.9, people: "~500K", reason: "Raiding, trade & settlement", color: "#60a5fa" },
  { label: "Polynesian Settlement",     era: "islamic-golden", fromLat: -17.7, fromLng: -149.4, toLat: -41.3, toLng: 174.8, people: "~200K", reason: "Pacific exploration", color: "#06b6d4" },
  { label: "Turkic Migrations",         era: "islamic-golden", fromLat: 48.0, fromLng: 68.0, toLat: 39.0, toLng: 35.0,  people: "~2M", reason: "Westward nomadic movement", color: "#f59e0b" },
  // Mongol-Crusades
  { label: "Mongol Conquests",          era: "mongol-crusades", fromLat: 47.9, fromLng: 106.9, toLat: 33.3, toLng: 44.4, people: "~1M warriors", reason: "Empire building", color: "#f59e0b" },
  { label: "Crusader Migrations",       era: "mongol-crusades", fromLat: 48.9, fromLng: 2.3, toLat: 31.8, toLng: 35.2,  people: "~1M", reason: "Religious warfare", color: "#3b82f6" },
  { label: "Turkic Settlement of Anatolia", era: "mongol-crusades", fromLat: 40.0, fromLng: 52.0, toLat: 39.0, toLng: 32.0, people: "~2M", reason: "Seljuk expansion", color: "#22c55e" },
  // Renaissance
  { label: "European Trade Expansion",  era: "renaissance", fromLat: 43.8, fromLng: 11.3, toLat: 30.0, toLng: 31.2,  people: "merchants", reason: "Maritime trade", color: "#60a5fa" },
  { label: "Ottoman Conquests",         era: "renaissance", fromLat: 41.0, fromLng: 29.0, toLat: 44.8, toLng: 20.5,  people: "~3M", reason: "Imperial expansion", color: "#ef4444" },
  { label: "Romani Migration to Europe",era: "renaissance", fromLat: 25.0, fromLng: 80.0, toLat: 44.0, toLng: 26.0,  people: "~1M", reason: "Westward migration from India", color: "#a855f7" },
  // Exploration
  { label: "Transatlantic Slave Trade", era: "exploration", fromLat: 7.0,  fromLng: -2.0, toLat: 15.0, toLng: -61.0, people: "~12M (total)", reason: "Forced labor in Americas", color: "#ef4444" },
  { label: "Spanish to Americas",       era: "exploration", fromLat: 40.4, fromLng: -3.7, toLat: 19.4, toLng: -99.1, people: "~700K", reason: "Colonization & missions", color: "#f59e0b" },
  { label: "Portuguese to Brazil",      era: "exploration", fromLat: 38.7, fromLng: -9.1, toLat: -22.9, toLng: -43.2, people: "~500K", reason: "Colonization", color: "#22c55e" },
  { label: "Dutch to East Indies",      era: "exploration", fromLat: 52.4, fromLng: 4.9,  toLat: -6.2,  toLng: 106.8, people: "~100K", reason: "VOC trade empire", color: "#fb923c" },
  // Enlightenment
  { label: "European Settlers to Americas", era: "enlightenment", fromLat: 52.5, fromLng: -1.5, toLat: 40.7, toLng: -74.0, people: "~2M", reason: "Religious freedom & opportunity", color: "#a78bfa" },
  { label: "African Slavery to Americas",   era: "enlightenment", fromLat: 7.0,  fromLng: -2.0, toLat: 18.0, toLng: -66.0, people: "~3M (18th c.)", reason: "Forced labor", color: "#ef4444" },
  { label: "Convicts to Australia",     era: "enlightenment", fromLat: 51.5, fromLng: -0.1, toLat: -33.9, toLng: 151.2, people: "~165K total", reason: "Penal colony", color: "#64748b" },
  // Industrial
  { label: "Great European Migration",  era: "industrial", fromLat: 52.5, fromLng: 10.0, toLat: 40.7, toLng: -74.0, people: "~50M (total)", reason: "Economic opportunity", color: "#64748b" },
  { label: "Irish Famine Exodus",       era: "industrial", fromLat: 53.3, fromLng: -6.3, toLat: 40.7, toLng: -74.0, people: "~2M", reason: "Great Famine (1845\u201352)", color: "#22c55e" },
  { label: "California Gold Rush",      era: "industrial", fromLat: 40.7, fromLng: -74.0, toLat: 37.8, toLng: -122.4, people: "~300K", reason: "Gold discovery", color: "#fbbf24" },
  { label: "Indian Laborers to British Colonies", era: "industrial", fromLat: 25.0, fromLng: 80.0, toLat: -20.3, toLng: 57.6, people: "~2M", reason: "Indentured labor", color: "#f59e0b" },
  // World Wars
  { label: "WWI/WWII Refugees",         era: "world-wars", fromLat: 52.5, fromLng: 13.4, toLat: 40.7, toLng: -74.0, people: "~15M", reason: "War displacement", color: "#ef4444" },
  { label: "Armenian Displacement",     era: "world-wars", fromLat: 39.9, fromLng: 32.9, toLat: 33.9, toLng: 35.5,  people: "~1.5M", reason: "Genocide and deportation", color: "#f97316" },
  { label: "Jewish Immigration to Palestine", era: "world-wars", fromLat: 52.5, fromLng: 13.4, toLat: 32.1, toLng: 34.8, people: "~500K", reason: "Fleeing persecution", color: "#fbbf24" },
  { label: "Great Migration (US)",      era: "world-wars", fromLat: 33.0, fromLng: -84.4, toLat: 41.9, toLng: -87.6, people: "~6M", reason: "Racial segregation & jobs", color: "#3b82f6" },
  // Cold War
  { label: "India-Pakistan Partition",  era: "cold-war", fromLat: 31.6, fromLng: 74.9, toLat: 28.6, toLng: 77.2,  people: "~15M", reason: "Partition displacement", color: "#f97316" },
  { label: "European Jews to Israel",   era: "cold-war", fromLat: 52.5, fromLng: 13.4, toLat: 32.1, toLng: 34.8,  people: "~700K", reason: "Post-Holocaust migration", color: "#fbbf24" },
  { label: "African Americans North",   era: "cold-war", fromLat: 33.0, fromLng: -84.4, toLat: 40.7, toLng: -74.0, people: "~5M", reason: "Great Migration (cont.)", color: "#3b82f6" },
  // Decolonization
  { label: "Vietnamese Boat People",    era: "decolonization", fromLat: 10.8, fromLng: 106.6, toLat: 33.9, toLng: -118.2, people: "~1.5M", reason: "Fleeing communist regime", color: "#22c55e" },
  { label: "Afghan Refugees",           era: "decolonization", fromLat: 34.5, fromLng: 69.2, toLat: 33.7, toLng: 73.1, people: "~6M", reason: "Soviet-Afghan War", color: "#ef4444" },
  { label: "Soviet Emigration",         era: "decolonization", fromLat: 55.8, fromLng: 37.6, toLat: 52.5, toLng: 13.4, people: "~3M", reason: "Post-Soviet dispersal", color: "#64748b" },
  // Post-Cold War
  { label: "Balkan Refugees",           era: "post-cold-war", fromLat: 43.9, fromLng: 17.7, toLat: 48.2, toLng: 16.4, people: "~4M", reason: "Yugoslav Wars", color: "#06b6d4" },
  { label: "Post-Soviet Emigration",    era: "post-cold-war", fromLat: 55.8, fromLng: 37.6, toLat: 40.7, toLng: -74.0, people: "~5M", reason: "Economic collapse", color: "#64748b" },
  { label: "Economic Migration to Gulf",era: "post-cold-war", fromLat: 25.0, fromLng: 80.0, toLat: 25.3, toLng: 55.3, people: "~15M", reason: "Oil-economy labor demand", color: "#f59e0b" },
  // Modern
  { label: "Syrian Refugee Crisis",     era: "modern", fromLat: 33.5, fromLng: 36.3, toLat: 38.0, toLng: 32.0, people: "~6.7M", reason: "Civil war", color: "#ef4444" },
  { label: "Venezuelan Exodus",         era: "modern", fromLat: 10.5, fromLng: -66.9, toLat: 4.7, toLng: -74.1, people: "~7.7M", reason: "Economic & political crisis", color: "#f97316" },
  { label: "Ukrainian Refugees",        era: "modern", fromLat: 50.4, fromLng: 30.5, toLat: 52.2, toLng: 21.0, people: "~8M", reason: "Russian invasion", color: "#3b82f6" },
  { label: "Rohingya Crisis",           era: "modern", fromLat: 20.5, fromLng: 92.9, toLat: 21.4, toLng: 92.0, people: "~1M", reason: "Persecution in Myanmar", color: "#a855f7" },
  { label: "Central American Migration",era: "modern", fromLat: 14.6, fromLng: -90.5, toLat: 29.8, toLng: -95.4, people: "~3M", reason: "Violence, poverty, climate", color: "#22c55e" },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

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

function yearLabel(year: number): string {
  if (year < 0) return `${Math.abs(year)} BC`
  return `${year} AD`
}

// ── Component ──────────────────────────────────────────────────────────────────

type StatusT = "loading" | "ready" | "error"

export default function UC09Page() {
  const globeRef  = useRef<HTMLDivElement>(null)
  const globeInst = useRef<any>(null)

  const [status,          setStatus]          = useState<StatusT>("loading")
  const [errorMsg,        setErrorMsg]        = useState("")
  const [countries,       setCountries]       = useState<CountryFeature[]>([])
  const [hoveredCountry,  setHoveredCountry]  = useState<CountryFeature | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<CountryFeature | null>(null)
  const [isSpinning,      setIsSpinning]      = useState(true)
  const [currentEra,      setCurrentEra]      = useState<EraId>("classical")
  const [activeLayers,    setActiveLayers]    = useState<Set<LayerType>>(new Set(["empires", "events"]))
  const [selectedItem,    setSelectedItem]    = useState<{ type: LayerType; data: any } | null>(null)

  // ── Fetch country borders ────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const geoRes = await fetch("/countries-110m.geojson")
      if (!geoRes.ok) throw new Error(`GeoJSON error ${geoRes.status}`)
      const geo = await geoRes.json()
      setCountries(geo.features as CountryFeature[])
      setStatus("ready")
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Unknown error")
      setStatus("error")
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Filtered data by era ─────────────────────────────────────────────────────
  const eraEmpires    = useMemo(() => EMPIRES.filter(e => e.era === currentEra), [currentEra])
  const eraReligions  = useMemo(() => RELIGIONS.filter(r => r.era === currentEra), [currentEra])
  const eraEvents     = useMemo(() => EVENTS.filter(e => e.era === currentEra), [currentEra])
  const eraMigrations = useMemo(() => MIGRATIONS.filter(m => m.era === currentEra), [currentEra])
  const currentEraData = useMemo(() => ERAS.find(e => e.id === currentEra)!, [currentEra])

  // ── Globe init ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (status !== "ready" || !globeRef.current || globeInst.current) return

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
        .atmosphereColor(ERA_COLORS[currentEra])
        .atmosphereAltitude(0.14)
        .pointOfView({ lat: 30, lng: 30, altitude: 2.2 })

      globe.controls().autoRotate      = true
      globe.controls().autoRotateSpeed = 0.12
      globe.controls().enableDamping   = true
      globe.controls().dampingFactor   = 0.1

      globeInst.current = globe
      applyLayers(globe)
      applyCountries(globe, countries, null, null)
    })

    return () => {
      disposeGlobe(globeInst, globeRef)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  // ── Apply visualization layers ───────────────────────────────────────────────
  function applyLayers(globe: any) {
    // Build points data from active layers
    const points: any[] = []

    if (activeLayers.has("empires")) {
      for (const emp of eraEmpires) {
        points.push({
          lat: emp.lat,
          lng: emp.lng,
          size: emp.radius * 0.4,
          color: emp.color + "99",
          altitude: 0.01,
          label: emp.name,
          _type: "empires" as LayerType,
          _data: emp,
        })
      }
    }

    if (activeLayers.has("religions")) {
      for (const rel of eraReligions) {
        for (const reg of rel.regions) {
          points.push({
            lat: reg.lat,
            lng: reg.lng,
            size: 0.3 + (reg.percentage / 100) * 0.8,
            color: rel.color + "77",
            altitude: 0.015,
            label: `${rel.religion} - ${reg.label}`,
            _type: "religions" as LayerType,
            _data: { ...rel, _region: reg },
          })
        }
      }
    }

    if (activeLayers.has("events")) {
      for (const evt of eraEvents) {
        const sz = evt.significance === "major" ? 0.35 : evt.significance === "significant" ? 0.25 : 0.15
        points.push({
          lat: evt.lat,
          lng: evt.lng,
          size: sz,
          color: EVENT_TYPE_COLORS[evt.type] ?? "#fff",
          altitude: 0.025,
          label: evt.title,
          _type: "events" as LayerType,
          _data: evt,
        })
      }
    }

    globe
      .pointsData(points)
      .pointLat((d: any) => d.lat)
      .pointLng((d: any) => d.lng)
      .pointColor((d: any) => d.color)
      .pointAltitude((d: any) => d.altitude)
      .pointRadius((d: any) => d.size)
      .pointResolution(12)
      .pointLabel((d: any) => d.label)
      .onPointHover((pt: any) => {
        if (globeRef.current) globeRef.current.style.cursor = pt ? "pointer" : "default"
      })
      .onPointClick((pt: any) => {
        if (pt) {
          setSelectedItem({ type: pt._type, data: pt._data })
          setIsSpinning(false)
        }
      })

    // Arcs for migrations
    if (activeLayers.has("migrations")) {
      globe
        .arcsData(eraMigrations)
        .arcStartLat((d: any) => d.fromLat)
        .arcStartLng((d: any) => d.fromLng)
        .arcEndLat((d: any) => d.toLat)
        .arcEndLng((d: any) => d.toLng)
        .arcColor((d: any) => [d.color, d.color])
        .arcAltitudeAutoScale(0.4)
        .arcStroke(0.5)
        .arcDashLength(0.6)
        .arcDashGap(0.3)
        .arcDashAnimateTime(2000)
        .arcLabel((d: any) => d.label)
        .onArcHover((arc: any) => {
          if (globeRef.current) globeRef.current.style.cursor = arc ? "pointer" : "default"
        })
        .onArcClick((arc: any) => {
          if (arc) {
            setSelectedItem({ type: "migrations", data: arc })
            setIsSpinning(false)
          }
        })
    } else {
      globe.arcsData([])
    }
  }

  // ── Apply country polygons ─────────────────────────────────────────────────
  function applyCountries(
    globe: any,
    features: CountryFeature[],
    hovered: CountryFeature | null,
    selected: CountryFeature | null,
  ) {
    globe
      .polygonsData(features)
      .polygonCapColor((d: any) => {
        if (selected && d.properties.name === selected.properties.name)
          return "rgba(253,231,37,0.10)"
        if (hovered && d.properties.name === hovered.properties.name)
          return "rgba(255,255,255,0.06)"
        return "rgba(0,0,0,0)"
      })
      .polygonSideColor(() => "rgba(0,0,0,0)")
      .polygonStrokeColor((d: any) => {
        if (selected && d.properties.name === selected.properties.name)
          return "rgba(253,231,37,0.9)"
        if (hovered && d.properties.name === hovered.properties.name)
          return "rgba(255,255,255,0.6)"
        return "rgba(255,255,255,0.18)"
      })
      .polygonAltitude(0.005)
      .onPolygonHover((d: any) => {
        setHoveredCountry(d as CountryFeature | null)
      })
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
  }

  // ── Sync layers when era/filters change ──────────────────────────────────────
  useEffect(() => {
    if (!globeInst.current || status !== "ready") return
    globeInst.current.atmosphereColor(ERA_COLORS[currentEra])
    applyLayers(globeInst.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEra, activeLayers, status, eraEmpires, eraReligions, eraEvents, eraMigrations])

  // ── Sync country polygons ────────────────────────────────────────────────────
  useEffect(() => {
    if (!globeInst.current || status !== "ready" || !countries.length) return
    applyCountries(globeInst.current, countries, hoveredCountry, selectedCountry)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoveredCountry, selectedCountry, countries, status])

  // ── Spin control ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!globeInst.current) return
    globeInst.current.controls().autoRotate = isSpinning
  }, [isSpinning])

  // ── Resize ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onResize = () => {
      if (globeInst.current && globeRef.current)
        globeInst.current.width(globeRef.current.clientWidth).height(globeRef.current.clientHeight)
    }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  // ── Toggle layer ─────────────────────────────────────────────────────────────
  function toggleLayer(layer: LayerType) {
    setActiveLayers(prev => {
      const next = new Set(prev)
      if (next.has(layer)) next.delete(layer)
      else next.add(layer)
      return next
    })
  }

  // ── Loading / error states ───────────────────────────────────────────────────
  if (status === "loading") return (
    <div className="flex flex-col items-center justify-center"
      style={{ minHeight: "calc(100vh - 64px)", background: "var(--bg)" }}>
      <div className="text-center max-w-sm">
        <div className="mb-6 relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
            style={{ borderTopColor: "#c084fc", borderRightColor: "#34d399" }} />
          <div className="absolute inset-3 rounded-full flex items-center justify-center"
            style={{ background: "rgba(192,132,252,0.2)" }}>
            <span className="text-xl">{"\u{1F4DC}"}</span>
          </div>
        </div>
        <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--text)" }}>Loading World History Atlas...</h2>
        <p className="text-sm" style={{ color: "var(--muted)" }}>Preparing 2,500 years of civilization data</p>
      </div>
    </div>
  )

  if (status === "error") return (
    <div className="flex flex-col items-center justify-center gap-4"
      style={{ minHeight: "calc(100vh - 64px)", background: "var(--bg)" }}>
      <span className="text-4xl">{"\u26A0\uFE0F"}</span>
      <p className="text-lg font-semibold" style={{ color: "var(--text)" }}>Failed to load data</p>
      <p className="text-sm" style={{ color: "var(--muted)" }}>{errorMsg}</p>
      <button onClick={() => { setStatus("loading"); fetchData() }}
        className="px-4 py-2 rounded-lg text-sm font-medium"
        style={{ background: "#c084fc", color: "#fff" }}>
        Retry
      </button>
    </div>
  )

  const activeLayerCount = activeLayers.size

  return (
    <div className="relative" style={{ minHeight: "calc(100vh - 64px)", background: "#000" }}>
      <div ref={globeRef} className="absolute inset-0" />

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-4 pointer-events-none">
        <div className="pointer-events-auto">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base font-bold" style={{ color: "var(--text)" }}>World History Atlas</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: "rgba(192,132,252,0.15)", color: "#c084fc", border: "1px solid rgba(192,132,252,0.35)" }}>
              INTERACTIVE
            </span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold" style={{ color: currentEraData.color }}>{currentEraData.label}</span>
            <span className="text-xs px-1.5 py-0.5 rounded font-mono"
              style={{ background: currentEraData.color + "22", color: currentEraData.color, border: `1px solid ${currentEraData.color}44` }}>
              {currentEraData.period}
            </span>
          </div>
          <p className="text-xs max-w-sm" style={{ color: "var(--muted)" }}>
            {currentEraData.description}
          </p>
        </div>
        <div className="flex items-center gap-2 pointer-events-auto">
          <button onClick={() => setIsSpinning(s => !s)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)", color: "var(--muted)", backdropFilter: "blur(8px)" }}>
            {isSpinning ? "Pause" : "Spin"}
          </button>
          <Link href="/uc9/details"
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "rgba(192,132,252,0.18)", border: "1px solid rgba(192,132,252,0.4)", color: "#c084fc", backdropFilter: "blur(8px)" }}>
            About {"\u2192"}
          </Link>
        </div>
      </div>

      {/* ── Left side: Layer toggles ─────────────────────────────────────────── */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-auto">
        <div className="rounded-xl p-3"
          style={{ background: "rgba(0,0,0,0.80)", border: "1px solid rgba(255,255,255,0.10)", backdropFilter: "blur(14px)" }}>
          <div className="flex items-center gap-1.5 mb-2">
            <p className="text-xs font-semibold tracking-wider" style={{ color: "var(--muted)" }}>LAYERS</p>
            <span className="text-xs px-1.5 py-0.5 rounded-full font-mono"
              style={{ background: "rgba(192,132,252,0.2)", color: "#c084fc", fontSize: "10px" }}>
              {activeLayerCount}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {(Object.keys(LAYER_CONFIG) as LayerType[]).map(layer => {
              const cfg = LAYER_CONFIG[layer]
              const active = activeLayers.has(layer)
              return (
                <button key={layer} onClick={() => toggleLayer(layer)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left"
                  style={{
                    background: active ? cfg.color + "22" : "transparent",
                    border: active ? `1px solid ${cfg.color}` : "1px solid transparent",
                    color: active ? cfg.color : "var(--muted)",
                    minWidth: "120px",
                  }}>
                  <span>{cfg.icon}</span>
                  <span>{cfg.label}</span>
                </button>
              )
            })}
          </div>
          {/* Era stats */}
          <div className="mt-3 pt-3 space-y-1" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex justify-between text-xs" style={{ color: "var(--muted)" }}>
              <span>Empires</span>
              <span className="font-mono">{eraEmpires.length}</span>
            </div>
            <div className="flex justify-between text-xs" style={{ color: "var(--muted)" }}>
              <span>Religions</span>
              <span className="font-mono">{eraReligions.length}</span>
            </div>
            <div className="flex justify-between text-xs" style={{ color: "var(--muted)" }}>
              <span>Events</span>
              <span className="font-mono">{eraEvents.length}</span>
            </div>
            <div className="flex justify-between text-xs" style={{ color: "var(--muted)" }}>
              <span>Migrations</span>
              <span className="font-mono">{eraMigrations.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right side: Selected item detail ─────────────────────────────────── */}
      <div className="absolute right-4 top-24 pointer-events-auto w-72">
        {selectedItem ? (
          <div className="rounded-xl p-4"
            style={{ background: "rgba(0,0,0,0.88)", border: `1px solid ${selectedItem.type === "empires" ? "#c084fc" : selectedItem.type === "religions" ? "#34d399" : selectedItem.type === "events" ? "#ef4444" : "#06b6d4"}44`, backdropFilter: "blur(14px)" }}>
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold uppercase"
                style={{ background: LAYER_CONFIG[selectedItem.type].color + "22", color: LAYER_CONFIG[selectedItem.type].color }}>
                {selectedItem.type}
              </span>
              <button onClick={() => setSelectedItem(null)}
                className="opacity-40 hover:opacity-80 text-sm" style={{ color: "var(--muted)" }}>{"\u2715"}</button>
            </div>

            {selectedItem.type === "empires" && (() => {
              const emp = selectedItem.data as Empire
              return (
                <>
                  <p className="text-sm font-bold mb-1" style={{ color: emp.color }}>{emp.name}</p>
                  <div className="space-y-1 text-xs" style={{ color: "var(--muted)" }}>
                    <p><span className="opacity-60">Period:</span> {yearLabel(emp.yearStart)} {"\u2013"} {yearLabel(emp.yearEnd)}</p>
                    {emp.capital && <p><span className="opacity-60">Capital:</span> {emp.capital}</p>}
                    {emp.peakPopulation && <p><span className="opacity-60">Peak Population:</span> {emp.peakPopulation}</p>}
                  </div>
                </>
              )
            })()}

            {selectedItem.type === "religions" && (() => {
              const rel = selectedItem.data as ReligionSpread & { _region: { lat: number; lng: number; label: string; percentage: number } }
              return (
                <>
                  <p className="text-sm font-bold mb-1" style={{ color: rel.color }}>{rel.religion}</p>
                  <div className="space-y-1 text-xs" style={{ color: "var(--muted)" }}>
                    <p><span className="opacity-60">Region:</span> {rel._region.label}</p>
                    <p><span className="opacity-60">Percentage:</span> {rel._region.percentage}%</p>
                    <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                      <div className="h-full rounded-full" style={{ width: `${rel._region.percentage}%`, background: rel.color }} />
                    </div>
                  </div>
                </>
              )
            })()}

            {selectedItem.type === "events" && (() => {
              const evt = selectedItem.data as HistoricalEvent
              return (
                <>
                  <p className="text-sm font-bold mb-1" style={{ color: EVENT_TYPE_COLORS[evt.type] }}>{evt.title}</p>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-1.5 py-0.5 rounded font-mono"
                      style={{ background: EVENT_TYPE_COLORS[evt.type] + "22", color: EVENT_TYPE_COLORS[evt.type] }}>
                      {evt.type}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded font-mono"
                      style={{ background: "rgba(255,255,255,0.08)", color: "var(--muted)" }}>
                      {evt.significance}
                    </span>
                  </div>
                  <p className="text-xs mb-1" style={{ color: "var(--muted)" }}>{yearLabel(evt.year)}</p>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{evt.description}</p>
                </>
              )
            })()}

            {selectedItem.type === "migrations" && (() => {
              const mig = selectedItem.data as MigrationFlow
              return (
                <>
                  <p className="text-sm font-bold mb-1" style={{ color: mig.color }}>{mig.label}</p>
                  <div className="space-y-1 text-xs" style={{ color: "var(--muted)" }}>
                    <p><span className="opacity-60">People:</span> {mig.people}</p>
                    <p><span className="opacity-60">Reason:</span> {mig.reason}</p>
                  </div>
                </>
              )
            })()}
          </div>
        ) : hoveredCountry ? (
          <div className="rounded-xl px-4 py-3"
            style={{ background: "rgba(0,0,0,0.82)", border: "1px solid rgba(255,255,255,0.14)", backdropFilter: "blur(12px)" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{hoveredCountry.properties.name}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Click for details</p>
          </div>
        ) : selectedCountry ? (
          <div className="rounded-xl px-4 py-3"
            style={{ background: "rgba(0,0,0,0.88)", border: "1px solid rgba(253,231,37,0.3)", backdropFilter: "blur(14px)" }}>
            <div className="flex items-start justify-between">
              <p className="text-sm font-bold" style={{ color: "#fde725" }}>{selectedCountry.properties.name}</p>
              <button onClick={() => setSelectedCountry(null)}
                className="opacity-40 hover:opacity-80 text-sm" style={{ color: "var(--muted)" }}>{"\u2715"}</button>
            </div>
          </div>
        ) : null}
      </div>

      {/* ── Bottom: Timeline slider ──────────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-auto">
        <div className="px-4 pt-3 pb-4"
          style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.9) 30%)" }}>
          {/* Era buttons */}
          <div className="flex gap-1 mb-3 overflow-x-auto pb-1 scrollbar-thin">
            {ERAS.map(era => {
              const active = currentEra === era.id
              return (
                <button
                  key={era.id}
                  onClick={() => { setCurrentEra(era.id); setSelectedItem(null) }}
                  className="flex-shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: active ? era.color + "33" : "rgba(255,255,255,0.04)",
                    border: active ? `1px solid ${era.color}` : "1px solid rgba(255,255,255,0.08)",
                    color: active ? era.color : "var(--muted)",
                  }}>
                  <span className="block whitespace-nowrap">{era.label}</span>
                  <span className="block text-xs opacity-60 whitespace-nowrap" style={{ fontSize: "9px" }}>{era.period}</span>
                </button>
              )
            })}
          </div>

          {/* Timeline bar */}
          <div className="relative h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            {ERAS.map((era, i) => {
              const totalRange = 2525 // -500 to 2025
              const startPct = ((era.yearStart + 500) / totalRange) * 100
              const widthPct = ((era.yearEnd - era.yearStart) / totalRange) * 100
              return (
                <div
                  key={era.id}
                  className="absolute top-0 h-full cursor-pointer transition-opacity"
                  style={{
                    left: `${startPct}%`,
                    width: `${widthPct}%`,
                    background: currentEra === era.id ? era.color : era.color + "44",
                    opacity: currentEra === era.id ? 1 : 0.5,
                  }}
                  onClick={() => { setCurrentEra(era.id); setSelectedItem(null) }}
                  title={`${era.label} (${era.period})`}
                />
              )
            })}
          </div>

          {/* Year labels */}
          <div className="flex justify-between mt-1.5 text-xs" style={{ color: "var(--muted)" }}>
            <span>500 BC</span>
            <span>0 AD</span>
            <span>500</span>
            <span>1000</span>
            <span>1500</span>
            <span>2025</span>
          </div>

          {/* Disclaimer */}
          <p className="text-center mt-2 text-xs" style={{ color: "var(--muted)", opacity: 0.4 }}>
            This visualization presents mainstream historical consensus. Dates and boundaries are approximate.
          </p>
        </div>
      </div>

      {/* ── Country name on hover (top center) ───────────────────────────────── */}
      {hoveredCountry && !selectedCountry && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.15)", color: "var(--text)", backdropFilter: "blur(8px)" }}>
            {hoveredCountry.properties.name}
          </div>
        </div>
      )}
    </div>
  )
}

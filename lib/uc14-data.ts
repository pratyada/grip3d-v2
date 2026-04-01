// =============================================================================
// UC14 — World Job Market  (synthetic data, seeded for determinism)
// Modelled on global labour-market patterns (ILO, LinkedIn Workforce Report)
// =============================================================================

export type JobCategory =
  | "Technology"
  | "Healthcare"
  | "Finance"
  | "Manufacturing"
  | "Retail & Commerce"
  | "Education"
  | "Construction"
  | "Logistics"
  | "Government"
  | "Creative & Media"

export const JOB_CATEGORIES: JobCategory[] = [
  "Technology",
  "Healthcare",
  "Finance",
  "Manufacturing",
  "Retail & Commerce",
  "Education",
  "Construction",
  "Logistics",
  "Government",
  "Creative & Media",
]

export const CATEGORY_COLORS: Record<JobCategory, string> = {
  "Technology":        "#33ccdd",
  "Healthcare":        "#22c55e",
  "Finance":           "#f59e0b",
  "Manufacturing":     "#8b5cf6",
  "Retail & Commerce": "#ec4899",
  "Education":         "#3b82f6",
  "Construction":      "#f97316",
  "Logistics":         "#64748b",
  "Government":        "#6366f1",
  "Creative & Media":  "#14b8a6",
}

export const CATEGORY_ICONS: Record<JobCategory, string> = {
  "Technology":        "💻",
  "Healthcare":        "🏥",
  "Finance":           "💰",
  "Manufacturing":     "🏭",
  "Retail & Commerce": "🛒",
  "Education":         "🎓",
  "Construction":      "🏗️",
  "Logistics":         "🚚",
  "Government":        "🏛️",
  "Creative & Media":  "🎨",
}

export interface CityJobData {
  id: string
  city: string
  country: string
  region: string
  lat: number
  lng: number
  totalJobs: number
  jobsByCategory: Record<JobCategory, number>
  remotePercent: number
  avgSalaryUSD: number
  growthRate: number
  topCategory: JobCategory
}

function rng(seed: number) {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

// ── Raw city seeds ──────────────────────────────────────────────────────────
const RAW = [
  // North America
  { id:"nyc", city:"New York",       country:"USA",          region:"North America", lat:40.7128,  lng:-74.0060,   base:1.80, fin:1.8, health:1.2 },
  { id:"sfo", city:"San Francisco",  country:"USA",          region:"North America", lat:37.7749,  lng:-122.4194,  base:1.50, tech:2.4, fin:1.4 },
  { id:"lax", city:"Los Angeles",    country:"USA",          region:"North America", lat:34.0522,  lng:-118.2437,  base:1.45, tech:1.4, cre:2.0 },
  { id:"sea", city:"Seattle",        country:"USA",          region:"North America", lat:47.6062,  lng:-122.3321,  base:1.20, tech:2.2 },
  { id:"chi", city:"Chicago",        country:"USA",          region:"North America", lat:41.8781,  lng:-87.6298,   base:1.35, fin:1.5, mfg:1.3 },
  { id:"bos", city:"Boston",         country:"USA",          region:"North America", lat:42.3601,  lng:-71.0589,   base:1.15, health:2.0, tech:1.6 },
  { id:"aus", city:"Austin",         country:"USA",          region:"North America", lat:30.2672,  lng:-97.7431,   base:0.95, tech:1.9 },
  { id:"mia", city:"Miami",          country:"USA",          region:"North America", lat:25.7617,  lng:-80.1918,   base:0.90, fin:1.3 },
  { id:"dc",  city:"Washington DC",  country:"USA",          region:"North America", lat:38.9072,  lng:-77.0369,   base:1.05, gov:2.5 },
  { id:"tor", city:"Toronto",        country:"Canada",       region:"North America", lat:43.6532,  lng:-79.3832,   base:1.20, fin:1.4 },
  { id:"van", city:"Vancouver",      country:"Canada",       region:"North America", lat:49.2827,  lng:-123.1207,  base:0.80, tech:1.5 },
  { id:"mex", city:"Mexico City",    country:"Mexico",       region:"North America", lat:19.4326,  lng:-99.1332,   base:1.10, mfg:1.4 },
  // Europe
  { id:"lon", city:"London",         country:"UK",           region:"Europe",        lat:51.5074,  lng:-0.1278,    base:1.75, fin:2.0, tech:1.5, cre:1.6 },
  { id:"par", city:"Paris",          country:"France",       region:"Europe",        lat:48.8566,  lng:2.3522,     base:1.40, cre:1.8, fin:1.4 },
  { id:"ber", city:"Berlin",         country:"Germany",      region:"Europe",        lat:52.5200,  lng:13.4050,    base:1.15, tech:1.8, cre:1.6 },
  { id:"mun", city:"Munich",         country:"Germany",      region:"Europe",        lat:48.1351,  lng:11.5820,    base:1.05, mfg:1.6, tech:1.4 },
  { id:"ams", city:"Amsterdam",      country:"Netherlands",  region:"Europe",        lat:52.3676,  lng:4.9041,     base:0.90, tech:1.5, log:1.8 },
  { id:"dub", city:"Dublin",         country:"Ireland",      region:"Europe",        lat:53.3498,  lng:-6.2603,    base:0.85, tech:2.2, fin:1.6 },
  { id:"zur", city:"Zurich",         country:"Switzerland",  region:"Europe",        lat:47.3769,  lng:8.5417,     base:0.90, fin:2.2 },
  { id:"stk", city:"Stockholm",      country:"Sweden",       region:"Europe",        lat:59.3293,  lng:18.0686,    base:0.80, tech:1.6 },
  { id:"mad", city:"Madrid",         country:"Spain",        region:"Europe",        lat:40.4168,  lng:-3.7038,    base:1.00 },
  { id:"mil", city:"Milan",          country:"Italy",        region:"Europe",        lat:45.4642,  lng:9.1900,     base:0.90, cre:1.7, mfg:1.3 },
  { id:"war", city:"Warsaw",         country:"Poland",       region:"Europe",        lat:52.2297,  lng:21.0122,    base:0.80, tech:1.7 },
  { id:"ist", city:"Istanbul",       country:"Turkey",       region:"Europe",        lat:41.0082,  lng:28.9784,    base:1.10, mfg:1.4, cons:1.5 },
  { id:"mos", city:"Moscow",         country:"Russia",       region:"Europe",        lat:55.7558,  lng:37.6176,    base:1.20, gov:1.6, mfg:1.3 },
  // Asia Pacific
  { id:"tok", city:"Tokyo",          country:"Japan",        region:"Asia Pacific",  lat:35.6762,  lng:139.6503,   base:2.00, mfg:1.6, tech:1.5 },
  { id:"sha", city:"Shanghai",       country:"China",        region:"Asia Pacific",  lat:31.2304,  lng:121.4737,   base:2.10, mfg:2.0, fin:1.6 },
  { id:"bei", city:"Beijing",        country:"China",        region:"Asia Pacific",  lat:39.9042,  lng:116.4074,   base:1.90, gov:1.8, tech:1.5 },
  { id:"szo", city:"Shenzhen",       country:"China",        region:"Asia Pacific",  lat:22.5431,  lng:114.0579,   base:1.60, tech:2.2, mfg:2.2 },
  { id:"ban", city:"Bangalore",      country:"India",        region:"Asia Pacific",  lat:12.9716,  lng:77.5946,    base:1.50, tech:2.8 },
  { id:"mum", city:"Mumbai",         country:"India",        region:"Asia Pacific",  lat:19.0760,  lng:72.8777,    base:1.40, fin:1.8, cre:1.5 },
  { id:"del", city:"Delhi",          country:"India",        region:"Asia Pacific",  lat:28.7041,  lng:77.1025,    base:1.35, gov:1.5 },
  { id:"hyd", city:"Hyderabad",      country:"India",        region:"Asia Pacific",  lat:17.3850,  lng:78.4867,    base:1.00, tech:2.4 },
  { id:"sin", city:"Singapore",      country:"Singapore",    region:"Asia Pacific",  lat:1.3521,   lng:103.8198,   base:1.10, fin:1.9, log:1.8 },
  { id:"hkg", city:"Hong Kong",      country:"China SAR",    region:"Asia Pacific",  lat:22.3193,  lng:114.1694,   base:1.00, fin:2.1 },
  { id:"seo", city:"Seoul",          country:"South Korea",  region:"Asia Pacific",  lat:37.5665,  lng:126.9780,   base:1.35, tech:1.8, cre:1.5 },
  { id:"syd", city:"Sydney",         country:"Australia",    region:"Asia Pacific",  lat:-33.8688, lng:151.2093,   base:1.10, fin:1.4 },
  { id:"mel", city:"Melbourne",      country:"Australia",    region:"Asia Pacific",  lat:-37.8136, lng:144.9631,   base:0.95, tech:1.4 },
  { id:"kua", city:"Kuala Lumpur",   country:"Malaysia",     region:"Asia Pacific",  lat:3.1390,   lng:101.6869,   base:0.85, tech:1.4 },
  { id:"jak", city:"Jakarta",        country:"Indonesia",    region:"Asia Pacific",  lat:-6.2088,  lng:106.8456,   base:1.10, mfg:1.5 },
  { id:"osa", city:"Osaka",          country:"Japan",        region:"Asia Pacific",  lat:34.6937,  lng:135.5023,   base:1.00, mfg:1.4 },
  // Middle East
  { id:"dxb", city:"Dubai",          country:"UAE",          region:"Middle East",   lat:25.2048,  lng:55.2708,    base:1.15, cons:2.0, log:1.7, fin:1.4 },
  { id:"riy", city:"Riyadh",         country:"Saudi Arabia", region:"Middle East",   lat:24.7136,  lng:46.6753,    base:0.95, gov:1.7, cons:1.8 },
  { id:"tel", city:"Tel Aviv",       country:"Israel",       region:"Middle East",   lat:32.0853,  lng:34.7818,    base:0.85, tech:2.5 },
  // Africa
  { id:"cai", city:"Cairo",          country:"Egypt",        region:"Africa",        lat:30.0444,  lng:31.2357,    base:0.90, gov:1.6 },
  { id:"lag", city:"Lagos",          country:"Nigeria",      region:"Africa",        lat:6.5244,   lng:3.3792,     base:0.85 },
  { id:"nai", city:"Nairobi",        country:"Kenya",        region:"Africa",        lat:-1.2921,  lng:36.8219,    base:0.65, tech:1.6 },
  { id:"joh", city:"Johannesburg",   country:"South Africa", region:"Africa",        lat:-26.2041, lng:28.0473,    base:0.75, mfg:1.4 },
  { id:"acc", city:"Accra",          country:"Ghana",        region:"Africa",        lat:5.6037,   lng:-0.1870,    base:0.55, tech:1.5 },
  // South America
  { id:"sao", city:"São Paulo",      country:"Brazil",       region:"South America", lat:-23.5505, lng:-46.6333,   base:1.35, fin:1.6, mfg:1.4 },
  { id:"rio", city:"Rio de Janeiro", country:"Brazil",       region:"South America", lat:-22.9068, lng:-43.1729,   base:0.95, cre:1.5 },
  { id:"bog", city:"Bogotá",         country:"Colombia",     region:"South America", lat:4.7110,   lng:-74.0721,   base:0.75, tech:1.5 },
  { id:"scl", city:"Santiago",       country:"Chile",        region:"South America", lat:-33.4489, lng:-70.6693,   base:0.75, fin:1.4 },
  { id:"bue", city:"Buenos Aires",   country:"Argentina",    region:"South America", lat:-34.6037, lng:-58.3816,   base:0.85, cre:1.5 },
  { id:"lim", city:"Lima",           country:"Peru",         region:"South America", lat:-12.0464, lng:-77.0428,   base:0.70, mfg:1.3 },
]

function buildCity(raw: typeof RAW[0], idx: number): CityJobData {
  const total = Math.round(18000 * raw.base * (0.82 + rng(idx * 7) * 0.36))

  const catKeys = ["tech","health","fin","mfg","ret","edu","cons","log","gov","cre"] as const
  const catNames: JobCategory[] = [
    "Technology","Healthcare","Finance","Manufacturing",
    "Retail & Commerce","Education","Construction",
    "Logistics","Government","Creative & Media",
  ]
  const baseW = [0.14,0.13,0.11,0.12,0.11,0.10,0.09,0.08,0.07,0.06]

  const w = catKeys.map((k, i) => baseW[i] * (((raw as any)[k] as number) ?? 1))
  const wSum = w.reduce((a, b) => a + b, 0)

  const jobsByCategory = {} as Record<JobCategory, number>
  let topCategory: JobCategory = "Technology"
  let topCount = 0

  catNames.forEach((cat, ci) => {
    const noise = 0.72 + rng(idx * 13 + ci + 1) * 0.56
    const count = Math.round((w[ci] / wSum) * total * noise)
    jobsByCategory[cat] = count
    if (count > topCount) { topCount = count; topCategory = cat }
  })

  const salaryBase: Record<string, number> = {
    "North America": 75000,
    "Europe":        65000,
    "Asia Pacific":  45000,
    "Middle East":   60000,
    "Africa":        25000,
    "South America": 30000,
  }

  return {
    id: raw.id, city: raw.city, country: raw.country,
    region: raw.region, lat: raw.lat, lng: raw.lng,
    totalJobs: total,
    jobsByCategory,
    remotePercent: Math.round(12 + rng(idx * 3 + 2) * 58),
    avgSalaryUSD: Math.round(((salaryBase[raw.region] ?? 40000) * (0.7 + raw.base * 0.25) + rng(idx * 5) * 20000) / 1000) * 1000,
    growthRate: parseFloat((-3 + rng(idx * 11 + 3) * 24).toFixed(1)),
    topCategory,
  }
}

let _cities: CityJobData[] | null = null
export function getCities(): CityJobData[] {
  if (!_cities) _cities = RAW.map((r, i) => buildCity(r, i))
  return _cities
}

export function getCity(id: string): CityJobData | undefined {
  return getCities().find(c => c.id === id)
}

export interface GlobalStats {
  totalJobs: number
  totalCities: number
  topCity: string
  fastestGrowing: string
  highestRemote: string
  remoteAvg: number
  categoryBreakdown: Record<JobCategory, number>
}

export function getGlobalStats(): GlobalStats {
  const cities = getCities()
  const total = cities.reduce((s, c) => s + c.totalJobs, 0)
  const catBreakdown = {} as Record<JobCategory, number>
  JOB_CATEGORIES.forEach(cat => {
    catBreakdown[cat] = cities.reduce((s, c) => s + c.jobsByCategory[cat], 0)
  })
  return {
    totalJobs: total,
    totalCities: cities.length,
    topCity: [...cities].sort((a, b) => b.totalJobs - a.totalJobs)[0].city,
    fastestGrowing: [...cities].sort((a, b) => b.growthRate - a.growthRate)[0].city,
    highestRemote: [...cities].sort((a, b) => b.remotePercent - a.remotePercent)[0].city,
    remoteAvg: Math.round(cities.reduce((s, c) => s + c.remotePercent, 0) / cities.length),
    categoryBreakdown: catBreakdown,
  }
}

export function getMonthlyTrend(cityId: string): { month: string; jobs: number }[] {
  const city = getCity(cityId)
  if (!city) return []
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  const seed = city.id.split("").reduce((s, c) => s + c.charCodeAt(0), 0)
  return months.map((month, i) => ({
    month,
    jobs: Math.round(city.totalJobs * (0.82 + rng(seed + i * 17) * 0.36)),
  }))
}

export function getTopCitiesByCategory(category: JobCategory, limit = 8): CityJobData[] {
  return [...getCities()]
    .sort((a, b) => b.jobsByCategory[category] - a.jobsByCategory[category])
    .slice(0, limit)
}

export interface GeoJSONData {
  type: "FeatureCollection"
  features: {
    type: "Feature"
    geometry: { type: "Point"; coordinates: [number, number] }
    properties: Record<string, string | number>
  }[]
}

export function getCitiesGeoJSON(filterCategory?: JobCategory): GeoJSONData {
  return {
    type: "FeatureCollection",
    features: getCities().map(city => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [city.lng, city.lat] as [number, number] },
      properties: {
        id: city.id,
        city: city.city,
        country: city.country,
        region: city.region,
        totalJobs: city.totalJobs,
        displayJobs: filterCategory ? city.jobsByCategory[filterCategory] : city.totalJobs,
        topCategory: city.topCategory,
        color: CATEGORY_COLORS[filterCategory ?? city.topCategory],
        remotePercent: city.remotePercent,
        growthRate: city.growthRate,
        avgSalaryUSD: city.avgSalaryUSD,
        categoryColor: CATEGORY_COLORS[city.topCategory],
      },
    })),
  }
}

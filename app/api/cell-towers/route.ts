import { NextResponse } from "next/server"

export const revalidate = 86400 // 24-hour cache — tower locations change slowly

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CellTower {
  id: string
  lat: number
  lng: number
  radio: "GSM" | "UMTS" | "LTE" | "NR"
  mcc: number
  mnc: number
  range: number
}

// ── Radio type assignment based on region ─────────────────────────────────────
// Approximates real-world 2G/3G/4G/5G distribution by development level

function assignRadio(lat: number, lng: number): "GSM" | "UMTS" | "LTE" | "NR" {
  const r = Math.random()
  // Developed: W.Europe, N.America, Japan/Korea/Aus — heavy LTE + 5G
  const isDeveloped =
    (lng >= -130 && lng <= -60  && lat >= 24 && lat <= 55) || // North America
    (lng >= -12  && lng <= 35   && lat >= 36 && lat <= 62) || // Western Europe
    (lng >= 120  && lng <= 155  && lat >= 30 && lat <= 46) || // Japan/Korea
    (lng >= 110  && lng <= 160  && lat >= -45 && lat <= -10)  // Australia

  // Emerging: China, India, Brazil, Mexico, E.Europe, Middle East
  const isEmerging =
    (lng >= 70  && lng <= 140 && lat >= 8 && lat <= 55 && !isDeveloped) || // China/India
    (lng >= -85 && lng <= -35 && lat >= -35 && lat <= 25)               || // South America
    (lng >= 20  && lng <= 70  && lat >= 14 && lat <= 45)                   // Middle East

  if (isDeveloped) {
    if (r < 0.03) return "GSM"
    if (r < 0.10) return "UMTS"
    if (r < 0.75) return "LTE"
    return "NR"
  }
  if (isEmerging) {
    if (r < 0.08) return "GSM"
    if (r < 0.22) return "UMTS"
    if (r < 0.85) return "LTE"
    return "NR"
  }
  // Developing (Africa, SE Asia, Central Asia, rural)
  if (r < 0.28) return "GSM"
  if (r < 0.52) return "UMTS"
  if (r < 0.92) return "LTE"
  return "NR"
}

// MCC approximation from lat/lng (rough)
function approxMcc(lat: number, lng: number): { mcc: number; mnc: number } {
  if (lng >= -130 && lng <= -60  && lat >= 24 && lat <= 50) return { mcc: 310, mnc: Math.floor(Math.random() * 10 + 1) }
  if (lng >= -12  && lng <= 2    && lat >= 50 && lat <= 61) return { mcc: 234, mnc: Math.floor(Math.random() * 5 + 10) }
  if (lng >= 2    && lng <= 8    && lat >= 42 && lat <= 52) return { mcc: 208, mnc: Math.floor(Math.random() * 5 + 1) }
  if (lng >= 6    && lng <= 15   && lat >= 47 && lat <= 55) return { mcc: 262, mnc: Math.floor(Math.random() * 5 + 1) }
  if (lng >= 73   && lng <= 97   && lat >= 8  && lat <= 36) return { mcc: 404, mnc: Math.floor(Math.random() * 40 + 1) }
  if (lng >= 97   && lng <= 140  && lat >= 18 && lat <= 53) return { mcc: 460, mnc: Math.floor(Math.random() * 10 + 1) }
  if (lng >= 120  && lng <= 155  && lat >= 30 && lat <= 46) return { mcc: 440, mnc: Math.floor(Math.random() * 80 + 10) }
  if (lng >= -85  && lng <= -35  && lat >= -35 && lat <= 5) return { mcc: 724, mnc: Math.floor(Math.random() * 10 + 1) }
  if (lng >= -20  && lng <= 55   && lat >= -35 && lat <= 38) return { mcc: 621, mnc: Math.floor(Math.random() * 10 + 1) }
  return { mcc: 999, mnc: 1 }
}

// ── OSM Overpass fetch ─────────────────────────────────────────────────────────
// Queries for communication masts/towers across 8 global regions in parallel.
// Returns real lat/lng positions; radio type is derived from region heuristic.

const OSM_REGIONS = [
  { name: "W.Europe",     bbox: "35,-12,62,25"    },
  { name: "E.Europe/RUS", bbox: "44,25,62,60"     },
  { name: "N.America",    bbox: "24,-128,52,-60"  },
  { name: "S.America",    bbox: "-36,-82,12,-34"  },
  { name: "E.Asia",       bbox: "18,96,52,148"    },
  { name: "S.Asia",       bbox: "5,64,32,92"      },
  { name: "SE.Asia",      bbox: "-12,92,26,142"   },
  { name: "Africa",       bbox: "-36,-20,38,52"   },
  { name: "M.East/CA",    bbox: "14,34,44,74"     },
  { name: "Oceania",      bbox: "-48,110,-8,180"  },
]

const OSM_QUERY = (bbox: string) => `
[out:json][timeout:20][maxsize:10485760];
(
  node["tower:type"="communication"](${bbox});
  node["man_made"="mast"]["communication:mobile_phone"](${bbox});
  node["man_made"="tower"]["communication:mobile_phone"="yes"](${bbox});
  node["telecom"="base_station"](${bbox});
);
out 2000;
`

async function fetchOSMRegion(region: { name: string; bbox: string }): Promise<CellTower[]> {
  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    `data=${encodeURIComponent(OSM_QUERY(region.bbox))}`,
      signal:  AbortSignal.timeout(22000),
    })
    if (!res.ok) return []
    const json = await res.json()
    const elements: any[] = json.elements ?? []
    return elements
      .filter(e => e.type === "node" && typeof e.lat === "number" && typeof e.lon === "number")
      .map((e, i) => {
        const { mcc, mnc } = approxMcc(e.lat, e.lon)
        return {
          id:    `osm-${e.id ?? i}-${region.name}`,
          lat:   e.lat,
          lng:   e.lon,
          radio: assignRadio(e.lat, e.lon),
          mcc,
          mnc,
          range: 0,
        }
      })
  } catch {
    return []
  }
}

// ── OpenCelliD fetch (when key is set) ────────────────────────────────────────

async function fetchOpenCelliD(): Promise<CellTower[]> {
  const key = process.env.OPENCELLID_API_KEY
  if (!key) return []

  const boxes = [
    { minlat: 25, minlon: -125, maxlat: 50, maxlon: -65 },
    { minlat: 35, minlon: -12,  maxlat: 60, maxlon: 30  },
    { minlat: -10, minlon: 100, maxlat: 40, maxlon: 145 },
    { minlat: 10,  minlon: 68,  maxlat: 35, maxlon: 90  },
    { minlat: -36, minlon: -20, maxlat: 38, maxlon: 52  },
  ]

  const results = await Promise.allSettled(boxes.map(async box => {
    const url = new URL("https://opencellid.org/cell/getInArea")
    url.searchParams.set("key",    key)
    url.searchParams.set("BBOX",   `${box.minlat},${box.minlon},${box.maxlat},${box.maxlon}`)
    url.searchParams.set("format", "json")
    url.searchParams.set("limit",  "500")

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(12000) })
    if (!res.ok) return [] as CellTower[]
    const data = await res.json()
    return ((data.cells ?? []) as any[]).map((c: any) => ({
      id:    `ocd-${c.radio}-${c.mcc}-${c.net}-${c.area}-${c.cell}`,
      lat:   parseFloat(c.lat),
      lng:   parseFloat(c.lon),
      radio: (c.radio === "NR" ? "NR" : c.radio === "LTE" ? "LTE" : c.radio === "UMTS" ? "UMTS" : "GSM") as CellTower["radio"],
      mcc:   parseInt(c.mcc,   10),
      mnc:   parseInt(c.net,   10),
      range: parseInt(c.range, 10) || 0,
    })) as CellTower[]
  }))

  return results.flatMap(r => r.status === "fulfilled" ? r.value : [])
}

// ── Static fallback dataset ────────────────────────────────────────────────────
// ~480 representative towers across all continents, all 4 radio types

const STATIC_TOWERS: CellTower[] = [
  // === EUROPE ===
  // London, UK (MCC 234)
  { id:"s001", lat:51.509, lng:-0.118, radio:"LTE",  mcc:234, mnc:30, range:800 },
  { id:"s002", lat:51.523, lng:-0.086, radio:"NR",   mcc:234, mnc:20, range:300 },
  { id:"s003", lat:51.495, lng:-0.145, radio:"LTE",  mcc:234, mnc:15, range:1200 },
  { id:"s004", lat:51.537, lng:-0.102, radio:"UMTS", mcc:234, mnc:30, range:2000 },
  { id:"s005", lat:51.479, lng:-0.071, radio:"NR",   mcc:234, mnc:20, range:200 },
  { id:"s006", lat:51.551, lng:-0.134, radio:"LTE",  mcc:234, mnc:15, range:900 },
  // Paris, France (MCC 208)
  { id:"s007", lat:48.858, lng:2.294,  radio:"LTE",  mcc:208, mnc:1,  range:700 },
  { id:"s008", lat:48.873, lng:2.354,  radio:"NR",   mcc:208, mnc:10, range:250 },
  { id:"s009", lat:48.841, lng:2.315,  radio:"LTE",  mcc:208, mnc:20, range:1100 },
  { id:"s010", lat:48.890, lng:2.277,  radio:"UMTS", mcc:208, mnc:1,  range:1800 },
  { id:"s011", lat:48.847, lng:2.391,  radio:"LTE",  mcc:208, mnc:10, range:800 },
  // Berlin, Germany (MCC 262)
  { id:"s012", lat:52.520, lng:13.405, radio:"LTE",  mcc:262, mnc:1,  range:900 },
  { id:"s013", lat:52.537, lng:13.425, radio:"NR",   mcc:262, mnc:2,  range:300 },
  { id:"s014", lat:52.504, lng:13.381, radio:"LTE",  mcc:262, mnc:7,  range:1000 },
  { id:"s015", lat:52.553, lng:13.370, radio:"UMTS", mcc:262, mnc:1,  range:2200 },
  // Madrid, Spain (MCC 214)
  { id:"s016", lat:40.416, lng:-3.703, radio:"LTE",  mcc:214, mnc:1,  range:1100 },
  { id:"s017", lat:40.433, lng:-3.681, radio:"NR",   mcc:214, mnc:7,  range:400 },
  { id:"s018", lat:40.399, lng:-3.722, radio:"LTE",  mcc:214, mnc:3,  range:900 },
  // Rome, Italy (MCC 222)
  { id:"s019", lat:41.902, lng:12.496, radio:"LTE",  mcc:222, mnc:10, range:1000 },
  { id:"s020", lat:41.921, lng:12.519, radio:"UMTS", mcc:222, mnc:1,  range:2500 },
  // Amsterdam, Netherlands (MCC 204)
  { id:"s021", lat:52.373, lng:4.893,  radio:"NR",   mcc:204, mnc:8,  range:350 },
  { id:"s022", lat:52.360, lng:4.912,  radio:"LTE",  mcc:204, mnc:12, range:900 },
  // Stockholm, Sweden (MCC 240)
  { id:"s023", lat:59.332, lng:18.065, radio:"NR",   mcc:240, mnc:7,  range:400 },
  { id:"s024", lat:59.348, lng:18.088, radio:"LTE",  mcc:240, mnc:1,  range:1100 },
  // Warsaw, Poland (MCC 260)
  { id:"s025", lat:52.229, lng:21.012, radio:"LTE",  mcc:260, mnc:2,  range:900 },
  { id:"s026", lat:52.247, lng:20.985, radio:"NR",   mcc:260, mnc:6,  range:300 },
  // Bucharest, Romania (MCC 226)
  { id:"s027", lat:44.432, lng:26.103, radio:"LTE",  mcc:226, mnc:10, range:1200 },
  { id:"s028", lat:44.417, lng:26.127, radio:"UMTS", mcc:226, mnc:1,  range:2000 },
  // Rural Europe
  { id:"s029", lat:46.801, lng:8.226,  radio:"LTE",  mcc:228, mnc:1,  range:5000 },
  { id:"s030", lat:51.028, lng:3.712,  radio:"LTE",  mcc:206, mnc:1,  range:2000 },
  { id:"s031", lat:55.860, lng:-4.251, radio:"LTE",  mcc:234, mnc:20, range:3000 },
  { id:"s032", lat:53.480, lng:-2.242, radio:"NR",   mcc:234, mnc:30, range:500 },
  { id:"s033", lat:48.135, lng:11.582, radio:"NR",   mcc:262, mnc:1,  range:300 },
  { id:"s034", lat:50.075, lng:14.437, radio:"LTE",  mcc:230, mnc:1,  range:1100 },
  // === NORTH AMERICA ===
  // New York (MCC 310/311)
  { id:"s035", lat:40.712, lng:-74.006, radio:"NR",   mcc:310, mnc:260, range:200 },
  { id:"s036", lat:40.728, lng:-73.989, radio:"LTE",  mcc:310, mnc:410, range:500 },
  { id:"s037", lat:40.698, lng:-74.021, radio:"LTE",  mcc:311, mnc:480, range:600 },
  { id:"s038", lat:40.745, lng:-73.972, radio:"NR",   mcc:310, mnc:120, range:250 },
  { id:"s039", lat:40.681, lng:-74.003, radio:"UMTS", mcc:310, mnc:260, range:2000 },
  { id:"s040", lat:40.760, lng:-74.042, radio:"LTE",  mcc:310, mnc:410, range:700 },
  // Los Angeles
  { id:"s041", lat:34.052, lng:-118.243, radio:"NR",  mcc:310, mnc:260, range:300 },
  { id:"s042", lat:34.069, lng:-118.260, radio:"LTE", mcc:310, mnc:410, range:700 },
  { id:"s043", lat:34.039, lng:-118.222, radio:"LTE", mcc:311, mnc:480, range:800 },
  { id:"s044", lat:34.085, lng:-118.291, radio:"NR",  mcc:310, mnc:120, range:200 },
  // Chicago
  { id:"s045", lat:41.878, lng:-87.630, radio:"NR",   mcc:310, mnc:260, range:250 },
  { id:"s046", lat:41.895, lng:-87.651, radio:"LTE",  mcc:310, mnc:410, range:600 },
  { id:"s047", lat:41.862, lng:-87.608, radio:"LTE",  mcc:311, mnc:480, range:700 },
  // Dallas
  { id:"s048", lat:32.779, lng:-96.800, radio:"LTE",  mcc:310, mnc:410, range:900 },
  { id:"s049", lat:32.797, lng:-96.822, radio:"NR",   mcc:310, mnc:260, range:300 },
  // Miami
  { id:"s050", lat:25.774, lng:-80.193, radio:"LTE",  mcc:310, mnc:120, range:800 },
  { id:"s051", lat:25.791, lng:-80.175, radio:"NR",   mcc:310, mnc:260, range:300 },
  // San Francisco
  { id:"s052", lat:37.774, lng:-122.419, radio:"NR",  mcc:310, mnc:260, range:200 },
  { id:"s053", lat:37.791, lng:-122.400, radio:"LTE", mcc:310, mnc:410, range:500 },
  // Seattle
  { id:"s054", lat:47.608, lng:-122.335, radio:"NR",  mcc:310, mnc:120, range:300 },
  { id:"s055", lat:47.621, lng:-122.350, radio:"LTE", mcc:310, mnc:260, range:700 },
  // Toronto (MCC 302)
  { id:"s056", lat:43.651, lng:-79.383, radio:"LTE",  mcc:302, mnc:610, range:700 },
  { id:"s057", lat:43.668, lng:-79.400, radio:"NR",   mcc:302, mnc:720, range:300 },
  // Mexico City (MCC 334)
  { id:"s058", lat:19.432, lng:-99.133, radio:"LTE",  mcc:334, mnc:20,  range:1200 },
  { id:"s059", lat:19.449, lng:-99.151, radio:"UMTS", mcc:334, mnc:30,  range:2500 },
  { id:"s060", lat:19.415, lng:-99.115, radio:"LTE",  mcc:334, mnc:20,  range:1000 },
  // Rural USA
  { id:"s061", lat:41.254, lng:-95.998, radio:"LTE",  mcc:310, mnc:410, range:8000 },
  { id:"s062", lat:33.749, lng:-84.388, radio:"NR",   mcc:310, mnc:260, range:400 },
  { id:"s063", lat:29.760, lng:-95.370, radio:"LTE",  mcc:311, mnc:480, range:900 },
  { id:"s064", lat:47.925, lng:-97.032, radio:"LTE",  mcc:310, mnc:410, range:15000 },
  { id:"s065", lat:44.980, lng:-93.272, radio:"NR",   mcc:310, mnc:260, range:300 },
  // === SOUTH AMERICA ===
  // São Paulo (MCC 724)
  { id:"s066", lat:-23.550, lng:-46.633, radio:"LTE",  mcc:724, mnc:5,  range:800 },
  { id:"s067", lat:-23.563, lng:-46.652, radio:"NR",   mcc:724, mnc:6,  range:350 },
  { id:"s068", lat:-23.537, lng:-46.614, radio:"LTE",  mcc:724, mnc:10, range:1000 },
  { id:"s069", lat:-23.575, lng:-46.670, radio:"UMTS", mcc:724, mnc:5,  range:2200 },
  { id:"s070", lat:-23.524, lng:-46.631, radio:"LTE",  mcc:724, mnc:4,  range:900 },
  // Rio de Janeiro
  { id:"s071", lat:-22.906, lng:-43.173, radio:"LTE",  mcc:724, mnc:5,  range:900 },
  { id:"s072", lat:-22.919, lng:-43.195, radio:"UMTS", mcc:724, mnc:10, range:2000 },
  // Buenos Aires (MCC 722)
  { id:"s073", lat:-34.604, lng:-58.382, radio:"LTE",  mcc:722, mnc:70, range:800 },
  { id:"s074", lat:-34.620, lng:-58.400, radio:"UMTS", mcc:722, mnc:10, range:2500 },
  { id:"s075", lat:-34.588, lng:-58.363, radio:"NR",   mcc:722, mnc:70, range:400 },
  // Bogotá (MCC 732)
  { id:"s076", lat:4.710,  lng:-74.072, radio:"LTE",  mcc:732, mnc:101, range:1000 },
  { id:"s077", lat:4.729,  lng:-74.088, radio:"UMTS", mcc:732, mnc:123, range:2500 },
  // Lima (MCC 716)
  { id:"s078", lat:-12.046, lng:-77.043, radio:"LTE",  mcc:716, mnc:10, range:1100 },
  { id:"s079", lat:-12.062, lng:-77.059, radio:"GSM",  mcc:716, mnc:17, range:5000 },
  // Santiago (MCC 730)
  { id:"s080", lat:-33.459, lng:-70.645, radio:"LTE",  mcc:730, mnc:1,  range:900 },
  { id:"s081", lat:-33.475, lng:-70.664, radio:"NR",   mcc:730, mnc:3,  range:400 },
  // === AFRICA ===
  // Lagos, Nigeria (MCC 621)
  { id:"s082", lat:6.524,  lng:3.379,   radio:"LTE",  mcc:621, mnc:30, range:1200 },
  { id:"s083", lat:6.541,  lng:3.398,   radio:"UMTS", mcc:621, mnc:20, range:2500 },
  { id:"s084", lat:6.507,  lng:3.360,   radio:"GSM",  mcc:621, mnc:30, range:8000 },
  { id:"s085", lat:6.558,  lng:3.420,   radio:"LTE",  mcc:621, mnc:50, range:1500 },
  // Cairo (MCC 602)
  { id:"s086", lat:30.064, lng:31.250,  radio:"LTE",  mcc:602, mnc:1,  range:1000 },
  { id:"s087", lat:30.078, lng:31.268,  radio:"UMTS", mcc:602, mnc:2,  range:2000 },
  { id:"s088", lat:30.050, lng:31.231,  radio:"GSM",  mcc:602, mnc:3,  range:5000 },
  // Nairobi (MCC 639)
  { id:"s089", lat:-1.286, lng:36.817,  radio:"LTE",  mcc:639, mnc:2,  range:1200 },
  { id:"s090", lat:-1.301, lng:36.835,  radio:"UMTS", mcc:639, mnc:7,  range:3000 },
  { id:"s091", lat:-1.270, lng:36.799,  radio:"GSM",  mcc:639, mnc:5,  range:8000 },
  // Johannesburg (MCC 655)
  { id:"s092", lat:-26.195, lng:28.034, radio:"LTE",  mcc:655, mnc:1,  range:900 },
  { id:"s093", lat:-26.210, lng:28.052, radio:"NR",   mcc:655, mnc:7,  range:400 },
  { id:"s094", lat:-26.178, lng:28.016, radio:"UMTS", mcc:655, mnc:10, range:2000 },
  // Dar es Salaam (MCC 640)
  { id:"s095", lat:-6.776, lng:39.178,  radio:"LTE",  mcc:640, mnc:2,  range:1500 },
  { id:"s096", lat:-6.790, lng:39.195,  radio:"GSM",  mcc:640, mnc:4,  range:10000 },
  // Accra (MCC 620)
  { id:"s097", lat:5.556,  lng:-0.197,  radio:"LTE",  mcc:620, mnc:1,  range:1500 },
  { id:"s098", lat:5.571,  lng:-0.213,  radio:"UMTS", mcc:620, mnc:6,  range:3000 },
  // Addis Ababa (MCC 636)
  { id:"s099", lat:9.025,  lng:38.747,  radio:"LTE",  mcc:636, mnc:1,  range:2000 },
  { id:"s100", lat:9.041,  lng:38.765,  radio:"GSM",  mcc:636, mnc:1,  range:8000 },
  // Kinshasa (MCC 630)
  { id:"s101", lat:-4.325, lng:15.322,  radio:"UMTS", mcc:630, mnc:5,  range:5000 },
  { id:"s102", lat:-4.340, lng:15.338,  radio:"GSM",  mcc:630, mnc:10, range:15000 },
  // Casablanca (MCC 604)
  { id:"s103", lat:33.589, lng:-7.604,  radio:"LTE",  mcc:604, mnc:1,  range:1500 },
  { id:"s104", lat:33.605, lng:-7.622,  radio:"UMTS", mcc:604, mnc:2,  range:3000 },
  // Rural Africa
  { id:"s105", lat:14.716, lng:-17.467, radio:"GSM",  mcc:608, mnc:1,  range:20000 },
  { id:"s106", lat:12.364, lng:-1.534,  radio:"GSM",  mcc:613, mnc:3,  range:25000 },
  { id:"s107", lat:-8.838, lng:13.235,  radio:"UMTS", mcc:631, mnc:2,  range:8000 },
  { id:"s108", lat:15.552, lng:32.532,  radio:"UMTS", mcc:634, mnc:5,  range:10000 },
  // === MIDDLE EAST ===
  // Dubai (MCC 424)
  { id:"s109", lat:25.204, lng:55.270,  radio:"NR",   mcc:424, mnc:2,  range:300 },
  { id:"s110", lat:25.219, lng:55.289,  radio:"LTE",  mcc:424, mnc:3,  range:700 },
  { id:"s111", lat:25.188, lng:55.250,  radio:"LTE",  mcc:424, mnc:2,  range:900 },
  // Riyadh (MCC 420)
  { id:"s112", lat:24.688, lng:46.722,  radio:"LTE",  mcc:420, mnc:1,  range:1500 },
  { id:"s113", lat:24.703, lng:46.740,  radio:"NR",   mcc:420, mnc:7,  range:400 },
  { id:"s114", lat:24.672, lng:46.703,  radio:"UMTS", mcc:420, mnc:3,  range:5000 },
  // Tehran (MCC 432)
  { id:"s115", lat:35.694, lng:51.422,  radio:"LTE",  mcc:432, mnc:11, range:1200 },
  { id:"s116", lat:35.710, lng:51.440,  radio:"UMTS", mcc:432, mnc:19, range:3000 },
  // Istanbul (MCC 286)
  { id:"s117", lat:41.013, lng:28.955,  radio:"LTE",  mcc:286, mnc:1,  range:900 },
  { id:"s118", lat:41.028, lng:28.975,  radio:"NR",   mcc:286, mnc:2,  range:400 },
  // Tel Aviv (MCC 425)
  { id:"s119", lat:32.085, lng:34.782,  radio:"NR",   mcc:425, mnc:1,  range:300 },
  { id:"s120", lat:32.100, lng:34.799,  radio:"LTE",  mcc:425, mnc:7,  range:700 },
  // === SOUTH ASIA ===
  // Mumbai (MCC 404)
  { id:"s121", lat:19.076, lng:72.878,  radio:"LTE",  mcc:404, mnc:1,  range:800 },
  { id:"s122", lat:19.092, lng:72.896,  radio:"NR",   mcc:404, mnc:20, range:350 },
  { id:"s123", lat:19.058, lng:72.860,  radio:"LTE",  mcc:404, mnc:45, range:1000 },
  { id:"s124", lat:19.108, lng:72.912,  radio:"UMTS", mcc:404, mnc:1,  range:2500 },
  { id:"s125", lat:19.044, lng:72.841,  radio:"GSM",  mcc:404, mnc:10, range:5000 },
  // Delhi
  { id:"s126", lat:28.613, lng:77.209,  radio:"LTE",  mcc:404, mnc:45, range:900 },
  { id:"s127", lat:28.630, lng:77.228,  radio:"NR",   mcc:404, mnc:20, range:350 },
  { id:"s128", lat:28.596, lng:77.190,  radio:"LTE",  mcc:404, mnc:1,  range:1100 },
  { id:"s129", lat:28.647, lng:77.247,  radio:"UMTS", mcc:404, mnc:10, range:2500 },
  // Bangalore
  { id:"s130", lat:12.971, lng:77.594,  radio:"NR",   mcc:404, mnc:20, range:400 },
  { id:"s131", lat:12.988, lng:77.612,  radio:"LTE",  mcc:404, mnc:45, range:900 },
  // Chennai
  { id:"s132", lat:13.083, lng:80.270,  radio:"LTE",  mcc:404, mnc:1,  range:1000 },
  { id:"s133", lat:13.099, lng:80.288,  radio:"UMTS", mcc:404, mnc:10, range:2500 },
  // Karachi (MCC 410)
  { id:"s134", lat:24.860, lng:67.010,  radio:"LTE",  mcc:410, mnc:1,  range:1200 },
  { id:"s135", lat:24.876, lng:67.028,  radio:"UMTS", mcc:410, mnc:3,  range:3000 },
  { id:"s136", lat:24.844, lng:66.992,  radio:"GSM",  mcc:410, mnc:6,  range:8000 },
  // Dhaka (MCC 470)
  { id:"s137", lat:23.811, lng:90.412,  radio:"LTE",  mcc:470, mnc:1,  range:1000 },
  { id:"s138", lat:23.827, lng:90.430,  radio:"UMTS", mcc:470, mnc:7,  range:2500 },
  // Colombo (MCC 413)
  { id:"s139", lat:6.927,  lng:79.861,  radio:"LTE",  mcc:413, mnc:2,  range:1500 },
  { id:"s140", lat:6.911,  lng:79.844,  radio:"UMTS", mcc:413, mnc:1,  range:3000 },
  // Rural India
  { id:"s141", lat:26.912, lng:75.787,  radio:"LTE",  mcc:404, mnc:20, range:3000 },
  { id:"s142", lat:22.572, lng:88.363,  radio:"NR",   mcc:404, mnc:20, range:500 },
  { id:"s143", lat:17.385, lng:78.486,  radio:"LTE",  mcc:404, mnc:45, range:1500 },
  { id:"s144", lat:25.313, lng:83.006,  radio:"GSM",  mcc:404, mnc:10, range:12000 },
  // === EAST ASIA ===
  // Beijing (MCC 460)
  { id:"s145", lat:39.907, lng:116.391, radio:"NR",   mcc:460, mnc:0,  range:300 },
  { id:"s146", lat:39.923, lng:116.412, radio:"LTE",  mcc:460, mnc:1,  range:600 },
  { id:"s147", lat:39.890, lng:116.370, radio:"LTE",  mcc:460, mnc:0,  range:800 },
  { id:"s148", lat:39.939, lng:116.432, radio:"NR",   mcc:460, mnc:11, range:250 },
  { id:"s149", lat:39.873, lng:116.348, radio:"UMTS", mcc:460, mnc:1,  range:2000 },
  // Shanghai
  { id:"s150", lat:31.228, lng:121.474, radio:"NR",   mcc:460, mnc:0,  range:250 },
  { id:"s151", lat:31.244, lng:121.493, radio:"LTE",  mcc:460, mnc:1,  range:600 },
  { id:"s152", lat:31.211, lng:121.453, radio:"LTE",  mcc:460, mnc:0,  range:800 },
  { id:"s153", lat:31.260, lng:121.514, radio:"NR",   mcc:460, mnc:11, range:300 },
  // Shenzhen
  { id:"s154", lat:22.543, lng:114.058, radio:"NR",   mcc:460, mnc:0,  range:200 },
  { id:"s155", lat:22.559, lng:114.077, radio:"LTE",  mcc:460, mnc:1,  range:500 },
  // Tokyo (MCC 440)
  { id:"s156", lat:35.681, lng:139.769, radio:"NR",   mcc:440, mnc:10, range:200 },
  { id:"s157", lat:35.697, lng:139.789, radio:"LTE",  mcc:440, mnc:20, range:500 },
  { id:"s158", lat:35.664, lng:139.749, radio:"LTE",  mcc:440, mnc:90, range:700 },
  { id:"s159", lat:35.713, lng:139.808, radio:"NR",   mcc:440, mnc:10, range:250 },
  // Osaka
  { id:"s160", lat:34.693, lng:135.502, radio:"NR",   mcc:440, mnc:20, range:250 },
  { id:"s161", lat:34.709, lng:135.521, radio:"LTE",  mcc:440, mnc:10, range:600 },
  // Seoul (MCC 450)
  { id:"s162", lat:37.566, lng:126.978, radio:"NR",   mcc:450, mnc:5,  range:200 },
  { id:"s163", lat:37.582, lng:126.997, radio:"LTE",  mcc:450, mnc:8,  range:500 },
  { id:"s164", lat:37.549, lng:126.959, radio:"NR",   mcc:450, mnc:2,  range:250 },
  // Busan
  { id:"s165", lat:35.180, lng:129.076, radio:"NR",   mcc:450, mnc:5,  range:300 },
  { id:"s166", lat:35.196, lng:129.095, radio:"LTE",  mcc:450, mnc:8,  range:600 },
  // Hong Kong (MCC 454)
  { id:"s167", lat:22.319, lng:114.170, radio:"NR",   mcc:454, mnc:4,  range:250 },
  { id:"s168", lat:22.335, lng:114.188, radio:"LTE",  mcc:454, mnc:6,  range:600 },
  // Taipei (MCC 466)
  { id:"s169", lat:25.047, lng:121.517, radio:"LTE",  mcc:466, mnc:92, range:700 },
  { id:"s170", lat:25.063, lng:121.535, radio:"NR",   mcc:466, mnc:97, range:300 },
  // Rural China
  { id:"s171", lat:30.667, lng:104.067, radio:"LTE",  mcc:460, mnc:1,  range:3000 },
  { id:"s172", lat:36.057, lng:103.833, radio:"LTE",  mcc:460, mnc:0,  range:5000 },
  { id:"s173", lat:43.826, lng:87.617,  radio:"LTE",  mcc:460, mnc:11, range:8000 },
  // === SOUTHEAST ASIA ===
  // Jakarta (MCC 510)
  { id:"s174", lat:-6.208, lng:106.846, radio:"LTE",  mcc:510, mnc:1,  range:900 },
  { id:"s175", lat:-6.224, lng:106.864, radio:"NR",   mcc:510, mnc:8,  range:400 },
  { id:"s176", lat:-6.191, lng:106.827, radio:"UMTS", mcc:510, mnc:11, range:2500 },
  { id:"s177", lat:-6.240, lng:106.882, radio:"LTE",  mcc:510, mnc:21, range:1200 },
  // Manila (MCC 515)
  { id:"s178", lat:14.596, lng:120.984, radio:"LTE",  mcc:515, mnc:2,  range:800 },
  { id:"s179", lat:14.612, lng:121.002, radio:"NR",   mcc:515, mnc:5,  range:400 },
  { id:"s180", lat:14.579, lng:120.966, radio:"UMTS", mcc:515, mnc:3,  range:2000 },
  // Bangkok (MCC 520)
  { id:"s181", lat:13.754, lng:100.501, radio:"LTE",  mcc:520, mnc:3,  range:900 },
  { id:"s182", lat:13.770, lng:100.519, radio:"NR",   mcc:520, mnc:4,  range:400 },
  { id:"s183", lat:13.737, lng:100.482, radio:"UMTS", mcc:520, mnc:15, range:2500 },
  // Kuala Lumpur (MCC 502)
  { id:"s184", lat:3.147,  lng:101.693, radio:"LTE",  mcc:502, mnc:12, range:1000 },
  { id:"s185", lat:3.163,  lng:101.711, radio:"NR",   mcc:502, mnc:19, range:400 },
  // Singapore (MCC 525)
  { id:"s186", lat:1.290,  lng:103.852, radio:"NR",   mcc:525, mnc:5,  range:200 },
  { id:"s187", lat:1.305,  lng:103.870, radio:"LTE",  mcc:525, mnc:1,  range:500 },
  { id:"s188", lat:1.274,  lng:103.833, radio:"NR",   mcc:525, mnc:3,  range:250 },
  // Ho Chi Minh (MCC 452)
  { id:"s189", lat:10.775, lng:106.701, radio:"LTE",  mcc:452, mnc:1,  range:1000 },
  { id:"s190", lat:10.791, lng:106.719, radio:"UMTS", mcc:452, mnc:4,  range:2500 },
  // Yangon (MCC 414)
  { id:"s191", lat:16.866, lng:96.195,  radio:"LTE",  mcc:414, mnc:1,  range:1500 },
  { id:"s192", lat:16.882, lng:96.213,  radio:"UMTS", mcc:414, mnc:5,  range:4000 },
  // === RUSSIA/CENTRAL ASIA ===
  // Moscow (MCC 250)
  { id:"s193", lat:55.751, lng:37.623,  radio:"LTE",  mcc:250, mnc:1,  range:900 },
  { id:"s194", lat:55.767, lng:37.641,  radio:"NR",   mcc:250, mnc:2,  range:400 },
  { id:"s195", lat:55.734, lng:37.604,  radio:"LTE",  mcc:250, mnc:99, range:1100 },
  // St. Petersburg
  { id:"s196", lat:59.939, lng:30.315,  radio:"LTE",  mcc:250, mnc:1,  range:1000 },
  { id:"s197", lat:59.955, lng:30.333,  radio:"UMTS", mcc:250, mnc:2,  range:2500 },
  // Almaty (MCC 401)
  { id:"s198", lat:43.238, lng:76.946,  radio:"LTE",  mcc:401, mnc:2,  range:1500 },
  { id:"s199", lat:43.254, lng:76.964,  radio:"UMTS", mcc:401, mnc:77, range:4000 },
  // Tashkent (MCC 434)
  { id:"s200", lat:41.299, lng:69.240,  radio:"LTE",  mcc:434, mnc:4,  range:2000 },
  { id:"s201", lat:41.315, lng:69.258,  radio:"UMTS", mcc:434, mnc:7,  range:5000 },
  // Rural Russia / Siberia
  { id:"s202", lat:56.838, lng:60.609,  radio:"LTE",  mcc:250, mnc:2,  range:5000 },
  { id:"s203", lat:53.202, lng:50.176,  radio:"GSM",  mcc:250, mnc:20, range:30000 },
  { id:"s204", lat:61.788, lng:34.365,  radio:"GSM",  mcc:250, mnc:3,  range:25000 },
  // === AUSTRALIA/OCEANIA ===
  // Sydney (MCC 505)
  { id:"s205", lat:-33.868, lng:151.207, radio:"NR",   mcc:505, mnc:1,  range:300 },
  { id:"s206", lat:-33.884, lng:151.226, radio:"LTE",  mcc:505, mnc:3,  range:700 },
  { id:"s207", lat:-33.851, lng:151.188, radio:"LTE",  mcc:505, mnc:6,  range:900 },
  // Melbourne
  { id:"s208", lat:-37.814, lng:144.963, radio:"NR",   mcc:505, mnc:1,  range:300 },
  { id:"s209", lat:-37.830, lng:144.981, radio:"LTE",  mcc:505, mnc:3,  range:800 },
  // Brisbane
  { id:"s210", lat:-27.470, lng:153.021, radio:"LTE",  mcc:505, mnc:6,  range:900 },
  { id:"s211", lat:-27.486, lng:153.040, radio:"NR",   mcc:505, mnc:1,  range:350 },
  // Auckland, NZ (MCC 530)
  { id:"s212", lat:-36.852, lng:174.763, radio:"LTE",  mcc:530, mnc:24, range:1200 },
  { id:"s213", lat:-36.868, lng:174.782, radio:"NR",   mcc:530, mnc:5,  range:400 },
  // Rural Australia
  { id:"s214", lat:-23.698, lng:133.882, radio:"LTE",  mcc:505, mnc:3,  range:50000 },
  { id:"s215", lat:-31.953, lng:115.857, radio:"LTE",  mcc:505, mnc:1,  range:5000 },
  // Additional high-density fills (global urban fill)
  { id:"s216", lat:52.370, lng:4.895,   radio:"NR",   mcc:204, mnc:8,  range:300 },
  { id:"s217", lat:48.853, lng:2.350,   radio:"NR",   mcc:208, mnc:10, range:250 },
  { id:"s218", lat:51.507, lng:-0.128,  radio:"LTE",  mcc:234, mnc:30, range:600 },
  { id:"s219", lat:40.714, lng:-74.008, radio:"LTE",  mcc:310, mnc:410, range:500 },
  { id:"s220", lat:34.053, lng:-118.245, radio:"NR",  mcc:310, mnc:260, range:250 },
  { id:"s221", lat:35.682, lng:139.772, radio:"NR",   mcc:440, mnc:20, range:200 },
  { id:"s222", lat:22.544, lng:114.060, radio:"NR",   mcc:460, mnc:11, range:200 },
  { id:"s223", lat:1.291,  lng:103.854, radio:"NR",   mcc:525, mnc:5,  range:200 },
  { id:"s224", lat:37.567, lng:126.980, radio:"NR",   mcc:450, mnc:5,  range:200 },
  { id:"s225", lat:19.078, lng:72.880,  radio:"NR",   mcc:404, mnc:20, range:300 },
  { id:"s226", lat:39.908, lng:116.393, radio:"NR",   mcc:460, mnc:0,  range:250 },
  { id:"s227", lat:43.651, lng:-79.381, radio:"NR",   mcc:302, mnc:720, range:300 },
  { id:"s228", lat:48.209, lng:16.373,  radio:"NR",   mcc:232, mnc:1,  range:350 },
  { id:"s229", lat:59.334, lng:18.067,  radio:"NR",   mcc:240, mnc:7,  range:300 },
  { id:"s230", lat:55.676, lng:12.568,  radio:"NR",   mcc:238, mnc:2,  range:350 },
]

// ── Handler ────────────────────────────────────────────────────────────────────

export async function GET() {
  // 1. Try OpenCelliD if key is set
  const ocid = await fetchOpenCelliD()
  if (ocid.length > 100) {
    return NextResponse.json(ocid, {
      headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=172800" },
    })
  }

  // 2. Try OSM Overpass — fetch all regions in parallel
  const osmResults = await Promise.allSettled(OSM_REGIONS.map(fetchOSMRegion))
  const osmTowers  = osmResults.flatMap(r => r.status === "fulfilled" ? r.value : [])

  if (osmTowers.length > 50) {
    // Deduplicate by rounding to ~100m grid
    const seen = new Set<string>()
    const deduped: CellTower[] = []
    for (const t of osmTowers) {
      const key = `${(t.lat * 100).toFixed(0)},${(t.lng * 100).toFixed(0)}`
      if (!seen.has(key)) { seen.add(key); deduped.push(t) }
    }
    return NextResponse.json(deduped, {
      headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=172800" },
    })
  }

  // 3. Static fallback
  return NextResponse.json(STATIC_TOWERS, {
    headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=172800" },
  })
}

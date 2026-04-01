// =============================================================================
// UC14 — Global AI Inference Grid Data Layer
// 25 GPU clusters, 8 hyperscalers, seeded synthetic data
// =============================================================================

export type Provider = "AWS" | "Azure" | "GCP" | "CoreWeave" | "Lambda" | "Together" | "Groq" | "Cerebras"
export type ClusterStatus = "HEALTHY" | "DEGRADED" | "OVERLOADED" | "OFFLINE"
export type Region = "NA-EAST" | "NA-WEST" | "EU-WEST" | "EU-CENTRAL" | "APAC-EAST" | "APAC-SOUTH" | "ME" | "SA"

export interface DataCenter {
  id: string
  name: string
  provider: Provider
  region: Region
  city: string
  country: string
  lat: number
  lng: number
  gpuCount: number
  gpuModel: "H100" | "A100" | "H200" | "GH200" | "TPU-v5"
  powerDrawMW: number
  pue: number
  carbonIntensity: number
  status: ClusterStatus
  gpuUtilization: number
  inferenceLatencyP50: number
  inferenceLatencyP99: number
  requestQueueDepth: number
  greenScore: number
  models: string[]
}

export interface TimeSeriesPoint {
  hour: number
  gpuUtilization: number
  powerDraw: number
  requestsPerSec: number
  latencyP50: number
  latencyP99: number
  carbonIntensity: number
}

export interface RegionStats {
  region: Region
  label: string
  dataCenterCount: number
  totalGPUs: number
  avgUtilization: number
  avgLatencyP50: number
  avgCarbonIntensity: number
  healthyCount: number
}

// ─── Seeded random helper ──────────────────────────────────────────────────

function seeded(seed: number, offset = 0): number {
  return Math.abs(Math.sin(seed + offset) * 10000) % 1
}

function seededRange(seed: number, offset: number, min: number, max: number): number {
  return min + seeded(seed, offset) * (max - min)
}

// ─── Raw DC definitions ────────────────────────────────────────────────────

interface DCDef {
  id: string
  name: string
  provider: Provider
  region: Region
  city: string
  country: string
  lat: number
  lng: number
  gpuModel: "H100" | "A100" | "H200" | "GH200" | "TPU-v5"
  baseCarbon: number
  basePue: number
  gpuCountMin: number
  gpuCountMax: number
  models: string[]
  isGroq?: boolean
}

const DC_DEFS: DCDef[] = [
  // AWS (5)
  {
    id: "DC-AWS-USE1", name: "AWS us-east-1", provider: "AWS", region: "NA-EAST",
    city: "Ashburn", country: "USA", lat: 38.9, lng: -77.4,
    gpuModel: "A100", baseCarbon: 320, basePue: 1.3,
    gpuCountMin: 4000, gpuCountMax: 8000,
    models: ["Llama-3.1-70B", "Titan-Text-G1", "Claude-3-Haiku", "Stable-Diffusion-XL"],
  },
  {
    id: "DC-AWS-USW2", name: "AWS us-west-2", provider: "AWS", region: "NA-WEST",
    city: "Portland", country: "USA", lat: 45.5, lng: -122.6,
    gpuModel: "A100", baseCarbon: 195, basePue: 1.25,
    gpuCountMin: 4000, gpuCountMax: 8000,
    models: ["Llama-3.1-70B", "Titan-Text-G1", "Titan-Embeddings"],
  },
  {
    id: "DC-AWS-EUW1", name: "AWS eu-west-1", provider: "AWS", region: "EU-WEST",
    city: "Dublin", country: "Ireland", lat: 53.3, lng: -6.2,
    gpuModel: "A100", baseCarbon: 270, basePue: 1.2,
    gpuCountMin: 4000, gpuCountMax: 6000,
    models: ["Llama-3.1-70B", "Titan-Text-G1"],
  },
  {
    id: "DC-AWS-APSE1", name: "AWS ap-southeast-1", provider: "AWS", region: "APAC-SOUTH",
    city: "Singapore", country: "Singapore", lat: 1.3, lng: 103.8,
    gpuModel: "A100", baseCarbon: 415, basePue: 1.35,
    gpuCountMin: 3000, gpuCountMax: 6000,
    models: ["Llama-3.1-70B", "Titan-Text-G1"],
  },
  {
    id: "DC-AWS-APNE1", name: "AWS ap-northeast-1", provider: "AWS", region: "APAC-EAST",
    city: "Tokyo", country: "Japan", lat: 35.6, lng: 139.7,
    gpuModel: "A100", baseCarbon: 480, basePue: 1.3,
    gpuCountMin: 3000, gpuCountMax: 6000,
    models: ["Llama-3.1-70B", "Titan-Text-G1"],
  },
  // Azure (5)
  {
    id: "DC-AZ-EUS", name: "Azure eastus", provider: "Azure", region: "NA-EAST",
    city: "Boydton", country: "USA", lat: 36.6, lng: -78.3,
    gpuModel: "A100", baseCarbon: 380, basePue: 1.28,
    gpuCountMin: 5000, gpuCountMax: 8000,
    models: ["Llama-3.1-70B", "GPT-4o", "Phi-3-Mini", "DALL-E-3"],
  },
  {
    id: "DC-AZ-WEU", name: "Azure westeurope", provider: "Azure", region: "EU-WEST",
    city: "Amsterdam", country: "Netherlands", lat: 52.3, lng: 4.9,
    gpuModel: "A100", baseCarbon: 38, basePue: 1.15,
    gpuCountMin: 4000, gpuCountMax: 7000,
    models: ["Llama-3.1-70B", "GPT-4o", "Phi-3-Mini"],
  },
  {
    id: "DC-AZ-SEA", name: "Azure southeastasia", provider: "Azure", region: "APAC-SOUTH",
    city: "Singapore", country: "Singapore", lat: 1.3, lng: 103.9,
    gpuModel: "A100", baseCarbon: 420, basePue: 1.32,
    gpuCountMin: 3000, gpuCountMax: 6000,
    models: ["Llama-3.1-70B", "GPT-4o"],
  },
  {
    id: "DC-AZ-JAE", name: "Azure japaneast", provider: "Azure", region: "APAC-EAST",
    city: "Tokyo", country: "Japan", lat: 35.6, lng: 139.8,
    gpuModel: "A100", baseCarbon: 470, basePue: 1.28,
    gpuCountMin: 3000, gpuCountMax: 5000,
    models: ["Llama-3.1-70B", "GPT-4o"],
  },
  {
    id: "DC-AZ-BRS", name: "Azure brazilsouth", provider: "Azure", region: "SA",
    city: "São Paulo", country: "Brazil", lat: -23.5, lng: -46.6,
    gpuModel: "A100", baseCarbon: 85, basePue: 1.3,
    gpuCountMin: 2000, gpuCountMax: 5000,
    models: ["Llama-3.1-70B", "GPT-4o"],
  },
  // GCP (5)
  {
    id: "DC-GCP-USC1", name: "GCP us-central1", provider: "GCP", region: "NA-EAST",
    city: "Council Bluffs", country: "USA", lat: 41.2, lng: -95.8,
    gpuModel: "TPU-v5", baseCarbon: 210, basePue: 1.22,
    gpuCountMin: 5000, gpuCountMax: 8000,
    models: ["Gemini-Pro", "Gemini-Flash", "PaLM-2", "Llama-3.1-70B"],
  },
  {
    id: "DC-GCP-EUW4", name: "GCP europe-west4", provider: "GCP", region: "EU-CENTRAL",
    city: "Eemshaven", country: "Netherlands", lat: 53.4, lng: 6.8,
    gpuModel: "TPU-v5", baseCarbon: 22, basePue: 1.1,
    gpuCountMin: 4000, gpuCountMax: 7000,
    models: ["Gemini-Pro", "Gemini-Flash", "PaLM-2"],
  },
  {
    id: "DC-GCP-ASE1", name: "GCP asia-east1", provider: "GCP", region: "APAC-EAST",
    city: "Changhua", country: "Taiwan", lat: 24.0, lng: 120.5,
    gpuModel: "A100", baseCarbon: 460, basePue: 1.3,
    gpuCountMin: 3000, gpuCountMax: 6000,
    models: ["Gemini-Pro", "Gemini-Flash"],
  },
  {
    id: "DC-GCP-ASSE1", name: "GCP asia-southeast1", provider: "GCP", region: "APAC-SOUTH",
    city: "Jurong", country: "Singapore", lat: 1.3, lng: 103.7,
    gpuModel: "A100", baseCarbon: 430, basePue: 1.28,
    gpuCountMin: 3000, gpuCountMax: 6000,
    models: ["Gemini-Pro", "Gemini-Flash"],
  },
  {
    id: "DC-GCP-MEW1", name: "GCP me-west1", provider: "GCP", region: "ME",
    city: "Tel Aviv", country: "Israel", lat: 32.1, lng: 34.9,
    gpuModel: "A100", baseCarbon: 560, basePue: 1.35,
    gpuCountMin: 2000, gpuCountMax: 5000,
    models: ["Gemini-Pro", "Gemini-Flash"],
  },
  // CoreWeave (3)
  {
    id: "DC-CW-ORD1", name: "CoreWeave ord1", provider: "CoreWeave", region: "NA-EAST",
    city: "Chicago", country: "USA", lat: 41.8, lng: -87.6,
    gpuModel: "H100", baseCarbon: 365, basePue: 1.2,
    gpuCountMin: 8000, gpuCountMax: 16000,
    models: ["Llama-3.1-405B", "Mistral-7B", "Stable-Diffusion-XL", "Llama-3.1-70B"],
  },
  {
    id: "DC-CW-LGA1", name: "CoreWeave lga1", provider: "CoreWeave", region: "NA-EAST",
    city: "New York", country: "USA", lat: 40.7, lng: -74.0,
    gpuModel: "H100", baseCarbon: 290, basePue: 1.22,
    gpuCountMin: 8000, gpuCountMax: 16000,
    models: ["Llama-3.1-405B", "Mistral-7B", "Stable-Diffusion-XL"],
  },
  {
    id: "DC-CW-AMS1", name: "CoreWeave ams1", provider: "CoreWeave", region: "EU-WEST",
    city: "Amsterdam", country: "Netherlands", lat: 52.4, lng: 4.9,
    gpuModel: "H100", baseCarbon: 35, basePue: 1.12,
    gpuCountMin: 6000, gpuCountMax: 12000,
    models: ["Llama-3.1-405B", "Mistral-7B", "Stable-Diffusion-XL"],
  },
  // Lambda (2)
  {
    id: "DC-LA-USW1", name: "Lambda us-west-1", provider: "Lambda", region: "NA-WEST",
    city: "San Jose", country: "USA", lat: 37.3, lng: -121.9,
    gpuModel: "A100", baseCarbon: 180, basePue: 1.25,
    gpuCountMin: 1000, gpuCountMax: 3000,
    models: ["Llama-3.1-405B", "Llama-3.1-70B", "Mistral-7B"],
  },
  {
    id: "DC-LA-USE1", name: "Lambda us-east-1", provider: "Lambda", region: "NA-EAST",
    city: "Washington DC", country: "USA", lat: 38.9, lng: -77.0,
    gpuModel: "A100", baseCarbon: 340, basePue: 1.28,
    gpuCountMin: 1000, gpuCountMax: 3000,
    models: ["Llama-3.1-405B", "Llama-3.1-70B"],
  },
  // Together (1)
  {
    id: "DC-TOG-SF1", name: "Together sf-bay", provider: "Together", region: "NA-WEST",
    city: "San Francisco", country: "USA", lat: 37.7, lng: -122.4,
    gpuModel: "H100", baseCarbon: 180, basePue: 1.2,
    gpuCountMin: 512, gpuCountMax: 2048,
    models: ["Llama-3.1-405B", "Qwen-72B", "FLUX.1", "Mixtral-8x7B"],
  },
  // Groq (1)
  {
    id: "DC-GRQ-US1", name: "Groq groq-us-1", provider: "Groq", region: "NA-EAST",
    city: "Dallas", country: "USA", lat: 32.7, lng: -96.8,
    gpuModel: "GH200", baseCarbon: 410, basePue: 1.18,
    gpuCountMin: 512, gpuCountMax: 2048,
    models: ["Llama-3.1-405B", "Llama-3.1-70B", "Mixtral-8x7B"],
    isGroq: true,
  },
  // Cerebras (1)
  {
    id: "DC-CER-CA1", name: "Cerebras cerebras-ca-1", provider: "Cerebras", region: "NA-WEST",
    city: "Santa Clara", country: "USA", lat: 37.4, lng: -122.0,
    gpuModel: "H200", baseCarbon: 190, basePue: 1.15,
    gpuCountMin: 512, gpuCountMax: 2048,
    models: ["Llama-3.1-405B", "Llama-3.1-70B", "Mixtral-8x7B"],
  },
  // Nvidia (1 — listed as "Cerebras" in the brief but making it a unique entry)
  {
    id: "DC-NV-SJ1", name: "Nvidia nvdc-sj", provider: "Cerebras", region: "NA-WEST",
    city: "San Jose", country: "USA", lat: 37.3, lng: -121.8,
    gpuModel: "H200", baseCarbon: 185, basePue: 1.16,
    gpuCountMin: 512, gpuCountMax: 2048,
    models: ["Llama-3.1-70B", "Stable-Diffusion-XL", "FLUX.1"],
  },
]

// ─── Status assignment (seeded) ────────────────────────────────────────────

function getStatus(seed: number, idx: number): ClusterStatus {
  const r = seeded(seed * idx + 7, 13)
  if (r < 0.80) return "HEALTHY"
  if (r < 0.90) return "DEGRADED"
  if (r < 0.98) return "OVERLOADED"
  return "OFFLINE"
}

// ─── Build DataCenter array ────────────────────────────────────────────────

function buildDataCenters(): DataCenter[] {
  return DC_DEFS.map((def, idx) => {
    const seed = idx * 500

    const gpuCount = Math.round(seededRange(seed, 1, def.gpuCountMin, def.gpuCountMax))
    const pue = def.basePue + seeded(seed, 2) * 0.08
    const powerDrawMW = gpuCount * 0.0035 * pue
    const carbonIntensity = def.baseCarbon + seeded(seed, 3) * 40 - 20

    const status = getStatus(seed, idx + 1)

    // Groq gets very low latency due to LPU architecture
    const isGroq = def.isGroq === true
    const latencyP50 = isGroq
      ? seededRange(seed, 5, 8, 25)
      : seededRange(seed, 5, 45, 180)
    const latencyP99 = latencyP50 * (2.5 + seeded(seed, 6) * 2.0)

    const gpuUtil = status === "OFFLINE"
      ? 0
      : status === "OVERLOADED"
        ? seededRange(seed, 7, 88, 99)
        : status === "DEGRADED"
          ? seededRange(seed, 7, 60, 78)
          : seededRange(seed, 7, 45, 88)

    const queueDepth = status === "OFFLINE"
      ? 0
      : Math.round(seededRange(seed, 8, 0, 2400))

    // Green score: better with lower carbon, lower PUE
    const greenRaw = 100 - (carbonIntensity / 6) + (15 - pue * 10)
    const greenScore = Math.max(0, Math.min(100, Math.round(greenRaw)))

    return {
      id: def.id,
      name: def.name,
      provider: def.provider,
      region: def.region,
      city: def.city,
      country: def.country,
      lat: def.lat,
      lng: def.lng,
      gpuCount,
      gpuModel: def.gpuModel,
      powerDrawMW: Math.round(powerDrawMW * 10) / 10,
      pue: Math.round(pue * 100) / 100,
      carbonIntensity: Math.round(carbonIntensity),
      status,
      gpuUtilization: Math.round(gpuUtil),
      inferenceLatencyP50: Math.round(latencyP50),
      inferenceLatencyP99: Math.round(latencyP99),
      requestQueueDepth: queueDepth,
      greenScore,
      models: def.models,
    }
  })
}

// ─── Cached data ───────────────────────────────────────────────────────────

let _dataCenters: DataCenter[] | null = null

export function getDataCenters(): DataCenter[] {
  if (!_dataCenters) _dataCenters = buildDataCenters()
  return _dataCenters
}

export function getDataCenter(id: string): DataCenter | undefined {
  return getDataCenters().find(dc => dc.id === id)
}

// ─── Time series ───────────────────────────────────────────────────────────

export function getTimeSeriesForDC(id: string): TimeSeriesPoint[] {
  const dc = getDataCenter(id)
  if (!dc) return []

  const seed = dc.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)

  return Array.from({ length: 24 }, (_, hour) => {
    // Business hours bump
    const businessHourFactor = hour >= 8 && hour <= 20 ? 1.15 : 0.82
    const noise = (seeded(seed + hour, 42) - 0.5) * 12

    const gpuUtil = Math.max(
      0,
      Math.min(100, dc.gpuUtilization * businessHourFactor + noise)
    )
    const powerDraw = dc.powerDrawMW * (gpuUtil / (dc.gpuUtilization || 1)) * (0.9 + seeded(seed + hour, 11) * 0.2)
    const rps = Math.round(gpuUtil * seededRange(seed + hour, 77, 3, 12))
    const latNoise = (seeded(seed + hour, 33) - 0.5) * dc.inferenceLatencyP50 * 0.3
    const latP50 = Math.max(5, dc.inferenceLatencyP50 + latNoise)
    const latP99 = latP50 * (2.5 + seeded(seed + hour, 99) * 2.0)
    const ciNoise = (seeded(seed + hour, 55) - 0.5) * dc.carbonIntensity * 0.1
    const carbonIntensity = Math.max(0, dc.carbonIntensity + ciNoise)

    return {
      hour,
      gpuUtilization: Math.round(gpuUtil * 10) / 10,
      powerDraw: Math.round(powerDraw * 10) / 10,
      requestsPerSec: rps,
      latencyP50: Math.round(latP50),
      latencyP99: Math.round(latP99),
      carbonIntensity: Math.round(carbonIntensity),
    }
  })
}

// ─── Region stats ──────────────────────────────────────────────────────────

const REGION_LABELS: Record<Region, string> = {
  "NA-EAST": "North America East",
  "NA-WEST": "North America West",
  "EU-WEST": "Europe West",
  "EU-CENTRAL": "Europe Central",
  "APAC-EAST": "APAC East",
  "APAC-SOUTH": "APAC South",
  "ME": "Middle East",
  "SA": "South America",
}

export function getRegionStats(): RegionStats[] {
  const dcs = getDataCenters()
  const regions = Array.from(new Set(dcs.map(dc => dc.region))) as Region[]

  return regions.map(region => {
    const rDCs = dcs.filter(dc => dc.region === region)
    const totalGPUs = rDCs.reduce((s, dc) => s + dc.gpuCount, 0)
    const avgUtilization = rDCs.reduce((s, dc) => s + dc.gpuUtilization, 0) / rDCs.length
    const avgLatencyP50 = rDCs.reduce((s, dc) => s + dc.inferenceLatencyP50, 0) / rDCs.length
    const avgCarbonIntensity = rDCs.reduce((s, dc) => s + dc.carbonIntensity, 0) / rDCs.length
    const healthyCount = rDCs.filter(dc => dc.status === "HEALTHY").length

    return {
      region,
      label: REGION_LABELS[region],
      dataCenterCount: rDCs.length,
      totalGPUs,
      avgUtilization: Math.round(avgUtilization * 10) / 10,
      avgLatencyP50: Math.round(avgLatencyP50),
      avgCarbonIntensity: Math.round(avgCarbonIntensity),
      healthyCount,
    }
  })
}

// ─── Global stats ──────────────────────────────────────────────────────────

export function getGlobalStats() {
  const dcs = getDataCenters()
  const totalGPUs = dcs.reduce((s, dc) => s + dc.gpuCount, 0)
  const avgUtilization = dcs.reduce((s, dc) => s + dc.gpuUtilization, 0) / dcs.length
  const activeClusters = dcs.filter(dc => dc.status !== "OFFLINE").length
  const totalPowerMW = dcs.reduce((s, dc) => s + dc.powerDrawMW, 0)
  const avgCarbonIntensity = dcs.reduce((s, dc) => s + dc.carbonIntensity, 0) / dcs.length
  const avgLatencyP50 = dcs.reduce((s, dc) => s + dc.inferenceLatencyP50, 0) / dcs.length

  return {
    totalGPUs,
    avgUtilization: Math.round(avgUtilization * 10) / 10,
    activeClusters,
    totalPowerMW: Math.round(totalPowerMW * 10) / 10,
    avgCarbonIntensity: Math.round(avgCarbonIntensity),
    avgLatencyP50: Math.round(avgLatencyP50),
  }
}

// ─── Provider comparison ───────────────────────────────────────────────────

export function getProviderComparison() {
  const dcs = getDataCenters()
  const providers = Array.from(new Set(dcs.map(dc => dc.provider))) as Provider[]

  return providers
    .map(provider => {
      const pDCs = dcs.filter(dc => dc.provider === provider)
      return {
        provider,
        clusters: pDCs.length,
        totalGPUs: pDCs.reduce((s, dc) => s + dc.gpuCount, 0),
        avgUtilization: Math.round(pDCs.reduce((s, dc) => s + dc.gpuUtilization, 0) / pDCs.length * 10) / 10,
        avgLatencyP50: Math.round(pDCs.reduce((s, dc) => s + dc.inferenceLatencyP50, 0) / pDCs.length),
        avgGreenScore: Math.round(pDCs.reduce((s, dc) => s + dc.greenScore, 0) / pDCs.length),
      }
    })
    .sort((a, b) => b.avgUtilization - a.avgUtilization)
}

// ─── Top models ────────────────────────────────────────────────────────────

export function getTopModels() {
  const dcs = getDataCenters()
  const modelMap = new Map<string, { dcCount: number; totalLatency: number }>()

  dcs.forEach(dc => {
    dc.models.forEach(model => {
      const existing = modelMap.get(model) ?? { dcCount: 0, totalLatency: 0 }
      modelMap.set(model, {
        dcCount: existing.dcCount + 1,
        totalLatency: existing.totalLatency + dc.inferenceLatencyP50,
      })
    })
  })

  return Array.from(modelMap.entries())
    .map(([model, data]) => ({
      model,
      dcCount: data.dcCount,
      avgLatency: Math.round(data.totalLatency / data.dcCount),
    }))
    .sort((a, b) => b.dcCount - a.dcCount)
}

"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import Link from "next/link"

// ── Types ──────────────────────────────────────────────────────────────────────

type Operator =
  | "Microsoft"
  | "Google"
  | "Amazon"
  | "Meta"
  | "Oracle"
  | "Apple"
  | "Alibaba"
  | "ByteDance"
  | "Tencent"
  | "Baidu"
  | "IBM"
  | "Other"

type DCStatus = "operational" | "under-construction" | "announced"

interface DataCenter {
  id: string
  name: string
  operator: Operator
  lat: number
  lng: number
  city: string
  country: string
  mw: number
  gpuUnits: number
  status: DCStatus
  openYear: number
  aiFocused: boolean
  project?: string
}

interface CableArc {
  id: string
  sourceName: string
  sourceCoords: [number, number]  // [lng, lat]
  targetName: string
  targetCoords: [number, number]  // [lng, lat]
  operators: string[]
  capacityTbps: number
  laidYear: number
  name: string
}

// ── Operator colours ────────────────────────────────────────────────────────

const OP_COLORS: Record<Operator, [number, number, number, number]> = {
  Microsoft: [0,   120, 215, 230],
  Google:    [66,  133, 244, 230],
  Amazon:    [255, 153, 0,   230],
  Meta:      [24,  119, 242, 230],
  Oracle:    [255, 0,   0,   210],
  Apple:     [150, 150, 150, 210],
  Alibaba:   [255, 103, 0,   220],
  ByteDance: [37,  244, 238, 220],
  Tencent:   [18,  183, 107, 210],
  Baidu:     [56,  104, 218, 210],
  IBM:       [54,  100, 209, 210],
  Other:     [120, 120, 120, 180],
}

// ── Data: Hyperscale Data Centers ──────────────────────────────────────────

const DATA_CENTERS: DataCenter[] = [
  // ── Microsoft / OpenAI / Stargate ─────────────────────────────────────────
  {
    id: "msft-stargate-iowa",
    name: "Stargate Iowa Campus",
    operator: "Microsoft",
    lat: 41.878, lng: -93.098,
    city: "Ames", country: "USA",
    mw: 500, gpuUnits: 200000,
    status: "announced", openYear: 2026,
    aiFocused: true, project: "Stargate Phase 1",
  },
  {
    id: "msft-stargate-abilene",
    name: "Stargate Abilene TX",
    operator: "Microsoft",
    lat: 32.449, lng: -99.733,
    city: "Abilene", country: "USA",
    mw: 600, gpuUnits: 250000,
    status: "announced", openYear: 2026,
    aiFocused: true, project: "Stargate Phase 1",
  },
  {
    id: "msft-virginia",
    name: "Azure East US — Boydton",
    operator: "Microsoft",
    lat: 36.668, lng: -78.375,
    city: "Boydton", country: "USA",
    mw: 500, gpuUnits: 180000,
    status: "operational", openYear: 2019,
    aiFocused: true,
  },
  {
    id: "msft-chicago",
    name: "Azure North Central US",
    operator: "Microsoft",
    lat: 41.878, lng: -87.636,
    city: "Chicago", country: "USA",
    mw: 400, gpuUnits: 120000,
    status: "operational", openYear: 2018,
    aiFocused: true,
  },
  {
    id: "msft-amsterdam",
    name: "Azure West Europe",
    operator: "Microsoft",
    lat: 52.376, lng: 4.898,
    city: "Amsterdam", country: "Netherlands",
    mw: 300, gpuUnits: 90000,
    status: "operational", openYear: 2015,
    aiFocused: true,
  },
  {
    id: "msft-dublin",
    name: "Azure North Europe",
    operator: "Microsoft",
    lat: 53.350, lng: -6.266,
    city: "Dublin", country: "Ireland",
    mw: 280, gpuUnits: 85000,
    status: "operational", openYear: 2016,
    aiFocused: false,
  },
  {
    id: "msft-singapore",
    name: "Azure Southeast Asia",
    operator: "Microsoft",
    lat: 1.352, lng: 103.820,
    city: "Singapore", country: "Singapore",
    mw: 320, gpuUnits: 100000,
    status: "operational", openYear: 2017,
    aiFocused: true,
  },
  {
    id: "msft-tokyo",
    name: "Azure Japan East",
    operator: "Microsoft",
    lat: 35.652, lng: 139.839,
    city: "Tokyo", country: "Japan",
    mw: 250, gpuUnits: 75000,
    status: "operational", openYear: 2014,
    aiFocused: false,
  },
  {
    id: "msft-sydney",
    name: "Azure Australia East",
    operator: "Microsoft",
    lat: -33.865, lng: 151.210,
    city: "Sydney", country: "Australia",
    mw: 220, gpuUnits: 65000,
    status: "operational", openYear: 2014,
    aiFocused: false,
  },
  {
    id: "msft-saopaulo",
    name: "Azure Brazil South",
    operator: "Microsoft",
    lat: -23.550, lng: -46.633,
    city: "São Paulo", country: "Brazil",
    mw: 200, gpuUnits: 55000,
    status: "operational", openYear: 2014,
    aiFocused: false,
  },

  // ── Google / DeepMind ──────────────────────────────────────────────────────
  {
    id: "goog-dalles",
    name: "The Dalles — Columbia River",
    operator: "Google",
    lat: 45.594, lng: -121.178,
    city: "The Dalles", country: "USA",
    mw: 600, gpuUnits: 220000,
    status: "operational", openYear: 2006,
    aiFocused: true,
  },
  {
    id: "goog-council-bluffs",
    name: "Council Bluffs Data Center",
    operator: "Google",
    lat: 41.262, lng: -95.861,
    city: "Council Bluffs", country: "USA",
    mw: 500, gpuUnits: 190000,
    status: "operational", openYear: 2007,
    aiFocused: true,
  },
  {
    id: "goog-singapore",
    name: "Google Singapore DC",
    operator: "Google",
    lat: 1.340, lng: 103.704,
    city: "Singapore", country: "Singapore",
    mw: 380, gpuUnits: 130000,
    status: "operational", openYear: 2011,
    aiFocused: true,
  },
  {
    id: "goog-hamina",
    name: "Hamina Finland",
    operator: "Google",
    lat: 60.569, lng: 27.188,
    city: "Hamina", country: "Finland",
    mw: 300, gpuUnits: 95000,
    status: "operational", openYear: 2011,
    aiFocused: false,
  },
  {
    id: "goog-stghislain",
    name: "St Ghislain Belgium",
    operator: "Google",
    lat: 50.456, lng: 3.820,
    city: "Saint-Ghislain", country: "Belgium",
    mw: 280, gpuUnits: 88000,
    status: "operational", openYear: 2010,
    aiFocused: false,
  },
  {
    id: "goog-eemshaven",
    name: "Eemshaven Netherlands",
    operator: "Google",
    lat: 53.439, lng: 6.831,
    city: "Eemshaven", country: "Netherlands",
    mw: 320, gpuUnits: 100000,
    status: "operational", openYear: 2016,
    aiFocused: false,
  },
  {
    id: "goog-changhua",
    name: "Changhua County Taiwan",
    operator: "Google",
    lat: 24.052, lng: 120.516,
    city: "Changhua", country: "Taiwan",
    mw: 270, gpuUnits: 85000,
    status: "operational", openYear: 2013,
    aiFocused: true,
  },
  {
    id: "goog-sydney",
    name: "Google Sydney",
    operator: "Google",
    lat: -33.750, lng: 150.950,
    city: "Sydney", country: "Australia",
    mw: 180, gpuUnits: 55000,
    status: "operational", openYear: 2017,
    aiFocused: false,
  },
  {
    id: "goog-london",
    name: "Google London",
    operator: "Google",
    lat: 51.515, lng: -0.090,
    city: "London", country: "UK",
    mw: 200, gpuUnits: 65000,
    status: "operational", openYear: 2017,
    aiFocused: true,
  },
  {
    id: "goog-mumbai",
    name: "Google Mumbai",
    operator: "Google",
    lat: 19.076, lng: 72.878,
    city: "Mumbai", country: "India",
    mw: 190, gpuUnits: 60000,
    status: "operational", openYear: 2017,
    aiFocused: true,
  },

  // ── Amazon / AWS ───────────────────────────────────────────────────────────
  {
    id: "aws-ashburn",
    name: "AWS US East — Ashburn",
    operator: "Amazon",
    lat: 39.018, lng: -77.489,
    city: "Ashburn", country: "USA",
    mw: 700, gpuUnits: 260000,
    status: "operational", openYear: 2010,
    aiFocused: true,
  },
  {
    id: "aws-dublin",
    name: "AWS EU West — Dublin",
    operator: "Amazon",
    lat: 53.333, lng: -6.249,
    city: "Dublin", country: "Ireland",
    mw: 320, gpuUnits: 105000,
    status: "operational", openYear: 2007,
    aiFocused: false,
  },
  {
    id: "aws-singapore",
    name: "AWS Asia Pacific — Singapore",
    operator: "Amazon",
    lat: 1.278, lng: 103.848,
    city: "Singapore", country: "Singapore",
    mw: 500, gpuUnits: 185000,
    status: "operational", openYear: 2010,
    aiFocused: true,
  },
  {
    id: "aws-tokyo",
    name: "AWS Asia Pacific — Tokyo",
    operator: "Amazon",
    lat: 35.625, lng: 139.740,
    city: "Tokyo", country: "Japan",
    mw: 380, gpuUnits: 130000,
    status: "operational", openYear: 2011,
    aiFocused: false,
  },
  {
    id: "aws-sydney",
    name: "AWS Asia Pacific — Sydney",
    operator: "Amazon",
    lat: -33.900, lng: 151.188,
    city: "Sydney", country: "Australia",
    mw: 290, gpuUnits: 90000,
    status: "operational", openYear: 2012,
    aiFocused: false,
  },
  {
    id: "aws-frankfurt",
    name: "AWS EU Central — Frankfurt",
    operator: "Amazon",
    lat: 50.110, lng: 8.682,
    city: "Frankfurt", country: "Germany",
    mw: 350, gpuUnits: 115000,
    status: "operational", openYear: 2014,
    aiFocused: false,
  },
  {
    id: "aws-saopaulo",
    name: "AWS South America — São Paulo",
    operator: "Amazon",
    lat: -23.490, lng: -46.815,
    city: "São Paulo", country: "Brazil",
    mw: 180, gpuUnits: 50000,
    status: "operational", openYear: 2011,
    aiFocused: false,
  },
  {
    id: "aws-capetown",
    name: "AWS Africa — Cape Town",
    operator: "Amazon",
    lat: -33.918, lng: 18.424,
    city: "Cape Town", country: "South Africa",
    mw: 120, gpuUnits: 32000,
    status: "operational", openYear: 2022,
    aiFocused: false,
  },
  {
    id: "aws-hyderabad",
    name: "AWS Asia Pacific — Hyderabad",
    operator: "Amazon",
    lat: 17.385, lng: 78.487,
    city: "Hyderabad", country: "India",
    mw: 250, gpuUnits: 78000,
    status: "operational", openYear: 2022,
    aiFocused: true,
  },
  {
    id: "aws-seoul",
    name: "AWS Asia Pacific — Seoul",
    operator: "Amazon",
    lat: 37.533, lng: 127.041,
    city: "Seoul", country: "South Korea",
    mw: 300, gpuUnits: 95000,
    status: "operational", openYear: 2016,
    aiFocused: true,
  },

  // ── Meta ───────────────────────────────────────────────────────────────────
  {
    id: "meta-dekalb",
    name: "DeKalb Illinois AI Campus",
    operator: "Meta",
    lat: 41.930, lng: -88.749,
    city: "DeKalb", country: "USA",
    mw: 500, gpuUnits: 200000,
    status: "under-construction", openYear: 2026,
    aiFocused: true,
  },
  {
    id: "meta-eagle-mountain",
    name: "Eagle Mountain Utah",
    operator: "Meta",
    lat: 40.313, lng: -111.998,
    city: "Eagle Mountain", country: "USA",
    mw: 280, gpuUnits: 90000,
    status: "operational", openYear: 2022,
    aiFocused: true,
  },
  {
    id: "meta-papillion",
    name: "Papillion Nebraska",
    operator: "Meta",
    lat: 41.157, lng: -96.046,
    city: "Papillion", country: "USA",
    mw: 340, gpuUnits: 110000,
    status: "operational", openYear: 2020,
    aiFocused: true,
  },
  {
    id: "meta-menlopark",
    name: "Menlo Park HQ Cluster",
    operator: "Meta",
    lat: 37.452, lng: -122.181,
    city: "Menlo Park", country: "USA",
    mw: 160, gpuUnits: 60000,
    status: "operational", openYear: 2010,
    aiFocused: true,
  },
  {
    id: "meta-singapore",
    name: "Meta Singapore",
    operator: "Meta",
    lat: 1.297, lng: 103.787,
    city: "Singapore", country: "Singapore",
    mw: 170, gpuUnits: 52000,
    status: "operational", openYear: 2022,
    aiFocused: true,
  },
  {
    id: "meta-clonee",
    name: "Clonee Ireland",
    operator: "Meta",
    lat: 53.434, lng: -6.441,
    city: "Clonee", country: "Ireland",
    mw: 290, gpuUnits: 92000,
    status: "operational", openYear: 2017,
    aiFocused: false,
  },
  {
    id: "meta-odense",
    name: "Odense Denmark",
    operator: "Meta",
    lat: 55.404, lng: 10.402,
    city: "Odense", country: "Denmark",
    mw: 260, gpuUnits: 80000,
    status: "operational", openYear: 2020,
    aiFocused: false,
  },
  {
    id: "meta-lulea",
    name: "Luleå Sweden",
    operator: "Meta",
    lat: 65.584, lng: 22.157,
    city: "Luleå", country: "Sweden",
    mw: 280, gpuUnits: 85000,
    status: "operational", openYear: 2013,
    aiFocused: false,
  },

  // ── Alibaba / Aliyun ──────────────────────────────────────────────────────
  {
    id: "ali-hangzhou",
    name: "Alibaba Hangzhou HQ Campus",
    operator: "Alibaba",
    lat: 30.274, lng: 120.155,
    city: "Hangzhou", country: "China",
    mw: 600, gpuUnits: 210000,
    status: "operational", openYear: 2011,
    aiFocused: true,
  },
  {
    id: "ali-beijing",
    name: "Alibaba Beijing",
    operator: "Alibaba",
    lat: 39.904, lng: 116.407,
    city: "Beijing", country: "China",
    mw: 400, gpuUnits: 130000,
    status: "operational", openYear: 2012,
    aiFocused: true,
  },
  {
    id: "ali-shanghai",
    name: "Alibaba Shanghai",
    operator: "Alibaba",
    lat: 31.224, lng: 121.469,
    city: "Shanghai", country: "China",
    mw: 380, gpuUnits: 120000,
    status: "operational", openYear: 2013,
    aiFocused: true,
  },
  {
    id: "ali-singapore",
    name: "Alibaba Cloud Singapore",
    operator: "Alibaba",
    lat: 1.330, lng: 103.769,
    city: "Singapore", country: "Singapore",
    mw: 280, gpuUnits: 88000,
    status: "operational", openYear: 2016,
    aiFocused: false,
  },
  {
    id: "ali-jakarta",
    name: "Alibaba Cloud Jakarta",
    operator: "Alibaba",
    lat: -6.211, lng: 106.845,
    city: "Jakarta", country: "Indonesia",
    mw: 150, gpuUnits: 42000,
    status: "operational", openYear: 2018,
    aiFocused: false,
  },
  {
    id: "ali-frankfurt",
    name: "Alibaba Cloud Frankfurt",
    operator: "Alibaba",
    lat: 50.095, lng: 8.680,
    city: "Frankfurt", country: "Germany",
    mw: 140, gpuUnits: 40000,
    status: "operational", openYear: 2016,
    aiFocused: false,
  },
  {
    id: "ali-virginia",
    name: "Alibaba Cloud US East",
    operator: "Alibaba",
    lat: 38.990, lng: -77.461,
    city: "Ashburn", country: "USA",
    mw: 120, gpuUnits: 35000,
    status: "operational", openYear: 2015,
    aiFocused: false,
  },

  // ── ByteDance / TikTok ────────────────────────────────────────────────────
  {
    id: "bd-singapore",
    name: "ByteDance Singapore Cluster",
    operator: "ByteDance",
    lat: 1.360, lng: 103.869,
    city: "Singapore", country: "Singapore",
    mw: 350, gpuUnits: 130000,
    status: "operational", openYear: 2019,
    aiFocused: true,
  },
  {
    id: "bd-ashburn",
    name: "TikTok US East — Ashburn",
    operator: "ByteDance",
    lat: 39.036, lng: -77.503,
    city: "Ashburn", country: "USA",
    mw: 260, gpuUnits: 95000,
    status: "operational", openYear: 2020,
    aiFocused: true,
  },
  {
    id: "bd-london",
    name: "ByteDance London",
    operator: "ByteDance",
    lat: 51.495, lng: -0.142,
    city: "London", country: "UK",
    mw: 180, gpuUnits: 58000,
    status: "operational", openYear: 2021,
    aiFocused: true,
  },
  {
    id: "bd-dublin",
    name: "ByteDance Dublin",
    operator: "ByteDance",
    lat: 53.380, lng: -6.290,
    city: "Dublin", country: "Ireland",
    mw: 160, gpuUnits: 50000,
    status: "operational", openYear: 2022,
    aiFocused: false,
  },

  // ── Apple ─────────────────────────────────────────────────────────────────
  {
    id: "apple-maiden",
    name: "Apple Maiden NC",
    operator: "Apple",
    lat: 35.579, lng: -81.202,
    city: "Maiden", country: "USA",
    mw: 120, gpuUnits: 30000,
    status: "operational", openYear: 2012,
    aiFocused: false,
  },
  {
    id: "apple-reno",
    name: "Apple Reno NV",
    operator: "Apple",
    lat: 39.527, lng: -119.812,
    city: "Reno", country: "USA",
    mw: 130, gpuUnits: 32000,
    status: "operational", openYear: 2013,
    aiFocused: false,
  },
  {
    id: "apple-waukee",
    name: "Apple Waukee Iowa",
    operator: "Apple",
    lat: 41.601, lng: -93.888,
    city: "Waukee", country: "USA",
    mw: 150, gpuUnits: 38000,
    status: "operational", openYear: 2017,
    aiFocused: false,
  },
  {
    id: "apple-viborg",
    name: "Apple Viborg Denmark",
    operator: "Apple",
    lat: 56.453, lng: 9.402,
    city: "Viborg", country: "Denmark",
    mw: 100, gpuUnits: 22000,
    status: "operational", openYear: 2017,
    aiFocused: false,
  },
  {
    id: "apple-galway",
    name: "Apple Galway Ireland",
    operator: "Apple",
    lat: 53.271, lng: -9.056,
    city: "Galway", country: "Ireland",
    mw: 90, gpuUnits: 20000,
    status: "operational", openYear: 2017,
    aiFocused: false,
  },
  {
    id: "apple-singapore",
    name: "Apple Singapore",
    operator: "Apple",
    lat: 1.290, lng: 103.851,
    city: "Singapore", country: "Singapore",
    mw: 110, gpuUnits: 28000,
    status: "operational", openYear: 2019,
    aiFocused: false,
  },

  // ── Chinese AI Clusters ───────────────────────────────────────────────────
  {
    id: "cn-guizhou",
    name: "Guizhou Gui'an Big Data Center",
    operator: "Other",
    lat: 26.563, lng: 106.707,
    city: "Guiyang", country: "China",
    mw: 800, gpuUnits: 180000,
    status: "operational", openYear: 2015,
    aiFocused: true,
    project: "China National Big Data Strategy",
  },
  {
    id: "cn-innermongolia",
    name: "Inner Mongolia Data Center Park",
    operator: "Other",
    lat: 40.818, lng: 111.766,
    city: "Hohhot", country: "China",
    mw: 700, gpuUnits: 150000,
    status: "operational", openYear: 2014,
    aiFocused: true,
    project: "China National Computing Network",
  },
  {
    id: "cn-xinjiang",
    name: "Xinjiang Data Center Hub",
    operator: "Other",
    lat: 43.793, lng: 87.631,
    city: "Ürümqi", country: "China",
    mw: 500, gpuUnits: 90000,
    status: "operational", openYear: 2016,
    aiFocused: false,
    project: "Controversial: under international scrutiny",
  },
  {
    id: "cn-lanzhou",
    name: "Lanzhou Energy Hub DC",
    operator: "Other",
    lat: 36.061, lng: 103.834,
    city: "Lanzhou", country: "China",
    mw: 350, gpuUnits: 75000,
    status: "operational", openYear: 2018,
    aiFocused: false,
    project: "China Western Digital Hub",
  },
  {
    id: "baidu-beijing",
    name: "Baidu AI Cloud Beijing",
    operator: "Baidu",
    lat: 40.053, lng: 116.307,
    city: "Beijing", country: "China",
    mw: 320, gpuUnits: 120000,
    status: "operational", openYear: 2018,
    aiFocused: true,
  },
  {
    id: "tencent-shenzhen",
    name: "Tencent Shenzhen DC",
    operator: "Tencent",
    lat: 22.543, lng: 114.058,
    city: "Shenzhen", country: "China",
    mw: 350, gpuUnits: 110000,
    status: "operational", openYear: 2016,
    aiFocused: true,
  },
  {
    id: "tencent-shanghai",
    name: "Tencent Shanghai Hub",
    operator: "Tencent",
    lat: 31.303, lng: 121.480,
    city: "Shanghai", country: "China",
    mw: 280, gpuUnits: 88000,
    status: "operational", openYear: 2017,
    aiFocused: true,
  },

  // ── Oracle ─────────────────────────────────────────────────────────────────
  {
    id: "oracle-ashburn",
    name: "Oracle Cloud Ashburn",
    operator: "Oracle",
    lat: 39.025, lng: -77.476,
    city: "Ashburn", country: "USA",
    mw: 200, gpuUnits: 65000,
    status: "operational", openYear: 2016,
    aiFocused: true,
  },
  {
    id: "oracle-london",
    name: "Oracle Cloud London",
    operator: "Oracle",
    lat: 51.519, lng: -0.070,
    city: "London", country: "UK",
    mw: 160, gpuUnits: 48000,
    status: "operational", openYear: 2019,
    aiFocused: false,
  },
  {
    id: "oracle-abudhabi",
    name: "Oracle Cloud Abu Dhabi",
    operator: "Oracle",
    lat: 24.453, lng: 54.377,
    city: "Abu Dhabi", country: "UAE",
    mw: 180, gpuUnits: 55000,
    status: "operational", openYear: 2020,
    aiFocused: true,
  },
  {
    id: "oracle-tokyo",
    name: "Oracle Cloud Tokyo",
    operator: "Oracle",
    lat: 35.694, lng: 139.770,
    city: "Tokyo", country: "Japan",
    mw: 140, gpuUnits: 40000,
    status: "operational", openYear: 2019,
    aiFocused: false,
  },

  // ── IBM ───────────────────────────────────────────────────────────────────
  {
    id: "ibm-dallas",
    name: "IBM Cloud Dallas",
    operator: "IBM",
    lat: 32.778, lng: -96.799,
    city: "Dallas", country: "USA",
    mw: 150, gpuUnits: 38000,
    status: "operational", openYear: 2017,
    aiFocused: true,
  },
  {
    id: "ibm-frankfurt",
    name: "IBM Cloud Frankfurt",
    operator: "IBM",
    lat: 50.090, lng: 8.657,
    city: "Frankfurt", country: "Germany",
    mw: 120, gpuUnits: 30000,
    status: "operational", openYear: 2018,
    aiFocused: false,
  },
]

// ── Data: Undersea Cable Arcs ──────────────────────────────────────────────

const CABLE_ARCS: CableArc[] = [
  {
    id: "marea",
    name: "MAREA",
    sourceName: "Virginia Beach, USA",
    sourceCoords: [-75.978, 36.852],
    targetName: "Bilbao, Spain",
    targetCoords: [-2.935, 43.262],
    operators: ["Microsoft", "Facebook"],
    capacityTbps: 200,
    laidYear: 2017,
  },
  {
    id: "peace",
    name: "PEACE Cable",
    sourceName: "Singapore",
    sourceCoords: [103.826, 1.350],
    targetName: "Marseille, France",
    targetCoords: [5.369, 43.297],
    operators: ["PEACE Cable International"],
    capacityTbps: 96,
    laidYear: 2022,
  },
  {
    id: "faster",
    name: "FASTER",
    sourceName: "Oregon, USA",
    sourceCoords: [-124.107, 44.635],
    targetName: "Chiba, Japan",
    targetCoords: [140.115, 35.605],
    operators: ["Google", "China Mobile", "Global Transit"],
    capacityTbps: 60,
    laidYear: 2016,
  },
  {
    id: "havfrue",
    name: "Havfrue/AEC-2",
    sourceName: "New Jersey, USA",
    sourceCoords: [-74.011, 40.716],
    targetName: "Kristiansand, Norway",
    targetCoords: [7.997, 58.158],
    operators: ["Facebook", "Google", "Bulk Infrastructure"],
    capacityTbps: 264,
    laidYear: 2020,
  },
  {
    id: "2africa",
    name: "2Africa",
    sourceName: "London, UK",
    sourceCoords: [-0.118, 51.509],
    targetName: "Mumbai, India",
    targetCoords: [72.878, 19.076],
    operators: ["Meta", "China Mobile", "MTN", "Telecom Egypt"],
    capacityTbps: 180,
    laidYear: 2024,
  },
  {
    id: "apricot",
    name: "Apricot",
    sourceName: "Singapore",
    sourceCoords: [103.820, 1.340],
    targetName: "Fukuoka, Japan",
    targetCoords: [130.399, 33.590],
    operators: ["Google", "Meta", "PLDT"],
    capacityTbps: 190,
    laidYear: 2024,
  },
  {
    id: "blue-raman",
    name: "Blue-Raman",
    sourceName: "Genoa, Italy",
    sourceCoords: [8.940, 44.411],
    targetName: "Mumbai, India",
    targetCoords: [72.830, 18.947],
    operators: ["Google"],
    capacityTbps: 180,
    laidYear: 2022,
  },
  {
    id: "echo",
    name: "Echo",
    sourceName: "Oregon, USA",
    sourceCoords: [-124.006, 44.802],
    targetName: "Singapore",
    targetCoords: [103.870, 1.280],
    operators: ["Google", "Meta"],
    capacityTbps: 120,
    laidYear: 2023,
  },
  {
    id: "hmn",
    name: "HMN (Hai Ming Network)",
    sourceName: "Singapore",
    sourceCoords: [103.880, 1.320],
    targetName: "Tokyo, Japan",
    targetCoords: [139.810, 35.675],
    operators: ["HMN Technologies"],
    capacityTbps: 80,
    laidYear: 2019,
  },
  {
    id: "bifrost",
    name: "Bifrost",
    sourceName: "Los Angeles, USA",
    sourceCoords: [-118.243, 33.950],
    targetName: "Singapore",
    targetCoords: [103.836, 1.302],
    operators: ["Meta", "Keppel", "Telin"],
    capacityTbps: 100,
    laidYear: 2024,
  },
  {
    id: "jupiter",
    name: "Jupiter (Google)",
    sourceName: "Oregon, USA",
    sourceCoords: [-124.200, 44.100],
    targetName: "Tokyo, Japan",
    targetCoords: [139.700, 35.680],
    operators: ["Google", "KDDI", "SingTel"],
    capacityTbps: 60,
    laidYear: 2009,
  },
  {
    id: "seamewe6",
    name: "SEA-ME-WE 6",
    sourceName: "Marseille, France",
    sourceCoords: [5.372, 43.283],
    targetName: "Singapore",
    targetCoords: [103.845, 1.283],
    operators: ["SubCom", "Orange", "SingTel"],
    capacityTbps: 112,
    laidYear: 2025,
  },
  {
    id: "dunant",
    name: "Dunant",
    sourceName: "Virginia Beach, USA",
    sourceCoords: [-75.970, 36.843],
    targetName: "Saint-Hilaire, France",
    targetCoords: [-1.905, 46.951],
    operators: ["Google"],
    capacityTbps: 250,
    laidYear: 2021,
  },
  {
    id: "grace-hopper",
    name: "Grace Hopper",
    sourceName: "New York, USA",
    sourceCoords: [-73.970, 40.670],
    targetName: "Bude, UK",
    targetCoords: [-4.550, 50.825],
    operators: ["Google"],
    capacityTbps: 340,
    laidYear: 2022,
  },
  {
    id: "imewe",
    name: "I-ME-WE",
    sourceName: "London, UK",
    sourceCoords: [-0.125, 51.502],
    targetName: "Mumbai, India",
    targetCoords: [72.840, 18.980],
    operators: ["Tata Communications", "Vodafone"],
    capacityTbps: 3.84,
    laidYear: 2009,
  },
  {
    id: "apcn2",
    name: "APCN-2",
    sourceName: "Tokyo, Japan",
    sourceCoords: [139.770, 35.690],
    targetName: "Singapore",
    targetCoords: [103.856, 1.296],
    operators: ["AT&T", "BT", "China Telecom"],
    capacityTbps: 2.56,
    laidYear: 2001,
  },
  {
    id: "trans-pacific",
    name: "PCCW Trans-Pacific Express",
    sourceName: "Los Angeles, USA",
    sourceCoords: [-118.260, 33.748],
    targetName: "Hong Kong",
    targetCoords: [114.170, 22.320],
    operators: ["PCCW Global"],
    capacityTbps: 5.12,
    laidYear: 2008,
  },
  {
    id: "flag",
    name: "FLAG Atlantic-1",
    sourceName: "New York, USA",
    sourceCoords: [-74.050, 40.730],
    targetName: "London, UK",
    targetCoords: [-0.140, 51.540],
    operators: ["Reliance Jio", "FLAG Telecom"],
    capacityTbps: 10,
    laidYear: 2001,
  },
  {
    id: "sunrise",
    name: "Sunrise",
    sourceName: "Guam",
    sourceCoords: [144.794, 13.444],
    targetName: "Fukuoka, Japan",
    targetCoords: [130.358, 33.590],
    operators: ["Amazon", "SoftBank"],
    capacityTbps: 96,
    laidYear: 2023,
  },
  {
    id: "indigo-west",
    name: "Indigo-West",
    sourceName: "Perth, Australia",
    sourceCoords: [115.861, -31.952],
    targetName: "Singapore",
    targetCoords: [103.820, 1.359],
    operators: ["Google", "Vocus"],
    capacityTbps: 36,
    laidYear: 2019,
  },
  {
    id: "jupiter2",
    name: "JUNO (Japan-USA)",
    sourceName: "Los Angeles, USA",
    sourceCoords: [-118.280, 33.750],
    targetName: "Chita, Japan",
    targetCoords: [136.906, 34.970],
    operators: ["Amazon", "KDDI", "SoftBank"],
    capacityTbps: 60,
    laidYear: 2024,
  },
  {
    id: "areano",
    name: "AREANO (Europe-LatAm)",
    sourceName: "Lisbon, Portugal",
    sourceCoords: [-9.140, 38.710],
    targetName: "Rio de Janeiro, Brazil",
    targetCoords: [-43.172, -22.910],
    operators: ["EllaLink", "Tata"],
    capacityTbps: 72,
    laidYear: 2021,
  },
  {
    id: "ems",
    name: "EMS (Europe-Middle East-South Asia)",
    sourceName: "Marseille, France",
    sourceCoords: [5.380, 43.290],
    targetName: "Dubai, UAE",
    targetCoords: [55.296, 25.276],
    operators: ["Alcatel Submarine Networks"],
    capacityTbps: 16,
    laidYear: 2012,
  },
  {
    id: "aim",
    name: "AIM (Africa India MEA)",
    sourceName: "Cape Town, South Africa",
    sourceCoords: [18.417, -33.927],
    targetName: "Chennai, India",
    targetCoords: [80.270, 13.090],
    operators: ["Vodacom", "Tata"],
    capacityTbps: 40,
    laidYear: 2023,
  },
  {
    id: "curie",
    name: "Curie",
    sourceName: "Los Angeles, USA",
    sourceCoords: [-118.295, 33.943],
    targetName: "Valparaíso, Chile",
    targetCoords: [-71.619, -33.045],
    operators: ["Google"],
    capacityTbps: 72,
    laidYear: 2020,
  },
  {
    id: "equiano",
    name: "Equiano",
    sourceName: "Lisbon, Portugal",
    sourceCoords: [-9.136, 38.722],
    targetName: "Cape Town, South Africa",
    targetCoords: [18.427, -33.895],
    operators: ["Google"],
    capacityTbps: 144,
    laidYear: 2022,
  },
  {
    id: "cros-hk-guam",
    name: "CROS (Cross Pacific)",
    sourceName: "Hong Kong",
    sourceCoords: [114.188, 22.320],
    targetName: "Guam",
    targetCoords: [144.794, 13.444],
    operators: ["Amazon", "Google"],
    capacityTbps: 80,
    laidYear: 2023,
  },
  {
    id: "alaska",
    name: "Alaska Fiber",
    sourceName: "Seattle, USA",
    sourceCoords: [-122.335, 47.608],
    targetName: "Anchorage, USA",
    targetCoords: [-149.900, 61.218],
    operators: ["GCI"],
    capacityTbps: 4.8,
    laidYear: 2017,
  },
  {
    id: "transatlantic-1",
    name: "Amitié",
    sourceName: "Boston, USA",
    sourceCoords: [-71.058, 42.360],
    targetName: "Saint-Hilaire, France",
    targetCoords: [-1.903, 46.950],
    operators: ["Microsoft", "Facebook", "Aqua Comms"],
    capacityTbps: 400,
    laidYear: 2022,
  },
  {
    id: "express",
    name: "Express",
    sourceName: "Los Angeles, USA",
    sourceCoords: [-118.295, 33.940],
    targetName: "Tokyo, Japan",
    targetCoords: [139.755, 35.650],
    operators: ["Amazon"],
    capacityTbps: 50,
    laidYear: 2022,
  },
]

// ── Helper functions ───────────────────────────────────────────────────────

function columnHeight(mw: number): number {
  return Math.log10(Math.max(mw, 1)) * 2_000_000
}

function fmtMW(mw: number): string {
  if (mw >= 1000) return `${(mw / 1000).toFixed(1)}GW`
  return `${mw}MW`
}

const STATUS_COLORS: Record<DCStatus, string> = {
  operational:         "#22c55e",
  "under-construction": "#f59e0b",
  announced:           "#a78bfa",
}

const ALL_OPERATORS: Operator[] = [
  "Microsoft", "Google", "Amazon", "Meta",
  "Alibaba", "ByteDance", "Tencent", "Baidu",
  "Oracle", "Apple", "IBM", "Other",
]

// ── Main Component ─────────────────────────────────────────────────────────

export default function UC26Page() {
  const deckRef            = useRef<HTMLDivElement>(null)
  const [ready, setReady]  = useState(false)
  const [deckInst, setDeckInst] = useState<any>(null)
  const [pulse, setPulse]  = useState(0)

  const [selectedDC,      setSelectedDC]      = useState<DataCenter | null>(null)
  const [filterOperators, setFilterOperators] = useState<Set<Operator>>(new Set())
  const [filterStatus,    setFilterStatus]    = useState<Set<DCStatus>>(new Set())
  const [showCables,      setShowCables]      = useState(true)
  const [showStargate,    setShowStargate]    = useState(false)

  // Pulse animation for Stargate glow rings
  useEffect(() => {
    let id: number
    const tick = () => {
      setPulse(p => (p + 1) % 360)
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [])

  // Filtered data centers
  const visibleDCs = useMemo(() => {
    return DATA_CENTERS.filter(dc => {
      if (filterOperators.size > 0 && !filterOperators.has(dc.operator)) return false
      if (filterStatus.size > 0 && !filterStatus.has(dc.status)) return false
      return true
    })
  }, [filterOperators, filterStatus])

  // Stargate sites
  const stargateSites = useMemo(() => {
    if (!showStargate) return []
    return DATA_CENTERS.filter(dc => dc.project?.startsWith("Stargate"))
  }, [showStargate])

  // Stats
  const stats = useMemo(() => {
    const totalMW    = DATA_CENTERS.reduce((s, dc) => s + dc.mw, 0)
    const totalGPU   = DATA_CENTERS.reduce((s, dc) => s + dc.gpuUnits, 0)
    const mwByOp: Record<string, number> = {}
    for (const dc of DATA_CENTERS) {
      mwByOp[dc.operator] = (mwByOp[dc.operator] ?? 0) + dc.mw
    }
    const leaderboard = Object.entries(mwByOp)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
    return { totalMW, totalGPU, leaderboard }
  }, [])

  // Toggle operator filter
  const toggleOp = useCallback((op: Operator) => {
    setFilterOperators(prev => {
      const next = new Set(prev)
      if (next.has(op)) { next.delete(op) } else { next.add(op) }
      return next
    })
  }, [])

  const toggleStatus = useCallback((s: DCStatus) => {
    setFilterStatus(prev => {
      const next = new Set(prev)
      if (next.has(s)) { next.delete(s) } else { next.add(s) }
      return next
    })
  }, [])

  // Build layers
  const layers = useMemo(() => {
    const pulseRad = Math.sin((pulse * Math.PI) / 180)

    // Glow ScatterplotLayer
    const glowLayer = {
      type: "ScatterplotLayer",
      id: "glow",
      data: visibleDCs,
      getPosition: (d: DataCenter) => [d.lng, d.lat],
      getRadius: (d: DataCenter) => d.mw * 800 + 15000,
      getFillColor: (d: DataCenter) => {
        const c = OP_COLORS[d.operator]
        return [c[0], c[1], c[2], 25]
      },
      radiusUnits: "meters",
      pickable: false,
    }

    // Column towers
    const columnLayer = {
      type: "ColumnLayer",
      id: "towers",
      data: visibleDCs,
      diskResolution: 12,
      radius: 35000,
      getPosition: (d: DataCenter) => [d.lng, d.lat],
      getElevation: (d: DataCenter) => columnHeight(d.mw),
      getFillColor: (d: DataCenter) => {
        const c = OP_COLORS[d.operator]
        const sel = selectedDC?.id === d.id
        return sel ? [255, 255, 255, 255] : [c[0], c[1], c[2], c[3]]
      },
      elevationScale: 1,
      extruded: true,
      pickable: true,
      autoHighlight: true,
      highlightColor: [255, 255, 255, 80],
      onClick: (info: any) => {
        if (info.object) setSelectedDC(info.object as DataCenter)
      },
    }

    // Cable arcs
    const arcLayer = showCables ? {
      type: "ArcLayer",
      id: "cables",
      data: CABLE_ARCS,
      getSourcePosition: (d: CableArc) => d.sourceCoords,
      getTargetPosition: (d: CableArc) => d.targetCoords,
      getSourceColor: [0, 200, 255, 100],
      getTargetColor: [120, 80, 255, 100],
      getWidth: (d: CableArc) => Math.max(1, Math.log2(d.capacityTbps + 1) * 0.8),
      widthUnits: "pixels",
      greatCircle: true,
      pickable: false,
    } : null

    // Stargate pulse rings
    const stargateLayer = stargateSites.length > 0 ? {
      type: "ScatterplotLayer",
      id: "stargate-pulse",
      data: stargateSites,
      getPosition: (d: DataCenter) => [d.lng, d.lat],
      getRadius: (d: DataCenter) => d.mw * 1200 * (1 + 0.4 * Math.abs(pulseRad)),
      getFillColor: [168, 85, 247, Math.floor(60 + 40 * Math.abs(pulseRad))],
      radiusUnits: "meters",
      pickable: false,
    } : null

    return [glowLayer, arcLayer, stargateLayer, columnLayer].filter(Boolean)
  }, [visibleDCs, showCables, stargateSites, pulse, selectedDC])

  // Initialize deck.gl
  useEffect(() => {
    if (!deckRef.current) return

    let deck: any
    let mounted = true

    import("deck.gl").then((deckMod) => {
      if (!mounted || !deckRef.current) return

      const Deck        = deckMod.Deck as any
      const GlobeView   = (deckMod as any)._GlobeView

      const canvas = document.createElement("canvas")
      canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;"
      deckRef.current.appendChild(canvas)

      deck = new Deck({
        canvas,
        width: "100%",
        height: "100%",
        views: [new GlobeView({ id: "globe", repeat: true })],
        initialViewState: {
          longitude: 0,
          latitude: 20,
          zoom: 1.5,
        },
        controller: true,
        layers: [],
        parameters: {
          clearColor: [0.02, 0.02, 0.08, 1],
        },
      })

      setDeckInst(deck)
      setReady(true)
    })

    return () => {
      mounted = false
      deck?.finalize?.()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update layers when data/filters change
  useEffect(() => {
    if (!deckInst || !ready) return

    import("deck.gl").then((deckMod) => {
      const { ScatterplotLayer, ColumnLayer, ArcLayer } = deckMod

      const pulseRad = Math.sin((pulse * Math.PI) / 180)

      const glowLayer = new ScatterplotLayer({
        id: "glow",
        data: visibleDCs,
        getPosition: (d: DataCenter) => [d.lng, d.lat],
        getRadius: (d: DataCenter) => d.mw * 800 + 15000,
        getFillColor: (d: DataCenter) => {
          const c = OP_COLORS[d.operator]
          return [c[0], c[1], c[2], 25]
        },
        radiusUnits: "meters",
        pickable: false,
      })

      const columnLayer = new ColumnLayer({
        id: "towers",
        data: visibleDCs,
        diskResolution: 12,
        radius: 35000,
        getPosition: (d: DataCenter) => [d.lng, d.lat],
        getElevation: (d: DataCenter) => columnHeight(d.mw),
        getFillColor: (d: DataCenter) => {
          const c = OP_COLORS[d.operator]
          const sel = selectedDC?.id === d.id
          return sel ? [255, 255, 255, 255] : [c[0], c[1], c[2], c[3]]
        },
        elevationScale: 1,
        extruded: true,
        pickable: true,
        autoHighlight: true,
        highlightColor: [255, 255, 255, 80],
        onClick: (info: any) => {
          if (info.object) setSelectedDC(info.object as DataCenter)
        },
      })

      const arcLayer = showCables ? new ArcLayer({
        id: "cables",
        data: CABLE_ARCS,
        getSourcePosition: (d: CableArc) => d.sourceCoords,
        getTargetPosition: (d: CableArc) => d.targetCoords,
        getSourceColor: [0, 200, 255, 100],
        getTargetColor: [120, 80, 255, 100],
        getWidth: (d: CableArc) => Math.max(1, Math.log2(d.capacityTbps + 1) * 0.8),
        widthUnits: "pixels",
        greatCircle: true,
        pickable: false,
      }) : null

      const stargateLayer = stargateSites.length > 0 ? new ScatterplotLayer({
        id: "stargate-pulse",
        data: stargateSites,
        getPosition: (d: DataCenter) => [d.lng, d.lat],
        getRadius: (d: DataCenter) => d.mw * 1200 * (1 + 0.4 * Math.abs(pulseRad)),
        getFillColor: [168, 85, 247, Math.floor(60 + 40 * Math.abs(pulseRad))],
        radiusUnits: "meters",
        pickable: false,
      }) : null

      const layerList = [glowLayer, arcLayer, stargateLayer, columnLayer].filter(Boolean)
      deckInst.setProps({ layers: layerList })
    })
  }, [deckInst, ready, visibleDCs, showCables, stargateSites, pulse, selectedDC])

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="relative" style={{ minHeight: "calc(100vh - 64px)", background: "#050510" }}>

      {/* Globe canvas container */}
      <div ref={deckRef} className="absolute inset-0" style={{ cursor: "grab" }} />

      {/* Loading overlay */}
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center z-50"
             style={{ background: "#050510" }}>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full border-2 border-transparent animate-spin mx-auto mb-4"
                 style={{ borderTopColor: "#0078d7", borderRightColor: "#3385ff" }} />
            <p className="text-sm font-medium" style={{ color: "#aaa" }}>
              Loading AI infrastructure globe…
            </p>
          </div>
        </div>
      )}

      {/* ── Title bar ─────────────────────────────────────────────────────── */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-4 pointer-events-none z-20">

        {/* Title + stats chips */}
        <div className="pointer-events-auto">
          <div className="flex items-center gap-2 mb-1.5">
            <h1 className="text-base font-bold tracking-tight" style={{ color: "#fff" }}>
              AI Infrastructure Race
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: "rgba(0,120,215,0.18)", color: "#60b0ff", border: "1px solid rgba(0,120,215,0.35)" }}>
              2025
            </span>
          </div>
          <p className="text-xs mb-2" style={{ color: "#666" }}>
            Global hyperscale data centers &amp; undersea cables
          </p>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: "~15,000 MW tracked" },
              { label: "~8M H100-eq GPUs" },
              { label: `${DATA_CENTERS.length} facilities` },
              { label: `${CABLE_ARCS.length} cable routes` },
            ].map(s => (
              <div key={s.label} className="px-2 py-1 rounded-md text-xs"
                   style={{ background: "rgba(0,0,0,0.65)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(8px)", color: "#aaa" }}>
                {s.label}
              </div>
            ))}
          </div>
        </div>

        {/* Top-right controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setShowCables(v => !v)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: showCables ? "rgba(0,200,255,0.12)" : "rgba(0,0,0,0.6)",
              border:     showCables ? "1px solid rgba(0,200,255,0.35)" : "1px solid rgba(255,255,255,0.12)",
              color:      showCables ? "#00c8ff" : "#666",
              backdropFilter: "blur(8px)",
            }}>
            Cables
          </button>
          <button
            onClick={() => setShowStargate(v => !v)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: showStargate ? "rgba(168,85,247,0.18)" : "rgba(0,0,0,0.6)",
              border:     showStargate ? "1px solid rgba(168,85,247,0.4)" : "1px solid rgba(255,255,255,0.12)",
              color:      showStargate ? "#c084fc" : "#666",
              backdropFilter: "blur(8px)",
            }}>
            Stargate
          </button>
          <Link href="/uc26/details"
                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: "rgba(0,120,215,0.12)", border: "1px solid rgba(0,120,215,0.3)", color: "#60b0ff", backdropFilter: "blur(8px)" }}>
            Details →
          </Link>
        </div>
      </div>

      {/* ── Left sidebar: Operator filters ───────────────────────────────── */}
      <div className="absolute left-4 z-20 pointer-events-auto flex flex-col gap-2"
           style={{ top: 120, width: 210, bottom: 16 }}>

        {/* $500B Stargate highlight */}
        <div className="rounded-xl p-3"
             style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.25)", backdropFilter: "blur(14px)" }}>
          <p className="text-xs font-bold tracking-wider mb-0.5" style={{ color: "#c084fc" }}>STARGATE PROJECT</p>
          <p className="text-xl font-black" style={{ color: "#e879f9" }}>$500B</p>
          <p className="text-xs" style={{ color: "#a78bfa" }}>OpenAI + Microsoft + SoftBank</p>
          <p className="text-xs mt-1" style={{ color: "#7c3aed" }}>US AI infrastructure commitment 2025</p>
        </div>

        {/* Operator filter */}
        <div className="rounded-xl p-3 flex-1 min-h-0 overflow-y-auto"
             style={{ background: "rgba(0,0,0,0.75)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(14px)" }}>
          <p className="text-xs font-semibold tracking-wider mb-2" style={{ color: "#555" }}>OPERATORS</p>
          <div className="flex flex-col gap-1">
            {ALL_OPERATORS.map(op => {
              const active = filterOperators.has(op)
              const c      = OP_COLORS[op]
              const hex    = `rgb(${c[0]},${c[1]},${c[2]})`
              const dcCnt  = DATA_CENTERS.filter(d => d.operator === op).length
              if (dcCnt === 0) return null
              return (
                <button key={op}
                        onClick={() => toggleOp(op)}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-left transition-all"
                        style={{
                          background: active ? `rgba(${c[0]},${c[1]},${c[2]},0.12)` : "transparent",
                          border:     active ? `1px solid rgba(${c[0]},${c[1]},${c[2]},0.4)` : "1px solid transparent",
                          color:      active ? hex : "#666",
                        }}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: hex }} />
                  <span className="flex-1 truncate font-medium">{op}</span>
                  <span className="flex-shrink-0 text-xs opacity-60">{dcCnt}</span>
                </button>
              )
            })}
          </div>

          <p className="text-xs font-semibold tracking-wider mt-3 mb-2" style={{ color: "#555" }}>STATUS</p>
          <div className="flex flex-col gap-1">
            {(["operational", "under-construction", "announced"] as DCStatus[]).map(s => {
              const active = filterStatus.has(s)
              const col    = STATUS_COLORS[s]
              const label  = s === "under-construction" ? "Under Construction" : s.charAt(0).toUpperCase() + s.slice(1)
              return (
                <button key={s}
                        onClick={() => toggleStatus(s)}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-left transition-all"
                        style={{
                          background: active ? `${col}18` : "transparent",
                          border:     active ? `1px solid ${col}44` : "1px solid transparent",
                          color:      active ? col : "#666",
                        }}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: col }} />
                  <span className="flex-1">{label}</span>
                </button>
              )
            })}
          </div>

          {(filterOperators.size > 0 || filterStatus.size > 0) && (
            <button onClick={() => { setFilterOperators(new Set()); setFilterStatus(new Set()) }}
                    className="mt-2 w-full py-1 rounded-lg text-xs"
                    style={{ background: "rgba(255,255,255,0.04)", color: "#666", border: "1px solid rgba(255,255,255,0.08)" }}>
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* ── Right sidebar: Leaderboard ────────────────────────────────────── */}
      <div className="absolute right-4 z-20 pointer-events-auto"
           style={{ top: 80, width: 230 }}>
        <div className="rounded-xl p-3"
             style={{ background: "rgba(0,0,0,0.75)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(14px)" }}>
          <p className="text-xs font-semibold tracking-wider mb-3" style={{ color: "#555" }}>
            LEADERBOARD — MW CAPACITY
          </p>
          <div className="flex flex-col gap-1">
            {stats.leaderboard.map(([op, mw], idx) => {
              const c   = OP_COLORS[op as Operator] ?? OP_COLORS.Other
              const hex = `rgb(${c[0]},${c[1]},${c[2]})`
              const pct = (mw / stats.leaderboard[0][1]) * 100
              return (
                <div key={op} className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono w-4 flex-shrink-0 text-right"
                          style={{ color: idx < 3 ? hex : "#555" }}>
                      {idx + 1}
                    </span>
                    <span className="flex-1 text-xs font-medium truncate"
                          style={{ color: idx < 3 ? hex : "#888" }}>
                      {op}
                    </span>
                    <span className="text-xs font-bold flex-shrink-0"
                          style={{ color: idx < 3 ? hex : "#555" }}>
                      {fmtMW(mw)}
                    </span>
                  </div>
                  <div className="ml-6 h-1 rounded-full overflow-hidden"
                       style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div className="h-full rounded-full"
                         style={{ width: `${pct}%`, background: `rgba(${c[0]},${c[1]},${c[2]},0.6)` }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Cable legend */}
          {showCables && (
            <div className="mt-3 pt-3"
                 style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-xs font-semibold tracking-wider mb-2" style={{ color: "#555" }}>
                UNDERSEA CABLES
              </p>
              <div className="flex items-center gap-2 text-xs" style={{ color: "#666" }}>
                <div className="h-0.5 w-8 rounded-full"
                     style={{ background: "linear-gradient(to right, #00c8ff, #7850ff)" }} />
                <span>Great-circle arc, width ∝ Tbps</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom-right: Selected DC panel ──────────────────────────────── */}
      {selectedDC && (
        <div className="absolute bottom-4 right-4 z-20 pointer-events-auto"
             style={{ width: 270 }}>
          <div className="rounded-xl p-4"
               style={{ background: "rgba(0,0,0,0.9)", border: `1px solid rgba(${OP_COLORS[selectedDC.operator][0]},${OP_COLORS[selectedDC.operator][1]},${OP_COLORS[selectedDC.operator][2]},0.4)`, backdropFilter: "blur(16px)" }}>
            <div className="flex items-start justify-between mb-3">
              <div className="min-w-0 pr-2">
                <p className="text-sm font-bold leading-tight" style={{ color: "#fff" }}>
                  {selectedDC.name}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#666" }}>
                  {selectedDC.city}, {selectedDC.country}
                </p>
              </div>
              <button onClick={() => setSelectedDC(null)}
                      className="text-sm opacity-40 hover:opacity-80 flex-shrink-0"
                      style={{ color: "#aaa" }}>
                ✕
              </button>
            </div>

            {/* Operator badge */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{
                      background: `rgba(${OP_COLORS[selectedDC.operator][0]},${OP_COLORS[selectedDC.operator][1]},${OP_COLORS[selectedDC.operator][2]},0.15)`,
                      color: `rgb(${OP_COLORS[selectedDC.operator][0]},${OP_COLORS[selectedDC.operator][1]},${OP_COLORS[selectedDC.operator][2]})`,
                      border: `1px solid rgba(${OP_COLORS[selectedDC.operator][0]},${OP_COLORS[selectedDC.operator][1]},${OP_COLORS[selectedDC.operator][2]},0.35)`,
                    }}>
                {selectedDC.operator}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: STATUS_COLORS[selectedDC.status] + "18", color: STATUS_COLORS[selectedDC.status], border: `1px solid ${STATUS_COLORS[selectedDC.status]}33` }}>
                {selectedDC.status === "under-construction" ? "Under Construction" : selectedDC.status.charAt(0).toUpperCase() + selectedDC.status.slice(1)}
              </span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              {[
                { label: "Power Capacity", val: fmtMW(selectedDC.mw) },
                { label: "GPU Units (est.)", val: selectedDC.gpuUnits.toLocaleString() },
                { label: "Open Year",        val: selectedDC.openYear.toString() },
                { label: "AI Focused",       val: selectedDC.aiFocused ? "Yes" : "No" },
              ].map(m => (
                <div key={m.label} className="rounded-lg px-2 py-1.5"
                     style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-xs" style={{ color: "#555" }}>{m.label}</p>
                  <p className="text-sm font-semibold" style={{ color: "#ddd" }}>{m.val}</p>
                </div>
              ))}
            </div>

            {/* Project tag */}
            {selectedDC.project && (
              <div className="rounded-lg px-3 py-2 mt-1"
                   style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.25)" }}>
                <p className="text-xs font-semibold" style={{ color: "#a78bfa" }}>Project</p>
                <p className="text-xs mt-0.5" style={{ color: "#c084fc" }}>{selectedDC.project}</p>
              </div>
            )}

            {/* Coords */}
            <p className="text-xs mt-2" style={{ color: "#444" }}>
              {selectedDC.lat.toFixed(3)}°, {selectedDC.lng.toFixed(3)}°
            </p>
          </div>
        </div>
      )}

      {/* ── Bottom-left: Legend ───────────────────────────────────────────── */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-none"
           style={{ maxWidth: 220 }}>
        <div className="rounded-xl px-3 py-2"
             style={{ background: "rgba(0,0,0,0.65)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(8px)" }}>
          <p className="text-xs mb-1.5" style={{ color: "#555" }}>Tower height = log₁₀(MW) capacity</p>
          <div className="flex items-center gap-3 text-xs" style={{ color: "#555" }}>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: STATUS_COLORS.operational }} />
              Operational
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: STATUS_COLORS["under-construction"] }} />
              Building
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: STATUS_COLORS.announced }} />
              Announced
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

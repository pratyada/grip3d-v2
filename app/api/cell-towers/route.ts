import { NextResponse } from "next/server"

export const revalidate = 3600 // 1 hour cache

// ── Types ─────────────────────────────────────────────────────────────────────

interface CellTower {
  id: string
  lat: number
  lng: number
  radio: "GSM" | "UMTS" | "LTE" | "NR"
  mcc: number
  mnc: number
  range: number
}

// ── OpenCelliD fetch (when API key is available) ──────────────────────────────

async function fetchOpenCelliD(): Promise<CellTower[]> {
  const key = process.env.OPENCELLID_API_KEY
  if (!key) return []

  // Sample bounding boxes: NA, EU, APAC
  const boxes = [
    { minlat: 25, minlon: -125, maxlat: 50, maxlon: -65 },   // North America
    { minlat: 35, minlon: -10,  maxlat: 60, maxlon: 30  },   // Europe
    { minlat: -10, minlon: 100, maxlat: 40, maxlon: 145 },   // East Asia
    { minlat: 10,  minlon: 68,  maxlat: 35, maxlon: 90  },   // South Asia
  ]

  const results: CellTower[] = []
  for (const box of boxes) {
    try {
      const url = new URL("https://opencellid.org/cell/getInArea")
      url.searchParams.set("key",    key)
      url.searchParams.set("BBOX",   `${box.minlat},${box.minlon},${box.maxlat},${box.maxlon}`)
      url.searchParams.set("format", "json")
      url.searchParams.set("limit",  "100")

      const res = await fetch(url.toString(), { next: { revalidate: 3600 } })
      if (!res.ok) continue
      const data = await res.json()
      const cells: any[] = data.cells ?? []

      for (const c of cells) {
        results.push({
          id:    `ocd-${c.radio}-${c.mcc}-${c.net}-${c.area}-${c.cell}`,
          lat:   parseFloat(c.lat),
          lng:   parseFloat(c.lon),
          radio: c.radio as "GSM" | "UMTS" | "LTE" | "NR",
          mcc:   parseInt(c.mcc, 10),
          mnc:   parseInt(c.net, 10),
          range: parseInt(c.range, 10) || 0,
        })
      }
    } catch {
      // skip failing region
    }
  }
  return results
}

// ── Static fallback: ~300 representative towers worldwide ─────────────────────
// Realistic MCC/MNC codes, spread across all 4 radio types and 6 continents

const STATIC_TOWERS: Omit<CellTower, "id">[] = [
  // ── North America — USA (MCC 310) ─────────────────────────────────────────
  { lat: 40.7128,  lng: -74.0060,  radio: "LTE",  mcc: 310, mnc: 260, range: 1500 }, // New York
  { lat: 40.7580,  lng: -73.9855,  radio: "NR",   mcc: 310, mnc: 260, range: 800  },
  { lat: 40.6892,  lng: -74.0445,  radio: "GSM",  mcc: 310, mnc: 410, range: 4000 },
  { lat: 40.7282,  lng: -73.7949,  radio: "UMTS", mcc: 310, mnc: 410, range: 3000 },
  { lat: 34.0522,  lng: -118.2437, radio: "LTE",  mcc: 310, mnc: 260, range: 2000 }, // Los Angeles
  { lat: 34.0195,  lng: -118.4912, radio: "NR",   mcc: 310, mnc: 260, range: 600  },
  { lat: 34.0736,  lng: -118.4004, radio: "LTE",  mcc: 310, mnc: 410, range: 1800 },
  { lat: 33.9425,  lng: -118.4081, radio: "GSM",  mcc: 310, mnc: 410, range: 5000 },
  { lat: 41.8781,  lng: -87.6298,  radio: "LTE",  mcc: 310, mnc: 260, range: 1200 }, // Chicago
  { lat: 41.8500,  lng: -87.6500,  radio: "NR",   mcc: 310, mnc: 260, range: 700  },
  { lat: 41.9000,  lng: -87.7000,  radio: "UMTS", mcc: 310, mnc: 410, range: 2500 },
  { lat: 29.7604,  lng: -95.3698,  radio: "LTE",  mcc: 310, mnc: 260, range: 1800 }, // Houston
  { lat: 29.4241,  lng: -98.4936,  radio: "LTE",  mcc: 310, mnc: 260, range: 1600 }, // San Antonio
  { lat: 33.4484,  lng: -112.0740, radio: "LTE",  mcc: 310, mnc: 260, range: 2200 }, // Phoenix
  { lat: 39.7392,  lng: -104.9903, radio: "LTE",  mcc: 310, mnc: 260, range: 1500 }, // Denver
  { lat: 47.6062,  lng: -122.3321, radio: "NR",   mcc: 310, mnc: 260, range: 900  }, // Seattle
  { lat: 37.7749,  lng: -122.4194, radio: "NR",   mcc: 310, mnc: 260, range: 800  }, // San Francisco
  { lat: 37.8044,  lng: -122.2712, radio: "LTE",  mcc: 310, mnc: 410, range: 1600 },
  { lat: 25.7617,  lng: -80.1918,  radio: "LTE",  mcc: 310, mnc: 260, range: 1400 }, // Miami
  { lat: 35.2271,  lng: -80.8431,  radio: "LTE",  mcc: 311, mnc: 480, range: 1700 }, // Charlotte
  { lat: 38.9072,  lng: -77.0369,  radio: "NR",   mcc: 310, mnc: 260, range: 700  }, // DC
  { lat: 42.3601,  lng: -71.0589,  radio: "LTE",  mcc: 310, mnc: 260, range: 1300 }, // Boston
  { lat: 44.9778,  lng: -93.2650,  radio: "LTE",  mcc: 310, mnc: 260, range: 1900 }, // Minneapolis
  { lat: 45.5231,  lng: -122.6765, radio: "NR",   mcc: 310, mnc: 260, range: 850  }, // Portland
  { lat: 36.1627,  lng: -86.7816,  radio: "LTE",  mcc: 310, mnc: 410, range: 2000 }, // Nashville
  // Rural USA
  { lat: 39.5501,  lng: -105.7821, radio: "GSM",  mcc: 310, mnc: 410, range: 18000 },
  { lat: 37.2296,  lng: -104.6091, radio: "GSM",  mcc: 310, mnc: 410, range: 20000 },
  { lat: 44.0805,  lng: -103.2310, radio: "UMTS", mcc: 310, mnc: 260, range: 12000 },
  { lat: 46.8772,  lng: -110.3626, radio: "GSM",  mcc: 310, mnc: 410, range: 25000 },

  // ── Canada (MCC 302) ──────────────────────────────────────────────────────
  { lat: 43.6532,  lng: -79.3832,  radio: "LTE",  mcc: 302, mnc: 720, range: 1500 }, // Toronto
  { lat: 43.7000,  lng: -79.4000,  radio: "NR",   mcc: 302, mnc: 720, range: 750  },
  { lat: 45.5017,  lng: -73.5673,  radio: "LTE",  mcc: 302, mnc: 220, range: 1300 }, // Montreal
  { lat: 51.0447,  lng: -114.0719, radio: "LTE",  mcc: 302, mnc: 720, range: 2000 }, // Calgary
  { lat: 49.2827,  lng: -123.1207, radio: "NR",   mcc: 302, mnc: 720, range: 900  }, // Vancouver
  { lat: 45.4215,  lng: -75.6972,  radio: "LTE",  mcc: 302, mnc: 610, range: 1800 }, // Ottawa
  { lat: 53.5461,  lng: -113.4938, radio: "LTE",  mcc: 302, mnc: 720, range: 2200 }, // Edmonton

  // ── Mexico (MCC 334) ──────────────────────────────────────────────────────
  { lat: 19.4326,  lng: -99.1332,  radio: "LTE",  mcc: 334, mnc: 20,  range: 1500 }, // Mexico City
  { lat: 19.4500,  lng: -99.1200,  radio: "NR",   mcc: 334, mnc: 20,  range: 800  },
  { lat: 20.9674,  lng: -89.5926,  radio: "UMTS", mcc: 334, mnc: 20,  range: 3000 }, // Merida
  { lat: 25.6714,  lng: -100.3089, radio: "LTE",  mcc: 334, mnc: 20,  range: 1700 }, // Monterrey
  { lat: 20.6534,  lng: -103.3441, radio: "LTE",  mcc: 334, mnc: 50,  range: 1800 }, // Guadalajara

  // ── South America ─────────────────────────────────────────────────────────
  { lat: -23.5505, lng: -46.6333,  radio: "LTE",  mcc: 724, mnc: 6,   range: 1200 }, // São Paulo
  { lat: -23.5700, lng: -46.6500,  radio: "NR",   mcc: 724, mnc: 6,   range: 700  },
  { lat: -22.9068, lng: -43.1729,  radio: "LTE",  mcc: 724, mnc: 31,  range: 1500 }, // Rio de Janeiro
  { lat: -15.7942, lng: -47.8822,  radio: "LTE",  mcc: 724, mnc: 6,   range: 1800 }, // Brasília
  { lat: -3.7172,  lng: -38.5433,  radio: "UMTS", mcc: 724, mnc: 20,  range: 3000 }, // Fortaleza
  { lat: -34.6037, lng: -58.3816,  radio: "LTE",  mcc: 722, mnc: 10,  range: 1400 }, // Buenos Aires
  { lat: -34.6500, lng: -58.4200,  radio: "NR",   mcc: 722, mnc: 10,  range: 800  },
  { lat: -33.4489, lng: -70.6693,  radio: "LTE",  mcc: 730, mnc: 1,   range: 1600 }, // Santiago
  { lat: -12.0464, lng: -77.0428,  radio: "LTE",  mcc: 716, mnc: 10,  range: 1500 }, // Lima
  { lat: 4.7110,   lng: -74.0721,  radio: "LTE",  mcc: 732, mnc: 101, range: 1300 }, // Bogotá
  { lat: 10.4806,  lng: -66.9036,  radio: "LTE",  mcc: 734, mnc: 4,   range: 1400 }, // Caracas
  { lat: -0.2295,  lng: -78.5243,  radio: "LTE",  mcc: 740, mnc: 0,   range: 1600 }, // Quito
  { lat: -17.7833, lng: -63.1821,  radio: "UMTS", mcc: 736, mnc: 2,   range: 4000 }, // Santa Cruz
  { lat: -25.2867, lng: -57.6470,  radio: "LTE",  mcc: 744, mnc: 5,   range: 1700 }, // Asunción
  { lat: -34.9011, lng: -56.1645,  radio: "LTE",  mcc: 748, mnc: 10,  range: 1500 }, // Montevideo
  // Remote Amazon
  { lat: -3.1190,  lng: -60.0217,  radio: "GSM",  mcc: 724, mnc: 6,   range: 15000 }, // Manaus area
  { lat: -8.0600,  lng: -62.9000,  radio: "GSM",  mcc: 724, mnc: 6,   range: 20000 },

  // ── Europe — UK (MCC 234) ─────────────────────────────────────────────────
  { lat: 51.5074,  lng: -0.1278,   radio: "NR",   mcc: 234, mnc: 20,  range: 600  }, // London
  { lat: 51.5200,  lng: -0.1000,   radio: "LTE",  mcc: 234, mnc: 30,  range: 1200 },
  { lat: 51.4800,  lng: -0.1500,   radio: "LTE",  mcc: 234, mnc: 20,  range: 1100 },
  { lat: 53.4808,  lng: -2.2426,   radio: "LTE",  mcc: 234, mnc: 30,  range: 1400 }, // Manchester
  { lat: 53.8008,  lng: -1.5491,   radio: "LTE",  mcc: 234, mnc: 20,  range: 1600 }, // Leeds
  { lat: 55.8642,  lng: -4.2518,   radio: "NR",   mcc: 234, mnc: 20,  range: 700  }, // Glasgow
  { lat: 52.4862,  lng: -1.8904,   radio: "LTE",  mcc: 234, mnc: 30,  range: 1300 }, // Birmingham

  // ── Europe — France (MCC 208) ─────────────────────────────────────────────
  { lat: 48.8566,  lng: 2.3522,    radio: "NR",   mcc: 208, mnc: 1,   range: 600  }, // Paris
  { lat: 48.8700,  lng: 2.3700,    radio: "LTE",  mcc: 208, mnc: 10,  range: 1100 },
  { lat: 43.2965,  lng: 5.3698,    radio: "LTE",  mcc: 208, mnc: 1,   range: 1500 }, // Marseille
  { lat: 45.7640,  lng: 4.8357,    radio: "LTE",  mcc: 208, mnc: 10,  range: 1300 }, // Lyon
  { lat: 43.6047,  lng: 1.4442,    radio: "NR",   mcc: 208, mnc: 1,   range: 750  }, // Toulouse
  { lat: 47.2184,  lng: -1.5536,   radio: "LTE",  mcc: 208, mnc: 20,  range: 1400 }, // Nantes
  { lat: 44.8378,  lng: -0.5792,   radio: "LTE",  mcc: 208, mnc: 1,   range: 1600 }, // Bordeaux
  // Rural France
  { lat: 44.9000,  lng: 3.2000,    radio: "GSM",  mcc: 208, mnc: 10,  range: 12000 },
  { lat: 46.5000,  lng: 2.5000,    radio: "GSM",  mcc: 208, mnc: 20,  range: 15000 },

  // ── Europe — Germany (MCC 262) ────────────────────────────────────────────
  { lat: 52.5200,  lng: 13.4050,   radio: "NR",   mcc: 262, mnc: 1,   range: 600  }, // Berlin
  { lat: 52.5100,  lng: 13.3900,   radio: "LTE",  mcc: 262, mnc: 2,   range: 1100 },
  { lat: 48.1351,  lng: 11.5820,   radio: "NR",   mcc: 262, mnc: 1,   range: 700  }, // Munich
  { lat: 53.5753,  lng: 10.0153,   radio: "LTE",  mcc: 262, mnc: 1,   range: 1200 }, // Hamburg
  { lat: 50.9333,  lng: 6.9500,    radio: "LTE",  mcc: 262, mnc: 2,   range: 1300 }, // Cologne
  { lat: 50.1109,  lng: 8.6821,    radio: "NR",   mcc: 262, mnc: 7,   range: 800  }, // Frankfurt
  { lat: 51.2217,  lng: 6.7762,    radio: "LTE",  mcc: 262, mnc: 2,   range: 1400 }, // Düsseldorf
  { lat: 48.7758,  lng: 9.1829,    radio: "LTE",  mcc: 262, mnc: 1,   range: 1300 }, // Stuttgart

  // ── Europe — Italy (MCC 222) ──────────────────────────────────────────────
  { lat: 41.9028,  lng: 12.4964,   radio: "LTE",  mcc: 222, mnc: 10,  range: 1300 }, // Rome
  { lat: 41.9100,  lng: 12.5100,   radio: "NR",   mcc: 222, mnc: 1,   range: 750  },
  { lat: 45.4654,  lng: 9.1859,    radio: "NR",   mcc: 222, mnc: 1,   range: 700  }, // Milan
  { lat: 40.8518,  lng: 14.2681,   radio: "LTE",  mcc: 222, mnc: 10,  range: 1500 }, // Naples
  { lat: 45.4408,  lng: 12.3155,   radio: "LTE",  mcc: 222, mnc: 1,   range: 1200 }, // Venice

  // ── Europe — Spain (MCC 214) ──────────────────────────────────────────────
  { lat: 40.4168,  lng: -3.7038,   radio: "NR",   mcc: 214, mnc: 7,   range: 700  }, // Madrid
  { lat: 41.3851,  lng: 2.1734,    radio: "NR",   mcc: 214, mnc: 7,   range: 750  }, // Barcelona
  { lat: 37.3891,  lng: -5.9845,   radio: "LTE",  mcc: 214, mnc: 7,   range: 1500 }, // Seville
  { lat: 39.4699,  lng: -0.3763,   radio: "LTE",  mcc: 214, mnc: 3,   range: 1300 }, // Valencia

  // ── Europe — Netherlands, Belgium, Nordics ────────────────────────────────
  { lat: 52.3676,  lng: 4.9041,    radio: "NR",   mcc: 204, mnc: 4,   range: 600  }, // Amsterdam
  { lat: 50.8503,  lng: 4.3517,    radio: "LTE",  mcc: 206, mnc: 1,   range: 1200 }, // Brussels
  { lat: 59.3293,  lng: 18.0686,   radio: "NR",   mcc: 240, mnc: 7,   range: 600  }, // Stockholm
  { lat: 59.9139,  lng: 10.7522,   radio: "NR",   mcc: 242, mnc: 2,   range: 650  }, // Oslo
  { lat: 55.6761,  lng: 12.5683,   radio: "NR",   mcc: 238, mnc: 20,  range: 700  }, // Copenhagen
  { lat: 60.1699,  lng: 24.9384,   radio: "NR",   mcc: 244, mnc: 5,   range: 650  }, // Helsinki
  { lat: 47.3769,  lng: 8.5417,    radio: "NR",   mcc: 228, mnc: 1,   range: 600  }, // Zurich
  { lat: 48.2082,  lng: 16.3738,   radio: "LTE",  mcc: 232, mnc: 1,   range: 1200 }, // Vienna
  { lat: 50.0755,  lng: 14.4378,   radio: "LTE",  mcc: 230, mnc: 1,   range: 1300 }, // Prague
  { lat: 52.2297,  lng: 21.0122,   radio: "LTE",  mcc: 260, mnc: 2,   range: 1200 }, // Warsaw
  { lat: 47.4979,  lng: 19.0402,   radio: "NR",   mcc: 216, mnc: 30,  range: 750  }, // Budapest
  { lat: 44.8176,  lng: 20.4569,   radio: "LTE",  mcc: 220, mnc: 5,   range: 1500 }, // Belgrade
  { lat: 41.0082,  lng: 28.9784,   radio: "NR",   mcc: 286, mnc: 2,   range: 650  }, // Istanbul
  { lat: 39.9334,  lng: 32.8597,   radio: "LTE",  mcc: 286, mnc: 1,   range: 1400 }, // Ankara
  { lat: 55.7558,  lng: 37.6173,   radio: "NR",   mcc: 250, mnc: 2,   range: 600  }, // Moscow
  { lat: 55.7700,  lng: 37.6100,   radio: "LTE",  mcc: 250, mnc: 1,   range: 1200 },
  { lat: 59.9343,  lng: 30.3351,   radio: "LTE",  mcc: 250, mnc: 2,   range: 1300 }, // St. Petersburg
  { lat: 50.4501,  lng: 30.5234,   radio: "LTE",  mcc: 255, mnc: 1,   range: 1400 }, // Kyiv
  { lat: 53.9045,  lng: 27.5615,   radio: "LTE",  mcc: 257, mnc: 2,   range: 1600 }, // Minsk
  // Siberia / rural Russia
  { lat: 56.0184,  lng: 92.8672,   radio: "GSM",  mcc: 250, mnc: 1,   range: 25000 }, // Krasnoyarsk
  { lat: 52.2978,  lng: 104.2964,  radio: "UMTS", mcc: 250, mnc: 2,   range: 10000 }, // Irkutsk
  { lat: 62.0355,  lng: 129.6755,  radio: "GSM",  mcc: 250, mnc: 1,   range: 30000 }, // Yakutsk

  // ── Africa ────────────────────────────────────────────────────────────────
  { lat: 30.0444,  lng: 31.2357,   radio: "LTE",  mcc: 602, mnc: 1,   range: 1500 }, // Cairo
  { lat: 30.0600,  lng: 31.2500,   radio: "UMTS", mcc: 602, mnc: 2,   range: 4000 },
  { lat: 36.8065,  lng: 10.1815,   radio: "LTE",  mcc: 605, mnc: 2,   range: 1600 }, // Tunis
  { lat: 33.9716,  lng: -6.8498,   radio: "LTE",  mcc: 604, mnc: 1,   range: 1500 }, // Rabat
  { lat: 36.7372,  lng: 3.0865,    radio: "LTE",  mcc: 603, mnc: 1,   range: 1400 }, // Algiers
  { lat: 6.5244,   lng: 3.3792,    radio: "LTE",  mcc: 621, mnc: 30,  range: 1500 }, // Lagos
  { lat: 6.5500,   lng: 3.4000,    radio: "UMTS", mcc: 621, mnc: 20,  range: 4000 },
  { lat: 9.0579,   lng: 7.4951,    radio: "LTE",  mcc: 621, mnc: 30,  range: 1800 }, // Abuja
  { lat: 5.5500,   lng: -0.2167,   radio: "LTE",  mcc: 620, mnc: 2,   range: 1600 }, // Accra
  { lat: 12.3654,  lng: -1.5354,   radio: "UMTS", mcc: 613, mnc: 2,   range: 5000 }, // Ouagadougou
  { lat: 14.6928,  lng: -17.4467,  radio: "UMTS", mcc: 608, mnc: 2,   range: 4000 }, // Dakar
  { lat: -1.2921,  lng: 36.8219,   radio: "LTE",  mcc: 639, mnc: 7,   range: 1400 }, // Nairobi
  { lat: -1.3000,  lng: 36.8100,   radio: "UMTS", mcc: 639, mnc: 2,   range: 4500 },
  { lat: -6.3690,  lng: 34.8888,   radio: "UMTS", mcc: 640, mnc: 2,   range: 8000 }, // Tanzania
  { lat: -6.7924,  lng: 39.2083,   radio: "LTE",  mcc: 640, mnc: 8,   range: 1800 }, // Dar es Salaam
  { lat: 0.3476,   lng: 32.5825,   radio: "LTE",  mcc: 641, mnc: 10,  range: 1600 }, // Kampala
  { lat: -26.3054, lng: 31.1367,   radio: "LTE",  mcc: 653, mnc: 1,   range: 1500 }, // Mbabane
  { lat: -25.9692, lng: 32.5732,   radio: "LTE",  mcc: 643, mnc: 1,   range: 1500 }, // Maputo
  { lat: -29.8587, lng: 31.0218,   radio: "LTE",  mcc: 655, mnc: 7,   range: 1300 }, // Durban
  { lat: -26.2041, lng: 28.0473,   radio: "NR",   mcc: 655, mnc: 1,   range: 750  }, // Johannesburg
  { lat: -33.9249, lng: 18.4241,   radio: "LTE",  mcc: 655, mnc: 7,   range: 1400 }, // Cape Town
  { lat: -15.4167, lng: 28.2833,   radio: "LTE",  mcc: 645, mnc: 2,   range: 1800 }, // Lusaka
  { lat: -17.8216, lng: 31.0492,   radio: "LTE",  mcc: 648, mnc: 1,   range: 1600 }, // Harare
  { lat: -18.9333, lng: 47.5167,   radio: "UMTS", mcc: 646, mnc: 2,   range: 5000 }, // Antananarivo
  { lat: -4.3220,  lng: 15.3222,   radio: "LTE",  mcc: 629, mnc: 10,  range: 1500 }, // Kinshasa
  { lat: -11.2027, lng: 17.8739,   radio: "GSM",  mcc: 631, mnc: 2,   range: 8000 }, // Huambo
  { lat: 15.5007,  lng: 32.5599,   radio: "LTE",  mcc: 634, mnc: 7,   range: 1700 }, // Khartoum
  { lat: 2.0469,   lng: 45.3182,   radio: "UMTS", mcc: 637, mnc: 30,  range: 5000 }, // Mogadishu
  { lat: 9.0250,   lng: 38.7469,   radio: "LTE",  mcc: 636, mnc: 1,   range: 1500 }, // Addis Ababa
  // Sahara / remote Africa
  { lat: 20.1654,  lng: 12.9887,   radio: "GSM",  mcc: 614, mnc: 2,   range: 40000 },
  { lat: 15.4542,  lng: 18.7322,   radio: "GSM",  mcc: 622, mnc: 1,   range: 35000 },
  { lat: 23.4162,  lng: 25.6628,   radio: "GSM",  mcc: 602, mnc: 3,   range: 40000 },

  // ── Middle East ───────────────────────────────────────────────────────────
  { lat: 24.7136,  lng: 46.6753,   radio: "NR",   mcc: 420, mnc: 1,   range: 700  }, // Riyadh
  { lat: 21.3891,  lng: 39.8579,   radio: "LTE",  mcc: 420, mnc: 3,   range: 1400 }, // Jeddah
  { lat: 25.2048,  lng: 55.2708,   radio: "NR",   mcc: 424, mnc: 2,   range: 600  }, // Dubai
  { lat: 25.2854,  lng: 51.5310,   radio: "NR",   mcc: 427, mnc: 1,   range: 650  }, // Doha
  { lat: 26.2172,  lng: 50.5957,   radio: "LTE",  mcc: 426, mnc: 1,   range: 1200 }, // Manama
  { lat: 23.5880,  lng: 58.3829,   radio: "LTE",  mcc: 422, mnc: 3,   range: 1500 }, // Muscat
  { lat: 33.3152,  lng: 44.3661,   radio: "LTE",  mcc: 418, mnc: 8,   range: 1800 }, // Baghdad
  { lat: 35.6892,  lng: 51.3890,   radio: "NR",   mcc: 432, mnc: 11,  range: 650  }, // Tehran
  { lat: 33.8869,  lng: 35.5131,   radio: "LTE",  mcc: 415, mnc: 3,   range: 1300 }, // Beirut
  { lat: 31.9522,  lng: 35.2332,   radio: "LTE",  mcc: 416, mnc: 1,   range: 1500 }, // Amman

  // ── South Asia — India (MCC 404/405) ──────────────────────────────────────
  { lat: 28.6139,  lng: 77.2090,   radio: "LTE",  mcc: 404, mnc: 20,  range: 1500 }, // Delhi
  { lat: 28.6300,  lng: 77.2200,   radio: "LTE",  mcc: 404, mnc: 45,  range: 1400 },
  { lat: 28.6000,  lng: 77.1900,   radio: "UMTS", mcc: 404, mnc: 10,  range: 3000 },
  { lat: 19.0760,  lng: 72.8777,   radio: "LTE",  mcc: 404, mnc: 20,  range: 1200 }, // Mumbai
  { lat: 19.0900,  lng: 72.8900,   radio: "NR",   mcc: 404, mnc: 20,  range: 700  },
  { lat: 12.9716,  lng: 77.5946,   radio: "LTE",  mcc: 404, mnc: 45,  range: 1300 }, // Bangalore
  { lat: 17.3850,  lng: 78.4867,   radio: "LTE",  mcc: 404, mnc: 20,  range: 1400 }, // Hyderabad
  { lat: 13.0827,  lng: 80.2707,   radio: "LTE",  mcc: 404, mnc: 56,  range: 1300 }, // Chennai
  { lat: 22.5726,  lng: 88.3639,   radio: "LTE",  mcc: 404, mnc: 20,  range: 1200 }, // Kolkata
  { lat: 23.0225,  lng: 72.5714,   radio: "LTE",  mcc: 404, mnc: 45,  range: 1500 }, // Ahmedabad
  { lat: 18.5204,  lng: 73.8567,   radio: "LTE",  mcc: 404, mnc: 20,  range: 1300 }, // Pune
  { lat: 26.8467,  lng: 80.9462,   radio: "UMTS", mcc: 404, mnc: 10,  range: 2500 }, // Lucknow
  // Rural India
  { lat: 23.2599,  lng: 77.4126,   radio: "GSM",  mcc: 404, mnc: 10,  range: 8000 }, // Bhopal
  { lat: 20.9320,  lng: 85.0985,   radio: "GSM",  mcc: 404, mnc: 10,  range: 10000 },
  { lat: 25.0961,  lng: 85.3131,   radio: "GSM",  mcc: 404, mnc: 10,  range: 12000 },
  { lat: 27.1767,  lng: 78.0081,   radio: "UMTS", mcc: 404, mnc: 10,  range: 5000 },
  // Pakistan, Bangladesh, Sri Lanka
  { lat: 24.8615,  lng: 67.0099,   radio: "LTE",  mcc: 410, mnc: 1,   range: 1500 }, // Karachi
  { lat: 31.5497,  lng: 74.3436,   radio: "LTE",  mcc: 410, mnc: 7,   range: 1400 }, // Lahore
  { lat: 33.7294,  lng: 73.0931,   radio: "LTE",  mcc: 410, mnc: 1,   range: 1600 }, // Islamabad
  { lat: 23.8103,  lng: 90.4125,   radio: "LTE",  mcc: 470, mnc: 7,   range: 1300 }, // Dhaka
  { lat: 6.9271,   lng: 79.8612,   radio: "LTE",  mcc: 413, mnc: 8,   range: 1500 }, // Colombo
  { lat: 27.7172,  lng: 85.3240,   radio: "LTE",  mcc: 429, mnc: 1,   range: 1400 }, // Kathmandu

  // ── East Asia — China (MCC 460) ───────────────────────────────────────────
  { lat: 39.9042,  lng: 116.4074,  radio: "NR",   mcc: 460, mnc: 0,   range: 600  }, // Beijing
  { lat: 39.9200,  lng: 116.4200,  radio: "LTE",  mcc: 460, mnc: 1,   range: 1100 },
  { lat: 31.2304,  lng: 121.4737,  radio: "NR",   mcc: 460, mnc: 0,   range: 600  }, // Shanghai
  { lat: 31.2500,  lng: 121.5000,  radio: "LTE",  mcc: 460, mnc: 1,   range: 1000 },
  { lat: 23.1291,  lng: 113.2644,  radio: "NR",   mcc: 460, mnc: 0,   range: 700  }, // Guangzhou
  { lat: 22.5431,  lng: 114.0579,  radio: "NR",   mcc: 460, mnc: 11,  range: 650  }, // Shenzhen
  { lat: 30.5728,  lng: 104.0668,  radio: "LTE",  mcc: 460, mnc: 0,   range: 1200 }, // Chengdu
  { lat: 32.0603,  lng: 118.7969,  radio: "LTE",  mcc: 460, mnc: 1,   range: 1100 }, // Nanjing
  { lat: 30.2741,  lng: 120.1551,  radio: "LTE",  mcc: 460, mnc: 0,   range: 1100 }, // Hangzhou
  { lat: 36.0671,  lng: 120.3826,  radio: "LTE",  mcc: 460, mnc: 1,   range: 1300 }, // Qingdao
  { lat: 22.3193,  lng: 114.1694,  radio: "NR",   mcc: 454, mnc: 0,   range: 600  }, // Hong Kong
  { lat: 25.0330,  lng: 121.5654,  radio: "NR",   mcc: 466, mnc: 92,  range: 650  }, // Taipei
  // Rural China
  { lat: 43.8256,  lng: 87.6168,   radio: "UMTS", mcc: 460, mnc: 0,   range: 8000 }, // Urumqi
  { lat: 29.6500,  lng: 91.1000,   radio: "UMTS", mcc: 460, mnc: 1,   range: 12000 }, // Lhasa
  { lat: 38.4681,  lng: 106.2733,  radio: "GSM",  mcc: 460, mnc: 0,   range: 15000 },
  { lat: 48.0000,  lng: 87.0000,   radio: "GSM",  mcc: 460, mnc: 0,   range: 35000 }, // Gobi

  // ── Japan (MCC 440) ───────────────────────────────────────────────────────
  { lat: 35.6762,  lng: 139.6503,  radio: "NR",   mcc: 440, mnc: 10,  range: 500  }, // Tokyo
  { lat: 35.6900,  lng: 139.7000,  radio: "LTE",  mcc: 440, mnc: 20,  range: 900  },
  { lat: 34.6937,  lng: 135.5023,  radio: "NR",   mcc: 440, mnc: 10,  range: 550  }, // Osaka
  { lat: 35.1815,  lng: 136.9066,  radio: "LTE",  mcc: 440, mnc: 20,  range: 1000 }, // Nagoya
  { lat: 43.0618,  lng: 141.3545,  radio: "LTE",  mcc: 440, mnc: 10,  range: 1200 }, // Sapporo
  { lat: 33.5904,  lng: 130.4017,  radio: "LTE",  mcc: 440, mnc: 20,  range: 1100 }, // Fukuoka

  // ── South Korea (MCC 450) ─────────────────────────────────────────────────
  { lat: 37.5665,  lng: 126.9780,  radio: "NR",   mcc: 450, mnc: 8,   range: 500  }, // Seoul
  { lat: 37.5800,  lng: 126.9900,  radio: "LTE",  mcc: 450, mnc: 5,   range: 900  },
  { lat: 35.1796,  lng: 129.0756,  radio: "NR",   mcc: 450, mnc: 8,   range: 550  }, // Busan
  { lat: 35.8714,  lng: 128.6014,  radio: "LTE",  mcc: 450, mnc: 5,   range: 1000 }, // Daegu

  // ── Southeast Asia ────────────────────────────────────────────────────────
  { lat: 13.7563,  lng: 100.5018,  radio: "LTE",  mcc: 520, mnc: 4,   range: 1400 }, // Bangkok
  { lat: 13.7700,  lng: 100.5200,  radio: "NR",   mcc: 520, mnc: 18,  range: 750  },
  { lat: 14.5995,  lng: 120.9842,  radio: "LTE",  mcc: 515, mnc: 5,   range: 1300 }, // Manila
  { lat: 3.1390,   lng: 101.6869,  radio: "NR",   mcc: 502, mnc: 12,  range: 700  }, // Kuala Lumpur
  { lat: 1.3521,   lng: 103.8198,  radio: "NR",   mcc: 525, mnc: 5,   range: 600  }, // Singapore
  { lat: 21.0278,  lng: 105.8342,  radio: "LTE",  mcc: 452, mnc: 2,   range: 1300 }, // Hanoi
  { lat: 10.8231,  lng: 106.6297,  radio: "NR",   mcc: 452, mnc: 4,   range: 700  }, // Ho Chi Minh
  { lat: -6.2088,  lng: 106.8456,  radio: "LTE",  mcc: 510, mnc: 10,  range: 1400 }, // Jakarta
  { lat: -7.2575,  lng: 112.7521,  radio: "LTE",  mcc: 510, mnc: 1,   range: 1500 }, // Surabaya
  { lat: 16.8409,  lng: 96.1735,   radio: "LTE",  mcc: 414, mnc: 5,   range: 1500 }, // Yangon
  { lat: 11.5625,  lng: 104.9160,  radio: "UMTS", mcc: 456, mnc: 2,   range: 3000 }, // Phnom Penh
  { lat: 17.9757,  lng: 102.6331,  radio: "UMTS", mcc: 457, mnc: 8,   range: 3500 }, // Vientiane
  // Remote SE Asia
  { lat: 0.9619,   lng: 114.9439,  radio: "GSM",  mcc: 510, mnc: 10,  range: 12000 }, // Borneo
  { lat: -3.3194,  lng: 136.3939,  radio: "GSM",  mcc: 510, mnc: 1,   range: 20000 }, // Papua

  // ── Central Asia ──────────────────────────────────────────────────────────
  { lat: 41.2995,  lng: 69.2401,   radio: "LTE",  mcc: 434, mnc: 4,   range: 1500 }, // Tashkent
  { lat: 43.2220,  lng: 76.8512,   radio: "LTE",  mcc: 401, mnc: 2,   range: 1800 }, // Almaty
  { lat: 37.9601,  lng: 58.3261,   radio: "LTE",  mcc: 438, mnc: 1,   range: 2000 }, // Ashgabat
  { lat: 38.5598,  lng: 68.7737,   radio: "LTE",  mcc: 436, mnc: 4,   range: 2200 }, // Dushanbe
  { lat: 42.8700,  lng: 74.5900,   radio: "LTE",  mcc: 437, mnc: 5,   range: 2000 }, // Bishkek
  // Kazakh steppe
  { lat: 50.0000,  lng: 60.0000,   radio: "GSM",  mcc: 401, mnc: 2,   range: 30000 },
  { lat: 45.0000,  lng: 75.0000,   radio: "GSM",  mcc: 401, mnc: 2,   range: 35000 },

  // ── Australia & Oceania (MCC 505) ─────────────────────────────────────────
  { lat: -33.8688, lng: 151.2093,  radio: "NR",   mcc: 505, mnc: 1,   range: 700  }, // Sydney
  { lat: -33.8800, lng: 151.2200,  radio: "LTE",  mcc: 505, mnc: 3,   range: 1300 },
  { lat: -37.8136, lng: 144.9631,  radio: "NR",   mcc: 505, mnc: 1,   range: 750  }, // Melbourne
  { lat: -27.4698, lng: 153.0251,  radio: "LTE",  mcc: 505, mnc: 3,   range: 1400 }, // Brisbane
  { lat: -31.9505, lng: 115.8605,  radio: "LTE",  mcc: 505, mnc: 1,   range: 1600 }, // Perth
  { lat: -34.9285, lng: 138.6007,  radio: "LTE",  mcc: 505, mnc: 3,   range: 1500 }, // Adelaide
  { lat: -12.4634, lng: 130.8456,  radio: "LTE",  mcc: 505, mnc: 1,   range: 2500 }, // Darwin
  { lat: -36.8509, lng: 174.7645,  radio: "NR",   mcc: 530, mnc: 5,   range: 700  }, // Auckland
  { lat: -41.2865, lng: 174.7762,  radio: "LTE",  mcc: 530, mnc: 5,   range: 1400 }, // Wellington
  { lat: -43.5321, lng: 172.6362,  radio: "LTE",  mcc: 530, mnc: 24,  range: 1600 }, // Christchurch
  { lat: -9.4438,  lng: 147.1803,  radio: "UMTS", mcc: 537, mnc: 3,   range: 5000 }, // Port Moresby
  { lat: -18.1416, lng: 178.4415,  radio: "UMTS", mcc: 542, mnc: 1,   range: 6000 }, // Suva
  // Australian outback
  { lat: -23.7000, lng: 133.8734,  radio: "GSM",  mcc: 505, mnc: 1,   range: 40000 }, // Alice Springs
  { lat: -26.0000, lng: 120.0000,  radio: "GSM",  mcc: 505, mnc: 1,   range: 50000 },
  { lat: -21.0000, lng: 115.0000,  radio: "GSM",  mcc: 505, mnc: 3,   range: 45000 },

  // ── Additional urban density spots ────────────────────────────────────────
  { lat: -22.9000, lng: -43.2000,  radio: "LTE",  mcc: 724, mnc: 31,  range: 1100 }, // Rio suburb
  { lat: 55.9533,  lng: -3.1883,   radio: "LTE",  mcc: 234, mnc: 20,  range: 1400 }, // Edinburgh
  { lat: 53.3498,  lng: -6.2603,   radio: "LTE",  mcc: 272, mnc: 5,   range: 1300 }, // Dublin
  { lat: 51.8985,  lng: -8.4756,   radio: "UMTS", mcc: 272, mnc: 1,   range: 4000 }, // Cork
  { lat: 60.4720,  lng: 8.4689,    radio: "GSM",  mcc: 242, mnc: 2,   range: 20000 }, // Norwegian fjords
  { lat: 78.2232,  lng: 15.6267,   radio: "GSM",  mcc: 242, mnc: 2,   range: 50000 }, // Svalbard
  { lat: 64.1355,  lng: -21.8954,  radio: "LTE",  mcc: 274, mnc: 1,   range: 3000 }, // Reykjavik
]

// ── Main handler ──────────────────────────────────────────────────────────────

export async function GET() {
  try {
    // Prefer live OpenCelliD data when API key is present
    const liveTowers = await fetchOpenCelliD()
    if (liveTowers.length > 0) {
      return NextResponse.json(liveTowers, {
        headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=1800" },
      })
    }
  } catch {
    // fall through to static dataset
  }

  // Static fallback — assign stable IDs
  const towers: CellTower[] = STATIC_TOWERS.map((t, i) => ({
    ...t,
    id: `static-${t.radio}-${i}`,
  }))

  return NextResponse.json(towers, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=1800" },
  })
}

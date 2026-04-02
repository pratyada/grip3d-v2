// FAO STAT 2022 static dataset — crop production for 8 major crops across 80+ countries.
// Production in thousand tonnes, yield in tonnes/ha, area in thousand ha.
// Arable land % from World Bank AG.LND.AGRI.ZS.
// Centroid lat/lng approximate country centers.
// Cache 24 hours — this dataset doesn't change frequently.

export const revalidate = 86400

// ── Types ──────────────────────────────────────────────────────────────────────

interface CropRecord {
  iso3:       string
  country:    string
  lat:        number
  lng:        number
  production: number  // thousand tonnes
  yield:      number  // tonnes per hectare
  area:       number  // thousand hectares harvested
}

interface ArableRecord {
  iso3:    string
  country: string
  lat:     number
  lng:     number
  pct:     number  // % of land area
}

interface AgriculturePayload {
  crops:  Record<string, CropRecord[]>
  arable: ArableRecord[]
}

// ── Static Data — FAO STAT 2022 ────────────────────────────────────────────────

const WHEAT: CropRecord[] = [
  { iso3:"CHN", country:"China",          lat:35.8, lng:104.1, production:137720, yield:5.93, area:23220 },
  { iso3:"IND", country:"India",          lat:20.6, lng:78.9,  production:107740, yield:3.51, area:30680 },
  { iso3:"RUS", country:"Russia",         lat:61.5, lng:105.3, production:104246, yield:3.39, area:30750 },
  { iso3:"USA", country:"United States",  lat:37.1, lng:-95.7, production:44916,  yield:3.17, area:14170 },
  { iso3:"FRA", country:"France",         lat:46.2, lng:2.2,   production:35670,  yield:7.44, area:4790  },
  { iso3:"AUS", country:"Australia",      lat:-25.3,lng:133.8, production:36000,  yield:2.30, area:15650 },
  { iso3:"PAK", country:"Pakistan",       lat:30.4, lng:69.3,  production:26393,  yield:3.10, area:8520  },
  { iso3:"CAN", country:"Canada",         lat:56.1, lng:-106.3,production:34341,  yield:3.82, area:9000  },
  { iso3:"UKR", country:"Ukraine",        lat:48.4, lng:31.2,  production:20729,  yield:4.11, area:5040  },
  { iso3:"DEU", country:"Germany",        lat:51.2, lng:10.5,  production:22222,  yield:7.90, area:2813  },
  { iso3:"KAZ", country:"Kazakhstan",     lat:48.0, lng:68.0,  production:18674,  yield:1.52, area:12300 },
  { iso3:"ARG", country:"Argentina",      lat:-34.0,lng:-64.0, production:22140,  yield:3.47, area:6380  },
  { iso3:"GBR", country:"United Kingdom", lat:55.4, lng:-3.4,  production:14884,  yield:8.25, area:1804  },
  { iso3:"POL", country:"Poland",         lat:51.9, lng:19.1,  production:11677,  yield:4.59, area:2543  },
  { iso3:"TUR", country:"Turkey",         lat:39.1, lng:35.0,  production:19500,  yield:2.98, area:6540  },
  { iso3:"IRN", country:"Iran",           lat:32.4, lng:53.7,  production:10000,  yield:2.40, area:4167  },
  { iso3:"EGY", country:"Egypt",          lat:26.8, lng:30.8,  production:9798,   yield:6.65, area:1473  },
  { iso3:"ROU", country:"Romania",        lat:45.9, lng:24.9,  production:9980,   yield:4.17, area:2393  },
  { iso3:"MAR", country:"Morocco",        lat:31.8, lng:-7.1,  production:4098,   yield:1.38, area:2969  },
  { iso3:"BGR", country:"Bulgaria",       lat:42.7, lng:25.5,  production:7440,   yield:4.73, area:1572  },
  { iso3:"HUN", country:"Hungary",        lat:47.2, lng:19.5,  production:5300,   yield:4.69, area:1130  },
  { iso3:"SWE", country:"Sweden",         lat:60.1, lng:18.6,  production:2461,   yield:5.34, area:461   },
  { iso3:"ESP", country:"Spain",          lat:40.4, lng:-3.7,  production:8310,   yield:3.55, area:2340  },
  { iso3:"ETH", country:"Ethiopia",       lat:9.1,  lng:40.5,  production:5590,   yield:2.81, area:1990  },
  { iso3:"IRQ", country:"Iraq",           lat:33.2, lng:43.7,  production:2270,   yield:2.44, area:930   },
]

const RICE: CropRecord[] = [
  { iso3:"CHN", country:"China",          lat:35.8, lng:104.1, production:212843, yield:7.07, area:30105 },
  { iso3:"IND", country:"India",          lat:20.6, lng:78.9,  production:186510, yield:4.13, area:45157 },
  { iso3:"BGD", country:"Bangladesh",     lat:23.7, lng:90.4,  production:56000,  yield:4.83, area:11590 },
  { iso3:"IDN", country:"Indonesia",      lat:-0.8, lng:113.9, production:54000,  yield:5.21, area:10370 },
  { iso3:"VNM", country:"Vietnam",        lat:14.1, lng:108.3, production:43000,  yield:6.02, area:7140  },
  { iso3:"THA", country:"Thailand",       lat:15.9, lng:100.9, production:30000,  yield:2.93, area:10240 },
  { iso3:"MMR", country:"Myanmar",        lat:17.1, lng:96.9,  production:25400,  yield:4.00, area:6350  },
  { iso3:"PHL", country:"Philippines",    lat:12.9, lng:121.8, production:19960,  yield:4.09, area:4880  },
  { iso3:"PAK", country:"Pakistan",       lat:30.4, lng:69.3,  production:9323,   yield:2.72, area:3429  },
  { iso3:"BRA", country:"Brazil",         lat:-14.2,lng:-51.9, production:11700,  yield:5.97, area:1961  },
  { iso3:"JPN", country:"Japan",          lat:36.2, lng:138.3, production:10800,  yield:6.75, area:1600  },
  { iso3:"KHM", country:"Cambodia",       lat:12.6, lng:104.9, production:11200,  yield:3.62, area:3094  },
  { iso3:"NGA", country:"Nigeria",        lat:9.1,  lng:8.7,   production:8600,   yield:2.43, area:3540  },
  { iso3:"LAO", country:"Laos",           lat:18.2, lng:103.9, production:4450,   yield:4.28, area:1040  },
  { iso3:"KOR", country:"South Korea",    lat:35.9, lng:127.8, production:5120,   yield:6.80, area:753   },
  { iso3:"USA", country:"United States",  lat:37.1, lng:-95.7, production:8710,   yield:8.49, area:1026  },
  { iso3:"COL", country:"Colombia",       lat:4.6,  lng:-74.3, production:3095,   yield:5.31, area:583   },
  { iso3:"GHA", country:"Ghana",          lat:7.9,  lng:-1.0,  production:787,    yield:2.81, area:280   },
  { iso3:"MDG", country:"Madagascar",     lat:-18.8,lng:46.9,  production:4400,   yield:3.76, area:1170  },
  { iso3:"TZA", country:"Tanzania",       lat:-6.4, lng:34.9,  production:3460,   yield:2.59, area:1335  },
  { iso3:"MLI", country:"Mali",           lat:17.6, lng:-4.0,  production:2580,   yield:2.67, area:966   },
  { iso3:"SEN", country:"Senegal",        lat:14.5, lng:-14.5, production:770,    yield:2.54, area:303   },
  { iso3:"EGY", country:"Egypt",          lat:26.8, lng:30.8,  production:7100,   yield:9.93, area:715   },
  { iso3:"NPL", country:"Nepal",          lat:28.4, lng:84.1,  production:5620,   yield:3.72, area:1510  },
  { iso3:"ECU", country:"Ecuador",        lat:-1.8, lng:-78.2, production:1360,   yield:5.03, area:270   },
]

const MAIZE: CropRecord[] = [
  { iso3:"USA", country:"United States",  lat:37.1, lng:-95.7, production:347048, yield:11.11,area:31230 },
  { iso3:"CHN", country:"China",          lat:35.8, lng:104.1, production:277200, yield:6.33, area:43780 },
  { iso3:"BRA", country:"Brazil",         lat:-14.2,lng:-51.9, production:116000, yield:6.32, area:18360 },
  { iso3:"ARG", country:"Argentina",      lat:-34.0,lng:-64.0, production:59000,  yield:8.02, area:7360  },
  { iso3:"UKR", country:"Ukraine",        lat:48.4, lng:31.2,  production:42100,  yield:7.92, area:5320  },
  { iso3:"MEX", country:"Mexico",         lat:23.6, lng:-102.6,production:27500,  yield:4.00, area:6880  },
  { iso3:"ZAF", country:"South Africa",   lat:-29.0,lng:25.1,  production:16870,  yield:5.38, area:3135  },
  { iso3:"IND", country:"India",          lat:20.6, lng:78.9,  production:33640,  yield:3.42, area:9840  },
  { iso3:"IDN", country:"Indonesia",      lat:-0.8, lng:113.9, production:22500,  yield:5.99, area:3755  },
  { iso3:"ROU", country:"Romania",        lat:45.9, lng:24.9,  production:13640,  yield:5.25, area:2599  },
  { iso3:"NGA", country:"Nigeria",        lat:9.1,  lng:8.7,   production:12500,  yield:2.48, area:5040  },
  { iso3:"ETH", country:"Ethiopia",       lat:9.1,  lng:40.5,  production:10320,  yield:3.47, area:2975  },
  { iso3:"HUN", country:"Hungary",        lat:47.2, lng:19.5,  production:8260,   yield:8.20, area:1007  },
  { iso3:"FRA", country:"France",         lat:46.2, lng:2.2,   production:13500,  yield:9.53, area:1416  },
  { iso3:"TZA", country:"Tanzania",       lat:-6.4, lng:34.9,  production:6250,   yield:2.06, area:3034  },
  { iso3:"PHL", country:"Philippines",    lat:12.9, lng:121.8, production:8150,   yield:3.38, area:2411  },
  { iso3:"CAN", country:"Canada",         lat:56.1, lng:-106.3,production:15300,  yield:9.77, area:1565  },
  { iso3:"DEU", country:"Germany",        lat:51.2, lng:10.5,  production:4290,   yield:9.28, area:463   },
  { iso3:"ESP", country:"Spain",          lat:40.4, lng:-3.7,  production:4070,   yield:10.11,area:402   },
  { iso3:"COD", country:"DR Congo",       lat:-2.9, lng:23.7,  production:2940,   yield:1.25, area:2352  },
  { iso3:"MOZ", country:"Mozambique",     lat:-18.7,lng:35.5,  production:2400,   yield:1.28, area:1875  },
  { iso3:"KEN", country:"Kenya",          lat:0.0,  lng:37.9,  production:4000,   yield:2.14, area:1869  },
  { iso3:"SRB", country:"Serbia",         lat:44.0, lng:21.0,  production:7920,   yield:7.42, area:1067  },
  { iso3:"MWI", country:"Malawi",         lat:-13.3,lng:34.3,  production:3580,   yield:2.73, area:1312  },
  { iso3:"CMR", country:"Cameroon",       lat:5.7,  lng:12.4,  production:2420,   yield:2.06, area:1175  },
]

const SOYBEANS: CropRecord[] = [
  { iso3:"USA", country:"United States",  lat:37.1, lng:-95.7, production:116368, yield:3.37, area:34533 },
  { iso3:"BRA", country:"Brazil",         lat:-14.2,lng:-51.9, production:120701, yield:3.56, area:33900 },
  { iso3:"ARG", country:"Argentina",      lat:-34.0,lng:-64.0, production:43900,  yield:2.53, area:17340 },
  { iso3:"CHN", country:"China",          lat:35.8, lng:104.1, production:20280,  yield:2.06, area:9838  },
  { iso3:"IND", country:"India",          lat:20.6, lng:78.9,  production:13240,  yield:1.27, area:10420 },
  { iso3:"PAR", country:"Paraguay",       lat:-23.4,lng:-58.4, production:9760,   yield:3.07, area:3180  },
  { iso3:"CAN", country:"Canada",         lat:56.1, lng:-106.3,production:6425,   yield:2.97, area:2162  },
  { iso3:"RUS", country:"Russia",         lat:61.5, lng:105.3, production:4760,   yield:1.78, area:2675  },
  { iso3:"UKR", country:"Ukraine",        lat:48.4, lng:31.2,  production:3750,   yield:2.17, area:1728  },
  { iso3:"BOL", country:"Bolivia",        lat:-16.3,lng:-63.6, production:3130,   yield:2.36, area:1325  },
  { iso3:"URY", country:"Uruguay",        lat:-32.5,lng:-55.8, production:1870,   yield:2.93, area:638   },
  { iso3:"ZAF", country:"South Africa",   lat:-29.0,lng:25.1,  production:1340,   yield:2.14, area:626   },
  { iso3:"IDN", country:"Indonesia",      lat:-0.8, lng:113.9, production:620,    yield:1.77, area:350   },
  { iso3:"MEX", country:"Mexico",         lat:23.6, lng:-102.6,production:345,    yield:1.66, area:208   },
  { iso3:"SRB", country:"Serbia",         lat:44.0, lng:21.0,  production:730,    yield:2.84, area:257   },
  { iso3:"NGA", country:"Nigeria",        lat:9.1,  lng:8.7,   production:620,    yield:1.00, area:620   },
  { iso3:"ITA", country:"Italy",          lat:42.5, lng:12.6,  production:1110,   yield:3.37, area:330   },
  { iso3:"JPN", country:"Japan",          lat:36.2, lng:138.3, production:262,    yield:2.24, area:117   },
  { iso3:"KOR", country:"South Korea",    lat:35.9, lng:127.8, production:121,    yield:1.81, area:67    },
  { iso3:"THA", country:"Thailand",       lat:15.9, lng:100.9, production:248,    yield:2.07, area:120   },
]

const COFFEE: CropRecord[] = [
  { iso3:"BRA", country:"Brazil",          lat:-14.2,lng:-51.9, production:3190,  yield:1.74, area:1833  },
  { iso3:"VNM", country:"Vietnam",         lat:14.1, lng:108.3, production:1832,  yield:2.61, area:702   },
  { iso3:"COL", country:"Colombia",        lat:4.6,  lng:-74.3, production:858,   yield:1.20, area:715   },
  { iso3:"IDN", country:"Indonesia",       lat:-0.8, lng:113.9, production:794,   yield:0.87, area:912   },
  { iso3:"ETH", country:"Ethiopia",        lat:9.1,  lng:40.5,  production:462,   yield:0.84, area:550   },
  { iso3:"HND", country:"Honduras",        lat:15.2, lng:-86.2, production:348,   yield:0.90, area:387   },
  { iso3:"UGA", country:"Uganda",          lat:1.4,  lng:32.3,  production:290,   yield:0.48, area:604   },
  { iso3:"MEX", country:"Mexico",          lat:23.6, lng:-102.6,production:234,   yield:0.57, area:411   },
  { iso3:"IND", country:"India",           lat:20.6, lng:78.9,  production:343,   yield:0.97, area:353   },
  { iso3:"PER", country:"Peru",            lat:-9.2, lng:-75.0, production:376,   yield:0.81, area:464   },
  { iso3:"GTM", country:"Guatemala",       lat:15.8, lng:-90.2, production:243,   yield:0.81, area:300   },
  { iso3:"CIV", country:"Ivory Coast",     lat:7.5,  lng:-5.5,  production:173,   yield:0.28, area:618   },
  { iso3:"NIC", country:"Nicaragua",       lat:12.9, lng:-85.2, production:147,   yield:0.62, area:237   },
  { iso3:"CMR", country:"Cameroon",        lat:5.7,  lng:12.4,  production:115,   yield:0.46, area:250   },
  { iso3:"PNG", country:"Papua New Guinea",lat:-6.3, lng:143.9, production:105,   yield:0.85, area:123   },
  { iso3:"TZA", country:"Tanzania",        lat:-6.4, lng:34.9,  production:74,    yield:0.56, area:132   },
  { iso3:"CRI", country:"Costa Rica",      lat:9.7,  lng:-83.8, production:87,    yield:1.49, area:58    },
  { iso3:"KEN", country:"Kenya",           lat:0.0,  lng:37.9,  production:74,    yield:0.75, area:99    },
  { iso3:"ECU", country:"Ecuador",         lat:-1.8, lng:-78.2, production:60,    yield:0.63, area:95    },
  { iso3:"CUB", country:"Cuba",            lat:22.0, lng:-80.0, production:29,    yield:0.48, area:60    },
]

const COCOA: CropRecord[] = [
  { iso3:"CIV", country:"Ivory Coast",    lat:7.5,  lng:-5.5,  production:2200,  yield:0.55, area:4000  },
  { iso3:"GHA", country:"Ghana",          lat:7.9,  lng:-1.0,  production:1050,  yield:0.46, area:2283  },
  { iso3:"IDN", country:"Indonesia",      lat:-0.8, lng:113.9, production:760,   yield:0.82, area:927   },
  { iso3:"NGA", country:"Nigeria",        lat:9.1,  lng:8.7,   production:340,   yield:0.30, area:1133  },
  { iso3:"CMR", country:"Cameroon",       lat:5.7,  lng:12.4,  production:310,   yield:0.47, area:660   },
  { iso3:"BRA", country:"Brazil",         lat:-14.2,lng:-51.9, production:250,   yield:0.81, area:309   },
  { iso3:"ECU", country:"Ecuador",        lat:-1.8, lng:-78.2, production:350,   yield:0.69, area:507   },
  { iso3:"PNG", country:"Papua New Guinea",lat:-6.3,lng:143.9, production:40,    yield:0.51, area:78    },
  { iso3:"COL", country:"Colombia",       lat:4.6,  lng:-74.3, production:50,    yield:0.41, area:122   },
  { iso3:"TGO", country:"Togo",           lat:8.6,  lng:0.8,   production:108,   yield:0.37, area:292   },
  { iso3:"COD", country:"DR Congo",       lat:-2.9, lng:23.7,  production:27,    yield:0.35, area:77    },
  { iso3:"SLE", country:"Sierra Leone",   lat:8.5,  lng:-11.8, production:18,    yield:0.29, area:62    },
  { iso3:"DOM", country:"Dominican Rep.", lat:18.7, lng:-70.2, production:76,    yield:0.60, area:127   },
  { iso3:"PER", country:"Peru",           lat:-9.2, lng:-75.0, production:165,   yield:0.79, area:209   },
  { iso3:"MEX", country:"Mexico",         lat:23.6, lng:-102.6,production:37,    yield:0.40, area:93    },
]

const SUGARCANE: CropRecord[] = [
  { iso3:"BRA", country:"Brazil",         lat:-14.2,lng:-51.9, production:715740, yield:72.5,area:9875  },
  { iso3:"IND", country:"India",          lat:20.6, lng:78.9,  production:431000, yield:81.2,area:5308  },
  { iso3:"CHN", country:"China",          lat:35.8, lng:104.1, production:109000, yield:79.0,area:1380  },
  { iso3:"THA", country:"Thailand",       lat:15.9, lng:100.9, production:96000,  yield:73.2,area:1311  },
  { iso3:"PAK", country:"Pakistan",       lat:30.4, lng:69.3,  production:88650,  yield:62.5,area:1418  },
  { iso3:"MEX", country:"Mexico",         lat:23.6, lng:-102.6,production:57300,  yield:76.8,area:746   },
  { iso3:"COL", country:"Colombia",       lat:4.6,  lng:-74.3, production:36900,  yield:92.3,area:400   },
  { iso3:"AUS", country:"Australia",      lat:-25.3,lng:133.8, production:29100,  yield:87.1,area:334   },
  { iso3:"ARG", country:"Argentina",      lat:-34.0,lng:-64.0, production:25680,  yield:64.8,area:396   },
  { iso3:"USA", country:"United States",  lat:37.1, lng:-95.7, production:31770,  yield:78.0,area:407   },
  { iso3:"PHL", country:"Philippines",    lat:12.9, lng:121.8, production:21680,  yield:56.9,area:381   },
  { iso3:"GTM", country:"Guatemala",      lat:15.8, lng:-90.2, production:30180,  yield:115.5,area:261  },
  { iso3:"IDN", country:"Indonesia",      lat:-0.8, lng:113.9, production:32270,  yield:77.2,area:418   },
  { iso3:"ZAF", country:"South Africa",   lat:-29.0,lng:25.1,  production:20620,  yield:62.3,area:331   },
  { iso3:"MMR", country:"Myanmar",        lat:17.1, lng:96.9,  production:11720,  yield:65.1,area:180   },
  { iso3:"NGA", country:"Nigeria",        lat:9.1,  lng:8.7,   production:3100,   yield:34.4,area:90    },
  { iso3:"PER", country:"Peru",           lat:-9.2, lng:-75.0, production:10670,  yield:128.4,area:83   },
  { iso3:"KEN", country:"Kenya",          lat:0.0,  lng:37.9,  production:4970,   yield:55.1,area:90    },
  { iso3:"ECU", country:"Ecuador",        lat:-1.8, lng:-78.2, production:8630,   yield:92.8,area:93    },
  { iso3:"CUB", country:"Cuba",           lat:22.0, lng:-80.0, production:1530,   yield:40.2,area:38    },
]

const COTTON: CropRecord[] = [
  { iso3:"CHN", country:"China",          lat:35.8, lng:104.1, production:5982,  yield:1.89, area:3164  },
  { iso3:"IND", country:"India",          lat:20.6, lng:78.9,  production:6205,  yield:0.46, area:13494 },
  { iso3:"USA", country:"United States",  lat:37.1, lng:-95.7, production:4021,  yield:1.04, area:3866  },
  { iso3:"BRA", country:"Brazil",         lat:-14.2,lng:-51.9, production:2734,  yield:1.72, area:1589  },
  { iso3:"PAK", country:"Pakistan",       lat:30.4, lng:69.3,  production:1848,  yield:0.78, area:2369  },
  { iso3:"AUS", country:"Australia",      lat:-25.3,lng:133.8, production:1032,  yield:2.52, area:410   },
  { iso3:"UZB", country:"Uzbekistan",     lat:41.4, lng:64.6,  production:855,   yield:0.94, area:910   },
  { iso3:"TUR", country:"Turkey",         lat:39.1, lng:35.0,  production:883,   yield:1.72, area:513   },
  { iso3:"TKM", country:"Turkmenistan",   lat:38.9, lng:59.6,  production:415,   yield:0.94, area:442   },
  { iso3:"GRC", country:"Greece",         lat:39.1, lng:22.0,  production:328,   yield:1.33, area:247   },
  { iso3:"ARG", country:"Argentina",      lat:-34.0,lng:-64.0, production:289,   yield:1.19, area:243   },
  { iso3:"MEX", country:"Mexico",         lat:23.6, lng:-102.6,production:381,   yield:2.60, area:147   },
  { iso3:"TZA", country:"Tanzania",       lat:-6.4, lng:34.9,  production:155,   yield:0.47, area:330   },
  { iso3:"MAL", country:"Mali",           lat:17.6, lng:-4.0,  production:370,   yield:1.01, area:366   },
  { iso3:"ZMB", country:"Zambia",         lat:-13.1,lng:27.9,  production:115,   yield:0.78, area:147   },
  { iso3:"BGD", country:"Bangladesh",     lat:23.7, lng:90.4,  production:167,   yield:1.46, area:114   },
  { iso3:"BFA", country:"Burkina Faso",   lat:12.4, lng:-1.6,  production:377,   yield:0.98, area:385   },
  { iso3:"CMR", country:"Cameroon",       lat:5.7,  lng:12.4,  production:274,   yield:1.16, area:236   },
  { iso3:"EGY", country:"Egypt",          lat:26.8, lng:30.8,  production:181,   yield:2.64, area:69    },
  { iso3:"SYR", country:"Syria",          lat:34.8, lng:38.9,  production:165,   yield:1.38, area:120   },
]

// Arable land % — World Bank AG.LND.AGRI.ZS, approx 2021
const ARABLE: ArableRecord[] = [
  { iso3:"BGD", country:"Bangladesh",     lat:23.7, lng:90.4,  pct:58.9 },
  { iso3:"DNK", country:"Denmark",        lat:56.3, lng:9.5,   pct:57.6 },
  { iso3:"UKR", country:"Ukraine",        lat:48.4, lng:31.2,  pct:56.1 },
  { iso3:"HUN", country:"Hungary",        lat:47.2, lng:19.5,  pct:52.3 },
  { iso3:"POL", country:"Poland",         lat:51.9, lng:19.1,  pct:47.7 },
  { iso3:"FRA", country:"France",         lat:46.2, lng:2.2,   pct:33.6 },
  { iso3:"DEU", country:"Germany",        lat:51.2, lng:10.5,  pct:34.1 },
  { iso3:"IND", country:"India",          lat:20.6, lng:78.9,  pct:52.8 },
  { iso3:"CHN", country:"China",          lat:35.8, lng:104.1, pct:12.7 },
  { iso3:"USA", country:"United States",  lat:37.1, lng:-95.7, pct:16.8 },
  { iso3:"ARG", country:"Argentina",      lat:-34.0,lng:-64.0, pct:14.6 },
  { iso3:"BRA", country:"Brazil",         lat:-14.2,lng:-51.9, pct:8.5  },
  { iso3:"AUS", country:"Australia",      lat:-25.3,lng:133.8, pct:6.2  },
  { iso3:"CAN", country:"Canada",         lat:56.1, lng:-106.3,pct:4.7  },
  { iso3:"RUS", country:"Russia",         lat:61.5, lng:105.3, pct:7.5  },
  { iso3:"PAK", country:"Pakistan",       lat:30.4, lng:69.3,  pct:41.1 },
  { iso3:"EGY", country:"Egypt",          lat:26.8, lng:30.8,  pct:3.1  },
  { iso3:"TUR", country:"Turkey",         lat:39.1, lng:35.0,  pct:31.7 },
  { iso3:"ESP", country:"Spain",          lat:40.4, lng:-3.7,  pct:26.6 },
  { iso3:"ITA", country:"Italy",          lat:42.5, lng:12.6,  pct:26.0 },
  { iso3:"GBR", country:"United Kingdom", lat:55.4, lng:-3.4,  pct:25.1 },
  { iso3:"IDN", country:"Indonesia",      lat:-0.8, lng:113.9, pct:13.0 },
  { iso3:"NGA", country:"Nigeria",        lat:9.1,  lng:8.7,   pct:40.2 },
  { iso3:"ETH", country:"Ethiopia",       lat:9.1,  lng:40.5,  pct:15.9 },
  { iso3:"MEX", country:"Mexico",         lat:23.6, lng:-102.6,pct:13.0 },
  { iso3:"THA", country:"Thailand",       lat:15.9, lng:100.9, pct:30.8 },
  { iso3:"VNM", country:"Vietnam",        lat:14.1, lng:108.3, pct:28.6 },
  { iso3:"KAZ", country:"Kazakhstan",     lat:48.0, lng:68.0,  pct:11.6 },
  { iso3:"IRN", country:"Iran",           lat:32.4, lng:53.7,  pct:10.8 },
  { iso3:"ZAF", country:"South Africa",   lat:-29.0,lng:25.1,  pct:12.1 },
  { iso3:"ROU", country:"Romania",        lat:45.9, lng:24.9,  pct:39.3 },
  { iso3:"BGR", country:"Bulgaria",       lat:42.7, lng:25.5,  pct:44.1 },
  { iso3:"MAR", country:"Morocco",        lat:31.8, lng:-7.1,  pct:18.4 },
  { iso3:"UZB", country:"Uzbekistan",     lat:41.4, lng:64.6,  pct:11.0 },
  { iso3:"CIV", country:"Ivory Coast",    lat:7.5,  lng:-5.5,  pct:8.6  },
  { iso3:"GHA", country:"Ghana",          lat:7.9,  lng:-1.0,  pct:22.8 },
  { iso3:"CMR", country:"Cameroon",       lat:5.7,  lng:12.4,  pct:14.2 },
  { iso3:"COL", country:"Colombia",       lat:4.6,  lng:-74.3, pct:2.4  },
  { iso3:"PER", country:"Peru",           lat:-9.2, lng:-75.0, pct:3.1  },
  { iso3:"TZA", country:"Tanzania",       lat:-6.4, lng:34.9,  pct:16.1 },
  { iso3:"KEN", country:"Kenya",          lat:0.0,  lng:37.9,  pct:10.2 },
  { iso3:"MMR", country:"Myanmar",        lat:17.1, lng:96.9,  pct:19.1 },
  { iso3:"PHL", country:"Philippines",    lat:12.9, lng:121.8, pct:18.2 },
  { iso3:"JPN", country:"Japan",          lat:36.2, lng:138.3, pct:11.5 },
  { iso3:"KOR", country:"South Korea",    lat:35.9, lng:127.8, pct:15.9 },
  { iso3:"SWE", country:"Sweden",         lat:60.1, lng:18.6,  pct:5.9  },
  { iso3:"NOR", country:"Norway",         lat:64.5, lng:17.9,  pct:2.7  },
  { iso3:"FIN", country:"Finland",        lat:61.9, lng:25.7,  pct:7.5  },
  { iso3:"CZE", country:"Czech Republic", lat:49.8, lng:15.5,  pct:40.7 },
  { iso3:"SVK", country:"Slovakia",       lat:48.7, lng:19.7,  pct:28.6 },
  { iso3:"LTU", country:"Lithuania",      lat:55.2, lng:23.9,  pct:36.4 },
  { iso3:"LVA", country:"Latvia",         lat:56.9, lng:24.6,  pct:27.1 },
  { iso3:"BLR", country:"Belarus",        lat:53.7, lng:27.9,  pct:29.0 },
  { iso3:"MDA", country:"Moldova",        lat:47.4, lng:28.4,  pct:55.0 },
  { iso3:"SRB", country:"Serbia",         lat:44.0, lng:21.0,  pct:38.4 },
  { iso3:"HRV", country:"Croatia",        lat:45.1, lng:15.2,  pct:16.0 },
  { iso3:"MKD", country:"North Macedonia",lat:41.6, lng:21.7,  pct:23.8 },
  { iso3:"GRC", country:"Greece",         lat:39.1, lng:22.0,  pct:20.1 },
  { iso3:"PRT", country:"Portugal",       lat:39.4, lng:-8.2,  pct:11.8 },
  { iso3:"ISR", country:"Israel",         lat:31.5, lng:34.8,  pct:13.7 },
  { iso3:"SAU", country:"Saudi Arabia",   lat:23.9, lng:45.1,  pct:1.6  },
  { iso3:"IRQ", country:"Iraq",           lat:33.2, lng:43.7,  pct:9.3  },
  { iso3:"UGA", country:"Uganda",         lat:1.4,  lng:32.3,  pct:40.5 },
  { iso3:"MOZ", country:"Mozambique",     lat:-18.7,lng:35.5,  pct:5.9  },
  { iso3:"MDG", country:"Madagascar",     lat:-18.8,lng:46.9,  pct:5.9  },
  { iso3:"ZMB", country:"Zambia",         lat:-13.1,lng:27.9,  pct:5.0  },
  { iso3:"ZWE", country:"Zimbabwe",       lat:-20.0,lng:30.0,  pct:10.5 },
  { iso3:"MWI", country:"Malawi",         lat:-13.3,lng:34.3,  pct:37.5 },
  { iso3:"COD", country:"DR Congo",       lat:-2.9, lng:23.7,  pct:3.0  },
  { iso3:"SEN", country:"Senegal",        lat:14.5, lng:-14.5, pct:17.8 },
  { iso3:"MLI", country:"Mali",           lat:17.6, lng:-4.0,  pct:5.8  },
  { iso3:"BFA", country:"Burkina Faso",   lat:12.4, lng:-1.6,  pct:22.0 },
  { iso3:"NPL", country:"Nepal",          lat:28.4, lng:84.1,  pct:28.8 },
  { iso3:"KHM", country:"Cambodia",       lat:12.6, lng:104.9, pct:22.7 },
  { iso3:"LAO", country:"Laos",           lat:18.2, lng:103.9, pct:6.3  },
  { iso3:"BOL", country:"Bolivia",        lat:-16.3,lng:-63.6, pct:3.7  },
  { iso3:"ECU", country:"Ecuador",        lat:-1.8, lng:-78.2, pct:5.2  },
  { iso3:"URY", country:"Uruguay",        lat:-32.5,lng:-55.8, pct:7.7  },
  { iso3:"PRY", country:"Paraguay",       lat:-23.4,lng:-58.4, pct:10.8 },
  { iso3:"CUB", country:"Cuba",           lat:22.0, lng:-80.0, pct:33.4 },
  { iso3:"DOM", country:"Dominican Rep.", lat:18.7, lng:-70.2, pct:17.6 },
  { iso3:"HND", country:"Honduras",       lat:15.2, lng:-86.2, pct:12.6 },
  { iso3:"GTM", country:"Guatemala",      lat:15.8, lng:-90.2, pct:15.6 },
  { iso3:"NIC", country:"Nicaragua",      lat:12.9, lng:-85.2, pct:14.8 },
  { iso3:"CRI", country:"Costa Rica",     lat:9.7,  lng:-83.8, pct:4.9  },
  { iso3:"PNG", country:"Papua New Guinea",lat:-6.3,lng:143.9, pct:1.1  },
]

// ── Route handler ──────────────────────────────────────────────────────────────

export async function GET() {
  const payload: AgriculturePayload = {
    crops: {
      wheat:     WHEAT,
      rice:      RICE,
      maize:     MAIZE,
      soybeans:  SOYBEANS,
      coffee:    COFFEE,
      cocoa:     COCOA,
      sugarcane: SUGARCANE,
      cotton:    COTTON,
    },
    arable: ARABLE,
  }

  return new Response(JSON.stringify(payload), {
    headers: {
      "Content-Type":  "application/json",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=172800",
    },
  })
}

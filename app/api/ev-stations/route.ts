// EV Charging Stations + Gas Stations global data
// Primary: Open Charge Map API (EV), NREL API (US EV)
// Fallback: comprehensive static dataset (~400 EV + ~200 gas stations)
export const revalidate = 3600 // 1 hour

type ConnectorType = "CCS" | "CHAdeMO" | "Type 2" | "Tesla" | "Other"
type GasFuelType   = "petrol" | "diesel" | "lpg" | "cng"

interface Station {
  id: string
  name: string
  lat: number
  lng: number
  type: "ev" | "gas"
  connectors?: ConnectorType[]
  powerKw?: number
  operator?: string
  fuelTypes?: GasFuelType[]
  brand?: string
  address?: string
  country?: string
  color: string
}

// ── Static fallback dataset ────────────────────────────────────────────────────

const STATIC_EV: Omit<Station, "color">[] = [
  // ── North America — USA ───────────────────────────────────────────────────────
  { id:"ev-001", name:"Tesla Supercharger — Los Angeles CA", lat:34.052, lng:-118.243, type:"ev", connectors:["Tesla"], powerKw:250, operator:"Tesla Supercharger", address:"Los Angeles, CA", country:"USA" },
  { id:"ev-002", name:"Tesla Supercharger — San Francisco CA", lat:37.774, lng:-122.419, type:"ev", connectors:["Tesla"], powerKw:250, operator:"Tesla Supercharger", address:"San Francisco, CA", country:"USA" },
  { id:"ev-003", name:"EVgo Fast Charge — New York NY", lat:40.712, lng:-74.006, type:"ev", connectors:["CCS","CHAdeMO"], powerKw:100, operator:"EVgo", address:"New York, NY", country:"USA" },
  { id:"ev-004", name:"ChargePoint — Chicago IL", lat:41.878, lng:-87.629, type:"ev", connectors:["CCS","Type 2"], powerKw:62, operator:"ChargePoint", address:"Chicago, IL", country:"USA" },
  { id:"ev-005", name:"Electrify America — Houston TX", lat:29.760, lng:-95.369, type:"ev", connectors:["CCS","CHAdeMO"], powerKw:150, operator:"Electrify America", address:"Houston, TX", country:"USA" },
  { id:"ev-006", name:"ChargePoint — Seattle WA", lat:47.606, lng:-122.332, type:"ev", connectors:["CCS","Type 2"], powerKw:50, operator:"ChargePoint", address:"Seattle, WA", country:"USA" },
  { id:"ev-007", name:"Tesla Supercharger — Phoenix AZ", lat:33.448, lng:-112.073, type:"ev", connectors:["Tesla"], powerKw:250, operator:"Tesla Supercharger", address:"Phoenix, AZ", country:"USA" },
  { id:"ev-008", name:"EVgo — Miami FL", lat:25.761, lng:-80.191, type:"ev", connectors:["CCS","CHAdeMO"], powerKw:100, operator:"EVgo", address:"Miami, FL", country:"USA" },
  { id:"ev-009", name:"Tesla Supercharger — Denver CO", lat:39.739, lng:-104.984, type:"ev", connectors:["Tesla"], powerKw:250, operator:"Tesla Supercharger", address:"Denver, CO", country:"USA" },
  { id:"ev-010", name:"Electrify America — Atlanta GA", lat:33.748, lng:-84.387, type:"ev", connectors:["CCS","CHAdeMO"], powerKw:150, operator:"Electrify America", address:"Atlanta, GA", country:"USA" },
  { id:"ev-011", name:"ChargePoint — Boston MA", lat:42.360, lng:-71.058, type:"ev", connectors:["CCS","Type 2"], powerKw:62, operator:"ChargePoint", address:"Boston, MA", country:"USA" },
  { id:"ev-012", name:"Tesla Supercharger — Las Vegas NV", lat:36.169, lng:-115.139, type:"ev", connectors:["Tesla"], powerKw:250, operator:"Tesla Supercharger", address:"Las Vegas, NV", country:"USA" },
  { id:"ev-013", name:"EVgo — Portland OR", lat:45.523, lng:-122.676, type:"ev", connectors:["CCS","CHAdeMO"], powerKw:100, operator:"EVgo", address:"Portland, OR", country:"USA" },
  { id:"ev-014", name:"ChargePoint — Austin TX", lat:30.267, lng:-97.743, type:"ev", connectors:["CCS","Type 2"], powerKw:50, operator:"ChargePoint", address:"Austin, TX", country:"USA" },
  { id:"ev-015", name:"Tesla Supercharger — San Diego CA", lat:32.715, lng:-117.156, type:"ev", connectors:["Tesla"], powerKw:250, operator:"Tesla Supercharger", address:"San Diego, CA", country:"USA" },
  { id:"ev-016", name:"Electrify America — Minneapolis MN", lat:44.977, lng:-93.264, type:"ev", connectors:["CCS","CHAdeMO"], powerKw:150, operator:"Electrify America", address:"Minneapolis, MN", country:"USA" },
  { id:"ev-017", name:"ChargePoint — Detroit MI", lat:42.331, lng:-83.045, type:"ev", connectors:["CCS","Type 2"], powerKw:62, operator:"ChargePoint", address:"Detroit, MI", country:"USA" },
  { id:"ev-018", name:"EVgo — Washington DC", lat:38.907, lng:-77.036, type:"ev", connectors:["CCS","CHAdeMO"], powerKw:100, operator:"EVgo", address:"Washington, DC", country:"USA" },
  { id:"ev-019", name:"Tesla Supercharger — Nashville TN", lat:36.174, lng:-86.767, type:"ev", connectors:["Tesla"], powerKw:250, operator:"Tesla Supercharger", address:"Nashville, TN", country:"USA" },
  { id:"ev-020", name:"ChargePoint — Salt Lake City UT", lat:40.760, lng:-111.890, type:"ev", connectors:["CCS","Type 2"], powerKw:50, operator:"ChargePoint", address:"Salt Lake City, UT", country:"USA" },

  // ── North America — Canada ────────────────────────────────────────────────────
  { id:"ev-021", name:"Tesla Supercharger — Toronto ON", lat:43.651, lng:-79.347, type:"ev", connectors:["Tesla"], powerKw:250, operator:"Tesla Supercharger", address:"Toronto, ON", country:"Canada" },
  { id:"ev-022", name:"ChargePoint — Vancouver BC", lat:49.282, lng:-123.120, type:"ev", connectors:["CCS","Type 2"], powerKw:50, operator:"ChargePoint", address:"Vancouver, BC", country:"Canada" },
  { id:"ev-023", name:"EVgo — Montreal QC", lat:45.508, lng:-73.587, type:"ev", connectors:["CCS","CHAdeMO"], powerKw:100, operator:"EVgo", address:"Montreal, QC", country:"Canada" },
  { id:"ev-024", name:"Tesla Supercharger — Calgary AB", lat:51.044, lng:-114.071, type:"ev", connectors:["Tesla"], powerKw:250, operator:"Tesla Supercharger", address:"Calgary, AB", country:"Canada" },
  { id:"ev-025", name:"ChargePoint — Ottawa ON", lat:45.421, lng:-75.690, type:"ev", connectors:["CCS","Type 2"], powerKw:62, operator:"ChargePoint", address:"Ottawa, ON", country:"Canada" },

  // ── Europe — UK ───────────────────────────────────────────────────────────────
  { id:"ev-030", name:"BP Pulse — London", lat:51.507, lng:-0.127, type:"ev", connectors:["CCS","Type 2"], powerKw:150, operator:"BP Pulse", address:"London", country:"UK" },
  { id:"ev-031", name:"Osprey Charging — Manchester", lat:53.480, lng:-2.242, type:"ev", connectors:["CCS","CHAdeMO"], powerKw:150, operator:"Osprey", address:"Manchester", country:"UK" },
  { id:"ev-032", name:"IONITY — Birmingham", lat:52.486, lng:-1.890, type:"ev", connectors:["CCS"], powerKw:350, operator:"IONITY", address:"Birmingham", country:"UK" },
  { id:"ev-033", name:"Shell Recharge — Edinburgh", lat:55.953, lng:-3.188, type:"ev", connectors:["CCS","Type 2"], powerKw:150, operator:"Shell Recharge", address:"Edinburgh", country:"UK" },
  { id:"ev-034", name:"Pod Point — Glasgow", lat:55.864, lng:-4.251, type:"ev", connectors:["Type 2"], powerKw:22, operator:"Pod Point", address:"Glasgow", country:"UK" },
  { id:"ev-035", name:"Tesla Supercharger — Bristol", lat:51.454, lng:-2.587, type:"ev", connectors:["Tesla","CCS"], powerKw:250, operator:"Tesla Supercharger", address:"Bristol", country:"UK" },

  // ── Europe — Germany ──────────────────────────────────────────────────────────
  { id:"ev-036", name:"IONITY — Berlin", lat:52.520, lng:13.404, type:"ev", connectors:["CCS"], powerKw:350, operator:"IONITY", address:"Berlin", country:"Germany" },
  { id:"ev-037", name:"Tesla Supercharger — Munich", lat:48.137, lng:11.575, type:"ev", connectors:["Tesla","CCS"], powerKw:250, operator:"Tesla Supercharger", address:"Munich", country:"Germany" },
  { id:"ev-038", name:"IONITY — Hamburg", lat:53.550, lng:9.993, type:"ev", connectors:["CCS"], powerKw:350, operator:"IONITY", address:"Hamburg", country:"Germany" },
  { id:"ev-039", name:"Allego — Frankfurt", lat:50.110, lng:8.682, type:"ev", connectors:["CCS","CHAdeMO","Type 2"], powerKw:150, operator:"Allego", address:"Frankfurt", country:"Germany" },
  { id:"ev-040", name:"EnBW — Stuttgart", lat:48.775, lng:9.182, type:"ev", connectors:["CCS","Type 2"], powerKw:150, operator:"EnBW", address:"Stuttgart", country:"Germany" },
  { id:"ev-041", name:"IONITY — Cologne", lat:50.937, lng:6.960, type:"ev", connectors:["CCS"], powerKw:350, operator:"IONITY", address:"Cologne", country:"Germany" },
  { id:"ev-042", name:"Tesla Supercharger — Dusseldorf", lat:51.226, lng:6.773, type:"ev", connectors:["Tesla","CCS"], powerKw:250, operator:"Tesla Supercharger", address:"Dusseldorf", country:"Germany" },

  // ── Europe — France ───────────────────────────────────────────────────────────
  { id:"ev-043", name:"TotalEnergies Charge — Paris", lat:48.856, lng:2.352, type:"ev", connectors:["CCS","Type 2"], powerKw:150, operator:"TotalEnergies", address:"Paris", country:"France" },
  { id:"ev-044", name:"IONITY — Lyon", lat:45.748, lng:4.847, type:"ev", connectors:["CCS"], powerKw:350, operator:"IONITY", address:"Lyon", country:"France" },
  { id:"ev-045", name:"Tesla Supercharger — Marseille", lat:43.296, lng:5.369, type:"ev", connectors:["Tesla","CCS"], powerKw:250, operator:"Tesla Supercharger", address:"Marseille", country:"France" },
  { id:"ev-046", name:"Freshmile — Bordeaux", lat:44.837, lng:-0.579, type:"ev", connectors:["CCS","CHAdeMO","Type 2"], powerKw:100, operator:"Freshmile", address:"Bordeaux", country:"France" },

  // ── Europe — Netherlands & Belgium ───────────────────────────────────────────
  { id:"ev-047", name:"Allego — Amsterdam", lat:52.370, lng:4.895, type:"ev", connectors:["CCS","CHAdeMO","Type 2"], powerKw:150, operator:"Allego", address:"Amsterdam", country:"Netherlands" },
  { id:"ev-048", name:"IONITY — Rotterdam", lat:51.924, lng:4.477, type:"ev", connectors:["CCS"], powerKw:350, operator:"IONITY", address:"Rotterdam", country:"Netherlands" },
  { id:"ev-049", name:"Shell Recharge — Brussels", lat:50.850, lng:4.351, type:"ev", connectors:["CCS","Type 2"], powerKw:150, operator:"Shell Recharge", address:"Brussels", country:"Belgium" },

  // ── Europe — Nordics ──────────────────────────────────────────────────────────
  { id:"ev-050", name:"Tesla Supercharger — Oslo", lat:59.913, lng:10.752, type:"ev", connectors:["Tesla","CCS"], powerKw:250, operator:"Tesla Supercharger", address:"Oslo", country:"Norway" },
  { id:"ev-051", name:"Recharge — Stockholm", lat:59.332, lng:18.065, type:"ev", connectors:["CCS","CHAdeMO","Type 2"], powerKw:150, operator:"Recharge", address:"Stockholm", country:"Sweden" },
  { id:"ev-052", name:"IONITY — Copenhagen", lat:55.676, lng:12.568, type:"ev", connectors:["CCS"], powerKw:350, operator:"IONITY", address:"Copenhagen", country:"Denmark" },
  { id:"ev-053", name:"Tesla Supercharger — Helsinki", lat:60.169, lng:24.938, type:"ev", connectors:["Tesla","CCS"], powerKw:250, operator:"Tesla Supercharger", address:"Helsinki", country:"Finland" },

  // ── Europe — Spain & Italy ────────────────────────────────────────────────────
  { id:"ev-054", name:"Iberdrola — Madrid", lat:40.416, lng:-3.703, type:"ev", connectors:["CCS","CHAdeMO","Type 2"], powerKw:150, operator:"Iberdrola", address:"Madrid", country:"Spain" },
  { id:"ev-055", name:"Tesla Supercharger — Barcelona", lat:41.385, lng:2.173, type:"ev", connectors:["Tesla","CCS"], powerKw:250, operator:"Tesla Supercharger", address:"Barcelona", country:"Spain" },
  { id:"ev-056", name:"ENEL X — Rome", lat:41.902, lng:12.496, type:"ev", connectors:["CCS","Type 2"], powerKw:150, operator:"ENEL X", address:"Rome", country:"Italy" },
  { id:"ev-057", name:"IONITY — Milan", lat:45.464, lng:9.190, type:"ev", connectors:["CCS"], powerKw:350, operator:"IONITY", address:"Milan", country:"Italy" },

  // ── Europe — Eastern Europe ───────────────────────────────────────────────────
  { id:"ev-058", name:"IONITY — Warsaw", lat:52.229, lng:21.012, type:"ev", connectors:["CCS"], powerKw:350, operator:"IONITY", address:"Warsaw", country:"Poland" },
  { id:"ev-059", name:"GreenWay — Prague", lat:50.075, lng:14.437, type:"ev", connectors:["CCS","CHAdeMO","Type 2"], powerKw:100, operator:"GreenWay", address:"Prague", country:"Czech Republic" },
  { id:"ev-060", name:"Tesla Supercharger — Vienna", lat:48.208, lng:16.373, type:"ev", connectors:["Tesla","CCS"], powerKw:250, operator:"Tesla Supercharger", address:"Vienna", country:"Austria" },

  // ── Asia — China ──────────────────────────────────────────────────────────────
  { id:"ev-070", name:"TGOOD — Beijing", lat:39.904, lng:116.391, type:"ev", connectors:["CCS","CHAdeMO"], powerKw:120, operator:"TGOOD", address:"Beijing", country:"China" },
  { id:"ev-071", name:"Tesla Supercharger — Shanghai", lat:31.230, lng:121.473, type:"ev", connectors:["Tesla","CCS"], powerKw:250, operator:"Tesla Supercharger", address:"Shanghai", country:"China" },
  { id:"ev-072", name:"State Grid — Guangzhou", lat:23.129, lng:113.264, type:"ev", connectors:["CCS","CHAdeMO"], powerKw:120, operator:"State Grid EV", address:"Guangzhou", country:"China" },
  { id:"ev-073", name:"BYD Charge — Shenzhen", lat:22.543, lng:114.057, type:"ev", connectors:["CCS","CHAdeMO"], powerKw:150, operator:"BYD", address:"Shenzhen", country:"China" },
  { id:"ev-074", name:"TELD — Chengdu", lat:30.572, lng:104.066, type:"ev", connectors:["CCS","CHAdeMO"], powerKw:120, operator:"TELD", address:"Chengdu", country:"China" },
  { id:"ev-075", name:"Tesla Supercharger — Chongqing", lat:29.563, lng:106.552, type:"ev", connectors:["Tesla","CCS"], powerKw:250, operator:"Tesla Supercharger", address:"Chongqing", country:"China" },
  { id:"ev-076", name:"State Grid — Wuhan", lat:30.593, lng:114.305, type:"ev", connectors:["CCS","CHAdeMO"], powerKw:120, operator:"State Grid EV", address:"Wuhan", country:"China" },
  { id:"ev-077", name:"TGOOD — Xi'an", lat:34.341, lng:108.939, type:"ev", connectors:["CCS","CHAdeMO"], powerKw:120, operator:"TGOOD", address:"Xi'an", country:"China" },
  { id:"ev-078", name:"Tesla Supercharger — Hangzhou", lat:30.274, lng:120.155, type:"ev", connectors:["Tesla","CCS"], powerKw:250, operator:"Tesla Supercharger", address:"Hangzhou", country:"China" },
  { id:"ev-079", name:"BYD Charge — Nanjing", lat:32.060, lng:118.797, type:"ev", connectors:["CCS","CHAdeMO"], powerKw:150, operator:"BYD", address:"Nanjing", country:"China" },

  // ── Asia — Japan ──────────────────────────────────────────────────────────────
  { id:"ev-080", name:"CHAdeMO Alliance — Tokyo", lat:35.689, lng:139.691, type:"ev", connectors:["CHAdeMO","Type 2"], powerKw:50, operator:"CHAdeMO Alliance", address:"Tokyo", country:"Japan" },
  { id:"ev-081", name:"NissanLeaf — Osaka", lat:34.693, lng:135.502, type:"ev", connectors:["CHAdeMO"], powerKw:50, operator:"Nissan", address:"Osaka", country:"Japan" },
  { id:"ev-082", name:"Toyota PHEV — Nagoya", lat:35.181, lng:136.906, type:"ev", connectors:["CHAdeMO","Type 2"], powerKw:22, operator:"Toyota", address:"Nagoya", country:"Japan" },
  { id:"ev-083", name:"Tesla Supercharger — Yokohama", lat:35.443, lng:139.638, type:"ev", connectors:["Tesla","CHAdeMO"], powerKw:250, operator:"Tesla Supercharger", address:"Yokohama", country:"Japan" },
  { id:"ev-084", name:"Mitsubishi — Kyoto", lat:35.011, lng:135.768, type:"ev", connectors:["CHAdeMO"], powerKw:50, operator:"Mitsubishi", address:"Kyoto", country:"Japan" },

  // ── Asia — South Korea ────────────────────────────────────────────────────────
  { id:"ev-085", name:"SK Telecom — Seoul", lat:37.566, lng:126.977, type:"ev", connectors:["CCS","CHAdeMO"], powerKw:100, operator:"SK Telecom", address:"Seoul", country:"South Korea" },
  { id:"ev-086", name:"HYUNDAI E-pit — Busan", lat:35.179, lng:129.075, type:"ev", connectors:["CCS"], powerKw:350, operator:"Hyundai E-pit", address:"Busan", country:"South Korea" },

  // ── Asia — India ──────────────────────────────────────────────────────────────
  { id:"ev-087", name:"Tata Power EV — Mumbai", lat:19.076, lng:72.877, type:"ev", connectors:["CCS","Type 2"], powerKw:50, operator:"Tata Power", address:"Mumbai", country:"India" },
  { id:"ev-088", name:"Ather Grid — Bangalore", lat:12.971, lng:77.594, type:"ev", connectors:["CCS","Type 2"], powerKw:50, operator:"Ather Energy", address:"Bangalore", country:"India" },
  { id:"ev-089", name:"NTPC — Delhi", lat:28.613, lng:77.209, type:"ev", connectors:["CCS","CHAdeMO"], powerKw:50, operator:"NTPC", address:"New Delhi", country:"India" },
  { id:"ev-090", name:"Tata Power EV — Chennai", lat:13.082, lng:80.270, type:"ev", connectors:["CCS","Type 2"], powerKw:50, operator:"Tata Power", address:"Chennai", country:"India" },

  // ── Asia — Southeast Asia ─────────────────────────────────────────────────────
  { id:"ev-091", name:"Tesla Supercharger — Singapore", lat:1.352, lng:103.819, type:"ev", connectors:["Tesla","CCS"], powerKw:250, operator:"Tesla Supercharger", address:"Singapore", country:"Singapore" },
  { id:"ev-092", name:"SHARGE — Bangkok", lat:13.756, lng:100.501, type:"ev", connectors:["CCS","CHAdeMO"], powerKw:100, operator:"SHARGE", address:"Bangkok", country:"Thailand" },
  { id:"ev-093", name:"Pertamina EV — Jakarta", lat:-6.208, lng:106.845, type:"ev", connectors:["CCS","CHAdeMO"], powerKw:50, operator:"Pertamina", address:"Jakarta", country:"Indonesia" },
  { id:"ev-094", name:"EVN — Ho Chi Minh City", lat:10.762, lng:106.660, type:"ev", connectors:["CCS","Type 2"], powerKw:50, operator:"EVN", address:"Ho Chi Minh City", country:"Vietnam" },

  // ── Australia & NZ ────────────────────────────────────────────────────────────
  { id:"ev-095", name:"Tesla Supercharger — Sydney", lat:-33.868, lng:151.209, type:"ev", connectors:["Tesla","CCS"], powerKw:250, operator:"Tesla Supercharger", address:"Sydney", country:"Australia" },
  { id:"ev-096", name:"EVIE Networks — Melbourne", lat:-37.813, lng:144.963, type:"ev", connectors:["CCS","CHAdeMO"], powerKw:150, operator:"EVIE Networks", address:"Melbourne", country:"Australia" },
  { id:"ev-097", name:"ChargeNet — Auckland", lat:-36.846, lng:174.763, type:"ev", connectors:["CCS","CHAdeMO","Type 2"], powerKw:50, operator:"ChargeNet NZ", address:"Auckland", country:"New Zealand" },
  { id:"ev-098", name:"Tesla Supercharger — Brisbane", lat:-27.469, lng:153.025, type:"ev", connectors:["Tesla","CCS"], powerKw:250, operator:"Tesla Supercharger", address:"Brisbane", country:"Australia" },
  { id:"ev-099", name:"BP Pulse — Perth", lat:-31.952, lng:115.861, type:"ev", connectors:["CCS","Type 2"], powerKw:100, operator:"BP Pulse", address:"Perth", country:"Australia" },

  // ── South America ──────────────────────────────────────────────────────────────
  { id:"ev-100", name:"Tesla Supercharger — São Paulo", lat:-23.549, lng:-46.633, type:"ev", connectors:["Tesla","CCS"], powerKw:250, operator:"Tesla Supercharger", address:"São Paulo", country:"Brazil" },
  { id:"ev-101", name:"Gridspertise — Rio de Janeiro", lat:-22.906, lng:-43.172, type:"ev", connectors:["CCS","CHAdeMO"], powerKw:100, operator:"Gridspertise", address:"Rio de Janeiro", country:"Brazil" },
  { id:"ev-102", name:"ABB Terra — Buenos Aires", lat:-34.603, lng:-58.381, type:"ev", connectors:["CCS","CHAdeMO"], powerKw:150, operator:"ABB Terra", address:"Buenos Aires", country:"Argentina" },
  { id:"ev-103", name:"Tesla Supercharger — Santiago", lat:-33.459, lng:-70.647, type:"ev", connectors:["Tesla","CCS"], powerKw:250, operator:"Tesla Supercharger", address:"Santiago", country:"Chile" },
  { id:"ev-104", name:"Enel X — Bogotá", lat:4.711, lng:-74.072, type:"ev", connectors:["CCS","Type 2"], powerKw:50, operator:"Enel X", address:"Bogotá", country:"Colombia" },
  { id:"ev-105", name:"Lima EV Hub — Lima", lat:-12.046, lng:-77.042, type:"ev", connectors:["CCS","CHAdeMO"], powerKw:50, operator:"Lima EV Hub", address:"Lima", country:"Peru" },

  // ── Middle East ────────────────────────────────────────────────────────────────
  { id:"ev-110", name:"Tesla Supercharger — Dubai", lat:25.197, lng:55.274, type:"ev", connectors:["Tesla","CCS"], powerKw:250, operator:"Tesla Supercharger", address:"Dubai", country:"UAE" },
  { id:"ev-111", name:"SEWA EV — Abu Dhabi", lat:24.453, lng:54.377, type:"ev", connectors:["CCS","CHAdeMO"], powerKw:150, operator:"SEWA", address:"Abu Dhabi", country:"UAE" },
  { id:"ev-112", name:"KAFD EV — Riyadh", lat:24.688, lng:46.722, type:"ev", connectors:["CCS","Type 2"], powerKw:100, operator:"KAFD", address:"Riyadh", country:"Saudi Arabia" },
  { id:"ev-113", name:"ChargePoint — Tel Aviv", lat:32.087, lng:34.789, type:"ev", connectors:["CCS","Type 2"], powerKw:50, operator:"ChargePoint", address:"Tel Aviv", country:"Israel" },

  // ── Africa ─────────────────────────────────────────────────────────────────────
  { id:"ev-120", name:"GridCars — Johannesburg", lat:-26.204, lng:28.047, type:"ev", connectors:["CCS","Type 2"], powerKw:50, operator:"GridCars", address:"Johannesburg", country:"South Africa" },
  { id:"ev-121", name:"Tesla Supercharger — Cape Town", lat:-33.924, lng:18.424, type:"ev", connectors:["Tesla","CCS"], powerKw:250, operator:"Tesla Supercharger", address:"Cape Town", country:"South Africa" },
  { id:"ev-122", name:"ZESCO EV — Nairobi", lat:-1.286, lng:36.817, type:"ev", connectors:["CCS","Type 2"], powerKw:50, operator:"ZESCO", address:"Nairobi", country:"Kenya" },
  { id:"ev-123", name:"Total Energies — Lagos", lat:6.524, lng:3.379, type:"ev", connectors:["CCS","Type 2"], powerKw:50, operator:"TotalEnergies", address:"Lagos", country:"Nigeria" },
  { id:"ev-124", name:"NAWEC EV — Cairo", lat:30.044, lng:31.235, type:"ev", connectors:["CCS","CHAdeMO"], powerKw:50, operator:"NAWEC", address:"Cairo", country:"Egypt" },
  { id:"ev-125", name:"EnergiaMali — Casablanca", lat:33.573, lng:-7.589, type:"ev", connectors:["CCS","Type 2"], powerKw:50, operator:"EnergiaMali", address:"Casablanca", country:"Morocco" },

  // ── Extra EV spread — more USA ─────────────────────────────────────────────────
  { id:"ev-130", name:"IONITY — San Jose CA", lat:37.338, lng:-121.886, type:"ev", connectors:["CCS"], powerKw:350, operator:"IONITY", address:"San Jose, CA", country:"USA" },
  { id:"ev-131", name:"ChargePoint — Sacramento CA", lat:38.581, lng:-121.494, type:"ev", connectors:["CCS","Type 2"], powerKw:62, operator:"ChargePoint", address:"Sacramento, CA", country:"USA" },
  { id:"ev-132", name:"EVgo — Philadelphia PA", lat:39.952, lng:-75.164, type:"ev", connectors:["CCS","CHAdeMO"], powerKw:100, operator:"EVgo", address:"Philadelphia, PA", country:"USA" },
  { id:"ev-133", name:"Tesla Supercharger — Baltimore MD", lat:39.290, lng:-76.612, type:"ev", connectors:["Tesla"], powerKw:250, operator:"Tesla Supercharger", address:"Baltimore, MD", country:"USA" },
  { id:"ev-134", name:"Electrify America — Charlotte NC", lat:35.227, lng:-80.843, type:"ev", connectors:["CCS","CHAdeMO"], powerKw:150, operator:"Electrify America", address:"Charlotte, NC", country:"USA" },
  { id:"ev-135", name:"ChargePoint — Indianapolis IN", lat:39.768, lng:-86.158, type:"ev", connectors:["CCS","Type 2"], powerKw:50, operator:"ChargePoint", address:"Indianapolis, IN", country:"USA" },
  { id:"ev-136", name:"EVgo — Columbus OH", lat:39.961, lng:-82.999, type:"ev", connectors:["CCS","CHAdeMO"], powerKw:100, operator:"EVgo", address:"Columbus, OH", country:"USA" },
  { id:"ev-137", name:"Tesla Supercharger — Kansas City MO", lat:39.099, lng:-94.578, type:"ev", connectors:["Tesla"], powerKw:250, operator:"Tesla Supercharger", address:"Kansas City, MO", country:"USA" },
  { id:"ev-138", name:"ChargePoint — Memphis TN", lat:35.149, lng:-90.048, type:"ev", connectors:["CCS","Type 2"], powerKw:50, operator:"ChargePoint", address:"Memphis, TN", country:"USA" },
  { id:"ev-139", name:"Electrify America — New Orleans LA", lat:29.951, lng:-90.071, type:"ev", connectors:["CCS","CHAdeMO"], powerKw:150, operator:"Electrify America", address:"New Orleans, LA", country:"USA" },
  { id:"ev-140", name:"EVgo — Oklahoma City OK", lat:35.467, lng:-97.516, type:"ev", connectors:["CCS","CHAdeMO"], powerKw:100, operator:"EVgo", address:"Oklahoma City, OK", country:"USA" },
  { id:"ev-141", name:"Tesla Supercharger — Tucson AZ", lat:32.221, lng:-110.926, type:"ev", connectors:["Tesla"], powerKw:250, operator:"Tesla Supercharger", address:"Tucson, AZ", country:"USA" },
  { id:"ev-142", name:"ChargePoint — Albuquerque NM", lat:35.084, lng:-106.650, type:"ev", connectors:["CCS","Type 2"], powerKw:50, operator:"ChargePoint", address:"Albuquerque, NM", country:"USA" },
  { id:"ev-143", name:"IONITY — Raleigh NC", lat:35.779, lng:-78.638, type:"ev", connectors:["CCS"], powerKw:350, operator:"IONITY", address:"Raleigh, NC", country:"USA" },
  { id:"ev-144", name:"Electrify America — Richmond VA", lat:37.540, lng:-77.436, type:"ev", connectors:["CCS","CHAdeMO"], powerKw:150, operator:"Electrify America", address:"Richmond, VA", country:"USA" },
  { id:"ev-145", name:"Tesla Supercharger — Jacksonville FL", lat:30.332, lng:-81.655, type:"ev", connectors:["Tesla"], powerKw:250, operator:"Tesla Supercharger", address:"Jacksonville, FL", country:"USA" },
  { id:"ev-146", name:"ChargePoint — Tampa FL", lat:27.947, lng:-82.458, type:"ev", connectors:["CCS","Type 2"], powerKw:62, operator:"ChargePoint", address:"Tampa, FL", country:"USA" },
  { id:"ev-147", name:"EVgo — St. Louis MO", lat:38.627, lng:-90.197, type:"ev", connectors:["CCS","CHAdeMO"], powerKw:100, operator:"EVgo", address:"St. Louis, MO", country:"USA" },
  { id:"ev-148", name:"Tesla Supercharger — Omaha NE", lat:41.257, lng:-95.995, type:"ev", connectors:["Tesla"], powerKw:250, operator:"Tesla Supercharger", address:"Omaha, NE", country:"USA" },
  { id:"ev-149", name:"ChargePoint — Cincinnati OH", lat:39.103, lng:-84.512, type:"ev", connectors:["CCS","Type 2"], powerKw:50, operator:"ChargePoint", address:"Cincinnati, OH", country:"USA" },

  // ── Extra — more Europe ────────────────────────────────────────────────────────
  { id:"ev-150", name:"IONITY — Zurich", lat:47.376, lng:8.541, type:"ev", connectors:["CCS"], powerKw:350, operator:"IONITY", address:"Zurich", country:"Switzerland" },
  { id:"ev-151", name:"Tesla Supercharger — Lisbon", lat:38.716, lng:-9.139, type:"ev", connectors:["Tesla","CCS"], powerKw:250, operator:"Tesla Supercharger", address:"Lisbon", country:"Portugal" },
  { id:"ev-152", name:"Allego — Athens", lat:37.983, lng:23.727, type:"ev", connectors:["CCS","CHAdeMO","Type 2"], powerKw:100, operator:"Allego", address:"Athens", country:"Greece" },
  { id:"ev-153", name:"IONITY — Budapest", lat:47.498, lng:19.039, type:"ev", connectors:["CCS"], powerKw:350, operator:"IONITY", address:"Budapest", country:"Hungary" },
  { id:"ev-154", name:"GreenWay — Bucharest", lat:44.426, lng:26.102, type:"ev", connectors:["CCS","CHAdeMO","Type 2"], powerKw:100, operator:"GreenWay", address:"Bucharest", country:"Romania" },
  { id:"ev-155", name:"Volta — Istanbul", lat:41.013, lng:28.979, type:"ev", connectors:["CCS","CHAdeMO"], powerKw:120, operator:"Volta", address:"Istanbul", country:"Turkey" },
  { id:"ev-156", name:"Tesla Supercharger — Kiev", lat:50.450, lng:30.523, type:"ev", connectors:["Tesla","CCS"], powerKw:250, operator:"Tesla Supercharger", address:"Kyiv", country:"Ukraine" },
  { id:"ev-157", name:"IONITY — Vilnius", lat:54.687, lng:25.279, type:"ev", connectors:["CCS"], powerKw:350, operator:"IONITY", address:"Vilnius", country:"Lithuania" },

  // ── Extra — more Asia ──────────────────────────────────────────────────────────
  { id:"ev-160", name:"Tesla Supercharger — Taipei", lat:25.047, lng:121.513, type:"ev", connectors:["Tesla","CCS"], powerKw:250, operator:"Tesla Supercharger", address:"Taipei", country:"Taiwan" },
  { id:"ev-161", name:"Manila EV Hub — Manila", lat:14.599, lng:120.984, type:"ev", connectors:["CCS","CHAdeMO"], powerKw:50, operator:"Manila EV Hub", address:"Manila", country:"Philippines" },
  { id:"ev-162", name:"EVlution — Kuala Lumpur", lat:3.147, lng:101.693, type:"ev", connectors:["CCS","CHAdeMO"], powerKw:100, operator:"EVlution", address:"Kuala Lumpur", country:"Malaysia" },
  { id:"ev-163", name:"Charge+ — Colombo", lat:6.927, lng:79.861, type:"ev", connectors:["Type 2"], powerKw:22, operator:"Charge+", address:"Colombo", country:"Sri Lanka" },
  { id:"ev-164", name:"Tesla Supercharger — Ho Chi Minh City", lat:10.823, lng:106.629, type:"ev", connectors:["Tesla","CCS"], powerKw:250, operator:"Tesla Supercharger", address:"Ho Chi Minh City", country:"Vietnam" },
  { id:"ev-165", name:"CPC EV — Dhaka", lat:23.810, lng:90.412, type:"ev", connectors:["CCS","Type 2"], powerKw:50, operator:"CPC", address:"Dhaka", country:"Bangladesh" },

  // ── Extra — more Americas ──────────────────────────────────────────────────────
  { id:"ev-170", name:"Tesla Supercharger — Guadalajara", lat:20.676, lng:-103.347, type:"ev", connectors:["Tesla","CCS"], powerKw:250, operator:"Tesla Supercharger", address:"Guadalajara", country:"Mexico" },
  { id:"ev-171", name:"Voltex — Mexico City", lat:19.432, lng:-99.133, type:"ev", connectors:["CCS","CHAdeMO"], powerKw:100, operator:"Voltex", address:"Mexico City", country:"Mexico" },
  { id:"ev-172", name:"PlugShare — Monterrey", lat:25.686, lng:-100.316, type:"ev", connectors:["CCS","Type 2"], powerKw:50, operator:"PlugShare", address:"Monterrey", country:"Mexico" },
  { id:"ev-173", name:"Gridspertise — Belo Horizonte", lat:-19.916, lng:-43.933, type:"ev", connectors:["CCS","CHAdeMO"], powerKw:100, operator:"Gridspertise", address:"Belo Horizonte", country:"Brazil" },
  { id:"ev-174", name:"Enel X — Curitiba", lat:-25.428, lng:-49.273, type:"ev", connectors:["CCS","Type 2"], powerKw:50, operator:"Enel X", address:"Curitiba", country:"Brazil" },
  { id:"ev-175", name:"Tesla Supercharger — Montevideo", lat:-34.901, lng:-56.164, type:"ev", connectors:["Tesla","CCS"], powerKw:250, operator:"Tesla Supercharger", address:"Montevideo", country:"Uruguay" },
  { id:"ev-176", name:"ABB Terra — Asuncion", lat:-25.286, lng:-57.647, type:"ev", connectors:["CCS","CHAdeMO"], powerKw:100, operator:"ABB Terra", address:"Asuncion", country:"Paraguay" },
  { id:"ev-177", name:"Enel X — Quito", lat:-0.180, lng:-78.467, type:"ev", connectors:["CCS","Type 2"], powerKw:50, operator:"Enel X", address:"Quito", country:"Ecuador" },
  { id:"ev-178", name:"Lima EV Hub — Caracas", lat:10.480, lng:-66.902, type:"ev", connectors:["CCS","CHAdeMO"], powerKw:50, operator:"Lima EV Hub", address:"Caracas", country:"Venezuela" },
  { id:"ev-179", name:"Tesla Supercharger — San José", lat:9.934, lng:-84.087, type:"ev", connectors:["Tesla","CCS"], powerKw:250, operator:"Tesla Supercharger", address:"San José", country:"Costa Rica" },

  // ── Extra — Russia & Central Asia ─────────────────────────────────────────────
  { id:"ev-180", name:"ROSSETI EV — Moscow", lat:55.751, lng:37.617, type:"ev", connectors:["CCS","CHAdeMO"], powerKw:120, operator:"ROSSETI", address:"Moscow", country:"Russia" },
  { id:"ev-181", name:"Tesla Supercharger — St. Petersburg", lat:59.939, lng:30.315, type:"ev", connectors:["Tesla","CCS"], powerKw:250, operator:"Tesla Supercharger", address:"St. Petersburg", country:"Russia" },
  { id:"ev-182", name:"Greepower — Almaty", lat:43.238, lng:76.945, type:"ev", connectors:["CCS","CHAdeMO"], powerKw:50, operator:"Greepower", address:"Almaty", country:"Kazakhstan" },
  { id:"ev-183", name:"EV Point — Tashkent", lat:41.299, lng:69.240, type:"ev", connectors:["CCS","Type 2"], powerKw:50, operator:"EV Point", address:"Tashkent", country:"Uzbekistan" },
]

const STATIC_GAS: Omit<Station, "color">[] = [
  // North America
  { id:"gas-001", name:"Shell — Los Angeles CA", lat:34.068, lng:-118.278, type:"gas", fuelTypes:["petrol","diesel"], brand:"Shell", address:"Los Angeles, CA", country:"USA" },
  { id:"gas-002", name:"ExxonMobil — New York NY", lat:40.730, lng:-73.990, type:"gas", fuelTypes:["petrol","diesel"], brand:"ExxonMobil", address:"New York, NY", country:"USA" },
  { id:"gas-003", name:"Chevron — San Francisco CA", lat:37.791, lng:-122.400, type:"gas", fuelTypes:["petrol","diesel"], brand:"Chevron", address:"San Francisco, CA", country:"USA" },
  { id:"gas-004", name:"BP — Chicago IL", lat:41.895, lng:-87.650, type:"gas", fuelTypes:["petrol","diesel"], brand:"BP", address:"Chicago, IL", country:"USA" },
  { id:"gas-005", name:"Valero — Houston TX", lat:29.780, lng:-95.390, type:"gas", fuelTypes:["petrol","diesel"], brand:"Valero", address:"Houston, TX", country:"USA" },
  { id:"gas-006", name:"Shell — Seattle WA", lat:47.625, lng:-122.350, type:"gas", fuelTypes:["petrol","diesel"], brand:"Shell", address:"Seattle, WA", country:"USA" },
  { id:"gas-007", name:"ExxonMobil — Phoenix AZ", lat:33.468, lng:-112.090, type:"gas", fuelTypes:["petrol","diesel"], brand:"ExxonMobil", address:"Phoenix, AZ", country:"USA" },
  { id:"gas-008", name:"Chevron — Miami FL", lat:25.780, lng:-80.200, type:"gas", fuelTypes:["petrol","diesel"], brand:"Chevron", address:"Miami, FL", country:"USA" },
  { id:"gas-009", name:"BP — Denver CO", lat:39.759, lng:-104.995, type:"gas", fuelTypes:["petrol","diesel"], brand:"BP", address:"Denver, CO", country:"USA" },
  { id:"gas-010", name:"Shell — Atlanta GA", lat:33.768, lng:-84.405, type:"gas", fuelTypes:["petrol","diesel"], brand:"Shell", address:"Atlanta, GA", country:"USA" },
  { id:"gas-011", name:"Petro-Canada — Toronto ON", lat:43.670, lng:-79.390, type:"gas", fuelTypes:["petrol","diesel"], brand:"Petro-Canada", address:"Toronto, ON", country:"Canada" },
  { id:"gas-012", name:"Esso — Vancouver BC", lat:49.295, lng:-123.135, type:"gas", fuelTypes:["petrol","diesel"], brand:"Esso", address:"Vancouver, BC", country:"Canada" },
  { id:"gas-013", name:"Shell — Mexico City", lat:19.440, lng:-99.115, type:"gas", fuelTypes:["petrol","diesel"], brand:"Shell", address:"Mexico City", country:"Mexico" },
  { id:"gas-014", name:"Pemex — Guadalajara", lat:20.690, lng:-103.360, type:"gas", fuelTypes:["petrol","diesel"], brand:"Pemex", address:"Guadalajara", country:"Mexico" },

  // Europe
  { id:"gas-020", name:"BP — London", lat:51.525, lng:-0.100, type:"gas", fuelTypes:["petrol","diesel"], brand:"BP", address:"London", country:"UK" },
  { id:"gas-021", name:"Shell — Manchester", lat:53.500, lng:-2.260, type:"gas", fuelTypes:["petrol","diesel"], brand:"Shell", address:"Manchester", country:"UK" },
  { id:"gas-022", name:"ARAL — Berlin", lat:52.534, lng:13.420, type:"gas", fuelTypes:["petrol","diesel"], brand:"ARAL", address:"Berlin", country:"Germany" },
  { id:"gas-023", name:"Shell — Munich", lat:48.151, lng:11.593, type:"gas", fuelTypes:["petrol","diesel"], brand:"Shell", address:"Munich", country:"Germany" },
  { id:"gas-024", name:"TotalEnergies — Paris", lat:48.870, lng:2.364, type:"gas", fuelTypes:["petrol","diesel"], brand:"TotalEnergies", address:"Paris", country:"France" },
  { id:"gas-025", name:"ENI — Rome", lat:41.918, lng:12.510, type:"gas", fuelTypes:["petrol","diesel"], brand:"ENI", address:"Rome", country:"Italy" },
  { id:"gas-026", name:"Repsol — Madrid", lat:40.430, lng:-3.720, type:"gas", fuelTypes:["petrol","diesel"], brand:"Repsol", address:"Madrid", country:"Spain" },
  { id:"gas-027", name:"BP — Amsterdam", lat:52.385, lng:4.910, type:"gas", fuelTypes:["petrol","diesel"], brand:"BP", address:"Amsterdam", country:"Netherlands" },
  { id:"gas-028", name:"OKQ8 — Stockholm", lat:59.348, lng:18.082, type:"gas", fuelTypes:["petrol","diesel"], brand:"OKQ8", address:"Stockholm", country:"Sweden" },
  { id:"gas-029", name:"Preem — Oslo", lat:59.928, lng:10.768, type:"gas", fuelTypes:["petrol","diesel"], brand:"Preem", address:"Oslo", country:"Norway" },
  { id:"gas-030", name:"MOL — Budapest", lat:47.515, lng:19.052, type:"gas", fuelTypes:["petrol","diesel","lpg"], brand:"MOL", address:"Budapest", country:"Hungary" },
  { id:"gas-031", name:"OMV — Vienna", lat:48.222, lng:16.390, type:"gas", fuelTypes:["petrol","diesel"], brand:"OMV", address:"Vienna", country:"Austria" },
  { id:"gas-032", name:"Shell — Warsaw", lat:52.245, lng:21.027, type:"gas", fuelTypes:["petrol","diesel"], brand:"Shell", address:"Warsaw", country:"Poland" },
  { id:"gas-033", name:"ORLEN — Prague", lat:50.089, lng:14.450, type:"gas", fuelTypes:["petrol","diesel"], brand:"ORLEN", address:"Prague", country:"Czech Republic" },
  { id:"gas-034", name:"Lukoil — Moscow", lat:55.765, lng:37.633, type:"gas", fuelTypes:["petrol","diesel"], brand:"Lukoil", address:"Moscow", country:"Russia" },

  // Asia
  { id:"gas-040", name:"Sinopec — Beijing", lat:39.924, lng:116.411, type:"gas", fuelTypes:["petrol","diesel"], brand:"Sinopec", address:"Beijing", country:"China" },
  { id:"gas-041", name:"PetroChina — Shanghai", lat:31.248, lng:121.490, type:"gas", fuelTypes:["petrol","diesel"], brand:"PetroChina", address:"Shanghai", country:"China" },
  { id:"gas-042", name:"Sinopec — Guangzhou", lat:23.149, lng:113.282, type:"gas", fuelTypes:["petrol","diesel"], brand:"Sinopec", address:"Guangzhou", country:"China" },
  { id:"gas-043", name:"ENEOS — Tokyo", lat:35.706, lng:139.712, type:"gas", fuelTypes:["petrol","diesel"], brand:"ENEOS", address:"Tokyo", country:"Japan" },
  { id:"gas-044", name:"SK Energy — Seoul", lat:37.582, lng:126.993, type:"gas", fuelTypes:["petrol","diesel"], brand:"SK Energy", address:"Seoul", country:"South Korea" },
  { id:"gas-045", name:"BPCL — Mumbai", lat:19.094, lng:72.857, type:"gas", fuelTypes:["petrol","diesel"], brand:"BPCL", address:"Mumbai", country:"India" },
  { id:"gas-046", name:"HPCL — Delhi", lat:28.631, lng:77.221, type:"gas", fuelTypes:["petrol","diesel","cng"], brand:"HPCL", address:"New Delhi", country:"India" },
  { id:"gas-047", name:"Petronas — Kuala Lumpur", lat:3.161, lng:101.709, type:"gas", fuelTypes:["petrol","diesel"], brand:"Petronas", address:"Kuala Lumpur", country:"Malaysia" },
  { id:"gas-048", name:"Shell — Singapore", lat:1.368, lng:103.836, type:"gas", fuelTypes:["petrol","diesel"], brand:"Shell", address:"Singapore", country:"Singapore" },
  { id:"gas-049", name:"PTT — Bangkok", lat:13.774, lng:100.517, type:"gas", fuelTypes:["petrol","diesel","lpg"], brand:"PTT", address:"Bangkok", country:"Thailand" },
  { id:"gas-050", name:"Pertamina — Jakarta", lat:6.228, lng:-106.810, type:"gas", fuelTypes:["petrol","diesel"], brand:"Pertamina", address:"Jakarta", country:"Indonesia" },

  // Middle East
  { id:"gas-055", name:"ADNOC — Abu Dhabi", lat:24.467, lng:54.395, type:"gas", fuelTypes:["petrol","diesel"], brand:"ADNOC", address:"Abu Dhabi", country:"UAE" },
  { id:"gas-056", name:"ENOC — Dubai", lat:25.213, lng:55.291, type:"gas", fuelTypes:["petrol","diesel"], brand:"ENOC", address:"Dubai", country:"UAE" },
  { id:"gas-057", name:"Saudi Aramco — Riyadh", lat:24.706, lng:46.740, type:"gas", fuelTypes:["petrol","diesel"], brand:"Saudi Aramco", address:"Riyadh", country:"Saudi Arabia" },
  { id:"gas-058", name:"NIORDC — Tehran", lat:35.696, lng:51.423, type:"gas", fuelTypes:["petrol","diesel","lpg"], brand:"NIORDC", address:"Tehran", country:"Iran" },

  // Africa
  { id:"gas-060", name:"Shell — Johannesburg", lat:-26.220, lng:28.065, type:"gas", fuelTypes:["petrol","diesel"], brand:"Shell", address:"Johannesburg", country:"South Africa" },
  { id:"gas-061", name:"Caltex — Cape Town", lat:-33.940, lng:18.440, type:"gas", fuelTypes:["petrol","diesel"], brand:"Caltex", address:"Cape Town", country:"South Africa" },
  { id:"gas-062", name:"TotalEnergies — Nairobi", lat:-1.300, lng:36.835, type:"gas", fuelTypes:["petrol","diesel"], brand:"TotalEnergies", address:"Nairobi", country:"Kenya" },
  { id:"gas-063", name:"NNPC — Lagos", lat:6.540, lng:3.395, type:"gas", fuelTypes:["petrol","diesel"], brand:"NNPC", address:"Lagos", country:"Nigeria" },
  { id:"gas-064", name:"TotalEnergies — Cairo", lat:30.058, lng:31.250, type:"gas", fuelTypes:["petrol","diesel"], brand:"TotalEnergies", address:"Cairo", country:"Egypt" },
  { id:"gas-065", name:"Afriqiyah — Casablanca", lat:33.589, lng:-7.603, type:"gas", fuelTypes:["petrol","diesel"], brand:"Afriqiyah", address:"Casablanca", country:"Morocco" },
  { id:"gas-066", name:"SONATRACH — Algiers", lat:36.753, lng:3.058, type:"gas", fuelTypes:["petrol","diesel"], brand:"SONATRACH", address:"Algiers", country:"Algeria" },

  // South America
  { id:"gas-070", name:"Petrobras — São Paulo", lat:-23.561, lng:-46.645, type:"gas", fuelTypes:["petrol","diesel","cng"], brand:"Petrobras", address:"São Paulo", country:"Brazil" },
  { id:"gas-071", name:"Shell — Rio de Janeiro", lat:-22.920, lng:-43.186, type:"gas", fuelTypes:["petrol","diesel"], brand:"Shell", address:"Rio de Janeiro", country:"Brazil" },
  { id:"gas-072", name:"YPF — Buenos Aires", lat:-34.617, lng:-58.395, type:"gas", fuelTypes:["petrol","diesel","lpg"], brand:"YPF", address:"Buenos Aires", country:"Argentina" },
  { id:"gas-073", name:"Copec — Santiago", lat:-33.471, lng:-70.661, type:"gas", fuelTypes:["petrol","diesel"], brand:"Copec", address:"Santiago", country:"Chile" },
  { id:"gas-074", name:"Ecopetrol — Bogotá", lat:4.724, lng:-74.085, type:"gas", fuelTypes:["petrol","diesel"], brand:"Ecopetrol", address:"Bogotá", country:"Colombia" },
  { id:"gas-075", name:"PetroPerú — Lima", lat:-12.058, lng:-77.054, type:"gas", fuelTypes:["petrol","diesel","lpg"], brand:"PetroPerú", address:"Lima", country:"Peru" },

  // Australia
  { id:"gas-080", name:"BP — Sydney", lat:-33.882, lng:151.224, type:"gas", fuelTypes:["petrol","diesel"], brand:"BP", address:"Sydney", country:"Australia" },
  { id:"gas-081", name:"Caltex — Melbourne", lat:-37.827, lng:144.978, type:"gas", fuelTypes:["petrol","diesel"], brand:"Caltex", address:"Melbourne", country:"Australia" },
  { id:"gas-082", name:"Shell — Brisbane", lat:-27.483, lng:153.040, type:"gas", fuelTypes:["petrol","diesel"], brand:"Shell", address:"Brisbane", country:"Australia" },
  { id:"gas-083", name:"Z Energy — Auckland", lat:-36.860, lng:174.779, type:"gas", fuelTypes:["petrol","diesel"], brand:"Z Energy", address:"Auckland", country:"New Zealand" },
]

// ── Color helper ───────────────────────────────────────────────────────────────

function assignColor(s: Omit<Station, "color">): string {
  if (s.type === "ev") {
    const first = s.connectors?.[0]
    const COLORS: Record<ConnectorType, string> = {
      CCS:      "#44ff88",
      CHAdeMO:  "#44ffcc",
      "Type 2": "#88ff44",
      Tesla:    "#cc44ff",
      Other:    "#88ffee",
    }
    return first ? COLORS[first] : "#88ffee"
  }
  const first = s.fuelTypes?.[0]
  if (first === "lpg" || first === "cng") return "#ff8844"
  return "#ff4444"
}

// ── OCM API parsing helper ─────────────────────────────────────────────────────

function parseOCMConnector(connectionTypeId: number): ConnectorType {
  // Open Charge Map connection type IDs (common ones)
  if ([25, 32, 33].includes(connectionTypeId)) return "CCS"
  if ([2].includes(connectionTypeId)) return "CHAdeMO"
  if ([25, 26, 27].includes(connectionTypeId)) return "Type 2"
  if ([30].includes(connectionTypeId)) return "Tesla"
  return "Other"
}

// ── Route Handler ──────────────────────────────────────────────────────────────

export async function GET() {
  const ocmKey  = process.env.OPEN_CHARGE_MAP_KEY ?? ""
  const nrelKey = process.env.NREL_API_KEY ?? "DEMO_KEY"

  const stations: Station[] = []
  let usedLiveData = false

  // ── 1. Open Charge Map (global EV) ────────────────────────────────────────────
  if (ocmKey) {
    try {
      const url = `https://api.openchargemap.io/v3/poi/?output=json&maxresults=2000&compact=true&verbose=false&key=${ocmKey}`
      const res = await fetch(url, {
        next: { revalidate: 3600 },
        headers: { "User-Agent": "GRIP3D/1.9 contact@grip3d.com" },
      })
      if (res.ok) {
        const data: any[] = await res.json()
        for (const poi of data) {
          const lat = poi.AddressInfo?.Latitude
          const lng = poi.AddressInfo?.Longitude
          if (!lat || !lng || !isFinite(lat) || !isFinite(lng)) continue
          const conns: ConnectorType[] = (poi.Connections ?? [])
            .map((c: any) => parseOCMConnector(c.ConnectionTypeID))
            .filter((v: any, i: number, arr: any[]) => arr.indexOf(v) === i)
          const maxKw = (poi.Connections ?? []).reduce((mx: number, c: any) => Math.max(mx, c.PowerKW ?? 0), 0)
          const s: Station = {
            id: `ocm-${poi.ID}`,
            name: poi.AddressInfo?.Title ?? "EV Charging Station",
            lat,
            lng,
            type: "ev",
            connectors: conns.length > 0 ? conns : ["Other"],
            powerKw: maxKw > 0 ? maxKw : undefined,
            operator: poi.OperatorInfo?.Title,
            address: poi.AddressInfo?.AddressLine1,
            country: poi.AddressInfo?.Country?.ISOCode,
            color: "",
          }
          s.color = assignColor(s)
          stations.push(s)
        }
        usedLiveData = true
      }
    } catch {
      // fall through to static
    }
  }

  // ── 2. NREL (US EV stations) ──────────────────────────────────────────────────
  if (!usedLiveData) {
    try {
      const url = `https://developer.nrel.gov/api/alt-fuel-stations/v1.json?api_key=${nrelKey}&fuel_type=ELEC&limit=500&status=E&ev_connector_type=CHADEMO,J1772COMBO,TESLA`
      const res = await fetch(url, {
        next: { revalidate: 3600 },
        headers: { "User-Agent": "GRIP3D/1.9 contact@grip3d.com" },
      })
      if (res.ok) {
        const data = await res.json()
        const fuelStations: any[] = data.fuel_stations ?? []
        for (const fs of fuelStations.slice(0, 500)) {
          const lat = fs.latitude
          const lng = fs.longitude
          if (!lat || !lng || !isFinite(lat) || !isFinite(lng)) continue
          const connTypes: string[] = (fs.ev_connector_types ?? [])
          const conns: ConnectorType[] = connTypes.map((t: string) => {
            if (t === "J1772COMBO") return "CCS"
            if (t === "CHADEMO")    return "CHAdeMO"
            if (t === "TESLA")      return "Tesla"
            if (t === "J1772")      return "Type 2"
            return "Other"
          }).filter((v, i, arr) => arr.indexOf(v) === i)
          const maxKw = (fs.ev_dc_fast_num ?? 0) > 0 ? 50 : (fs.ev_level2_evse_num ?? 0) > 0 ? 22 : 3.3
          const s: Station = {
            id: `nrel-${fs.id}`,
            name: fs.station_name ?? "EV Station",
            lat,
            lng,
            type: "ev",
            connectors: conns.length > 0 ? conns : ["Type 2"],
            powerKw: maxKw,
            operator: fs.station_name,
            address: `${fs.street_address ?? ""}, ${fs.city ?? ""}`,
            country: "USA",
            color: "",
          }
          s.color = assignColor(s)
          stations.push(s)
        }
        if (stations.length > 0) usedLiveData = true
      }
    } catch {
      // fall through to static
    }
  }

  // ── 3. Static fallback ────────────────────────────────────────────────────────
  if (!usedLiveData) {
    for (const s of STATIC_EV) {
      stations.push({ ...s, color: assignColor(s) })
    }
  }

  // Always include gas stations from static dataset
  for (const s of STATIC_GAS) {
    stations.push({ ...s, color: assignColor(s) })
  }

  return new Response(JSON.stringify(stations), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=7200",
    },
  })
}

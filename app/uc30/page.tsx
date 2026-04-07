"use client"

import { useEffect, useRef, useState, useMemo, useCallback } from "react"

// ── Types ────────────────────────────────────────────────────────────────────

type SiteCategory = "cultural" | "natural" | "mixed"
type Region = "Europe" | "Asia" | "Africa" | "Americas" | "Oceania" | "Arab States"

interface HeritageSite {
  id: number
  name: string
  country: string
  lat: number
  lng: number
  year: number
  category: SiteCategory
  region: Region
  description: string
  criteria: string
  endangered: boolean
  imageUrl?: string
}

interface CountryFeature {
  type: string
  properties: { name: string; [k: string]: unknown }
  geometry: { type: string; coordinates: unknown[] }
}

// ── Colours ──────────────────────────────────────────────────────────────────

const CAT_COLORS: Record<SiteCategory, string> = {
  cultural: "#fbbf24",
  natural: "#10b981",
  mixed: "#8b5cf6",
}

const ENDANGERED_COLOR = "#ef4444"

// ── Heritage Sites (200+) ────────────────────────────────────────────────────

const SITES: HeritageSite[] = [
  // ── Europe ─────────────────────────────────────────────────────────────────
  { id:1, name:"Acropolis of Athens", country:"Greece", lat:37.97, lng:23.73, year:1987, category:"cultural", region:"Europe", description:"Ancient citadel on a rocky outcrop above Athens, featuring the iconic Parthenon temple dedicated to Athena.", criteria:"i,ii,iii,iv,vi", endangered:false },
  { id:2, name:"Colosseum", country:"Italy", lat:41.89, lng:12.49, year:1980, category:"cultural", region:"Europe", description:"The largest ancient amphitheatre ever built, an iconic symbol of Imperial Rome capable of holding 50,000 spectators.", criteria:"i,ii,iii,iv", endangered:false },
  { id:3, name:"Alhambra, Generalife and Albayzin", country:"Spain", lat:37.18, lng:-3.59, year:1984, category:"cultural", region:"Europe", description:"Moorish palace complex in Granada showcasing the finest Islamic architecture in Western Europe.", criteria:"i,iii,iv", endangered:false },
  { id:4, name:"Stonehenge", country:"United Kingdom", lat:51.18, lng:-1.83, year:1986, category:"cultural", region:"Europe", description:"Prehistoric stone circle monument dating to 3000-2000 BC, one of the most famous landmarks in the world.", criteria:"i,ii,iii", endangered:false },
  { id:5, name:"Tower of London", country:"United Kingdom", lat:51.51, lng:-0.08, year:1988, category:"cultural", region:"Europe", description:"Historic castle and former royal residence, now home to the Crown Jewels, founded in 1066.", criteria:"ii,iv", endangered:false },
  { id:6, name:"Mont-Saint-Michel", country:"France", lat:48.64, lng:-1.51, year:1979, category:"cultural", region:"Europe", description:"Tidal island commune with medieval abbey rising dramatically from the sea in Normandy.", criteria:"i,iii,vi", endangered:false },
  { id:7, name:"Historic Centre of Prague", country:"Czech Republic", lat:50.09, lng:14.42, year:1992, category:"cultural", region:"Europe", description:"Medieval heart of Bohemia with Gothic, Romanesque, and Baroque masterpieces spanning 1,100 years.", criteria:"ii,iv,vi", endangered:false },
  { id:8, name:"Venice and its Lagoon", country:"Italy", lat:45.44, lng:12.34, year:1987, category:"cultural", region:"Europe", description:"Unique city built on 118 islands linked by 400 bridges, a masterpiece of creative genius.", criteria:"i,ii,iii,iv,v,vi", endangered:false },
  { id:9, name:"Old City of Dubrovnik", country:"Croatia", lat:42.64, lng:18.11, year:1979, category:"cultural", region:"Europe", description:"Pearl of the Adriatic — a beautifully preserved medieval walled city on the Dalmatian coast.", criteria:"i,iii,iv", endangered:false },
  { id:10, name:"Historic Areas of Istanbul", country:"Turkey", lat:41.01, lng:28.98, year:1985, category:"cultural", region:"Europe", description:"Strategic peninsula featuring the Hagia Sophia, Blue Mosque, and Topkapi Palace — crossroads of civilizations.", criteria:"i,ii,iii,iv", endangered:false },
  { id:11, name:"Works of Antoni Gaudi — Barcelona", country:"Spain", lat:41.40, lng:2.17, year:1984, category:"cultural", region:"Europe", description:"Seven buildings by Antoni Gaudi including the Sagrada Familia, representing outstanding creative genius in architecture.", criteria:"i,ii,iv", endangered:false },
  { id:12, name:"Palace and Park of Versailles", country:"France", lat:48.80, lng:2.12, year:1979, category:"cultural", region:"Europe", description:"The epitome of French royal grandeur, with 700 rooms, spectacular gardens, and the Hall of Mirrors.", criteria:"i,ii,vi", endangered:false },
  { id:13, name:"Auschwitz-Birkenau", country:"Poland", lat:50.03, lng:19.18, year:1979, category:"cultural", region:"Europe", description:"Nazi German concentration and extermination camp — a symbol of humanity's cruelty and a place of memory.", criteria:"vi", endangered:false },
  { id:14, name:"Archaeological Areas of Pompeii", country:"Italy", lat:40.75, lng:14.49, year:1997, category:"cultural", region:"Europe", description:"Roman city frozen in time by the eruption of Vesuvius in AD 79, offering unparalleled insight into ancient daily life.", criteria:"iii,iv,v", endangered:false },
  { id:15, name:"Old and New Towns of Edinburgh", country:"United Kingdom", lat:55.95, lng:-3.19, year:1995, category:"cultural", region:"Europe", description:"Scotland's capital combining medieval Old Town and neoclassical New Town in a striking townscape.", criteria:"ii,iv", endangered:false },
  { id:16, name:"Historic Centre of Florence", country:"Italy", lat:43.77, lng:11.25, year:1982, category:"cultural", region:"Europe", description:"Birthplace of the Renaissance, with the Duomo, Uffizi, and masterworks by Michelangelo and Botticelli.", criteria:"i,ii,iii,iv,vi", endangered:false },
  { id:17, name:"Historic Centre of Bruges", country:"Belgium", lat:51.21, lng:3.23, year:2000, category:"cultural", region:"Europe", description:"Medieval trading city with remarkably well-preserved canals, cobblestones, and Gothic architecture.", criteria:"ii,iv,vi", endangered:false },
  { id:18, name:"Budapest — Banks of the Danube", country:"Hungary", lat:47.50, lng:19.04, year:1987, category:"cultural", region:"Europe", description:"Panoramic riverscape featuring Buda Castle, the Parliament, and thermal bath culture spanning Roman times.", criteria:"ii,iv", endangered:false },
  { id:19, name:"Historic Centre of Krakow", country:"Poland", lat:50.06, lng:19.94, year:1978, category:"cultural", region:"Europe", description:"One of Europe's oldest and best-preserved medieval cities, with the stunning Wawel Castle complex.", criteria:"iv", endangered:false },
  { id:20, name:"Cinque Terre", country:"Italy", lat:44.13, lng:9.71, year:1997, category:"cultural", region:"Europe", description:"Five colourful fishing villages clinging to dramatic cliffs along the Ligurian coast.", criteria:"ii,iv,v", endangered:false },
  { id:21, name:"Meteora", country:"Greece", lat:39.72, lng:21.63, year:1988, category:"mixed", region:"Europe", description:"Eastern Orthodox monasteries perched atop immense natural sandstone rock pillars in central Greece.", criteria:"i,ii,iv,v,vii", endangered:false },
  { id:22, name:"Archaeological Site of Delphi", country:"Greece", lat:38.48, lng:22.50, year:1987, category:"cultural", region:"Europe", description:"Home of the famous Oracle, considered the centre of the world in ancient Greek religion and mythology.", criteria:"i,ii,iii,iv,vi", endangered:false },
  { id:23, name:"Archaeological Site of Olympia", country:"Greece", lat:37.64, lng:21.63, year:1989, category:"cultural", region:"Europe", description:"Birthplace of the Olympic Games in 776 BC, with ruins of athletic training and religious facilities.", criteria:"i,ii,iii,iv,vi", endangered:false },
  { id:24, name:"Plitvice Lakes National Park", country:"Croatia", lat:44.88, lng:15.62, year:1979, category:"natural", region:"Europe", description:"16 terraced turquoise lakes connected by waterfalls, set in a lush forested karst landscape.", criteria:"vii,viii,ix", endangered:false },
  { id:25, name:"Castles of Augustusburg — Falkenlust", country:"Germany", lat:50.83, lng:6.91, year:1984, category:"cultural", region:"Europe", description:"Outstanding example of early Rococo architecture and garden design in the Rhineland.", criteria:"ii,iv", endangered:false },
  { id:26, name:"Swiss Alps Jungfrau-Aletsch", country:"Switzerland", lat:46.54, lng:7.96, year:2001, category:"natural", region:"Europe", description:"Europe's largest glaciated area in the Alps, showcasing spectacular Alpine geology and ecosystems.", criteria:"vii,viii,ix", endangered:false },
  { id:27, name:"Delos", country:"Greece", lat:37.39, lng:25.27, year:1990, category:"cultural", region:"Europe", description:"Birthplace of Apollo, a sacred island with exceptionally rich archaeological remains in the Cyclades.", criteria:"ii,iii,iv,vi", endangered:false },
  { id:28, name:"Historic Centre of Vienna", country:"Austria", lat:48.21, lng:16.37, year:2001, category:"cultural", region:"Europe", description:"Imperial capital with Baroque architecture, musical heritage from Mozart to Strauss, and grand ring road.", criteria:"ii,iv,vi", endangered:true },
  { id:29, name:"Seventeenth-Century Canal Ring of Amsterdam", country:"Netherlands", lat:52.37, lng:4.90, year:2010, category:"cultural", region:"Europe", description:"Concentric canal system from the Dutch Golden Age — an urban planning masterpiece.", criteria:"i,ii,iv", endangered:false },
  { id:30, name:"Cultural Landscape of Sintra", country:"Portugal", lat:38.79, lng:-9.39, year:1995, category:"cultural", region:"Europe", description:"Romantic palaces and gardens nestled in the forested hills near Lisbon, blending architecture with nature.", criteria:"ii,iv,v", endangered:false },
  { id:31, name:"Rila Monastery", country:"Bulgaria", lat:42.13, lng:23.34, year:1983, category:"cultural", region:"Europe", description:"Largest Eastern Orthodox monastery in Bulgaria, a Renaissance masterpiece with vivid frescoes.", criteria:"vi", endangered:false },
  { id:32, name:"Giant's Causeway", country:"United Kingdom", lat:55.23, lng:-6.51, year:1986, category:"natural", region:"Europe", description:"40,000 interlocking basalt columns formed by volcanic eruption 60 million years ago on the Northern Irish coast.", criteria:"vii,viii", endangered:false },
  { id:33, name:"Skellig Michael", country:"Ireland", lat:51.77, lng:-10.54, year:1996, category:"cultural", region:"Europe", description:"Remote island monastery off southwest Ireland, occupied by Celtic monks from the 6th to 12th century.", criteria:"iii,iv", endangered:false },
  { id:34, name:"Wachau Cultural Landscape", country:"Austria", lat:48.37, lng:15.42, year:2000, category:"cultural", region:"Europe", description:"Stunning Danube valley with terraced vineyards, medieval castles, and Baroque churches.", criteria:"ii,iv", endangered:false },
  { id:35, name:"Historic Centre of San Gimignano", country:"Italy", lat:43.47, lng:11.04, year:1990, category:"cultural", region:"Europe", description:"Tuscan hill town famous for its medieval tower houses, a unique testament to wealth and power.", criteria:"i,iii,iv", endangered:false },
  { id:36, name:"Chartres Cathedral", country:"France", lat:48.45, lng:1.49, year:1979, category:"cultural", region:"Europe", description:"Masterpiece of French Gothic architecture with the finest collection of medieval stained glass.", criteria:"i,ii,iv", endangered:false },
  { id:37, name:"Canterbury Cathedral", country:"United Kingdom", lat:51.28, lng:1.08, year:1988, category:"cultural", region:"Europe", description:"Seat of the Archbishop of Canterbury and mother church of the Anglican Communion since AD 597.", criteria:"i,ii,vi", endangered:false },
  { id:38, name:"Amalfi Coast", country:"Italy", lat:40.63, lng:14.60, year:1997, category:"cultural", region:"Europe", description:"Dramatic Mediterranean coastline with cliffside villages, terraced vineyards, and maritime history.", criteria:"ii,iv,v", endangered:false },
  { id:39, name:"Valletta", country:"Malta", lat:35.90, lng:14.51, year:1980, category:"cultural", region:"Europe", description:"Fortress city built by the Knights of St John, a concentrated monument of the Baroque period.", criteria:"i,vi", endangered:false },
  { id:40, name:"Roman Monuments of Trier", country:"Germany", lat:49.76, lng:6.64, year:1986, category:"cultural", region:"Europe", description:"Germany's oldest city with outstanding Roman-era remains including the Porta Nigra gate.", criteria:"i,iii,iv,vi", endangered:false },
  { id:41, name:"Cologne Cathedral", country:"Germany", lat:50.94, lng:6.96, year:1996, category:"cultural", region:"Europe", description:"Masterpiece of Gothic architecture that took 600 years to complete, the tallest twin-spired church in the world.", criteria:"i,ii,iv", endangered:false },
  { id:42, name:"Historic Centre of Rome", country:"Italy", lat:41.90, lng:12.50, year:1980, category:"cultural", region:"Europe", description:"The Eternal City — seat of the Roman Empire and the Vatican, with monuments spanning three millennia.", criteria:"i,ii,iii,iv,vi", endangered:false },
  { id:43, name:"Sceilg Mhichil / Skellig Islands", country:"Ireland", lat:51.77, lng:-10.53, year:1996, category:"cultural", region:"Europe", description:"Twin rocky islands off Ireland's Atlantic coast, site of a remarkably preserved monastic settlement.", criteria:"iii,iv", endangered:false },
  { id:44, name:"Palace of Westminster", country:"United Kingdom", lat:51.50, lng:-0.12, year:1987, category:"cultural", region:"Europe", description:"Seat of the UK Parliament, featuring Big Ben and the Gothic Revival architecture of Charles Barry.", criteria:"i,ii,iv", endangered:false },
  { id:45, name:"Mount Etna", country:"Italy", lat:37.75, lng:14.99, year:2013, category:"natural", region:"Europe", description:"Europe's tallest and most active volcano, with a documented eruption history spanning 2,700 years.", criteria:"viii", endangered:false },
  { id:46, name:"Old Town of Segovia", country:"Spain", lat:40.95, lng:-4.12, year:1985, category:"cultural", region:"Europe", description:"Roman aqueduct, Alcazar castle, and Gothic cathedral — 2,000 years of history on a rocky promontory.", criteria:"i,iii,iv", endangered:false },
  { id:47, name:"Historic Centre of Tallinn", country:"Estonia", lat:59.44, lng:24.75, year:1997, category:"cultural", region:"Europe", description:"Remarkably well-preserved medieval Hanseatic town with cobbled streets and merchant houses.", criteria:"ii,iv", endangered:false },
  { id:48, name:"Douro Valley", country:"Portugal", lat:41.16, lng:-7.79, year:2001, category:"cultural", region:"Europe", description:"Terraced vineyards along the Douro River producing port wine for over 2,000 years.", criteria:"iii,iv,v", endangered:false },
  { id:49, name:"Historic City of Toledo", country:"Spain", lat:39.86, lng:-4.02, year:1986, category:"cultural", region:"Europe", description:"City of Three Cultures — a medieval melting pot of Christian, Muslim, and Jewish heritage on a hilltop.", criteria:"i,ii,iii,iv", endangered:false },
  { id:50, name:"Kremlin and Red Square", country:"Russia", lat:55.75, lng:37.62, year:1990, category:"cultural", region:"Europe", description:"Fortified heart of Moscow — seat of Russian power since the 13th century with iconic onion domes.", criteria:"i,ii,iv,vi", endangered:false },
  { id:51, name:"Historic Centre of Saint Petersburg", country:"Russia", lat:59.93, lng:30.32, year:1990, category:"cultural", region:"Europe", description:"Venice of the North — Peter the Great's window to Europe, with the Hermitage and grand canals.", criteria:"i,ii,iv,vi", endangered:false },

  // ── Asia ────────────────────────────────────────────────────────────────────
  { id:60, name:"Great Wall of China", country:"China", lat:40.43, lng:116.57, year:1987, category:"cultural", region:"Asia", description:"Greatest military defence project in history, stretching over 20,000 km across northern China.", criteria:"i,ii,iii,iv,vi", endangered:false },
  { id:61, name:"Taj Mahal", country:"India", lat:27.17, lng:78.04, year:1983, category:"cultural", region:"Asia", description:"White marble mausoleum built by Mughal emperor Shah Jahan — the jewel of Islamic art in India.", criteria:"i", endangered:false },
  { id:62, name:"Angkor", country:"Cambodia", lat:13.41, lng:103.87, year:1992, category:"cultural", region:"Asia", description:"Vast temple complex of the Khmer Empire, including Angkor Wat — the world's largest religious monument.", criteria:"i,ii,iii,iv", endangered:false },
  { id:63, name:"Imperial Palaces of the Ming and Qing Dynasties", country:"China", lat:39.92, lng:116.39, year:1987, category:"cultural", region:"Asia", description:"The Forbidden City — home to 24 emperors, with 9,999 rooms in the world's largest palace complex.", criteria:"iii,iv", endangered:false },
  { id:64, name:"Mausoleum of the First Qin Emperor", country:"China", lat:34.38, lng:109.27, year:1987, category:"cultural", region:"Asia", description:"Terracotta Army of 8,000 life-sized warriors guarding the tomb of China's first emperor.", criteria:"i,iii,iv,vi", endangered:false },
  { id:65, name:"Petra", country:"Jordan", lat:30.33, lng:35.44, year:1985, category:"cultural", region:"Asia", description:"Rose-red Nabataean city carved into sandstone cliffs, a marvel of ancient engineering and artistry.", criteria:"i,iii,iv", endangered:false },
  { id:66, name:"Borobudur Temple Compounds", country:"Indonesia", lat:-7.61, lng:110.20, year:1991, category:"cultural", region:"Asia", description:"World's largest Buddhist temple, with 2,672 relief panels and 504 Buddha statues on a stepped pyramid.", criteria:"i,ii,vi", endangered:false },
  { id:67, name:"Ha Long Bay", country:"Vietnam", lat:20.91, lng:107.18, year:1994, category:"natural", region:"Asia", description:"1,600 limestone islands and islets rising from emerald waters in the Gulf of Tonkin.", criteria:"vii,viii", endangered:false },
  { id:68, name:"Historic Monuments of Ancient Kyoto", country:"Japan", lat:35.01, lng:135.77, year:1994, category:"cultural", region:"Asia", description:"17 temples, shrines, and gardens representing 1,000 years of Japanese cultural development.", criteria:"ii,iv", endangered:false },
  { id:69, name:"Ancient City of Sigiriya", country:"Sri Lanka", lat:7.96, lng:80.76, year:1982, category:"cultural", region:"Asia", description:"5th-century rock fortress rising 200m with frescoes, mirror wall, and the famous Lion Gate.", criteria:"ii,iii,iv", endangered:false },
  { id:70, name:"Bagan", country:"Myanmar", lat:21.17, lng:94.86, year:2019, category:"cultural", region:"Asia", description:"Sacred landscape with over 3,500 Buddhist monuments dating from the 11th to 13th centuries.", criteria:"iii,iv,vi", endangered:false },
  { id:71, name:"Group of Monuments at Hampi", country:"India", lat:15.33, lng:76.46, year:1986, category:"cultural", region:"Asia", description:"Ruins of the Vijayanagara Empire capital, with stunning Dravidian temples and royal enclosures.", criteria:"i,iii,iv", endangered:true },
  { id:72, name:"Khajuraho Group of Monuments", country:"India", lat:24.85, lng:79.92, year:1986, category:"cultural", region:"Asia", description:"Hindu and Jain temples renowned for their nagara-style architecture and elaborate erotic sculptures.", criteria:"i,iii", endangered:false },
  { id:73, name:"Town of Luang Prabang", country:"Laos", lat:19.89, lng:102.13, year:1995, category:"cultural", region:"Asia", description:"Enchanting blend of Lao traditional architecture and colonial-era buildings at the Mekong confluence.", criteria:"ii,iv,v", endangered:false },
  { id:74, name:"Historic City of Ayutthaya", country:"Thailand", lat:14.36, lng:100.56, year:1991, category:"cultural", region:"Asia", description:"Ruins of the second Siamese capital, founded in 1350, once one of the world's largest cities.", criteria:"iii", endangered:false },
  { id:75, name:"Himeji-jo", country:"Japan", lat:34.84, lng:134.69, year:1993, category:"cultural", region:"Asia", description:"The finest surviving example of Japanese castle architecture — the 'White Heron Castle'.", criteria:"i,iv", endangered:false },
  { id:76, name:"Fujisan — Sacred Place and Source of Artistic Inspiration", country:"Japan", lat:35.36, lng:138.73, year:2013, category:"cultural", region:"Asia", description:"Japan's highest peak and most iconic symbol, inspiring art and pilgrimages for centuries.", criteria:"iii,vi", endangered:false },
  { id:77, name:"Jiuzhaigou Valley", country:"China", lat:33.26, lng:103.92, year:1992, category:"natural", region:"Asia", description:"Fairy-tale landscape of colourful lakes, waterfalls, and snow-capped peaks in Sichuan.", criteria:"vii", endangered:false },
  { id:78, name:"Persepolis", country:"Iran", lat:29.93, lng:52.89, year:1979, category:"cultural", region:"Asia", description:"Ceremonial capital of the Achaemenid Empire, with monumental staircases and palace remains.", criteria:"i,iii,vi", endangered:false },
  { id:79, name:"Samarkand — Crossroad of Cultures", country:"Uzbekistan", lat:39.65, lng:66.96, year:2001, category:"cultural", region:"Asia", description:"Jewel of the Silk Road with the stunning Registan Square and Timurid-era Islamic architecture.", criteria:"i,ii,iv", endangered:false },
  { id:80, name:"Ellora Caves", country:"India", lat:20.03, lng:75.18, year:1983, category:"cultural", region:"Asia", description:"34 rock-cut caves representing Buddhist, Hindu, and Jain faiths — including the monolithic Kailasa temple.", criteria:"i,iii,vi", endangered:false },
  { id:81, name:"Komodo National Park", country:"Indonesia", lat:-8.55, lng:119.45, year:1991, category:"natural", region:"Asia", description:"Home to the Komodo dragon — the world's largest living lizard — on volcanic islands with rich marine life.", criteria:"vii,x", endangered:false },
  { id:82, name:"Jeju Volcanic Island and Lava Tubes", country:"South Korea", lat:33.36, lng:126.53, year:2007, category:"natural", region:"Asia", description:"Dramatic volcanic landscape with lava tubes, crater lake, and unique biodiversity on Korea's largest island.", criteria:"vii,viii", endangered:false },
  { id:83, name:"Cultural Landscape of Bali", country:"Indonesia", lat:-8.42, lng:115.37, year:2012, category:"cultural", region:"Asia", description:"Subak rice terrace system reflecting the Balinese philosophical concept of Tri Hita Karana.", criteria:"ii,iii,v,vi", endangered:false },
  { id:84, name:"Gobekli Tepe", country:"Turkey", lat:37.22, lng:38.92, year:2018, category:"cultural", region:"Asia", description:"World's oldest known monumental architecture — 11,600-year-old megalithic structures predating Stonehenge by 6,000 years.", criteria:"i,ii,iv", endangered:false },
  { id:85, name:"Goreme National Park and Rock Sites of Cappadocia", country:"Turkey", lat:38.64, lng:34.83, year:1985, category:"mixed", region:"Asia", description:"Fairy-chimney landscape with Byzantine cave churches featuring stunning frescoes.", criteria:"i,iii,v,vii", endangered:false },
  { id:86, name:"Ephesus", country:"Turkey", lat:37.94, lng:27.34, year:2015, category:"cultural", region:"Asia", description:"Magnificent Greco-Roman city with the Library of Celsus — once home to 250,000 people.", criteria:"iii,iv,vi", endangered:false },
  { id:87, name:"Historic Centre of Bukhara", country:"Uzbekistan", lat:39.77, lng:64.42, year:1993, category:"cultural", region:"Asia", description:"One of the best-preserved medieval cities of the Silk Road, with over 140 monuments.", criteria:"ii,iv,vi", endangered:false },
  { id:88, name:"Prambanan Temple Compounds", country:"Indonesia", lat:-7.75, lng:110.49, year:1991, category:"cultural", region:"Asia", description:"Largest Hindu temple in Southeast Asia, with 240 temples dedicated to Shiva, Vishnu, and Brahma.", criteria:"i,iv", endangered:false },
  { id:89, name:"Old City of Jerusalem", country:"Israel", lat:31.78, lng:35.23, year:1981, category:"cultural", region:"Asia", description:"Sacred city to three religions — home to the Western Wall, Church of the Holy Sepulchre, and Dome of the Rock.", criteria:"ii,iii,vi", endangered:true },
  { id:90, name:"Mogao Caves", country:"China", lat:40.04, lng:94.81, year:1987, category:"cultural", region:"Asia", description:"492 caves with 1,000 years of Buddhist art — 45,000 sq m of murals and 2,000 painted sculptures.", criteria:"i,ii,iii,iv,v,vi", endangered:false },
  { id:91, name:"Mount Huangshan", country:"China", lat:30.13, lng:118.17, year:1990, category:"mixed", region:"Asia", description:"Granite peaks, hot springs, and ancient pine trees — the landscape that inspired Chinese painting.", criteria:"ii,vii,x", endangered:false },
  { id:92, name:"Sukhothai Historical Park", country:"Thailand", lat:17.02, lng:99.70, year:1991, category:"cultural", region:"Asia", description:"First capital of Siam, with ruins of 26 temples and the royal palace of the 13th-century kingdom.", criteria:"i,iii", endangered:false },
  { id:93, name:"Rice Terraces of the Philippine Cordilleras", country:"Philippines", lat:16.92, lng:121.06, year:1995, category:"cultural", region:"Asia", description:"2,000-year-old rice terraces carved into mountain slopes, often called the 'Eighth Wonder of the World'.", criteria:"iii,iv,v", endangered:true },

  // ── Americas ───────────────────────────────────────────────────────────────
  { id:100, name:"Historic Sanctuary of Machu Picchu", country:"Peru", lat:-13.16, lng:-72.55, year:1983, category:"mixed", region:"Americas", description:"Inca citadel set high in the Andes, a masterpiece of architecture and engineering.", criteria:"i,iii,vii,ix", endangered:false },
  { id:101, name:"Pre-Hispanic City of Chichen-Itza", country:"Mexico", lat:20.68, lng:-88.57, year:1988, category:"cultural", region:"Americas", description:"Maya-Toltec city with the iconic El Castillo pyramid, one of the New Seven Wonders of the World.", criteria:"i,ii,iii", endangered:false },
  { id:102, name:"Statue of Liberty", country:"United States", lat:40.69, lng:-74.04, year:1984, category:"cultural", region:"Americas", description:"Colossal neoclassical sculpture gifted by France, a universal symbol of freedom and democracy.", criteria:"i,vi", endangered:false },
  { id:103, name:"Grand Canyon National Park", country:"United States", lat:36.11, lng:-112.11, year:1979, category:"natural", region:"Americas", description:"1.8-billion-year geological history exposed in layered red rock, carved by the Colorado River.", criteria:"vii,viii,ix,x", endangered:false },
  { id:104, name:"Yellowstone National Park", country:"United States", lat:44.46, lng:-110.83, year:1978, category:"natural", region:"Americas", description:"World's first national park — geothermal wonders, geysers, and rich wildlife across volcanic terrain.", criteria:"vii,viii,ix,x", endangered:false },
  { id:105, name:"Galapagos Islands", country:"Ecuador", lat:-0.95, lng:-90.97, year:1978, category:"natural", region:"Americas", description:"Volcanic archipelago with unique wildlife that inspired Darwin's theory of evolution.", criteria:"vii,viii,ix,x", endangered:true },
  { id:106, name:"Rapa Nui National Park", country:"Chile", lat:-27.11, lng:-109.35, year:1995, category:"cultural", region:"Americas", description:"Easter Island's mysterious moai statues — nearly 900 monolithic human figures carved by Polynesian settlers.", criteria:"i,iii,v", endangered:false },
  { id:107, name:"Iguazu National Park", country:"Argentina", lat:-25.69, lng:-54.44, year:1984, category:"natural", region:"Americas", description:"275 waterfalls spanning nearly 3 km — one of the most spectacular natural wonders on Earth.", criteria:"vii,x", endangered:false },
  { id:108, name:"Pre-Hispanic City of Teotihuacan", country:"Mexico", lat:19.69, lng:-98.84, year:1987, category:"cultural", region:"Americas", description:"City of the Gods — with the Pyramids of the Sun and Moon, once Mesoamerica's largest city.", criteria:"i,ii,iii,iv,vi", endangered:false },
  { id:109, name:"Tikal National Park", country:"Guatemala", lat:17.22, lng:-89.62, year:1979, category:"mixed", region:"Americas", description:"Maya city in the jungle with towering temple-pyramids rising above the canopy.", criteria:"i,iii,iv,ix,x", endangered:false },
  { id:110, name:"City of Cuzco", country:"Peru", lat:-13.52, lng:-71.97, year:1983, category:"cultural", region:"Americas", description:"Former capital of the Inca Empire, blending Inca stonework with Spanish colonial architecture.", criteria:"iii,iv", endangered:false },
  { id:111, name:"Port, Fortresses and Group of Monuments, Cartagena", country:"Colombia", lat:10.39, lng:-75.51, year:1984, category:"cultural", region:"Americas", description:"Finest fortified colonial-era port city in the Caribbean, with colourful streets and massive walls.", criteria:"iv,vi", endangered:false },
  { id:112, name:"Old Havana and its Fortification System", country:"Cuba", lat:23.14, lng:-82.36, year:1982, category:"cultural", region:"Americas", description:"Colonial Baroque and neoclassical architecture frozen in time behind centuries-old harbour fortifications.", criteria:"iv,v", endangered:false },
  { id:113, name:"Historic District of Old Quebec", country:"Canada", lat:46.81, lng:-71.21, year:1985, category:"cultural", region:"Americas", description:"Only walled city in North America north of Mexico, with a dramatic clifftop setting.", criteria:"iv,vi", endangered:false },
  { id:114, name:"Mesa Verde National Park", country:"United States", lat:37.18, lng:-108.49, year:1978, category:"cultural", region:"Americas", description:"Ancestral Puebloan cliff dwellings carved into sandstone alcoves, occupied from AD 600-1300.", criteria:"iii", endangered:false },
  { id:115, name:"Lines and Geoglyphs of Nasca", country:"Peru", lat:-14.74, lng:-75.13, year:1994, category:"cultural", region:"Americas", description:"Enormous desert drawings of animals and geometric shapes visible only from the air, created 500 BC-AD 500.", criteria:"i,iii,iv", endangered:false },
  { id:116, name:"Brasilia", country:"Brazil", lat:-15.80, lng:-47.88, year:1987, category:"cultural", region:"Americas", description:"Modernist capital city designed by Lucio Costa and Oscar Niemeyer, built in just 41 months.", criteria:"i,iv", endangered:false },
  { id:117, name:"Historic Quarter of Colonia del Sacramento", country:"Uruguay", lat:-34.47, lng:-57.84, year:1995, category:"cultural", region:"Americas", description:"Portuguese colonial town on the River Plate, a testament to the struggle between Spain and Portugal.", criteria:"iv", endangered:false },
  { id:118, name:"Pre-Hispanic Town of Uxmal", country:"Mexico", lat:20.36, lng:-89.77, year:1996, category:"cultural", region:"Americas", description:"Outstanding example of late Maya architecture in the Puuc style, with the iconic Pyramid of the Magician.", criteria:"i,ii,iii", endangered:false },
  { id:119, name:"Cahokia Mounds", country:"United States", lat:38.66, lng:-90.06, year:1982, category:"cultural", region:"Americas", description:"Largest pre-Columbian settlement north of Mexico, with massive earthen mounds dating to AD 700-1400.", criteria:"iii,iv", endangered:false },
  { id:120, name:"Yosemite National Park", country:"United States", lat:37.87, lng:-119.54, year:1984, category:"natural", region:"Americas", description:"Iconic granite cliffs, giant sequoias, and cascading waterfalls in California's Sierra Nevada.", criteria:"vii,viii", endangered:false },
  { id:121, name:"Great Smoky Mountains National Park", country:"United States", lat:35.61, lng:-83.43, year:1983, category:"natural", region:"Americas", description:"Most-visited US national park, with ancient mountains and outstanding biological diversity.", criteria:"vii,viii,ix,x", endangered:false },
  { id:122, name:"Everglades National Park", country:"United States", lat:25.29, lng:-80.93, year:1979, category:"natural", region:"Americas", description:"Largest subtropical wilderness in the US — mangroves, sawgrass prairies, and 36 threatened species.", criteria:"viii,ix,x", endangered:true },
  { id:123, name:"Redwood National and State Parks", country:"United States", lat:41.21, lng:-124.00, year:1980, category:"natural", region:"Americas", description:"Home to the tallest trees on Earth — coast redwoods reaching 115 metres in ancient temperate rainforest.", criteria:"vii,ix", endangered:false },
  { id:124, name:"Hawaii Volcanoes National Park", country:"United States", lat:19.43, lng:-155.29, year:1987, category:"natural", region:"Americas", description:"Two of the world's most active volcanoes — Kilauea and Mauna Loa — creating new land continuously.", criteria:"viii", endangered:false },
  { id:125, name:"Historic Centre of Salvador de Bahia", country:"Brazil", lat:-12.97, lng:-38.51, year:1985, category:"cultural", region:"Americas", description:"First colonial capital of Brazil with outstanding Afro-Brazilian cultural heritage and Baroque churches.", criteria:"iv,vi", endangered:false },
  { id:126, name:"Canadian Rocky Mountain Parks", country:"Canada", lat:51.42, lng:-116.18, year:1984, category:"natural", region:"Americas", description:"Stunning mountain wilderness with the Burgess Shale fossil beds, turquoise lakes, and glaciers.", criteria:"vii,viii", endangered:false },
  { id:127, name:"Historic Centre of Lima", country:"Peru", lat:-12.05, lng:-77.03, year:1988, category:"cultural", region:"Americas", description:"City of Kings founded by Pizarro in 1535, with impressive colonial convents and churches.", criteria:"iv", endangered:false },

  // ── Africa ─────────────────────────────────────────────────────────────────
  { id:140, name:"Memphis and its Necropolis — Pyramid Fields from Giza to Dahshur", country:"Egypt", lat:29.98, lng:31.13, year:1979, category:"cultural", region:"Africa", description:"The Great Pyramids of Giza and the Sphinx — the only surviving Ancient Wonder and Egypt's iconic symbols.", criteria:"i,iii,vi", endangered:false },
  { id:141, name:"Mosi-oa-Tunya / Victoria Falls", country:"Zambia/Zimbabwe", lat:-17.92, lng:25.86, year:1989, category:"natural", region:"Africa", description:"The world's largest curtain of falling water — 1,708m wide and 108m tall on the Zambezi River.", criteria:"vii,viii", endangered:false },
  { id:142, name:"Serengeti National Park", country:"Tanzania", lat:-2.33, lng:34.83, year:1981, category:"natural", region:"Africa", description:"Vast savanna ecosystem hosting the Great Migration — over 1.5 million wildebeest and 250,000 zebra.", criteria:"vii,x", endangered:false },
  { id:143, name:"Kilimanjaro National Park", country:"Tanzania", lat:-3.07, lng:37.35, year:1987, category:"natural", region:"Africa", description:"Africa's highest peak at 5,895m — a free-standing volcanic mountain with five distinct climate zones.", criteria:"vii", endangered:false },
  { id:144, name:"Robben Island", country:"South Africa", lat:-33.81, lng:18.37, year:1999, category:"cultural", region:"Africa", description:"Prison island where Nelson Mandela was held for 18 years — a powerful symbol of the triumph of democracy.", criteria:"iii,vi", endangered:false },
  { id:145, name:"Medina of Fez", country:"Morocco", lat:34.07, lng:-4.97, year:1981, category:"cultural", region:"Africa", description:"World's largest car-free urban zone with 9,400 alleyways — a living medieval city and cultural center.", criteria:"ii,v", endangered:false },
  { id:146, name:"Rock-Hewn Churches of Lalibela", country:"Ethiopia", lat:12.03, lng:39.04, year:1978, category:"cultural", region:"Africa", description:"11 medieval monolithic churches carved from solid rock — often called the 'New Jerusalem'.", criteria:"i,ii,iii", endangered:false },
  { id:147, name:"Old Towns of Djenne", country:"Mali", lat:13.91, lng:-4.56, year:1988, category:"cultural", region:"Africa", description:"Home to the world's largest mud-brick building — the Great Mosque — in a pre-Saharan trading city.", criteria:"iii,iv", endangered:true },
  { id:148, name:"Timbuktu", country:"Mali", lat:16.77, lng:-3.01, year:1988, category:"cultural", region:"Africa", description:"Fabled city of gold and learning at the edge of the Sahara, with three great mosques and ancient libraries.", criteria:"ii,iv,v", endangered:true },
  { id:149, name:"Stone Town of Zanzibar", country:"Tanzania", lat:-6.16, lng:39.19, year:2000, category:"cultural", region:"Africa", description:"Coral stone trading town blending Swahili, Arab, Persian, Indian, and European influences.", criteria:"ii,iii,vi", endangered:false },
  { id:150, name:"Archaeological Site of Volubilis", country:"Morocco", lat:34.07, lng:-5.55, year:1997, category:"cultural", region:"Africa", description:"Best-preserved Roman ruins in North Africa, with outstanding mosaics and monumental arches.", criteria:"ii,iii,iv,vi", endangered:false },
  { id:151, name:"Abu Simbel to Philae — Nubian Monuments", country:"Egypt", lat:22.34, lng:31.63, year:1979, category:"cultural", region:"Africa", description:"Colossal rock-cut temples of Rameses II, famously relocated to save them from Lake Nasser's rising waters.", criteria:"i,iii,vi", endangered:false },
  { id:152, name:"Ancient Thebes with its Necropolis", country:"Egypt", lat:25.74, lng:32.60, year:1979, category:"cultural", region:"Africa", description:"Valley of the Kings, Karnak, and Luxor temples — the great capital of the Egyptian New Kingdom.", criteria:"i,iii,vi", endangered:false },
  { id:153, name:"Ngorongoro Conservation Area", country:"Tanzania", lat:-3.17, lng:35.59, year:1979, category:"mixed", region:"Africa", description:"Vast volcanic caldera sheltering 25,000 large animals and Olduvai Gorge, cradle of humankind.", criteria:"iv,vii,viii,ix,x", endangered:false },
  { id:154, name:"Okavango Delta", country:"Botswana", lat:-19.29, lng:22.69, year:2014, category:"natural", region:"Africa", description:"World's largest inland delta — a lush oasis in the Kalahari supporting extraordinary wildlife.", criteria:"vii,ix,x", endangered:false },
  { id:155, name:"Mount Kenya National Park", country:"Kenya", lat:-0.15, lng:37.31, year:1997, category:"natural", region:"Africa", description:"Africa's second-highest peak with equatorial glaciers, alpine meadows, and montane forest.", criteria:"vii,ix", endangered:false },
  { id:156, name:"Virunga National Park", country:"Democratic Republic of the Congo", lat:-1.47, lng:29.22, year:1979, category:"natural", region:"Africa", description:"Africa's oldest national park — home to mountain gorillas, active volcanoes, and extraordinary biodiversity.", criteria:"vii,viii,x", endangered:true },
  { id:157, name:"Great Zimbabwe National Monument", country:"Zimbabwe", lat:-20.27, lng:30.93, year:1986, category:"cultural", region:"Africa", description:"Largest stone structure in sub-Saharan Africa, built by the Shona between the 11th and 15th centuries.", criteria:"i,iii,vi", endangered:false },
  { id:158, name:"Aksum", country:"Ethiopia", lat:14.13, lng:38.72, year:1980, category:"cultural", region:"Africa", description:"Ancient capital of the Aksumite Empire with giant stelae, royal tombs, and the supposed Ark of the Covenant.", criteria:"i,iv", endangered:false },
  { id:159, name:"Olduvai Gorge — Ngorongoro", country:"Tanzania", lat:-2.99, lng:35.35, year:1979, category:"mixed", region:"Africa", description:"Paleoanthropological site where Leakey discovered 1.8-million-year-old hominid remains.", criteria:"iv,vii,viii,ix,x", endangered:false },
  { id:160, name:"iSimangaliso Wetland Park", country:"South Africa", lat:-28.22, lng:32.43, year:1999, category:"natural", region:"Africa", description:"Diverse wetland ecosystem with coral reefs, lakes, and Africa's largest estuarine system.", criteria:"vii,ix,x", endangered:false },
  { id:161, name:"Fasil Ghebbi — Gondar", country:"Ethiopia", lat:12.61, lng:37.47, year:1979, category:"cultural", region:"Africa", description:"Royal enclosure of castles and palaces — the 'Camelot of Africa' — built by Ethiopian emperors.", criteria:"ii,iii", endangered:false },
  { id:162, name:"Fes el Bali", country:"Morocco", lat:34.06, lng:-4.98, year:1981, category:"cultural", region:"Africa", description:"Oldest medina in Morocco, a labyrinthine walled city with souks, mosques, and madrasas.", criteria:"ii,v", endangered:false },
  { id:163, name:"Bandiagara Escarpment — Land of the Dogons", country:"Mali", lat:14.35, lng:-3.58, year:1989, category:"mixed", region:"Africa", description:"Dramatic sandstone cliffs with Dogon villages, ancient granaries, and Tellem cliff dwellings.", criteria:"v,vii", endangered:true },

  // ── Oceania ────────────────────────────────────────────────────────────────
  { id:170, name:"Great Barrier Reef", country:"Australia", lat:-18.29, lng:147.70, year:1981, category:"natural", region:"Oceania", description:"World's largest coral reef system — 2,300 km of vibrant marine biodiversity visible from space.", criteria:"vii,viii,ix,x", endangered:false },
  { id:171, name:"Uluru-Kata Tjuta National Park", country:"Australia", lat:-25.34, lng:131.04, year:1987, category:"mixed", region:"Oceania", description:"Sacred Aboriginal monolith Uluru and the domed formations of Kata Tjuta in the red desert.", criteria:"v,vi,vii,viii", endangered:false },
  { id:172, name:"Sydney Opera House", country:"Australia", lat:-33.86, lng:151.22, year:2007, category:"cultural", region:"Oceania", description:"Iconic 20th-century architectural masterpiece on Sydney Harbour, designed by Jorn Utzon.", criteria:"i", endangered:false },
  { id:173, name:"Tongariro National Park", country:"New Zealand", lat:-39.28, lng:175.56, year:1990, category:"mixed", region:"Oceania", description:"Sacred Maori mountains with active volcanoes — the first cultural landscape inscribed on the World Heritage List.", criteria:"vi,vii,viii", endangered:false },
  { id:174, name:"Te Wahipounamu — South West New Zealand", country:"New Zealand", lat:-45.42, lng:167.72, year:1990, category:"natural", region:"Oceania", description:"Fiordland's spectacular fjords, rainforests, and glacial landscapes — home to rare species.", criteria:"vii,viii,ix,x", endangered:false },
  { id:175, name:"Lord Howe Island Group", country:"Australia", lat:-31.55, lng:159.08, year:1982, category:"natural", region:"Oceania", description:"Volcanic remnant island with unique biodiversity and the world's southernmost coral reef.", criteria:"vii,x", endangered:false },
  { id:176, name:"Kakadu National Park", country:"Australia", lat:-12.84, lng:132.39, year:1981, category:"mixed", region:"Oceania", description:"Living cultural landscape with 65,000 years of Aboriginal rock art, wetlands, and wildlife.", criteria:"i,vi,vii,ix,x", endangered:false },
  { id:177, name:"Shark Bay", country:"Australia", lat:-25.50, lng:113.50, year:1991, category:"natural", region:"Oceania", description:"Stromatolites, seagrass meadows, and 10,000 dugongs in one of Australia's natural treasures.", criteria:"vii,viii,ix,x", endangered:false },
  { id:178, name:"Greater Blue Mountains Area", country:"Australia", lat:-33.72, lng:150.31, year:2000, category:"natural", region:"Oceania", description:"Spectacular sandstone plateaus, eucalypt forests, and the Three Sisters in New South Wales.", criteria:"ix,x", endangered:false },
  { id:179, name:"Fiordland National Park", country:"New Zealand", lat:-44.00, lng:168.00, year:1990, category:"natural", region:"Oceania", description:"Dramatic fjords carved by glaciers, with Milford Sound and Doubtful Sound.", criteria:"vii,viii,ix,x", endangered:false },
  { id:180, name:"Tasmanian Wilderness", country:"Australia", lat:-42.68, lng:146.17, year:1982, category:"mixed", region:"Oceania", description:"One of the last expanses of temperate rainforest, with Aboriginal heritage spanning 36,000 years.", criteria:"iii,iv,vi,vii,viii,ix,x", endangered:false },
  { id:181, name:"Ningaloo Coast", country:"Australia", lat:-22.69, lng:113.68, year:2011, category:"natural", region:"Oceania", description:"250 km fringing reef — one of the longest in the world — with whale shark aggregations.", criteria:"vii,x", endangered:false },

  // ── Arab States ────────────────────────────────────────────────────────────
  { id:190, name:"Historic Jeddah — Gate to Makkah", country:"Saudi Arabia", lat:21.48, lng:39.19, year:2014, category:"cultural", region:"Arab States", description:"Historic coral-stone merchant houses and tower houses — the gateway for Hajj pilgrims since the 7th century.", criteria:"ii,iv,vi", endangered:false },
  { id:191, name:"Al-Hijr Archaeological Site (Mada'in Salih)", country:"Saudi Arabia", lat:26.79, lng:37.95, year:2008, category:"cultural", region:"Arab States", description:"Nabataean tombs carved into sandstone outcrops — the southern sister of Petra.", criteria:"ii,iii", endangered:false },
  { id:192, name:"Old City of Sana'a", country:"Yemen", lat:15.35, lng:44.21, year:1986, category:"cultural", region:"Arab States", description:"Extraordinary multi-storey rammed earth tower houses in a city inhabited for over 2,500 years.", criteria:"iv,v,vi", endangered:true },
  { id:193, name:"Site of Palmyra", country:"Syria", lat:34.55, lng:38.27, year:1980, category:"cultural", region:"Arab States", description:"Oasis city blending Greco-Roman and Persian architecture at the crossroads of civilizations.", criteria:"i,ii,iv", endangered:true },
  { id:194, name:"Ancient City of Aleppo", country:"Syria", lat:36.20, lng:37.17, year:1986, category:"cultural", region:"Arab States", description:"One of the oldest continuously inhabited cities, with its great Citadel, souks, and mosques.", criteria:"iii,iv", endangered:true },
  { id:195, name:"Baalbek", country:"Lebanon", lat:34.01, lng:36.20, year:1984, category:"cultural", region:"Arab States", description:"Colossal Roman temple complex with the largest stone blocks ever quarried in the ancient world.", criteria:"i,iv", endangered:false },
  { id:196, name:"Byblos", country:"Lebanon", lat:34.12, lng:35.65, year:1984, category:"cultural", region:"Arab States", description:"One of the world's oldest continuously inhabited cities — birthplace of the Phoenician alphabet.", criteria:"iii,iv,vi", endangered:false },
  { id:197, name:"Wadi Rum Protected Area", country:"Jordan", lat:29.57, lng:35.42, year:2011, category:"mixed", region:"Arab States", description:"Dramatic desert landscape of sandstone mountains — Lawrence of Arabia's 'Valley of the Moon'.", criteria:"iii,v,vii", endangered:false },
  { id:198, name:"Socotra Archipelago", country:"Yemen", lat:12.47, lng:53.87, year:2008, category:"natural", region:"Arab States", description:"The 'Galapagos of the Indian Ocean' — 37% of plant species found nowhere else on Earth.", criteria:"x", endangered:false },
  { id:199, name:"Bahla Fort", country:"Oman", lat:22.96, lng:57.30, year:1987, category:"cultural", region:"Arab States", description:"Massive mud-brick and stone fortress surrounded by a 12 km wall — a pre-Islamic oasis settlement.", criteria:"iv", endangered:false },
  { id:200, name:"Medina of Marrakesh", country:"Morocco", lat:31.63, lng:-8.00, year:1985, category:"cultural", region:"Arab States", description:"Vibrant walled city founded in 1070 — the red city of souks, palaces, and Jemaa el-Fnaa square.", criteria:"i,ii,iv,v", endangered:false },
  { id:201, name:"Ancient City of Damascus", country:"Syria", lat:33.51, lng:36.31, year:1979, category:"cultural", region:"Arab States", description:"One of the oldest continuously inhabited cities — 3,000 years of civilizations from Aramean to Ottoman.", criteria:"i,ii,iii,iv,vi", endangered:true },
  { id:202, name:"Ancient City of Bosra", country:"Syria", lat:32.52, lng:36.48, year:1980, category:"cultural", region:"Arab States", description:"Capital of the Roman province of Arabia, with a magnificent 2nd-century Roman theatre.", criteria:"i,iii,vi", endangered:true },
  { id:203, name:"Crac des Chevaliers and Qal'at Salah El-Din", country:"Syria", lat:34.76, lng:36.29, year:2006, category:"cultural", region:"Arab States", description:"Two of the finest examples of Crusader-era castles in the world.", criteria:"ii,iv", endangered:true },

  // ── Additional sites for geographic diversity ──────────────────────────────
  { id:210, name:"Historic Centre of Cordoba", country:"Spain", lat:37.88, lng:-4.78, year:1984, category:"cultural", region:"Europe", description:"The Great Mosque-Cathedral of Cordoba — a stunning fusion of Islamic and Christian architecture.", criteria:"i,ii,iii,iv", endangered:false },
  { id:211, name:"Old Town of Avila", country:"Spain", lat:40.66, lng:-4.70, year:1985, category:"cultural", region:"Europe", description:"Best-preserved medieval walls in Spain surrounding a city of churches, palaces, and convents.", criteria:"iii,iv", endangered:false },
  { id:212, name:"Historic Fortified City of Carcassonne", country:"France", lat:43.21, lng:2.35, year:1997, category:"cultural", region:"Europe", description:"Finest example of a medieval fortified city in Europe — double ring of walls with 52 towers.", criteria:"ii,iv", endangered:false },
  { id:213, name:"Wieliczka and Bochnia Royal Salt Mines", country:"Poland", lat:49.98, lng:20.06, year:1978, category:"cultural", region:"Europe", description:"700-year-old underground salt mines with chapels, sculptures, and an underground lake.", criteria:"iv", endangered:false },
  { id:214, name:"Dolomites", country:"Italy", lat:46.43, lng:11.84, year:2009, category:"natural", region:"Europe", description:"Dramatic mountain landscape with 18 peaks above 3,000m and exceptional geological diversity.", criteria:"vii,viii", endangered:false },
  { id:215, name:"Wadden Sea", country:"Germany/Netherlands/Denmark", lat:53.60, lng:8.00, year:2009, category:"natural", region:"Europe", description:"Largest unbroken system of intertidal sand and mud flats, vital for migratory birds.", criteria:"viii,ix,x", endangered:false },
  { id:216, name:"Ajanta Caves", country:"India", lat:20.55, lng:75.70, year:1983, category:"cultural", region:"Asia", description:"30 rock-cut Buddhist cave monuments with magnificent paintings and sculptures from 2nd century BC.", criteria:"i,ii,iii,vi", endangered:false },
  { id:217, name:"Sundarbans National Park", country:"India/Bangladesh", lat:21.94, lng:89.18, year:1987, category:"natural", region:"Asia", description:"Largest mangrove forest in the world — home to the Royal Bengal tiger and rich aquatic life.", criteria:"ix,x", endangered:false },
  { id:218, name:"Kathmandu Valley", country:"Nepal", lat:27.71, lng:85.32, year:1979, category:"cultural", region:"Asia", description:"Seven groups of monuments including Hindu temples and Buddhist stupas spanning 2,000 years.", criteria:"iii,iv,vi", endangered:true },
  { id:219, name:"Classical Gardens of Suzhou", country:"China", lat:31.30, lng:120.63, year:1997, category:"cultural", region:"Asia", description:"Nine gardens representing the pinnacle of Chinese garden design — miniature landscapes of philosophical meaning.", criteria:"i,ii,iii,iv,v", endangered:false },
  { id:220, name:"West Lake Cultural Landscape", country:"China", lat:30.24, lng:120.14, year:2011, category:"cultural", region:"Asia", description:"Iconic lake landscape that has influenced garden design across East Asia for centuries.", criteria:"ii,iii,vi", endangered:false },
  { id:221, name:"Selous Game Reserve", country:"Tanzania", lat:-9.00, lng:37.40, year:1982, category:"natural", region:"Africa", description:"One of the largest faunal reserves in the world, with diverse wildlife and undisturbed wilderness.", criteria:"ix,x", endangered:true },
  { id:222, name:"Rwenzori Mountains National Park", country:"Uganda", lat:0.35, lng:30.00, year:1994, category:"natural", region:"Africa", description:"Mountains of the Moon — glaciated peaks, waterfalls, and unique alpine vegetation on the equator.", criteria:"vii,x", endangered:true },
  { id:223, name:"Garamba National Park", country:"Democratic Republic of the Congo", lat:4.00, lng:29.25, year:1980, category:"natural", region:"Africa", description:"Vast grassy savannas and woodlands — one of the last refuges for the northern white rhinoceros.", criteria:"vii,x", endangered:true },
  { id:224, name:"Kahuzi-Biega National Park", country:"Democratic Republic of the Congo", lat:-2.30, lng:28.75, year:1980, category:"natural", region:"Africa", description:"Home to one of the last groups of eastern lowland gorillas in tropical rainforest.", criteria:"x", endangered:true },
  { id:225, name:"Manovo-Gounda St Floris National Park", country:"Central African Republic", lat:9.00, lng:21.50, year:1988, category:"natural", region:"Africa", description:"Rich savanna ecosystem with black rhinoceros and large herds of African buffalo.", criteria:"ix,x", endangered:true },
  { id:226, name:"Air and Tenere Natural Reserves", country:"Niger", lat:18.50, lng:8.50, year:1991, category:"natural", region:"Africa", description:"Saharan volcanic massif and sand sea — the last refuge of Saharan wildlife.", criteria:"vii,ix,x", endangered:true },
  { id:227, name:"Simien National Park", country:"Ethiopia", lat:13.25, lng:38.07, year:1978, category:"natural", region:"Africa", description:"Dramatic eroded plateau with endemic species including the Gelada baboon and Walia ibex.", criteria:"vii,x", endangered:true },
  { id:228, name:"Rainforests of the Atsinanana", country:"Madagascar", lat:-15.43, lng:49.70, year:2007, category:"natural", region:"Africa", description:"Six national parks protecting unique biodiversity — 80% of species found nowhere else on Earth.", criteria:"ix,x", endangered:true },
  { id:229, name:"Comoé National Park", country:"Cote d'Ivoire", lat:9.10, lng:-3.60, year:1983, category:"natural", region:"Africa", description:"Largest protected area in West Africa, at the transition between savanna and forest.", criteria:"ix,x", endangered:true },
  { id:230, name:"Archaeological Ruins at Moenjodaro", country:"Pakistan", lat:27.33, lng:68.14, year:1980, category:"cultural", region:"Asia", description:"Remains of a 4,500-year-old Indus Valley city — one of the earliest major urban settlements.", criteria:"ii,iii", endangered:true },
  { id:231, name:"Fort and Shalamar Gardens in Lahore", country:"Pakistan", lat:31.59, lng:74.31, year:1981, category:"cultural", region:"Asia", description:"Mughal masterpieces — Lahore Fort and the terraced Shalamar Gardens with 410 fountains.", criteria:"i,ii,iii", endangered:true },
  { id:232, name:"Chan Chan Archaeological Zone", country:"Peru", lat:-8.11, lng:-79.07, year:1986, category:"cultural", region:"Americas", description:"Largest pre-Columbian city in South America — capital of the Chimu Kingdom, built entirely of adobe.", criteria:"i,iii", endangered:true },
  { id:233, name:"Humberstone and Santa Laura Saltpeter Works", country:"Chile", lat:-20.21, lng:-69.79, year:2005, category:"cultural", region:"Americas", description:"Ghost towns of the nitrate mining era that transformed the Atacama Desert economy.", criteria:"ii,iii,iv", endangered:true },
  { id:234, name:"Coro and its Port", country:"Venezuela", lat:11.40, lng:-69.67, year:1993, category:"cultural", region:"Americas", description:"Only surviving example of a rich fusion of local tradition with Spanish Mudejar and Dutch architecture.", criteria:"iv,v", endangered:true },
  { id:235, name:"Los Katios National Park", country:"Colombia", lat:7.80, lng:-77.13, year:1994, category:"natural", region:"Americas", description:"Exceptional biological diversity in hills, forests, and wetlands connecting Central and South America.", criteria:"ix,x", endangered:true },
  { id:236, name:"Belize Barrier Reef Reserve System", country:"Belize", lat:17.33, lng:-87.53, year:1996, category:"natural", region:"Americas", description:"Northern Hemisphere's largest barrier reef — with atolls, mangrove forests, and the Great Blue Hole.", criteria:"vii,ix,x", endangered:true },
  { id:237, name:"East Rennell", country:"Solomon Islands", lat:-11.73, lng:160.27, year:1998, category:"natural", region:"Oceania", description:"Largest raised coral atoll in the world — pristine lake and dense forest on a remote Pacific island.", criteria:"ix", endangered:true },
  { id:238, name:"Liverpool — Maritime Mercantile City", country:"United Kingdom", lat:53.41, lng:-2.99, year:2004, category:"cultural", region:"Europe", description:"Six areas in the historic centre and docklands reflecting Liverpool's role as a world trading centre.", criteria:"ii,iii,iv", endangered:true },
  { id:239, name:"Abu Mena", country:"Egypt", lat:30.84, lng:29.66, year:1979, category:"cultural", region:"Africa", description:"Early Christian holy city built over the tomb of the martyr Menas of Alexandria.", criteria:"iv", endangered:true },
  { id:240, name:"Tropical Rainforest Heritage of Sumatra", country:"Indonesia", lat:-2.50, lng:101.50, year:2004, category:"natural", region:"Asia", description:"2.5 million hectares of tropical rainforest — home to Sumatran orangutan, tiger, and rhinoceros.", criteria:"vii,ix,x", endangered:true },
  { id:241, name:"Cultural Landscape and Archaeological Remains of the Bamiyan Valley", country:"Afghanistan", lat:34.83, lng:67.82, year:2003, category:"cultural", region:"Asia", description:"Buddhist monastic ensembles and niches of the giant Buddha statues destroyed by the Taliban in 2001.", criteria:"i,ii,iii,iv,vi", endangered:true },
  { id:242, name:"Minaret and Archaeological Remains of Jam", country:"Afghanistan", lat:34.40, lng:64.52, year:2002, category:"cultural", region:"Asia", description:"65m-tall minaret of the 12th century Ghurid dynasty — a graceful brick tower in a remote valley.", criteria:"ii,iii,iv", endangered:true },
  { id:243, name:"Nan Madol", country:"Micronesia", lat:6.84, lng:158.33, year:2016, category:"cultural", region:"Oceania", description:"Ruined city of megalithic basalt structures built on 99 artificial islands — the 'Venice of the Pacific'.", criteria:"i,iii,iv,vi", endangered:true },
]

// ── Country site counts ──────────────────────────────────────────────────────

function buildCountrySiteCounts(sites: HeritageSite[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const s of sites) {
    const c = s.country.split("/")[0].trim()
    counts[c] = (counts[c] ?? 0) + 1
  }
  return counts
}

const TOP_COUNTRIES = [
  { name: "Italy", count: 59 },
  { name: "China", count: 57 },
  { name: "Germany", count: 52 },
  { name: "France", count: 52 },
  { name: "Spain", count: 50 },
  { name: "India", count: 42 },
  { name: "Mexico", count: 35 },
  { name: "United Kingdom", count: 34 },
  { name: "Russia", count: 31 },
  { name: "Iran", count: 27 },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function featureCentroid(geo: { type: string; coordinates: unknown[] }): { lat: number; lng: number } {
  let coords: number[][] = []
  if (geo.type === "Polygon") coords = (geo.coordinates as number[][][])[0]
  else if (geo.type === "MultiPolygon") coords = (geo.coordinates as number[][][][]).flatMap(p => p[0])
  if (!coords.length) return { lat: 0, lng: 0 }
  let latS = 0, lngS = 0
  for (const c of coords) { lngS += c[0]; latS += c[1] }
  return { lat: latS / coords.length, lng: lngS / coords.length }
}

function getSatelliteTiles(lat: number, lng: number): string[] {
  const zoom = 15
  const n = Math.pow(2, zoom)
  const centerX = Math.floor((lng + 180) / 360 * n)
  const centerY = Math.floor(
    (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n
  )
  const tiles: string[] = []
  for (let dy = -1; dy <= 0; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      tiles.push(
        `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${centerY + dy}/${centerX + dx}`
      )
    }
  }
  return tiles
}

function choroplethColor(count: number): string {
  if (count === 0) return "rgba(0,0,0,0)"
  if (count <= 2) return "rgba(6,182,212,0.05)"
  if (count <= 5) return "rgba(6,182,212,0.10)"
  if (count <= 10) return "rgba(6,182,212,0.16)"
  if (count <= 20) return "rgba(6,182,212,0.22)"
  return "rgba(6,182,212,0.30)"
}

// ── Component ────────────────────────────────────────────────────────────────

export default function UC30Page() {
  const globeRef = useRef<HTMLDivElement>(null)
  const globeInst = useRef<any>(null)

  const [status, setStatus] = useState<"loading" | "ready">("loading")
  const [countries, setCountries] = useState<CountryFeature[]>([])
  const [catFilter, setCatFilter] = useState<SiteCategory | "all">("all")
  const [regionFilter, setRegionFilter] = useState<Region | "all">("all")
  const [endangeredOnly, setEndangeredOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSite, setSelectedSite] = useState<HeritageSite | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<CountryFeature | null>(null)
  const [hoveredCountry, setHoveredCountry] = useState<CountryFeature | null>(null)
  const [isSpinning, setIsSpinning] = useState(true)
  const [globeReady, setGlobeReady] = useState(false)

  // ── Filtered sites ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let s = SITES
    if (catFilter !== "all") s = s.filter(x => x.category === catFilter)
    if (regionFilter !== "all") s = s.filter(x => x.region === regionFilter)
    if (endangeredOnly) s = s.filter(x => x.endangered)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      s = s.filter(x => x.name.toLowerCase().includes(q) || x.country.toLowerCase().includes(q))
    }
    return s
  }, [catFilter, regionFilter, endangeredOnly, searchQuery])

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const cultural = SITES.filter(s => s.category === "cultural").length
    const natural = SITES.filter(s => s.category === "natural").length
    const mixed = SITES.filter(s => s.category === "mixed").length
    const endangered = SITES.filter(s => s.endangered).length
    const countriesSet = new Set(SITES.map(s => s.country))
    return { total: SITES.length, cultural, natural, mixed, endangered, countries: countriesSet.size }
  }, [])

  // ── Recently inscribed ─────────────────────────────────────────────────────
  const recentSites = useMemo(() =>
    [...SITES].sort((a, b) => b.year - a.year).slice(0, 10),
  [])

  // ── Country sites (for country detail panel) ───────────────────────────────
  const countrySites = useMemo(() => {
    if (!selectedCountry) return []
    const name = selectedCountry.properties.name as string
    return SITES.filter(s => s.country.toLowerCase().includes(name.toLowerCase())).slice(0, 10)
  }, [selectedCountry])

  const countrySiteCounts = useMemo(() => buildCountrySiteCounts(SITES), [])

  // ── Load GeoJSON ───────────────────────────────────────────────────────────
  useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch("https://unpkg.com/world-atlas@2/countries-110m.json")
        const topo = await r.json()
        // @ts-expect-error -- no declaration file for topojson-client
        const topoClient = await import("topojson-client")
        const feat = topoClient.feature(topo, topo.objects.countries) as any
        setCountries(feat.features)
        setStatus("ready")
      } catch {
        setStatus("ready")
      }
    })()
  }, [])

  // ── Init globe ─────────────────────────────────────────────────────────────
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
        .atmosphereColor("#06b6d4")
        .atmosphereAltitude(0.14)
        .pointOfView({ lat: 30, lng: 20, altitude: 2.0 })

      globe.controls().autoRotate = true
      globe.controls().autoRotateSpeed = 0.18
      globe.controls().enableDamping = true
      globe.controls().dampingFactor = 0.1

      globeInst.current = globe
      applyPoints(globe, filtered)
      applyCountries(globe, countries, null, null)
      setGlobeReady(true)
    })

    return () => {
      globeInst.current?.controls()?.dispose?.()
      globeInst.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  // ── Apply heritage site points ─────────────────────────────────────────────
  const applyPoints = useCallback((globe: any, sites: HeritageSite[]) => {
    globe
      .pointsData(sites)
      .pointLat((d: any) => d.lat)
      .pointLng((d: any) => d.lng)
      .pointColor((d: any) => d.endangered ? ENDANGERED_COLOR : CAT_COLORS[d.category as SiteCategory])
      .pointAltitude((d: any) => d.category === "natural" ? 0.025 : 0.015)
      .pointRadius((d: any) => d.endangered ? 0.25 : 0.15)
      .pointResolution(6)
      .pointLabel((d: any) => {
        const site = d as HeritageSite
        const catColor = CAT_COLORS[site.category]
        return `
          <div style="background:rgba(15,23,42,0.95);border:1px solid ${catColor};border-radius:12px;padding:12px 16px;max-width:320px;font-family:system-ui,sans-serif;">
            <div style="font-size:14px;font-weight:700;color:#f1f5f9;margin-bottom:4px;">${site.name}</div>
            <div style="font-size:11px;color:#94a3b8;margin-bottom:6px;">${site.country} &middot; Inscribed ${site.year}</div>
            <div style="display:flex;gap:6px;margin-bottom:8px;">
              <span style="font-size:10px;padding:2px 8px;border-radius:20px;background:${catColor}22;color:${catColor};border:1px solid ${catColor}44;">${site.category}</span>
              ${site.endangered ? '<span style="font-size:10px;padding:2px 8px;border-radius:20px;background:#ef444422;color:#ef4444;border:1px solid #ef444444;">endangered</span>' : ''}
            </div>
            <div style="font-size:11px;color:#cbd5e1;line-height:1.5;">${site.description}</div>
            <div style="font-size:10px;color:#64748b;margin-top:6px;">Criteria: (${site.criteria})</div>
          </div>
        `
      })
      .onPointHover((pt: any) => {
        if (globeRef.current) globeRef.current.style.cursor = pt ? "pointer" : "default"
      })
      .onPointClick((pt: any) => {
        const site = pt as HeritageSite
        setSelectedSite(site)
        if (globeInst.current) {
          globeInst.current.pointOfView({ lat: site.lat, lng: site.lng, altitude: 1.5 }, 800)
        }
        setIsSpinning(false)
      })
  }, [])

  // ── Apply country polygons ─────────────────────────────────────────────────
  const applyCountries = useCallback((
    globe: any,
    features: CountryFeature[],
    hovered: CountryFeature | null,
    selected: CountryFeature | null,
  ) => {
    globe
      .polygonsData(features)
      .polygonCapColor((d: any) => {
        const name = d.properties.name as string
        const count = countrySiteCounts[name] ?? 0
        if (selected && d.properties.name === selected.properties.name)
          return "rgba(6,182,212,0.20)"
        if (hovered && d.properties.name === hovered.properties.name)
          return "rgba(255,255,255,0.06)"
        return choroplethColor(count)
      })
      .polygonSideColor(() => "rgba(0,0,0,0)")
      .polygonStrokeColor((d: any) => {
        if (selected && d.properties.name === selected.properties.name)
          return "rgba(6,182,212,0.9)"
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countrySiteCounts])

  // ── Sync points when filter changes ────────────────────────────────────────
  useEffect(() => {
    if (!globeInst.current || status !== "ready") return
    applyPoints(globeInst.current, filtered)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, status])

  // ── Sync country polygons when hover/selection changes ─────────────────────
  useEffect(() => {
    if (!globeInst.current || !countries.length) return
    applyCountries(globeInst.current, countries, hoveredCountry, selectedCountry)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoveredCountry, selectedCountry, countries])

  // ── Spinning toggle ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!globeInst.current) return
    globeInst.current.controls().autoRotate = isSpinning
  }, [isSpinning])

  // ── Resize ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onResize = () => {
      if (globeInst.current && globeRef.current)
        globeInst.current.width(globeRef.current.clientWidth).height(globeRef.current.clientHeight)
    }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  // ── Pulse animation for endangered sites ──────────────────────────────────
  useEffect(() => {
    if (!globeReady || !globeInst.current) return
    let frame = 0
    const id = setInterval(() => {
      frame++
      const pulse = 1 + 0.3 * Math.sin(frame * 0.15)
      globeInst.current?.pointRadius((d: any) => {
        if (d.endangered) return 0.25 * pulse
        return 0.15
      })
    }, 80)
    return () => clearInterval(id)
  }, [globeReady])

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ background: "#0a0f1e" }}>
      {/* Globe */}
      <div ref={globeRef} className="absolute inset-0" />

      {/* ── Top-left: Title ──────────────────────────────────────────────── */}
      <div className="absolute top-4 left-4 z-10 max-w-sm">
        <div className="rounded-2xl px-5 py-4" style={{ background: "rgba(15,23,42,0.88)", backdropFilter: "blur(12px)", border: "1px solid rgba(6,182,212,0.2)" }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🏛️</span>
            <h1 className="text-lg font-bold" style={{ color: "#f1f5f9" }}>UNESCO World Heritage Atlas</h1>
          </div>
          <p className="text-xs" style={{ color: "#94a3b8" }}>
            {filtered.length} of {stats.total} sites shown
          </p>
          <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-mono" style={{ background: "rgba(6,182,212,0.15)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.3)" }}>
            Since 1972
          </span>
        </div>
      </div>

      {/* ── Top-right: Stats + Spin toggle ──────────────────────────────── */}
      <div className="absolute top-4 right-4 z-10">
        <div className="rounded-2xl px-5 py-4" style={{ background: "rgba(15,23,42,0.88)", backdropFilter: "blur(12px)", border: "1px solid rgba(6,182,212,0.2)" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold" style={{ color: "#94a3b8" }}>OVERVIEW</p>
            <button onClick={() => setIsSpinning(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background: isSpinning ? "rgba(6,182,212,0.2)" : "rgba(239,68,68,0.15)",
                color: isSpinning ? "#06b6d4" : "#ef4444",
                border: `1px solid ${isSpinning ? "rgba(6,182,212,0.5)" : "rgba(239,68,68,0.4)"}`,
              }}>
              <span style={{ fontSize: 14 }}>{isSpinning ? "\u23F8" : "\u25B6"}</span>
              {isSpinning ? "Spinning" : "Paused"}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-x-5 gap-y-2 text-center">
            <div>
              <p className="text-lg font-bold" style={{ color: "#06b6d4" }}>{stats.total}</p>
              <p className="text-[10px]" style={{ color: "#64748b" }}>Total Sites</p>
            </div>
            <div>
              <p className="text-lg font-bold" style={{ color: "#fbbf24" }}>{stats.cultural}</p>
              <p className="text-[10px]" style={{ color: "#64748b" }}>Cultural</p>
            </div>
            <div>
              <p className="text-lg font-bold" style={{ color: "#10b981" }}>{stats.natural}</p>
              <p className="text-[10px]" style={{ color: "#64748b" }}>Natural</p>
            </div>
            <div>
              <p className="text-lg font-bold" style={{ color: "#8b5cf6" }}>{stats.mixed}</p>
              <p className="text-[10px]" style={{ color: "#64748b" }}>Mixed</p>
            </div>
            <div>
              <p className="text-lg font-bold" style={{ color: "#ef4444" }}>{stats.endangered}</p>
              <p className="text-[10px]" style={{ color: "#64748b" }}>Endangered</p>
            </div>
            <div>
              <p className="text-lg font-bold" style={{ color: "#f1f5f9" }}>{stats.countries}</p>
              <p className="text-[10px]" style={{ color: "#64748b" }}>Countries</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Left sidebar: Filters ────────────────────────────────────────── */}
      <div className="absolute top-28 left-4 z-10 w-64">
        <div className="rounded-2xl px-4 py-4 space-y-4 max-h-[calc(100vh-160px)] overflow-y-auto" style={{ background: "rgba(15,23,42,0.88)", backdropFilter: "blur(12px)", border: "1px solid rgba(6,182,212,0.2)" }}>
          {/* Category */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#64748b" }}>Category</p>
            <div className="flex flex-wrap gap-1.5">
              {(["all", "cultural", "natural", "mixed"] as const).map(c => (
                <button key={c} onClick={() => setCatFilter(c)}
                  className="px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5"
                  style={{
                    background: catFilter === c ? (c === "all" ? "rgba(6,182,212,0.2)" : CAT_COLORS[c] + "33") : "rgba(30,41,59,0.6)",
                    color: catFilter === c ? (c === "all" ? "#06b6d4" : CAT_COLORS[c]) : "#64748b",
                    border: `1px solid ${catFilter === c ? (c === "all" ? "rgba(6,182,212,0.4)" : CAT_COLORS[c] + "66") : "rgba(51,65,85,0.5)"}`,
                  }}>
                  {c !== "all" && <span className="w-2 h-2 rounded-full" style={{ background: CAT_COLORS[c] }} />}
                  {c === "all" ? "All" : c.charAt(0).toUpperCase() + c.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Region */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#64748b" }}>Region</p>
            <select value={regionFilter} onChange={e => setRegionFilter(e.target.value as Region | "all")}
              className="w-full rounded-lg px-3 py-1.5 text-xs"
              style={{ background: "rgba(30,41,59,0.8)", color: "#cbd5e1", border: "1px solid rgba(51,65,85,0.5)", outline: "none" }}>
              <option value="all">All Regions</option>
              {(["Europe", "Asia", "Americas", "Africa", "Oceania", "Arab States"] as Region[]).map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Endangered toggle */}
          <div>
            <button onClick={() => setEndangeredOnly(v => !v)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all"
              style={{
                background: endangeredOnly ? "rgba(239,68,68,0.15)" : "rgba(30,41,59,0.6)",
                color: endangeredOnly ? "#ef4444" : "#94a3b8",
                border: `1px solid ${endangeredOnly ? "rgba(239,68,68,0.4)" : "rgba(51,65,85,0.5)"}`,
              }}>
              <span>Endangered Only</span>
              <span className="w-8 h-4 rounded-full relative" style={{ background: endangeredOnly ? "#ef4444" : "#334155" }}>
                <span className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all" style={{ left: endangeredOnly ? "17px" : "2px" }} />
              </span>
            </button>
          </div>

          {/* Search */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#64748b" }}>Search</p>
            <input type="text" placeholder="Site name or country..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-lg px-3 py-1.5 text-xs"
              style={{ background: "rgba(30,41,59,0.8)", color: "#cbd5e1", border: "1px solid rgba(51,65,85,0.5)", outline: "none" }} />
          </div>

          {/* Top countries */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#64748b" }}>Top Countries (Official)</p>
            <div className="space-y-1">
              {TOP_COUNTRIES.map(c => (
                <div key={c.name} className="flex items-center justify-between text-xs px-2 py-1 rounded"
                  style={{ background: "rgba(30,41,59,0.4)" }}>
                  <span style={{ color: "#cbd5e1" }}>{c.name}</span>
                  <span className="font-mono font-bold" style={{ color: "#06b6d4" }}>{c.count}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── Right sidebar: Recently inscribed ────────────────────────────── */}
      <div className="absolute top-28 right-4 z-10 w-56">
        <div className="rounded-2xl px-4 py-4 max-h-[calc(100vh-300px)] overflow-y-auto" style={{ background: "rgba(15,23,42,0.88)", backdropFilter: "blur(12px)", border: "1px solid rgba(6,182,212,0.2)" }}>
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: "#64748b" }}>Recently Inscribed</p>
          <div className="space-y-2">
            {recentSites.map(s => (
              <button key={s.id} onClick={() => {
                setSelectedSite(s)
                if (globeInst.current) globeInst.current.pointOfView({ lat: s.lat, lng: s.lng, altitude: 1.5 }, 800)
                setIsSpinning(false)
              }}
                className="w-full text-left px-2.5 py-2 rounded-lg transition-all hover:bg-white/5"
                style={{ background: "rgba(30,41,59,0.4)" }}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: CAT_COLORS[s.category] }} />
                  <span className="text-[11px] font-medium truncate" style={{ color: "#e2e8f0" }}>{s.name}</span>
                </div>
                <span className="text-[10px] font-mono" style={{ color: "#64748b" }}>{s.year} &middot; {s.country}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom-right: Selected site detail ───────────────────────────── */}
      {selectedSite && (
        <div className="absolute bottom-4 right-4 z-10 w-96 max-h-[calc(100vh-100px)] overflow-y-auto">
          <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(15,23,42,0.92)", backdropFilter: "blur(14px)", border: `1px solid ${CAT_COLORS[selectedSite.category]}44` }}>
            {/* Satellite image tiles */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", width: "100%", height: 160, overflow: "hidden" }}>
              {getSatelliteTiles(selectedSite.lat, selectedSite.lng).map((url, i) => (
                <img key={i} src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect fill='%23172033' width='100' height='100'/></svg>" }} />
              ))}
            </div>

            <div className="px-5 py-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{selectedSite.category === "cultural" ? "\uD83C\uDFDB\uFE0F" : selectedSite.category === "natural" ? "\uD83C\uDF3F" : "\uD83C\uDFD4\uFE0F"}</span>
                  <h3 className="text-sm font-bold pr-2" style={{ color: "#f1f5f9" }}>{selectedSite.name}</h3>
                </div>
                <button onClick={() => setSelectedSite(null)}
                  className="w-6 h-6 flex items-center justify-center rounded-full text-xs flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.1)", color: "#94a3b8" }}>
                  x
                </button>
              </div>
              <p className="text-xs mb-2" style={{ color: "#94a3b8" }}>{selectedSite.country} &middot; Inscribed {selectedSite.year}</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                <span className="px-2 py-0.5 rounded-full text-[10px]"
                  style={{ background: CAT_COLORS[selectedSite.category] + "22", color: CAT_COLORS[selectedSite.category], border: `1px solid ${CAT_COLORS[selectedSite.category]}44` }}>
                  {selectedSite.category}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px]"
                  style={{ background: "rgba(6,182,212,0.1)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.3)" }}>
                  {selectedSite.region}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono"
                  style={{ background: "rgba(100,116,139,0.15)", color: "#94a3b8", border: "1px solid rgba(100,116,139,0.3)" }}>
                  ({selectedSite.criteria})
                </span>
                {selectedSite.endangered && (
                  <span className="px-2 py-0.5 rounded-full text-[10px]"
                    style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.4)" }}>
                    Endangered
                  </span>
                )}
              </div>
              <p className="text-xs leading-relaxed mb-4" style={{ color: "#cbd5e1" }}>{selectedSite.description}</p>
              <div className="text-[10px] font-mono mb-4" style={{ color: "#64748b" }}>
                {selectedSite.lat.toFixed(4)}, {selectedSite.lng.toFixed(4)}
              </div>
              {/* Action buttons */}
              <div className="flex gap-2">
                <a
                  href={`https://www.google.com/maps/@${selectedSite.lat},${selectedSite.lng},500m/data=!3m1!1e3`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:brightness-110"
                  style={{ background: "rgba(6,182,212,0.15)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.3)" }}>
                  <span>{"\uD83D\uDDFA\uFE0F"}</span> 3D Map
                </a>
                <a
                  href={`https://en.wikipedia.org/wiki/${encodeURIComponent(selectedSite.name.replace(/ /g, "_"))}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:brightness-110"
                  style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }}>
                  <span>{"\uD83D\uDCD6"}</span> Wiki
                </a>
                <a
                  href={`https://news.google.com/search?q=${encodeURIComponent(selectedSite.name + " UNESCO")}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:brightness-110"
                  style={{ background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}>
                  <span>{"\uD83D\uDCF0"}</span> News
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom-left: Country detail ──────────────────────────────────── */}
      {selectedCountry && (
        <div className="absolute bottom-4 left-4 z-10 w-72">
          <div className="rounded-2xl px-5 py-4" style={{ background: "rgba(15,23,42,0.92)", backdropFilter: "blur(14px)", border: "1px solid rgba(6,182,212,0.3)" }}>
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-sm font-bold" style={{ color: "#f1f5f9" }}>{selectedCountry.properties.name as string}</h3>
              <button onClick={() => setSelectedCountry(null)} className="text-xs" style={{ color: "#64748b" }}>x</button>
            </div>
            <p className="text-xs mb-3" style={{ color: "#06b6d4" }}>
              {countrySites.length} UNESCO site{countrySites.length !== 1 ? "s" : ""} in dataset
            </p>
            {countrySites.length > 0 && (
              <>
                <div className="flex gap-2 mb-3 text-[10px]">
                  <span style={{ color: "#fbbf24" }}>{countrySites.filter(s => s.category === "cultural").length} Cultural</span>
                  <span style={{ color: "#10b981" }}>{countrySites.filter(s => s.category === "natural").length} Natural</span>
                  <span style={{ color: "#8b5cf6" }}>{countrySites.filter(s => s.category === "mixed").length} Mixed</span>
                </div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {countrySites.map(s => (
                    <button key={s.id} onClick={() => {
                      setSelectedSite(s)
                      if (globeInst.current) globeInst.current.pointOfView({ lat: s.lat, lng: s.lng, altitude: 1.5 }, 800)
                    }}
                      className="w-full text-left flex items-center gap-1.5 px-2 py-1 rounded text-xs hover:bg-white/5"
                      style={{ color: "#cbd5e1" }}>
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.endangered ? ENDANGERED_COLOR : CAT_COLORS[s.category] }} />
                      <span className="truncate">{s.name}</span>
                      <span className="ml-auto text-[10px] font-mono" style={{ color: "#64748b" }}>{s.year}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Legend ────────────────────────────────────────────────────────── */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
        <div className="flex items-center gap-4 rounded-full px-5 py-2" style={{ background: "rgba(15,23,42,0.88)", backdropFilter: "blur(12px)", border: "1px solid rgba(6,182,212,0.2)" }}>
          {([
            { label: "Cultural", color: "#fbbf24" },
            { label: "Natural", color: "#10b981" },
            { label: "Mixed", color: "#8b5cf6" },
            { label: "Endangered", color: "#ef4444" },
          ] as const).map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{
                background: l.color,
                boxShadow: l.label === "Endangered" ? `0 0 0 2px ${l.color}44` : "none",
              }} />
              <span className="text-[10px]" style={{ color: "#94a3b8" }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Loading */}
      {status === "loading" && (
        <div className="absolute inset-0 z-20 flex items-center justify-center" style={{ background: "rgba(10,15,30,0.9)" }}>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-sm" style={{ color: "#94a3b8" }}>Loading World Heritage data...</p>
          </div>
        </div>
      )}
    </div>
  )
}

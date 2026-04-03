// =============================================================================
// VERSION CONTROL — update this before every meaningful push / release
// =============================================================================
//
//  How to bump a version:
//  1. Increment the correct segment:
//       MAJOR  — breaking redesign or architecture change
//       MINOR  — new use case, new feature, significant enhancement
//       PATCH  — bug fix, copy tweak, styling adjustment
//  2. Update RELEASE_DATE to today (YYYY-MM-DD)
//  3. Add a one-line entry to CHANGELOG
//  4. Commit + push → version shows in the footer automatically
//
// =============================================================================

export const VERSION = {
  major: 1,
  minor: 10,
  patch: 0,
} as const

/** Full semver string, e.g. "v1.4.0" */
export const VERSION_STRING = `v${VERSION.major}.${VERSION.minor}.${VERSION.patch}`

/** ISO date of the release (YYYY-MM-DD) */
export const RELEASE_DATE = "2026-04-03"

/** Short human-readable date, e.g. "1 Apr 2026" */
export const RELEASE_DATE_LABEL = new Date(RELEASE_DATE + "T00:00:00")
  .toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })

/** One-liner describing what this release contains */
export const RELEASE_LABEL = "UC23 Skyscraper Race · UC24 Rail Networks · UC25 Ocean Crisis · UC26 AI Infrastructure · UC27 Global Conflicts"

// =============================================================================
// CHANGELOG
// =============================================================================
// v1.10.0 2026-04-03  UC23 Global Skyscraper Race (deck.gl ColumnLayer, 60+ buildings) ·
//                     UC24 World Rail Networks (PathLayer + ArcLayer, 25+ corridors) ·
//                     UC25 Ocean Crisis Atlas (plastic + coral bleaching + SST) ·
//                     UC26 AI Infrastructure Race (82 data centers, Stargate) ·
//                     UC27 Global Conflict Monitor 2025 (24+ conflicts, 117M displaced)
// v1.9.0  2026-04-02  UC06 Cell Tower Density (OpenCelliD, 2G/3G/LTE/5G) ·
//                     UC09 EV Charging & Gas Stations (Open Charge Map/NREL) ·
//                     UC21 Financial Globe (World Bank GDP, Frankfurter FX) ·
//                     UC22 Global Crops & Agriculture (FAO STAT 2022, 8 crops)
// v1.8.0  2026-04-03  UC03 Artemis II Moon Mission Tracker — JPL Horizons Moon
//                     position, Orion free-return trajectory, crew profiles,
//                     mission phase timeline, NASA imagery feed, WebGL 3D scene
// v1.7.0  2026-04-02  UC17 Live Aircraft (OpenSky ADS-B) · UC18 Active Wildfires
//                     (NASA EONET) · UC19 Submarine Internet Cables (TeleGeography)
//                     · UC20 Space Weather & Aurora (NOAA SWPC Ovation Prime)
// v1.6.0  2026-04-03  UC16 Space Debris Tracker — CelesTrak 3-group TLE feed,
//                     Cosmos 2251 + FenYun-1C + Iridium 33 debris clouds,
//                     SGP4 propagation, origin + altitude-band filters
// v1.5.0  2026-04-02  UC15 Starlinks Spacemap — live CelesTrak TLE feed,
//                     satellite.js SGP4 propagation, 6000+ satellites on
//                     globe.gl WebGL globe, orbital shell filters, ground tracks
// v1.4.0  2026-04-01  UC14 World Job Market — globe.gl 3D globe, 52 cities,
//                     10 sectors, MapLibre replaced; per-page OG meta tags;
//                     mobile hamburger fix; lazy-load WebGL; logo-only navbar
// v1.3.0  2026-03-28  UC10 pass detail pages, E2E block diagram, 30+ micro KPI
//                     charts, NTN_5G_XXXX counter IDs, LEO 5-8 min durations
// v1.2.0  2026-03-24  UC14 Global AI Inference Grid (initial), FocusRail 3D
//                     carousel, ScrollExpandMedia hero, CanvasRevealEffect bg
// v1.1.0  2026-03-20  UC10 NTN E2E Service Assurance — 60 passes, 4 domains,
//                     RAN KPIs, RTPM pipeline, mesh architecture detail page
// v1.0.0  2026-03-15  Initial launch — Next.js 16 rebuild, cobe globe, use
//                     case cards, scalable lib/data.ts system, static demos
// =============================================================================

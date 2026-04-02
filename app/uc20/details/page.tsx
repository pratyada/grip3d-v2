import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Space Weather & Aurora — Architecture · GRIP 3D",
  description: "Technical deep-dive: NOAA SWPC aurora oval data, Kp index, solar wind parsing, Three.js WebGL particle rendering at 120 km altitude, and the physics of geomagnetic storms.",
}

const PIPELINE = [
  { n:"01", icon:"☀️", color:"#ffcc44", title:"NOAA SWPC Multi-Endpoint Fetch",
    desc:"Four NOAA Space Weather Prediction Center endpoints are fetched in parallel: the Ovation Prime aurora forecast (probability grid), the planetary Kp index time series, and the real-time solar wind plasma and magnetic field data from the DSCOVR satellite at the L1 Lagrange point.",
    tech:["NOAA SWPC (free, no key)","ovation_aurora_latest.json","planetary-k-index.json","solar-wind plasma + mag"] },
  { n:"02", icon:"🔁", color:"#00ff88", title:"API Proxy & Data Combination",
    desc:"A Next.js Route Handler fetches all four endpoints in parallel and combines them into a single JSON response with 5-minute caching. The most recent values are extracted from each time series to provide the current Kp, solar wind speed, density, and the IMF Bz component.",
    tech:["Parallel Promise.all fetch","Most-recent value extraction","5 min edge cache","Single combined response"] },
  { n:"03", icon:"🔬", color:"#44ffcc", title:"Aurora Grid Parsing",
    desc:"The NOAA aurora data is a 360×180 degree probability grid (one value per degree of longitude and latitude). Coordinates with probability > 0 are filtered and longitude is remapped from 0–359 to −180–180. Aurora points are classified by probability into colour bands from dark green (low) to cyan-white (peak).",
    tech:["360×180 probability grid","Probability threshold filter","Longitude remapping (0–359 → ±180)","6-level colour gradient"] },
  { n:"04", icon:"🖥", color:"#00cc88", title:"WebGL Aurora Rendering at 120 km",
    desc:"Aurora points are placed at 120 km altitude above Earth (aurora typically occurs at 90–150 km). The `latLngAltToXYZ` function maps geodetic coordinates to Three.js XYZ space using the globe radius constant. A canvas-drawn green glow sprite and slow opacity pulse creates the shimmering aurora effect.",
    tech:["Three.js BufferGeometry","120 km altitude rendering","Green glow canvas sprite","Slow shimmer animation"] },
]

const KP_SCALE = [
  { range:"0–1",  level:"Quiet",             color:"#44ff88", effect:"No significant effects" },
  { range:"1–2",  level:"Unsettled",          color:"#88ff44", effect:"Minor fluctuations in power grids" },
  { range:"2–4",  level:"Active",             color:"#ffcc44", effect:"Weak power grid fluctuations; HF radio degradation at high latitudes" },
  { range:"4–5",  level:"Minor Storm (G1)",   color:"#ff8800", effect:"Power grid fluctuations; possible auroras at 60° geomagnetic lat." },
  { range:"5–6",  level:"Moderate (G2)",      color:"#ff5500", effect:"GPS degradation; auroras visible to 55° lat." },
  { range:"6–7",  level:"Strong (G3)",        color:"#ff2200", effect:"Transformer damage risk; aurora at 50° lat." },
  { range:"7–8",  level:"Severe (G4)",        color:"#cc0000", effect:"Widespread voltage control problems; aurora at 45° lat." },
  { range:"8–9",  level:"Extreme (G5)",       color:"#ff00ff", effect:"Complete HF blackout; aurora at 40° lat.; grid collapse risk" },
]

export default function UC20DetailsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Link href="/uc20" className="inline-flex items-center gap-1.5 text-xs mb-6 opacity-60 hover:opacity-100" style={{ color:"var(--muted)" }}>← Back to live globe</Link>
      <div className="mb-4">
        <span className="text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full" style={{ background:"rgba(0,255,136,0.1)", color:"#00ff88", border:"1px solid rgba(0,255,136,0.25)" }}>UC20 · Space Weather</span>
      </div>
      <h1 className="text-4xl font-bold mb-4" style={{ color:"var(--text)" }}>Space Weather & Aurora</h1>
      <p className="text-lg max-w-3xl mb-10" style={{ color:"var(--muted)" }}>The live aurora borealis and australis ovals rendered on a 3D WebGL globe at accurate altitude — powered by NOAA SWPC's Ovation Prime aurora forecast model, updated every 5 minutes, with real-time solar wind and Kp geomagnetic index.</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-14">
        {[{val:"NOAA SWPC",label:"Data source"},{val:"5 min",label:"Update interval"},{val:"120 km",label:"Aurora altitude"},{val:"0–9",label:"Kp index scale"}].map(s=>(
          <div key={s.label} className="rounded-xl p-4 text-center" style={{ background:"var(--surface)", border:"1px solid var(--border)" }}>
            <p className="text-xl font-bold mb-1" style={{ color:"#00ff88" }}>{s.val}</p>
            <p className="text-xs" style={{ color:"var(--muted)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-8" style={{ color:"var(--text)" }}>Data Pipeline</h2>
        <div className="flex flex-col gap-4">
          {PIPELINE.map((step, idx) => (
            <div key={step.n} className="flex gap-5 rounded-xl p-5" style={{ background:"var(--surface)", border:"1px solid var(--border)" }}>
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background:step.color+"18", border:`1px solid ${step.color}40` }}>{step.icon}</div>
                {idx < PIPELINE.length-1 && <div className="w-px flex-1 min-h-4" style={{ background:"var(--border)" }} />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono opacity-50" style={{ color:step.color }}>{step.n}</span>
                  <h3 className="text-sm font-semibold" style={{ color:"var(--text)" }}>{step.title}</h3>
                </div>
                <p className="text-sm mb-3 leading-relaxed" style={{ color:"var(--muted)" }}>{step.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {step.tech.map(t=><span key={t} className="text-xs px-2 py-0.5 rounded-full" style={{ background:step.color+"12", border:`1px solid ${step.color}28`, color:step.color }}>{t}</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-6" style={{ color:"var(--text)" }}>Kp Index Scale</h2>
        <p className="text-sm mb-4" style={{ color:"var(--muted)" }}>The planetary Kp index is a 0–9 scale measuring global geomagnetic activity, updated every 3 hours by NOAA. It drives aurora visibility latitude and geomagnetic storm classification.</p>
        <div className="overflow-x-auto rounded-xl" style={{ border:"1px solid var(--border)" }}>
          <table className="w-full text-sm">
            <thead><tr style={{ background:"var(--surface)", borderBottom:"1px solid var(--border)" }}>
              {["Kp Range","Storm Level","Infrastructure Impact"].map(h=><th key={h} className="text-left px-4 py-3 text-xs font-semibold tracking-wider" style={{ color:"var(--muted)" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {KP_SCALE.map((row, i)=>(
                <tr key={row.range} style={{ background: i%2===0?"transparent":"var(--surface)", borderBottom:"1px solid var(--border)" }}>
                  <td className="px-4 py-2.5 font-mono text-xs font-semibold" style={{ color:row.color }}>{row.range}</td>
                  <td className="px-4 py-2.5 font-semibold" style={{ color:row.color }}>{row.level}</td>
                  <td className="px-4 py-2.5" style={{ color:"var(--muted)" }}>{row.effect}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-14">
        <div className="rounded-xl p-6" style={{ background:"rgba(0,255,136,0.04)", border:"1px solid rgba(0,255,136,0.15)" }}>
          <h2 className="text-xl font-bold mb-3" style={{ color:"#00ff88" }}>What drives geomagnetic storms?</h2>
          <p className="text-sm leading-relaxed mb-3" style={{ color:"var(--muted)" }}>The primary driver of geomagnetic storms is the Interplanetary Magnetic Field (IMF) Bz component — when Bz turns strongly negative, it connects with Earth's northward magnetic field and allows solar wind energy to pour into the magnetosphere. This energises electrons in the Van Allen belts and sends them spiralling into the polar atmosphere at 90–150 km altitude, where they excite atmospheric nitrogen and oxygen into the characteristic green and red aurora colours.</p>
          <p className="text-sm leading-relaxed" style={{ color:"var(--muted)" }}>The most intense recorded storm was the 1859 Carrington Event (estimated Kp 9+), which induced currents so strong that telegraph operators received shocks. The 1989 Quebec blackout (Kp 9) left 6 million without power for 9 hours. A repeat Carrington-scale event today could cause trillions of dollars in infrastructure damage.</p>
        </div>
      </section>

      <div className="flex gap-3">
        <Link href="/uc20" className="px-5 py-2.5 rounded-xl text-sm font-semibold" style={{ background:"#00aa44", color:"#fff" }}>← Back to live globe</Link>
        <Link href="/use-cases" className="px-5 py-2.5 rounded-xl text-sm font-semibold" style={{ background:"var(--surface)", color:"var(--text)", border:"1px solid var(--border)" }}>All use cases</Link>
      </div>
    </div>
  )
}

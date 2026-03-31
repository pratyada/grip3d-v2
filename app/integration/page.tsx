import Link from "next/link"

const platformCards = [
  {
    icon: "🗂️",
    title: "Layers Approach",
    subtitle: "Everything is a data layer",
    desc: "GRIP 3D is architected around a layer-first philosophy. Every dataset — satellite beams, vessel routes, AQI readings, population density — is an independent, toggleable layer. Combine them freely for cross-domain analysis.",
    points: [
      "Toggle any layer independently",
      "Layer blending & transparency controls",
      "Real-time and historical data modes",
      "Custom layer injection via API",
    ],
  },
  {
    icon: "🔌",
    title: "APIs for Partners",
    subtitle: "Integrate your data, your way",
    desc: "The GRIP 3D Partner API provides endpoints for injecting live data feeds, querying layer states, triggering alerts, and embedding the globe widget in your own applications.",
    points: [
      "REST + WebSocket endpoints",
      "Authentication & rate limiting",
      "Webhook event subscriptions",
      "White-label embed token system",
    ],
  },
  {
    icon: "🌐",
    title: "Enterprise Integration",
    subtitle: "Enterprise-grade deployment options",
    desc: "From a standalone SaaS module to a fully on-premise deployment within your infrastructure. GRIP 3D supports SSO, audit logging, role-based access control, and custom data residency.",
    points: [
      "SSO / SAML / OAuth2",
      "Role-based access control",
      "On-premise or cloud deployment",
      "Custom SLA agreements",
    ],
  },
]

const integrationCards = [
  {
    icon: "🛠️",
    title: "OSS / NMS",
    desc: "Connect to your Network Operations Centre or OSS stack. Visualize fault events, topology maps, and signal quality on the globe in real time.",
  },
  {
    icon: "🗺️",
    title: "GIS Systems",
    desc: "Import GeoJSON, Shapefile, WMS/WFS feeds or connect to ArcGIS, QGIS, and other enterprise GIS platforms as globe layer sources.",
  },
  {
    icon: "🤝",
    title: "Partner Feeds",
    desc: "AIS maritime feeds, ADS-B flight data, NOAA weather grids, USGS seismic APIs, OpenAQ stations — all pre-built connectors available.",
  },
  {
    icon: "⚙️",
    title: "Custom APIs",
    desc: "Build your own connector using the GRIP 3D SDK. Push any JSON payload to a layer endpoint and see it visualized instantly on the globe.",
  },
]

export default function IntegrationPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-16">
        <span
          className="inline-flex items-center self-start text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full"
          style={{
            background: "var(--accent-dim)",
            color: "var(--accent)",
            border: "1px solid rgba(51,204,221,0.3)",
          }}
        >
          Integration
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold" style={{ color: "var(--text)" }}>
          Your data. Your platform. Our globe.
        </h1>
        <p className="text-lg max-w-2xl" style={{ color: "var(--muted)" }}>
          GRIP 3D is designed to plug into your existing data infrastructure — not replace it.
          Layer your proprietary data on top of the globe and expose it to your teams, partners, and clients.
        </p>
      </div>

      {/* 3 platform cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {platformCards.map((card) => (
          <div
            key={card.title}
            className="rounded-2xl p-7 flex flex-col gap-4"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <span className="text-4xl">{card.icon}</span>
            <div>
              <h2 className="font-bold text-xl mb-1" style={{ color: "var(--text)" }}>
                {card.title}
              </h2>
              <p className="text-sm font-medium mb-3" style={{ color: "var(--accent)" }}>
                {card.subtitle}
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                {card.desc}
              </p>
            </div>
            <ul className="flex flex-col gap-2 mt-2">
              {card.points.map((pt) => (
                <li key={pt} className="flex items-start gap-2 text-sm" style={{ color: "var(--muted)" }}>
                  <span style={{ color: "var(--accent)", marginTop: 2 }}>✓</span>
                  {pt}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* 4 integration cards */}
      <div
        className="rounded-2xl p-8 mb-16"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text)" }}>
          Pre-built connectors
        </h2>
        <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>
          Works out of the box with the tools your team already uses.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {integrationCards.map((card) => (
            <div
              key={card.title}
              className="rounded-xl p-5 flex flex-col gap-3"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
              }}
            >
              <span className="text-2xl">{card.icon}</span>
              <h3 className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                {card.title}
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div
        className="rounded-2xl p-10 flex flex-col sm:flex-row items-center justify-between gap-6"
        style={{
          background: "var(--accent-dim)",
          border: "1px solid rgba(51,204,221,0.3)",
        }}
      >
        <div>
          <h3 className="text-2xl font-bold mb-2" style={{ color: "var(--text)" }}>
            Ready to integrate your data?
          </h3>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Reach out to discuss your use case and get API access.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <Link
            href="/contact"
            className="px-6 py-3 rounded-xl font-semibold text-sm"
            style={{ background: "var(--accent)", color: "#000" }}
          >
            Get in touch →
          </Link>
          <Link
            href="/use-cases"
            className="px-6 py-3 rounded-xl font-semibold text-sm"
            style={{
              background: "transparent",
              color: "var(--accent)",
              border: "1px solid var(--accent)",
            }}
          >
            Browse demos
          </Link>
        </div>
      </div>
    </div>
  )
}

import Link from "next/link"
import { useCases, getFeaturedUseCases } from "@/lib/data"
import { UseCaseCard } from "@/components/UseCaseCard"
import { GlobeWrapper } from "@/components/GlobeWrapper"
import { ConsultingForm } from "@/components/ConsultingForm"

export default function HomePage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div className="flex flex-col gap-6">
            <span
              className="inline-flex items-center self-start text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full"
              style={{
                background: "var(--accent-dim)",
                color: "var(--accent)",
                border: "1px solid rgba(51,204,221,0.3)",
              }}
            >
              Interactive Globe Platform
            </span>

            <h1
              className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight"
              style={{ color: "var(--text)" }}
            >
              Bring a global view into your perspective —{" "}
              <span style={{ color: "var(--accent)" }}>
                operational awareness in real-time 3D.
              </span>
            </h1>

            <p className="text-lg leading-relaxed" style={{ color: "var(--muted)" }}>
              GRIP 3D is a layer-first platform that transforms complex global data into interactive
              3D globe experiences — for telecom, maritime, aviation, climate, energy, and beyond.
              Built for operators, analysts, and partners who need to see the world as it actually is.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/use-cases"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-colors duration-150"
                style={{ background: "var(--accent)", color: "#000" }}
              >
                Browse Demos →
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-colors duration-150"
                style={{
                  background: "transparent",
                  color: "var(--accent)",
                  border: "1px solid var(--accent)",
                }}
              >
                Talk to us
              </Link>
            </div>

            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Layer-first platform • Partner APIs available • Open to consulting engagements
            </p>
          </div>

          {/* Right: Globe */}
          <div className="flex items-center justify-center">
            <div style={{ width: "min(500px, 100%)" }}>
              <GlobeWrapper />
            </div>
          </div>
        </div>
      </section>

      {/* ── Use Cases ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col gap-2 mb-10">
          <span
            className="inline-flex items-center self-start text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full"
            style={{
              background: "var(--accent-dim)",
              color: "var(--accent)",
              border: "1px solid rgba(51,204,221,0.3)",
            }}
          >
            Demo Use Cases
          </span>
          <h2 className="text-3xl font-bold mt-2" style={{ color: "var(--text)" }}>
            Pick a scenario. See the globe do the work.
          </h2>
          <p className="text-base" style={{ color: "var(--muted)" }}>
            {getFeaturedUseCases().length} live demos and growing — each built as a real operational layer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {getFeaturedUseCases().map((uc) => (
            <UseCaseCard key={uc.id} uc={uc} />
          ))}
        </div>

        <div className="flex justify-center mt-10">
          <Link
            href="/use-cases"
            className="px-6 py-3 rounded-xl font-semibold text-sm"
            style={{
              background: "transparent",
              color: "var(--accent)",
              border: "1px solid var(--accent)",
            }}
          >
            View all {useCases.length} use cases →
          </Link>
        </div>
      </section>

      {/* ── Platform ── */}
      <section
        className="py-20"
        style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2 mb-12">
            <span
              className="inline-flex items-center self-start text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full"
              style={{
                background: "var(--accent-dim)",
                color: "var(--accent)",
                border: "1px solid rgba(51,204,221,0.3)",
              }}
            >
              Platform
            </span>
            <h2 className="text-3xl font-bold mt-2" style={{ color: "var(--text)" }}>
              Built for scale, integration, and expansion.
            </h2>
          </div>

          {/* 3 platform cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
              {
                icon: "🗂️",
                title: "Layers Approach",
                desc: "Every data source is a toggleable layer — telecom beams, weather, ships, AQI, demographics. Add, remove, and combine in real time.",
              },
              {
                icon: "🔌",
                title: "APIs for Partners",
                desc: "Expose your data through our partner API layer. Integrate third-party feeds, proprietary datasets, or live telemetry streams.",
              },
              {
                icon: "🌐",
                title: "Possibilities of Expansion",
                desc: "From a single use-case demo to a fully branded enterprise portal. Custom layers, white-label globe embeds, and consulting engagements.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl p-6 flex flex-col gap-4"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                }}
              >
                <span className="text-3xl">{item.icon}</span>
                <h3 className="font-semibold text-lg" style={{ color: "var(--text)" }}>
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* 4 integration cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: "🛠️", title: "OSS/NMS", desc: "Network management & operations support" },
              { icon: "🗺️", title: "GIS", desc: "Geographic information system data layers" },
              { icon: "📋", title: "CRM/Ops", desc: "Customer & operations data visualization" },
              { icon: "🤝", title: "Partners", desc: "Open partner API ecosystem" },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl p-5 flex flex-col gap-2"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <span className="text-2xl">{item.icon}</span>
                <h4 className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                  {item.title}
                </h4>
                <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Consulting / Contact ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div className="flex flex-col gap-6">
            <span
              className="inline-flex items-center self-start text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full"
              style={{
                background: "var(--accent-dim)",
                color: "var(--accent)",
                border: "1px solid rgba(51,204,221,0.3)",
              }}
            >
              Consulting
            </span>
            <h2 className="text-3xl font-bold" style={{ color: "var(--text)" }}>
              Let&apos;s build something meaningful together.
            </h2>
            <p className="text-base leading-relaxed" style={{ color: "var(--muted)" }}>
              We work with telcos, logistics companies, governments, and tech startups to design and
              deploy custom globe applications. Whether you need a white-label embed, a data
              integration sprint, or a full platform consultation — reach out.
            </p>
            <div
              className="flex items-center gap-3 p-4 rounded-xl"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <span className="text-2xl">✉️</span>
              <div>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Direct email</p>
                <a
                  href="mailto:connect@grip3d.com"
                  className="font-semibold text-sm"
                  style={{ color: "var(--accent)" }}
                >
                  connect@grip3d.com
                </a>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <ConsultingForm />
        </div>
      </section>
    </>
  )
}

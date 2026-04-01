import type { Metadata } from "next"
import Image from "next/image"
import ContactForm from "./ContactForm"

export const metadata: Metadata = {
  title: "Contact Us — GRIP 3D",
  description:
    "Get in touch with the GRIP 3D team. We design and deploy custom 3D globe applications for telcos, logistics, governments, and tech teams. White-label embeds, data integration, and full platform consulting.",
  openGraph: {
    title: "Contact GRIP 3D — Custom Globe Platform Consulting",
    description:
      "Talk to us about white-label globe embeds, data integration, or full platform consulting. Reach out at connect@grip3d.com.",
    siteName: "GRIP 3D",
  },
}

export default function ContactPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-14">
        <span
          className="inline-flex items-center self-start text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full"
          style={{
            background: "var(--accent-dim)",
            color: "var(--accent)",
            border: "1px solid rgba(51,204,221,0.3)",
          }}
        >
          Contact
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold" style={{ color: "var(--text)" }}>
          Let&apos;s discuss your demo, data layers,
          <br className="hidden sm:block" /> and integration path.
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Left: email card + form */}
        <div className="flex flex-col gap-6">
          {/* Email card */}
          <div
            className="flex items-center gap-4 p-5 rounded-2xl"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
              style={{ background: "var(--accent-dim)" }}
            >
              ✉️
            </div>
            <div>
              <p className="text-xs font-medium mb-0.5" style={{ color: "var(--muted)" }}>
                Direct email
              </p>
              <a
                href="mailto:connect@grip3d.com"
                className="font-semibold"
                style={{ color: "var(--accent)" }}
              >
                connect@grip3d.com
              </a>
            </div>
          </div>

          {/* Contact info cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: "🕐", title: "Response time", desc: "Within 24–48 hours on business days" },
              { icon: "🌍", title: "Global reach", desc: "Working with partners across EMEA, Americas & APAC" },
              { icon: "🔒", title: "Confidential", desc: "NDA available before any detailed discussion" },
              { icon: "🚀", title: "Fast onboarding", desc: "From first contact to demo in under 2 weeks" },
            ].map((item) => (
              <div
                key={item.title}
                className="p-4 rounded-xl flex flex-col gap-2"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <span className="text-xl">{item.icon}</span>
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                  {item.title}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Form */}
          <ContactForm />
        </div>

        {/* Right: hero globe image */}
        <div className="hidden lg:flex items-center justify-center">
          <div
            className="rounded-2xl overflow-hidden w-full"
            style={{ border: "1px solid var(--border)" }}
          >
            <Image
              src="/img/hero-globe.jpg"
              alt="GRIP 3D Globe"
              width={600}
              height={700}
              unoptimized
              className="w-full object-cover"
              style={{ maxHeight: 600 }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

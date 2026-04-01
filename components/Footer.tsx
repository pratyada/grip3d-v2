import Image from "next/image"
import Link from "next/link"
import { useCases } from "@/lib/data"
import { VERSION_STRING, RELEASE_DATE_LABEL, RELEASE_LABEL } from "@/lib/version"

const liveUseCases = useCases.filter((uc) => uc.status === "live")
const col1 = liveUseCases.slice(0, Math.ceil(liveUseCases.length / 2))
const col2 = liveUseCases.slice(Math.ceil(liveUseCases.length / 2))

export function Footer() {
  return (
    <footer
      className="mt-24"
      style={{ borderTop: "1px solid var(--border)", background: "var(--surface)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="inline-flex mb-4">
              <Image
                src="/img/grip3d-logo-trans-128.png"
                alt="GRIP 3D"
                width={56}
                height={56}
                unoptimized
                className="rounded"
              />
            </Link>
            <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--muted)" }}>
              Layer-first interactive globe platform for enterprise data visualization and operational intelligence.
            </p>
            <a
              href="mailto:connect@grip3d.com"
              className="text-sm font-medium"
              style={{ color: "var(--accent)" }}
            >
              connect@grip3d.com
            </a>
          </div>

          {/* About */}
          <div>
            <h4
              className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: "var(--muted)" }}
            >
              About
            </h4>
            <div className="flex flex-col gap-2">
              {[
                { label: "About Us", href: "/" },
                { label: "Integration", href: "/integration" },
                { label: "Leadership", href: "/leadership" },
                { label: "Contact Us", href: "/contact" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm footer-link"
                  style={{ color: "var(--muted)" }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Demos col 1 */}
          <div>
            <h4
              className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: "var(--muted)" }}
            >
              Demos
            </h4>
            <div className="flex flex-col gap-2">
              {col1.map((uc) => (
                <Link
                  key={uc.id}
                  href={`/use-cases/${uc.slug}`}
                  className="text-sm flex items-center gap-1.5 hover:text-white transition-colors"
                  style={{ color: "var(--muted)" }}
                >
                  <span>{uc.emoji}</span>
                  <span className="truncate">{uc.title.split("&")[0].trim()}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Demos col 2 */}
          <div>
            <h4
              className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: "var(--muted)" }}
            >
              More Demos
            </h4>
            <div className="flex flex-col gap-2">
              {col2.map((uc) => (
                <Link
                  key={uc.id}
                  href={`/use-cases/${uc.slug}`}
                  className="text-sm flex items-center gap-1.5 hover:text-white transition-colors"
                  style={{ color: "var(--muted)" }}
                >
                  <span>{uc.emoji}</span>
                  <span className="truncate">{uc.title.split("&")[0].trim()}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="border-t"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            © 2026 GRIP 3D
          </p>

          {/* Version badge — center */}
          <div
            className="flex items-center gap-2"
            title={RELEASE_LABEL}
            style={{
              padding: "3px 10px",
              borderRadius: 100,
              background: "var(--accent-dim)",
              border: "1px solid rgba(51,204,221,0.2)",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span style={{
              fontSize: 11,
              fontWeight: 800,
              fontFamily: "monospace",
              color: "var(--accent)",
              letterSpacing: "0.04em",
            }}>
              {VERSION_STRING}
            </span>
            <span style={{ color: "var(--border)", fontSize: 10 }}>·</span>
            <span style={{ fontSize: 10, color: "var(--muted)" }}>
              {RELEASE_DATE_LABEL}
            </span>
          </div>

          <p className="text-xs" style={{ color: "var(--muted)" }}>
            Built for partners • APIs available
          </p>
        </div>
      </div>
    </footer>
  )
}

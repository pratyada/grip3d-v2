import Image from "next/image"
import Link from "next/link"
import { useCases } from "@/lib/data"

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
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image
                src="/img/grip3d-logo-trans-128.png"
                alt="GRIP 3D"
                width={40}
                height={40}
                unoptimized
                className="rounded"
              />
              <span className="font-bold text-lg" style={{ color: "var(--text)" }}>
                GRIP 3D
              </span>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            © 2026 GRIP 3D
          </p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            Built for partners • APIs available
          </p>
        </div>
      </div>
    </footer>
  )
}

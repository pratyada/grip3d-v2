import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { useCases, getCategoryLabel } from "@/lib/data"
import { ArrowLeft, Play, FileText } from "lucide-react"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return useCases.map((uc) => ({ slug: uc.slug }))
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const uc = useCases.find((u) => u.slug === slug)
  if (!uc) return {}
  return {
    title: `${uc.title} — GRIP 3D`,
    description: uc.longDescription ?? uc.description,
  }
}

export default async function UseCaseDetailPage({ params }: Props) {
  const { slug } = await params
  const uc = useCases.find((u) => u.slug === slug)
  if (!uc) notFound()

  const isComingSoon = uc.status === "coming-soon"

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {/* Back */}
      <Link
        href="/use-cases"
        className="inline-flex items-center gap-2 text-sm mb-10 hover:opacity-80 transition-opacity"
        style={{ color: "var(--muted)" }}
      >
        <ArrowLeft size={14} />
        Back to all Use Cases
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 mb-10">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="text-xs font-mono font-semibold px-2 py-1 rounded"
            style={{
              background: "var(--accent-dim)",
              color: "var(--accent)",
              border: "1px solid var(--accent)",
            }}
          >
            {uc.id}
          </span>
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{
              background: "var(--surface)",
              color: "var(--muted)",
              border: "1px solid var(--border)",
            }}
          >
            {getCategoryLabel(uc.category)}
          </span>
          {isComingSoon && (
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{
                background: "rgba(255,180,0,0.12)",
                color: "#ffb400",
                border: "1px solid rgba(255,180,0,0.4)",
              }}
            >
              Coming Soon
            </span>
          )}
        </div>

        <h1 className="text-4xl font-bold leading-tight" style={{ color: "var(--text)" }}>
          {uc.emoji} {uc.title}
        </h1>

        <p className="text-lg leading-relaxed max-w-2xl" style={{ color: "var(--muted)" }}>
          {uc.longDescription ?? uc.description}
        </p>
      </div>

      {/* ── LINKS PANEL ── */}
      {!isComingSoon && (uc.demoUrl || uc.detailsUrl) && (
        <div
          className="rounded-2xl p-6 mb-10 flex flex-col gap-4"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--muted)" }}
          >
            Demo Pages
          </p>

          <div className="flex flex-wrap gap-3">
            {/* Full Details Page — the original downloaded HTML */}
            {uc.detailsUrl && (
              <Link
                href={uc.detailsUrl}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm"
                style={{ background: "var(--accent)", color: "#000" }}
              >
                <FileText size={14} />
                Open Details Page
              </Link>
            )}

            {/* Live Demo */}
            {uc.demoUrl && (
              <Link
                href={uc.demoUrl}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm"
                style={{
                  background: "transparent",
                  color: "var(--accent)",
                  border: "1px solid var(--accent)",
                }}
              >
                <Play size={14} fill="currentColor" />
                Open Interactive Demo
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Hero image */}
      <div
        className="relative w-full rounded-2xl overflow-hidden mb-12"
        style={{ height: "clamp(200px, 40vw, 420px)", border: "1px solid var(--border)" }}
      >
        <Image
          src={uc.image}
          alt={uc.title}
          fill
          unoptimized
          className="object-cover"
          style={{ filter: isComingSoon ? "grayscale(50%) brightness(0.7)" : undefined }}
        />
        {isComingSoon && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="px-6 py-3 rounded-2xl text-lg font-bold"
              style={{
                background: "rgba(0,0,0,0.7)",
                color: "#ffb400",
                border: "1px solid rgba(255,180,0,0.4)",
                backdropFilter: "blur(8px)",
              }}
            >
              🚧 Demo in development
            </div>
          </div>
        )}
      </div>

      {/* Highlights + Tags grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {uc.highlights && uc.highlights.length > 0 && (
          <div className="md:col-span-2">
            <h2
              className="text-xs font-semibold uppercase tracking-widest mb-5"
              style={{ color: "var(--muted)" }}
            >
              What you&apos;ll see
            </h2>
            <ul className="flex flex-col gap-3">
              {uc.highlights.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span
                    className="mt-0.5 w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                    style={{ background: "var(--accent-dim)", color: "var(--accent)" }}
                  >
                    ✓
                  </span>
                  <span className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h2
            className="text-xs font-semibold uppercase tracking-widest mb-5"
            style={{ color: "var(--muted)" }}
          >
            Tags
          </h2>
          <div className="flex flex-wrap gap-2">
            {uc.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-3 py-1.5 rounded-full"
                style={{
                  background: "var(--surface)",
                  color: "var(--muted)",
                  border: "1px solid var(--border)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div
        className="mt-16 p-8 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <div>
          <p className="font-semibold text-base mb-1" style={{ color: "var(--text)" }}>
            Want this for your data?
          </p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            We can build a custom version of this use case for your stack.
          </p>
        </div>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm whitespace-nowrap"
          style={{ background: "var(--accent)", color: "#000" }}
        >
          Talk to us →
        </Link>
      </div>
    </div>
  )
}

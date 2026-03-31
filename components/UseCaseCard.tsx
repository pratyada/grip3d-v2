"use client"

import Image from "next/image"
import Link from "next/link"
import type { UseCase } from "@/lib/data"

interface UseCaseCardProps {
  uc: UseCase
}

export function UseCaseCard({ uc }: UseCaseCardProps) {
  const isComingSoon = uc.status === "coming-soon"

  return (
    <div
      className="group rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        opacity: isComingSoon ? 0.72 : 1,
      }}
      onMouseEnter={(e) => {
        if (isComingSoon) return
        const el = e.currentTarget as HTMLDivElement
        el.style.transform = "translateY(-4px)"
        el.style.boxShadow = "0 12px 40px rgba(51,204,221,0.12)"
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.transform = "translateY(0)"
        el.style.boxShadow = "none"
      }}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ height: 200 }}>
        <Image
          src={uc.image}
          alt={uc.title}
          fill
          unoptimized
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          style={{ filter: isComingSoon ? "grayscale(60%) brightness(0.7)" : undefined }}
        />
        {/* Hover overlay */}
        {!isComingSoon && (
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: "rgba(0,0,0,0.35)" }}
          />
        )}
        {/* Emoji badge */}
        <div
          className="absolute top-3 left-3 text-xl w-9 h-9 flex items-center justify-center rounded-lg"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
        >
          {uc.emoji}
        </div>
        {/* Status / ID badge */}
        {isComingSoon ? (
          <div
            className="absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{
              background: "rgba(255,180,0,0.15)",
              color: "#ffb400",
              border: "1px solid rgba(255,180,0,0.4)",
            }}
          >
            Coming Soon
          </div>
        ) : (
          <div
            className="absolute top-3 right-3 text-xs font-mono font-semibold px-2 py-1 rounded"
            style={{
              background: "var(--accent-dim)",
              color: "var(--accent)",
              border: "1px solid var(--accent)",
            }}
          >
            {uc.id}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        <h3 className="font-semibold text-base leading-snug" style={{ color: "var(--text)" }}>
          {uc.title}
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          {uc.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
          {uc.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                background: "var(--surface-2)",
                color: "var(--muted)",
                border: "1px solid var(--border)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-1">
          {isComingSoon ? (
            <div
              className="flex-1 text-center text-sm font-medium py-2 px-3 rounded-xl cursor-not-allowed"
              style={{
                background: "var(--surface-2)",
                color: "var(--muted)",
                border: "1px solid var(--border)",
              }}
            >
              Demo launching soon
            </div>
          ) : (
            <>
              <Link
                href={uc.detailsUrl ?? `/use-cases/${uc.slug}`}
                className="flex-1 text-center text-sm font-medium py-2 px-3 rounded-xl transition-colors duration-150"
                style={{ background: "var(--accent)", color: "#000" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "#2bb8c8"
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "var(--accent)"
                }}
              >
                View details
              </Link>
              <Link
                href={uc.demoUrl ?? `/use-cases/${uc.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center text-sm font-medium py-2 px-3 rounded-xl transition-colors duration-150"
                style={{
                  background: "transparent",
                  color: "var(--accent)",
                  border: "1px solid var(--accent)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "var(--accent-dim)"
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "transparent"
                }}
              >
                Open demo
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

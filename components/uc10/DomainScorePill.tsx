"use client"

import type { DomainStatus } from "@/lib/uc10-data"

interface DomainScorePillProps {
  domainStatus: DomainStatus
}

const DOMAIN_ICONS = ["🛰️", "📡", "📶", "🌐"]
const DOMAIN_LABELS = ["Sat", "GS", "RAN", "Core"]

export function DomainScorePill({ domainStatus }: DomainScorePillProps) {
  const statuses = [
    domainStatus.satellite,
    domainStatus.groundStation,
    domainStatus.ran,
    domainStatus.core,
  ]

  return (
    <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
      {statuses.map((s, i) => {
        const color = s === "PASS" ? "#22c55e" : "#ef4444"
        return (
          <div
            key={i}
            title={`${DOMAIN_LABELS[i]}: ${s}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "3px",
            }}
          >
            <span style={{ fontSize: "11px" }}>{DOMAIN_ICONS[i]}</span>
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: color,
                boxShadow: `0 0 4px ${color}88`,
                display: "inline-block",
              }}
            />
          </div>
        )
      })}
    </div>
  )
}

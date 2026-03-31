"use client"

type DomainType = "satellite" | "groundStation" | "ran" | "core"

interface DomainBadgeProps {
  domain: DomainType
  status?: "PASS" | "FAIL"
  size?: "sm" | "md"
}

const DOMAIN_CONFIG: Record<DomainType, { label: string; icon: string; color: string; bg: string; border: string }> = {
  satellite:    { label: "Satellite",      icon: "🛰️", color: "#c084fc", bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.25)" },
  groundStation:{ label: "Ground Station", icon: "📡", color: "#33ccdd", bg: "rgba(51,204,221,0.12)",  border: "rgba(51,204,221,0.25)" },
  ran:          { label: "RAN",            icon: "📶", color: "#60a5fa", bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.25)" },
  core:         { label: "Core Network",   icon: "🌐", color: "#fb923c", bg: "rgba(251,146,60,0.12)",  border: "rgba(251,146,60,0.25)" },
}

export function DomainBadge({ domain, status, size = "md" }: DomainBadgeProps) {
  const cfg = DOMAIN_CONFIG[domain]
  const statusColor = status === "PASS" ? "#22c55e" : status === "FAIL" ? "#ef4444" : undefined

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: size === "sm" ? "3px 8px" : "4px 12px",
        borderRadius: "20px",
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.color,
        fontSize: size === "sm" ? "10px" : "12px",
        fontWeight: 600,
        letterSpacing: "0.04em",
        whiteSpace: "nowrap",
      }}
    >
      <span>{cfg.icon}</span>
      {cfg.label}
      {status && (
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: statusColor,
            display: "inline-block",
            boxShadow: `0 0 4px ${statusColor}`,
          }}
        />
      )}
    </span>
  )
}

export { DOMAIN_CONFIG }

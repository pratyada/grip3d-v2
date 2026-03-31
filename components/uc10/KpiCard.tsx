"use client"

interface KpiCardProps {
  label: string
  value: string | number
  unit?: string
  threshold?: string
  status?: "pass" | "warn" | "fail" | "info"
  reference?: string
  isBoolean?: boolean
  booleanValue?: boolean
}

const STATUS_COLORS = {
  pass: "#22c55e",
  warn: "#f59e0b",
  fail: "#ef4444",
  info: "#33ccdd",
}

export function KpiCard({ label, value, unit, threshold, status = "info", reference, isBoolean, booleanValue }: KpiCardProps) {
  const color = STATUS_COLORS[status]

  return (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: "10px",
        background: "var(--surface-2)",
        border: `1px solid var(--border)`,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* accent left border */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", background: color, borderRadius: "3px 0 0 3px" }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
        <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", lineHeight: 1.3 }}>
          {label}
        </div>
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: color,
            flexShrink: 0,
            marginTop: "2px",
            boxShadow: `0 0 6px ${color}88`,
          }}
        />
      </div>

      {/* Value */}
      {isBoolean ? (
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "18px", fontWeight: 700, color, lineHeight: 1 }}>
            {booleanValue ? "LOCKED" : "UNLOCKED"}
          </span>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
          <span style={{ fontSize: "22px", fontWeight: 700, color, lineHeight: 1 }}>
            {typeof value === "number" ? (
              Math.abs(value) < 0.001 && value !== 0
                ? value.toExponential(1)
                : value % 1 !== 0 ? value.toFixed(2) : value
            ) : value}
          </span>
          {unit && (
            <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 500 }}>{unit}</span>
          )}
        </div>
      )}

      {/* Threshold */}
      {threshold && (
        <div style={{ fontSize: "10px", color: "var(--muted)", borderTop: "1px solid var(--border)", paddingTop: "6px" }}>
          Threshold: <span style={{ color: "var(--text)" }}>{threshold}</span>
        </div>
      )}

      {/* Reference */}
      {reference && (
        <div style={{ fontSize: "9px", color: "#555", fontStyle: "italic" }}>
          {reference}
        </div>
      )}
    </div>
  )
}

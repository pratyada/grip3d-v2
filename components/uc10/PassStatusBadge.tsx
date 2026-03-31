"use client"

interface PassStatusBadgeProps {
  status: "PASS" | "FAIL"
  size?: "sm" | "md" | "lg"
}

export function PassStatusBadge({ status, size = "md" }: PassStatusBadgeProps) {
  const isPass = status === "PASS"
  const color = isPass ? "#22c55e" : "#ef4444"
  const bg = isPass ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)"

  const sizeStyles = {
    sm: { fontSize: "10px", padding: "2px 7px", borderRadius: "4px" },
    md: { fontSize: "11px", padding: "3px 10px", borderRadius: "5px" },
    lg: { fontSize: "13px", padding: "5px 14px", borderRadius: "6px" },
  }

  return (
    <span
      style={{
        ...sizeStyles[size],
        background: bg,
        color,
        fontWeight: 700,
        letterSpacing: "0.08em",
        border: `1px solid ${color}44`,
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
      }}
    >
      <span
        style={{
          width: "5px",
          height: "5px",
          borderRadius: "50%",
          background: color,
          display: "inline-block",
        }}
      />
      {status}
    </span>
  )
}

"use client"

import type { RanVendor } from "@/lib/uc10-data"

interface VendorBadgeProps {
  vendor: RanVendor
  size?: "sm" | "md"
}

const VENDOR_COLORS: Record<RanVendor, { bg: string; color: string; border: string }> = {
  Nokia:    { bg: "rgba(59,130,246,0.15)", color: "#60a5fa", border: "rgba(59,130,246,0.3)" },
  Ericsson: { bg: "rgba(168,85,247,0.15)", color: "#c084fc", border: "rgba(168,85,247,0.3)" },
  Samsung:  { bg: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "rgba(251,191,36,0.3)" },
  Mavenir:  { bg: "rgba(34,197,94,0.15)",  color: "#4ade80", border: "rgba(34,197,94,0.3)" },
}

export function VendorBadge({ vendor, size = "md" }: VendorBadgeProps) {
  const c = VENDOR_COLORS[vendor]
  const fontSize = size === "sm" ? "10px" : "11px"
  const padding = size === "sm" ? "2px 7px" : "3px 10px"

  return (
    <span
      style={{
        fontSize,
        padding,
        borderRadius: "5px",
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
        fontWeight: 600,
        letterSpacing: "0.04em",
        whiteSpace: "nowrap",
      }}
    >
      {vendor}
    </span>
  )
}

export { VENDOR_COLORS }

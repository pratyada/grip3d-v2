"use client"

import dynamic from "next/dynamic"

const GlobePulse = dynamic(
  () => import("@/components/ui/cobe-globe-pulse").then((m) => ({ default: m.GlobePulse })),
  { ssr: false }
)

export function GlobeWrapper() {
  return <GlobePulse />
}

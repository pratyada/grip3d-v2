import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Global AI Inference Grid — GRIP 3D UC14",
  description:
    "25 GPU clusters across AWS, Azure, GCP, CoreWeave, Lambda, Together, Groq, and Cerebras — live GPU utilization, carbon intensity, P50/P90/P99 inference latency, and carbon-aware request routing on an interactive 3D globe.",
  openGraph: {
    title: "Global AI Inference Grid — GRIP 3D",
    description:
      "Visualize the world's AI compute infrastructure: 25 GPU clusters, 8 hyperscalers, live utilization %, carbon intensity, and inference latency on a rotating globe.",
    siteName: "GRIP 3D",
  },
}

export default function UC14Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

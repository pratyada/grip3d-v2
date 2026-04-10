import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Allow embedding the use case pages in iframes (e.g. WordPress sites)
  async headers() {
    return [
      {
        source: "/uc:path*",
        headers: [
          // Allow framing from any origin
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
          // Permit common features needed by the globe demos
          { key: "Permissions-Policy", value: "autoplay=*, fullscreen=*, picture-in-picture=*, web-share=*, gyroscope=*, accelerometer=*" },
        ],
      },
      {
        source: "/learning",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
          { key: "Permissions-Policy", value: "autoplay=*, fullscreen=*, picture-in-picture=*, web-share=*, gyroscope=*, accelerometer=*" },
        ],
      },
    ]
  },
}

export default nextConfig

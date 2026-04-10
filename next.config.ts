import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Allow embedding the use case pages in iframes (e.g. WordPress sites)
  async headers() {
    return [
      {
        // Matches /uc1, /uc2, ..., /uc30 and any sub-paths like /uc3/details
        source: "/:slug(uc[0-9]+)",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
          { key: "Permissions-Policy", value: "autoplay=*, fullscreen=*, picture-in-picture=*, web-share=*, gyroscope=*, accelerometer=*" },
        ],
      },
      {
        source: "/:slug(uc[0-9]+)/:rest*",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
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
  // Subdomain rewrites — artemis.yprateek.com serves UC3 directly
  async rewrites() {
    return [
      {
        source: "/",
        has: [{ type: "host", value: "artemis.yprateek.com" }],
        destination: "/uc3",
      },
    ]
  },
}

export default nextConfig

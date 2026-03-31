"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"

const navLinks = [
  { label: "About Us", href: "/" },
  { label: "Use Cases", href: "/use-cases" },
  { label: "Integration", href: "/integration" },
  { label: "Leadership", href: "/leadership" },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: "rgba(8,8,8,0.92)",
        borderBottom: "1px solid var(--border)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src="/img/grip3d-logo-trans-128.png"
            alt="GRIP 3D"
            width={36}
            height={36}
            unoptimized
            className="rounded"
          />
          <span className="font-bold text-lg tracking-tight" style={{ color: "var(--text)" }}>
            GRIP 3D
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const active = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-150"
                style={{
                  color: active ? "var(--accent)" : "var(--muted)",
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLAnchorElement).style.color = "var(--text)"
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLAnchorElement).style.color = "var(--muted)"
                }}
              >
                {link.label}
                {active && (
                  <span
                    className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full"
                    style={{ background: "var(--accent)" }}
                  />
                )}
              </Link>
            )
          })}
          <Link
            href="/contact"
            className="ml-2 px-4 py-2 text-sm font-medium rounded-xl transition-colors duration-150"
            style={{
              color: "var(--accent)",
              border: "1px solid var(--accent)",
              background: pathname === "/contact" ? "var(--accent-dim)" : "transparent",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = "var(--accent-dim)"
            }}
            onMouseLeave={(e) => {
              if (pathname !== "/contact") (e.currentTarget as HTMLAnchorElement).style.background = "transparent"
            }}
          >
            Contact Us
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg"
          style={{ color: "var(--muted)" }}
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div
          className="md:hidden px-4 pb-4 flex flex-col gap-1"
          style={{ borderTop: "1px solid var(--border)", background: "var(--bg)" }}
        >
          {navLinks.map((link) => {
            const active = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="px-4 py-3 text-sm font-medium rounded-lg"
                style={{
                  color: active ? "var(--accent)" : "var(--muted)",
                  background: active ? "var(--accent-dim)" : "transparent",
                }}
              >
                {link.label}
              </Link>
            )
          })}
          <Link
            href="/contact"
            onClick={() => setOpen(false)}
            className="mt-1 px-4 py-3 text-sm font-medium rounded-xl text-center"
            style={{
              color: "var(--accent)",
              border: "1px solid var(--accent)",
              background: "transparent",
            }}
          >
            Contact Us
          </Link>
        </div>
      )}
    </header>
  )
}

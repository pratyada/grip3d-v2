"use client"

import { useState, useEffect, useRef } from "react"
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
  const headerRef = useRef<HTMLElement>(null)
  const [headerHeight, setHeaderHeight] = useState(64)

  // Close menu on route change
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Measure header height for dropdown positioning
  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.getBoundingClientRect().height)
    }
  }, [])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  // Prevent body scroll when menu is open on mobile
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [open])

  return (
    <>
      <header
        ref={headerRef}
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
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src="/img/grip3d-logo-trans-128.png"
              alt="GRIP 3D"
              width={56}
              height={56}
              unoptimized
              className="rounded"
            />
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
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg"
            style={{ color: "var(--text)", touchAction: "manipulation" }}
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>
      </header>

      {/* Mobile menu — rendered as a fixed overlay, outside the header stacking context */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40"
          style={{ top: `${headerHeight}px` }}
          aria-label="Mobile navigation"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
            onClick={() => setOpen(false)}
          />
          {/* Menu panel */}
          <div
            className="relative mx-4 mt-2 rounded-2xl overflow-hidden"
            style={{
              background: "rgba(16,16,16,0.97)",
              border: "1px solid var(--border)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
            }}
          >
            <div className="flex flex-col p-3 gap-1">
              {navLinks.map((link) => {
                const active = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center px-4 py-3.5 text-sm font-medium rounded-xl"
                    style={{
                      color: active ? "var(--accent)" : "var(--text)",
                      background: active ? "var(--accent-dim)" : "transparent",
                    }}
                  >
                    {link.label}
                    {active && (
                      <span
                        className="ml-auto w-1.5 h-1.5 rounded-full"
                        style={{ background: "var(--accent)" }}
                      />
                    )}
                  </Link>
                )
              })}
              <div style={{ height: "1px", background: "var(--border)", margin: "4px 0" }} />
              <Link
                href="/contact"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center px-4 py-3.5 text-sm font-semibold rounded-xl"
                style={{
                  color: "var(--accent)",
                  background: "var(--accent-dim)",
                  border: "1px solid rgba(51,204,221,0.3)",
                }}
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

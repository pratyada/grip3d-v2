"use client"

import { useState, useMemo } from "react"
import { Search } from "lucide-react"
import { useCases, getCategoryLabel, getUniqueCategories } from "@/lib/data"
import { UseCaseCard } from "@/components/UseCaseCard"

const allCategories = ["All", ...getUniqueCategories()]

export default function UseCasesPage() {
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("All")

  const filtered = useMemo(() => {
    return useCases.filter((uc) => {
      const matchesCategory =
        activeCategory === "All" || uc.category === activeCategory
      const q = search.toLowerCase()
      const matchesSearch =
        !q ||
        uc.title.toLowerCase().includes(q) ||
        uc.tags.some((t) => t.toLowerCase().includes(q)) ||
        uc.description.toLowerCase().includes(q)
      return matchesCategory && matchesSearch
    })
  }, [search, activeCategory])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero */}
      <div className="flex flex-col gap-4 mb-12">
        <span
          className="inline-flex items-center self-start text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full"
          style={{
            background: "var(--accent-dim)",
            color: "var(--accent)",
            border: "1px solid rgba(51,204,221,0.3)",
          }}
        >
          Demo Use Cases
        </span>
        <h1 className="text-4xl font-bold" style={{ color: "var(--text)" }}>
          Explore all globe scenarios.
        </h1>
        <p className="text-lg" style={{ color: "var(--muted)" }}>
          Industry-specific interactive globe demos. Filter by category or search by tag.
        </p>

        {/* Search */}
        <div className="relative max-w-md mt-2">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2"
            style={{ color: "var(--muted)" }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search use cases, tags…"
            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLInputElement).style.borderColor = "var(--accent)"
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLInputElement).style.borderColor = "var(--border)"
            }}
          />
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-8">
        {allCategories.map((cat) => {
          const label = cat === "All" ? "All" : getCategoryLabel(cat)
          const active = activeCategory === cat
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-colors duration-150"
              style={{
                background: active ? "var(--accent)" : "var(--surface)",
                color: active ? "#000" : "var(--muted)",
                border: active ? "1px solid var(--accent)" : "1px solid var(--border)",
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Count */}
      <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
        Showing {filtered.length} use case{filtered.length !== 1 ? "s" : ""}
        {activeCategory !== "All" && ` in ${getCategoryLabel(activeCategory)}`}
        {search && ` matching "${search}"`}
      </p>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((uc) => (
            <UseCaseCard key={uc.id} uc={uc} />
          ))}
        </div>
      ) : (
        <div
          className="flex flex-col items-center gap-4 py-24 rounded-2xl"
          style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
        >
          <span className="text-5xl">🌍</span>
          <p className="text-lg font-semibold" style={{ color: "var(--text)" }}>
            No use cases found
          </p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Try a different search term or category filter.
          </p>
          <button
            onClick={() => {
              setSearch("")
              setActiveCategory("All")
            }}
            className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: "var(--accent)", color: "#000" }}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}

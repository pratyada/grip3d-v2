import Image from "next/image"
import { leaders } from "@/lib/data"
import type { Leader } from "@/lib/data"
import OpportunityForm from "./OpportunityForm"

function LeaderCard({ leader }: { leader: Leader }) {
  if (leader.isSpecial) {
    return (
      <div
        className="rounded-2xl p-7 flex flex-col items-center gap-4 text-center"
        style={{
          background: "transparent",
          border: "2px dashed var(--accent)",
        }}
      >
        <div
          className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center"
          style={{ background: "var(--surface-2)", border: "2px dashed var(--accent)" }}
        >
          <Image
            src={leader.image}
            alt={leader.name}
            width={96}
            height={96}
            unoptimized
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h3 className="font-bold text-lg mb-1" style={{ color: "var(--accent)" }}>
            {leader.name}
          </h3>
          <span
            className="inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full"
            style={{
              background: "var(--accent-dim)",
              color: "var(--accent)",
              border: "1px solid rgba(51,204,221,0.3)",
            }}
          >
            {leader.role}
          </span>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          {leader.bio}
        </p>
        <div className="flex flex-wrap justify-center gap-1.5 mt-auto">
          {leader.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                background: "var(--surface)",
                color: "var(--muted)",
                border: "1px solid var(--border)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl p-7 flex flex-col items-center gap-4 text-center"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      <div
        className="w-24 h-24 rounded-full overflow-hidden"
        style={{ border: "2px solid var(--border)" }}
      >
        <Image
          src={leader.image}
          alt={leader.name}
          width={96}
          height={96}
          unoptimized
          className="w-full h-full object-cover"
        />
      </div>
      <div>
        <h3 className="font-bold text-lg mb-1" style={{ color: "var(--text)" }}>
          {leader.name}
        </h3>
        <span
          className="inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full"
          style={{
            background: "var(--surface-2)",
            color: "var(--accent)",
            border: "1px solid var(--border)",
          }}
        >
          {leader.role}
        </span>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
        {leader.bio}
      </p>
      <div className="flex flex-wrap justify-center gap-1.5 mt-auto">
        {leader.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              background: "var(--surface-2)",
              color: "var(--muted)",
              border: "1px solid var(--border)",
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function LeadershipPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-14">
        <span
          className="inline-flex items-center self-start text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full"
          style={{
            background: "var(--accent-dim)",
            color: "var(--accent)",
            border: "1px solid rgba(51,204,221,0.3)",
          }}
        >
          Team
        </span>
        <h1 className="text-4xl font-bold" style={{ color: "var(--text)" }}>
          Meet the leadership team.
        </h1>
        <p className="text-lg" style={{ color: "var(--muted)" }}>
          A small, focused team building the future of global operational intelligence.
        </p>
      </div>

      {/* Leader grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
        {leaders.map((leader) => (
          <LeaderCard key={leader.name} leader={leader} />
        ))}
      </div>

      {/* Opportunity form section */}
      <div
        className="rounded-2xl p-8 md:p-12"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <div className="max-w-2xl">
          <span
            className="inline-flex items-center text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full mb-4"
            style={{
              background: "var(--accent-dim)",
              color: "var(--accent)",
              border: "1px solid rgba(51,204,221,0.3)",
            }}
          >
            Opportunities
          </span>
          <h2 className="text-3xl font-bold mb-2 mt-2" style={{ color: "var(--text)" }}>
            Interested in joining?
          </h2>
          <p className="text-base mb-8" style={{ color: "var(--muted)" }}>
            We&apos;re always looking for builders, engineers, and creators who want to work on
            hard problems at the intersection of data, 3D visualization, and global infrastructure.
          </p>
        </div>

        <OpportunityForm />
      </div>
    </div>
  )
}

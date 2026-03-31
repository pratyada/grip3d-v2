"use client"

export function RtpmBadge() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 10px",
        borderRadius: "20px",
        background: "rgba(34,197,94,0.1)",
        border: "1px solid rgba(34,197,94,0.3)",
        fontSize: "10px",
        fontWeight: 600,
        color: "#4ade80",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
      }}
    >
      <span
        style={{
          width: "7px",
          height: "7px",
          borderRadius: "50%",
          background: "#4ade80",
          display: "inline-block",
          animation: "pulse-green 2s ease-in-out infinite",
          boxShadow: "0 0 6px #4ade80",
        }}
      />
      <style>{`
        @keyframes pulse-green {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
      RTPM LIVE — eNB counters ingested every 60s · C/C++ edge pipeline
    </span>
  )
}

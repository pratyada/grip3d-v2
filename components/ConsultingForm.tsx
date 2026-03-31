"use client"

export function ConsultingForm() {
  const inputStyle = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    color: "var(--text)",
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = "var(--accent)"
  }
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = "var(--border)"
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        const email = fd.get("email") as string
        const topic = fd.get("topic") as string
        const msg = fd.get("message") as string
        window.location.href = `mailto:connect@grip3d.com?subject=${encodeURIComponent(topic)}&body=${encodeURIComponent(`From: ${email}\n\n${msg}`)}`
      }}
    >
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--muted)" }}>
          Your email
        </label>
        <input
          type="email"
          name="email"
          required
          placeholder="you@company.com"
          className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
          style={inputStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--muted)" }}>
          Topic
        </label>
        <select
          name="topic"
          required
          className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
          style={inputStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
        >
          <option value="">Select a topic…</option>
          <option value="Demo Request">Demo Request</option>
          <option value="Partnership Inquiry">Partnership Inquiry</option>
          <option value="Consulting Engagement">Consulting Engagement</option>
          <option value="API Access">API Access</option>
          <option value="General Inquiry">General Inquiry</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--muted)" }}>
          Message
        </label>
        <textarea
          name="message"
          required
          rows={5}
          placeholder="Tell us about your use case…"
          className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors resize-none"
          style={inputStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>
      <button
        type="submit"
        className="w-full py-3 rounded-xl font-semibold text-sm transition-colors duration-150"
        style={{ background: "var(--accent)", color: "#000" }}
      >
        Send message →
      </button>
    </form>
  )
}

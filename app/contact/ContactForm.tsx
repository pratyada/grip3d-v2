"use client"

export default function ContactForm() {
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        const email = fd.get("email") as string
        const msg = fd.get("message") as string
        window.location.href = `mailto:connect@grip3d.com?subject=${encodeURIComponent("Contact from grip3d.com")}&body=${encodeURIComponent(`From: ${email}\n\n${msg}`)}`
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
          className="w-full rounded-xl px-4 py-3 text-sm outline-none"
          style={{
            background: "var(--surface-2)",
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
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--muted)" }}>
          Message
        </label>
        <textarea
          name="message"
          required
          rows={6}
          placeholder="Tell us about your use case, data needs, or integration question…"
          className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            color: "var(--text)",
          }}
          onFocus={(e) => {
            (e.currentTarget as HTMLTextAreaElement).style.borderColor = "var(--accent)"
          }}
          onBlur={(e) => {
            (e.currentTarget as HTMLTextAreaElement).style.borderColor = "var(--border)"
          }}
        />
      </div>
      <button
        type="submit"
        className="w-full py-3 rounded-xl font-semibold text-sm"
        style={{ background: "var(--accent)", color: "#000" }}
      >
        Send message →
      </button>
    </form>
  )
}

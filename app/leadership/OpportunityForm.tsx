"use client"

export default function OpportunityForm() {
  const inputStyle = {
    background: "var(--surface-2)",
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
      className="grid grid-cols-1 md:grid-cols-2 gap-5"
      onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        const name = fd.get("name") as string
        const email = fd.get("email") as string
        const phone = fd.get("phone") as string
        const lang = fd.get("lang") as string
        const years = fd.get("years") as string
        const msg = fd.get("message") as string
        const body = `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nCoding Language: ${lang}\nYears Experience: ${years}\n\n${msg}`
        window.location.href = `mailto:contact@grip3d.com?subject=${encodeURIComponent("I am interested in opportunity")}&body=${encodeURIComponent(body)}`
      }}
    >
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--muted)" }}>
          Full name
        </label>
        <input
          type="text"
          name="name"
          required
          placeholder="Jane Smith"
          className="w-full rounded-xl px-4 py-3 text-sm outline-none"
          style={inputStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--muted)" }}>
          Email address
        </label>
        <input
          type="email"
          name="email"
          required
          placeholder="jane@company.com"
          className="w-full rounded-xl px-4 py-3 text-sm outline-none"
          style={inputStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--muted)" }}>
          Phone (optional)
        </label>
        <input
          type="tel"
          name="phone"
          placeholder="+1 555 000 0000"
          className="w-full rounded-xl px-4 py-3 text-sm outline-none"
          style={inputStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--muted)" }}>
          Primary coding language
        </label>
        <select
          name="lang"
          required
          className="w-full rounded-xl px-4 py-3 text-sm outline-none"
          style={inputStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
        >
          <option value="">Select…</option>
          <option value="TypeScript">TypeScript</option>
          <option value="JavaScript">JavaScript</option>
          <option value="Python">Python</option>
          <option value="Rust">Rust</option>
          <option value="Go">Go</option>
          <option value="C++">C++</option>
          <option value="Java">Java</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--muted)" }}>
          Years of experience
        </label>
        <select
          name="years"
          required
          className="w-full rounded-xl px-4 py-3 text-sm outline-none"
          style={inputStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
        >
          <option value="">Select…</option>
          <option value="0-2 years">0–2 years</option>
          <option value="3-5 years">3–5 years</option>
          <option value="6-10 years">6–10 years</option>
          <option value="10+ years">10+ years</option>
        </select>
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--muted)" }}>
          Tell us about yourself
        </label>
        <textarea
          name="message"
          required
          rows={5}
          placeholder="What excites you about GRIP 3D? What would you build?"
          className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
          style={inputStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>
      <div className="md:col-span-2">
        <button
          type="submit"
          className="px-8 py-3 rounded-xl font-semibold text-sm"
          style={{ background: "var(--accent)", color: "#000" }}
        >
          Express interest →
        </button>
      </div>
    </form>
  )
}

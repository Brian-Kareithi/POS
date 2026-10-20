export function AuthHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-7">
      <h2 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h2>
      {subtitle && <p className="mt-1.5 text-sm leading-6 text-gray-500">{subtitle}</p>}
    </div>
  )
}

export function AuthAlert({ tone = "error", title, children }: { tone?: "error" | "waiting" | "success"; title?: string; children: React.ReactNode }) {
  const styles = {
    error: "border-red-200 bg-red-50 text-red-700",
    waiting: "border-amber-200 bg-amber-50 text-amber-800",
    success: "border-green-200 bg-green-50 text-green-800",
  }[tone]
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`mb-5 rounded-xl border p-3.5 text-sm ${styles}`}>
      {title && <span className="mb-0.5 block font-semibold">{title}</span>}
      {children}
    </div>
  )
}

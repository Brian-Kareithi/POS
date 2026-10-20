import { toast } from "sonner"
import { AlertTriangle, Check, Info, X } from "lucide-react"

type Kind = "success" | "error" | "warning" | "info"

const STYLE: Record<Kind, { badge: string; icon: React.ReactNode }> = {
  success: { badge: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400", icon: <Check className="h-3.5 w-3.5" strokeWidth={3} /> },
  error: { badge: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400", icon: <X className="h-3.5 w-3.5" strokeWidth={3} /> },
  warning: { badge: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400", icon: <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.5} /> },
  info: { badge: "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300", icon: <Info className="h-3.5 w-3.5" strokeWidth={2.5} /> },
}

function show(kind: Kind, title: string, description?: string, duration = 3500) {
  const s = STYLE[kind]
  return toast.custom(
    (id) => (
      <div
        role={kind === "error" ? "alert" : "status"}
        onClick={() => toast.dismiss(id)}
        className="pointer-events-auto flex w-[min(340px,calc(100vw-1.5rem))] cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-[0_6px_24px_-8px_rgba(0,0,0,0.18)] dark:border-white/10 dark:bg-neutral-900"
      >
        <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${s.badge}`}>{s.icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium leading-5 text-gray-900 dark:text-gray-100">{title}</span>
          {description && <span className="line-clamp-2 block text-xs leading-4 text-gray-500 dark:text-gray-400">{description}</span>}
        </span>
      </div>
    ),
    { duration }
  )
}

/** One place for all toasts so wording and behaviour stay consistent. Click a toast to dismiss it. */
export const notify = {
  success: (title: string, description?: string) => show("success", title, description),
  error: (title: string, description?: string) => show("error", title, description, 5500),
  warning: (title: string, description?: string) => show("warning", title, description, 5000),
  info: (title: string, description?: string) => show("info", title, description),
}

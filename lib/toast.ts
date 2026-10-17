import { toast } from "sonner"

/** One place for all toasts so wording and behaviour stay consistent. */
export const notify = {
  success: (title: string, description?: string) => toast.success(title, { description }),
  error: (title: string, description?: string) => toast.error(title, { description, duration: 7000 }),
  warning: (title: string, description?: string) => toast.warning(title, { description, duration: 6000 }),
  info: (title: string, description?: string) => toast.info(title, { description }),
}

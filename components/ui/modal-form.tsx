"use client"

import { useForm, type UseFormReturn, type SubmitHandler, type FieldValues, type DefaultValues, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { ZodSchema } from "zod"
import { Dialog } from "./dialog"
import { Button } from "./button"

interface ModalFormProps<T extends FieldValues> {
  open: boolean
  onClose: () => void
  title: string
  schema: ZodSchema
  defaultValues?: DefaultValues<T>
  onSubmit: SubmitHandler<T>
  children: (form: UseFormReturn<T>) => React.ReactNode
  submitLabel?: string
  size?: "sm" | "md" | "lg" | "xl"
  isLoading?: boolean
}

export function ModalForm<T extends FieldValues>({
  open,
  onClose,
  title,
  schema,
  defaultValues,
  onSubmit,
  children,
  submitLabel = "Save",
  size = "md",
  isLoading,
}: ModalFormProps<T>) {
  const form = useForm<T>({
    resolver: zodResolver(schema) as Resolver<T>,
    defaultValues,
  })

  return (
    <Dialog open={open} onClose={onClose} title={title} size={size}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {children(form)}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

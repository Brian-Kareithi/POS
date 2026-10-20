"use client"

import { useState } from "react"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { api, ApiError, errorMessage } from "@/lib/api/client"
import { clean } from "@/lib/api/mappers"
import { useDataStore } from "@/lib/stores/data-store"
import type { Category } from "@/lib/types"

interface Props {
  open: boolean
  /** Pass a category to edit it; leave out to create one. */
  category?: Category | null
  onClose: () => void
  onSaved: (category: Category) => void
  /** Called when the server says the person may not change categories. */
  onDenied?: () => void
}

export function CategoryDialog(props: Props) {
  return props.open ? <Form key={props.category?.id ?? "new"} {...props} /> : null
}

/** The category and everything below it, so a category can never be moved under its own child. */
function descendantsOf(all: Category[], id: string): Set<string> {
  const out = new Set<string>([id])
  let grew = true
  while (grew) {
    grew = false
    for (const c of all) if (c.parentId && out.has(c.parentId) && !out.has(c.id)) { out.add(c.id); grew = true }
  }
  return out
}

function Form({ category, onClose, onSaved, onDenied }: Props) {
  const categories = useDataStore((s) => s.categories)
  const [name, setName] = useState(category?.name ?? "")
  const [description, setDescription] = useState(category?.description ?? "")
  const [parentId, setParentId] = useState(category?.parentId ?? "")
  const [isActive, setIsActive] = useState(category?.isActive ?? true)
  const [errors, setErrors] = useState<{ name?: string; description?: string; form?: string }>({})
  const [saving, setSaving] = useState(false)

  const blocked = category ? descendantsOf(categories, category.id) : new Set<string>()
  const parents = categories.filter((c) => c.isActive && !blocked.has(c.id))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    const trimmed = name.trim()
    if (trimmed.length < 1) next.name = "Enter a name."
    else if (trimmed.length > 120) next.name = "The name can be at most 120 characters."
    if (description.length > 500) next.description = "The description can be at most 500 characters."
    setErrors(next)
    if (next.name || next.description) return

    setSaving(true)
    try {
      const body = category
        ? {
            ...(trimmed !== category.name ? { name: trimmed } : {}),
            ...((description.trim() || null) !== (category.description ?? null) ? { description: description.trim() || null } : {}),
            ...((parentId || null) !== (category.parentId ?? null) ? { parentId: parentId || null } : {}),
            ...(isActive !== category.isActive ? { isActive } : {}),
          }
        : { name: trimmed, isActive, ...(description.trim() ? { description: description.trim() } : {}), ...(parentId ? { parentId } : {}) }
      const saved = category && Object.keys(body).length === 0
        ? category
        : clean<Category>(await api(category ? `/categories/${category.id}` : "/categories", { method: category ? "PATCH" : "POST", body }))
      useDataStore.getState().upsert("categories", saved)
      onSaved(saved)
    } catch (err) {
      if (err instanceof ApiError && err.code === "PERMISSION_DENIED") onDenied?.()
      setErrors({ form: errorMessage(err, "Could not save the category.") })
    }
    setSaving(false)
  }

  return (
    <Dialog open onClose={saving ? () => {} : onClose} title={category ? "Edit category" : "Add category"} size="sm">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} autoFocus maxLength={200} />
        <Textarea label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} error={errors.description} />
        <Select
          label="Parent category (optional)"
          placeholder="None (top-level)"
          options={parents.map((c) => ({ value: c.id, label: c.name }))}
          value={parentId}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setParentId(e.target.value)}
        />
        <div className="flex items-center justify-between gap-4 rounded-xl bg-gray-50 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-gray-900">Active</p>
            <p className="text-xs text-gray-500">Inactive categories can&apos;t be picked for new products.</p>
          </div>
          <Switch checked={isActive} onChange={setIsActive} aria-label="Active" />
        </div>
        {errors.form && <p role="alert" className="text-sm text-red-600">{errors.form}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" isLoading={saving}>{category ? "Save changes" : "Add category"}</Button>
        </div>
      </form>
    </Dialog>
  )
}

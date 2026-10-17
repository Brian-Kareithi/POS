export type Row = Record<string, string | number | null | undefined>

function download(content: BlobPart, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const csvCell = (v: Row[string]) => {
  const s = v == null ? "" : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function exportCSV(rows: Row[], filename: string) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const lines = [headers.map(csvCell).join(","), ...rows.map((r) => headers.map((h) => csvCell(r[h])).join(","))]
  download("﻿" + lines.join("\n"), `${filename}.csv`, "text/csv;charset=utf-8")
}

/** Excel opens an HTML table saved as .xls, so no extra library is needed. */
export function exportExcel(rows: Row[], filename: string) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const esc = (v: Row[string]) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;")
  const html = `<html><head><meta charset="utf-8"></head><body><table border="1"><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${headers.map((h) => `<td>${esc(r[h])}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`
  download(html, `${filename}.xls`, "application/vnd.ms-excel")
}

export function exportJSON(data: unknown, filename: string) {
  download(JSON.stringify(data, null, 2), `${filename}.json`, "application/json")
}

export const printPage = () => window.print()

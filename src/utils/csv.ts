// Fields here can come straight from a user's own display name — a leading
// =, +, -, @ (or tab) makes Excel/Sheets read the cell as a formula instead
// of text (CSV/TSV formula injection). Prefixing with a plain quote forces
// it back to a literal value without changing what's visibly shown.
const FORMULA_PREFIX_RE = /^[=+\-@\t\r]/

function sanitizeFormulaInjection(field: string): string {
  return FORMULA_PREFIX_RE.test(field) ? `'${field}` : field
}

function escapeCsvField(field: string): string {
  const safe = sanitizeFormulaInjection(field)
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

export function toCsv(rows: string[][]): string {
  return rows.map(row => row.map(escapeCsvField).join(',')).join('\r\n')
}

export function toTsv(rows: string[][]): string {
  return rows.map(row => row.map(sanitizeFormulaInjection).join('\t')).join('\n')
}

export function downloadCsv(filename: string, rows: string[][]): void {
  // BOM al inicio para que Excel detecte UTF-8 y no rompa acentos/ñ
  const blob = new Blob(['﻿' + toCsv(rows)], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

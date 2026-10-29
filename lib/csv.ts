// Minimaler CSV-Parser für Excel-Exporte (Trennzeichen ; oder , mit "…"-Quoting).
export function parseCsv(text: string): Record<string, string>[] {
  const clean = text.replace(/^﻿/, "")
  const firstLine = clean.slice(0, clean.indexOf("\n") === -1 ? undefined : clean.indexOf("\n"))
  const sep = (firstLine.match(/;/g)?.length ?? 0) >= (firstLine.match(/,/g)?.length ?? 0) ? ";" : ","
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let quoted = false
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i]
    if (quoted) {
      if (c === '"' && clean[i + 1] === '"') { field += '"'; i++ }
      else if (c === '"') quoted = false
      else field += c
    } else if (c === '"') quoted = true
    else if (c === sep) { row.push(field); field = "" }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && clean[i + 1] === "\n") i++
      row.push(field); field = ""
      if (row.some((f) => f.trim() !== "")) rows.push(row)
      row = []
    } else field += c
  }
  row.push(field)
  if (row.some((f) => f.trim() !== "")) rows.push(row)
  const [header, ...body] = rows
  if (!header) return []
  const keys = header.map((h) => h.trim().toLowerCase())
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? "").trim()])))
}

// "12,50" / "12.50" / "1.234,50 €" → 12.5; leer → null
export function parsePrice(value: string | undefined): number | null | undefined {
  if (value === undefined) return undefined
  const v = value.replace(/[€\s]/g, "")
  if (v === "") return null
  const normalized = v.includes(",") ? v.replace(/\./g, "").replace(",", ".") : v
  const n = Number(normalized)
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : undefined
}

// Erzeugt supabase/seed.sql aus data/artikel.csv (Katalog-Import).
// Aufruf: npm run seed:sql
import { readFileSync, writeFileSync } from "node:fs"

const text = readFileSync(new URL("../data/artikel.csv", import.meta.url), "utf8").replace(/^﻿/, "")
const lines = []
let field = "", row = [], quoted = false
for (let i = 0; i < text.length; i++) {
  const c = text[i]
  if (quoted) {
    if (c === '"' && text[i + 1] === '"') { field += '"'; i++ } else if (c === '"') quoted = false; else field += c
  } else if (c === '"') quoted = true
  else if (c === ";") { row.push(field); field = "" }
  else if (c === "\n") { row.push(field.replace(/\r$/, "")); lines.push(row); row = []; field = "" }
  else field += c
}
if (field || row.length) { row.push(field); lines.push(row) }
const [header, ...rows] = lines.filter((r) => r.some((f) => f.trim()))
const idx = Object.fromEntries(header.map((h, i) => [h.trim(), i]))

const q = (v) => (v === "" || v == null ? "null" : `'${String(v).replace(/'/g, "''")}'`)
const out = ["-- Automatisch erzeugt aus data/artikel.csv – nicht von Hand bearbeiten.", "begin;"]
for (let i = 0; i < rows.length; i += 500) {
  const chunk = rows.slice(i, i + 500).map((r) => {
    const g = (k) => (r[idx[k]] ?? "").trim()
    const price = g("listenpreis") ? Number(g("listenpreis").replace(/\./g, "").replace(",", ".")) : null
    return `(${q(g("artikelnummer"))},${q(g("bestellnummer"))},${q(g("name"))},${q(g("variante"))},${q(g("marke"))},(select id from public.categories where name=${q(g("kategorie"))}),${g("katalogseite") || "null"},${price ?? "null"})`
  })
  out.push(
    "insert into public.products (sku, order_no, name, variant, brand, category_id, catalog_page, list_price) values\n" +
      chunk.join(",\n") +
      "\non conflict (sku) do update set order_no=excluded.order_no, name=excluded.name, variant=excluded.variant, brand=excluded.brand, category_id=excluded.category_id, catalog_page=excluded.catalog_page, list_price=coalesce(excluded.list_price, public.products.list_price), updated_at=now();"
  )
}
out.push("commit;")
writeFileSync(new URL("../supabase/seed.sql", import.meta.url), out.join("\n") + "\n")
console.log(`${rows.length} Artikel → supabase/seed.sql`)

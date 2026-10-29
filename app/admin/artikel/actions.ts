"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/auth"
import { db } from "@/lib/supabase/admin"
import { parseCsv, parsePrice } from "@/lib/csv"
import type { Product, Category } from "@/lib/types"

export async function updateProduct(id: number, formData: FormData) {
  await requireAdmin()
  const price = parsePrice(String(formData.get("list_price") ?? ""))
  const update: Partial<Product> & { updated_at: string } = { active: formData.get("active") === "on", updated_at: new Date().toISOString() }
  if (price !== undefined) update.list_price = price
  await db().from("products").update(update).eq("id", id)
  revalidatePath("/admin/artikel")
}

export async function createProduct(formData: FormData) {
  await requireAdmin()
  const get = (k: string) => String(formData.get(k) ?? "").trim()
  if (!get("sku") || !get("name") || !get("category_id")) return
  await db().from("products").insert({
    sku: get("sku"),
    order_no: get("order_no") || null,
    name: get("name"),
    variant: get("variant") || null,
    brand: get("brand") || null,
    category_id: Number(get("category_id")),
    list_price: parsePrice(get("list_price")) ?? null,
  })
  revalidatePath("/admin/artikel")
}

export type ImportResult = { updated: number; created: number; skipped: string[]; error?: string }

// CSV-Import: Spalte "artikelnummer" ist Pflicht. Alle anderen Spalten sind optional;
// leere Zellen ändern bestehende Werte NICHT (so kann man z. B. nur Preise einspielen).
export async function importCsv(_: ImportResult | null, formData: FormData): Promise<ImportResult> {
  await requireAdmin()
  const file = formData.get("file")
  if (!(file instanceof File) || file.size === 0) return { updated: 0, created: 0, skipped: [], error: "Bitte eine CSV-Datei auswählen." }
  const buf = Buffer.from(await file.arrayBuffer())
  let text = buf.toString("utf8")
  if (text.includes("�")) text = buf.toString("latin1") // Excel speichert CSV oft als Windows-1252
  const rows = parseCsv(text)
  if (rows.length === 0 || !("artikelnummer" in rows[0])) {
    return { updated: 0, created: 0, skipped: [], error: "Die erste Zeile muss Spaltennamen enthalten, mindestens „artikelnummer“." }
  }

  const client = db()
  const { data: cats } = await client.from("categories").select("*")
  const catByName = new Map(((cats ?? []) as Category[]).map((c) => [c.name.toLowerCase(), c.id]))
  const existing = new Map<string, Product>()
  for (let from = 0; ; from += 1000) {
    const { data } = await client.from("products").select("*").range(from, from + 999)
    ;(data ?? []).forEach((p) => existing.set(p.sku, p as Product))
    if (!data || data.length < 1000) break
  }

  const upserts: Omit<Product, "id" | "description" | "image_url">[] = []
  const skipped: string[] = []
  let created = 0
  for (const r of rows) {
    const sku = r["artikelnummer"]
    if (!sku) continue
    const old = existing.get(sku)
    const price = parsePrice(r["listenpreis"])
    const catId = r["kategorie"] ? catByName.get(r["kategorie"].toLowerCase()) : undefined
    if (r["kategorie"] && !catId) {
      skipped.push(`${sku}: unbekannte Kategorie „${r["kategorie"]}“`)
      continue
    }
    if (r["listenpreis"] && price === undefined) {
      skipped.push(`${sku}: Preis „${r["listenpreis"]}“ nicht lesbar`)
      continue
    }
    if (!old && (!r["name"] || !catId)) {
      skipped.push(`${sku}: neuer Artikel braucht „name“ und „kategorie“`)
      continue
    }
    const pick = (k: string, fallback: string | null) => (r[k] ? r[k] : fallback)
    upserts.push({
      sku,
      order_no: pick("bestellnummer", old?.order_no ?? null),
      name: pick("name", old?.name ?? "")!,
      variant: pick("variante", old?.variant ?? null),
      brand: pick("marke", old?.brand ?? null),
      category_id: catId ?? old!.category_id,
      catalog_page: r["katalogseite"] ? Number(r["katalogseite"]) || null : old?.catalog_page ?? null,
      list_price: price ?? (r["listenpreis"] === "" || r["listenpreis"] === undefined ? old?.list_price ?? null : null),
      active: r["aktiv"] ? !["0", "nein", "false"].includes(r["aktiv"].toLowerCase()) : old?.active ?? true,
    })
    if (!old) created++
  }

  for (let i = 0; i < upserts.length; i += 500) {
    const { error } = await client
      .from("products")
      .upsert(upserts.slice(i, i + 500).map((u) => ({ ...u, updated_at: new Date().toISOString() })), { onConflict: "sku" })
    if (error) return { updated: 0, created: 0, skipped, error: `Fehler beim Speichern: ${error.message}` }
  }
  revalidatePath("/admin/artikel")
  revalidatePath("/katalog")
  return { updated: upserts.length - created, created, skipped }
}

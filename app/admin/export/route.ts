import { NextResponse } from "next/server"
import { getProfile } from "@/lib/auth"
import { db } from "@/lib/supabase/admin"
import { getCategories } from "@/lib/catalog"
import type { Product } from "@/lib/types"

// Alle Artikel als CSV (Excel-kompatibel) – bearbeiten und über "Import" wieder hochladen.
export async function GET() {
  const profile = await getProfile()
  if (!profile?.is_admin) return new NextResponse("Nicht erlaubt", { status: 403 })
  const categories = new Map((await getCategories()).map((c) => [c.id, c.name]))
  const products: Product[] = []
  for (let from = 0; ; from += 1000) {
    const { data } = await db().from("products").select("*").order("category_id").order("name").order("sku").range(from, from + 999)
    products.push(...((data ?? []) as Product[]))
    if (!data || data.length < 1000) break
  }
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v)
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const header = ["artikelnummer", "bestellnummer", "name", "variante", "kategorie", "marke", "katalogseite", "listenpreis", "aktiv"]
  const lines = products.map((p) =>
    [p.sku, p.order_no, p.name, p.variant, categories.get(p.category_id), p.brand, p.catalog_page, p.list_price == null ? "" : Number(p.list_price).toFixed(2).replace(".", ","), p.active ? "ja" : "nein"]
      .map(esc)
      .join(";")
  )
  return new NextResponse("﻿" + [header.join(";"), ...lines].join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="artikel-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}

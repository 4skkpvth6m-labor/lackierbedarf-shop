import Link from "next/link"
import { db } from "@/lib/supabase/admin"
import { getCategories, searchFilter } from "@/lib/catalog"
import type { Product } from "@/lib/types"
import { updateProduct, createProduct } from "./actions"
import SubmitButton from "@/components/SubmitButton"

const PAGE_SIZE = 50

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ q?: string; kategorie?: string; ohnepreis?: string; seite?: string }> }) {
  const sp = await searchParams
  const categories = await getCategories()
  const page = Math.max(1, Number(sp.seite) || 1)
  let query = db().from("products").select("*", { count: "exact" })
  const cat = categories.find((c) => c.slug === sp.kategorie)
  if (cat) query = query.eq("category_id", cat.id)
  if (sp.ohnepreis) query = query.is("list_price", null)
  const filter = searchFilter(sp.q ?? "")
  if (filter) query = query.or(filter)
  const { data, count } = await query.order("category_id").order("name").order("sku").range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
  const products = (data ?? []) as Product[]
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))
  const catName = new Map(categories.map((c) => [c.id, c.name]))
  const qs = (seite: number) => {
    const p = new URLSearchParams()
    if (sp.q) p.set("q", sp.q)
    if (sp.kategorie) p.set("kategorie", sp.kategorie)
    if (sp.ohnepreis) p.set("ohnepreis", "1")
    p.set("seite", String(seite))
    return `/admin/artikel?${p}`
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Artikel & Listenpreise</h1>
          <p className="text-sm text-slate-500">{count ?? 0} Artikel · Preise netto, Komma oder Punkt möglich</p>
        </div>
        <form className="flex flex-wrap gap-2">
          <input name="q" defaultValue={sp.q} placeholder="Suche…" className="input w-56" />
          <select name="kategorie" defaultValue={sp.kategorie ?? ""} className="input w-52">
            <option value="">Alle Kategorien</option>
            {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
          </select>
          <label className="flex items-center gap-1 text-sm"><input type="checkbox" name="ohnepreis" value="1" defaultChecked={!!sp.ohnepreis} /> nur ohne Preis</label>
          <button className="btn">Filtern</button>
        </form>
      </div>

      <details className="card p-4">
        <summary className="cursor-pointer font-semibold">+ Neuen Artikel anlegen</summary>
        <form action={createProduct} className="mt-4 grid gap-3 sm:grid-cols-4">
          <input name="sku" required placeholder="Artikelnummer *" className="input" />
          <input name="order_no" placeholder="Bestellnummer" className="input" />
          <input name="name" required placeholder="Bezeichnung *" className="input sm:col-span-2" />
          <input name="variant" placeholder="Variante (Größe, Körnung…)" className="input sm:col-span-2" />
          <input name="brand" placeholder="Marke" className="input" />
          <select name="category_id" required className="input">
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input name="list_price" placeholder="Listenpreis netto" inputMode="decimal" className="input" />
          <SubmitButton>Anlegen</SubmitButton>
        </form>
      </details>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="table-head">
            <tr>
              <th className="px-3 py-2">Art.-Nr.</th>
              <th className="px-3 py-2">Artikel</th>
              <th className="px-3 py-2">Kategorie</th>
              <th className="px-3 py-2 text-right">Listenpreis € / aktiv</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((p) => (
              <tr key={p.id} className={p.active ? "" : "bg-slate-50 text-slate-400"}>
                <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">{p.sku}<div className="text-slate-400">{p.order_no}</div></td>
                <td className="px-3 py-2"><div className="font-medium">{p.name}</div><div className="text-slate-500">{p.variant}</div></td>
                <td className="px-3 py-2 text-slate-600">{catName.get(p.category_id)}{p.brand && <div className="text-xs text-slate-400">{p.brand}</div>}</td>
                <td className="px-3 py-2">
                  <form action={updateProduct.bind(null, p.id)} className="flex items-center justify-end gap-2">
                    <input
                      name="list_price"
                      defaultValue={p.list_price == null ? "" : Number(p.list_price).toFixed(2).replace(".", ",")}
                      placeholder="–"
                      inputMode="decimal"
                      className={`input !w-24 !py-1 text-right ${p.list_price == null ? "border-amber-300 bg-amber-50" : ""}`}
                    />
                    <input type="checkbox" name="active" defaultChecked={p.active} title="Im Shop sichtbar" className="h-4 w-4" />
                    <SubmitButton className="btn-secondary !px-2 !py-1">Speichern</SubmitButton>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <nav className="flex items-center justify-center gap-2 text-sm">
          {page > 1 && <Link className="btn-secondary" href={qs(page - 1)}>← Zurück</Link>}
          <span className="px-2 text-slate-600">Seite {page} von {pages}</span>
          {page < pages && <Link className="btn-secondary" href={qs(page + 1)}>Weiter →</Link>}
        </nav>
      )}
    </div>
  )
}

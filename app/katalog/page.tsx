import Link from "next/link"
import { getProfile, canSeePrices } from "@/lib/auth"
import { getCategories, searchFilter } from "@/lib/catalog"
import { db } from "@/lib/supabase/admin"
import { loadDiscounts, discountFor, customerPrice } from "@/lib/pricing"
import { formatEur, formatPercent } from "@/lib/format"
import type { Product } from "@/lib/types"
import AddToCart from "@/components/AddToCart"

const PAGE_SIZE = 50

type Search = { kategorie?: string; q?: string; marke?: string; seite?: string }

export default async function CatalogPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams
  const [profile, categories] = await Promise.all([getProfile(), getCategories()])
  const showPrices = canSeePrices(profile)
  const discounts = showPrices && profile ? await loadDiscounts(profile) : null

  const category = categories.find((c) => c.slug === sp.kategorie)
  const page = Math.max(1, Number(sp.seite) || 1)
  const q = (sp.q ?? "").trim()

  let query = db().from("products").select("*", { count: "exact" }).eq("active", true)
  if (category) query = query.eq("category_id", category.id)
  if (sp.marke) query = query.eq("brand", sp.marke)
  const filter = searchFilter(q)
  if (filter) query = query.or(filter)
  const { data, count } = await query
    .order("category_id")
    .order("name")
    .order("sku")
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
  const products = (data ?? []) as Product[]
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))

  let brands: string[] = []
  if (category) {
    const { data: b } = await db().from("products").select("brand").eq("category_id", category.id).not("brand", "is", null).limit(1000)
    brands = [...new Set((b ?? []).map((r) => r.brand as string))].sort()
  }

  const link = (over: Partial<Search>) => {
    const params = new URLSearchParams()
    const merged = { kategorie: sp.kategorie, q: sp.q, marke: sp.marke, ...over }
    Object.entries(merged).forEach(([k, v]) => v && params.set(k, String(v)))
    return `/katalog?${params}`
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[14rem_1fr]">
      <aside className="space-y-1 text-sm">
        <h2 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Kategorien</h2>
        <Link href={link({ kategorie: undefined, marke: undefined, seite: undefined })} className={`block rounded px-2 py-1.5 ${!category ? "bg-brand-50 font-semibold text-brand-700" : "hover:bg-slate-100"}`}>
          Alle Artikel
        </Link>
        {categories.map((c) => (
          <Link key={c.id} href={link({ kategorie: c.slug, marke: undefined, seite: undefined })} className={`block rounded px-2 py-1.5 ${category?.id === c.id ? "bg-brand-50 font-semibold text-brand-700" : "hover:bg-slate-100"}`}>
            {c.name}
            {discounts && discountFor(discounts, c.id) > 0 && (
              <span className="ml-1 text-xs font-semibold text-green-700">−{formatPercent(discountFor(discounts, c.id))}</span>
            )}
          </Link>
        ))}
      </aside>

      <section className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{category?.name ?? "Alle Artikel"}</h1>
            <p className="text-sm text-slate-500">{count ?? 0} Artikel</p>
          </div>
          <form className="flex gap-2" action="/katalog">
            {sp.kategorie && <input type="hidden" name="kategorie" value={sp.kategorie} />}
            <input name="q" defaultValue={q} placeholder="Suche: Name, Art.-Nr., Marke…" className="input w-72" />
            <button className="btn">Suchen</button>
          </form>
        </div>

        {brands.length > 1 && (
          <div className="flex flex-wrap gap-2 text-sm">
            <Link href={link({ marke: undefined, seite: undefined })} className={`rounded-full border px-3 py-1 ${!sp.marke ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-300 bg-white"}`}>Alle Marken</Link>
            {brands.map((b) => (
              <Link key={b} href={link({ marke: b, seite: undefined })} className={`rounded-full border px-3 py-1 ${sp.marke === b ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-300 bg-white"}`}>{b}</Link>
            ))}
          </div>
        )}

        {!showPrices && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            {profile ? "Ihr Konto wartet noch auf Freigabe – danach sehen Sie hier Ihre Preise." : (
              <>Preise sehen Sie nach <Link href="/login" className="font-semibold underline">Anmeldung</Link> mit einem freigegebenen <Link href="/registrieren" className="font-semibold underline">Kundenkonto</Link>.</>
            )}
          </p>
        )}

        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="table-head">
              <tr>
                <th className="px-3 py-2">Art.-Nr.</th>
                <th className="px-3 py-2">Artikel</th>
                {showPrices && <th className="px-3 py-2 text-right">Listenpreis</th>}
                {showPrices && <th className="px-3 py-2 text-right">Ihr Preis</th>}
                {showPrices && <th className="px-3 py-2" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => {
                const pct = discounts ? discountFor(discounts, p.category_id) : 0
                const yours = customerPrice(p.list_price, pct)
                return (
                  <tr key={p.id} className="align-top hover:bg-slate-50">
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-slate-600">
                      {p.sku}
                      {p.order_no && <div className="text-slate-400">{p.order_no}</div>}
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-medium">{p.name}</div>
                      {p.variant && <div className="text-slate-600">{p.variant}</div>}
                      {p.brand && <div className="text-xs text-slate-400">{p.brand}</div>}
                    </td>
                    {showPrices && (
                      <td className="whitespace-nowrap px-3 py-2 text-right text-slate-500">
                        <span className={pct > 0 && p.list_price != null ? "line-through" : ""}>{formatEur(p.list_price)}</span>
                      </td>
                    )}
                    {showPrices && (
                      <td className="whitespace-nowrap px-3 py-2 text-right">
                        <div className="font-bold text-brand-700">{formatEur(yours)}</div>
                        {pct > 0 && p.list_price != null && <div className="text-xs font-semibold text-green-700">−{formatPercent(pct)}</div>}
                      </td>
                    )}
                    {showPrices && (
                      <td className="px-3 py-2"><AddToCart sku={p.sku} /></td>
                    )}
                  </tr>
                )
              })}
              {products.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-10 text-center text-slate-500">Keine Artikel gefunden.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {showPrices && <p className="text-xs text-slate-500">Alle Preise netto zzgl. MwSt.</p>}

        {pages > 1 && (
          <nav className="flex items-center justify-center gap-2 text-sm">
            {page > 1 && <Link className="btn-secondary" href={link({ seite: String(page - 1) })}>← Zurück</Link>}
            <span className="px-2 text-slate-600">Seite {page} von {pages}</span>
            {page < pages && <Link className="btn-secondary" href={link({ seite: String(page + 1) })}>Weiter →</Link>}
          </nav>
        )}
      </section>
    </div>
  )
}

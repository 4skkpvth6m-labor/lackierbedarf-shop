import Link from "next/link"
import { db } from "@/lib/supabase/admin"
import { formatDate, formatPercent } from "@/lib/format"
import { STATUS_LABEL, type Profile, type CustomerStatus } from "@/lib/types"
import { setStatus } from "./actions"

const TABS: [CustomerStatus | "alle", string][] = [
  ["pending", "Warten auf Freigabe"],
  ["approved", "Freigegeben"],
  ["rejected", "Abgelehnt"],
  ["alle", "Alle"],
]

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const sp = await searchParams
  const status = (TABS.find(([k]) => k === sp.status)?.[0] ?? "pending") as CustomerStatus | "alle"
  let query = db().from("profiles").select("*, customer_category_discounts(count)").eq("is_admin", false).order("created_at", { ascending: false }).limit(500)
  if (status !== "alle") query = query.eq("status", status)
  const term = (sp.q ?? "").replace(/[,()%*\\]/g, " ").trim()
  if (term) query = query.or(["company", "contact_name", "email", "city", "customer_no"].map((c) => `${c}.ilike.%${term}%`).join(","))
  const { data } = await query
  const customers = (data ?? []) as (Profile & { customer_category_discounts: { count: number }[] })[]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold">Kunden & Rabatte</h1>
        <form className="flex gap-2">
          <input type="hidden" name="status" value={status} />
          <input name="q" defaultValue={sp.q} placeholder="Firma, Name, E-Mail, Ort…" className="input w-64" />
          <button className="btn">Suchen</button>
        </form>
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        {TABS.map(([k, label]) => (
          <Link key={k} href={`/admin/kunden?status=${k}`} className={`rounded-full border px-3 py-1 ${status === k ? "border-brand-500 bg-brand-50 font-semibold text-brand-700" : "border-slate-300 bg-white"}`}>{label}</Link>
        ))}
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="table-head">
            <tr>
              <th className="px-3 py-2">Firma</th>
              <th className="px-3 py-2">Kontakt</th>
              <th className="px-3 py-2">Angemeldet</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Rabatt</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.map((c) => {
              const extra = c.customer_category_discounts?.[0]?.count ?? 0
              return (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2">
                    <Link href={`/admin/kunden/${c.id}`} className="font-semibold text-brand-700 hover:underline">{c.company || "(ohne Firma)"}</Link>
                    <div className="text-xs text-slate-500">{c.zip} {c.city}{c.customer_no && ` · Kd.-Nr. ${c.customer_no}`}</div>
                  </td>
                  <td className="px-3 py-2">{c.contact_name}<div className="text-xs text-slate-500">{c.email}</div></td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-600">{formatDate(c.created_at)}</td>
                  <td className="px-3 py-2">{STATUS_LABEL[c.status]}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {formatPercent(c.discount_all)} auf alles
                    {extra > 0 && <div className="text-xs text-slate-500">+ {extra} Kategorie{extra > 1 ? "n" : ""} abweichend</div>}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    {c.status !== "approved" && (
                      <form action={setStatus.bind(null, c.id, "approved")} className="inline">
                        <button className="btn !px-3 !py-1">Freigeben</button>
                      </form>
                    )}{" "}
                    <Link href={`/admin/kunden/${c.id}`} className="btn-secondary !px-3 !py-1">Rabatte</Link>
                  </td>
                </tr>
              )
            })}
            {customers.length === 0 && <tr><td colSpan={6} className="px-3 py-10 text-center text-slate-500">Keine Kunden in dieser Ansicht.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

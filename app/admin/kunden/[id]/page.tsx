import Link from "next/link"
import { notFound } from "next/navigation"
import { db } from "@/lib/supabase/admin"
import { getCategories } from "@/lib/catalog"
import { formatDate, formatEur } from "@/lib/format"
import { STATUS_LABEL, ORDER_STATUS_LABEL, type Profile, type OrderStatus } from "@/lib/types"
import { setStatus, saveDiscounts, saveCustomerData } from "../actions"
import DiscountEditor from "./DiscountEditor"
import SubmitButton from "@/components/SubmitButton"

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [{ data: profile }, { data: overrides }, { data: orders }, categories] = await Promise.all([
    db().from("profiles").select("*").eq("id", id).maybeSingle(),
    db().from("customer_category_discounts").select("category_id, percent").eq("customer_id", id),
    db().from("orders").select("id, status, created_at, total_net").eq("customer_id", id).order("created_at", { ascending: false }).limit(20),
    getCategories(),
  ])
  if (!profile) notFound()
  const p = profile as Profile
  const field = (name: keyof Profile, label: string) => (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <input id={name} name={name} defaultValue={String(p[name] ?? "")} className="input" />
    </div>
  )

  return (
    <div className="space-y-6">
      <Link href="/admin/kunden" className="text-sm text-slate-500 hover:underline">← Alle Kunden</Link>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{p.company || p.email}</h1>
          <p className="text-sm text-slate-600">{p.contact_name} · {p.email} · angemeldet {formatDate(p.created_at)}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${p.status === "approved" ? "bg-green-100 text-green-800" : p.status === "pending" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>
            {STATUS_LABEL[p.status]}
          </span>
          {p.status !== "approved" && (
            <form action={setStatus.bind(null, p.id, "approved")}><SubmitButton>Freigeben</SubmitButton></form>
          )}
          {p.status !== "rejected" && (
            <form action={setStatus.bind(null, p.id, "rejected")}><SubmitButton className="btn-secondary">{p.status === "approved" ? "Sperren" : "Ablehnen"}</SubmitButton></form>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        <section className="card p-6">
          <h2 className="mb-4 text-lg font-bold">Rabatte</h2>
          <DiscountEditor
            categories={categories}
            discountAll={Number(p.discount_all)}
            overrides={Object.fromEntries((overrides ?? []).map((o) => [o.category_id, Number(o.percent)]))}
            action={saveDiscounts.bind(null, p.id)}
          />
        </section>

        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="mb-4 text-lg font-bold">Kundendaten</h2>
            <form action={saveCustomerData.bind(null, p.id)} className="space-y-3">
              {field("customer_no", "Kundennummer")}
              {field("company", "Firma")}
              {field("contact_name", "Ansprechpartner")}
              {field("street", "Straße")}
              <div className="grid grid-cols-[6rem_1fr] gap-2">{field("zip", "PLZ")}{field("city", "Ort")}</div>
              {field("phone", "Telefon")}
              {field("vat_id", "USt-IdNr.")}
              <div>
                <label className="label" htmlFor="admin_note">Interne Notiz</label>
                <textarea id="admin_note" name="admin_note" defaultValue={p.admin_note} rows={3} className="input" />
              </div>
              <SubmitButton className="btn-secondary">Speichern</SubmitButton>
            </form>
          </section>

          <section className="card p-6">
            <h2 className="mb-3 text-lg font-bold">Letzte Bestellungen</h2>
            {(orders ?? []).length === 0 && <p className="text-sm text-slate-500">Noch keine Bestellungen.</p>}
            <ul className="divide-y divide-slate-100 text-sm">
              {(orders ?? []).map((o) => (
                <li key={o.id} className="flex justify-between py-2">
                  <Link href={`/admin/bestellungen/${o.id}`} className="text-brand-700 hover:underline">#{o.id} · {formatDate(o.created_at)}</Link>
                  <span>{ORDER_STATUS_LABEL[o.status as OrderStatus]} · {formatEur(Number(o.total_net))}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}

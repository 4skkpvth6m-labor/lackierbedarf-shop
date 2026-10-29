import Link from "next/link"
import { notFound } from "next/navigation"
import { db } from "@/lib/supabase/admin"
import { formatDate, formatEur } from "@/lib/format"
import { ORDER_STATUS_LABEL, type OrderStatus, type Profile } from "@/lib/types"
import OrderItems, { type OrderItem } from "@/components/OrderItems"
import SubmitButton from "@/components/SubmitButton"
import { setOrderStatus } from "../actions"

export default async function AdminOrder({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data } = await db().from("orders").select("*, order_items(*), profiles(*)").eq("id", Number(id)).maybeSingle()
  if (!data) notFound()
  const order = data as { id: number; status: OrderStatus; created_at: string; total_net: number; note: string; order_items: OrderItem[]; profiles: Profile }
  const c = order.profiles
  return (
    <div className="space-y-6">
      <Link href="/admin/bestellungen" className="text-sm text-slate-500 hover:underline">← Alle Bestellungen</Link>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Bestellung #{order.id}</h1>
          <p className="text-sm text-slate-600">{formatDate(order.created_at)}</p>
        </div>
        <form action={setOrderStatus.bind(null, order.id)} className="flex items-center gap-2">
          <select name="status" defaultValue={order.status} className="input w-48">
            {Object.entries(ORDER_STATUS_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <SubmitButton>Status speichern</SubmitButton>
        </form>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="card overflow-x-auto">
          <OrderItems items={order.order_items} />
          <div className="flex justify-end border-t border-slate-100 px-3 py-3 text-lg font-bold">Summe netto: {formatEur(Number(order.total_net))}</div>
          {order.note && <p className="border-t border-slate-100 px-3 py-3 text-sm">Anmerkung: {order.note}</p>}
        </div>
        <div className="card space-y-1 p-5 text-sm">
          <h2 className="mb-2 font-bold">Kunde</h2>
          <Link href={`/admin/kunden/${c.id}`} className="font-semibold text-brand-700 hover:underline">{c.company}</Link>
          {c.customer_no && <div>Kd.-Nr. {c.customer_no}</div>}
          <div>{c.contact_name}</div>
          <div>{c.street}</div>
          <div>{c.zip} {c.city}</div>
          <div>{c.phone}</div>
          <div>{c.email}</div>
          {c.vat_id && <div>USt-IdNr. {c.vat_id}</div>}
        </div>
      </div>
    </div>
  )
}

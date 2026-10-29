import { requireUser } from "@/lib/auth"
import { db } from "@/lib/supabase/admin"
import { formatDate, formatEur } from "@/lib/format"
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/types"
import OrderItems, { type OrderItem } from "@/components/OrderItems"

export default async function OrdersPage() {
  const profile = await requireUser()
  const { data } = await db()
    .from("orders")
    .select("*, order_items(*)")
    .eq("customer_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(100)
  const orders = (data ?? []) as { id: number; status: OrderStatus; created_at: string; total_net: number; note: string; order_items: OrderItem[] }[]
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Meine Bestellungen</h1>
      {orders.length === 0 && <p className="card p-6 text-slate-600">Noch keine Bestellungen.</p>}
      {orders.map((o) => (
        <details key={o.id} className="card overflow-hidden">
          <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 px-5 py-4">
            <span className="font-semibold">Bestellung #{o.id}</span>
            <span className="text-sm text-slate-500">{formatDate(o.created_at)}</span>
            <span className="rounded-full bg-slate-100 px-3 py-0.5 text-sm">{ORDER_STATUS_LABEL[o.status]}</span>
            <span className="font-semibold">{formatEur(Number(o.total_net))}</span>
          </summary>
          <div className="overflow-x-auto border-t border-slate-100">
            <OrderItems items={o.order_items} />
            {o.note && <p className="px-5 py-3 text-sm text-slate-600">Anmerkung: {o.note}</p>}
          </div>
        </details>
      ))}
    </div>
  )
}

import Link from "next/link"
import { db } from "@/lib/supabase/admin"
import { formatDate, formatEur } from "@/lib/format"
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/types"

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams
  let query = db().from("orders").select("id, status, created_at, total_net, profiles(company, city)").order("created_at", { ascending: false }).limit(200)
  if (sp.status && sp.status in ORDER_STATUS_LABEL) query = query.eq("status", sp.status)
  const { data } = await query
  const orders = (data ?? []) as unknown as { id: number; status: OrderStatus; created_at: string; total_net: number; profiles: { company: string; city: string } | null }[]
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Bestellungen</h1>
      <div className="flex flex-wrap gap-2 text-sm">
        <Link href="/admin/bestellungen" className={`rounded-full border px-3 py-1 ${!sp.status ? "border-brand-500 bg-brand-50 font-semibold text-brand-700" : "border-slate-300 bg-white"}`}>Alle</Link>
        {Object.entries(ORDER_STATUS_LABEL).map(([k, label]) => (
          <Link key={k} href={`/admin/bestellungen?status=${k}`} className={`rounded-full border px-3 py-1 ${sp.status === k ? "border-brand-500 bg-brand-50 font-semibold text-brand-700" : "border-slate-300 bg-white"}`}>{label}</Link>
        ))}
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="table-head">
            <tr><th className="px-3 py-2">Nr.</th><th className="px-3 py-2">Kunde</th><th className="px-3 py-2">Datum</th><th className="px-3 py-2">Status</th><th className="px-3 py-2 text-right">Summe netto</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50">
                <td className="px-3 py-2"><Link href={`/admin/bestellungen/${o.id}`} className="font-semibold text-brand-700 hover:underline">#{o.id}</Link></td>
                <td className="px-3 py-2">{o.profiles?.company}<div className="text-xs text-slate-500">{o.profiles?.city}</div></td>
                <td className="px-3 py-2">{formatDate(o.created_at)}</td>
                <td className="px-3 py-2">{ORDER_STATUS_LABEL[o.status]}</td>
                <td className="px-3 py-2 text-right font-semibold">{formatEur(Number(o.total_net))}</td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={5} className="px-3 py-10 text-center text-slate-500">Keine Bestellungen.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
